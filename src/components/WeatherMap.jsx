import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import './WeatherMap.css'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useLocation } from '../contexts/LocationContext'
import { useWeather } from '../contexts/WeatherContext'
import { NWS_RADAR, getAllActiveAlerts } from '../services/weatherData'
import { findSiteRadarProduct, buildFallbackSiteLayerName, buildSiteWmsUrl, NATIONAL_RADAR_PRODUCTS, SITE_RADAR_PRODUCTS } from '../services/radarProducts'
import { WeatherDeskIcon } from './WeatherIcons'
import AlertDetailsDialog from './AlertDetailsDialog'
import { alertIcon, formatAlertShort, severityColor } from '../utils/alertPresentation'
import { PAST_FRAMES, TOTAL_FRAMES, PAST_STEP_MINUTES, FUTURE_STEP_MINUTES, frameTimes, buildNowcast, readView, wmsTime } from '../services/radarNowcast'

const EMPTY_ALERTS = []
const SEVERITY_RANK = { Extreme: 0, Severe: 1, Moderate: 2, Minor: 3 }

// Radar loop: official WMS frames for the past 30 minutes, then short-range
// extrapolated frames for the next hour (see services/radarNowcast.js).
const FRAME_STEP_MS = PAST_STEP_MINUTES * 60 * 1000

// Stable identity for an alert across the feed, the layer and the details card.
function alertKey(feature) {
  return feature?.id || feature?.properties?.id || `${feature?.properties?.event || ''}|${feature?.properties?.areaDesc || ''}`
}

// Computes bounds straight from GeoJSON coordinates — L.geoJSON(...).getBounds()
// is unreliable for layers that were never added to a map.
function featureBounds(feature) {
  const points = []
  const walk = coords => {
    if (!Array.isArray(coords)) return
    if (typeof coords[0] === 'number') { points.push(coords); return }
    coords.forEach(walk)
  }
  walk(feature?.geometry?.coordinates)
  if (!points.length) return null
  return L.latLngBounds(points.map(([lon, lat]) => [lat, lon]))
}
const safeHtml = value => String(value || 'Not provided').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]))

const BASEMAPS = {
  street: {
    label: 'Street',
    create: () => L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors', maxZoom: 19 })
  },
  terrain: {
    label: 'Terrain',
    create: () => L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap &copy; OpenTopoMap', maxZoom: 17 })
  }
}

const capabilitiesCache = new Map()

async function getSiteCapabilities(site) {
  const normalized = String(site || '').trim().toLowerCase()
  if (!/^[a-z0-9]{4}$/.test(normalized)) throw new Error('Enter a valid four-character radar site ID, such as KCCX.')
  if (capabilitiesCache.has(normalized)) return capabilitiesCache.get(normalized)

  const pending = (async () => {
    const url = `${buildSiteWmsUrl(normalized)}?service=WMS&request=GetCapabilities&version=1.3.0`
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 12000)
    try {
      const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/xml,text/xml,*/*' }, cache: 'no-cache' })
      if (!response.ok) throw new Error(`NWS radar catalog returned HTTP ${response.status}.`)
      const xmlText = await response.text()
      const xml = new DOMParser().parseFromString(xmlText, 'text/xml')
      if (xml.querySelector('parsererror') || !xml.getElementsByTagName('Layer').length) {
        throw new Error('NWS radar catalog response was not valid WMS capabilities XML.')
      }
      const layers = Array.from(xml.getElementsByTagName('Layer')).map(node => {
        const directChildren = Array.from(node.children || [])
        const nameNode = directChildren.find(child => child.localName === 'Name')
        const titleNode = directChildren.find(child => child.localName === 'Title')
        return { name: nameNode?.textContent?.trim() || '', title: titleNode?.textContent?.trim() || '' }
      }).filter(item => item.name)
      if (!layers.length) throw new Error('No radar products were advertised for this site.')
      return layers
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('NWS radar catalog request timed out. Try again or use the official radar viewer.')
      throw error
    } finally {
      window.clearTimeout(timeout)
    }
  })()

  capabilitiesCache.set(normalized, pending)
  try {
    const layers = await pending
    capabilitiesCache.set(normalized, layers)
    return layers
  } catch (error) {
    capabilitiesCache.delete(normalized)
    throw error
  }
}


// The WMS catalog publishes the newest available scan time. The radar loop is
// anchored to it so frame labels match the imagery instead of the wall clock
// (conus_bref_qcd, for example, lags real time by several minutes).
async function getLatestScanTime(definition) {
  try {
    const response = await fetch(`${definition.url}?service=WMS&request=GetCapabilities&version=1.3.0`)
    if (!response.ok) return null
    const xml = new DOMParser().parseFromString(await response.text(), 'text/xml')
    if (xml.querySelector('parsererror')) return null
    const layer = Array.from(xml.getElementsByTagName('Layer'))
      .find(node => Array.from(node.children || []).some(child => child.localName === 'Name' && child.textContent.trim() === definition.layerName))
    const dimension = layer && Array.from(layer.children).find(child => child.localName === 'Dimension' && child.getAttribute('name') === 'time')
    const value = dimension?.getAttribute('default') || dimension?.textContent?.split(',')[0]?.trim() || ''
    const parsed = Date.parse(value)
    return Number.isFinite(parsed) ? parsed : null
  } catch {
    return null
  }
}

function makeWmsLayer(definition, opacity) {
  return L.tileLayer.wms(definition.url, {
    layers: definition.layerName,
    styles: definition.style || '',
    format: 'image/png',
    transparent: true,
    opacity: opacity / 100,
    version: '1.1.1',
    srs: 'EPSG:3857',
    tiled: true,
    attribution: definition.source || 'Radar imagery: National Weather Service / NOAA',
    keepBuffer: 2,
    updateWhenIdle: true
  })
}

export default function WeatherMap() {
  const mapNode = useRef(null)
  const mapRef = useRef(null)
  const layersRef = useRef({})
  const tileFailuresRef = useRef(0)
  const { location, coordinates } = useLocation()
  const { weather, refresh } = useWeather()
  const [productId, setProductId] = useState('bref')
  const [base, setBase] = useState('street')
  const baseTouched = useRef(false)
  const [status, setStatus] = useState('Preparing official NWS radar products…')
  const [opacity, setOpacity] = useState(82)
  const [showAlerts, setShowAlerts] = useState(true)
  const [mapError, setMapError] = useState('')
  const [siteInput, setSiteInput] = useState('')
  const [siteOverride, setSiteOverride] = useState('')
  const [siteCatalog, setSiteCatalog] = useState({ state: 'idle', site: '', layers: [], error: '' })
  const [nationalAlerts, setNationalAlerts] = useState([])
  const [alertsInView, setAlertsInView] = useState(null)
  const [alertScanKey, setAlertScanKey] = useState(0)
  const [lastRadarRefresh, setLastRadarRefresh] = useState(null)
  const [refreshingRadar, setRefreshingRadar] = useState(false)
  const [mobileSheet, setMobileSheet] = useState(null)
  const [showOfficialRadar, setShowOfficialRadar] = useState(false)
  const [customAnimationOpen, setCustomAnimationOpen] = useState(false)
  const [animationAnchor, setAnimationAnchor] = useState(0)
  const [frameIndex, setFrameIndex] = useState(PAST_FRAMES - 1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [selectedAlert, setSelectedAlert] = useState(null)
  const [nowcast, setNowcast] = useState({ state: 'idle', frames: [], bounds: null, speedMph: null, compass: null, baselineMinutes: null, trend: 'unknown', trendPercent: 0, still: false, uncertain: false, error: '' })
  const selectAlertRef = useRef(null)
  const alerts = weather?.alerts ?? EMPTY_ALERTS
  // Polygons come from the nationwide active-alert feed so every warning, watch,
  // and advisory with geometry renders — not only alerts covering this point.
  const polygonAlerts = nationalAlerts.length ? nationalAlerts : alerts
  const apiRadarStation = String(weather?.point?.radarStation || '').trim().toUpperCase()
  const radarStation = siteOverride || apiRadarStation
  const isNationalProduct = Boolean(NATIONAL_RADAR_PRODUCTS[productId])
  const siteProductDefinition = SITE_RADAR_PRODUCTS[productId]
  const activeDefinition = isNationalProduct ? NATIONAL_RADAR_PRODUCTS[productId] : null
  const selectedDescription = activeDefinition?.description || siteProductDefinition?.explanation || 'Select an available radar product.'
  const availableSiteProducts = useMemo(() => {
    if (!radarStation || siteCatalog.site !== radarStation) return []
    if (siteCatalog.state === 'error') return Object.keys(SITE_RADAR_PRODUCTS)
    if (siteCatalog.state !== 'ready') return []
    return Object.entries(SITE_RADAR_PRODUCTS).filter(([, definition]) => findSiteRadarProduct(siteCatalog.layers, definition)).map(([id]) => id)
  }, [radarStation, siteCatalog])

  // Warnings are nationwide; list the most severe ones so the panel never reads
  // "no alerts" while polygons are on the map.
  const sortedPolygonAlerts = useMemo(() => polygonAlerts
    .slice()
    .sort((a, b) => (SEVERITY_RANK[a.properties?.severity] ?? 4) - (SEVERITY_RANK[b.properties?.severity] ?? 4))
    .slice(0, 12), [polygonAlerts])

  useEffect(() => {
    if (!mapNode.current || mapRef.current) return undefined
    const centerLat = Number.isFinite(Number(coordinates?.lat)) ? Number(coordinates.lat) : 38.9072
    const centerLon = Number.isFinite(Number(coordinates?.lon)) ? Number(coordinates.lon) : -77.0369
    const map = L.map(mapNode.current, { zoomControl: false, preferCanvas: true, minZoom: 3, maxZoom: 12, worldCopyJump: true }).setView([centerLat, centerLon], 7)
    mapRef.current = map
    L.control.zoom({ position: 'topright' }).addTo(map)

    const bases = Object.fromEntries(Object.entries(BASEMAPS).map(([key, config]) => [key, config.create()]))
    Object.values(bases).forEach(item => item.on('tileerror', () => {
      setMapError(previous => previous || 'A background map tile failed to load. Try another background; radar products are a separate service.')
    }))
    layersRef.current.bases = bases
    bases.street.addTo(map)

    const alertsLayer = L.geoJSON([], {
      style: feature => ({
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillColor: severityColor(feature.properties?.severity),
        fillOpacity: 0.5,
        className: 'wf-alert-polygon'
      }),
      pointToLayer: (feature, latlng) => {
        return L.circleMarker(latlng, {
          radius: 12,
          fillColor: severityColor(feature.properties?.severity),
          color: '#fff',
          weight: 3,
          opacity: 1,
          fillOpacity: 0.9,
          className: 'wf-alert-marker'
        })
      },
      onEachFeature: (feature, item) => {
        const p = feature.properties || {}
        // Hover gives a quick summary; clicking opens the full alert details.
        item.bindTooltip(
          `<strong>${safeHtml(p.event || 'NWS alert')}</strong><br>${safeHtml(p.areaDesc)}<br><em>Click for details</em>`,
          { sticky: true, direction: 'top', opacity: 1, className: 'wf-alert-tip' }
        )
        item.on('click', () => selectAlertRef.current?.(feature))
        if (!layersRef.current.alertLayers) layersRef.current.alertLayers = new Map()
        layersRef.current.alertLayers.set(alertKey(feature), item)
      }
    })
    layersRef.current.alerts = alertsLayer
    setStatus('Map initialized · requesting official NWS/NOAA radar imagery')
    const resize = () => map.invalidateSize()
    window.addEventListener('resize', resize)
    const timer = window.setTimeout(resize, 180)
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null
    if (observer && mapNode.current) observer.observe(mapNode.current)
    return () => {
      window.removeEventListener('resize', resize)
      window.clearTimeout(timer)
      observer?.disconnect()
      map.remove()
      mapRef.current = null
      layersRef.current = {}
    }
    // Create Leaflet once; location changes are handled by a dedicated effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const bases = layersRef.current.bases
    if (!map || !bases?.[base]) return
    Object.values(bases).forEach(item => { if (map.hasLayer(item)) map.removeLayer(item) })
    bases[base].addTo(map)
  }, [base])

  useEffect(() => {
    const controller = new AbortController()
    getAllActiveAlerts(controller.signal)
      .then(features => { if (!controller.signal.aborted) setNationalAlerts(features) })
      .catch(() => { /* Point alerts still render if the national feed fails. */ })
    return () => controller.abort()
  }, [alertScanKey])

  useEffect(() => {
    const map = mapRef.current
    const layerGroup = layersRef.current.alerts
    if (!map || !layerGroup) return
    const features = polygonAlerts.filter(feature => feature?.geometry)
    // Alerts that only name forecast zones get a marker when NWS supplies a
    // representative point. Leaflet drops features without geometry, so the
    // point has to be promoted into geometry before addData().
    const pointFeatures = polygonAlerts
      .filter(feature => !feature.geometry && Array.isArray(feature.properties?.point?.coordinates))
      .map(feature => ({ ...feature, geometry: feature.properties.point }))

    layerGroup.clearLayers()
    layersRef.current.alertLayers = new Map()
    if (features.length || pointFeatures.length) {
      layerGroup.addData({ type: 'FeatureCollection', features: [...features, ...pointFeatures] })
    }
    if (showAlerts) layerGroup.addTo(map).bringToFront()
    else if (map.hasLayer(layerGroup)) map.removeLayer(layerGroup)

    if (!features.length && !pointFeatures.length && polygonAlerts.length) {
      setStatus('NWS alerts were returned, but none included usable map geometry or a representative point.')
    }
  }, [polygonAlerts, showAlerts])

  // Nationwide polygons can be active while none are inside the current view,
  // which reads as "the layer is broken". Count what is actually visible.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return undefined
    const updateVisibleAlerts = () => {
      const group = layersRef.current.alerts
      if (!group || !showAlerts) { setAlertsInView(null); return }
      const bounds = map.getBounds()
      setAlertsInView(group.getLayers().filter(layer => (
        typeof layer.getBounds === 'function' && layer.getBounds().isValid() && layer.getBounds().intersects(bounds)
      )).length)
    }
    updateVisibleAlerts()
    map.on('moveend zoomend', updateVisibleAlerts)
    return () => map.off('moveend zoomend', updateVisibleAlerts)
  }, [polygonAlerts, showAlerts])

  useEffect(() => {
    if (!radarStation) {
      setSiteCatalog({ state: 'idle', site: '', layers: [], error: '' })
      return
    }
    let cancelled = false
    setSiteCatalog({ state: 'loading', site: radarStation, layers: [], error: '' })
    getSiteCapabilities(radarStation).then(layers => {
      if (cancelled) return
      setSiteCatalog({ state: 'ready', site: radarStation, layers, error: '' })
    }).catch(error => {
      if (cancelled) return
      setSiteCatalog({ state: 'error', site: radarStation, layers: [], error: error.message || 'Could not read the NWS radar product catalog.' })
    })
    return () => { cancelled = true }
  }, [radarStation])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return undefined
    const isSiteProduct = Boolean(SITE_RADAR_PRODUCTS[productId])
    if (isSiteProduct && !radarStation) {
      setMapError('A local NEXRAD site is not selected. Enter a four-character site ID, or stay with a national mosaic.');
      setStatus('Local radar product unavailable · national products remain available');
      setProductId('bref')
      return undefined
    }
    if (isSiteProduct && (siteCatalog.site !== radarStation || siteCatalog.state === 'idle' || siteCatalog.state === 'loading')) {
      setStatus(`Looking up official ${radarStation} radar products…`)
      return undefined
    }

    let definition = NATIONAL_RADAR_PRODUCTS[productId]
    if (isSiteProduct) {
      const match = siteCatalog.state === 'ready' ? findSiteRadarProduct(siteCatalog.layers, SITE_RADAR_PRODUCTS[productId]) : null
      // If GetCapabilities is blocked by browser CORS, attempt the documented OpenGeo product naming convention.
      // Tile errors below are surfaced to the user; the app never silently relabels another product as velocity.
      if (!match && siteCatalog.state === 'ready') {
        setMapError(`${SITE_RADAR_PRODUCTS[productId].title} is not advertised by the ${radarStation} NWS radar service.`)
        setStatus('That local product is not available at this radar site; showing national base reflectivity instead.')
        setProductId('bref')
        return undefined
      }
      const fallbackName = buildFallbackSiteLayerName(radarStation, SITE_RADAR_PRODUCTS[productId])
      definition = {
        ...SITE_RADAR_PRODUCTS[productId],
        url: buildSiteWmsUrl(radarStation),
        layerName: match?.name || fallbackName,
        style: '',
        source: `NWS / NOAA OpenGeo · ${radarStation} · ${match?.title || fallbackName}${match ? '' : ' (capabilities fallback)'}`
      }
      if (!match && siteCatalog.state === 'error') {
        setMapError('Could not read the radar catalog, so Weather Forecaster is trying the official site/product name directly. If tiles fail, verify the product in the official NWS radar viewer.')
      }
    }
    if (!definition) return undefined

    let cancelled = false
    const previous = layersRef.current.activeProduct
    if (previous && map.hasLayer(previous)) map.removeLayer(previous)
    tileFailuresRef.current = 0
    setStatus(`Loading ${definition.title} from official NWS/NOAA GIS…`)
    const radarLayer = makeWmsLayer(definition, opacity)
    radarLayer.on('tileload', () => {
      if (cancelled) return
      setStatus(`${definition.title} · NWS/NOAA imagery loaded`)
      setMapError('')
    })
    radarLayer.on('tileerror', () => {
      if (cancelled) return
      tileFailuresRef.current += 1
      if (tileFailuresRef.current >= 2) {
        setMapError(`${definition.title} tiles are failing. The NWS service may be temporarily unavailable or this product may have no coverage at the current view. No API key is required for these NWS layers.`)
        setStatus('Radar layer did not load · try Refresh scan or open the official NWS radar viewer.')
      }
    })
    radarLayer.addTo(map)
    layersRef.current.activeProduct = radarLayer
    if (showAlerts && layersRef.current.alerts) layersRef.current.alerts.bringToFront()
    return () => {
      cancelled = true
      if (map.hasLayer(radarLayer)) map.removeLayer(radarLayer)
      if (layersRef.current.activeProduct === radarLayer) layersRef.current.activeProduct = null
    }
    // Opacity is applied by its own effect; refresh time only labels the request and redraws tiles.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, radarStation, siteCatalog])

  // Extrapolated frames are painted on an image overlay, so the live WMS layer
  // steps aside rather than showing through underneath.
  const showingPastFrame = !customAnimationOpen || frameIndex < PAST_FRAMES
  useEffect(() => {
    layersRef.current.activeProduct?.setOpacity(showingPastFrame ? opacity / 100 : 0)
  }, [opacity, showingPastFrame, productId])

  const coordinateLat = coordinates?.lat
  const coordinateLon = coordinates?.lon
  useEffect(() => {
    const map = mapRef.current
    if (!map || !Number.isFinite(Number(coordinateLat)) || !Number.isFinite(Number(coordinateLon))) return
    map.flyTo([Number(coordinateLat), Number(coordinateLon)], Math.max(map.getZoom(), 7), { duration: 0.7 })
  }, [coordinateLat, coordinateLon])

  const chooseProduct = next => {
    setMapError('')
    setProductId(next)
    const national = NATIONAL_RADAR_PRODUCTS[next]
    const site = SITE_RADAR_PRODUCTS[next]
    setStatus(national ? `Requesting ${national.title}…` : `Requesting ${site?.title || 'radar product'}…`)
  }

  // Timeline: the last 30 minutes of real scans, then the extrapolated hour.
  const animationFrames = useMemo(() => frameTimes(animationAnchor), [animationAnchor])
  const activeFrameTime = animationFrames[frameIndex]
  const isForecastFrame = frameIndex >= PAST_FRAMES
  const clockLabel = ms => (Number.isFinite(ms) ? new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—')
  // Forecast frames only exist once the nowcast has been built.
  const maxFrame = nowcast.state === 'ready' ? TOTAL_FRAMES - 1 : PAST_FRAMES - 1
  const forecastMinutes = isForecastFrame && Number.isFinite(activeFrameTime) ? Math.round((activeFrameTime - animationAnchor) / 60000) : 0

  // Past frames are genuine NWS requests through the WMS time dimension.
  useEffect(() => {
    const layer = layersRef.current.activeProduct
    if (!layer?.wmsParams) return
    const pastTime = customAnimationOpen && !isForecastFrame ? activeFrameTime : null
    if (Number.isFinite(pastTime)) {
      const iso = wmsTime(pastTime)
      if (layer.wmsParams.time !== iso) layer.setParams({ time: iso })
    } else if ('time' in layer.wmsParams) {
      delete layer.wmsParams.time
      layer.redraw()
    }
  }, [customAnimationOpen, activeFrameTime, isForecastFrame, productId])

  // Future frames: storm motion measured between the two newest official scans
  // is applied to the newest frame. Rebuilt whenever the view changes.
  useEffect(() => {
    if (!customAnimationOpen) {
      setNowcast(previous => (previous.state === 'idle' ? previous : { state: 'idle', frames: [], bounds: null, speedMph: null, compass: null, baselineMinutes: null, trend: 'unknown', trendPercent: 0, still: false, uncertain: false, error: '' }))
      return undefined
    }
    const definition = NATIONAL_RADAR_PRODUCTS[productId]
    const map = mapRef.current
    if (!definition || !map) {
      setNowcast({ state: 'unavailable', frames: [], bounds: null, speedMph: null, compass: null, still: false, error: 'Future radar is available for national NWS mosaics. Choose a national product to enable it.' })
      return undefined
    }
    let cancelled = false
    let timer = null
    const run = () => {
      const view = readView(map)
      if (!view) {
        setNowcast({ state: 'unavailable', frames: [], bounds: null, speedMph: null, compass: null, still: false, error: 'This map view is too wide to extrapolate.' })
        return
      }
      const bounds = map.getBounds()
      setNowcast(previous => ({ ...previous, state: 'loading' }))
      buildNowcast({ definition, view, anchorMs: animationAnchor })
        .then(result => {
          if (cancelled) return
          setNowcast({ state: 'ready', bounds, speedMph: result.speedMph, compass: result.compass, baselineMinutes: result.motionBaselineMinutes, trend: result.trend, trendPercent: result.trendPercent, still: result.still, uncertain: result.uncertain, frames: result.frames, error: '' })
        })
        .catch(error => {
          if (cancelled) return
          setNowcast({ state: 'unavailable', frames: [], bounds: null, speedMph: null, compass: null, still: false, error: error?.message || 'The extrapolated frames could not be built.' })
        })
    }
    run()
    const onMoveEnd = () => {
      if (timer) window.clearTimeout(timer)
      timer = window.setTimeout(run, 800)
    }
    map.on('moveend zoomend', onMoveEnd)
    return () => {
      cancelled = true
      if (timer) window.clearTimeout(timer)
      map.off('moveend zoomend', onMoveEnd)
    }
  }, [customAnimationOpen, productId, animationAnchor])

  // Keep the slider inside the frames that actually exist.
  useEffect(() => {
    setFrameIndex(index => Math.min(index, maxFrame))
  }, [maxFrame])

  // Paint the selected extrapolated frame over the map.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const existing = layersRef.current.nowcastOverlay
    if (!customAnimationOpen || !isForecastFrame) {
      if (existing) {
        map.removeLayer(existing)
        layersRef.current.nowcastOverlay = null
      }
      return
    }
    const frame = nowcast.frames[frameIndex - PAST_FRAMES]
    if (!frame || !nowcast.bounds) return
    if (existing) {
      existing.setBounds(nowcast.bounds)
      existing.setUrl(frame.url)
      existing.setOpacity(opacity / 100)
    } else {
      layersRef.current.nowcastOverlay = L.imageOverlay(frame.url, nowcast.bounds, { opacity: opacity / 100, interactive: false, className: 'wf-nowcast-overlay' }).addTo(map)
    }
  }, [customAnimationOpen, isForecastFrame, frameIndex, nowcast.frames, nowcast.bounds, opacity])

  // Highlight whichever polygon matches the alert shown in the details card.
  useEffect(() => {
    const alertLayers = layersRef.current.alertLayers
    if (!alertLayers?.size) return
    const selectedKey = selectedAlert ? alertKey(selectedAlert) : null
    alertLayers.forEach((layer, key) => {
      const isSelected = key === selectedKey
      layer.setStyle({
        color: isSelected ? '#63f7ff' : '#ffffff',
        weight: isSelected ? 4 : 2,
        opacity: 1,
        fillOpacity: isSelected ? 0.62 : 0.45
      })
      if (isSelected && typeof layer.bringToFront === 'function') layer.bringToFront()
    })
  }, [selectedAlert, polygonAlerts])

  useEffect(() => {
    if (!isPlaying || !customAnimationOpen) return undefined
    const timer = window.setInterval(() => setFrameIndex(index => (index + 1) % (maxFrame + 1)), 700)
    return () => window.clearInterval(timer)
  }, [isPlaying, customAnimationOpen, maxFrame])

  const openAnimator = async () => {
    // Prefer the scan time the product actually publishes; fall back to the
    // nearest 5-minute boundary when the catalog cannot be read.
    const definition = NATIONAL_RADAR_PRODUCTS[productId]
    const published = definition ? await getLatestScanTime(definition) : null
    const anchor = published ?? Math.floor(Date.now() / FRAME_STEP_MS) * FRAME_STEP_MS
    setAnimationAnchor(Math.floor(anchor / FRAME_STEP_MS) * FRAME_STEP_MS)
    setFrameIndex(PAST_FRAMES - 1)
    setIsPlaying(false)
    setCustomAnimationOpen(true)
  }

  const closeAnimator = () => {
    setIsPlaying(false)
    setCustomAnimationOpen(false)
  }

  const refreshRadar = useCallback(async () => {
    setRefreshingRadar(true)
    setMapError('')
    try {
      await Promise.resolve(refresh?.())
      setAlertScanKey(value => value + 1)
      const activeProduct = layersRef.current.activeProduct
      activeProduct?.redraw()
      layersRef.current.bases?.[base]?.redraw?.()
      setLastRadarRefresh(new Date())
      setStatus('Refresh requested for the current NWS radar product and local weather data.')
    } catch {
      setMapError('The weather-data refresh failed. Try again or reload the page.')
    } finally {
      setRefreshingRadar(false)
    }
  }, [base, refresh])

  const locate = () => {
    if (!navigator.geolocation || !mapRef.current) { setStatus('Device location is not available in this browser.'); return }
    setStatus('Requesting device location permission…')
    navigator.geolocation.getCurrentPosition(({ coords: position }) => {
      mapRef.current?.flyTo([position.latitude, position.longitude], 9, { duration: 0.8 })
      setStatus('Map moved to device location. To update forecast data, use the location search in the header.')
    }, () => setStatus('Location permission was denied or unavailable. Pan the map manually.'), { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 })
  }

  const zoomAlerts = () => {
    const group = layersRef.current.alerts
    if (group?.getLayers().length && mapRef.current) {
      const bounds = group.getBounds()
      if (bounds.isValid()) mapRef.current.fitBounds(bounds, { padding: [24, 24], maxZoom: 9, animate: false })
    } else setStatus('No NWS alert geometry is loaded yet. Try Refresh scan, or confirm the alert feed is reachable.')
  }

  const selectAlert = feature => {
    setSelectedAlert(feature)
    const bounds = featureBounds(feature)
    if (bounds?.isValid() && mapRef.current) mapRef.current.fitBounds(bounds, { padding: [26, 26], maxZoom: 9, animate: false })
  }

  // The polygon click handler is bound once, inside the Leaflet setup effect.
  useEffect(() => { selectAlertRef.current = selectAlert })

  const resetView = () => {
    if (mapRef.current && Number.isFinite(Number(coordinateLat)) && Number.isFinite(Number(coordinateLon))) {
      mapRef.current.flyTo([Number(coordinateLat), Number(coordinateLon)], 7, { duration: 0.6 })
    } else mapRef.current?.setView([38.9072, -77.0369], 5)
  }

  const handleManualSite = event => {
    event.preventDefault()
    const candidate = (siteInput.trim() || radarStation).toUpperCase()
    if (!/^[A-Z0-9]{4}$/.test(candidate)) {
      setMapError('Radar site IDs must be four letters/numbers, for example KCCX.');
      return
    }
    setSiteOverride(candidate)
    setProductId('velocity')
    setStatus(`Looking up the official ${candidate} product catalog…`)
  }

  const activeProductLabel = NATIONAL_RADAR_PRODUCTS[productId]?.title || SITE_RADAR_PRODUCTS[productId]?.title || 'Unknown product'
  const localProductsLoading = Boolean(radarStation) && siteCatalog.state === 'loading'

  return <div className="wf-map-shell">
    <div className="wf-toolbar">
      <div className="wf-brand"><span className="wf-live-dot"/>WEATHERDESK RADAR<small>NWS / NOAA PRODUCTS · NO RADAR API KEY</small></div>
      <label className="wf-product-select">RADAR PRODUCT
        <select aria-label="Radar product" value={productId} onChange={event => chooseProduct(event.target.value)}>
          <optgroup label="National NWS / NOAA mosaics">
            {Object.entries(NATIONAL_RADAR_PRODUCTS).map(([id, product]) => <option key={id} value={id}>{product.label}</option>)}
          </optgroup>
          <optgroup label={radarStation ? `Local radar · ${radarStation}` : 'Local radar · choose a site below'}>
            {Object.entries(SITE_RADAR_PRODUCTS).map(([id, product]) => {
              const ready = availableSiteProducts.includes(id)
              return <option key={id} value={id} disabled={!ready}>{product.label}{siteCatalog.state === 'loading' ? ' · checking…' : ready ? '' : ' · unavailable'}</option>
            })}
          </optgroup>
        </select>
      </label>
      <div className="wf-control-group wf-basemap-group" role="group" aria-label="Background map">
        {Object.entries(BASEMAPS).map(([key, item]) => <button key={key} className={base === key ? 'selected' : ''} onClick={() => { baseTouched.current = true; setBase(key) }}>{item.label}</button>)}
      </div>
      <label className="wf-opacity">Opacity <input aria-label="Radar overlay opacity" type="range" min="10" max="100" value={opacity} onChange={event => setOpacity(Number(event.target.value))}/><span>{opacity}%</span></label>
      <button className="wf-locate" onClick={refreshRadar} disabled={refreshingRadar}><WeatherDeskIcon name="refresh" size={15} /> {refreshingRadar ? 'Refreshing…' : 'Refresh scan'}</button>
      <button className="wf-locate" onClick={locate}><WeatherDeskIcon name="location" size={15} /> My location</button>
      <button className="wf-locate" onClick={resetView}><WeatherDeskIcon name="crosshair" size={15} /> Reset view</button>
      <a className="wf-official-link" href={NWS_RADAR} target="_blank" rel="noreferrer"><WeatherDeskIcon name="arrowUpRight" size={14} /> Official radar</a>
    </div>
    <div className="wf-radar-secondary-bar">
      <label className="wf-checkbox"><input type="checkbox" checked={showAlerts} onChange={event => setShowAlerts(event.target.checked)}/> Show NWS alert polygons ({polygonAlerts.filter(item => item.geometry).length} nationwide)</label>
      {showAlerts && alertsInView !== null && (
        <span className={`wf-alert-inview ${alertsInView === 0 ? 'is-empty' : ''}`}>
          {alertsInView === 0 ? 'none in this view · Zoom to alerts' : `${alertsInView} in this view`}
        </span>
      )}
      <button type="button" className="wf-secondary-action" onClick={zoomAlerts}>Zoom to alerts</button>
      <button type="button" className="wf-secondary-action" onClick={openAnimator}><WeatherDeskIcon name="play" size={14} /> Radar loop</button>
      <button type="button" className="wf-secondary-action" onClick={() => setShowOfficialRadar(true)}><WeatherDeskIcon name="arrowUpRight" size={14} /> Official NWS</button>
      <form className="wf-site-form" onSubmit={handleManualSite}><label htmlFor="wf-radar-site">Radar site ID</label><input id="wf-radar-site" value={siteInput} onChange={event => setSiteInput(event.target.value.toUpperCase().slice(0, 4))} placeholder={radarStation || 'e.g. KCCX'} maxLength={4} aria-label="Radar site ID"/><button type="submit">Load local products</button></form>
      <span className="wf-site-status">{localProductsLoading ? `Checking ${radarStation}…` : radarStation ? `Site ${radarStation}` : 'National mosaic mode'}{siteCatalog.state === 'error' ? ' · local catalog unavailable' : ''}</span>
      <Link to="/" className="wf-secondary-action wf-exit-map"><WeatherDeskIcon name="back" size={13} /> Done</Link>
    </div>
    <div className="wf-map-area">
      <div ref={mapNode} className="wf-leaflet-map" aria-label="Interactive NWS radar map"/>
      <aside className="wf-side-panel">
        <div className="wf-panel-heading">SITUATIONAL AWARENESS</div>
        <div className="wf-metric"><span>SELECTED LOCATION</span><strong>{location || 'Map location'}</strong><small>{coordinates ? `${Number(coordinates.lat).toFixed(3)}, ${Number(coordinates.lon).toFixed(3)}` : 'Coordinates unavailable'}</small></div>
        <div className="wf-metric"><span>ACTIVE NWS ALERTS</span><strong>{polygonAlerts.length}</strong><small>{alerts.length} cover the selected point · {polygonAlerts.filter(item => item.geometry).length} active nationwide with map geometry. Click a polygon or a row for details.</small></div>
        <div className="wf-metric"><span>RADAR PRODUCT</span><strong>{activeProductLabel}</strong><small>{selectedDescription}</small></div>
        <div className="wf-metric"><span>DATA SOURCE</span><strong>NWS / NOAA OpenGeo</strong><small>{NATIONAL_RADAR_PRODUCTS[productId]?.source || (radarStation ? `Radar site ${radarStation} · official WMS capabilities` : 'National products do not require a radar-site selection')}</small></div>
        <div className="wf-alert-list">
          <div className="wf-panel-heading">ACTIVE NWS WARNINGS</div>
          {sortedPolygonAlerts.map((feature, index) => {
            const properties = feature.properties || {}
            const isSelected = Boolean(selectedAlert) && alertKey(selectedAlert) === alertKey(feature)
            return (
              <button
                key={alertKey(feature) || index}
                type="button"
                onClick={() => selectAlert(feature)}
                className={`wf-alert-row ${isSelected ? 'is-selected' : ''}`}
                style={{ '--alert-color': severityColor(properties.severity) }}
              >
                <span className="wf-alert-row-icon" aria-hidden="true">
                  <WeatherDeskIcon name={alertIcon(properties.event)} size={16} />
                </span>
                <span className="wf-alert-row-body">
                  <span className="wf-alert-row-kicker">
                    <span className="wf-alert-row-sev">{properties.severity || 'Unknown'}</span>
                    <span className="wf-alert-row-time">{formatAlertShort(properties.ends || properties.expires)}</span>
                  </span>
                  <b className="wf-alert-row-title">{properties.event || 'NWS alert'}</b>
                  <small className="wf-alert-row-area">{properties.areaDesc || 'Area not specified'}</small>
                </span>
                <WeatherDeskIcon name="chevronRight" size={14} className="wf-alert-row-chevron" />
              </button>
            )
          })}
          {!sortedPolygonAlerts.length && <p className="wf-muted">No active NWS alerts with map geometry were returned. That means none were active nationwide at refresh time — not that the layer is broken.</p>}
        </div>
        <p className="wf-disclaimer">Independent educational display. Radar may be delayed, have gaps, or be temporarily unavailable. Always verify urgent warnings and instructions with the official NWS.</p>
      </aside>
    </div>
    <footer className="wf-status"><span>{status}</span><span role="status" aria-live="polite">{mapError || (weather?.errors?.alerts ? `Alert data issue: ${weather.errors.alerts}` : lastRadarRefresh ? `Last refresh request: ${lastRadarRefresh.toLocaleTimeString()}` : 'Radar imagery is served by official NWS / NOAA GIS services.')}</span></footer>
    <div className="wf-note"><b>Radar interpretation:</b> BREF and CREF show reflectivity; base radial velocity shows motion toward or away from an individual radar. National mosaic products and single-site products are different datasets. A velocity couplet can have multiple causes and does not by itself confirm a tornado. Geographic basemap tiles are provided by the listed map providers; radar and warning data are NWS / NOAA.</div>

    {selectedAlert && <AlertDetailsDialog alert={selectedAlert} onClose={() => setSelectedAlert(null)} />}

    {showOfficialRadar && (
      <div className="wf-official-radar-overlay" role="dialog" aria-modal="true" aria-label="Official NWS radar viewer">
        <div className="wf-official-radar-header">
          <strong>Official NWS Radar Viewer</strong>
          <button onClick={() => setShowOfficialRadar(false)} aria-label="Close"><WeatherDeskIcon name="close" size={18} /></button>
        </div>
        <iframe
          src="https://radar.weather.gov"
          title="Official NWS radar viewer with past and future animation"
          className="wf-official-radar-frame"
          allowFullScreen
        />
        <div className="wf-official-radar-footer">
          <small>This is the official National Weather Service radar viewer with full past and future animation capabilities. Close this panel to return to Weather Forecaster.</small>
        </div>
      </div>
    )}

    {customAnimationOpen && (
      <div className="wf-anim-panel" role="group" aria-label="Radar loop controls">
        <div className="wf-anim-head">
          <span className="wf-anim-title"><WeatherDeskIcon name="play" size={13} /> Radar loop</span>
          <span className={`wf-anim-state ${isPlaying ? 'is-playing' : ''}`}>{isPlaying ? 'Playing' : 'Paused'}</span>
          {isForecastFrame && <span className="wf-anim-forecast">Forecast +{forecastMinutes} min</span>}
          <span className="wf-anim-clock">{clockLabel(activeFrameTime)}</span>
          <button type="button" className="wf-anim-close" onClick={closeAnimator} aria-label="Close radar loop"><WeatherDeskIcon name="close" size={15} /></button>
        </div>
        <input
          type="range"
          min="0"
          max={maxFrame}
          value={Math.min(frameIndex, maxFrame)}
          onChange={event => { setIsPlaying(false); setFrameIndex(Number(event.target.value)) }}
          className="wf-anim-slider"
          aria-label="Radar frame time"
        />
        <div className="wf-anim-labels">
          <span>{clockLabel(animationFrames[0])}</span>
          <span>{clockLabel(animationFrames[PAST_FRAMES - 1])} · now</span>
          <span>{maxFrame >= PAST_FRAMES ? `+${FUTURE_STEP_MINUTES * (TOTAL_FRAMES - PAST_FRAMES)} min · forecast` : 'forecast unavailable'}</span>
        </div>
        <div className="wf-anim-buttons">
          <button type="button" className="wf-anim-btn" onClick={() => { setIsPlaying(false); setFrameIndex(0) }}>Oldest</button>
          <button type="button" className="wf-anim-btn" onClick={() => { setIsPlaying(false); setFrameIndex(index => Math.max(0, index - 1)) }} aria-label="Previous frame"><WeatherDeskIcon name="back" size={14} /></button>
          <button type="button" className="wf-anim-btn is-play" onClick={() => setIsPlaying(value => !value)}>
            {isPlaying ? <WeatherDeskIcon name="pause" size={14} /> : <WeatherDeskIcon name="play" size={14} />}
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button type="button" className="wf-anim-btn" onClick={() => { setIsPlaying(false); setFrameIndex(index => Math.min(maxFrame, index + 1)) }} aria-label="Next frame"><WeatherDeskIcon name="chevronRight" size={14} /></button>
          <button type="button" className="wf-anim-btn" onClick={() => { setIsPlaying(false); setFrameIndex(PAST_FRAMES - 1) }}>Now</button>
          {maxFrame >= PAST_FRAMES && (
            <button type="button" className="wf-anim-btn wf-anim-btn-forecast" onClick={() => { setIsPlaying(false); setFrameIndex(TOTAL_FRAMES - 1) }}>+60m</button>
          )}
        </div>
        <p className="wf-anim-note">
          Past frames are official NWS/NOAA scans requested through the WMS time dimension ({PAST_STEP_MINUTES}-minute steps).
          {nowcast.state === 'ready' && nowcast.uncertain
            ? ' Storm motion could not be measured reliably in this view, so the forecast frames hold the newest scan instead of inventing a drift.'
            : nowcast.state === 'ready' && !nowcast.still
              ? ` Forecast frames advect the newest official scan along storm motion measured over the last ${nowcast.baselineMinutes ?? PAST_STEP_MINUTES} minutes (about ${nowcast.speedMph} mph toward ${nowcast.compass})${
                  nowcast.trend === 'growing' ? `, and echo intensity was strengthening (about ${nowcast.trendPercent}% over an hour), so growing areas brighten in the forecast`
                    : nowcast.trend === 'weakening' ? `, and echo intensity was weakening (about ${Math.abs(nowcast.trendPercent)}% over an hour), so fading areas thin out in the forecast`
                      : ''
                }. They are a short-range nowcast, not an official NWS forecast.`
              : nowcast.state === 'ready'
                ? ' Forecast frames are available, but the storm motion measured across those scans is too small to shift the echoes, so they match the newest scan.'
                : nowcast.state === 'loading'
                ? ' Measuring storm motion across the last few official scans to build the forecast frames…'
                : ` ${nowcast.error || ''}`}
        </p>
      </div>
    )}

    {/* Mobile control dock — Weather Channel-style bottom bar (CSS-hidden on desktop). */}
    <div className="wf-mobile-dock" role="toolbar" aria-label="Radar controls">
      <button type="button" className={`wf-dock-btn ${mobileSheet === 'layers' ? 'is-active' : ''}`} onClick={() => setMobileSheet(mobileSheet === 'layers' ? null : 'layers')} aria-expanded={mobileSheet === 'layers'}>
        <WeatherDeskIcon name="layers" size={22} /><span>Layers</span>
      </button>
      <button type="button" className="wf-dock-btn" onClick={locate}>
        <WeatherDeskIcon name="location" size={22} /><span>Locate</span>
      </button>
      <button type="button" className="wf-dock-btn" onClick={refreshRadar} disabled={refreshingRadar}>
        <WeatherDeskIcon name={refreshingRadar ? 'clock' : 'refresh'} size={22} /><span>{refreshingRadar ? 'Loading' : 'Refresh'}</span>
      </button>
      <button type="button" className={`wf-dock-btn ${showAlerts ? 'is-active' : ''}`} onClick={() => setShowAlerts(value => !value)} aria-pressed={showAlerts}>
        <WeatherDeskIcon name="alerts" size={22} /><span>Alerts</span>
      </button>
      <Link to="/" className="wf-dock-btn wf-dock-done">
        <WeatherDeskIcon name="back" size={22} /><span>Done</span>
      </Link>
    </div>

    {mobileSheet === 'layers' && (
      <div className="wf-mobile-sheet-wrap" role="presentation" onClick={() => setMobileSheet(null)}>
        <div className="wf-mobile-sheet" role="dialog" aria-modal="true" aria-label="Radar layers" onClick={event => event.stopPropagation()}>
          <div className="wf-mobile-sheet-grip" aria-hidden="true" />
          <strong className="wf-mobile-sheet-title">Radar layers</strong>

          <label className="wf-sheet-field">RADAR PRODUCT
            <select aria-label="Radar product" value={productId} onChange={event => { chooseProduct(event.target.value); setMobileSheet(null) }}>
              <optgroup label="National NWS / NOAA mosaics">
                {Object.entries(NATIONAL_RADAR_PRODUCTS).map(([id, product]) => <option key={id} value={id}>{product.label}</option>)}
              </optgroup>
              <optgroup label={radarStation ? `Local radar · ${radarStation}` : 'Local radar · choose a site below'}>
                {Object.entries(SITE_RADAR_PRODUCTS).map(([id, product]) => {
                  const ready = availableSiteProducts.includes(id)
                  return <option key={id} value={id} disabled={!ready}>{product.label}{siteCatalog.state === 'loading' ? ' · checking…' : ready ? '' : ' · unavailable'}</option>
                })}
              </optgroup>
            </select>
          </label>

          <div className="wf-sheet-field">
            <span className="wf-sheet-label">BACKGROUND</span>
            <div className="wf-sheet-segmented" role="group" aria-label="Background map">
              {Object.entries(BASEMAPS).map(([key, item]) => (
                <button key={key} type="button" className={base === key ? 'selected' : ''} onClick={() => { baseTouched.current = true; setBase(key) }}>{item.label}</button>
              ))}
            </div>
          </div>

          <label className="wf-sheet-field">OPACITY <span>{opacity}%</span>
            <input aria-label="Radar overlay opacity" type="range" min="10" max="100" value={opacity} onChange={event => setOpacity(Number(event.target.value))}/>
          </label>

          <label className="wf-sheet-check"><input type="checkbox" checked={showAlerts} onChange={event => setShowAlerts(event.target.checked)}/> Show NWS alert polygons ({polygonAlerts.filter(item => item.geometry).length} nationwide)</label>

          <div className="wf-sheet-field">
            <span className="wf-sheet-label">RADAR ANIMATION</span>
            <button type="button" className="wf-sheet-animate" onClick={() => { setMobileSheet(null); openAnimator() }}>
              <WeatherDeskIcon name="play" size={16} /> Radar loop
            </button>
            <button type="button" className="wf-sheet-animate" onClick={() => { setMobileSheet(null); setShowOfficialRadar(true) }}>
              <WeatherDeskIcon name="arrowUpRight" size={16} /> Official NWS viewer
            </button>
            <small>Radar loop steps through official NWS frames plus an extrapolated hour of forecast frames, or open the embedded official NWS viewer.</small>
          </div>

          <div className="wf-sheet-actions">
            <button type="button" className="wf-secondary-action" onClick={() => { zoomAlerts(); setMobileSheet(null) }}>Zoom to alerts</button>
            <form className="wf-site-form" onSubmit={event => { handleManualSite(event); setMobileSheet(null) }}>
              <input value={siteInput} onChange={event => setSiteInput(event.target.value.toUpperCase().slice(0, 4))} placeholder={radarStation || 'Site ID'} maxLength={4} aria-label="Radar site ID"/>
              <button type="submit">Load local</button>
            </form>
          </div>
          <p className="wf-sheet-status">{localProductsLoading ? `Checking ${radarStation}…` : radarStation ? `Site ${radarStation}` : 'National mosaic mode'}{siteCatalog.state === 'error' ? ' · local catalog unavailable' : ''}</p>
          <p className="wf-sheet-product"><strong>{activeProductLabel}</strong><br/><small>{selectedDescription}</small></p>
        </div>
      </div>
    )}
  </div>
}

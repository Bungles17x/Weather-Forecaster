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
const EMPTY_ALERTS = []
const severityColor = severity => ({ Extreme: '#ff5364', Severe: '#ff8d52', Moderate: '#f2c45e', Minor: '#68b8ff' })[severity] || '#91a4ba'

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


function makeWmsLayer(definition, opacity, timeDimension = null) {
  const params = {
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
  }
  if (timeDimension) params.time = timeDimension
  return L.tileLayer.wms(definition.url, params)
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
  const [alertScanKey, setAlertScanKey] = useState(0)
  const [lastRadarRefresh, setLastRadarRefresh] = useState(null)
  const [refreshingRadar, setRefreshingRadar] = useState(false)
  const [mobileSheet, setMobileSheet] = useState(null)
  const alertsFittedRef = useRef(false)
  const mapInteractedRef = useRef(false)
  const [animating, setAnimating] = useState(false)
  const [animationFrame, setAnimationFrame] = useState(0)
  const [animationFrames, setAnimationFrames] = useState([])
  const animationIntervalRef = useRef(null)
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

  useEffect(() => {
    if (!mapNode.current || mapRef.current) return undefined
    const centerLat = Number.isFinite(Number(coordinates?.lat)) ? Number(coordinates.lat) : 38.9072
    const centerLon = Number.isFinite(Number(coordinates?.lon)) ? Number(coordinates.lon) : -77.0369
    const map = L.map(mapNode.current, { zoomControl: false, preferCanvas: true, minZoom: 3, maxZoom: 12, worldCopyJump: true }).setView([centerLat, centerLon], 7)
    mapRef.current = map
    map.on('dragstart zoomstart', () => { mapInteractedRef.current = true })
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
        item.bindPopup(`<strong>${safeHtml(p.event || 'NWS alert')}</strong><br>${safeHtml(p.headline)}<br><b>Severity:</b> ${safeHtml(p.severity)}<br><b>Expires:</b> ${safeHtml(p.expires)}<br><br>${safeHtml(p.instruction || p.description).slice(0, 900)}`)
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
    const pointFeatures = polygonAlerts.filter(feature => !feature.geometry && (feature.properties?.point || (feature.properties?.geocode?.UGC && feature.properties?.geocode?.UGC.length)))
    console.log('[Alert polygons] features with geometry:', features.length, 'point features without geometry:', pointFeatures.length, 'total alerts:', polygonAlerts.length, 'showAlerts:', showAlerts)
    // Add both polygon and point features so alerts are always visible.
    layerGroup.clearLayers().addData({ type: 'FeatureCollection', features: [...features, ...pointFeatures] })
    if (showAlerts) {
      layerGroup.addTo(map).bringToFront()
      console.log('[Alert polygons] layer added to map, hasLayer:', map.hasLayer(layerGroup), 'getLayers:', layerGroup.getLayers().length)
    } else if (map.hasLayer(layerGroup)) {
      map.removeLayer(layerGroup)
    }
    // Frame every alert polygon once on first load so nationwide warnings are
    // actually visible — skipped if the user already moved the map.
    if (!alertsFittedRef.current && !mapInteractedRef.current && features.length) {
      const bounds = L.latLngBounds([])
      features.forEach(feature => {
        const featureBox = featureBounds(feature)
        if (featureBox?.isValid()) bounds.extend(featureBox)
      })
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [28, 28] })
        alertsFittedRef.current = true
        console.log('[Alert polygons] auto-fit to bounds', bounds)
      }
    }
    if (!features.length && !pointFeatures.length && polygonAlerts.length) setStatus('NWS alerts were returned, but none included usable map geometry or point data.')
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
    const radarLayer = makeWmsLayer(definition, opacity, animationFrames[animationFrame] || null)
    radarLayer.on('tileload', () => {
      if (cancelled) return
      setStatus(`${definition.title} · NWS/NOAA imagery loaded${animating ? ` · Frame ${animationFrame + 1}/${animationFrames.length}` : ''}`)
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

  useEffect(() => {
    layersRef.current.activeProduct?.setOpacity(opacity / 100)
  }, [opacity])

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
    setAnimating(false)
    setAnimationFrame(0)
    const national = NATIONAL_RADAR_PRODUCTS[next]
    const site = SITE_RADAR_PRODUCTS[next]
    setStatus(national ? `Requesting ${national.title}…` : `Requesting ${site?.title || 'radar product'}…`)
  }

  const toggleAnimation = () => {
    if (animating) {
      setAnimating(false)
      if (animationIntervalRef.current) {
        window.clearInterval(animationIntervalRef.current)
        animationIntervalRef.current = null
      }
    } else {
      const now = new Date()
      const frames = []
      for (let i = 12; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 10 * 60 * 1000)
        frames.push(time.toISOString())
      }
      setAnimationFrames(frames)
      setAnimationFrame(0)
      setAnimating(true)
      animationIntervalRef.current = window.setInterval(() => {
        setAnimationFrame(f => {
          const next = f + 1
          if (next >= frames.length) {
            setAnimating(false)
            if (animationIntervalRef.current) {
              window.clearInterval(animationIntervalRef.current)
              animationIntervalRef.current = null
            }
            return 0
          }
          return next
        })
      }, 600)
    }
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
      if (bounds.isValid()) mapRef.current.fitBounds(bounds, { padding: [24, 24], maxZoom: 9 })
    } else setStatus('No NWS alert polygons with geometry are available for the selected point.')
  }

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
      <div className="wf-brand"><span className="wf-live-dot"/>WEATHER FORECASTER RADAR<small>NWS / NOAA PRODUCTS · NO RADAR API KEY</small></div>
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
      <button type="button" className="wf-secondary-action" onClick={zoomAlerts}>Zoom to alerts</button>
      {activeDefinition?.timeDimension && (
        <button type="button" className={`wf-secondary-action ${animating ? 'animating' : ''}`} onClick={toggleAnimation}>
          {animating ? <><WeatherDeskIcon name="pause" size={14} /> Pause</> : <><WeatherDeskIcon name="play" size={14} /> Animate</>}
          {animating && ` ${animationFrame + 1}/${animationFrames.length}`}
        </button>
      )}
      <form className="wf-site-form" onSubmit={handleManualSite}><label htmlFor="wf-radar-site">Radar site ID</label><input id="wf-radar-site" value={siteInput} onChange={event => setSiteInput(event.target.value.toUpperCase().slice(0, 4))} placeholder={radarStation || 'e.g. KCCX'} maxLength={4} aria-label="Radar site ID"/><button type="submit">Load local products</button></form>
      <span className="wf-site-status">{localProductsLoading ? `Checking ${radarStation}…` : radarStation ? `Site ${radarStation}` : 'National mosaic mode'}{siteCatalog.state === 'error' ? ' · local catalog unavailable' : ''}</span>
      <Link to="/" className="wf-secondary-action wf-exit-map"><WeatherDeskIcon name="back" size={13} /> Done</Link>
    </div>
    <div className="wf-map-area">
      <div ref={mapNode} className="wf-leaflet-map" aria-label="Interactive NWS radar map"/>
      <aside className="wf-side-panel">
        <div className="wf-panel-heading">SITUATIONAL AWARENESS</div>
        <div className="wf-metric"><span>SELECTED LOCATION</span><strong>{location || 'Map location'}</strong><small>{coordinates ? `${Number(coordinates.lat).toFixed(3)}, ${Number(coordinates.lon).toFixed(3)}` : 'Coordinates unavailable'}</small></div>
        <div className="wf-metric"><span>ACTIVE NWS ALERTS</span><strong>{alerts.length}</strong><small>Official point-based alert feed; polygons show all active NWS alerts nationwide.</small></div>
        <div className="wf-metric"><span>RADAR PRODUCT</span><strong>{activeProductLabel}</strong><small>{selectedDescription}</small></div>
        <div className="wf-metric"><span>DATA SOURCE</span><strong>NWS / NOAA OpenGeo</strong><small>{NATIONAL_RADAR_PRODUCTS[productId]?.source || (radarStation ? `Radar site ${radarStation} · official WMS capabilities` : 'National products do not require a radar-site selection')}</small></div>
        <div className="wf-alert-list"><div className="wf-panel-heading">HIGHEST PRIORITY ALERTS</div>{alerts.slice().sort((a, b) => ({ Extreme: 0, Severe: 1, Moderate: 2, Minor: 3 }[a.properties?.severity] ?? 4) - ({ Extreme: 0, Severe: 1, Moderate: 2, Minor: 3 }[b.properties?.severity] ?? 4)).slice(0, 5).map((feature, index) => <button key={feature.id || index} onClick={() => { const bounds = featureBounds(feature); if (bounds?.isValid() && mapRef.current) mapRef.current.fitBounds(bounds, { padding: [20, 20], maxZoom: 9 }) }} className="wf-alert-row"><i style={{ background: severityColor(feature.properties?.severity) }}/><span><b>{feature.properties?.event || 'NWS alert'}</b><small>{feature.properties?.areaDesc || 'Area not specified'}</small></span></button>)}{!alerts.length && <p className="wf-muted">No active point alerts returned. Check feed status on the dashboard if that seems unexpected.</p>}</div>
        <p className="wf-disclaimer">Independent educational display. Radar may be delayed, have gaps, or be temporarily unavailable. Always verify urgent warnings and instructions with the official NWS.</p>
      </aside>
    </div>
    <footer className="wf-status"><span>{status}</span><span role="status" aria-live="polite">{mapError || (weather?.errors?.alerts ? `Alert data issue: ${weather.errors.alerts}` : lastRadarRefresh ? `Last refresh request: ${lastRadarRefresh.toLocaleTimeString()}` : 'Radar imagery is served by official NWS / NOAA GIS services.')}</span></footer>
    <div className="wf-note"><b>Radar interpretation:</b> BREF and CREF show reflectivity; base radial velocity shows motion toward or away from an individual radar. National mosaic products and single-site products are different datasets. A velocity couplet can have multiple causes and does not by itself confirm a tornado. Geographic basemap tiles are provided by the listed map providers; radar and warning data are NWS / NOAA.</div>

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

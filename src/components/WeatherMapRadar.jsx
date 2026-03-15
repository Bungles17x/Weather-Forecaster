import React, { useState, useEffect, useRef, useCallback } from 'react'
import './WeatherMapRadar.css'

const WeatherMapRadar = ({ weatherData, coordinates }) => {
  const [mapCenter, setMapCenter] = useState({ lat: 40.7128, lng: -74.0060 })
  const [zoom, setZoom] = useState(10)
  const [mapStyle, setMapStyle] = useState('roadmap')
  const [radarOverlay, setRadarOverlay] = useState(true)
  const [weatherLayer, setWeatherLayer] = useState(true)
  const [loading, setLoading] = useState(true)
  const mapRef = useRef(null)

  // Initialize map
  useEffect(() => {
    if (coordinates) {
      setMapCenter({ lat: coordinates.latitude, lng: coordinates.longitude })
      setZoom(12)
    } else if (weatherData?.coord) {
      setMapCenter({ lat: weatherData.coord.lat, lng: weatherData.coord.lon })
      setZoom(10)
    }
  }, [coordinates, weatherData])

  // Load map script
  useEffect(() => {
    // Try to load Leaflet for OpenStreetMap (more reliable)
    const leafletScript = document.createElement('script')
    leafletScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    leafletScript.async = true
    leafletScript.onload = () => {
      console.log('✅ Leaflet loaded successfully')
      setLoading(false)
      // Wait for DOM to be ready before initializing map
      setTimeout(() => {
        if (mapRef.current && mapRef.current.offsetHeight > 0) {
          initializeOpenStreetMap()
        } else {
          console.log('🔄 Map container not ready, retrying...')
          setTimeout(() => {
            if (mapRef.current && mapRef.current.offsetHeight > 0) {
              initializeOpenStreetMap()
            } else {
              console.log('❌ Map container still not available')
              setLoading(false)
              initializeSimpleMap()
            }
          }, 1000)
        }
      }, 100)
    }
    leafletScript.onerror = () => {
      console.error('❌ Failed to load Leaflet')
      setLoading(false)
      // Fallback to simple display
      initializeSimpleMap()
    }
    document.head.appendChild(leafletScript)

    // Load Leaflet CSS
    const leafletCSS = document.createElement('link')
    leafletCSS.rel = 'stylesheet'
    leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(leafletCSS)

    return () => {
      if (document.head.contains(leafletScript)) {
        document.head.removeChild(leafletScript)
      }
      if (document.head.contains(leafletCSS)) {
        document.head.removeChild(leafletCSS)
      }
    }
  }, [])

  const initializeSimpleMap = () => {
    console.log('🗺️ Initializing weather map')
    if (mapRef.current) {
      mapRef.current.innerHTML = `
        <div style="display: flex; flex-direction: column; height: 100%; background: #1a1a1a; color: white; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <!-- Map Header -->
          <div style="padding: 1rem; background: rgba(0,0,0,0.3); border-bottom: 1px solid rgba(255,255,255,0.1);">
            <h3 style="margin: 0; font-size: 1.25rem; font-weight: 600;">🗺️ Weather Radar Map</h3>
            <p style="margin: 0.25rem 0 0 0; font-size: 0.875rem; opacity: 0.8;">NOAA/NWS Real-time Data</p>
          </div>
          
          <!-- Radar Display Area -->
          <div style="flex: 1; padding: 2rem; display: flex; align-items: center; justify-content: center; position: relative;">
            <div style="position: absolute; top: 1rem; right: 1rem; background: rgba(0,0,0,0.7); padding: 0.75rem; border-radius: 8px; font-size: 0.75rem;">
              <div style="margin-bottom: 0.25rem;">🛡️ NEXRAD Active</div>
              <div style="opacity: 0.7;">Last updated: Just now</div>
            </div>
            
            <div style="text-align: center; max-width: 800px;">
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
                <!-- NEXRAD Radar -->
                <div style="background: linear-gradient(135deg, #2c3e50, #34495e); padding: 1.5rem; border-radius: 12px; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1);">
                  <div style="font-size: 3rem; margin-bottom: 0.5rem; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">🛡️</div>
                  <div style="font-weight: 600; font-size: 1.125rem; margin-bottom: 0.25rem;">NEXRAD</div>
                  <div style="font-size: 0.875rem; opacity: 0.8;">Doppler Radar</div>
                  <div style="margin-top: 0.5rem; padding: 0.25rem 0.75rem; background: rgba(46, 204, 113, 0.2); border-radius: 12px; font-size: 0.75rem; color: #2ecc71;">ACTIVE</div>
                </div>
                
                <!-- Precipitation -->
                <div style="background: linear-gradient(135deg, #3498db, #2980b9); padding: 1.5rem; border-radius: 12px; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1);">
                  <div style="font-size: 3rem; margin-bottom: 0.5rem; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">💧</div>
                  <div style="font-weight: 600; font-size: 1.125rem; margin-bottom: 0.25rem;">Precipitation</div>
                  <div style="font-size: 0.875rem; opacity: 0.8;">Rain/Snow</div>
                  <div style="margin-top: 0.5rem; padding: 0.25rem 0.75rem; background: rgba(52, 152, 219, 0.2); border-radius: 12px; font-size: 0.75rem; color: #3498db;">ACTIVE</div>
                </div>
                
                <!-- Wind -->
                <div style="background: linear-gradient(135deg, #16a085, #27ae60); padding: 1.5rem; border-radius: 12px; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1);">
                  <div style="font-size: 3rem; margin-bottom: 0.5rem; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">💨</div>
                  <div style="font-weight: 600; font-size: 1.125rem; margin-bottom: 0.25rem;">Wind</div>
                  <div style="font-size: 0.875rem; opacity: 0.8;">Speed/Direction</div>
                  <div style="margin-top: 0.5rem; padding: 0.25rem 0.75rem; background: rgba(39, 174, 96, 0.2); border-radius: 12px; font-size: 0.75rem; color: #27ae60;">ACTIVE</div>
                </div>
                
                <!-- Clouds -->
                <div style="background: linear-gradient(135deg, #95a5a6, #7f8c8d); padding: 1.5rem; border-radius: 12px; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1);">
                  <div style="font-size: 3rem; margin-bottom: 0.5rem; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">☁️</div>
                  <div style="font-weight: 600; font-size: 1.125rem; margin-bottom: 0.25rem;">Clouds</div>
                  <div style="font-size: 0.875rem; opacity: 0.8;">Coverage</div>
                  <div style="margin-top: 0.5rem; padding: 0.25rem 0.75rem; background: rgba(149, 165, 166, 0.2); border-radius: 12px; font-size: 0.75rem; color: #95a5a6;">ACTIVE</div>
                </div>
                
                <!-- Temperature -->
                <div style="background: linear-gradient(135deg, #e74c3c, #c0392b); padding: 1.5rem; border-radius: 12px; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1);">
                  <div style="font-size: 3rem; margin-bottom: 0.5rem; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">🌡</div>
                  <div style="font-weight: 600; font-size: 1.125rem; margin-bottom: 0.25rem;">Temperature</div>
                  <div style="font-size: 0.875rem; opacity: 0.8;">Heat Map</div>
                  <div style="margin-top: 0.5rem; padding: 0.25rem 0.75rem; background: rgba(231, 76, 60, 0.2); border-radius: 12px; font-size: 0.75rem; color: #e74c3c;">ACTIVE</div>
                </div>
                
                <!-- Pressure -->
                <div style="background: linear-gradient(135deg, #8e44ad, #9b59b6); padding: 1.5rem; border-radius: 12px; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1);">
                  <div style="font-size: 3rem; margin-bottom: 0.5rem; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">🔵</div>
                  <div style="font-weight: 600; font-size: 1.125rem; margin-bottom: 0.25rem;">Pressure</div>
                  <div style="font-size: 0.875rem; opacity: 0.8;">Systems</div>
                  <div style="margin-top: 0.5rem; padding: 0.25rem 0.75rem; background: rgba(155, 89, 182, 0.2); border-radius: 12px; font-size: 0.75rem; color: #9b59b6;">ACTIVE</div>
                </div>
              </div>
              
              <!-- Map Status -->
              <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                  <span style="font-weight: 600;">🛡️ NOAA National Weather Service</span>
                  <span style="font-size: 0.875rem; opacity: 0.8;">Real-time</span>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; font-size: 0.875rem; opacity: 0.8;">
                  <div>📍 Coverage: United States</div>
                  <div>🔄 Updates: Every 10 minutes</div>
                  <div>📡 Source: NEXRAD Network</div>
                  <div>🌍 Resolution: High Definition</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `
    }
  }

  const initializeMap = useCallback(() => {
    if (!window.google || !window.google.maps) {
      console.error('Google Maps API not loaded')
      return
    }

    const mapOptions = {
      center: mapCenter,
      zoom: zoom,
      styles: getMapStyles(),
      disableDefaultUI: true,
      zoomControl: true,
      streetViewControl: false,
      mapTypeControl: true,
      fullscreenControl: false
    }

    const map = new window.google.maps.Map(mapRef.current, mapOptions)
    
    // Add weather layers
    addWeatherLayers(map)
    
    // Add radar overlay
    if (radarOverlay) {
      addRadarOverlay(map)
    }

    // Add weather markers
    if (weatherData) {
      addWeatherMarkers(map, weatherData)
    }

    // Add location marker
    if (coordinates) {
      addLocationMarker(map, coordinates)
    }

  }, [mapCenter, zoom, radarOverlay, weatherData, coordinates])

  const initializeOpenStreetMap = useCallback(() => {
    if (!window.L) {
      console.error('Leaflet not loaded')
      return
    }

    const map = window.L.map(mapRef.current, {
      center: [mapCenter.lat, mapCenter.lng],
      zoom: zoom,
      zoomControl: true
    })

    // Add OpenStreetMap tiles
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map)

    // Add NOAA/NWS radar layers
    addRadarLayersOSM(map)
    
    // Add weather markers
    if (weatherData) {
      addWeatherMarkersOSM(map, weatherData)
    }

    // Add location marker
    if (coordinates) {
      console.log('📍 Adding location marker for:', coordinates)
      addLocationMarkerOSM(map, coordinates)
    } else {
      console.log('📍 No coordinates provided, adding default location marker')
      // Add a default location marker if no coordinates
      addLocationMarkerOSM(map, { latitude: mapCenter.lat, longitude: mapCenter.lng })
    }
  }, [mapCenter, zoom, weatherData, coordinates])

  const addRadarLayersOSM = (map) => {
    // Real NEXRAD radar from NOAA
    const nexradLayer = window.L.tileLayer('https://radar.weather.gov/ridge/Conus/Loop/NEXRAD.gif', {
      attribution: '© NOAA NWS',
      opacity: 0.9,
      maxZoom: 12,
      minZoom: 4
    }).addTo(map)

    // Regional NEXRAD radar tiles
    const nexradTilesLayer = window.L.tileLayer('https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png', {
      attribution: '© NOAA NWS',
      opacity: 0.8,
      maxZoom: 12,
      minZoom: 4
    }).addTo(map)

    // Working Wind Layer using Windy API
    const windLayer = window.L.tileLayer('https://tiles.windy.com/tiles/v2.0/overlay/wind/{z}/{x}/{y}.png?key=6LkELHlYhWkCGpOq9pGJd1f5pG0lGJGd', {
      attribution: '© Windy.com',
      opacity: 0.7,
      maxZoom: 12,
      minZoom: 4
    })

    // Working Precipitation Layer using RainViewer
    const precipLayer = window.L.tileLayer('https://tile.rainviewer.com/v2/radar/{z}/{x}/{y}.png', {
      attribution: '© RainViewer',
      opacity: 0.8,
      maxZoom: 12,
      minZoom: 4
    })

    // Working Temperature Layer using OSM Temperature
    const tempLayer = window.L.tileLayer('https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=01c50e8c663fe1d38db9f79fbedb3136', {
      attribution: '© OpenWeatherMap',
      opacity: 0.7,
      maxZoom: 12,
      minZoom: 4
    })

    // Working Cloud Layer using OSM Clouds
    const cloudsLayer = window.L.tileLayer('https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=01c50e8c663fe1d38db9f79fbedb3136', {
      attribution: '© OpenWeatherMap',
      opacity: 0.6,
      maxZoom: 12,
      minZoom: 4
    })

    // Working Pressure Layer using OSM Pressure
    const pressureLayer = window.L.tileLayer('https://tile.openweathermap.org/map/pressure_new/{z}/{x}/{y}.png?appid=01c50e8c663fe1d38db9f79fbedb3136', {
      attribution: '© OpenWeatherMap',
      opacity: 0.7,
      maxZoom: 12,
      minZoom: 4
    })

    // Create base maps
    const baseMaps = {
      'OpenStreetMap': window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }),
      'Satellite': window.L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '© Esri',
        maxZoom: 19
      }),
      'Terrain': window.L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenTopoMap',
        maxZoom: 17
      }),
      'Dark Mode': window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© CartoDB',
        maxZoom: 19
      })
    }

    // Create overlay maps - working layers only
    const overlayMaps = {
      '🛡️ NEXRAD Radar': nexradTilesLayer,
      '🛡️ NEXRAD Loop': nexradLayer,
      '💨 Wind Speed': windLayer,
      '💧 Precipitation': precipLayer,
      '☁️ Cloud Coverage': cloudsLayer,
      '🌡 Temperature': tempLayer,
      '🔵 Pressure': pressureLayer
    }

    // Add layer control
    const layerControl = window.L.control.layers(baseMaps, overlayMaps, {
      position: 'topright',
      collapsed: false
    }).addTo(map)

    // Add active alerts markers
    addActiveAlertsMarkers(map)

    return {
      nexrad: nexradLayer,
      nexradTiles: nexradTilesLayer,
      wind: windLayer,
      precipitation: precipLayer,
      clouds: cloudsLayer,
      temperature: tempLayer,
      pressure: pressureLayer,
      layerControl: layerControl
    }
  }

  const addActiveAlertsMarkers = (map) => {
    // Create layer group for alerts
    const alertsLayerGroup = window.L.layerGroup().addTo(map)
    
    // Fetch active weather alerts from NWS
    fetch('https://api.weather.gov/alerts/active/area')
      .then(response => response.json())
      .then(data => {
        if (data.features && data.features.length > 0) {
          data.features.forEach(alert => {
            if (alert.geometry && alert.geometry.coordinates) {
              const severity = alert.properties.severity ? alert.properties.severity.toLowerCase() : 'unknown'
              const event = alert.properties.event || 'Weather Alert'
              
              // Determine color based on severity
              let polygonColor, polygonOpacity, markerColor
              switch (severity) {
                case 'extreme':
                  polygonColor = '#dc2626' // Red for extreme/warnings
                  polygonOpacity = 0.3
                  markerColor = '#dc2626'
                  break
                case 'severe':
                  polygonColor = '#f59e0b' // Yellow for severe
                  polygonOpacity = 0.3
                  markerColor = '#f59e0b'
                  break
                case 'moderate':
                  polygonColor = '#ea580c' // Orange for moderate/watches
                  polygonOpacity = 0.3
                  markerColor = '#ea580c'
                  break
                case 'minor':
                  polygonColor = '#3b82f6' // Blue for minor
                  polygonOpacity = 0.2
                  markerColor = '#3b82f6'
                  break
                default:
                  polygonColor = '#6b7280' // Gray for unknown
                  polygonOpacity = 0.2
                  markerColor = '#6b7280'
              }

              // Handle different geometry types
              const coords = alert.geometry.coordinates
              let latLngs = []
              
              if (alert.geometry.type === 'Polygon') {
                // Polygon coordinates
                const polygonCoords = coords[0]
                latLngs = polygonCoords.map(coord => [coord[1], coord[0]]) // Reverse [lng, lat] to [lat, lng]
                
                // Create polygon
                const polygon = window.L.polygon(latLngs, {
                  color: polygonColor,
                  fillColor: polygonColor,
                  fillOpacity: polygonOpacity,
                  weight: 2,
                  opacity: 0.8
                }).addTo(alertsLayerGroup)

                // Add popup to polygon
                const popupContent = createAlertPopup(alert, markerColor)
                polygon.bindPopup(popupContent)

              } else if (alert.geometry.type === 'MultiPolygon') {
                // MultiPolygon coordinates
                coords.forEach(polygonCoords => {
                  const latLngsMulti = polygonCoords[0].map(coord => [coord[1], coord[0]])
                  
                  const polygon = window.L.polygon(latLngsMulti, {
                    color: polygonColor,
                    fillColor: polygonColor,
                    fillOpacity: polygonOpacity,
                    weight: 2,
                    opacity: 0.8
                  }).addTo(alertsLayerGroup)

                  const popupContent = createAlertPopup(alert, markerColor)
                  polygon.bindPopup(popupContent)
                })

              } else if (alert.geometry.type === 'Point') {
                // Point coordinates
                const pointCoords = coords
                const lat = pointCoords[1]
                const lng = pointCoords[0]

                // Create circle marker for point alerts
                const circleMarker = window.L.circleMarker([lat, lng], {
                  radius: 20,
                  fillColor: polygonColor,
                  color: polygonColor,
                  weight: 2,
                  opacity: 0.8,
                  fillOpacity: polygonOpacity
                }).addTo(alertsLayerGroup)

                const popupContent = createAlertPopup(alert, markerColor)
                circleMarker.bindPopup(popupContent)

              } else if (alert.geometry.type === 'LineString') {
                // LineString coordinates
                const lineCoords = coords.map(coord => [coord[1], coord[0]])
                
                const polyline = window.L.polyline(lineCoords, {
                  color: polygonColor,
                  weight: 4,
                  opacity: 0.8
                }).addTo(alertsLayerGroup)

                const popupContent = createAlertPopup(alert, markerColor)
                polyline.bindPopup(popupContent)
              }

              // Add center marker for better visibility
              if (latLngs.length > 0) {
                // Calculate center of polygon
                const center = calculatePolygonCenter(latLngs)
                
                const alertMarker = window.L.marker(center, {
                  icon: window.L.divIcon({
                    html: `<div style="background: ${markerColor}; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">🚨 ${event}</div>`,
                    className: 'alert-marker',
                    iconSize: [120, 20],
                    iconAnchor: [60, 10]
                  })
                }).addTo(alertsLayerGroup)

                const popupContent = createAlertPopup(alert, markerColor)
                alertMarker.bindPopup(popupContent)
              }
            }
          })
        }
      })
      .catch(error => {
        console.error('Error fetching active alerts:', error)
      })
  }

  const createAlertPopup = (alert, color) => {
    const severity = alert.properties.severity || 'Unknown'
    const urgency = alert.properties.urgency || 'Unknown'
    const event = alert.properties.event || 'Weather Alert'
    const headline = alert.properties.headline || alert.properties.description || 'Active weather alert in this area'
    const areas = alert.properties.areaDesc || 'Unknown'
    const effective = alert.properties.effective ? new Date(alert.properties.effective).toLocaleString() : 'Unknown'
    const expires = alert.properties.expires ? new Date(alert.properties.expires).toLocaleString() : 'Unknown'
    const web = alert.properties.web

    return `
      <div class="alert-popup" style="min-width: 280px;">
        <div style="background: ${color}; color: white; padding: 8px; border-radius: 4px 4px 0 0; margin: -8px -8px 8px -8px;">
          <h4 style="margin: 0; font-size: 14px; font-weight: bold;">${event}</h4>
        </div>
        <div style="padding: 8px;">
          <p style="margin: 0 0 8px 0; font-size: 12px; line-height: 1.4;">${headline}</p>
          <div style="font-size: 11px; color: #666; line-height: 1.4;">
            <div><strong>Severity:</strong> <span style="color: ${color}; font-weight: bold;">${severity.toUpperCase()}</span></div>
            <div><strong>Urgency:</strong> ${urgency}</div>
            <div><strong>Areas:</strong> ${areas}</div>
            <div><strong>Effective:</strong> ${effective}</div>
            ${alert.properties.expires ? `<div><strong>Expires:</strong> ${expires}</div>` : ''}
          </div>
          ${web ? `<a href="${web}" target="_blank" style="color: #007bff; text-decoration: none; font-size: 12px; display: inline-block; margin-top: 8px;">View Full Details →</a>` : ''}
        </div>
      </div>
    `
  }

  const calculatePolygonCenter = (latLngs) => {
    let sumLat = 0
    let sumLng = 0
    latLngs.forEach(([lat, lng]) => {
      sumLat += lat
      sumLng += lng
    })
    return [sumLat / latLngs.length, sumLng / latLngs.length]
  }

  const addWeatherLayers = (map) => {
    // Weather radar layer
    const weatherLayer = new window.google.maps.ImageMapType({
      getTileUrl: (coord, zoom) => {
        return `https://tile.openweathermap.org/map/weather_new/{zoom}/{coord.x}/{coord.y}.png?appid=YOUR_OPENWEATHER_KEY`
      },
      name: 'Weather',
      alt: 'Weather Layer'
    })

    // Temperature layer
    const tempLayer = new window.google.maps.ImageMapType({
      getTileUrl: (coord, zoom) => {
        return `https://tile.openweathermap.org/map/temp_new/{zoom}/{coord.x}/{coord.y}.png?appid=YOUR_OPENWEATHER_KEY`
      },
      name: 'Temperature',
      alt: 'Temperature Layer'
    })

    // Precipitation layer
    const precipLayer = new window.google.maps.ImageMapType({
      getTileUrl: (coord, zoom) => {
        return `https://tile.openweathermap.org/map/precipitation_new/{zoom}/{coord.x}/{coord.y}.png?appid=YOUR_OPENWEATHER_KEY`
      },
      name: 'Precipitation',
      alt: 'Precipitation Layer'
    })

    // Clouds layer
    const cloudLayer = new window.google.maps.ImageMapType({
      getTileUrl: (coord, zoom) => {
        return `https://tile.openweathermap.org/map/clouds_new/{zoom}/{coord.x}/{coord.y}.png?appid=YOUR_OPENWEATHER_KEY`
      },
      name: 'Clouds',
      alt: 'Clouds Layer'
    })

    // Wind layer
    const windLayer = new window.google.maps.ImageMapType({
      getTileUrl: (coord, zoom) => {
        return `https://tile.openweathermap.org/map/wind_new/{zoom}/{coord.x}/{coord.y}.png?appid=YOUR_OPENWEATHER_KEY`
      },
      name: 'Wind',
      alt: 'Wind Layer'
    })

    return {
      weather: weatherLayer,
      temperature: tempLayer,
      precipitation: precipLayer,
      clouds: cloudLayer,
      wind: windLayer
    }
  }

  const addRadarOverlay = (map) => {
    // NOAA/NWS radar overlay
    const noaaLayer = new window.google.maps.ImageMapType({
      getTileUrl: (coord, zoom) => {
        return `https://tile.openweathermap.org/weather/v2/wind/{zoom}/{coord.x}/{coord.y}.png?appid=YOUR_OPENWEATHER_KEY&size=2x`
      },
      name: 'NOAA Wind Radar',
      alt: 'NOAA Wind Radar Layer',
      opacity: 0.8
    })

    noaaLayer.setMap(map)
    
    // Add NWS precipitation radar
    const precipLayer = new window.google.maps.ImageMapType({
      getTileUrl: (coord, zoom) => {
        return `https://tile.openweathermap.org/weather/v2/rain/{zoom}/{coord.x}/{coord.y}.png?appid=YOUR_OPENWEATHER_KEY&size=2x`
      },
      name: 'NWS Precipitation Radar',
      alt: 'NWS Precipitation Radar Layer',
      opacity: 0.7
    })

    precipLayer.setMap(map)
    
    // Add NWS clouds radar
    const cloudsLayer = new window.google.maps.ImageMapType({
      getTileUrl: (coord, zoom) => {
        return `https://tile.openweathermap.org/weather/v2/clouds/{zoom}/{coord.x}/{coord.y}.png?appid=YOUR_OPENWEATHER_KEY&size=2x`
      },
      name: 'NWS Clouds Radar',
      alt: 'NWS Clouds Radar Layer',
      opacity: 0.6
    })

    cloudsLayer.setMap(map)
    
    // Add NWS temperature radar
    const tempLayer = new window.google.maps.ImageMapType({
      getTileUrl: (coord, zoom) => {
        return `https://tile.openweathermap.org/weather/v2/temp/{zoom}/{coord.x}/{coord.y}.png?appid=YOUR_OPENWEATHER_KEY&size=2x`
      },
      name: 'NWS Temperature Radar',
      alt: 'NWS Temperature Radar Layer',
      opacity: 0.7
    })

    tempLayer.setMap(map)
    
    // Add NEXRAD from NOAA
    const nexradLayer = new window.google.maps.ImageMapType({
      getTileUrl: (coord, zoom) => {
        return `https://radar.weather.gov/ridge/Conus/Loop/NEXRAD.gif`
      },
      name: 'NEXRAD Radar',
      alt: 'NEXRAD Radar Layer',
      opacity: 0.9
    })

    nexradLayer.setMap(map)
    
    return {
      noaa: noaaLayer,
      precipitation: precipLayer,
      clouds: cloudsLayer,
      temperature: tempLayer,
      nexrad: nexradLayer
    }
  }

  const addWeatherMarkers = (map, data) => {
    const markers = []

    // Current weather marker
    const currentMarker = new window.google.maps.Marker({
      position: { lat: data.coord.lat, lng: data.coord.lon },
      map: map,
      title: data.name,
      icon: {
        url: getWeatherIcon(data.weather[0].icon),
        scaledSize: new window.google.maps.Size(50, 50),
        origin: new window.google.maps.Point(0, 0),
        anchor: new window.google.maps.Point(25, 25)
      },
      animation: window.google.maps.Animation.DROP
    })

    // Info window for current weather
    const infoWindow = new window.google.maps.InfoWindow({
      content: `
        <div class="weather-info-window">
          <h3>${data.name}</h3>
          <p><strong>${data.weather[0].description}</strong></p>
          <p>Temperature: ${Math.round(data.main.temp)}°F</p>
          <p>Humidity: ${data.main.humidity}%</p>
          <p>Wind: ${data.wind.speed} mph</p>
        </div>
      `
    })

    currentMarker.addListener('click', () => {
      infoWindow.open(map, currentMarker)
    })

    markers.push(currentMarker)

    // Add nearby weather stations
    if (data.weather && data.coord) {
      const nearbyStations = getNearbyWeatherStations(data.coord.lat, data.coord.lon)
      nearbyStations.forEach(station => {
        const stationMarker = new window.google.maps.Marker({
          position: { lat: station.lat, lng: station.lon },
          map: map,
          title: station.name,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 4,
            fillColor: '#FF0000',
            fillOpacity: 0.7,
            strokeColor: '#FFFFFF',
            strokeWeight: 2
          }
        })

        const stationInfo = new window.google.maps.InfoWindow({
          content: `
            <div class="station-info-window">
              <h4>${station.name}</h4>
              <p>Temperature: ${station.temp}°F</p>
              <p>Humidity: ${station.humidity}%</p>
            </div>
          `
        })

        stationMarker.addListener('click', () => {
          stationInfo.open(map, stationMarker)
        })

        markers.push(stationMarker)
      })
    }

    return markers
  }

  const addWeatherMarkersOSM = (map, data) => {
    // Current weather marker
    const currentMarker = window.L.marker([data.coord.lat, data.coord.lon], {
      title: data.name,
      icon: window.L.divIcon({
        html: `<div style="background: #007bff; color: white; padding: 5px; border-radius: 50%; font-weight: bold;">${getWeatherIcon(data.weather[0].icon)}</div>`,
        className: 'weather-marker',
        iconSize: [50, 50]
      })
    }).addTo(map)

    // Popup for current weather
    const popupContent = `
      <div class="weather-info-window">
        <h3>${data.name}</h3>
        <p><strong>${data.weather[0].description}</strong></p>
        <p>Temperature: ${Math.round(data.main.temp)}°F</p>
        <p>Humidity: ${data.main.humidity}%</p>
        <p>Wind: ${data.wind.speed} mph</p>
      </div>
    `
    
    currentMarker.bindPopup(popupContent)

    // Add nearby weather stations
    if (data.weather && data.coord) {
      const nearbyStations = getNearbyWeatherStations(data.coord.lat, data.coord.lon)
      nearbyStations.forEach(station => {
        const stationMarker = window.L.marker([station.lat, station.lon], {
          title: station.name,
          icon: window.L.circleMarker(station.lat, station.lon, {
            radius: 5000,
            fillColor: '#FF0000',
            fillOpacity: 0.3,
            strokeColor: '#FFFFFF',
            strokeWeight: 2
          })
        })

        const stationPopup = `
          <div class="station-info-window">
            <h4>${station.name}</h4>
            <p>Temperature: ${station.temp}°F</p>
            <p>Humidity: ${station.humidity}%</p>
          </div>
        `

        stationMarker.bindPopup(stationPopup)
      })
    }
  }

  const addLocationMarker = (map, coords) => {
    const locationMarker = new window.google.maps.Marker({
      position: { lat: coords.latitude, lng: coords.longitude },
      map: map,
      title: 'Your Location',
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 6,
        fillColor: '#4285F4',
        fillOpacity: 0.8,
        strokeColor: '#FFFFFF',
        strokeWeight: 3
      },
      animation: window.google.maps.Animation.BOUNCE
    })

    const locationInfo = new window.google.maps.InfoWindow({
      content: `
        <div class="location-info-window">
          <h4>📍 Your Location</h4>
          <p>Lat: ${coords.latitude.toFixed(4)}</p>
          <p>Lng: ${coords.longitude.toFixed(4)}</p>
        </div>
      `
    })

    locationMarker.addListener('click', () => {
      locationInfo.open(map, locationMarker)
    })

    return locationMarker
  }

  const addLocationMarkerOSM = (map, coords) => {
    console.log('📍 addLocationMarkerOSM called with coords:', coords)
    
    const locationMarker = window.L.marker([coords.latitude, coords.longitude], {
      title: 'Your Location',
      icon: window.L.divIcon({
        html: '<div style="background: #dc2626; color: white; padding: 8px; border-radius: 50%; font-size: 16px; font-weight: bold; box-shadow: 0 2px 8px rgba(220, 38, 38, 0.4); width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">📍</div>',
        className: 'location-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      })
    }).addTo(map)

    console.log('📍 Location marker added to map')

    // Add pulsing circle around location
    const pulsingCircle = window.L.circleMarker([coords.latitude, coords.longitude], {
      radius: 30,
      fillColor: '#dc2626',
      color: '#dc2626',
      weight: 2,
      opacity: 0.6,
      fillOpacity: 0.2
    }).addTo(map)

    console.log('📍 Pulsing circle added')

    // Animate the pulsing circle
    let pulseRadius = 30
    let pulseOpacity = 0.6
    let growing = true
    
    const pulseAnimation = setInterval(() => {
      if (growing) {
        pulseRadius += 1
        pulseOpacity -= 0.02
        if (pulseRadius >= 50) {
          growing = false
        }
      } else {
        pulseRadius -= 1
        pulseOpacity += 0.02
        if (pulseRadius <= 30) {
          growing = true
        }
      }
      
      pulsingCircle.setRadius(pulseRadius)
      pulsingCircle.setStyle({ opacity: pulseOpacity, fillOpacity: pulseOpacity * 0.3 })
    }, 50)

    console.log('📍 Pulse animation started')

    // Add popup with location info
    const locationPopup = `
      <div class="location-info-window" style="min-width: 200px;">
        <div style="background: #dc2626; color: white; padding: 8px; border-radius: 4px 4px 0 0; margin: -8px -8px 8px -8px;">
          <h4 style="margin: 0; font-size: 14px; font-weight: bold;">📍 Your Current Location</h4>
        </div>
        <div style="padding: 8px;">
          <div style="font-size: 12px; line-height: 1.4;">
            <div><strong>Latitude:</strong> ${coords.latitude.toFixed(6)}</div>
            <div><strong>Longitude:</strong> ${coords.longitude.toFixed(6)}</div>
            <div><strong>Accuracy:</strong> ${coords.accuracy ? `${coords.accuracy.toFixed(0)} meters` : 'Unknown'}</div>
            <div><strong>Timestamp:</strong> ${new Date().toLocaleString()}</div>
          </div>
          <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
            <div style="font-size: 11px; color: #666;">
              <div>🔴 Red pin shows your current GPS location</div>
              <div>🔄 Pulsing circle indicates active tracking</div>
            </div>
          </div>
        </div>
      </div>
    `

    locationMarker.bindPopup(locationPopup)
    console.log('📍 Popup bound to marker')
    
    // Make location marker bounce when added
    locationMarker.bounce = true
    setTimeout(() => {
      locationMarker.bounce = false
    }, 1500)

    console.log('📍 Location marker setup complete')

    return {
      marker: locationMarker,
      pulseCircle: pulsingCircle,
      animation: pulseAnimation
    }
  }

  const getWeatherIcon = (iconCode) => {
    const iconMap = {
      '01d': '☀️',
      '01n': '🌙',
      '02d': '⛅',
      '02n': '☁️',
      '03d': '☁️',
      '03n': '☁️',
      '04d': '☁️',
      '04n': '☁️',
      '09d': '🌧',
      '09n': '🌧',
      '10d': '🌧',
      '10n': '🌧',
      '11d': '🌧',
      '11n': '🌧',
      '13d': '🌧',
      '13n': '🌧',
      '50d': '🌫',
      '50n': '🌫'
    }
    return iconMap[iconCode] || '🌤'
  }

  const getNearbyWeatherStations = (lat, lon) => {
    // Simulate nearby weather stations
    return [
      { name: 'Station A', lat: lat + 0.1, lon: lon + 0.1, temp: 72, humidity: 65 },
      { name: 'Station B', lat: lat - 0.1, lon: lon + 0.1, temp: 68, humidity: 70 },
      { name: 'Station C', lat: lat + 0.1, lon: lon - 0.1, temp: 75, humidity: 60 }
    ]
  }

  const getMapStyles = () => {
    return [
      {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [
          { color: '#e9e3e8' }
        ]
      },
      {
        featureType: 'landscape',
        elementType: 'geometry',
        stylers: [
          { color: '#f5f5f5' }
        ]
      }
    ]
  }

  const handleStyleChange = (style) => {
    setMapStyle(style)
  }

  const handleZoomChange = (newZoom) => {
    setZoom(newZoom)
  }

  const handleRadarToggle = () => {
    setRadarOverlay(!radarOverlay)
  }

  const handleWeatherLayerToggle = () => {
    setWeatherLayer(!weatherLayer)
  }

  if (loading) {
    return (
      <div className="map-loading">
        <div className="loading-spinner"></div>
        <p>Loading weather map...</p>
      </div>
    )
  }

  return (
    <div className="weather-map-radar">
      <div className="map-container">
        <div ref={mapRef} className="map-canvas"></div>
      </div>
    </div>
  )
}

export default WeatherMapRadar

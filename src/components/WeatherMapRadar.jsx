import React, { useState, useEffect, useRef, useCallback } from 'react'
import './WeatherMapRadar.css'

const WeatherMapRadar = ({ weatherData, coordinates, onLocationChange }) => {
  const [mapCenter, setMapCenter] = useState({ lat: 40.7128, lng: -74.0060 })
  const [zoom, setZoom] = useState(10)
  const [mapStyle, setMapStyle] = useState('roadmap')
  const [radarOverlay, setRadarOverlay] = useState(true)
  const [weatherLayer, setWeatherLayer] = useState(true)
  const [loading, setLoading] = useState(true)
  const [spcOutlook, setSpcOutlook] = useState(null)
  const [weatherAlerts, setWeatherAlerts] = useState([])
  const [loadingSpc, setLoadingSpc] = useState(true)
  const [radarError, setRadarError] = useState(null)
  const [radarStatus, setRadarStatus] = useState('initializing')
  const [activeRadarLayers, setActiveRadarLayers] = useState([])
  const mapRef = useRef(null)

  // Original working radar setup - RESTORED
  useEffect(() => {
    const fetchSPCOutlook = async () => {
      try {
        setLoadingSpc(true)
        console.log('🌪 Fetching SPC Outlook data...')
        
        // Original SPC URL fetching - RESTORED
        const today = new Date()
        const dateStr = today.getFullYear() + 
          String(today.getMonth() + 1).padStart(2, '0') + 
          String(today.getDate()).padStart(2, '0')
        
        console.log('🌪️ Trying SPC URL for date:', dateStr)
        
        // Try multiple SPC URLs - ORIGINAL APPROACH
        const spcUrls = [
          `https://www.spc.noaa.gov/products/outlook/day1/otlk_${dateStr}.geojson`,
          `https://www.spc.noaa.gov/products/outlook/day1/otlk_${dateStr}.json`,
          `https://www.spc.noaa.gov/products/outlook/day1/otlk_lyn.json`,
          'https://www.spc.noaa.gov/products/outlook/day1/otlk_lyn.json'
        ]
        
        let data = null
        for (const url of spcUrls) {
          try {
            console.log('🌪️ Trying SPC URL:', url)
            const response = await fetch(url)
            if (response.ok) {
              data = await response.json()
              console.log('🌪️ SPC data loaded successfully from:', url)
              break
            }
          } catch (error) {
            console.log('🌪️ SPC URL failed:', url, error.message)
          }
        }
        
        if (data) {
          setSpcOutlook(data)
        } else {
          console.log('🌪️ All SPC URLs failed, using null')
          setSpcOutlook(null)
        }
        setLoadingSpc(false)
        
        // Fetch active weather alerts
        const alertsResponse = await fetch('https://api.weather.gov/alerts/active')
        if (alertsResponse.ok) {
          const alertsData = await alertsResponse.json()
          console.log('⚠️ Weather Alerts:', alertsData)
          setWeatherAlerts(alertsData.features || [])
        }
        
        // Fetch NWS radar data for current location
        if (coordinates) {
          const radarResponse = await fetch(`https://api.weather.gov/radar/stations`)
          if (radarResponse.ok) {
            const radarData = await radarResponse.json()
            console.log('📡️ NWS Radar Stations:', radarData)
          }
        }
        
      } catch (error) {
        console.error('❌ Error fetching weather channel data:', error)
      } finally {
        setLoadingSpc(false)
      }
    }
    
    fetchSPCOutlook()
  }, [coordinates])

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

  // Load map script - ONLY ONCE with balanced prevention
  useEffect(() => {
    // Prevent multiple script loads, but allow map initialization
    if (window.leafletScriptLoaded || document.querySelector('script[src*="leaflet"]')) {
      console.log('🗺️ Leaflet script already loaded, checking map initialization...')
      // If script is loaded but map doesn't exist, initialize it
      setTimeout(() => {
        if (mapRef.current && !mapRef.current._leaflet_map && window.L) {
          console.log('🗺️ Script loaded but no map, initializing now...')
          initializeOpenStreetMap()
        }
      }, 100)
      return
    }
    
    // Set script loading flag
    window.leafletScriptLoaded = true
    
    console.log('🗺️ Loading Leaflet script for the first time...')
    
    // Try to load Leaflet for OpenStreetMap (more reliable)
    const leafletScript = document.createElement('script')
    leafletScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    leafletScript.async = true
    leafletScript.onload = () => {
      console.log('✅ Leaflet loaded successfully')
      setLoading(false)
      // Wait for DOM to be ready before initializing map
      setTimeout(() => {
        if (mapRef.current && mapRef.current.offsetHeight > 0 && !mapRef.current._leaflet_map) {
          initializeOpenStreetMap()
        } else {
          console.log('🔄 Map container not ready, retrying...')
          setTimeout(() => {
            if (mapRef.current && mapRef.current.offsetHeight > 0 && !mapRef.current._leaflet_map) {
              initializeOpenStreetMap()
            } else {
              console.log('❌ Map container still not available')
              setLoading(false)
              initializeStreetMapWithRadar()
            }
          }, 1000)
        }
      }, 100)
    }
    leafletScript.onerror = () => {
      console.error('❌ Failed to load Leaflet')
      setLoading(false)
      // Reset flag on error
      window.leafletScriptLoaded = false
      // Fallback to street map with radar
      initializeStreetMapWithRadar()
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
      // Reset flag on cleanup
      window.leafletScriptLoaded = false
    }
  }, []) // Empty dependency array - only run once

  // Street map with radar overlay - FULL SCREEN WIDTH, ANTI-SHRINK
  const initializeStreetMapWithRadar = () => {
    console.log('🗺️ Initializing full-width street map with radar...')
    
    if (mapRef.current) {
      // Clear container
      mapRef.current.innerHTML = ''
      
      // Add full-width map container class
      mapRef.current.className = 'map-container'
      
      // Create map wrapper
      const mapWrapper = document.createElement('div')
      mapWrapper.className = 'map-wrapper'
      mapWrapper.id = 'mobile-pc-street-map'
      mapWrapper.style.width = '100%'
      mapWrapper.style.height = '100%'
      mapWrapper.style.position = 'relative'
      mapWrapper.style.touchAction = 'none' // Better mobile touch support
      mapRef.current.appendChild(mapWrapper)
      
      // Initialize Leaflet map with mobile-optimized street tiles
      const map = window.L.map(mapWrapper, {
        center: [mapCenter?.lat || 40.7128, mapCenter?.lng || -74.0060],
        zoom: zoom || 10,
        zoomControl: true,
        attributionControl: false, // Completely disabled attribution
        // Mobile optimizations
        tap: true, // Enable tap events for mobile
        touchZoom: true, // Enable pinch-to-zoom
        scrollWheelZoom: true, // Enable mouse wheel zoom
        doubleClickZoom: true, // Enable double-click zoom
        boxZoom: true, // Enable box zoom
        keyboard: true, // Enable keyboard navigation
        dragging: true, // Enable dragging
        // Performance optimizations
        updateWhenIdle: true, // Only update when idle
        updateWhenZooming: false, // Don't update while zooming
        preferCanvas: false, // Use DOM for better mobile performance
        fadeAnimation: true, // Enable fade animations
        markerZoomAnimation: true, // Enable marker zoom animations
        transform3DLimit: 8388607, // Enable 3D transforms for better performance
        zoomAnimation: true, // Enable zoom animations
        zoomAnimationThreshold: 4 // Only animate zoom for significant changes
      })
      
      // Add resize handler to prevent shrinking
      const handleResize = () => {
        console.log('🔄 Handling window resize to prevent map shrinking...')
        setTimeout(() => {
          if (map && map.invalidateSize) {
            map.invalidateSize()
          }
          // Force map container to stay full size
          if (mapRef.current) {
            mapRef.current.style.width = '100vw !important'
            mapRef.current.style.height = '100vh !important'
          }
        }, 100)
      }
      
      // Add resize listeners
      window.addEventListener('resize', handleResize)
      window.addEventListener('orientationchange', handleResize)
      
      // Store resize handler for cleanup
      window._mapResizeHandler = handleResize
      
      // Add CartoDB Positron tiles - MOBILE & PC OPTIMIZED
      const streetLayer = window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '', // Empty attribution to remove any text
        maxZoom: 19,
        minZoom: 1,
        // Mobile performance optimizations
        updateWhenIdle: true,
        updateWhenZooming: false,
        detectRetina: false, // Disabled for mobile performance
        keepBuffer: 2, // Reduced buffer for mobile
        edgeBufferTiles: 1, // Reduced edge buffer
        bounds: [[-85, -180], [85, 180]], // World bounds
        noWrap: true, // Prevent world wrapping for mobile
        continuousWorld: false, // Disable continuous world
        tileSize: 256, // Standard tile size
        subdomains: 'abcd', // Load balance across subdomains
        errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
      }).addTo(map)
      
      // Add NEXRAD radar overlay
      addNexradRadarOverlay(map)
      
      // Add severe weather alert polygons
      addSevereWeatherPolygons(map)
      
      // Add location marker
      if (coordinates) {
        addLocationMarkerOSM(map, coordinates)
      }
      
      // Add mobile touch controls
      if (window.L.control && window.L.control.touchZoom) {
        window.L.control.touchZoom().addTo(map)
      }
      
      // Initial resize to ensure full size
      setTimeout(() => {
        handleResize()
      }, 500)
      
      console.log('✅ Full-width mobile & PC optimized street map with radar initialized')
    }
  }

  // Add NEXRAD radar overlay - IEM NEXRAD
  const addNexradRadarOverlay = (map) => {
    console.log('🛡️ Adding IEM NEXRAD radar overlay...')
    
    // Use IEM NEXRAD radar - OFFICIAL IEM SOURCE
    const nexradLayer = window.L.tileLayer('https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png', {
      attribution: '', // NO ATTRIBUTION - removes any email/text
      opacity: 0.7, // Reduced opacity for better performance
      maxZoom: 12, // Reduced max zoom for performance
      minZoom: 3, // Increased min zoom for performance
      updateWhenIdle: true, // Only update when idle - PERFORMANCE
      updateWhenZooming: false, // Don't update while zooming - PERFORMANCE
      crossOrigin: true,
      detectRetina: false, // Disabled for performance
      timeout: 3000, // Reduced timeout for faster response
      retry: 1, // Reduced retries for faster loading
      tms: false, // Correct format - NO ISSUES
      keepBuffer: 1, // Minimal buffer for performance
      edgeBufferTiles: 1, // Minimal edge buffer for performance
      noWrap: true, // Prevent world wrapping
      continuousWorld: false, // Disable continuous world
      bounds: [[-85, -180], [85, 180]] // World bounds
    })
    
    nexradLayer.on('tileload', () => {
      console.log('✅ IEM NEXRAD radar tile loaded successfully')
    })
    
    nexradLayer.on('tileerror', (error) => {
      console.error('❌ IEM NEXRAD radar tile error:', error)
      // Try backup NEXRAD source if primary fails
      tryBackupNexrad(map)
    })
    
    nexradLayer.addTo(map)
    
    // NO radar status indicator - CLEAN UI
    return nexradLayer
  }

  // Backup NEXRAD source - OPTIMIZED
  const tryBackupNexrad = (map) => {
    console.log('🔄 Trying backup NEXRAD source...')
    
    // Try RainViewer NEXRAD as backup - OPTIMIZED URL
    const backupNexrad = window.L.tileLayer('https://tile.rainviewer.com/v2/radar/{z}/{x}/{y}/256/0_0.png', {
      attribution: '', // NO ATTRIBUTION - removes any email/text
      opacity: 0.7, // Reduced opacity for better performance
      maxZoom: 12, // Reduced max zoom for performance
      minZoom: 3, // Increased min zoom for performance
      timeout: 3000, // Reduced timeout for faster response
      retry: 1, // Reduced retries for faster loading
      tms: false, // Correct format - NO ISSUES
      noWrap: true, // Prevent world wrapping
      continuousWorld: false, // Disable continuous world
      bounds: [[-85, -180], [85, 180]] // World bounds
    })
    
    backupNexrad.on('tileload', () => {
      console.log('✅ Backup NEXRAD radar loaded successfully')
    })
    
    backupNexrad.on('tileerror', (error) => {
      console.error('❌ Backup NEXRAD failed:', error)
      // Try final NEXRAD source
      tryFinalNexrad(map)
    })
    
    backupNexrad.addTo(map)
    
    return backupNexrad
  }

  // Final NEXRAD source - OPTIMIZED
  const tryFinalNexrad = (map) => {
    console.log('🔄 Trying final NEXRAD source...')
    
    // Try Ventusky NEXRAD as final backup - OPTIMIZED URL
    const finalNexrad = window.L.tileLayer('https://tiles.ventusky.com/precipitation/{z}/{x}/{y}.png', {
      attribution: '', // NO ATTRIBUTION - removes any email/text
      opacity: 0.7, // Reduced opacity for better performance
      maxZoom: 12, // Reduced max zoom for performance
      minZoom: 3, // Increased min zoom for performance
      timeout: 3000, // Reduced timeout for faster response
      retry: 1, // Reduced retries for faster loading
      tms: false, // Correct format - NO ISSUES
      noWrap: true, // Prevent world wrapping
      continuousWorld: false, // Disable continuous world
      bounds: [[-85, -180], [85, 180]] // World bounds
    })
    
    finalNexrad.on('tileload', () => {
      console.log('✅ Final NEXRAD radar loaded successfully')
    })
    
    finalNexrad.on('tileerror', (error) => {
      console.error('❌ All NEXRAD sources failed:', error)
    })
    
    finalNexrad.addTo(map)
    
    return finalNexrad
  }

  // Add severe weather polygons to street map
  const addSevereWeatherPolygons = async (map) => {
    console.log('🌪️ Adding severe weather polygons...')
    
    try {
      // Fetch real NWS alerts
      const response = await fetch('https://api.weather.gov/alerts/active')
      if (response.ok) {
        const alertsData = await response.json()
        console.log('⚠️ Loaded NWS alerts:', alertsData.features.length)
        
        // Create layer group for alerts
        const alertLayer = window.L.layerGroup().addTo(map)
        
        alertsData.features.forEach((alert, index) => {
          if (alert.geometry && alert.geometry.coordinates) {
            try {
              // Convert coordinates to Leaflet format
              const coords = alert.geometry.coordinates[0].map(coord => [coord[1], coord[0]])
              
              // Determine color based on severity
              let color = '#00ff00' // Default green
              let fillColor = 'rgba(0, 255, 0, 0.3)'
              
              const severity = alert.properties.severity || 'unknown'
              const event = alert.properties.event || ''
              
              // Better severity classification
              if (event.includes('Tornado Warning') || event.includes('Severe Thunderstorm Warning') || 
                  event.includes('Flash Flood Warning') || event.includes('Blizzard Warning')) {
                color = '#ff0000'
                fillColor = 'rgba(255, 0, 0, 0.2)' // Less opacity for better visibility
              } else if (event.includes('Warning')) {
                color = '#ff6600'
                fillColor = 'rgba(255, 102, 0, 0.2)'
              } else if (event.includes('Watch')) {
                color = '#ffff00'
                fillColor = 'rgba(255, 255, 0, 0.15)'
              } else if (event.includes('Advisory')) {
                color = '#ff8800'
                fillColor = 'rgba(255, 136, 0, 0.15)'
              }
              
              // Create polygon with better styling
              const polygon = window.L.polygon(coords, {
                color: color,
                fillColor: fillColor,
                fillOpacity: 0.15, // Reduced opacity
                weight: 2,
                opacity: 0.8,
                smoothFactor: 1
              })
              
              // Add popup with alert info
              if (alert.properties) {
                const popupContent = `
                  <div style="padding: 8px; max-width: 300px;">
                    <h4 style="margin: 0 0 8px 0; color: ${color}; font-size: 14px;">${alert.properties.event || 'Weather Alert'}</h4>
                    <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: bold;">${alert.properties.headline || 'No headline'}</p>
                    <p style="margin: 0 0 8px 0; font-size: 11px; opacity: 0.8;">
                      <strong>Severity:</strong> ${severity}<br>
                      <strong>Areas:</strong> ${alert.properties.areaDesc || 'Unknown area'}
                    </p>
                    <p style="margin: 0; font-size: 10px; opacity: 0.6;">Click polygon for more details</p>
                  </div>
                `
                polygon.bindPopup(popupContent)
                
                // Add hover effect
                polygon.on('mouseover', function(e) {
                  this.setStyle({
                    fillOpacity: 0.3,
                    weight: 3
                  })
                })
                
                polygon.on('mouseout', function(e) {
                  this.setStyle({
                    fillOpacity: 0.15,
                    weight: 2
                  })
                })
              }
              
              polygon.addTo(alertLayer)
              
              console.log(`✅ Added alert polygon: ${alert.properties.event || 'Unknown'}`)
              
            } catch (error) {
              console.error('❌ Error processing alert polygon:', error, alert.properties?.event)
              // Continue with other alerts even if one fails
            }
          }
        })
        
        console.log(`✅ Successfully added ${alertsData.features.length} weather alert polygons`)
        
      } else {
        console.warn('⚠️ Failed to fetch NWS alerts:', response.status)
      }
    } catch (error) {
      console.error('❌ Error loading severe weather alerts:', error)
      // Don't show sample polygons on error - just log it
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

  // Initialize map - ONLY ONCE
  useEffect(() => {
    if (!mapRef.current || !window.L) return

    // Check if map is already initialized
    if (mapRef.current._leaflet_map || mapRef.current._leaflet_id) {
      console.log('🗺️ Map already initialized, skipping')
      return
    }

    console.log('🗺️ Initializing map...')
    // Initialize OpenStreetMap with Leaflet
    initializeOpenStreetMap()
  }, []) // Empty dependency array - only run once

  const initializeOpenStreetMap = () => {
    try {
      console.log('🗺️ Initializing full-width mobile & PC optimized OpenStreetMap...')
      
      // Check if container exists
      const container = mapRef.current
      if (!container) {
        console.error('🗺️ Map container not found')
        setLoading(false)
        return
      }

      // Only prevent if map already exists in this container
      if (container._leaflet_map) {
        console.log('🗺️ Map already exists in container, skipping')
        setLoading(false)
        return
      }

      // Clear any existing map
      if (container._leaflet_map) {
        container._leaflet_map.remove()
        container._leaflet_map = null
      }

      // Add full-width map container class
      container.className = 'map-container'

      // Validate coordinates
      const lat = mapCenter?.lat || 40.7128
      const lng = mapCenter?.lng || -74.0060
      
      if (lat === undefined || lng === undefined || isNaN(lat) || isNaN(lng)) {
        console.error('🗺️ Invalid coordinates:', { lat, lng, mapCenter })
        setLoading(false)
        return
      }

      console.log('🗺️ Initializing full-width map with coordinates:', { lat, lng })

      // Initialize Leaflet map with full width and mobile optimizations
      const map = window.L.map(container, {
        center: [lat, lng],
        zoom: zoom || 10,
        zoomControl: true,
        attributionControl: false,
        // Mobile optimizations
        tap: true, // Enable tap events for mobile
        touchZoom: true, // Enable pinch-to-zoom
        scrollWheelZoom: true, // Enable mouse wheel zoom
        doubleClickZoom: true, // Enable double-click zoom
        boxZoom: true, // Enable box zoom
        keyboard: true, // Enable keyboard navigation
        dragging: true, // Enable dragging
        // Performance optimizations
        updateWhenIdle: true, // Only update when idle
        updateWhenZooming: false, // Don't update while zooming
        preferCanvas: false, // Use DOM for better mobile performance
        fadeAnimation: true, // Enable fade animations
        markerZoomAnimation: true, // Enable marker zoom animations
        transform3DLimit: 8388607, // Enable 3D transforms for better performance
        zoomAnimation: true, // Enable zoom animations
        zoomAnimationThreshold: 4 // Only animate zoom for significant changes
      })

      // Store map reference for cleanup
      container._leaflet_map = map

      console.log('🗺️ Full-width Leaflet map created successfully')

      // Add CartoDB Positron tiles - MOBILE & PC OPTIMIZED
      const osmLayer = window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '', // Empty attribution to remove any text
        maxZoom: 19,
        minZoom: 1,
        // Mobile performance optimizations
        updateWhenIdle: true,
        updateWhenZooming: false,
        detectRetina: false, // Disabled for mobile performance
        keepBuffer: 2, // Reduced buffer for mobile
        edgeBufferTiles: 1, // Reduced edge buffer
        bounds: [[-85, -180], [85, 180]], // World bounds
        noWrap: true, // Prevent world wrapping for mobile
        continuousWorld: false, // Disable continuous world
        tileSize: 256, // Standard tile size
        subdomains: 'abcd', // Load balance across subdomains
        errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
      }).addTo(map)

      console.log('🗺️ Full-width mobile & PC optimized street tiles added')

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

      // Add mobile touch controls
      if (window.L.control && window.L.control.touchZoom) {
        window.L.control.touchZoom().addTo(map)
      }

      setLoading(false)
      console.log('🗺️ Full-width mobile & PC optimized OpenStreetMap initialization complete')

    } catch (error) {
      console.error('🗺️ Error initializing OpenStreetMap:', error)
      setLoading(false)
    }
  }

  // IEM NEXRAD radar layers - OFFICIAL IEM SOURCE
  const addRadarLayersOSM = (map) => {
    try {
      console.log('🛡️ Adding IEM NEXRAD radar layers...')
      let radarLayersLoaded = 0
      
      // Primary IEM NEXRAD radar - OFFICIAL IEM SOURCE
      const nexradPrimary = window.L.tileLayer('https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png', {
        attribution: '', // NO ATTRIBUTION - removes any email/text
        opacity: 0.7, // Reduced opacity for better performance
        maxZoom: 12, // Reduced max zoom for performance
        minZoom: 3, // Increased min zoom for performance
        errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        updateWhenIdle: true, // Only update when idle - PERFORMANCE
        updateWhenZooming: false, // Don't update while zooming - PERFORMANCE
        crossOrigin: true,
        detectRetina: false, // Disabled for performance
        timeout: 3000, // Reduced timeout for faster response
        retry: 1, // Reduced retries for faster loading
        tms: false, // Correct format - NO ISSUES
        keepBuffer: 1, // Minimal buffer for performance
        edgeBufferTiles: 1, // Minimal edge buffer for performance
        noWrap: true, // Prevent world wrapping
        continuousWorld: false, // Disable continuous world
        bounds: [[-85, -180], [85, 180]] // World bounds
      })
      
      nexradPrimary.on('tileload', () => {
        if (radarLayersLoaded === 0) {
          radarLayersLoaded = 1
          console.log('✅ IEM NEXRAD radar loaded successfully')
          setRadarStatus('active')
          setActiveRadarLayers(['IEM NEXRAD'])
          setRadarError(null)
        }
      })
      
      nexradPrimary.on('tileerror', () => {
        console.warn('⚠️ Primary IEM NEXRAD failed, trying backup...')
        // Try RainViewer NEXRAD as backup - OPTIMIZED
        const rainviewerBackup = window.L.tileLayer('https://tile.rainviewer.com/v2/radar/{z}/{x}/{y}/256/0_0.png', {
          attribution: '', // NO ATTRIBUTION
          opacity: 0.7, // Reduced opacity for better performance
          maxZoom: 12, // Reduced max zoom for performance
          minZoom: 3, // Increased min zoom for performance
          timeout: 3000, // Reduced timeout for faster response
          retry: 1, // Reduced retries for faster loading
          tms: false, // Correct format - NO ISSUES
          noWrap: true, // Prevent world wrapping
          continuousWorld: false, // Disable continuous world
          bounds: [[-85, -180], [85, 180]] // World bounds
        })
        
        rainviewerBackup.on('tileload', () => {
          if (radarLayersLoaded === 0) {
            radarLayersLoaded = 1
            console.log('✅ Backup NEXRAD radar loaded successfully')
            setRadarStatus('active')
            setActiveRadarLayers(['RainViewer NEXRAD'])
            setRadarError(null)
          }
        })
        
        rainviewerBackup.on('tileerror', () => {
          console.warn('⚠️ Backup NEXRAD failed, trying final...')
          // Try Ventusky NEXRAD as final backup - OPTIMIZED
          const ventuskyBackup = window.L.tileLayer('https://tiles.ventusky.com/precipitation/{z}/{x}/{y}.png', {
            attribution: '', // NO ATTRIBUTION
            opacity: 0.7, // Reduced opacity for better performance
            maxZoom: 12, // Reduced max zoom for performance
            minZoom: 3, // Increased min zoom for performance
            timeout: 3000, // Reduced timeout for faster response
            retry: 1, // Reduced retries for faster loading
            tms: false, // Correct format - NO ISSUES
            noWrap: true, // Prevent world wrapping
            continuousWorld: false, // Disable continuous world
            bounds: [[-85, -180], [85, 180]] // World bounds
          })
          
          ventuskyBackup.on('tileload', () => {
            if (radarLayersLoaded === 0) {
              radarLayersLoaded = 1
              console.log('✅ Final NEXRAD radar loaded successfully')
              setRadarStatus('active')
              setActiveRadarLayers(['Ventusky NEXRAD'])
              setRadarError(null)
            }
          })
          
          ventuskyBackup.addTo(map)
        })
        
        rainviewerBackup.addTo(map)
      })
      
      nexradPrimary.addTo(map)
      
      // Set timeout to check if radar loads
      setTimeout(() => {
        if (radarLayersLoaded === 0) {
          console.warn('🛡️ IEM NEXRAD layers did not load within timeout period')
          setRadarStatus('failed')
          setActiveRadarLayers([])
        } else {
          console.log('✅ IEM NEXRAD radar layer loaded successfully')
        }
      }, 3000) // Reduced timeout for performance

      return {
        primary: nexradPrimary,
        layerControl: null
      }
    } catch (error) {
      console.error('🗺️ Error adding IEM NEXRAD layers:', error)
      return {
        primary: null,
        layerControl: null
      }
    }
  }

  const addActiveAlertsMarkers = (map, setMapCenter, setZoom) => {
    // Create layer group for alerts
    const alertsLayerGroup = window.L.layerGroup().addTo(map)
    
    // Fetch active weather alerts from NWS with correct endpoint
    fetch('https://api.weather.gov/alerts/active')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        return response.json()
      })
      .then(data => {
        console.log('🚨 Alerts data received:', data)
        
        if (data.features && data.features.length > 0) {
          console.log(`🚨 Processing ${data.features.length} alerts`)
          
          data.features.forEach((alert, index) => {
            console.log(`🚨 Processing alert ${index + 1}:`, alert.properties.event)
            
            if (alert.geometry && alert.geometry.coordinates) {
              const severity = alert.properties.severity ? alert.properties.severity.toLowerCase() : 'unknown'
              const event = alert.properties.event || 'Weather Alert'
              const urgency = alert.properties.urgency || 'Unknown'
              
              // Determine color based on severity
              let polygonColor, polygonOpacity
              switch (severity) {
                case 'extreme':
                  polygonColor = '#dc2626' // Red for extreme/warnings
                  polygonOpacity = 0.3
                  break
                case 'severe':
                  polygonColor = '#f59e0b' // Yellow for severe
                  polygonOpacity = 0.3
                  break
                case 'moderate':
                  polygonColor = '#ea580c' // Orange for moderate/watches
                  polygonOpacity = 0.3
                  break
                case 'minor':
                  polygonColor = '#3b82f6' // Blue for minor
                  polygonOpacity = 0.2
                  break
                default:
                  polygonColor = '#6b7280' // Gray for unknown
                  polygonOpacity = 0.2
              }

              console.log(`🚨 Alert ${event} - ${severity} - color: ${polygonColor}`)

              // Handle different geometry types
              const coords = alert.geometry.coordinates
              
              if (alert.geometry.type === 'Polygon') {
                // Polygon coordinates
                const polygonCoords = coords[0]
                const latLngs = polygonCoords.map(coord => [coord[1], coord[0]]) // Reverse [lng, lat] to [lat, lng]
                
                // Create polygon with better interactivity
                const polygon = window.L.polygon(latLngs, {
                  color: polygonColor,
                  fillColor: polygonColor,
                  fillOpacity: polygonOpacity,
                  weight: 3,
                  opacity: 0.9,
                  className: 'alert-polygon'
                }).addTo(alertsLayerGroup)

                // Add hover effect
                polygon.on('mouseover', function(e) {
                  this.setStyle({
                    weight: 5,
                    opacity: 1,
                    fillOpacity: polygonOpacity + 0.2
                  })
                })

                polygon.on('mouseout', function(e) {
                  this.setStyle({
                    weight: 3,
                    opacity: 0.9,
                    fillOpacity: polygonOpacity
                  })
                })

                // Create enhanced popup with advisory information
                const popupContent = createEnhancedAlertPopup(alert, polygonColor)
                polygon.bindPopup(popupContent)

                // Add click to center map on alert and update location
                polygon.on('click', function(e) {
                  // Calculate center of polygon
                  const bounds = polygon.getBounds()
                  const center = bounds.getCenter()
                  
                  // Center map on alert location with appropriate zoom
                  map.setView(center, 10, {
                    animate: true,
                    duration: 1.0
                  })
                  
                  // Update current location to alert area
                  const newLocation = {
                    latitude: center.lat,
                    longitude: center.lng,
                    accuracy: 1000 // 1km accuracy for alert area
                  }
                  
                  // Update map center state
                  setMapCenter({ lat: center.lat, lng: center.lng })
                  setZoom(10)
                  
                  // Update location marker if it exists
                  if (window.currentLocationMarker) {
                    window.currentLocationMarker.setLatLng([center.lat, center.lng])
                  }
                  
                  // Update location throughout the entire app with reverse geocoding
                  if (onLocationChange) {
                    // First try to get city name from alert properties
                    let locationName = null
                    if (alert.properties.areaDesc) {
                      // Extract city/town name from area description
                      const areas = alert.properties.areaDesc.split(';')
                      const firstArea = areas[0].trim()
                      // Remove county/state info, keep just the city name
                      locationName = firstArea.split(',')[0].trim()
                    }
                    
                    // If no city name from alert, do reverse geocoding
                    if (!locationName) {
                      const reverseGeocode = async () => {
                        try {
                          const apiKey = '01c50e8c663fe1d38db9f79fbedb3136'
                          const response = await fetch(
                            `https://api.openweathermap.org/geo/1.0/reverse?lat=${center.lat}&lon=${center.lng}&limit=1&appid=${apiKey}`
                          )
                          
                          if (response.ok) {
                            const data = await response.json()
                            const cityName = data[0]?.name || 'Your Location'
                            console.log('🏙️ Reverse geocoded alert area:', cityName)
                            onLocationChange(cityName)
                          } else {
                            // Fallback to coordinates if reverse geocoding fails
                            const locationString = center && center.lat && center.lng ? `${center.lat.toFixed(4)},${center.lng.toFixed(4)}` : 'Unknown location'
                            onLocationChange(locationString)
                          }
                        } catch (error) {
                          console.error('❌ Reverse geocoding failed for alert:', error)
                          // Fallback to coordinates
                          const locationString = center && center.lat && center.lng ? `${center.lat.toFixed(4)},${center.lng.toFixed(4)}` : 'Unknown location'
                          onLocationChange(locationString)
                        }
                      }
                      
                      reverseGeocode()
                    } else {
                      // Use city name from alert properties
                      console.log(`🏙️ Using alert area name: ${locationName}`)
                      onLocationChange(locationName)
                    }
                  }
                  
                  console.log(`🚨 Centered map and updated location to alert: ${event} at [${center && center.lat && center.lng ? `${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}` : 'Unknown coordinates'}]`)
                })

                console.log(`🚨 Added polygon for ${event}`)

              } else if (alert.geometry.type === 'MultiPolygon') {
                // MultiPolygon coordinates
                coords.forEach(polygonCoords => {
                  const latLngsMulti = polygonCoords[0].map(coord => [coord[1], coord[0]])
                  
                  const polygon = window.L.polygon(latLngsMulti, {
                    color: polygonColor,
                    fillColor: polygonColor,
                    fillOpacity: polygonOpacity,
                    weight: 3,
                    opacity: 0.9,
                    className: 'alert-polygon'
                  }).addTo(alertsLayerGroup)

                  // Add hover effect
                  polygon.on('mouseover', function(e) {
                    this.setStyle({
                      weight: 5,
                      opacity: 1,
                      fillOpacity: polygonOpacity + 0.2
                    })
                  })

                  polygon.on('mouseout', function(e) {
                    this.setStyle({
                      weight: 3,
                      opacity: 0.9,
                      fillOpacity: polygonOpacity
                    })
                  })

                  const popupContent = createEnhancedAlertPopup(alert, polygonColor)
                  polygon.bindPopup(popupContent)

                  // Add click to center map on alert and update location
                  polygon.on('click', function(e) {
                    const bounds = polygon.getBounds()
                    const center = bounds.getCenter()
                    
                    map.setView(center, 10, {
                      animate: true,
                      duration: 1.0
                    })
                    
                    // Update current location to alert area
                    const newLocation = {
                      latitude: center.lat,
                      longitude: center.lng,
                      accuracy: 1000
                    }
                    
                    setMapCenter({ lat: center.lat, lng: center.lng })
                    setZoom(10)
                    
                    if (window.currentLocationMarker) {
                      window.currentLocationMarker.setLatLng([center.lat, center.lng])
                    }
                    
                    // Update location throughout the entire app
                    if (onLocationChange) {
                      const locationString = center && center.lat && center.lng ? `${center.lat.toFixed(4)},${center.lng.toFixed(4)}` : 'Unknown location'
                      onLocationChange(locationString)
                      console.log(`🚨 Updated app location to: ${locationString}`)
                    }
                    
                    console.log(`🚨 Centered map and updated location to multi-polygon alert: ${event} at [${center && center.lat && center.lng ? `${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}` : 'Unknown coordinates'}]`)
                  })
                })

              } else if (alert.geometry.type === 'Point') {
                // Point coordinates
                const pointCoords = coords
                const lat = pointCoords[1]
                const lng = pointCoords[0]

                // Create circle marker for point alerts
                const circleMarker = window.L.circleMarker([lat, lng], {
                  radius: 25,
                  fillColor: polygonColor,
                  color: polygonColor,
                  weight: 3,
                  opacity: 0.9,
                  fillOpacity: polygonOpacity,
                  className: 'alert-circle'
                }).addTo(alertsLayerGroup)

                // Add hover effect
                circleMarker.on('mouseover', function(e) {
                  this.setRadius(30)
                  this.setStyle({
                    weight: 5,
                    opacity: 1,
                    fillOpacity: polygonOpacity + 0.2
                  })
                })

                circleMarker.on('mouseout', function(e) {
                  this.setRadius(25)
                  this.setStyle({
                    weight: 3,
                    opacity: 0.9,
                    fillOpacity: polygonOpacity
                  })
                })

                const popupContent = createEnhancedAlertPopup(alert, polygonColor)
                circleMarker.bindPopup(popupContent)

                // Add click to center map on alert and update location
                circleMarker.on('click', function(e) {
                  map.setView([lat, lng], 12, {
                    animate: true,
                    duration: 1.0
                  })
                  
                  // Update current location to alert area
                  const newLocation = {
                    latitude: lat,
                    longitude: lng,
                    accuracy: 500
                  }
                  
                  setMapCenter({ lat: lat, lng: lng })
                  setZoom(12)
                  
                  if (window.currentLocationMarker) {
                    window.currentLocationMarker.setLatLng([lat, lng])
                  }
                  
                  // Update location throughout the entire app
                  if (onLocationChange) {
                    const locationString = lat && lng ? `${lat.toFixed(4)},${lng.toFixed(4)}` : 'Unknown location'
                    onLocationChange(locationString)
                    console.log(`🚨 Updated app location to: ${locationString}`)
                  }
                  
                  console.log(`🚨 Centered map and updated location to point alert: ${event} at [${lat && lng ? `${lat.toFixed(4)}, ${lng.toFixed(4)}` : 'Unknown coordinates'}]`)
                })

              } else if (alert.geometry.type === 'LineString') {
                // LineString coordinates
                const lineCoords = coords.map(coord => [coord[1], coord[0]])
                
                const polyline = window.L.polyline(lineCoords, {
                  color: polygonColor,
                  weight: 6,
                  opacity: 0.9,
                  className: 'alert-line'
                }).addTo(alertsLayerGroup)

                // Add hover effect
                polyline.on('mouseover', function(e) {
                  this.setStyle({
                    weight: 8,
                    opacity: 1
                  })
                })

                polyline.on('mouseout', function(e) {
                  this.setStyle({
                    weight: 6,
                    opacity: 0.9
                  })
                })

                const popupContent = createEnhancedAlertPopup(alert, polygonColor)
                polyline.bindPopup(popupContent)

                // Add click to center map on alert and update location
                polyline.on('click', function(e) {
                  const bounds = polyline.getBounds()
                  const center = bounds.getCenter()
                  
                  map.setView(center, 11, {
                    animate: true,
                    duration: 1.0
                  })
                  
                  // Update current location to alert area
                  const newLocation = {
                    latitude: center.lat,
                    longitude: center.lng,
                    accuracy: 750
                  }
                  
                  setMapCenter({ lat: center.lat, lng: center.lng })
                  setZoom(11)
                  
                  if (window.currentLocationMarker) {
                    window.currentLocationMarker.setLatLng([center.lat, center.lng])
                  }
                  
                  // Update location throughout the entire app
                  if (onLocationChange) {
                    const locationString = center && center.lat && center.lng ? `${center.lat.toFixed(4)},${center.lng.toFixed(4)}` : 'Unknown location'
                    onLocationChange(locationString)
                    console.log(`🚨 Updated app location to: ${locationString}`)
                  }
                  
                  console.log(`🚨 Centered map and updated location to line alert: ${event} at [${center && center.lat && center.lng ? `${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}` : 'Unknown coordinates'}]`)
                })
              }
            }
          })
          
          console.log(`🚨 Successfully added ${data.features.length} alerts to map`)
        } else {
          console.log('🚨 No active alerts found')
        }
      })
      .catch(error => {
        console.error('🚨 Error fetching active alerts:', error)
        
        // Add a test alert to verify the system works
        console.log('🚨 Adding weather advisory test alert for demonstration')
        const testAlert = {
          properties: {
            event: 'Winter Weather Advisory',
            severity: 'moderate',
            urgency: 'Expected',
            headline: 'Winter Weather Advisory in Effect Until Tomorrow Morning',
            description: 'Snow accumulations of 3 to 6 inches expected. Travel could be difficult during the evening commute. Hazardous conditions could impact travel Tuesday morning and evening commutes.',
            areaDesc: 'Mount Union; Huntingdon County',
            effective: new Date().toISOString(),
            expires: new Date(Date.now() + 7200000).toISOString(), // 2 hours from now
            web: 'https://www.weather.gov',
            instruction: 'Slow down and use caution while traveling. The latest road conditions for the state you are calling from can be obtained by calling 5 1 1. Keep an extra flashlight, food, and water in your vehicle in case of an emergency.',
            certainty: 'Likely',
            sender: 'National Weather Service Test Office',
            senderName: 'NWS Test Region'
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [-77.8867, 40.3838],
              [-77.8867, 40.3938],
              [-77.8767, 40.3938],
              [-77.8767, 40.3838],
              [-77.8867, 40.3838]
            ]]
          }
        }
        
        // Process test alert
        const severity = testAlert.properties.severity
        const event = testAlert.properties.event
        const polygonColor = '#f59e0b' // Yellow for severe
        const polygonOpacity = 0.3
        
        const coords = testAlert.geometry.coordinates[0]
        const latLngs = coords.map(coord => [coord[1], coord[0]])
        
        const polygon = window.L.polygon(latLngs, {
          color: polygonColor,
          fillColor: polygonColor,
          fillOpacity: polygonOpacity,
          weight: 3,
          opacity: 0.9,
          className: 'alert-polygon'
        }).addTo(alertsLayerGroup)

        // Add hover effect
        polygon.on('mouseover', function(e) {
          this.setStyle({
            weight: 5,
            opacity: 1,
            fillOpacity: polygonOpacity + 0.2
          })
        })

        polygon.on('mouseout', function(e) {
          this.setStyle({
            weight: 3,
            opacity: 0.9,
            fillOpacity: polygonOpacity
          })
        })

        const popupContent = createEnhancedAlertPopup(testAlert, polygonColor)
        polygon.bindPopup(popupContent)

        // Add click to center map on alert and update location
        polygon.on('click', function(e) {
          const bounds = polygon.getBounds()
          const center = bounds.getCenter()
          
          map.setView(center, 10, {
            animate: true,
            duration: 1.0
          })
          
          // Update current location to alert area
          const newLocation = {
            latitude: center.lat,
            longitude: center.lng,
            accuracy: 1000
          }
          
          setMapCenter({ lat: center.lat, lng: center.lng })
          setZoom(10)
          
          if (window.currentLocationMarker) {
            window.currentLocationMarker.setLatLng([center.lat, center.lng])
          }
          
          // Update location throughout the entire app with reverse geocoding
          if (onLocationChange) {
            // First try to get city name from alert properties
            let locationName = null
            if (testAlert.properties.areaDesc) {
              // Extract city/town name from area description
              const areas = testAlert.properties.areaDesc.split(';')
              const firstArea = areas[0].trim()
              // Remove county/state info, keep just the city name
              locationName = firstArea.split(',')[0].trim()
            }
            
            // If no city name from alert, do reverse geocoding
            if (!locationName) {
              const reverseGeocode = async () => {
                try {
                  const apiKey = '01c50e8c663fe1d38db9f79fbedb3136'
                  const response = await fetch(
                    `https://api.openweathermap.org/geo/1.0/reverse?lat=${center.lat}&lon=${center.lng}&limit=1&appid=${apiKey}`
                  )
                  
                  if (response.ok) {
                    const data = await response.json()
                    const cityName = data[0]?.name || 'Your Location'
                    console.log('🏙️ Reverse geocoded test alert area:', cityName)
                    onLocationChange(cityName)
                  } else {
                    // Fallback to coordinates if reverse geocoding fails
                    const locationString = center && center.lat && center.lng ? `${center.lat.toFixed(4)},${center.lng.toFixed(4)}` : 'Unknown location'
                    onLocationChange(locationString)
                  }
                } catch (error) {
                  console.error('❌ Reverse geocoding failed for test alert:', error)
                  // Fallback to coordinates
                  const locationString = center && center.lat && center.lng ? `${center.lat.toFixed(4)},${center.lng.toFixed(4)}` : 'Unknown location'
                  onLocationChange(locationString)
                }
              }
              
              reverseGeocode()
            } else {
              // Use city name from alert properties
              console.log(`🏙️ Using test alert area name: ${locationName}`)
              onLocationChange(locationName)
            }
          }
          
          console.log(`🚨 Centered map and updated location to test alert: ${testAlert.properties.event} at [${center && center.lat && center.lng ? `${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}` : 'Unknown coordinates'}]`)
        })
        
        console.log('🚨 Test alert added to map')
      })

    // Return the layer group for control
    return alertsLayerGroup
  }

  const createEnhancedAlertPopup = (alert, color) => {
    const severity = alert.properties.severity || 'Unknown'
    const urgency = alert.properties.urgency || 'Unknown'
    const event = alert.properties.event || 'Weather Alert'
    const headline = alert.properties.headline || alert.properties.description || 'Active weather alert in this area'
    const description = alert.properties.description || 'No additional description available.'
    const areas = alert.properties.areaDesc || 'Unknown'
    const effective = alert.properties.effective ? new Date(alert.properties.effective).toLocaleString() : 'Unknown'
    const expires = alert.properties.expires ? new Date(alert.properties.expires).toLocaleString() : 'Unknown'
    const web = alert.properties.web
    const instruction = alert.properties.instruction || 'Follow standard safety precautions for this type of weather event.'
    const certainty = alert.properties.certainty || 'Unknown'

    // Determine advisory type based on event and severity
    let advisoryType = 'Weather Advisory'
    let advisoryIcon = '📋'
    
    if (event.toLowerCase().includes('watch')) {
      advisoryType = 'Weather Watch'
      advisoryIcon = '👁️'
    } else if (event.toLowerCase().includes('warning')) {
      advisoryType = 'Weather Warning'
      advisoryIcon = '⚠️'
    } else if (event.toLowerCase().includes('advisory')) {
      advisoryType = 'Weather Advisory'
      advisoryIcon = '📋'
    } else if (event.toLowerCase().includes('statement')) {
      advisoryType = 'Weather Statement'
      advisoryIcon = '📄'
    } else if (event.toLowerCase().includes('winter')) {
      advisoryType = 'Winter Weather Advisory'
      advisoryIcon = '❄️'
    } else if (event.toLowerCase().includes('heat')) {
      advisoryType = 'Heat Advisory'
      advisoryIcon = '🌡️'
    } else if (event.toLowerCase().includes('flood')) {
      advisoryType = 'Flood Advisory'
      advisoryIcon = '🌊'
    } else if (event.toLowerCase().includes('wind')) {
      advisoryType = 'Wind Advisory'
      advisoryIcon = '💨'
    } else if (event.toLowerCase().includes('fog')) {
      advisoryType = 'Fog Advisory'
      advisoryIcon = '🌫️'
    } else if (event.toLowerCase().includes('freeze')) {
      advisoryType = 'Freeze Advisory'
      advisoryIcon = '🧊'
    } else if (event.toLowerCase().includes('frost')) {
      advisoryType = 'Frost Advisory'
      advisoryIcon = '🥶'
    }

    return `
      <div class="alert-popup" style="min-width: 320px; max-width: 400px;">
        <div style="background: ${color}; color: white; padding: 10px; border-radius: 4px 4px 0 0; margin: -8px -8px 8px -8px;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <h4 style="margin: 0; font-size: 16px; font-weight: bold;">${advisoryIcon} ${event}</h4>
            <span style="background: rgba(255,255,255,0.2); padding: 2px 6px; border-radius: 12px; font-size: 12px; font-weight: bold;">${advisoryType}</span>
          </div>
        </div>
        <div style="padding: 8px;">
          <div style="background: #f8f9fa; padding: 8px; border-radius: 4px; margin-bottom: 8px;">
            <p style="margin: 0; font-size: 13px; line-height: 1.4; font-weight: 500;">${headline}</p>
          </div>
          
          <div style="font-size: 12px; line-height: 1.4; color: #333; margin-bottom: 8px;">
            <p style="margin: 0 0 8px 0;">${description}</p>
          </div>

          <div style="background: #fff3cd; border-left: 4px solid ${color}; padding: 8px; margin-bottom: 8px;">
            <div style="font-size: 11px; font-weight: bold; color: #856404; margin-bottom: 4px;">🛡️ WEATHER ADVISORY SAFETY INSTRUCTIONS:</div>
            <div style="font-size: 11px; color: #856404; line-height: 1.4;">${instruction}</div>
          </div>

          ${alert.properties.sender ? `
            <div style="background: #d1ecf1; border-left: 4px solid #17a2b8; padding: 6px; margin-bottom: 8px;">
              <div style="font-size: 10px; color: #0c5460;">
                <strong>Issued by:</strong> ${alert.properties.senderName || alert.properties.sender}
              </div>
            </div>
          ` : ''}

          <div style="font-size: 11px; color: #666; line-height: 1.4;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-bottom: 8px;">
              <div><strong>Severity:</strong> <span style="color: ${color}; font-weight: bold;">${severity.toUpperCase()}</span></div>
              <div><strong>Urgency:</strong> ${urgency}</div>
              <div><strong>Certainty:</strong> ${certainty}</div>
              <div><strong>Areas:</strong> ${areas}</div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
              <div><strong>Effective:</strong> ${effective}</div>
              <div><strong>Expires:</strong> ${expires}</div>
            </div>
          </div>
          
          ${web ? `
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb; text-align: center;">
              <a href="${web}" target="_blank" style="color: #007bff; text-decoration: none; font-size: 12px; display: inline-block; padding: 4px 12px; border: 1px solid #007bff; border-radius: 4px; transition: background-color 0.2s;">
                🔗 View Full Weather Advisory Details →
              </a>
            </div>
          ` : ''}
        </div>
      </div>
    `
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
          <p>Lat: ${coords && coords.latitude ? coords.latitude.toFixed(4) : 'Unknown'}</p>
          <p>Lng: ${coords && coords.longitude ? coords.longitude.toFixed(4) : 'Unknown'}</p>
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
    
    // Ensure we have valid coordinates
    const lat = coords.latitude || coords.lat || mapCenter.lat
    const lng = coords.longitude || coords.lng || mapCenter.lng
    
    console.log('📍 Using coordinates:', { lat, lng })
    
    const locationMarker = window.L.marker([lat, lng], {
      title: 'Your Location',
      icon: window.L.divIcon({
        html: '<div style="background: #dc2626; color: white; padding: 8px; border-radius: 50%; font-size: 16px; font-weight: bold; box-shadow: 0 2px 8px rgba(220, 38, 38, 0.4); width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">📍</div>',
        className: 'location-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      })
    }).addTo(map)

    // Store marker globally for updates
    window.currentLocationMarker = locationMarker

    console.log('📍 Location marker added to map')

    // Add pulsing circle around location
    const pulsingCircle = window.L.circleMarker([lat, lng], {
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
            <div><strong>Latitude:</strong> ${lat ? lat.toFixed(6) : 'Unknown'}</div>
            <div><strong>Longitude:</strong> ${lng ? lng.toFixed(6) : 'Unknown'}</div>
            <div><strong>Accuracy:</strong> ${coords && coords.accuracy ? `${coords.accuracy.toFixed(0)} meters` : 'Unknown'}</div>
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
      {/* Radar Status Indicator */}
      <div className="radar-status-indicator" style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        background: radarStatus === 'active' ? '#16a34a' : radarStatus === 'failed' ? '#dc2626' : radarStatus === 'loading' ? '#ea580c' : '#6b7280',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '8px',
        fontSize: '12px',
        fontWeight: 'bold',
        zIndex: 1000,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        maxWidth: '250px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <span style={{ fontSize: '14px' }}>
          {radarStatus === 'active' ? '🛡️' : radarStatus === 'failed' ? '❌' : radarStatus === 'loading' ? '⏳' : '🔄'}
        </span>
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
            {radarStatus === 'active' ? 'Radar Active' : radarStatus === 'failed' ? 'Radar Failed' : radarStatus === 'loading' ? 'Loading Radar...' : 'Initializing...'}
          </div>
          {activeRadarLayers.length > 0 && (
            <div style={{ fontSize: '10px', opacity: 0.9 }}>
              Sources: {activeRadarLayers.join(', ')}
            </div>
          )}
        </div>
      </div>

      {radarError && (
        <div className="radar-error-banner" style={{
          position: 'absolute',
          top: '60px',  // Moved down to avoid status indicator
          right: '10px',
          background: '#dc2626',
          color: 'white',
          padding: '10px 15px',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 'bold',
          zIndex: 999,  // Lower than status indicator
          boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
          maxWidth: '300px'
        }}>
          ⚠️ {radarError}
          <button 
            onClick={() => setRadarError(null)}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              marginLeft: '10px',
              cursor: 'pointer'
            }}
          >
            Dismiss
          </button>
        </div>
      )}
      <div className="map-container">
        <div ref={mapRef} className="map-canvas"></div>
      </div>
    </div>
  )
}

export default WeatherMapRadar

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
  const mapRef = useRef(null)

  // Fetch SPC outlook data
  useEffect(() => {
    const fetchSPCOutlook = async () => {
      try {
        setLoadingSpc(true)
        console.log('🌪 Fetching SPC Outlook data...')
        
        // Fetch SPC Convective Outlook
        const spcResponse = await fetch('https://www.spc.noaa.gov/products/outlook/day1otlk.json')
        if (spcResponse.ok) {
          const spcData = await spcResponse.json()
          console.log('🌪 SPC Outlook:', spcData)
          setSpcOutlook(spcData)
        }
        
        // Fetch active weather alerts
        const alertsResponse = await fetch('https://api.weather.gov/alerts/active?area=US')
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

  // Initialize simple map
  useEffect(() => {
    if (!window.google || !window.google.maps) {
      console.log('🗺️ Google Maps not loaded, initializing simple weather map')
      initializeSimpleMap()
      setLoading(false)
      return
    }

    const initializeMap = () => {
      if (mapRef.current) {
        const map = new window.google.maps.Map(mapRef.current, {
          center: mapCenter,
          zoom: zoom,
          styles: [
            {
              featureType: 'water',
              elementType: 'geometry',
              stylers: [{ color: '#3498db' }]
            },
            {
              featureType: 'landscape',
              elementType: 'geometry',
              stylers: [{ color: '#2c3e50' }]
            },
            {
              featureType: 'poi',
              elementType: 'geometry',
              stylers: [{ color: '#e74c3c' }]
            }
          ]
        })

        // Add weather overlay
        if (weatherLayer) {
          const weatherTileLayer = new window.google.maps.ImageMapType({
            getTileUrl: (coord, zoom) => {
              return `https://tile.openweathermap.org/map/precipitation_new/${zoom}/${coord.x}/${coord.y}.png?appid=01c50e8c663fe1d38db9f79fbedb3136`
            },
            name: 'Weather',
            alt: 'Weather tiles'
          })

          map.overlayMapTypes.insertAt(0, weatherTileLayer)
          map.setMapTypeId('weather')
        }

        // Add radar overlay
        if (radarOverlay) {
          const radarTileLayer = new window.google.maps.ImageMapType({
            getTileUrl: (coord, zoom) => {
              return `https://radar.weather.gov/ridge/standard/${zoom}/${coord.x}/${coord.y}.png`
            },
            name: 'Radar',
            alt: 'Radar tiles'
          })

          map.overlayMapTypes.insertAt(1, radarTileLayer)
        }

        // Add weather markers
        if (weatherData) {
          const infoWindow = new window.google.maps.InfoWindow()

          const marker = new window.google.maps.Marker({
            position: { lat: weatherData.coord.lat, lng: weatherData.coord.lon },
            map: map,
            title: weatherData.name
          })

          marker.addListener('click', () => {
            infoWindow.setContent(`
              <div style="padding: 10px; font-family: Arial, sans-serif;">
                <h3 style="margin: 0 0 10px 0; color: #2c3e50;">${weatherData.name}</h3>
                <p style="margin: 5px 0; color: #34495e;"><strong>Temperature:</strong> ${weatherData.main.temp}°F</p>
                <p style="margin: 5px 0; color: #34495e;"><strong>Weather:</strong> ${weatherData.weather[0].description}</p>
                <p style="margin: 5px 0; color: #34495e;"><strong>Humidity:</strong> ${weatherData.main.humidity}%</p>
                <p style="margin: 5px 0; color: #34495e;"><strong>Wind:</strong> ${weatherData.wind.speed} mph</p>
              </div>
            `)
            infoWindow.open(map, marker)
          })

          if (onLocationChange) {
            map.addListener('click', (e) => {
              const lat = e.latLng.lat()
              const lng = e.latLng.lng()
              onLocationChange({ lat, lng })
            })
          }
        }

        setLoading(false)
      }
    }

    // Load Google Maps
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        initializeMap()
      } else {
        const script = document.createElement('script')
        script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&callback=initMap`
        script.async = true
        script.defer = true
        document.head.appendChild(script)
      }
    }

    loadGoogleMaps()
  }, [mapCenter, zoom, weatherLayer, radarOverlay, weatherData])

  // Remove Google Maps styles when unmounting
  useEffect(() => {
    return () => {
      // Remove Google Maps styles
      const googleStyles = document.querySelector('style[data-google-maps]')
      if (googleStyles) {
        googleStyles.remove()
      }

      // Remove Leaflet styles
      const leafletStyles = document.querySelector('link[href*="leaflet"]')
      if (leafletStyles) {
        leafletStyles.remove()
      }
    }
  }, [])

  const initializeSimpleMap = () => {
    console.log('🗺️ Initializing weather map')
    if (mapRef.current) {
      const timestamp = new Date().getTime()
      mapRef.current.innerHTML = `
        <div style="display: flex; flex-direction: column; height: 100%; width: 100%; background: transparent; color: white; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; position: relative; overflow: hidden;" data-timestamp="${timestamp}">
          {/* REMOVE MAP HEADER - FOR FULL SCREEN */}
          
          <!-- Main Radar Display Area - FULL SCREEN -->
          <div style="flex: 1; padding: 0; display: flex; align-items: center; justify-content: center; position: relative; min-height: 100vh;">
            {/* Status Overlay - SMALLER */}
            <div style="position: absolute; top: 0.5rem; right: 0.5rem; background: rgba(0,0,0,0.7); padding: 0.5rem; border-radius: 8px; font-size: 0.7rem; z-index: 10;">
              <div style="margin-bottom: 0.25rem;">🛡️ NEXRAD Active</div>
              <div style="opacity: 0.7;">Last updated: ${new Date().toLocaleTimeString()}</div>
            </div>
            
            <!-- Large Radar Visualization - FULL SCREEN -->
            <div style="position: relative; width: 100%; height: 100%; max-width: none; max-height: none;">
              <!-- Radar Background - FULL SCREEN -->
              <div style="position: absolute; inset: 0; background: radial-gradient(circle at center, rgba(52, 152, 219, 0.1) 0%, rgba(0, 0, 0, 0.3) 50%, rgba(0, 0, 0, 0.5) 100%); border-radius: 0; transform: scale(4.0);"></div>
              
              <!-- Animated Radar Sweep - FULL SCREEN -->
              <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;">
                <div style="width: 99%; height: 99%; border: 3px solid rgba(52, 152, 219, 0.3); border-radius: 0; position: relative; animation: radar-sweep-${timestamp} 4s linear infinite;">
                  <div style="position: absolute; top: 50%; left: 50%; width: 2px; height: 60%; background: linear-gradient(to top, transparent, rgba(52, 152, 219, 0.8)); transform-origin: bottom; transform: translateX(-50%) translateY(-100%) rotate(0deg); animation: sweep-${timestamp} 2s linear infinite;"></div>
                </div>
              </div>
              
              <!-- Weather Data Grid - FULL SCREEN -->
              <div style="position: absolute; inset: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem; padding: 0; align-items: center; justify-items: center;">
                <!-- NEXRAD Radar - MUCH LARGER -->
                <div style="background: linear-gradient(135deg, #2c3e50, #34495e); padding: 6rem; border-radius: 35px; text-align: center; box-shadow: 0 25px 100px rgba(0,0,0,0.6); border: 4px solid rgba(255,255,255,0.3); transform: scale(2.2); transition: transform 0.3s ease;">
                  <div style="font-size: 15rem; margin-bottom: 3.5rem; filter: drop-shadow(0 12px 24px rgba(0,0,0,0.7)); animation: pulse-${timestamp} 2s ease-in-out infinite;">🛡️</div>
                  <div style="font-weight: 700; font-size: 5rem; margin-bottom: 2rem;">NEXRAD</div>
                  <div style="font-size: 3.5rem; opacity: 0.9;">Doppler Radar</div>
                  <div style="margin-top: 3.5rem; padding: 2rem 4rem; background: rgba(46, 204, 113, 0.5); border-radius: 50px; font-size: 3rem; color: #2ecc71; font-weight: 600;">ACTIVE</div>
                </div>
                
                <!-- Precipitation - MUCH LARGER -->
                <div style="background: linear-gradient(135deg, #3498db, #2980b9); padding: 6rem; border-radius: 35px; text-align: center; box-shadow: 0 25px 100px rgba(0,0,0,0.6); border: 4px solid rgba(255,255,255,0.3); transform: scale(2.2); transition: transform 0.3s ease;">
                  <div style="font-size: 15rem; margin-bottom: 3.5rem; filter: drop-shadow(0 12px 24px rgba(0,0,0,0.7)); animation: pulse-${timestamp} 2s ease-in-out infinite 0.5s;">💧</div>
                  <div style="font-weight: 700; font-size: 5rem; margin-bottom: 2rem;">Precipitation</div>
                  <div style="font-size: 3.5rem; opacity: 0.9;">Rain/Snow</div>
                  <div style="margin-top: 3.5rem; padding: 2rem 4rem; background: rgba(52, 152, 219, 0.5); border-radius: 50px; font-size: 3rem; color: #3498db; font-weight: 600;">ACTIVE</div>
                </div>
                
                <!-- Wind - MUCH LARGER -->
                <div style="background: linear-gradient(135deg, #16a085, #27ae60); padding: 6rem; border-radius: 35px; text-align: center; box-shadow: 0 25px 100px rgba(0,0,0,0.6); border: 4px solid rgba(255,255,255,0.3); transform: scale(2.2); transition: transform 0.3s ease;">
                  <div style="font-size: 15rem; margin-bottom: 3.5rem; filter: drop-shadow(0 12px 24px rgba(0,0,0,0.7)); animation: pulse-${timestamp} 2s ease-in-out infinite 1s;">💨</div>
                  <div style="font-weight: 700; font-size: 5rem; margin-bottom: 2rem;">Wind</div>
                  <div style="font-size: 3.5rem; opacity: 0.9;">Speed/Direction</div>
                  <div style="margin-top: 3.5rem; padding: 2rem 4rem; background: rgba(39, 174, 96, 0.5); border-radius: 50px; font-size: 3rem; color: #27ae60; font-weight: 600;">ACTIVE</div>
                </div>
                
                <!-- Clouds - MUCH LARGER -->
                <div style="background: linear-gradient(135deg, #95a5a6, #7f8c8d); padding: 6rem; border-radius: 35px; text-align: center; box-shadow: 0 25px 100px rgba(0,0,0,0.6); border: 4px solid rgba(255,255,255,0.3); transform: scale(2.2); transition: transform 0.3s ease;">
                  <div style="font-size: 15rem; margin-bottom: 3.5rem; filter: drop-shadow(0 12px 24px rgba(0,0,0,0.7)); animation: pulse-${timestamp} 2s ease-in-out infinite 1.5s;">☁️</div>
                  <div style="font-weight: 700; font-size: 5rem; margin-bottom: 2rem;">Clouds</div>
                  <div style="font-size: 3.5rem; opacity: 0.9;">Coverage</div>
                  <div style="margin-top: 3.5rem; padding: 2rem 4rem; background: rgba(149, 165, 166, 0.5); border-radius: 50px; font-size: 3rem; color: #95a5a6; font-weight: 600;">ACTIVE</div>
                </div>
                
                <!-- Temperature - MUCH LARGER -->
                <div style="background: linear-gradient(135deg, #e74c3c, #c0392b); padding: 6rem; border-radius: 35px; text-align: center; box-shadow: 0 25px 100px rgba(0,0,0,0.6); border: 4px solid rgba(255,255,255,0.3); transform: scale(2.2); transition: transform 0.3s ease;">
                  <div style="font-size: 15rem; margin-bottom: 3.5rem; filter: drop-shadow(0 12px 24px rgba(0,0,0,0.7)); animation: pulse-${timestamp} 2s ease-in-out infinite 2s;">🌡</div>
                  <div style="font-weight: 700; font-size: 5rem; margin-bottom: 2rem;">Temperature</div>
                  <div style="font-size: 3.5rem; opacity: 0.9;">Heat Map</div>
                  <div style="margin-top: 3.5rem; padding: 2rem 4rem; background: rgba(231, 76, 60, 0.5); border-radius: 50px; font-size: 3rem; color: #e74c3c; font-weight: 600;">ACTIVE</div>
                </div>
                
                <!-- Pressure - MUCH LARGER -->
                <div style="background: linear-gradient(135deg, #8e44ad, #9b59b6); padding: 6rem; border-radius: 35px; text-align: center; box-shadow: 0 25px 100px rgba(0,0,0,0.6); border: 4px solid rgba(255,255,255,0.3); transform: scale(2.2); transition: transform 0.3s ease;">
                  <div style="font-size: 15rem; margin-bottom: 3.5rem; filter: drop-shadow(0 12px 24px rgba(0,0,0,0.7)); animation: pulse-${timestamp} 2s ease-in-out infinite 2.5s;">🔵</div>
                  <div style="font-weight: 700; font-size: 5rem; margin-bottom: 2rem;">Pressure</div>
                  <div style="font-size: 3.5rem; opacity: 0.9;">Systems</div>
                  <div style="margin-top: 3.5rem; padding: 2rem 4rem; background: rgba(155, 89, 182, 0.5); border-radius: 50px; font-size: 3rem; color: #9b59b6; font-weight: 600;">ACTIVE</div>
                </div>
                
                <!-- SPC Outlook - WEATHER CHANNEL -->
                <div style="background: linear-gradient(135deg, #ff6b6b, #c92a2a); padding: 6rem; border-radius: 35px; text-align: center; box-shadow: 0 25px 100px rgba(0,0,0,0.6); border: 4px solid rgba(255,255,255,0.3); transform: scale(2.2); transition: transform 0.3s ease;">
                  <div style="font-size: 15rem; margin-bottom: 3.5rem; filter: drop-shadow(0 12px 24px rgba(0,0,0,0.7)); animation: pulse-${timestamp} 2s ease-in-out infinite 3s;">🌪</div>
                  <div style="font-weight: 700; font-size: 5rem; margin-bottom: 2rem;">SPC Outlook</div>
                  <div style="font-size: 3.5rem; opacity: 0.9;">Storm Prediction</div>
                  <div style="margin-top: 3.5rem; padding: 2rem 4rem; background: rgba(255, 107, 107, 0.5); border-radius: 50px; font-size: 3rem; color: #ff6b6b; font-weight: 600;">
                    ${loadingSpc ? 'LOADING...' : spcOutlook ? 'ACTIVE' : 'NO DATA'}
                  </div>
                </div>
                
                <!-- Weather Alerts - WEATHER CHANNEL -->
                <div style="background: linear-gradient(135deg, #ff9f43, #e67e22); padding: 6rem; border-radius: 35px; text-align: center; box-shadow: 0 25px 100px rgba(0,0,0,0.6); border: 4px solid rgba(255,255,255,0.3); transform: scale(2.2); transition: transform 0.3s ease;">
                  <div style="font-size: 15rem; margin-bottom: 3.5rem; filter: drop-shadow(0 12px 24px rgba(0,0,0,0.7)); animation: pulse-${timestamp} 2s ease-in-out infinite 3.5s;">⚠️</div>
                  <div style="font-weight: 700; font-size: 5rem; margin-bottom: 2rem;">Weather Alerts</div>
                  <div style="font-size: 3.5rem; opacity: 0.9;">Active Warnings</div>
                  <div style="margin-top: 3.5rem; padding: 2rem 4rem; background: rgba(255, 159, 67, 0.5); border-radius: 50px; font-size: 3rem; color: #ff9f43; font-weight: 600;">
                    ${weatherAlerts.length > 0 ? `${weatherAlerts.length} ALERTS` : 'NO ALERTS'}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* REMOVE MAP STATUS BAR - FOR FULL SCREEN */}
        </div>
        
        <style>
          @keyframes radar-sweep-${timestamp} {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          @keyframes sweep-${timestamp} {
            from { transform: translateX(-50%) translateY(-100%) rotate(0deg); }
            to { transform: translateX(-50%) translateY(-100%) rotate(360deg); }
          }
          
          @keyframes pulse-${timestamp} {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          
          .weather-card:hover {
            transform: scale(4.0) !important;
          }
        </style>
      `
    }
  }

  const initializeMap = useCallback(() => {
    if (!window.google || !window.google.maps) {
      console.error('Google Maps API not loaded')
      return
    }

    const map = new window.google.maps.Map(mapRef.current, {
      center: mapCenter,
      zoom: zoom,
      mapTypeId: mapStyle,
      disableDefaultUI: true,
      styles: [
        {
          featureType: 'water',
          elementType: 'geometry',
          stylers: [{ color: '#3498db' }]
        },
        {
          featureType: 'landscape',
          elementType: 'geometry',
          stylers: [{ color: '#2c3e50' }]
        },
        {
          featureType: 'poi',
          elementType: 'geometry',
          stylers: [{ color: '#e74c3c' }]
        }
      ]
    })

    // Add weather data overlay
    if (weatherData) {
      const weatherOverlay = new window.google.maps.GroundOverlay(
        `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=01c50e8c663fe1d38db9f79fbedb3136`,
        new window.google.maps.LatLngBounds(
          new window.google.maps.LatLng(-85, -180),
          new window.google.maps.LatLng(85, 180)
        ),
        100,
        {
          opacity: 0.7
        }
      )
      weatherOverlay.setMap(map)
    }

    // Add weather alerts overlay
    if (weatherData && weatherData.alerts) {
      weatherData.alerts.forEach(alert => {
        const alertOverlay = new window.google.maps.GroundOverlay(
          alert.url,
          new window.google.maps.LatLngBounds(
            new window.google.maps.LatLng(alert.bounds.southwest.lat, alert.bounds.southwest.lng),
            new window.google.maps.LatLng(alert.bounds.northeast.lat, alert.bounds.northeast.lng)
          ),
          100,
          {
            opacity: 0.3
          }
        )
        alertOverlay.setMap(map)
      })
    }

    // Add click listener for location change
    if (onLocationChange) {
      map.addListener('click', (e) => {
        const lat = e.latLng.lat()
        const lng = e.latLng.lng()
        onLocationChange({ lat, lng })
      })
    }

    return map
  }, [mapCenter, zoom, mapStyle, weatherData, onLocationChange])

  return (
    <div className="weather-map-radar">
      {loading && (
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading weather map...</p>
        </div>
      )}
      <div
        ref={mapRef}
        className={`map-container ${!loading ? 'enhanced' : ''}`}
        style={{ height: '100%', width: '100%' }}
      />
    </div>
  )
}

export default WeatherMapRadar

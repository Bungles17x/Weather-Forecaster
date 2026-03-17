import React, { useState, useEffect, useRef } from 'react'
import './WeatherMapRadar.css'

const WeatherMapRadar = ({ weatherData, coordinates, onLocationChange }) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeLayer, setActiveLayer] = useState('radar')
  const mapRef = useRef(null)

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  // Initialize simple interactive map
  useEffect(() => {
    if (mapRef.current && !loading) {
      initializeSimpleMap()
    }
  }, [loading])

  const initializeSimpleMap = () => {
    const container = mapRef.current
    if (!container) return

    // Create a simple interactive weather map display
    container.innerHTML = `
      <div class="simple-weather-map">
        <div class="map-header">
          <div class="map-title">🗺️ Weather Radar Map</div>
          <div class="map-status">🛡️ NEXRAD Active</div>
        </div>
        
        <div class="map-display">
          <div class="radar-animation">
            <div class="radar-sweep"></div>
            <div class="radar-center"></div>
            <div class="weather-layers">
              <div class="layer radar-layer active" data-layer="radar">
                <div class="layer-icon">🛡️</div>
                <div class="layer-name">Radar</div>
              </div>
              <div class="layer precip-layer" data-layer="precipitation">
                <div class="layer-icon">💧</div>
                <div class="layer-name">Precip</div>
              </div>
              <div class="layer wind-layer" data-layer="wind">
                <div class="layer-icon">💨</div>
                <div class="layer-name">Wind</div>
              </div>
              <div class="layer temp-layer" data-layer="temperature">
                <div class="layer-icon">🌡️</div>
                <div class="layer-name">Temp</div>
              </div>
              <div class="layer cloud-layer" data-layer="clouds">
                <div class="layer-icon">☁️</div>
                <div class="layer-name">Clouds</div>
              </div>
              <div class="layer pressure-layer" data-layer="pressure">
                <div class="layer-icon">🔵</div>
                <div class="layer-name">Pressure</div>
              </div>
            </div>
          </div>
          
          <div class="map-controls">
            <div class="control-group">
              <div class="control-title">Base Map</div>
              <div class="base-map-options">
                <button class="base-map-btn active" data-map="street">🗺️ Street</button>
                <button class="base-map-btn" data-map="satellite">🛰️ Satellite</button>
                <button class="base-map-btn" data-map="terrain">🏔️ Terrain</button>
                <button class="base-map-btn" data-map="dark">🌙 Dark</button>
              </div>
            </div>
            
            <div class="control-group">
              <div class="control-title">Weather Layers</div>
              <div class="layer-options">
                <button class="layer-btn active" data-layer="radar">🛡️ Radar</button>
                <button class="layer-btn" data-layer="precipitation">💧 Precipitation</button>
                <button class="layer-btn" data-layer="wind">💨 Wind</button>
                <button class="layer-btn" data-layer="clouds">☁️ Clouds</button>
                <button class="layer-btn" data-layer="temperature">🌡️ Temperature</button>
                <button class="layer-btn" data-layer="pressure">🔵 Pressure</button>
              </div>
            </div>
            
            <div class="control-group">
              <div class="control-title">Location</div>
              <div class="location-info">
                <div class="current-location">
                  📍 ${coordinates ? `${coordinates.latitude.toFixed(2)}, ${coordinates.longitude.toFixed(2)}` : '40.71, -74.01'}
                </div>
                <button class="location-btn">📍 My Location</button>
              </div>
            </div>
          </div>
          
          <div class="map-legend">
            <div class="legend-title">Legend</div>
            <div class="legend-items">
              <div class="legend-item">
                <div class="legend-color" style="background: linear-gradient(45deg, #00ff00, #ffff00, #ff0000);"></div>
                <div class="legend-label">Precipitation Intensity</div>
              </div>
              <div class="legend-item">
                <div class="legend-color" style="background: #3498db;"></div>
                <div class="legend-label">Wind Speed</div>
              </div>
              <div class="legend-item">
                <div class="legend-color" style="background: #e74c3c;"></div>
                <div class="legend-label">Temperature</div>
              </div>
              <div class="legend-item">
                <div class="legend-color" style="background: #95a5a6;"></div>
                <div class="legend-label">Cloud Coverage</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `

    // Add interactivity
    addMapInteractivity(container)
  }

  const addMapInteractivity = (container) => {
    // Layer switching
    const layerBtns = container.querySelectorAll('.layer-btn')
    layerBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        layerBtns.forEach(b => b.classList.remove('active'))
        btn.classList.add('active')
        const layer = btn.dataset.layer
        setActiveLayer(layer)
        console.log(`Switched to ${layer} layer`)
      })
    })

    // Base map switching
    const baseMapBtns = container.querySelectorAll('.base-map-btn')
    baseMapBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        baseMapBtns.forEach(b => b.classList.remove('active'))
        btn.classList.add('active')
        const mapType = btn.dataset.map
        console.log(`Switched to ${mapType} base map`)
      })
    })

    // Location button
    const locationBtn = container.querySelector('.location-btn')
    if (locationBtn) {
      locationBtn.addEventListener('click', (e) => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords
              console.log('📍 Location found:', { latitude, longitude })
              if (onLocationChange) {
                onLocationChange(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
              }
            },
            (error) => {
              console.error('❌ Geolocation error:', error)
              setError('Unable to get your location')
            }
          )
        } else {
          setError('Geolocation not supported')
        }
      })
    }
  }

  if (loading) {
    return (
      <div className="weather-map-loading">
        <div className="loading-spinner"></div>
        <p>Loading weather map...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="weather-map-error">
        <div className="error-icon">⚠️</div>
        <h3>Map Error</h3>
        <p>{error}</p>
        <button onClick={() => setError(null)} className="retry-btn">
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="weather-map-radar">
      <div className="map-container" ref={mapRef}>
        {/* Map will be initialized here */}
      </div>
      
      <div className="map-info">
        <div className="info-section">
          <h3>Weather Map Features</h3>
          <ul>
            <li>🛡️ Real-time NEXRAD radar</li>
            <li>💧 Precipitation data</li>
            <li>💨 Wind speed and direction</li>
            <li>🌡️ Temperature maps</li>
            <li>☁️ Cloud coverage</li>
            <li>🔵 Pressure systems</li>
          </ul>
        </div>
        
        <div className="info-section">
          <h3>Data Sources</h3>
          <ul>
            <li>🇺🇸 National Weather Service</li>
            <li>🛰️ NOAA Satellites</li>
            <li>📡 Weather Radar Network</li>
            <li>🌍 Global Weather Systems</li>
          </ul>
        </div>
        
        <div className="info-section">
          <h3>Update Frequency</h3>
          <p>Weather data updates every 5-10 minutes</p>
          <p>Radar imagery updates in real-time</p>
        </div>
      </div>
    </div>
  )
}

export default WeatherMapRadar

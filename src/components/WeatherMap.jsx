import React, { useState, useEffect, useRef } from 'react'
import './WeatherMap.css'

const WeatherMap = () => {
  const [activeMap, setActiveMap] = useState('radar')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const mapRef = useRef(null)

  // OpenWeatherMap radar layers
  const mapLayers = {
    radar: {
      name: 'Weather Radar',
      icon: '📡',
      url: 'https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=01c50e8c663fe1d38db9f79fbedb3136'
    },
    clouds: {
      name: 'Clouds',
      icon: '☁️',
      url: 'https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=01c50e8c663fe1d38db9f79fbedb3136'
    },
    temperature: {
      name: 'Temperature',
      icon: '🌡️',
      url: 'https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=01c50e8c663fe1d38db9f79fbedb3136'
    },
    precipitation: {
      name: 'Precipitation',
      icon: '💧',
      url: 'https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=01c50e8c663fe1d38db9f79fbedb3136'
    },
    pressure: {
      name: 'Pressure',
      icon: '�',
      url: 'https://tile.openweathermap.org/map/pressure_new/{z}/{x}/{y}.png?appid=01c50e8c663fe1d38db9f79fbedb3136'
    },
    wind: {
      name: 'Wind Speed',
      icon: '�',
      url: 'https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=01c50e8c663fe1d38db9f79fbedb3136'
    },
    snow: {
      name: 'Snow',
      icon: '❄️',
      url: 'https://tile.openweathermap.org/map/snow_new/{z}/{x}/{y}.png?appid=01c50e8c663fe1d38db9f79fbedb3136'
    }
  }

  const handleMapChange = (mapType) => {
    setActiveMap(mapType)
    setLoading(true)
    console.log(`Switched to ${mapType} map`)
    updateMapLayer(mapType)
  }

  const updateMapLayer = (mapType) => {
    if (!mapRef.current) return
    
    const layer = mapLayers[mapType]
    if (!layer) return

    console.log('🗺️ Loading map layer:', mapType, layer.url)

    // Remove existing layers
    const existingLayers = mapRef.current.querySelectorAll('.weather-layer')
    existingLayers.forEach(layer => layer.remove())

    // Add new layer
    const mapContainer = mapRef.current.querySelector('.map-display')
    if (mapContainer) {
      const img = document.createElement('img')
      img.className = 'weather-layer'
      
      // Set up error handling first
      img.onerror = (error) => {
        console.log('❌ Weather map failed to load, using fallback:', error)
        img.src = 'https://picsum.photos/seed/radar/800/400.jpg'
        setError(`Using fallback for ${layer.name} map`)
        setLoading(false)
      }
      
      // Set up success handling for weather map
      img.onload = () => {
        console.log('✅ Weather map loaded successfully')
        setLoading(false)
        setError(null)
      }
      
      // Try the weather map directly
      img.src = layer.url.replace('{z}', '5').replace('{x}', '10').replace('{y}', '10')
      img.alt = layer.name
      
      console.log('🖼️ Setting weather map src:', img.src)
      
      mapContainer.appendChild(img)
    } else {
      console.log('❌ Map container not found')
    }
  }

  useEffect(() => {
    // Initialize map with default layer
    setTimeout(() => {
      updateMapLayer('radar')
    }, 1000)
  }, [])

  return (
    <section id="weather-map-section" className="weather-map-section">
      <div className="container">
        <h2 className="section-title">Weather Radar & Maps</h2>
        
        <div className="map-container" ref={mapRef}>
          <div className="map-display">
            {loading && (
              <div className="map-loading">
                <div className="loading-spinner"></div>
                <p>Loading {mapLayers[activeMap]?.name || 'map'}...</p>
              </div>
            )}
            
            {error && (
              <div className="map-error">
                <div className="error-icon">⚠️</div>
                <p>{error}</p>
                <button onClick={() => updateMapLayer(activeMap)} className="retry-btn">
                  Retry
                </button>
              </div>
            )}
            
            {!loading && !error && (
              <div className="map-overlay">
                <div className="map-info">
                  <span className="map-type">{mapLayers[activeMap]?.icon} {mapLayers[activeMap]?.name}</span>
                  <span className="map-update">Live Data</span>
                </div>
                <div className="map-debug">
                  <span className="debug-text">Loading {mapLayers[activeMap]?.name}...</span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="map-controls">
          <div className="map-buttons">
            {Object.entries(mapLayers).map(([key, layer]) => (
              <button
                key={key}
                className={`map-btn ${activeMap === key ? 'active' : ''}`}
                onClick={() => handleMapChange(key)}
                title={`View ${layer.name}`}
              >
                <span className="btn-icon">{layer.icon}</span>
                <span className="btn-text">{layer.name}</span>
              </button>
            ))}
          </div>
        </div>
        
        <div className="map-info-panel">
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Coverage:</span>
              <span className="info-value">United States</span>
            </div>
            <div className="info-item">
              <span className="info-label">Update Frequency:</span>
              <span className="info-value">Every 10 minutes</span>
            </div>
            <div className="info-item">
              <span className="info-label">Data Source:</span>
              <span className="info-value">OpenWeatherMap</span>
            </div>
            <div className="info-item">
              <span className="info-label">Resolution:</span>
              <span className="info-value">High Definition</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default WeatherMap

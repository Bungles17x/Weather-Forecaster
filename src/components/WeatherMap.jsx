import React, { useState } from 'react'
import './WeatherMap.css'

const WeatherMap = () => {
  const [activeMap, setActiveMap] = useState('radar')

  const handleMapChange = (mapType) => {
    setActiveMap(mapType)
    console.log(`Switched to ${mapType} map`)
    // TODO: Implement actual map functionality
  }

  const mapTypes = [
    { id: 'radar', name: 'Radar', icon: '📡' },
    { id: 'satellite', name: 'Satellite', icon: '🛰️' },
    { id: 'temperature', name: 'Temperature', icon: '🌡️' },
    { id: 'precipitation', name: 'Precipitation', icon: '💧' }
  ]

  return (
    <section id="weather-map-section" className="weather-map-section">
      <div className="container">
        <h2 className="section-title">Radar & Maps</h2>
        
        <div className="map-container">
          <div className="map-placeholder">
            <div className="map-icon">🗺️</div>
            <h3>Interactive Weather Map</h3>
            <p>Currently showing: <strong>{activeMap}</strong></p>
            <p>Click the buttons below to switch between different map views</p>
            
            <div className="map-controls">
              {mapTypes.map((mapType) => (
                <button 
                  key={mapType.id}
                  className={`btn ${activeMap === mapType.id ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => handleMapChange(mapType.id)}
                >
                  <span className="btn-icon">{mapType.icon}</span>
                  {mapType.name}
                </button>
              ))}
            </div>
            
            <div className="map-info">
              <p>
                {activeMap === 'radar' && 'View live precipitation and storm movement in your area.'}
                {activeMap === 'satellite' && 'See cloud cover and weather systems from above.'}
                {activeMap === 'temperature' && 'Track temperature changes across the region.'}
                {activeMap === 'precipitation' && 'Monitor rainfall and snowfall amounts.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default WeatherMap

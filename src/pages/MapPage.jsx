import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import './MapPage.css'

const MapPage = () => {
  const [mapLoading, setMapLoading] = useState(true)
  const [selectedLayer, setSelectedLayer] = useState('radar')
  const [mapCenter, setMapCenter] = useState({ lat: 39.8283, lng: -98.5795 }) // Center of US

  useEffect(() => {
    // Simulate map loading
    const timer = setTimeout(() => {
      setMapLoading(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  const mapLayers = [
    { id: 'radar', name: 'Radar', icon: '📡' },
    { id: 'satellite', name: 'Satellite', icon: '🛰️' },
    { id: 'temperature', name: 'Temperature', icon: '🌡️' },
    { id: 'precipitation', name: 'Precipitation', icon: '🌧️' },
    { id: 'wind', name: 'Wind', icon: '💨' },
    { id: 'pressure', name: 'Pressure', icon: '🔵' }
  ]

  const handleLayerChange = (layerId) => {
    setSelectedLayer(layerId)
    setMapLoading(true)
    setTimeout(() => setMapLoading(false), 500)
  }

  return (
    <div className="map-page">
      <Header />
      
      <div className="map-content">
        <div className="map-header">
          <div className="map-nav">
            <Link to="/" className="back-link">← Back to Weather</Link>
            <h1>Weather Map</h1>
            <div className="map-controls">
              <button className="control-btn">📍 Current Location</button>
              <button className="control-btn">🔍 Search</button>
            </div>
          </div>
        </div>

        <div className="map-container">
          <div className="map-sidebar">
            <h3>Map Layers</h3>
            <div className="layer-list">
              {mapLayers.map(layer => (
                <button
                  key={layer.id}
                  className={`layer-btn ${selectedLayer === layer.id ? 'active' : ''}`}
                  onClick={() => handleLayerChange(layer.id)}
                >
                  <span className="layer-icon">{layer.icon}</span>
                  <span className="layer-name">{layer.name}</span>
                </button>
              ))}
            </div>

            <div className="map-options">
              <h3>Options</h3>
              <div className="option-group">
                <label>
                  <input type="checkbox" defaultChecked />
                  Show Labels
                </label>
                <label>
                  <input type="checkbox" defaultChecked />
                  Show Grid
                </label>
                <label>
                  <input type="checkbox" />
                  Animation
                </label>
              </div>
            </div>

            <div className="map-legend">
              <h3>Legend</h3>
              <div className="legend-items">
                <div className="legend-item">
                  <div className="legend-color" style={{ background: '#00ff00' }}></div>
                  <span>Light Rain</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ background: '#ffff00' }}></div>
                  <span>Moderate Rain</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ background: '#ff0000' }}></div>
                  <span>Heavy Rain</span>
                </div>
              </div>
            </div>
          </div>

          <div className="map-main">
            {mapLoading ? (
              <div className="map-loading">
                <div className="loading-spinner"></div>
                <p>Loading weather map...</p>
              </div>
            ) : (
              <div className="map-display">
                <div className="map-placeholder">
                  <div className="map-icon">🗺️</div>
                  <h3>Weather Map - {mapLayers.find(l => l.id === selectedLayer)?.name}</h3>
                  <p>Interactive weather map would be displayed here</p>
                  <div className="map-demo">
                    <div className="demo-overlay">
                      <div className="demo-marker" style={{ top: '30%', left: '40%' }}>
                        <div className="marker-icon">⛈️</div>
                        <div className="marker-label">Storm</div>
                      </div>
                      <div className="demo-marker" style={{ top: '60%', left: '70%' }}>
                        <div className="marker-icon">☀️</div>
                        <div className="marker-label">Clear</div>
                      </div>
                      <div className="demo-marker" style={{ top: '45%', left: '25%' }}>
                        <div className="marker-icon">🌧️</div>
                        <div className="marker-label">Rain</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="map-footer">
          <div className="map-info">
            <p>Last updated: {new Date().toLocaleString()}</p>
            <p>Data source: OpenWeatherMap</p>
          </div>
          <div className="map-actions">
            <button className="action-btn">📷 Screenshot</button>
            <button className="action-btn">📤 Share</button>
            <button className="action-btn">⬇️ Download</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MapPage

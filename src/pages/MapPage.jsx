import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import WeatherMap from '../components/WeatherMap'
import './MapPage.css'

const MapPage = () => {
  const [showInfo, setShowInfo] = useState(false)
  const [currentLocation, setCurrentLocation] = useState('New York, NY')

  const mapFeatures = [
    { icon: '📡', title: 'Live Radar', description: 'Real-time precipitation and storm tracking' },
    { icon: '🛰️', title: 'Satellite Imagery', description: 'Cloud cover and weather systems from space' },
    { icon: '🌡️', title: 'Temperature Maps', description: 'Regional temperature variations and heat maps' },
    { icon: '💧', title: 'Precipitation Data', description: 'Rainfall and snowfall accumulation maps' },
    { icon: '💨', title: 'Wind Patterns', description: 'Wind speed and direction visualization' },
    { icon: '🔵', title: 'Pressure Systems', description: 'Atmospheric pressure and weather fronts' },
    { icon: '☁️', title: 'Cloud Coverage', description: 'Cloud density and type classification' }
  ]

  const toggleInfo = () => {
    setShowInfo(!showInfo)
  }

  return (
    <div className="map-page">
      <Header />
      
      <div className="map-content">
        <div className="map-header">
          <div className="map-nav">
            <Link to="/" className="back-link">
              <span className="back-icon">←</span>
              <span>Back to Weather</span>
            </Link>
            <div className="header-content">
              <h1>Weather Maps & Radar</h1>
              <p>Interactive weather radar and satellite imagery with real-time data</p>
            </div>
            <button className="info-toggle" onClick={toggleInfo}>
              <span className="info-icon">ℹ️</span>
              <span className="info-text">Map Info</span>
            </button>
          </div>
        </div>

        {showInfo && (
          <div className="map-info-panel">
            <div className="info-header">
              <h3>🗺️ Map Features</h3>
              <button className="close-info" onClick={toggleInfo}>✕</button>
            </div>
            <div className="features-grid">
              {mapFeatures.map((feature, index) => (
                <div key={index} className="feature-card">
                  <div className="feature-icon">{feature.icon}</div>
                  <div className="feature-content">
                    <h4>{feature.title}</h4>
                    <p>{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="map-stats">
              <div className="stat-item">
                <span className="stat-label">Data Source</span>
                <span className="stat-value">OpenWeatherMap</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Update Frequency</span>
                <span className="stat-value">Every 10 minutes</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Coverage</span>
                <span className="stat-value">United States</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Resolution</span>
                <span className="stat-value">High Definition</span>
              </div>
            </div>
          </div>
        )}

        <div className="map-container enhanced">
          {/* EXTERNAL MAP CONTROLS - OUTSIDE MAP */}
          <div className="external-map-controls">
            <div className="control-section">
              <h4>🗺️ Map Layers</h4>
              <div className="layer-buttons">
                <button className="layer-btn active">🛡️ Radar</button>
                <button className="layer-btn">💧 Precipitation</button>
                <button className="layer-btn">💨 Wind</button>
                <button className="layer-btn">☁️ Clouds</button>
                <button className="layer-btn">🌡️ Temperature</button>
                <button className="layer-btn">🔵 Pressure</button>
              </div>
            </div>
            <div className="control-section">
              <h4>📡 Base Map</h4>
              <div className="basemap-buttons">
                <button className="basemap-btn active">🗺️ Street</button>
                <button className="basemap-btn">🛰️ Satellite</button>
                <button className="basemap-btn">🏔️ Terrain</button>
                <button className="basemap-btn">🌙 Dark</button>
              </div>
            </div>
          </div>
          
          {/* HIDDEN SIDEBAR FOR MAXIMUM MAP SPACE */}
          <div className="map-sidebar" style={{display: 'none'}}>
            <div className="location-info">
              <h3>📍 Current Location</h3>
              <div className="location-display">
                <span className="location-name">{currentLocation}</span>
                <button className="location-btn">🔄 Update</button>
              </div>
            </div>
            
            <div className="quick-actions">
              <h3>⚡ Quick Actions</h3>
              <div className="action-buttons">
                <button className="action-btn primary">📍 My Location</button>
                <button className="action-btn">🔍 Search Area</button>
                <button className="action-btn">📷 Screenshot</button>
                <button className="action-btn">📤 Share Map</button>
              </div>
            </div>

            <div className="map-tips">
              <h3>💡 Tips</h3>
              <ul className="tips-list">
                <li>Click map layers to switch views</li>
                <li>Use mouse wheel to zoom in/out</li>
                <li>Drag to pan around the map</li>
                <li>Double-click to zoom to location</li>
              </ul>
            </div>
          </div>

          <div className="map-main">
            <div className="map-wrapper">
              <WeatherMap />
            </div>
            <div className="map-footer">
              <div className="footer-info">
                <div className="data-status">
                  <span className="status-indicator live"></span>
                  <span className="status-text">Live Data</span>
                </div>
                <div className="last-update">
                  Last updated: {new Date().toLocaleTimeString()}
                </div>
              </div>
              <div className="footer-actions">
                <button className="footer-btn">🔄 Refresh</button>
                <button className="footer-btn">⬇️ Download</button>
                <button className="footer-btn">🔗 Copy Link</button>
              </div>
            </div>
          </div>
        </div>

        <div className="map-legend-bar">
          <div className="legend-section">
            <h4>Weather Intensity</h4>
            <div className="intensity-scale">
              <div className="scale-item light">
                <div className="scale-color"></div>
                <span>Light</span>
              </div>
              <div className="scale-item moderate">
                <div className="scale-color"></div>
                <span>Moderate</span>
              </div>
              <div className="scale-item heavy">
                <div className="scale-color"></div>
                <span>Heavy</span>
              </div>
              <div className="scale-item severe">
                <div className="scale-color"></div>
                <span>Severe</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MapPage

import React from 'react'
import { Link } from 'react-router-dom'
import WeatherAlerts from '../components/WeatherAlerts'
import './AlertsPage.css'

const AlertsPage = () => {
  return (
    <div className="alerts-page">
      <div className="alerts-page-header">
        <Link to="/" className="back-link">
          <span className="back-icon">←</span>
          <span>Back to Weather</span>
        </Link>
        
        <div className="page-title">
          <h1>Weather Alerts</h1>
          <p>Real-time weather warnings and safety information</p>
        </div>
        
        <div className="header-actions">
          <Link to="/map" className="map-link">
            <span className="map-icon">🗺️</span>
            <span>View Radar</span>
          </Link>
        </div>
      </div>

      <div className="alerts-page-content">
        <WeatherAlerts />
      </div>
    </div>
  )
}

export default AlertsPage

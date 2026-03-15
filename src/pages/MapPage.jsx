import React from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import WeatherMap from '../components/WeatherMap'
import './MapPage.css'

const MapPage = () => {
  return (
    <div className="map-page">
      <Header />
      
      <div className="map-content">
        <div className="map-header">
          <div className="map-nav">
            <Link to="/" className="back-link">← Back to Weather</Link>
            <h1>Weather Maps & Radar</h1>
            <p>Interactive weather radar and satellite imagery</p>
          </div>
        </div>

        <div className="map-container">
          <WeatherMap />
        </div>
      </div>
    </div>
  )
}

export default MapPage

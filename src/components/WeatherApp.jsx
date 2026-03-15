import React from 'react'
import Header from './Header'
import './WeatherApp.css'

const WeatherApp = () => {
  return (
    <div className="weather-app">
      <Header />
      
      <main className="weather-content">
        <div className="no-data-container">
          <div className="no-data-content">
            <div className="no-data-icon">🚫</div>
            <h1 className="no-data-title">No Data Implemented</h1>
            <p className="no-data-message">
              Weather data functionality has not been implemented yet.
            </p>
            <p className="no-data-submessage">
              This application is currently in development mode.
            </p>
            <div className="no-data-actions">
              <button className="no-data-btn primary">
                Coming Soon
              </button>
              <button className="no-data-btn secondary">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default WeatherApp

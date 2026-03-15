import React from 'react'
import { Link } from 'react-router-dom'
import './HomePage.css'

const HomePage = () => {
  return (
    <div className="home-page">
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Weather Forecaster</h1>
          <p className="hero-subtitle">Your professional weather companion</p>
          <div className="hero-buttons">
            <Link to="/forecast" className="hero-btn primary">
              View Forecast
            </Link>
            <Link to="/map" className="hero-btn secondary">
              Weather Map
            </Link>
          </div>
        </div>
      </div>
      
      <div className="features-section">
        <div className="container">
          <h2 className="section-title">Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🌡️</div>
              <h3>Real-time Weather</h3>
              <p>Get current weather conditions with accurate temperature, humidity, and more.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📅</div>
              <h3>5-Day Forecast</h3>
              <p>Plan your week with detailed 5-day weather forecasts and hourly updates.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🗺️</div>
              <h3>Weather Maps</h3>
              <p>Interactive weather maps with radar, satellite, and precipitation data.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚠️</div>
              <h3>Weather Alerts</h3>
              <p>Stay safe with real-time weather alerts and severe weather warnings.</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="cta-section">
        <div className="container">
          <h2>Ready to check the weather?</h2>
          <Link to="/" className="cta-btn">
            Get Started
          </Link>
        </div>
      </div>
    </div>
  )
}

export default HomePage

import React from 'react'
import { useNavigate } from 'react-router-dom'
import { WeatherDeskIcon } from './WeatherIcons'
import './ErrorScreen.css'

export default function ErrorScreen({ error, resetError }) {
  const navigate = useNavigate()

  const handleGoHome = () => {
    navigate('/')
    if (resetError) resetError()
  }

  const handleRetry = () => {
    if (resetError) resetError()
  }

  return (
    <div className="error-screen">
      <div className="error-screen-container">
        <div className="error-visual">
          <div className="error-icon-wrapper">
            <WeatherDeskIcon name="thunderstorm" size={64} />
          </div>
          <div className="error-particles">
            <span className="particle particle-1" />
            <span className="particle particle-2" />
            <span className="particle particle-3" />
            <span className="particle particle-4" />
          </div>
        </div>
        
        <div className="error-content">
          <div className="error-badge">
            <span className="error-dot" />
            SYSTEM ERROR
          </div>
          
          <h1 className="error-title">
            Something went wrong
          </h1>
          
          <p className="error-description">
            {error || 'An unexpected error occurred while loading weather data. The application encountered an issue that prevented normal operation.'}
          </p>
          
          <div className="error-actions">
            <button className="error-button error-button-primary" onClick={handleRetry}>
              <WeatherDeskIcon name="refresh" size={16} />
              Try Again
            </button>
            <button className="error-button error-button-secondary" onClick={handleGoHome}>
              <WeatherDeskIcon name="home" size={16} />
              Go to Dashboard
            </button>
          </div>
          
          <div className="error-tips">
            <strong>What you can do:</strong>
            <ul>
              <li>Check your internet connection</li>
              <li>Refresh the page to restart the app</li>
              <li>Try changing your location</li>
              <li>Contact support if the issue persists</li>
            </ul>
          </div>
        </div>
        
        <div className="error-decoration">
          <div className="decoration-circle circle-1" />
          <div className="decoration-circle circle-2" />
          <div className="decoration-circle circle-3" />
        </div>
      </div>
    </div>
  )
}

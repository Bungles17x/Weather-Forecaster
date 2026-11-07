import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { WeatherDeskIcon } from './WeatherIcons'
import './ErrorScreen.css'

export default function ErrorScreen({ error, resetError }) {
  const navigate = useNavigate()
  const [showDetails, setShowDetails] = useState(false)

  const handleGoHome = () => {
    navigate('/')
    if (resetError) resetError()
  }

  const handleRetry = () => {
    if (resetError) resetError()
  }

  const handleReload = () => {
    window.location.reload()
  }

  const handleCopy = () => {
    const details = [
      `Weather Forecaster Error Report`,
      `Time: ${new Date().toISOString()}`,
      `URL: ${window.location.href}`,
      `Online: ${navigator.onLine ? 'Yes' : 'No'}`,
      `User Agent: ${navigator.userAgent}`,
      `Error: ${error || 'Unknown error'}`
    ].join('\n')
    navigator.clipboard.writeText(details).catch(() => {})
  }

  const systemInfo = {
    online: navigator.onLine,
    url: window.location.href,
    ua: navigator.userAgent?.slice(0, 80),
    memory: performance.memory ? `${(performance.memory.usedJSHeapSize / 1048576).toFixed(1)} MB` : 'N/A'
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
            <button className="error-button error-button-primary" onClick={handleReload}>
              <WeatherDeskIcon name="refresh" size={16} />
              Reload Page
            </button>
            <button className="error-button error-button-secondary" onClick={handleRetry}>
              <WeatherDeskIcon name="sync" size={16} />
              Try Again
            </button>
            <button className="error-button error-button-secondary" onClick={handleGoHome}>
              <WeatherDeskIcon name="home" size={16} />
              Go to Dashboard
            </button>
          </div>

          <button className="error-toggle-details" onClick={() => setShowDetails(!showDetails)}>
            {showDetails ? 'Hide' : 'Show'} Error Details
          </button>

          {showDetails && (
            <div className="error-details">
              <pre className="error-trace">{error || 'No error details available'}</pre>
              <div className="error-system">
                <strong>System Status:</strong>
                <div>Online: {systemInfo.online ? 'Yes' : 'No'}</div>
                <div>Memory: {systemInfo.memory}</div>
                <div>URL: {systemInfo.url}</div>
                <div>Browser: {systemInfo.ua}</div>
              </div>
              <button className="error-copy" onClick={handleCopy}>
                <WeatherDeskIcon name="copy" size={14} />
                Copy to Clipboard
              </button>
            </div>
          )}

          <div className="error-tips">
            <strong>What you can do:</strong>
            <ul>
              <li>Check your internet connection</li>
              <li>Refresh the page to restart the app</li>
              <li>Try changing your location</li>
              <li>Clear browser cache and reload</li>
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

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { WeatherDeskIcon } from './WeatherIcons'
import './ErrorScreen.css'

const APP_VERSION = '2.1.1'

export default function ErrorScreen({ error, resetError, errorDetails = null }) {
  const navigate = useNavigate()
  const [showDevPanel, setShowDevPanel] = useState(false)
  const [devPanelExpanded, setDevPanelExpanded] = useState(false)

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
    const diagnosticInfo = {
      timestamp: new Date().toISOString(),
      appVersion: APP_VERSION,
      error: error || 'Unknown error',
      url: window.location.href,
      online: navigator.onLine,
      userAgent: navigator.userAgent,
      memory: performance.memory ? {
        used: `${(performance.memory.usedJSHeapSize / 1048576).toFixed(2)} MB`,
        total: `${(performance.memory.totalJSHeapSize / 1048576).toFixed(2)} MB`,
        limit: `${(performance.memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`
      } : 'N/A',
      ...errorDetails
    }

    const report = Object.entries(diagnosticInfo)
      .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value, null, 2) : value}`)
      .join('\n')

    navigator.clipboard.writeText(report).catch(() => {})
  }

  const handleExport = () => {
    const diagnosticInfo = {
      timestamp: new Date().toISOString(),
      appVersion: APP_VERSION,
      error: error || 'Unknown error',
      url: window.location.href,
      online: navigator.onLine,
      userAgent: navigator.userAgent,
      memory: performance.memory ? {
        used: `${(performance.memory.usedJSHeapSize / 1048576).toFixed(2)} MB`,
        total: `${(performance.memory.totalJSHeapSize / 1048576).toFixed(2)} MB`,
        limit: `${(performance.memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`
      } : 'N/A',
      ...errorDetails
    }

    const blob = new Blob([JSON.stringify(diagnosticInfo, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `weather-forecaster-error-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const errorSummary = errorDetails?.summary || error || 'An unexpected error occurred'
  const errorCode = errorDetails?.code || 'ERR-UNKNOWN'
  const stackTrace = errorDetails?.stack || (error?.stack ? error.stack : 'No stack trace available')
  const affectedFile = errorDetails?.file || 'Unknown file'
  const lineNumber = errorDetails?.line || 'Unknown'

  return (
    <div className="error-screen fatal-error">
      <div className="error-screen-container">
        <div className="error-visual fatal-visual">
          <div className="error-icon-wrapper fatal-icon">
            <WeatherDeskIcon name="thunderstorm" size={72} />
          </div>
          <div className="error-particles fatal-particles">
            <span className="particle particle-1" />
            <span className="particle particle-2" />
            <span className="particle particle-3" />
            <span className="particle particle-4" />
          </div>
        </div>

        <div className="error-content">
          <div className="error-badge fatal-badge">
            <span className="error-dot fatal-dot" />
            FATAL ERROR
          </div>

          <h1 className="error-title fatal-title">
            Application Crashed
          </h1>

          <p className="error-description fatal-description">
            {errorSummary}
          </p>

          <div className="error-code">
            <span>Error Code:</span>
            <code>{errorCode}</code>
          </div>

          <div className="error-actions">
            <button className="error-button error-button-primary fatal-primary" onClick={handleReload}>
              <WeatherDeskIcon name="refresh" size={16} />
              Restart Application
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

          <button className="error-dev-button" onClick={() => setShowDevPanel(!showDevPanel)}>
            <WeatherDeskIcon name="database" size={16} />
            DEV DEBUG INFO
          </button>

          {showDevPanel && (
            <div className={`error-dev-panel ${devPanelExpanded ? 'expanded' : ''}`}>
              <div className="dev-panel-header">
                <strong>Developer Diagnostics</strong>
                <button className="dev-panel-toggle" onClick={() => setDevPanelExpanded(!devPanelExpanded)}>
                  {devPanelExpanded ? 'Collapse' : 'Expand'}
                </button>
              </div>

              <div className="dev-panel-section">
                <h4>Error Information</h4>
                <div className="dev-info-row">
                  <span>Error Code:</span>
                  <code>{errorCode}</code>
                </div>
                <div className="dev-info-row">
                  <span>Timestamp:</span>
                  <code>{new Date().toISOString()}</code>
                </div>
                <div className="dev-info-row">
                  <span>Affected File:</span>
                  <code>{affectedFile}</code>
                </div>
                <div className="dev-info-row">
                  <span>Line Number:</span>
                  <code>{lineNumber}</code>
                </div>
              </div>

              <div className="dev-panel-section">
                <h4>Stack Trace</h4>
                <pre className="dev-stack-trace">{stackTrace}</pre>
              </div>

              <div className="dev-panel-section">
                <h4>Application Info</h4>
                <div className="dev-info-row">
                  <span>Version:</span>
                  <code>{APP_VERSION}</code>
                </div>
                <div className="dev-info-row">
                  <span>URL:</span>
                  <code>{window.location.href}</code>
                </div>
                <div className="dev-info-row">
                  <span>Online:</span>
                  <code>{navigator.onLine ? 'Yes' : 'No'}</code>
                </div>
              </div>

              <div className="dev-panel-section">
                <h4>System Information</h4>
                <div className="dev-info-row">
                  <span>Browser:</span>
                  <code>{navigator.userAgent?.slice(0, 100)}</code>
                </div>
                {performance.memory && (
                  <>
                    <div className="dev-info-row">
                      <span>Memory Used:</span>
                      <code>{(performance.memory.usedJSHeapSize / 1048576).toFixed(2)} MB</code>
                    </div>
                    <div className="dev-info-row">
                      <span>Memory Total:</span>
                      <code>{(performance.memory.totalJSHeapSize / 1048576).toFixed(2)} MB</code>
                    </div>
                    <div className="dev-info-row">
                      <span>Memory Limit:</span>
                      <code>{(performance.memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB</code>
                    </div>
                  </>
                )}
              </div>

              <div className="dev-panel-section">
                <h4>Diagnostic Logs</h4>
                <pre className="dev-logs">{errorDetails?.logs || 'No diagnostic logs available'}</pre>
              </div>

              <div className="dev-panel-actions">
                <button className="dev-action-btn" onClick={handleCopy}>
                  <WeatherDeskIcon name="copy" size={14} />
                  Copy Diagnostics
                </button>
                <button className="dev-action-btn" onClick={handleExport}>
                  <WeatherDeskIcon name="download" size={14} />
                  Export JSON
                </button>
              </div>
            </div>
          )}

          <div className="error-tips">
            <strong>Recovery Steps:</strong>
            <ul>
              <li>Reload the page to restart the application</li>
              <li>Check your internet connection</li>
              <li>Clear browser cache and cookies</li>
              <li>Try a different browser or device</li>
              <li>If the issue persists, contact support with the diagnostic information</li>
            </ul>
          </div>
        </div>

        <div className="error-decoration fatal-decoration">
          <div className="decoration-circle circle-1" />
          <div className="decoration-circle circle-2" />
          <div className="decoration-circle circle-3" />
        </div>
      </div>
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import './WeatherAlerts.css'

const WeatherAlerts = ({ coordinates }) => {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedAlert, setSelectedAlert] = useState(null)

  useEffect(() => {
    if (coordinates) {
      fetchWeatherAlerts()
    }
  }, [coordinates])

  const fetchWeatherAlerts = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Use provided coordinates for accurate alerts
      const { latitude, longitude } = coordinates
      
      await fetchAlertsByLocation(latitude, longitude)
    } catch (err) {
      console.error('Error fetching weather alerts:', err)
      setError('Failed to load weather alerts')
      setLoading(false)
    }
  }

  const fetchAlertsByLocation = async (lat, lon) => {
    try {
      // Use NWS API for real weather alerts
      const response = await fetch(
        `https://api.weather.gov/alerts/active?point=${lat},${lon}`
      )
      
      if (!response.ok) {
        throw new Error('Failed to fetch alerts')
      }
      
      const data = await response.json()
      
      if (data.features) {
        const formattedAlerts = data.features.map(feature => ({
          id: feature.id,
          title: feature.properties.headline || feature.properties.event,
          description: feature.properties.description,
          severity: feature.properties.severity,
          urgency: feature.properties.urgency,
          areas: feature.properties.areas,
          certainty: feature.properties.certainty,
          event: feature.properties.event,
          sender: feature.properties.sender,
          instruction: feature.properties.instruction,
          effective: feature.properties.effective,
          expires: feature.properties.expires,
          web: feature.properties.web,
          severityClass: getSeverityClass(feature.properties.severity),
          urgencyClass: getUrgencyClass(feature.properties.urgency)
        }))
        
        setAlerts(formattedAlerts)
      } else {
        setAlerts([])
      }
      
      setLoading(false)
    } catch (err) {
      console.error('Error fetching NWS alerts:', err)
      // Fallback to mock data if NWS fails
      setAlerts(getMockAlerts())
      setLoading(false)
    }
  }

  const getSeverityClass = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'extreme': return 'extreme'
      case 'severe': return 'severe'
      case 'moderate': return 'moderate'
      case 'minor': return 'minor'
      default: return 'unknown'
    }
  }

  const getUrgencyClass = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case 'immediate': return 'immediate'
      case 'expected': return 'expected'
      case 'future': return 'future'
      case 'past': return 'past'
      default: return 'unknown'
    }
  }

  const getMockAlerts = () => {
    return [
      {
        id: 'mock-1',
        title: 'Severe Thunderstorm Warning',
        description: 'Dangerous thunderstorm approaching with potential for damaging winds and large hail. Seek shelter immediately.',
        severity: 'severe',
        urgency: 'immediate',
        areas: 'Manhattan, Brooklyn, Queens',
        certainty: 'observed',
        event: 'Severe Thunderstorm',
        sender: 'National Weather Service',
        instruction: 'Move to an interior room on the lowest floor of a sturdy building. Avoid windows.',
        effective: new Date().toISOString(),
        expires: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        web: 'https://weather.gov',
        severityClass: 'severe',
        urgencyClass: 'immediate'
      }
    ]
  }

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Unknown'
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getSeverityIcon = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'extreme': return '🚨'
      case 'severe': return '⚠️'
      case 'moderate': return '⚡'
      case 'minor': return '📢'
      default: return 'ℹ️'
    }
  }

  const handleAlertClick = (alert) => {
    setSelectedAlert(selectedAlert?.id === alert.id ? null : alert)
  }

  const refreshAlerts = () => {
    fetchWeatherAlerts()
  }

  return (
    <section id="weather-alerts-section" className="weather-alerts-section">
      <div className="container">
        <div className="alerts-header">
          <h2 className="section-title">
            <span className="alert-icon">🚨</span>
            Weather Alerts
          </h2>
          <div className="alerts-controls">
            <button 
              onClick={refreshAlerts} 
              className="refresh-btn"
              disabled={loading}
            >
              <span className="refresh-icon">🔄</span>
              Refresh
            </button>
            <div className="alert-count">
              {alerts.length} Active Alert{alerts.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {loading && (
          <div className="alerts-loading">
            <div className="loading-spinner"></div>
            <p>Loading weather alerts...</p>
          </div>
        )}

        {error && (
          <div className="alerts-error">
            <div className="error-icon">⚠️</div>
            <p>{error}</p>
            <button onClick={fetchWeatherAlerts} className="retry-btn">
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="alerts-container">
            {alerts.length === 0 ? (
              <div className="no-alerts">
                <div className="no-alerts-icon">✅</div>
                <h3>No Active Weather Alerts</h3>
                <p>There are currently no weather alerts for your area.</p>
              </div>
            ) : (
              <div className="alerts-list">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`alert-card ${alert.severityClass} ${alert.urgencyClass}`}
                    onClick={() => handleAlertClick(alert)}
                  >
                    <div className="alert-header">
                      <div className="alert-title-row">
                        <span className="alert-severity-icon">
                          {getSeverityIcon(alert.severity)}
                        </span>
                        <h3 className="alert-title">{alert.title}</h3>
                        <span className="alert-severity">{alert.severity}</span>
                      </div>
                      <div className="alert-meta">
                        <span className="alert-event">{alert.event}</span>
                        <span className="alert-urgency">{alert.urgency}</span>
                      </div>
                    </div>

                    <div className="alert-summary">
                      <p className="alert-description">
                        {alert.description?.substring(0, 200)}
                        {alert.description?.length > 200 ? '...' : ''}
                      </p>
                      <div className="alert-areas">
                        <span className="areas-label">Areas:</span>
                        <span className="areas-list">{alert.areas}</span>
                      </div>
                    </div>

                    {selectedAlert?.id === alert.id && (
                      <div className="alert-details">
                        <div className="detail-section">
                          <h4>Full Description</h4>
                          <p>{alert.description}</p>
                        </div>

                        {alert.instruction && (
                          <div className="detail-section">
                            <h4>Safety Instructions</h4>
                            <p>{alert.instruction}</p>
                          </div>
                        )}

                        <div className="detail-grid">
                          <div className="detail-item">
                            <span className="detail-label">Effective:</span>
                            <span className="detail-value">{formatDateTime(alert.effective)}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Expires:</span>
                            <span className="detail-value">{formatDateTime(alert.expires)}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Certainty:</span>
                            <span className="detail-value">{alert.certainty}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Issued by:</span>
                            <span className="detail-value">{alert.sender}</span>
                          </div>
                        </div>

                        {alert.web && (
                          <div className="alert-actions">
                            <a 
                              href={alert.web} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="alert-link"
                            >
                              View Full Details
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

export default WeatherAlerts

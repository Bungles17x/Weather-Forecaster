import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import WeatherAlerts from '../components/WeatherAlerts'
import { useAlerts } from '../contexts/AlertContext'
import { useLocation as useGlobalLocation } from '../contexts/LocationContext'
import './AlertsPage.css'

const AlertsPage = () => {
  const { 
    alerts, 
    notifications, 
    permission, 
    loading, 
    error,
    requestNotificationPermission,
    fetchWeatherAlerts,
    clearNotifications,
    testNotification
  } = useAlerts()
  
  const { location: globalLocation } = useGlobalLocation()
  const [refreshing, setRefreshing] = useState(false)

  // Fetch alerts when location changes
  useEffect(() => {
    if (globalLocation) {
      fetchWeatherAlerts(globalLocation)
    }
  }, [globalLocation, fetchWeatherAlerts])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchWeatherAlerts(globalLocation)
    setRefreshing(false)
  }

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission()
    if (granted) {
      // Test notification after permission granted
      setTimeout(() => {
        testNotification()
      }, 1000)
    }
  }

  return (
    <div className="alerts-page">
      <Header />
      
      <div className="alerts-page-header">
        <Link to="/" className="back-link">
          <span className="back-icon">←</span>
          <span>Back to Weather</span>
        </Link>
        
        <div className="page-title">
          <h1>Weather Alerts</h1>
          <p>Real-time weather warnings and safety information for {globalLocation}</p>
        </div>
        
        <div className="header-actions">
          <button 
            className={`refresh-btn ${refreshing ? 'refreshing' : ''}`}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <span className="refresh-icon">🔄</span>
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          
          <Link to="/map" className="map-link">
            <span className="map-icon">🗺️</span>
            <span>View Radar</span>
          </Link>
        </div>
      </div>

      <div className="alerts-controls">
        <div className="notification-status">
          <h3>🔔 Notification Status</h3>
          <div className="status-info">
            <span className={`status-badge ${permission}`}>
              {permission === 'granted' ? '✅ Enabled' : 
               permission === 'denied' ? '❌ Disabled' : 
               '⏳ Not Requested'}
            </span>
            
            {permission === 'default' && (
              <button 
                className="enable-notifications-btn"
                onClick={handleRequestPermission}
              >
                🔔 Enable Notifications
              </button>
            )}
            
            {permission === 'granted' && (
              <div className="notification-actions">
                <button 
                  className="test-notification-btn"
                  onClick={testNotification}
                >
                  🧪 Test Notification
                </button>
                
                {notifications.length > 0 && (
                  <button 
                    className="clear-notifications-btn"
                    onClick={clearNotifications}
                  >
                    🗑️ Clear All ({notifications.length})
                  </button>
                )}
              </div>
            )}
            
            {permission === 'denied' && (
              <div className="permission-denied-info">
                <p>⚠️ Notifications are disabled in your browser settings.</p>
                <p>To enable notifications, go to your browser settings and allow notifications for this site.</p>
              </div>
            )}
          </div>
        </div>
        
        {error && (
          <div className="alert-error">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}
      </div>

      <div className="alerts-page-content">
        <WeatherAlerts />
      </div>
    </div>
  )
}

export default AlertsPage

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

// Create Alert Context
const AlertContext = createContext()

// Alert Provider Component
export const AlertProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([])
  const [notifications, setNotifications] = useState([])
  const [permission, setPermission] = useState('default')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Check notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      setError('This browser does not support notifications')
      return false
    }

    try {
      console.log('🔔 Requesting notification permission...')
      const result = await Notification.requestPermission()
      setPermission(result)
      
      if (result === 'granted') {
        console.log('✅ Notification permission granted')
        return true
      } else if (result === 'denied') {
        console.log('❌ Notification permission denied')
        setError('Notification permission was denied. Please enable notifications in your browser settings.')
        return false
      } else {
        console.log('⏳ Notification permission deferred')
        return false
      }
    } catch (error) {
      console.error('❌ Error requesting notification permission:', error)
      setError('Failed to request notification permission')
      return false
    }
  }, [])

  // Show notification
  const showNotification = useCallback((title, options = {}) => {
    if (permission !== 'granted') {
      console.log('🔔 Cannot show notification - permission not granted')
      return false
    }

    try {
      console.log('🔔 Showing notification:', title)
      
      const notification = new Notification(title, {
        icon: '/weather-icon.png',
        badge: '/weather-badge.png',
        tag: 'weather-alert',
        renotify: true,
        requireInteraction: options.urgent || false,
        ...options
      })

      // Auto-close non-urgent notifications
      if (!options.urgent) {
        setTimeout(() => {
          notification.close()
        }, 5000)
      }

      // Handle notification click
      notification.onclick = () => {
        console.log('🔔 Notification clicked:', title)
        notification.close()
        if (options.onClick) {
          options.onClick()
        } else {
          // Focus on the window
          window.focus()
        }
      }

      // Add to notifications list
      setNotifications(prev => [
        {
          id: Date.now(),
          title,
          body: options.body,
          timestamp: new Date(),
          urgent: options.urgent || false,
          read: false
        },
        ...prev.slice(0, 49) // Keep only last 50 notifications
      ])

      return true
    } catch (error) {
      console.error('❌ Error showing notification:', error)
      setError('Failed to show notification')
      return false
    }
  }, [permission])

  // Fetch weather alerts from NWS
  const fetchWeatherAlerts = useCallback(async (location) => {
    if (!location) return

    setLoading(true)
    setError(null)

    try {
      console.log('🚨 Fetching weather alerts for:', location)

      // First geocode the location to get coordinates
      const geocodeResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`
      )
      const geocodeData = await geocodeResponse.json()

      if (!geocodeData || geocodeData.length === 0) {
        throw new Error('Location not found')
      }

      const { lat, lon } = geocodeData[0]
      console.log('📍 Alert coordinates:', { lat, lon })

      // Get NWS grid point
      const pointsResponse = await fetch(`https://api.weather.gov/points/${lat},${lon}`)
      if (!pointsResponse.ok) {
        throw new Error('Weather data not available for this location')
      }

      const pointsData = await pointsResponse.json()
      const { county } = pointsData.properties

      // Get alerts for the county/area
      const alertsResponse = await fetch(`https://api.weather.gov/alerts/active?area=${county}`)
      if (!alertsResponse.ok) {
        throw new Error('Failed to fetch weather alerts')
      }

      const alertsData = await alertsResponse.json()
      const activeAlerts = alertsData.features || []

      console.log(`🚨 Found ${activeAlerts.length} active weather alerts`)

      // Process alerts
      const processedAlerts = activeAlerts.map(alert => {
        const properties = alert.properties
        return {
          id: alert.id,
          title: properties.headline || properties.event || 'Weather Alert',
          description: properties.description || '',
          instruction: properties.instruction || '',
          severity: properties.severity || 'Unknown',
          urgency: properties.urgency || 'Unknown',
          areas: properties.areas || [],
          category: properties.category || 'Unknown',
          certainty: properties.certainty || 'Unknown',
          event: properties.event || 'Unknown',
          note: properties.note || '',
          effective: properties.effective ? new Date(properties.effective) : null,
          expires: properties.expires ? new Date(properties.expires) : null,
          sent: properties.sent ? new Date(properties.sent) : new Date(),
          geometry: alert.geometry,
          source: properties.senderName || 'National Weather Service'
        }
      })

      setAlerts(processedAlerts)

      // Show notifications for new alerts
      processedAlerts.forEach(alert => {
        const isUrgent = alert.urgency === 'Immediate' || alert.urgency === 'Expected'
        const isSevere = alert.severity === 'Extreme' || alert.severity === 'Severe'

        if (isUrgent || isSevere) {
          showNotification(alert.title, {
            body: `${alert.event} - ${alert.areas.join(', ')}`,
            urgent: true,
            icon: getAlertIcon(alert.severity),
            tag: `alert-${alert.id}`
          })
        }
      })

      return processedAlerts

    } catch (error) {
      console.error('❌ Error fetching weather alerts:', error)
      setError(error.message || 'Failed to fetch weather alerts')
      return []
    } finally {
      setLoading(false)
    }
  }, [showNotification])

  // Get alert icon based on severity
  const getAlertIcon = (severity) => {
    switch (severity) {
      case 'Extreme':
        return '🚨'
      case 'Severe':
        return '⚠️'
      case 'Moderate':
        return '⚡'
      case 'Minor':
        return '📢'
      default:
        return '🌤️'
    }
  }

  // Mark notification as read
  const markNotificationAsRead = useCallback((notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    )
  }, [])

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  // Clear specific notification
  const clearNotification = useCallback((notificationId) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== notificationId)
    )
  }, [])

  // Test notification
  const testNotification = useCallback(() => {
    if (permission === 'granted') {
      showNotification('Weather Alert Test', {
        body: 'This is a test weather alert notification',
        urgent: false,
        icon: '🌤️'
      })
    } else {
      requestNotificationPermission().then(granted => {
        if (granted) {
          showNotification('Weather Alert Test', {
            body: 'This is a test weather alert notification',
            urgent: false,
            icon: '🌤️'
          })
        }
      })
    }
  }, [permission, requestNotificationPermission, showNotification])

  const value = {
    alerts,
    notifications,
    permission,
    loading,
    error,
    requestNotificationPermission,
    showNotification,
    fetchWeatherAlerts,
    markNotificationAsRead,
    clearNotifications,
    clearNotification,
    testNotification
  }

  return (
    <AlertContext.Provider value={value}>
      {children}
    </AlertContext.Provider>
  )
}

// Custom hook to use alert context
export const useAlerts = () => {
  const context = useContext(AlertContext)
  if (!context) {
    throw new Error('useAlerts must be used within an AlertProvider')
  }
  return context
}

export default AlertContext

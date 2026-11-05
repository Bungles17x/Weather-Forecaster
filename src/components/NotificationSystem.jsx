import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { WeatherDeskIcon } from './WeatherIcons'
import './NotificationSystem.css'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([])
  const [maxNotifications] = useState(5)

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const addNotification = useCallback((notification) => {
    const id = Date.now()
    const newNotification = {
      id,
      type: notification.type || 'info',
      title: notification.title || '',
      message: notification.message || '',
      duration: notification.duration || 5000,
      persistent: notification.persistent || false,
      action: notification.action || null,
      progress: notification.progress || null,
      position: notification.position || 'top-right'
    }

    setNotifications(prev => {
      const updated = [...prev, newNotification]
      // Keep only the most recent maxNotifications
      return updated.slice(-maxNotifications)
    })

    if (!newNotification.persistent) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }

    return id
  }, [removeNotification, maxNotifications])

  const updateNotification = useCallback((id, updates) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  const success = useCallback((message, options = {}) => {
    return addNotification({ type: 'success', message, ...options })
  }, [addNotification])

  const error = useCallback((message, options = {}) => {
    return addNotification({ type: 'error', message, ...options })
  }, [addNotification])

  const warning = useCallback((message, options = {}) => {
    return addNotification({ type: 'warning', message, ...options })
  }, [addNotification])

  const info = useCallback((message, options = {}) => {
    return addNotification({ type: 'info', message, ...options })
  }, [addNotification])

  // Register with dev tools in development
  useEffect(() => {
    if (import.meta.env.DEV && typeof window !== 'undefined') {
      const api = {
        success,
        error,
        warning,
        info,
        addNotification,
        testAllNotifications: () => {
          success('Success notification test!', { title: 'Success' })
          setTimeout(() => error('Error notification test!', { title: 'Error', persistent: true }), 500)
          setTimeout(() => warning('Warning notification test!', { title: 'Warning', duration: 8000 }), 1000)
          setTimeout(() => info('Info notification test!', { title: 'Info', progress: 75 }), 1500)
        }
      }
      window.WeatherDeskDevTools = { ...window.WeatherDeskDevTools, ...api }
    }
  }, [success, error, warning, info, addNotification])

  return (
    <NotificationContext.Provider value={{ addNotification, removeNotification, clearAll, updateNotification, success, error, warning, info, notifications }}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}

function NotificationContainer() {
  const { notifications, removeNotification } = useNotifications()

  return (
    <div className="notification-container">
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  )
}

function NotificationItem({ notification, onClose }) {
  const { type, title, message, action, progress } = notification

  const icons = {
    success: 'check',
    error: 'thunderstorm',
    warning: 'alerts',
    info: 'info'
  }

  const colors = {
    success: '#ffffff',
    error: '#ffffff',
    warning: '#451a03',
    info: '#ffffff'
  }

  return (
    <div className={`notification notification-${type}`}>
      <div className="notification-icon" style={{ color: colors[type] }}>
        <WeatherDeskIcon name={icons[type]} size={20} />
      </div>
      <div className="notification-content">
        {title && <strong className="notification-title">{title}</strong>}
        <p className="notification-message">{message}</p>
        {action && (
          <button
            className="notification-action"
            onClick={() => {
              action.onClick()
              if (action.closeOnClick !== false) onClose()
            }}
          >
            {action.label}
          </button>
        )}
        {progress !== null && (
          <div className="notification-progress">
            <div
              className="notification-progress-bar"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
      <button
        className="notification-close"
        onClick={onClose}
        aria-label="Close notification"
      >
        <WeatherDeskIcon name="close" size={16} />
      </button>
    </div>
  )
}

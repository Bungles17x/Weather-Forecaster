import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getPointAlerts, resolveLocation } from '../services/weatherData'

const AlertContext = createContext()
export const useAlerts = () => {
  const context = useContext(AlertContext)
  if (!context) throw new Error('useAlerts must be used within an AlertProvider')
  return context
}

export function AlertProvider({ children }) {
  const [alerts, setAlerts] = useState([])
  const [notifications, setNotifications] = useState([])
  const [permission, setPermission] = useState('default')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if ('Notification' in window) setPermission(Notification.permission)
  }, [])

  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) { setError('Notifications are not supported by this browser.'); return false }
    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      if (result !== 'granted') setError(result === 'denied' ? 'Notification permission was denied in browser settings.' : null)
      return result === 'granted'
    } catch {
      setError('Could not request notification permission.')
      return false
    }
  }, [])

  const showNotification = useCallback((title, options = {}) => {
    if (permission !== 'granted' || !('Notification' in window)) return false
    try {
      const notification = new Notification(title, { body: options.body || '', tag: 'weatherdesk-nws-alert', renotify: false, icon: `${import.meta.env.BASE_URL}icons/weather-192.png` })
      notification.onclick = () => { window.focus(); window.location.hash = '/alerts'; notification.close() }
      setNotifications(previous => [{ id: Date.now(), title, body: options.body || '', timestamp: new Date(), urgent: Boolean(options.urgent), read: false }, ...previous].slice(0, 50))
      return true
    } catch {
      setError('Could not display a browser notification.')
      return false
    }
  }, [permission])

  const fetchWeatherAlerts = useCallback(async (location, coordinates) => {
    setLoading(true)
    setError(null)
    try {
      const coords = coordinates || await resolveLocation(location || 'Washington, District of Columbia')
      const data = await getPointAlerts(coords)
      setAlerts(data)
      return data
    } catch (fetchError) {
      setError(fetchError.message || 'Weather.gov alert data is unavailable.')
      return []
    } finally { setLoading(false) }
  }, [])

  const value = { alerts, notifications, permission, loading, error, requestNotificationPermission, showNotification, fetchWeatherAlerts, markNotificationRead: id => setNotifications(previous => previous.map(item => item.id === id ? { ...item, read: true } : item)) }
  return <AlertContext.Provider value={value}>{children}</AlertContext.Provider>
}

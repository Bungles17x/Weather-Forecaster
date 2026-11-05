import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useLocation } from './LocationContext'
import { useSettings } from './SettingsContext'
import { getWeatherBundle, validateWeatherData } from '../services/weatherData'
import { useNotifications } from '../components/NotificationSystem'

const WeatherContext = createContext(null)

export function WeatherProvider({ children }) {
  const { coordinates, ready: locationReady } = useLocation()
  const { settings } = useSettings()
  const { addNotification } = useNotifications()
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const lastLocationKey = React.useRef('')

  const refresh = useCallback(() => setRefreshKey(value => value + 1), [])

  useEffect(() => {
    if (!locationReady || !coordinates || !Number.isFinite(Number(coordinates.lat)) || !Number.isFinite(Number(coordinates.lon))) return undefined
    const controller = new AbortController()
    const locationKey = `${Number(coordinates.lat).toFixed(4)},${Number(coordinates.lon).toFixed(4)}`
    const locationChanged = lastLocationKey.current !== locationKey
    if (locationChanged) {
      lastLocationKey.current = locationKey
      setWeather(null)
    }
    const isRefresh = !locationChanged && Boolean(weather)
    setLoading(!isRefresh)
    setRefreshing(isRefresh)
    setError('')
    getWeatherBundle(coordinates, controller.signal)
      .then(result => {
        if (controller.signal.aborted) return
        setWeather(result)

        // Validate weather data
        const validation = validateWeatherData(result)

        // Show notification for data quality issues
        if (validation.warnings.length > 0) {
          addNotification({
            type: 'warning',
            title: 'Data Quality Notice',
            message: `Some weather data may be incomplete: ${validation.warnings.slice(0, 2).join(', ')}`,
            duration: 6000
          })
        }

        // Show success notification on refresh
        if (isRefresh && validation.dataQuality === 'Good') {
          addNotification({
            type: 'success',
            title: 'Weather Updated',
            message: 'All weather data loaded successfully',
            duration: 3000
          })
        }

        const available = Boolean(result.forecast || result.hourly || result.grid || result.observation || result.alerts.length)
        const labels = { forecast: 'forecast', hourly: 'hourly forecast', grid: 'forecast grid', alerts: 'active alerts', observation: 'station observations' }
        const unavailable = Object.entries(result.errors || {}).filter(([, message]) => Boolean(message)).map(([key]) => labels[key] || key)
        if (!available) {
          setError('The National Weather Service returned no usable weather products for this location. Check the location or retry later.')
          addNotification({
            type: 'error',
            title: 'No Weather Data',
            message: 'No weather products available for this location',
            duration: 8000
          })
        } else if (unavailable.length) {
          setError(`Some NWS products are temporarily unavailable (${unavailable.join(', ')}). Any returned products remain available; missing values are not estimated.`)
        } else {
          setError('')
        }
      })
      .catch(fetchError => {
        if (controller.signal.aborted) return
        setError(fetchError.message || 'Weather.gov could not be reached. Check your connection and retry.')
        addNotification({
          type: 'error',
          title: 'Weather Data Error',
          message: fetchError.message || 'Could not fetch weather data',
          duration: 8000
        })
      })
      .finally(() => {
        if (!controller.signal.aborted) { setLoading(false); setRefreshing(false) }
      })
    return () => controller.abort()
    // weather intentionally excluded: re-fetch only when location or explicit refresh changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coordinates?.lat, coordinates?.lon, locationReady, refreshKey])

  useEffect(() => {
    if (!settings.autoRefresh) return undefined
    const minutes = Math.max(5, Math.min(60, Number(settings.refreshInterval) || 10))
    const timer = window.setInterval(refresh, minutes * 60 * 1000)
    return () => window.clearInterval(timer)
  }, [refresh, settings.autoRefresh, settings.refreshInterval])

  const value = { weather, loading, refreshing, error, refresh, coordinates, autoRefresh: settings.autoRefresh, refreshInterval: settings.refreshInterval }
  return <WeatherContext.Provider value={value}>{children}</WeatherContext.Provider>
}

export function useWeather() {
  const context = useContext(WeatherContext)
  if (!context) throw new Error('useWeather must be used within a WeatherProvider')
  return context
}

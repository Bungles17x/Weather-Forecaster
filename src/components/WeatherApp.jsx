import React, { useState, useEffect, useCallback, useMemo } from 'react'
import Header from './Header'
import './WeatherApp.css'

const WeatherApp = () => {
  // Core state
  const [weatherData, setWeatherData] = useState(null)
  const [forecastData, setForecastData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [location, setLocation] = useState('New York, NY')
  const [lastUpdate, setLastUpdate] = useState(null)

  // NWS API endpoints
  const NWS_BASE_URL = 'https://api.weather.gov'
  const NWS_ALERTS_URL = 'https://api.weather.gov/alerts/active'

  // Get coordinates from location name using NWS geocoding
  const getCoordinatesFromLocation = useCallback(async (locationName) => {
    try {
      // First, get coordinates using a geocoding service
      const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(locationName)}&count=1&language=en&format=json`
      )
      
      if (!geoResponse.ok) {
        throw new Error('Failed to geocode location')
      }
      
      const geoData = await geoResponse.json()
      if (!geoData.results || geoData.results.length === 0) {
        throw new Error('Location not found')
      }
      
      const { latitude, longitude } = geoData.results[0]
      return { latitude, longitude }
    } catch (error) {
      console.error('Geocoding error:', error)
      throw error
    }
  }, [])

  // Get NWS office from coordinates
  const getNWSOffice = useCallback(async (lat, lon) => {
    try {
      const pointsUrl = `${NWS_BASE_URL}/points/${lat.toFixed(4)},${lon.toFixed(4)}`
      const response = await fetch(pointsUrl)
      
      if (!response.ok) {
        throw new Error('Failed to get NWS office')
      }
      
      const data = await response.json()
      return {
        office: data.properties.cwa,
        gridX: data.properties.gridX,
        gridY: data.properties.gridY,
        forecastZone: data.properties.forecastZone,
        county: data.properties.county
      }
    } catch (error) {
      console.error('NWS office error:', error)
      throw error
    }
  }, [])

  // Get current weather from NWS
  const getCurrentWeather = useCallback(async (office, gridX, gridY) => {
    try {
      const stationsUrl = `${NWS_BASE_URL}/gridpoints/${office}/${gridX},${gridY}/stations`
      const stationsResponse = await fetch(stationsUrl)
      
      if (!stationsResponse.ok) {
        throw new Error('Failed to get weather stations')
      }
      
      const stationsData = await stationsResponse.json()
      const stationId = stationsData.features[0].properties.stationIdentifier
      
      // Get latest observations from the station
      const observationsUrl = `${NWS_BASE_URL}/stations/${stationId}/observations/latest`
      const obsResponse = await fetch(observationsUrl)
      
      if (!obsResponse.ok) {
        throw new Error('Failed to get weather observations')
      }
      
      const obsData = await obsResponse.json()
      return obsData.features[0].properties
    } catch (error) {
      console.error('Current weather error:', error)
      throw error
    }
  }, [])

  // Get forecast from NWS
  const getForecast = useCallback(async (office, gridX, gridY) => {
    try {
      const forecastUrl = `${NWS_BASE_URL}/gridpoints/${office}/${gridX},${gridY}/forecast`
      const response = await fetch(forecastUrl)
      
      if (!response.ok) {
        throw new Error('Failed to get forecast')
      }
      
      const data = await response.json()
      return data.properties.periods
    } catch (error) {
      console.error('Forecast error:', error)
      throw error
    }
  }, [])

  // Get alerts from NWS
  const getAlerts = useCallback(async (lat, lon) => {
    try {
      const alertsUrl = `${NWS_ALERTS_URL}?point=${lat.toFixed(4)},${lon.toFixed(4)}`
      const response = await fetch(alertsUrl)
      
      if (!response.ok) {
        throw new Error('Failed to get weather alerts')
      }
      
      const data = await response.json()
      return data.features || []
    } catch (error) {
      console.error('Alerts error:', error)
      return []
    }
  }, [])

  // Main function to fetch all NWS data
  const fetchNWSData = useCallback(async (locationName) => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🌤️ Fetching NWS data for:', locationName)
      
      // Step 1: Get coordinates
      const { latitude, longitude } = await getCoordinatesFromLocation(locationName)
      console.log('📍 Coordinates:', { latitude, longitude })
      
      // Step 2: Get NWS office info
      const nwsInfo = await getNWSOffice(latitude, longitude)
      console.log('🏢 NWS Office:', nwsInfo)
      
      // Step 3: Get current weather
      const currentWeather = await getCurrentWeather(nwsInfo.office, nwsInfo.gridX, nwsInfo.gridY)
      console.log('🌡️ Current Weather:', currentWeather)
      
      // Step 4: Get forecast
      const forecast = await getForecast(nwsInfo.office, nwsInfo.gridX, nwsInfo.gridY)
      console.log('📅 Forecast:', forecast)
      
      // Step 5: Get alerts
      const alerts = await getAlerts(latitude, longitude)
      console.log('⚠️ Alerts:', alerts)
      
      // Process and set data
      const processedWeatherData = {
        location: locationName,
        coordinates: { latitude, longitude },
        current: {
          temperature: currentWeather.temperature?.value || null,
          description: currentWeather.textDescription || 'No data available',
          humidity: currentWeather.relativeHumidity?.value || null,
          windSpeed: currentWeather.windSpeed?.value || null,
          windDirection: currentWeather.windDirection || null,
          visibility: currentWeather.visibility?.value || null,
          pressure: currentWeather.barometricPressure?.value || null,
          timestamp: currentWeather.timestamp || null
        },
        nwsInfo: {
          office: nwsInfo.office,
          gridX: nwsInfo.gridX,
          gridY: nwsInfo.gridY,
          forecastZone: nwsInfo.forecastZone,
          county: nwsInfo.county
        },
        alerts: alerts,
        dataSource: 'NWS',
        lastUpdated: new Date().toISOString()
      }
      
      setWeatherData(processedWeatherData)
      setForecastData(forecast)
      setLastUpdate(new Date())
      setLocation(locationName)
      
    } catch (error) {
      console.error('❌ NWS fetch error:', error)
      setError(`Failed to fetch NWS data: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }, [getCoordinatesFromLocation, getNWSOffice, getCurrentWeather, getForecast, getAlerts])

  // Initial data fetch
  useEffect(() => {
    fetchNWSData(location)
  }, [])

  // Format temperature display
  const formatTemp = (temp) => {
    if (temp === null || temp === undefined) return '--°F'
    return `${Math.round(temp)}°F`
  }

  // Format wind speed
  const formatWindSpeed = (speed) => {
    if (speed === null || speed === undefined) return '-- mph'
    return `${Math.round(speed)} mph`
  }

  return (
    <div className="weather-app">
      <Header />
      
      <main className="weather-content">
        {loading && (
          <div className="loading-overlay">
            <div className="loading-content">
              <div className="loading-spinner"></div>
              <h3>Fetching NWS Weather Data...</h3>
              <p>Getting data from National Weather Service</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="error-notification">
            <div className="error-content">
              <div className="error-icon">⚠️</div>
              <div className="error-message">
                <h4>NWS Data Error</h4>
                <p>{error}</p>
                <button 
                  onClick={() => fetchNWSData(location)} 
                  className="retry-btn"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}
        
        {weatherData && !loading && !error && (
          <div className="nws-weather-display">
            <div className="nws-header">
              <h2>National Weather Service Data</h2>
              <p className="data-source">🇺🇸 Official U.S. Weather Data</p>
            </div>
            
            <div className="current-weather">
              <h3>Current Conditions in {weatherData.location}</h3>
              <div className="weather-main">
                <div className="temperature">
                  <span className="temp-value">{formatTemp(weatherData.current.temperature)}</span>
                  <span className="temp-desc">{weatherData.current.description}</span>
                </div>
                
                <div className="weather-details">
                  <div className="detail-item">
                    <span className="detail-label">Humidity:</span>
                    <span className="detail-value">
                      {weatherData.current.humidity !== null ? `${weatherData.current.humidity}%` : '--'}
                    </span>
                  </div>
                  
                  <div className="detail-item">
                    <span className="detail-label">Wind:</span>
                    <span className="detail-value">
                      {formatWindSpeed(weatherData.current.windSpeed)} {weatherData.current.windDirection || ''}
                    </span>
                  </div>
                  
                  <div className="detail-item">
                    <span className="detail-label">Visibility:</span>
                    <span className="detail-value">
                      {weatherData.current.visibility !== null ? `${weatherData.current.visibility} miles` : '--'}
                    </span>
                  </div>
                  
                  <div className="detail-item">
                    <span className="detail-label">Pressure:</span>
                    <span className="detail-value">
                      {weatherData.current.pressure !== null ? `${weatherData.current.pressure} mb` : '--'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="nws-info">
              <h4>NWS Office Information</h4>
              <div className="office-details">
                <div className="office-item">
                  <span className="office-label">Office:</span>
                  <span className="office-value">{weatherData.nwsInfo.office}</span>
                </div>
                <div className="office-item">
                  <span className="office-label">Grid:</span>
                  <span className="office-value">{weatherData.nwsInfo.gridX}, {weatherData.nwsInfo.gridY}</span>
                </div>
                <div className="office-item">
                  <span className="office-label">Zone:</span>
                  <span className="office-value">{weatherData.nwsInfo.forecastZone}</span>
                </div>
                <div className="office-item">
                  <span className="office-label">County:</span>
                  <span className="office-value">{weatherData.nwsInfo.county}</span>
                </div>
              </div>
            </div>
            
            {weatherData.alerts.length > 0 && (
              <div className="alerts-section">
                <h4>Active Alerts ({weatherData.alerts.length})</h4>
                <div className="alerts-list">
                  {weatherData.alerts.map((alert, index) => (
                    <div key={index} className="alert-item">
                      <div className="alert-header">
                        <span className="alert-event">{alert.properties.event}</span>
                        <span className="alert-severity">{alert.properties.severity}</span>
                      </div>
                      <div className="alert-description">
                        {alert.properties.description}
                      </div>
                      <div className="alert-areas">
                        <strong>Affected Areas:</strong> {alert.properties.areaDesc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {lastUpdate && (
              <div className="update-info">
                <p>Last updated: {lastUpdate.toLocaleString()}</p>
                <p>Data source: {weatherData.dataSource}</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default WeatherApp

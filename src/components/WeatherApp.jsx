import React, { useState, useEffect, useCallback } from 'react'
import Header from './Header'
import CurrentWeather from './CurrentWeather'
import HourlyForecast from './HourlyForecast'
import TenDayForecast from './TenDayForecast'
import WeatherMap from './WeatherMap'
import WeatherIndicators from './WeatherIndicators'

const WeatherApp = () => {
  const [weatherData, setWeatherData] = useState(null)
  const [forecastData, setForecastData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [location, setLocation] = useState('Mount Union, PA,US')

  const fetchWeatherData = useCallback(async (locationParam = location) => {
    setLoading(true)
    setError(null)
    
    try {
      const apiKey = import.meta.env.VITE_OPENWEATHER_KEY
      if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
        throw new Error('Please set your OpenWeather API key in .env file')
      }

      // Fetch current weather
      const currentResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${locationParam}&appid=${apiKey}&units=imperial`
      )
      
      if (!currentResponse.ok) {
        throw new Error(`Weather API error: ${currentResponse.status}`)
      }
      
      const currentData = await currentResponse.json()

      // Fetch 5-day forecast
      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${locationParam}&appid=${apiKey}&units=imperial`
      )
      
      if (!forecastResponse.ok) {
        throw new Error(`Forecast API error: ${forecastResponse.status}`)
      }
      
      const forecastData = await forecastResponse.json()

      setWeatherData(currentData)
      setForecastData(forecastData.list || [])
      setLastUpdate(new Date())
      setError(null)
    } catch (err) {
      console.error('Error fetching weather data:', err)
      setError(err.message)
      
      // Fallback to simulated data for demo
      if (process.env.NODE_ENV === 'development') {
        setWeatherData(getSimulatedWeatherData())
        setForecastData(getSimulatedForecastData())
        setLastUpdate(new Date())
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [location])

  const getSimulatedWeatherData = () => ({
    name: 'Mount Union',
    sys: { country: 'US', sunrise: 1640995200, sunset: 1641031200 },
    main: {
      temp: 72,
      feels_like: 75,
      temp_min: 65,
      temp_max: 78,
      humidity: 65,
      pressure: 1013
    },
    weather: [{ main: 'Clear', description: 'clear sky' }],
    wind: { speed: 8, deg: 180, gust: 12 },
    visibility: 10000,
    dt: Math.floor(Date.now() / 1000),
    clouds: { all: 10 }
  })

  const getSimulatedForecastData = () => {
    const forecast = []
    const now = Math.floor(Date.now() / 1000)
    
    for (let i = 0; i < 40; i++) {
      forecast.push({
        dt: now + (i * 3 * 3600),
        main: {
          temp: 70 + Math.sin(i / 5) * 10,
          temp_min: 65 + Math.sin(i / 5) * 8,
          temp_max: 75 + Math.sin(i / 5) * 12
        },
        weather: [{ 
          main: ['Clear', 'Clouds', 'Rain'][i % 3], 
          description: ['clear sky', 'few clouds', 'light rain'][i % 3] 
        }],
        wind: { speed: 5 + Math.random() * 10, deg: Math.random() * 360 },
        pop: Math.random() * 0.5
      })
    }
    
    return forecast
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchWeatherData()
  }

  const handleLocationChange = (newLocation) => {
    setLocation(newLocation)
    setLoading(true)
    fetchWeatherData(newLocation)
  }

  useEffect(() => {
    fetchWeatherData()
    
    // Set up auto-refresh every 10 minutes
    const interval = setInterval(() => {
      fetchWeatherData()
    }, 10 * 60 * 1000)

    return () => clearInterval(interval)
  }, [fetchWeatherData])

  if (loading && !weatherData) {
    return (
      <div className="weather-app-loading">
        <div className="loading-container">
          <div className="loading-icon">🌪️</div>
          <h2>Loading Weather Forecaster</h2>
          <div className="loading-spinner"></div>
          <p>Fetching latest weather data...</p>
        </div>
      </div>
    )
  }

  if (error && !weatherData) {
    return (
      <div className="weather-app-error">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>Weather Data Unavailable</h2>
          <p>{error}</p>
          <button className="retry-button" onClick={() => fetchWeatherData()}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="weather-app">
      <Header 
        onLocationChange={handleLocationChange}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        currentLocation={weatherData?.name}
        lastUpdate={lastUpdate}
      />
      
      <main className="weather-content">
        {refreshing && (
          <div className="refresh-indicator">
            <div className="refresh-spinner"></div>
            <span>Updating weather data...</span>
          </div>
        )}
        
        <CurrentWeather 
        data={weatherData} 
        location={location}
      />
        
        <WeatherIndicators data={weatherData} forecast={forecastData} />
        
        <HourlyForecast data={forecastData} />
        
        <TenDayForecast data={forecastData} />
        
        <WeatherMap />
        
        <footer className="weather-footer">
          <div className="container">
            <div className="footer-content">
              <div className="footer-section">
                <h4>Weather Forecaster</h4>
                <p>Professional weather information and forecasting</p>
                <p>Version 1.0.0</p>
              </div>
              
              <div className="footer-section">
                <h4>Data Sources</h4>
                <p>Powered by OpenWeatherMap</p>
                <p>Real-time weather API</p>
                <p>5-day forecast data</p>
              </div>
              
              <div className="footer-section">
                <h4>Last Updated</h4>
                <p>{lastUpdate ? lastUpdate.toLocaleString() : 'Unknown'}</p>
                <p>Auto-refresh every 10 minutes</p>
                <button onClick={handleRefresh} className="refresh-link">
                  Refresh Now
                </button>
              </div>
            </div>
            
            <div className="footer-bottom">
              <p>&copy; 2024 Weather Forecaster. All rights reserved.</p>
              <p>Weather data provided for informational purposes</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}

export default WeatherApp

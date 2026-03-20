import React, { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import Header from '../components/Header'
import HourlyForecast from '../components/HourlyForecast'
import TenDayForecast from '../components/TenDayForecast'
import '../pages/ForecastPage.css'

const ForecastPage = () => {
  const locationState = useLocation()
  const location = locationState.state?.location || 'New York, NY'
  
  const [forecastData, setForecastData] = useState([])
  const [hourlyData, setHourlyData] = useState([])
  const [currentWeather, setCurrentWeather] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dataQuality, setDataQuality] = useState('estimated')

  // Generate mock weather data
  const generateMockWeatherData = useCallback((lat, lon) => {
    const hourlyData = []
    const forecastData = []
    const now = new Date()
    
    // Generate 48 hours of hourly data
    for (let i = 0; i < 48; i++) {
      const time = new Date(now.getTime() + i * 60 * 60 * 1000)
      const baseTemp = 65 + Math.sin(i / 12 * Math.PI) * 15
      const temp = Math.round(baseTemp + Math.random() * 10 - 5)
      
      hourlyData.push({
        startTime: time.getTime(),
        temperature: temp,
        temperatureUnit: 'F',
        shortForecast: ['Clear', 'Partly Cloudy', 'Cloudy', 'Rain', 'Snow'][Math.floor(Math.random() * 5)],
        detailedForecast: `Temperature: ${temp}°F, Conditions: Variable`,
        windSpeed: `${Math.round(Math.random() * 20 + 5)} mph`,
        windDirection: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)],
        relativeHumidity: { value: Math.round(Math.random() * 40 + 40) },
        probabilityOfPrecipitation: { value: Math.round(Math.random() * 100) },
        pressure: Math.round(Math.random() * 50 + 980),
        visibility: Math.round(Math.random() * 10 + 5),
        uvIndex: Math.round(Math.random() * 11),
        clouds: Math.round(Math.random() * 100),
        feelsLike: temp + Math.round(Math.random() * 6 - 3)
      })
    }
    
    // Generate 10-day forecast
    for (let i = 0; i < 10; i++) {
      const date = new Date(now.getTime() + i * 24 * 60 * 60 * 1000)
      const highTemp = Math.round(70 + Math.random() * 20)
      const lowTemp = highTemp - Math.round(Math.random() * 15 + 10)
      
      forecastData.push({
        name: date.toLocaleDateString([], { weekday: 'long' }),
        startTime: date.getTime(),
        temperature: highTemp,
        temperatureUnit: 'F',
        shortForecast: ['Sunny', 'Partly Cloudy', 'Cloudy', 'Rainy', 'Stormy'][Math.floor(Math.random() * 5)],
        detailedForecast: `High: ${highTemp}°F, Low: ${lowTemp}°F. ${['Clear skies expected', 'Partly cloudy with chance of rain', 'Overcast conditions', 'Rain likely'][Math.floor(Math.random() * 4)]}.`,
        windSpeed: `${Math.round(Math.random() * 15 + 5)} mph`,
        windDirection: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)],
        relativeHumidity: Math.round(Math.random() * 30 + 50),
        precipitationChance: Math.round(Math.random() * 100)
      })
    }
    
    // Current weather
    const currentTemp = hourlyData[0]?.temperature || 65
    
    return {
      hourlyData,
      forecastData,
      currentWeather: {
        temperature: currentTemp,
        humidity: hourlyData[0]?.relativeHumidity?.value || 60,
        windSpeed: parseInt(hourlyData[0]?.windSpeed) || 10,
        windDirection: hourlyData[0]?.windDirection || 'N',
        pressure: hourlyData[0]?.pressure || 30,
        visibility: hourlyData[0]?.visibility || 10,
        conditions: hourlyData[0]?.shortForecast || 'Clear',
        feelsLike: currentTemp + Math.round(Math.random() * 6 - 3),
        dewPoint: currentTemp - 10,
        cloudCover: hourlyData[0]?.clouds || 50,
        uvIndex: hourlyData[0]?.uvIndex || 5,
        timestamp: new Date().toISOString()
      }
    }
  }, [])

  // Check if running on GitHub Pages (CORS issues)
  const isGitHubPages = window.location.hostname === 'bungles17x.github.io' || 
                       window.location.hostname.includes('github.io')

  useEffect(() => {
    const fetchWeatherData = async () => {
      setLoading(true)
      setError(null)
      
      if (isGitHubPages) {
        console.log('🚀 GitHub Pages detected, using enhanced mock data')
        setDataQuality('estimated')
        
        // Use mock data directly
        const mockWeatherData = generateMockWeatherData(40.7128, -74.0060)
        setForecastData(mockWeatherData.forecastData)
        setHourlyData(mockWeatherData.hourlyData)
        setCurrentWeather(mockWeatherData.currentWeather)
        setLoading(false)
        return
      }
      
      // For local development, try real APIs
      try {
        // Try Open-Meteo API (no CORS issues in local dev)
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=40.7128&longitude=-74.0060&hourly=temperature_2m,relativehumidity_2m,precipitation_probability,windspeed_10m,winddirection_10m,pressure_msl,visibility,uv_index&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max&timezone=auto`)
        
        if (response.ok) {
          const data = await response.json()
          console.log('🌍 Real weather data loaded:', data)
          setDataQuality('excellent')
          
          // Process real data
          const processedHourly = data.hourly.time.map((time, index) => ({
            startTime: new Date(time).getTime(),
            temperature: Math.round(data.hourly.temperature_2m[index] * 9/5 + 32),
            temperatureUnit: 'F',
            shortForecast: data.hourly.precipitation_probability[index] > 50 ? 'Rain' : 'Clear',
            detailedForecast: `Temperature: ${Math.round(data.hourly.temperature_2m[index] * 9/5 + 32)}°F`,
            windSpeed: `${Math.round(data.hourly.windspeed_10m[index] * 0.621371)} mph`,
            windDirection: 'N',
            relativeHumidity: { value: Math.round(data.hourly.relativehumidity_2m[index]) },
            probabilityOfPrecipitation: { value: Math.round(data.hourly.precipitation_probability[index]) },
            pressure: data.hourly.pressure_msl[index],
            visibility: data.hourly.visibility?.[index] || 10,
            uvIndex: data.hourly.uv_index?.[index] || 5,
            clouds: 50,
            feelsLike: Math.round(data.hourly.temperature_2m[index] * 9/5 + 32)
          }))
          
          const processedForecast = data.daily.time.map((time, index) => ({
            name: new Date(time).toLocaleDateString([], { weekday: 'long' }),
            startTime: new Date(time).getTime(),
            temperature: Math.round(data.daily.temperature_2m_max[index] * 9/5 + 32),
            temperatureUnit: 'F',
            shortForecast: 'Variable',
            detailedForecast: `High: ${Math.round(data.daily.temperature_2m_max[index] * 9/5 + 32)}°F, Low: ${Math.round(data.daily.temperature_2m_min[index] * 9/5 + 32)}°F`,
            windSpeed: `${Math.round(data.daily.windspeed_10m_max[index] * 0.621371)} mph`,
            windDirection: 'Variable',
            relativeHumidity: 65,
            precipitationChance: Math.round(data.daily.precipitation_sum[index] > 0 ? 80 : 20)
          }))
          
          setHourlyData(processedHourly)
          setForecastData(processedForecast)
          setCurrentWeather({
            temperature: processedHourly[0]?.temperature || 65,
            humidity: processedHourly[0]?.relativeHumidity?.value || 60,
            windSpeed: parseInt(processedHourly[0]?.windSpeed) || 10,
            windDirection: processedHourly[0]?.windDirection || 'N',
            pressure: processedHourly[0]?.pressure || 30,
            visibility: processedHourly[0]?.visibility || 10,
            conditions: processedHourly[0]?.shortForecast || 'Clear',
            feelsLike: processedHourly[0]?.feelsLike || 65,
            dewPoint: 55,
            cloudCover: 50,
            uvIndex: processedHourly[0]?.uvIndex || 5,
            timestamp: new Date().toISOString()
          })
        } else {
          throw new Error('API request failed')
        }
      } catch (error) {
        console.warn('⚠️ Real API failed, using mock data:', error)
        setDataQuality('estimated')
        
        // Fallback to mock data
        const mockWeatherData = generateMockWeatherData(40.7128, -74.0060)
        setForecastData(mockWeatherData.forecastData)
        setHourlyData(mockWeatherData.hourlyData)
        setCurrentWeather(mockWeatherData.currentWeather)
      }
      
      setLoading(false)
    }

    fetchWeatherData()
  }, [location, isGitHubPages, generateMockWeatherData])

  if (loading) {
    return (
      <div className="forecast-page">
        <Header />
        <div className="forecast-loading">
          <div className="loading-spinner"></div>
          <h2>Loading Forecast Data...</h2>
          <p>Fetching weather information for {location}</p>
          <div className="loading-progress">
            <div className="progress-bar">
              <div className="progress-fill"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="forecast-page">
        <Header />
        <div className="forecast-error">
          <h2>Weather Data Unavailable</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Try Again</button>
        </div>
      </div>
    )
  }

  return (
    <div className="forecast-page">
      <Header />
      <div className="forecast-content">
        <div className="forecast-header">
          <h1>Weather Forecast for {location}</h1>
          <div className="data-quality-indicator">
            Data Quality: <span className={`quality-${dataQuality}`}>{dataQuality}</span>
            {isGitHubPages && <span className="github-pages-note"> (GitHub Pages - Mock Data)</span>}
          </div>
        </div>
        
        {currentWeather && (
          <div className="current-weather">
            <h2>Current Conditions</h2>
            <div className="current-weather-grid">
              <div className="temperature-display">
                <span className="temp">{currentWeather.temperature}°</span>
                <span className="unit">F</span>
              </div>
              <div className="weather-details">
                <p>Feels like: {currentWeather.feelsLike}°F</p>
                <p>Conditions: {currentWeather.conditions}</p>
                <p>Humidity: {currentWeather.humidity}%</p>
                <p>Wind: {currentWeather.windSpeed} mph {currentWeather.windDirection}</p>
                <p>Pressure: {currentWeather.pressure} in</p>
                <p>UV Index: {currentWeather.uvIndex}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="forecast-sections">
          <div className="hourly-section">
            <h2>48-Hour Forecast</h2>
            <HourlyForecast data={hourlyData} />
          </div>
          
          <div className="daily-section">
            <h2>10-Day Forecast</h2>
            <TenDayForecast data={forecastData} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForecastPage

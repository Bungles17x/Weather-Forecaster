import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import { WeatherIcon } from '../components/WeatherIcons'
import './ForecastPage.css'

const ForecastPage = () => {
  const [activeTab, setActiveTab] = useState('today')
  const [forecastData, setForecastData] = useState([])
  const [hourlyData, setHourlyData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [location, setLocation] = useState('New York, NY')

  // Mock comprehensive forecast data with realistic weather patterns
  const generateMockForecastData = useCallback((seed = null) => {
    // Use seed for consistent data generation
    let seedValue = seed || Date.now()
    const random = () => {
      const x = Math.sin(seedValue++) * 10000
      return x - Math.floor(x)
    }
    
    const today = new Date()
    const hourly = []
    const daily = []
    
    // Get current season for realistic weather
    const month = today.getMonth()
    const season = month >= 3 && month <= 5 ? 'spring' : 
                  month >= 6 && month <= 8 ? 'summer' : 
                  month >= 9 && month <= 11 ? 'fall' : 'winter'
    
    // Seasonal weather patterns
    const seasonalConditions = {
      spring: ['Partly Cloudy', 'Mild', 'Light Rain', 'Sunny', 'Breezy'],
      summer: ['Hot and Sunny', 'Thunderstorms', 'Humid', 'Partly Cloudy', 'Warm'],
      fall: ['Cool', 'Partly Cloudy', 'Windy', 'Mild', 'Light Rain'],
      winter: ['Cold', 'Snow', 'Freezing Rain', 'Cloudy', 'Icy']
    }
    
    // Generate realistic hourly data based on time of day and season
    for (let i = 0; i < 24; i++) {
      const hour = new Date(today.getTime() + i * 60 * 60 * 1000)
      const hourOfDay = hour.getHours()
      
      // Realistic temperature variation throughout the day by season
      let baseTemp = 65
      if (season === 'summer') {
        baseTemp = 75
        if (hourOfDay >= 6 && hourOfDay < 12) {
          baseTemp = 70 + (hourOfDay - 6) * 1.5 // Morning warming
        } else if (hourOfDay >= 12 && hourOfDay < 17) {
          baseTemp = 85 + (hourOfDay - 12) * 1 // Afternoon peak
        } else if (hourOfDay >= 17 && hourOfDay < 21) {
          baseTemp = 78 - (hourOfDay - 17) * 1.5 // Evening cooling
        } else {
          baseTemp = 68 + (hourOfDay - 21) * 1 // Night cooling
        }
      } else if (season === 'winter') {
        baseTemp = 40
        if (hourOfDay >= 6 && hourOfDay < 12) {
          baseTemp = 35 + (hourOfDay - 6) * 1.2 // Morning warming
        } else if (hourOfDay >= 12 && hourOfDay < 17) {
          baseTemp = 42 + (hourOfDay - 12) * 0.8 // Afternoon peak
        } else if (hourOfDay >= 17 && hourOfDay < 21) {
          baseTemp = 38 - (hourOfDay - 17) * 1 // Evening cooling
        } else {
          baseTemp = 30 + (hourOfDay - 21) * 0.5 // Night cooling
        }
      } else if (season === 'spring') {
        baseTemp = 60
        if (hourOfDay >= 6 && hourOfDay < 12) {
          baseTemp = 55 + (hourOfDay - 6) * 1.3 // Morning warming
        } else if (hourOfDay >= 12 && hourOfDay < 17) {
          baseTemp = 68 + (hourOfDay - 12) * 1.2 // Afternoon peak
        } else if (hourOfDay >= 17 && hourOfDay < 21) {
          baseTemp = 62 - (hourOfDay - 17) * 1.3 // Evening cooling
        } else {
          baseTemp = 52 + (hourOfDay - 21) * 0.8 // Night cooling
        }
      } else { // fall
        baseTemp = 55
        if (hourOfDay >= 6 && hourOfDay < 12) {
          baseTemp = 50 + (hourOfDay - 6) * 1.4 // Morning warming
        } else if (hourOfDay >= 12 && hourOfDay < 17) {
          baseTemp = 63 + (hourOfDay - 12) * 1.1 // Afternoon peak
        } else if (hourOfDay >= 17 && hourOfDay < 21) {
          baseTemp = 57 - (hourOfDay - 17) * 1.4 // Evening cooling
        } else {
          baseTemp = 47 + (hourOfDay - 21) * 0.9 // Night cooling
        }
      }
      
      // Add some randomness for realism
      const temp = baseTemp + (random() - 0.5) * 3
      
      // Realistic weather conditions based on temperature, time, and season
      const conditions = seasonalConditions[season]
      let condition = conditions[Math.floor(random() * conditions.length)]
      let precipitation = 0
      let windSpeed = 8 + random() * 4
      let windDirection = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(random() * 8)]
      let humidity = 45 + random() * 20
      
      // Adjust conditions based on temperature
      if (temp > 85) {
        condition = 'Very Hot and Sunny'
        precipitation = 0
        humidity = 25 + random() * 10
        windSpeed = 5 + random() * 3
      } else if (temp > 75) {
        condition = 'Hot and Humid'
        precipitation = random() > 0.2 ? Math.floor(random() * 40) : 0
        humidity = 70 + random() * 15
        windSpeed = 6 + random() * 4
      } else if (temp > 65) {
        condition = 'Warm and Pleasant'
        precipitation = random() > 0.3 ? Math.floor(random() * 30) : 0
        humidity = 55 + random() * 15
        windSpeed = 8 + random() * 5
      } else if (temp > 55) {
        condition = 'Mild and Comfortable'
        precipitation = random() > 0.4 ? Math.floor(random() * 25) : 0
        humidity = 50 + random() * 15
        windSpeed = 10 + random() * 5
      } else if (temp > 45) {
        condition = 'Cool and Breezy'
        precipitation = random() > 0.5 ? Math.floor(random() * 20) : 0
        humidity = 60 + random() * 10
        windSpeed = 12 + random() * 6
      } else if (temp > 32) {
        condition = 'Cold and Clear'
        precipitation = 0
        humidity = 40 + random() * 15
        windSpeed = 8 + random() * 4
      } else {
        condition = 'Freezing Cold'
        precipitation = season === 'winter' ? Math.floor(random() * 30) : 0
        humidity = 35 + random() * 10
        windSpeed = 15 + random() * 8
      }
      
      hourly.push({
        time: hour.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        temperature: Math.round(temp),
        condition: condition,
        precipitation: precipitation,
        windSpeed: Math.round(windSpeed),
        windDirection: windDirection,
        humidity: Math.round(humidity)
      })
    }
    
    // Generate realistic daily forecast with seasonal patterns
    for (let i = 0; i < 10; i++) {
      const date = new Date(today.getTime() + i * 24 * 60 * 60 * 1000)
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' })
      
      // Create realistic daily patterns based on season
      let high, low, condition, precipitation
      
      if (season === 'summer') {
        const summerPattern = i % 7
        switch (summerPattern) {
          case 0: // Sunday - Hot
            high = 88 + random() * 4
            low = 72 + random() * 3
            condition = 'Hot and Sunny'
            precipitation = 0
            break
          case 1: // Monday - Thunderstorms
            high = 82 + random() * 3
            low = 68 + random() * 2
            condition = 'Thunderstorms'
            precipitation = 70 + random() * 20
            break
          case 2: // Tuesday - Humid
            high = 85 + random() * 2
            low = 70 + random() * 2
            condition = 'Hot and Humid'
            precipitation = random() > 0.3 ? Math.floor(random() * 40) : 0
            break
          case 3: // Wednesday - Partly cloudy
            high = 80 + random() * 3
            low = 65 + random() * 2
            condition = 'Partly Cloudy'
            precipitation = random() > 0.4 ? Math.floor(random() * 25) : 0
            break
          case 4: // Thursday - Sunny
            high = 86 + random() * 3
            low = 70 + random() * 2
            condition = 'Sunny'
            precipitation = 0
            break
          case 5: // Friday - Warm
            high = 83 + random() * 2
            low = 67 + random() * 2
            condition = 'Warm and Pleasant'
            precipitation = random() > 0.5 ? Math.floor(random() * 20) : 0
            break
          case 6: // Saturday - Mixed
            high = 79 + random() * 3
            low = 64 + random() * 2
            condition = 'Mixed Conditions'
            precipitation = 20 + random() * 15
            break
          default: // Back to Sunday pattern
            high = 87 + random() * 4
            low = 71 + random() * 3
            condition = 'Mostly Sunny'
            precipitation = 5 + random() * 10
        }
      } else if (season === 'winter') {
        const winterPattern = i % 7
        switch (winterPattern) {
          case 0: // Sunday - Cold
            high = 38 + random() * 3
            low = 25 + random() * 2
            condition = 'Cold and Clear'
            precipitation = 0
            break
          case 1: // Monday - Snow
            high = 32 + random() * 2
            low = 20 + random() * 2
            condition = 'Snow'
            precipitation = 60 + random() * 25
            break
          case 2: // Tuesday - Freezing
            high = 35 + random() * 2
            low = 22 + random() * 2
            condition = 'Freezing Rain'
            precipitation = 40 + random() * 20
            break
          case 3: // Wednesday - Cloudy
            high = 36 + random() * 2
            low = 24 + random() * 2
            condition = 'Cloudy'
            precipitation = 20 + random() * 15
            break
          case 4: // Thursday - Icy
            high = 34 + random() * 2
            low = 21 + random() * 2
            condition = 'Icy'
            precipitation = 30 + random() * 15
            break
          case 5: // Friday - Flurries
            high = 33 + random() * 2
            low = 19 + random() * 2
            condition = 'Snow Flurries'
            precipitation = 35 + random() * 20
            break
          case 6: // Saturday - Mixed
            high = 37 + random() * 2
            low = 23 + random() * 2
            condition = 'Wintry Mix'
            precipitation = 45 + random() * 20
            break
          default: // Back to Sunday pattern
            high = 39 + random() * 3
            low = 26 + random() * 2
            condition = 'Cold and Partly Cloudy'
            precipitation = 10 + random() * 10
        }
      } else if (season === 'spring') {
        const springPattern = i % 7
        switch (springPattern) {
          case 0: // Sunday - Mild
            high = 68 + random() * 3
            low = 48 + random() * 2
            condition = 'Mild and Sunny'
            precipitation = 0
            break
          case 1: // Monday - Showers
            high = 65 + random() * 2
            low = 45 + random() * 2
            condition = 'Light Showers'
            precipitation = 30 + random() * 15
            break
          case 2: // Tuesday - Partly cloudy
            high = 67 + random() * 2
            low = 46 + random() * 2
            condition = 'Partly Cloudy'
            precipitation = random() > 0.4 ? Math.floor(random() * 20) : 0
            break
          case 3: // Wednesday - Rain
            high = 62 + random() * 2
            low = 44 + random() * 2
            condition = 'Rainy'
            precipitation = 50 + random() * 20
            break
          case 4: // Thursday - Breezy
            high = 66 + random() * 2
            low = 47 + random() * 2
            condition = 'Breezy'
            precipitation = random() > 0.5 ? Math.floor(random() * 15) : 0
            break
          case 5: // Friday - Pleasant
            high = 70 + random() * 2
            low = 50 + random() * 2
            condition = 'Pleasant'
            precipitation = random() > 0.6 ? Math.floor(random() * 10) : 0
            break
          case 6: // Saturday - Mixed
            high = 64 + random() * 2
            low = 45 + random() * 2
            condition = 'Mixed Conditions'
            precipitation = 25 + random() * 15
            break
          default: // Back to Sunday pattern
            high = 69 + random() * 3
            low = 49 + random() * 2
            condition = 'Mostly Sunny'
            precipitation = 5 + random() * 8
        }
      } else { // fall
        const fallPattern = i % 7
        switch (fallPattern) {
          case 0: // Sunday - Crisp
            high = 62 + random() * 3
            low = 44 + random() * 2
            condition = 'Crisp and Clear'
            precipitation = 0
            break
          case 1: // Monday - Cool
            high = 58 + random() * 2
            low = 40 + random() * 2
            condition = 'Cool and Breezy'
            precipitation = random() > 0.4 ? Math.floor(random() * 15) : 0
            break
          case 2: // Tuesday - Rainy
            high = 55 + random() * 2
            low = 38 + random() * 2
            condition = 'Rainy'
            precipitation = 45 + random() * 20
            break
          case 3: // Wednesday - Windy
            high = 57 + random() * 2
            low = 39 + random() * 2
            condition = 'Windy'
            precipitation = random() > 0.5 ? Math.floor(random() * 12) : 0
            break
          case 4: // Thursday - Partly cloudy
            high = 60 + random() * 2
            low = 42 + random() * 2
            condition = 'Partly Cloudy'
            precipitation = random() > 0.3 ? Math.floor(random() * 18) : 0
            break
          case 5: // Friday - Mild
            high = 63 + random() * 2
            low = 45 + random() * 2
            condition = 'Mild'
            precipitation = random() > 0.6 ? Math.floor(random() * 8) : 0
            break
          case 6: // Saturday - Mixed
            high = 59 + random() * 2
            low = 41 + random() * 2
            condition = 'Fall Conditions'
            precipitation = 20 + random() * 12
            break
          default: // Back to Sunday pattern
            high = 64 + random() * 3
            low = 46 + random() * 2
            condition = 'Mostly Clear'
            precipitation = 3 + random() * 8
        }
      }
      
      daily.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        dayName: dayName,
        high: Math.round(high),
        low: Math.round(low),
        condition: condition,
        precipitation: precipitation,
        windSpeed: 10 + random() * 5,
        windDirection: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(random() * 8)],
        humidity: 50 + random() * 20
      })
    }
    
    return { hourly, daily }
  }, [])

  // Refresh function
  const handleRefresh = useCallback(() => {
    setLoading(true)
    setError(null)
    
    // Simulate API call with consistent data
    setTimeout(() => {
      const data = generateMockForecastData(Date.now())
      setHourlyData(data.hourly)
      setForecastData(data.daily)
      setLoading(false)
    }, 500)
  }, [generateMockForecastData])

  useEffect(() => {
    // Initial load
    handleRefresh()
  }, [handleRefresh])

  const tabs = [
    { id: 'today', label: 'Today', icon: '☀️' },
    { id: 'hourly', label: 'Hourly', icon: '⏰' },
    { id: 'daily', label: 'Daily', icon: '📅' },
    { id: 'extended', label: 'Extended', icon: '📆' },
    { id: 'tenDay', label: '10-Day', icon: '🗓️' },
    { id: 'summary', label: 'Summary', icon: '📊' }
  ]

  const renderTodayForecast = () => {
    const today = forecastData[0] || {}
    const currentHour = hourlyData[0] || {}
    
    return (
      <div className="today-forecast">
        <div className="today-main">
          <div className="today-current">
            <div className="current-icon">
              <WeatherIcon condition={today.condition} size={80} />
            </div>
            <div className="current-details">
              <h2>Today</h2>
              <div className="current-temp">{currentHour.temperature || today.high || '--'}°</div>
              <div className="current-condition">{today.condition || 'Loading...'}</div>
              <div className="current-high-low">
                <span>H: {today.high || '--'}°</span>
                <span>L: {today.low || '--'}°</span>
              </div>
            </div>
          </div>
          
          <div className="today-details">
            <div className="detail-row">
              <span className="detail-label">💧 Precipitation:</span>
              <span className="detail-value">{today.precipitation || 0}%</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">💨 Wind:</span>
              <span className="detail-value">{currentHour.windSpeed || today.windSpeed || '--'} mph</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">🌡️ Humidity:</span>
              <span className="detail-value">{currentHour.humidity || today.humidity || '--'}%</span>
            </div>
          </div>
        </div>
        
        <div className="hourly-preview">
          <h3>⏰ Hourly Preview</h3>
          <div className="hourly-scroll">
            {hourlyData.slice(0, 8).map((hour, index) => (
              <div key={index} className="hour-item">
                <div className="hour-time">{hour.time}</div>
                <div className="hour-icon">
                  <WeatherIcon condition={hour.condition} size={24} />
                </div>
                <div className="hour-temp">{hour.temperature}°</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderHourlyForecast = () => (
    <div className="hourly-forecast">
      <div className="hourly-header">
        <h3>⏰ Hourly Forecast</h3>
        <div className="hourly-controls">
          <button className="control-btn btn-primary" onClick={handleRefresh}>🔄 Refresh</button>
          <button className="control-btn btn-secondary">📊 Export</button>
        </div>
      </div>
      
      <div className="hourly-grid">
        {hourlyData.map((hour, index) => (
          <div key={index} className="hour-card">
            <div className="hour-time">{hour.time}</div>
            <div className="hour-icon">
              <WeatherIcon condition={hour.condition} size={32} />
            </div>
            <div className="hour-temp">{hour.temperature}°</div>
            <div className="hour-condition">{hour.condition}</div>
            <div className="hour-details">
              <div className="hour-detail">
                <span>💧 {hour.precipitation}%</span>
              </div>
              <div className="hour-detail">
                <span>💨 {hour.windSpeed} mph</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderDailyForecast = () => (
    <div className="daily-forecast">
      <div className="daily-header">
        <h3>📅 Daily Forecast</h3>
        <div className="daily-controls">
          <button className="control-btn btn-primary" onClick={handleRefresh}>🔄 Refresh</button>
          <button className="control-btn btn-secondary">📊 Export</button>
          <button className="control-btn btn-secondary">📧 Share</button>
        </div>
      </div>
      
      <div className="daily-grid">
        {forecastData.slice(0, 7).map((day, index) => (
          <div key={index} className="day-card">
            <div className="day-date">
              <div className="day-name">{day.dayName}</div>
              <div className="day-date">{day.date}</div>
            </div>
            <div className="day-icon">
              <WeatherIcon condition={day.condition} size={48} />
            </div>
            <div className="day-temps">
              <div className="day-high">H: {day.high}°</div>
              <div className="day-low">L: {day.low}°</div>
            </div>
            <div className="day-condition">{day.condition}</div>
            <div className="day-details">
              <div className="day-detail">
                <span>💧 {day.precipitation}%</span>
              </div>
              <div className="day-detail">
                <span>💨 {day.windSpeed} mph</span>
              </div>
              <div className="day-detail">
                <span>🌡️ {day.humidity}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderExtendedForecast = () => (
    <div className="extended-forecast">
      <div className="extended-header">
        <h3>📆 Extended Forecast</h3>
        <div className="extended-controls">
          <button className="control-btn btn-primary" onClick={handleRefresh}>🔄 Refresh</button>
          <button className="control-btn btn-secondary">📊 Export</button>
          <button className="control-btn btn-secondary">📧 Share</button>
          <button className="control-btn btn-secondary">📅 Calendar</button>
        </div>
      </div>
      
      <div className="extended-grid">
        {forecastData.map((day, index) => (
          <div key={index} className="extended-card">
            <div className="extended-date">
              <div className="extended-day">{day.dayName}</div>
              <div className="extended-date">{day.date}</div>
            </div>
            <div className="extended-icon">
              <WeatherIcon condition={day.condition} size={40} />
            </div>
            <div className="extended-temps">
              <div className="extended-high">{day.high}°</div>
              <div className="extended-low">{day.low}°</div>
            </div>
            <div className="extended-condition">{day.condition}</div>
            <div className="extended-summary">
              <div>Precip: {day.precipitation}%</div>
              <div>Wind: {day.windSpeed} mph</div>
              <div>Humidity: {day.humidity}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderTenDayForecast = () => (
    <div className="ten-day-forecast">
      <div className="ten-day-header">
        <h3>🗓️ 10-Day Forecast</h3>
        <div className="ten-day-controls">
          <button className="control-btn btn-primary" onClick={handleRefresh}>🔄 Refresh</button>
          <button className="control-btn btn-secondary">📊 Export</button>
          <button className="control-btn btn-secondary">📧 Share</button>
          <button className="control-btn btn-secondary">📅 Calendar</button>
          <button className="control-btn btn-secondary">📈 Trends</button>
        </div>
      </div>
      
      <div className="ten-day-grid">
        {forecastData.map((day, index) => (
          <div key={index} className="ten-day-card">
            <div className="ten-day-date">
              <div className="ten-day-name">{day.dayName.slice(0, 3)}</div>
              <div className="ten-day-date">{day.date}</div>
            </div>
            <div className="ten-day-icon">
              <WeatherIcon condition={day.condition} size={32} />
            </div>
            <div className="ten-day-temps">
              <div className="ten-day-high">{day.high}°</div>
              <div className="ten-day-low">{day.low}°</div>
            </div>
            <div className="ten-day-condition">{day.condition}</div>
            <div className="ten-day-precip">💧 {day.precipitation}%</div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderForecastSummary = () => {
    const avgHigh = Math.floor(forecastData.reduce((sum, day) => sum + day.high, 0) / forecastData.length)
    const avgLow = Math.floor(forecastData.reduce((sum, day) => sum + day.low, 0) / forecastData.length)
    const avgPrecip = Math.floor(forecastData.reduce((sum, day) => sum + day.precipitation, 0) / forecastData.length)
    const avgWind = Math.floor(forecastData.reduce((sum, day) => sum + day.windSpeed, 0) / forecastData.length)
    const avgHumidity = Math.floor(forecastData.reduce((sum, day) => sum + day.humidity, 0) / forecastData.length)
    
    const conditions = forecastData.map(day => day.condition)
    const mostCommon = conditions.sort((a,b) =>
      conditions.filter(v => v===a).length - conditions.filter(v => v===b).length
    ).pop()
    
    return (
      <div className="forecast-summary">
        <div className="summary-header">
          <h3>📊 Forecast Summary</h3>
          <div className="summary-controls">
            <button className="control-btn btn-primary" onClick={handleRefresh}>🔄 Refresh</button>
            <button className="control-btn btn-secondary">📊 Export</button>
            <button className="control-btn btn-secondary">📧 Share</button>
            <button className="control-btn btn-secondary">📈 Analysis</button>
          </div>
        </div>
        
        <div className="summary-content">
          <div className="summary-overview">
            <div className="overview-card">
              <h4>🌡️ Overview</h4>
              <div className="overview-item">
                <span className="overview-label">Most Common:</span>
                <span className="overview-value">{mostCommon}</span>
              </div>
              <div className="overview-item">
                <span className="overview-label">Average High:</span>
                <span className="overview-value">{avgHigh}°F</span>
              </div>
              <div className="overview-item">
                <span className="overview-label">Average Low:</span>
                <span className="overview-value">{avgLow}°F</span>
              </div>
            </div>
          </div>
          
          <div className="summary-averages">
            <div className="averages-card">
              <h4>📈 Averages</h4>
              <div className="average-item">
                <span className="average-label">💧 Precipitation:</span>
                <span className="average-value">{avgPrecip}%</span>
              </div>
              <div className="average-item">
                <span className="average-label">💨 Wind Speed:</span>
                <span className="average-value">{avgWind} mph</span>
              </div>
              <div className="average-item">
                <span className="average-label">🌡️ Humidity:</span>
                <span className="average-value">{avgHumidity}%</span>
              </div>
            </div>
          </div>
          
          <div className="summary-highlights">
            <div className="highlights-card">
              <h4>⚡ Highlights</h4>
              <div className="highlight-item">
                <span className="highlight-label">Hottest Day:</span>
                <span className="highlight-value">
                  {forecastData.reduce((max, day) => day.high > max.high ? day : max).dayName} ({forecastData.reduce((max, day) => day.high > max.high ? day : max).high}°)
                </span>
              </div>
              <div className="highlight-item">
                <span className="highlight-label">Coolest Day:</span>
                <span className="highlight-value">
                  {forecastData.reduce((min, day) => day.low < min.low ? day : min).dayName} ({forecastData.reduce((min, day) => day.low < min.low ? day : min).low}°)
                </span>
              </div>
              <div className="highlight-item">
                <span className="highlight-label">Wettest Day:</span>
                <span className="highlight-value">
                  {forecastData.reduce((max, day) => day.precipitation > max.precipitation ? day : max).dayName} ({forecastData.reduce((max, day) => day.precipitation > max.precipitation ? day : max).precipitation}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="forecast-loading">
          <div className="loading-spinner"></div>
          <h3>📅 Loading Forecast Data...</h3>
          <p>Getting comprehensive forecast information</p>
        </div>
      )
    }

    if (error) {
      return (
        <div className="forecast-error">
          <div className="error-icon">⚠️</div>
          <h3>Forecast Error</h3>
          <p>{error}</p>
          <button className="retry-btn" onClick={() => window.location.reload()}>
            🔄 Retry
          </button>
        </div>
      )
    }

    switch (activeTab) {
      case 'today':
        return renderTodayForecast()
      case 'hourly':
        return renderHourlyForecast()
      case 'daily':
        return renderDailyForecast()
      case 'extended':
        return renderExtendedForecast()
      case 'tenDay':
        return renderTenDayForecast()
      case 'summary':
        return renderForecastSummary()
      default:
        return renderTodayForecast()
    }
  }

  return (
    <div className="forecast-page">
      <Header />
      
      <div className="forecast-content">
        <div className="forecast-header">
          <Link to="/" className="back-link">
            <span className="back-icon">←</span>
            <span>Back to Weather</span>
          </Link>
          <div className="header-content">
            <h1>📅 Weather Forecast</h1>
            <p>Comprehensive weather forecasts with multiple views and detailed analysis</p>
          </div>
        </div>

        <div className="forecast-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="forecast-body">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}

export default ForecastPage

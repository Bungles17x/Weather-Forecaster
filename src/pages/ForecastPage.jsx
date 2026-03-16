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

  // Mock comprehensive forecast data
  const generateMockForecastData = useCallback(() => {
    const today = new Date()
    const hourly = []
    const daily = []
    
    // Generate hourly data for today
    for (let i = 0; i < 24; i++) {
      const hour = new Date(today.getTime() + i * 60 * 60 * 1000)
      hourly.push({
        time: hour.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        temperature: Math.floor(65 + Math.random() * 15),
        condition: ['Partly Cloudy', 'Sunny', 'Mostly Cloudy', 'Clear', 'Light Rain'][Math.floor(Math.random() * 5)],
        precipitation: Math.random() > 0.7 ? Math.floor(Math.random() * 100) : 0,
        windSpeed: Math.floor(5 + Math.random() * 15),
        windDirection: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)],
        humidity: Math.floor(40 + Math.random() * 40)
      })
    }
    
    // Generate daily data for 10 days
    for (let i = 0; i < 10; i++) {
      const date = new Date(today.getTime() + i * 24 * 60 * 60 * 1000)
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' })
      const conditions = ['Sunny', 'Partly Cloudy', 'Mostly Cloudy', 'Rainy', 'Thunderstorms', 'Clear', 'Light Rain', 'Foggy', 'Windy', 'Mixed Conditions']
      const condition = conditions[Math.floor(Math.random() * conditions.length)]
      
      daily.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        dayName: dayName,
        high: Math.floor(70 + Math.random() * 25),
        low: Math.floor(50 + Math.random() * 15),
        condition: condition,
        precipitation: Math.random() > 0.6 ? Math.floor(Math.random() * 80) : 0,
        windSpeed: Math.floor(5 + Math.random() * 20),
        humidity: Math.floor(30 + Math.random() * 50)
      })
    }
    
    return { hourly, daily }
  }, [])

  useEffect(() => {
    // Simulate loading and generate data
    setTimeout(() => {
      const data = generateMockForecastData()
      setHourlyData(data.hourly)
      setForecastData(data.daily)
      setLoading(false)
    }, 1000)
  }, [generateMockForecastData])

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
          <button className="control-btn btn-primary">🔄 Refresh</button>
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
          <button className="control-btn btn-primary">🔄 Refresh</button>
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
          <button className="control-btn btn-primary">🔄 Refresh</button>
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
          <button className="control-btn btn-primary">🔄 Refresh</button>
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
            <button className="control-btn btn-primary">🔄 Refresh</button>
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

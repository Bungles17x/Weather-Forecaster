import React, { useState, useEffect, useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Header from '../components/Header'
import { WeatherIcon } from '../components/WeatherIcons'
import { useLocation as useGlobalLocation } from '../contexts/LocationContext'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import './ForecastPage.css'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const ForecastPage = () => {
  const [activeTab, setActiveTab] = useState('today')
  const [forecastData, setForecastData] = useState([])
  const [hourlyData, setHourlyData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentWeather, setCurrentWeather] = useState(null)
  
  // Use global location context
  const { location: globalLocation, coordinates, setLocation: setGlobalLocation } = useGlobalLocation()
  const locationState = useLocation()
  
  // Get location from global context or URL state
  const location = globalLocation || locationState.state?.location || 'New York, NY'

  // Fetch real weather data from NWS API
  const fetchWeatherData = useCallback(async () => {
    if (!globalLocation) return
    
    setLoading(true)
    setError(null)
    
    try {
      console.log('🌤️ ForecastPage: Fetching weather data for:', globalLocation)
      
      // Use coordinates if available, otherwise geocode the location
      let lat, lon
      if (coordinates) {
        lat = coordinates.lat
        lon = coordinates.lon
        console.log('📍 ForecastPage: Using cached coordinates:', { lat, lon })
      } else {
        // Geocode location to get coordinates
        const geocodeResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(globalLocation)}&limit=1`)
        const geocodeData = await geocodeResponse.json()
        
        if (!geocodeData || geocodeData.length === 0) {
          throw new Error('Location not found')
        }
        
        lat = geocodeData[0].lat
        lon = geocodeData[0].lon
        console.log('📍 ForecastPage: Coordinates found:', { lat, lon })
      }
      
      // Step 2: Get NWS grid point
      const pointsResponse = await fetch(`https://api.weather.gov/points/${lat},${lon}`)
      if (!pointsResponse.ok) {
        throw new Error('Weather data not available for this location')
      }
      
      const pointsData = await pointsResponse.json()
      const { forecast, forecastHourly, forecastGridData } = pointsData.properties
      console.log('🏢 ForecastPage: NWS office:', pointsData.properties.cwa)
      
      // Step 3: Get current weather conditions
      try {
        const stationsResponse = await fetch(`${forecastGridData}/stations`)
        const stationsData = await stationsResponse.json()
        
        if (stationsData.features && stationsData.features.length > 0) {
          const stationId = stationsData.features[0].properties.stationIdentifier
          const observationsResponse = await fetch(`https://api.weather.gov/stations/${stationId}/observations/latest`)
          const observationsData = await observationsResponse.json()
          
          if (observationsData.properties) {
            const obs = observationsData.properties
            setCurrentWeather({
              temperature: Math.round(obs.temperature?.value * 9/5 + 32 || 0),
              condition: obs.textDescription || 'Unknown',
              humidity: Math.round(obs.relativeHumidity?.value || 0),
              windSpeed: Math.round((obs.windSpeed?.value || 0) * 2.237), // m/s to mph
              windDirection: obs.windDirection?.value || 0,
              visibility: Math.round((obs.visibility?.value || 0) * 0.621371), // km to miles
              pressure: Math.round((obs.barometricPressure?.value || 0) * 0.02953), // Pa to inHg
              timestamp: obs.timestamp
            })
            console.log('🌡️ ForecastPage: Current weather loaded')
          }
        }
      } catch (obsError) {
        console.log('⚠️ ForecastPage: Could not fetch current observations:', obsError.message)
      }
      
      // Step 4: Get daily forecast
      const forecastResponse = await fetch(forecast)
      const forecastResult = await forecastResponse.json()
      
      // Step 5: Get hourly forecast
      const hourlyResponse = await fetch(forecastHourly)
      const hourlyResult = await hourlyResponse.json()
      
      console.log('📅 ForecastPage: Processing forecast data...')
      
      // Process daily forecast data
      const dailyForecast = forecastResult.properties.periods
        .filter(period => period.isDaytime) // Only daytime periods
        .slice(0, 10) // Get 10 days
        .map((period, index) => {
          // Find corresponding nighttime period for low temperature
          const nightPeriod = forecastResult.properties.periods.find((p, i) => 
            i > index * 2 && !p.isDaytime
          )
          
          return {
            date: new Date(period.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            dayName: new Date(period.startTime).toLocaleDateString('en-US', { weekday: 'long' }),
            high: Math.round(period.temperature || 0),
            low: nightPeriod ? Math.round(nightPeriod.temperature || 0) : Math.round(period.temperature - 10),
            condition: period.shortForecast || 'Unknown',
            precipitation: period.probabilityOfPrecipitation?.value || 0,
            windSpeed: period.windSpeed?.split(' ')[0] || '10',
            windDirection: period.windDirection || 'N',
            humidity: 65, // NWS doesn't provide humidity in daily forecast
            detailedForecast: period.detailedForecast || '',
            icon: period.icon || ''
          }
        })
      
      // Process hourly forecast data
      const hourlyForecast = hourlyResult.properties.periods
        .slice(0, 48) // Get 48 hours
        .map(period => ({
          time: new Date(period.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          temperature: Math.round(period.temperature || 0),
          condition: period.shortForecast || 'Unknown',
          precipitation: period.probabilityOfPrecipitation?.value || 0,
          windSpeed: period.windSpeed?.split(' ')[0] || '10',
          windDirection: period.windDirection || 'N',
          humidity: 65, // NWS doesn't provide humidity in hourly forecast
          icon: period.icon || '',
          detailedForecast: period.detailedForecast || ''
        }))
      
      setForecastData(dailyForecast)
      setHourlyData(hourlyForecast)
      console.log('✅ ForecastPage: Real weather data loaded successfully')
      
    } catch (error) {
      console.error('❌ ForecastPage: Error fetching weather data:', error)
      setError(error.message || 'Failed to fetch weather data')
    } finally {
      setLoading(false)
    }
  }, [globalLocation, coordinates])

  // Refresh function
  const handleRefresh = useCallback(() => {
    fetchWeatherData()
  }, [fetchWeatherData])

  useEffect(() => {
    fetchWeatherData()
  }, [fetchWeatherData])

  const handleLocationChange = (newLocation) => {
    console.log('📍 ForecastPage: Location changed to:', newLocation)
    setGlobalLocation(newLocation)
  }

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
              <WeatherIcon condition={currentWeather?.condition || today.condition} size={80} />
            </div>
            <div className="current-details">
              <h2>Today</h2>
              <div className="current-temp">
                {currentWeather?.temperature || currentHour.temperature || today.high || '--'}°
              </div>
              <div className="current-condition">
                {currentWeather?.condition || today.condition || 'Loading...'}
              </div>
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
              <span className="detail-value">
                {currentWeather?.windSpeed || currentHour.windSpeed || today.windSpeed || '--'} mph {currentWeather?.windDirection || today.windDirection || ''}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">🌡️ Humidity:</span>
              <span className="detail-value">{currentWeather?.humidity || currentHour.humidity || today.humidity || '--'}%</span>
            </div>
            {currentWeather?.visibility && (
              <div className="detail-row">
                <span className="detail-label">👁️ Visibility:</span>
                <span className="detail-value">{(currentWeather.visibility * 0.000621371).toFixed(1)} mi</span>
              </div>
            )}
            {currentWeather?.pressure && (
              <div className="detail-row">
                <span className="detail-label">🔵 Pressure:</span>
                <span className="detail-value">{(currentWeather.pressure * 0.01).toFixed(1)} mb</span>
              </div>
            )}
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

  // Generate sample chart data for temperature trends
  const getTemperatureChartData = () => {
    const labels = forecastData.slice(0, 7).map(day => day.dayName)
    const highTemps = forecastData.slice(0, 7).map(day => day.high || Math.floor(Math.random() * 15) + 70)
    const lowTemps = forecastData.slice(0, 7).map(day => day.low || Math.floor(Math.random() * 10) + 50)
    
    return {
      labels,
      datasets: [
        {
          label: 'High Temperature',
          data: highTemps,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          tension: 0.4,
          fill: true,
        },
        {
          label: 'Low Temperature',
          data: lowTemps,
          borderColor: 'rgb(54, 162, 235)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          tension: 0.4,
          fill: true,
        },
      ],
    }
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'white',
          font: {
            size: 12
          }
        }
      },
      title: {
        display: true,
        text: '7-Day Temperature Trend',
        color: 'white',
        font: {
          size: 16
        }
      },
    },
    scales: {
      x: {
        ticks: {
          color: 'white'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
      y: {
        ticks: {
          color: 'white',
          callback: function(value) {
            return value + '°F'
          }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        title: {
          display: true,
          text: 'Temperature (°F)',
          color: 'white'
        }
      }
    }
  }

  const renderDailyForecast = () => (
    <div className="daily-forecast">
      <div className="daily-header">
        <h3>� Daily Forecast</h3>
        <div className="daily-controls">
          <button className="control-btn btn-primary" onClick={handleRefresh}>🔄 Refresh</button>
          <button className="control-btn btn-secondary">📊 Export</button>
          <button className="control-btn btn-secondary">📧 Share</button>
        </div>
      </div>
      
      {/* Temperature Trend Chart */}
      <div className="temperature-chart-section">
        <div className="chart-container">
          <Line data={getTemperatureChartData()} options={chartOptions} />
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
                <span>� {day.precipitation}%</span>
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
      <Header onLocationChange={handleLocationChange} />
      
      <div className="forecast-content">
        <div className="forecast-header">
          <Link to="/" className="back-link">
            <span className="back-icon">←</span>
            <span>Back to Weather</span>
          </Link>
          <div className="header-content">
            <h1>📅 Weather Forecast</h1>
            <p>Comprehensive weather forecasts with multiple views and detailed analysis for {location}</p>
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

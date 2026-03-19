import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Header from '../components/Header'
import { WeatherIcon } from '../components/WeatherIcons'
import { useLocation as useGlobalLocation } from '../contexts/LocationContext'
import HourlyForecast from '../components/HourlyForecast'
import TenDayForecast from '../components/TenDayForecast'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  BarElement
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'
import './ForecastPage.css'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
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
  const [selectedMetric, setSelectedMetric] = useState('temperature')
  const [expandedForecast, setExpandedForecast] = useState(false)
  const [weatherAlerts, setWeatherAlerts] = useState([])
  const [lastUpdated, setLastUpdated] = useState(null)
  
  // Use global location context
  const { location: globalLocation, coordinates, setLocation: setGlobalLocation } = useGlobalLocation()
  const locationState = useLocation()
  
  // Get location from global context or URL state
  const location = globalLocation || locationState.state?.location || 'New York, NY'

  // Enhanced fetch with better error handling and GitHub Pages compatibility
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
        // Geocode location to get coordinates with fallback
        try {
          const geocodeResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(globalLocation)}&limit=1`)
          const geocodeData = await geocodeResponse.json()
          
          if (!geocodeData || geocodeData.length === 0) {
            throw new Error('Location not found')
          }
          
          lat = geocodeData[0].lat
          lon = geocodeData[0].lon
          console.log('📍 ForecastPage: Coordinates found:', { lat, lon })
          
          // Cache coordinates in global context
          setGlobalLocation(globalLocation)
        } catch (geocodeError) {
          console.warn('⚠️ Geocoding failed, using default coordinates:', geocodeError)
          // Fallback to New York coordinates
          lat = 40.7128
          lon = -74.0060
        }
      }
      
      // Step 2: Get NWS grid point with better error handling
      let pointsResponse, pointsData
      try {
        pointsResponse = await fetch(`https://api.weather.gov/points/${lat},${lon}`)
        if (!pointsResponse.ok) {
          throw new Error(`Weather data not available: ${pointsResponse.status}`)
        }
        pointsData = await pointsResponse.json()
      } catch (nwsError) {
        console.warn('⚠️ NWS API failed, using OpenWeatherMap fallback:', nwsError)
        // Fallback to OpenWeatherMap
        return await fetchOpenWeatherData(lat, lon)
      }
      
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
              temperature: obs.temperature?.value ? Math.round(obs.temperature.value * 9/5 + 32) : null,
              humidity: obs.relativeHumidity?.value || null,
              windSpeed: obs.windSpeed?.value ? Math.round(obs.windSpeed.value * 2.237) : null,
              windDirection: obs.windDirection?.value || null,
              pressure: obs.barometricPressure?.value ? Math.round(obs.barometricPressure.value * 0.02953) : null,
              visibility: obs.visibility?.value ? Math.round(obs.visibility.value * 0.000621371) : null,
              conditions: obs.textDescription || 'Unknown',
              timestamp: obs.timestamp || new Date().toISOString()
            })
          }
        }
      } catch (obsError) {
        console.warn('⚠️ Could not fetch current conditions:', obsError)
      }
      
      // Step 4: Get forecast data
      const [dailyResponse, hourlyResponse] = await Promise.all([
        fetch(forecast),
        fetch(forecastHourly)
      ])
      
      if (!dailyResponse.ok || !hourlyResponse.ok) {
        throw new Error('Forecast data not available')
      }
      
      const [dailyData, hourlyDataRaw] = await Promise.all([
        dailyResponse.json(),
        hourlyResponse.json()
      ])
      
      // Process and set data
      setForecastData(dailyData.properties.periods || [])
      setHourlyData(hourlyDataRaw.properties.periods || [])
      setLastUpdated(new Date().toISOString())
      
      // Step 5: Get weather alerts
      try {
        const alertsResponse = await fetch(`https://api.weather.gov/alerts/active?point=${lat},${lon}`)
        if (alertsResponse.ok) {
          const alertsData = await alertsResponse.json()
          setWeatherAlerts(alertsData.features || [])
        }
      } catch (alertsError) {
        console.warn('⚠️ Could not fetch weather alerts:', alertsError)
      }
      
    } catch (error) {
      console.error('❌ ForecastPage: Error fetching weather data:', error)
      setError(error.message || 'Failed to fetch weather data')
    } finally {
      setLoading(false)
    }
  }, [globalLocation, coordinates, setGlobalLocation])

  // OpenWeatherMap fallback for GitHub Pages compatibility
  const fetchOpenWeatherData = async (lat, lon) => {
    console.log('🌐 Using OpenWeatherMap fallback for:', { lat, lon })
    
    try {
      // Get 5-day forecast
      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=demo`
      )
      
      if (!forecastResponse.ok) {
        throw new Error('OpenWeatherMap API not available')
      }
      
      const forecastData = await forecastResponse.json()
      
      // Process OpenWeatherMap data to match NWS format
      const processedHourly = forecastData.list.map(item => ({
        startTime: item.dt * 1000,
        temperature: Math.round(item.main.temp),
        temperatureUnit: 'F',
        shortForecast: item.weather[0].main,
        detailedForecast: item.weather[0].description,
        windSpeed: `${Math.round(item.wind.speed)} mph`,
        windDirection: getWindDirection(item.wind.deg),
        relativeHumidity: item.main.humidity,
        probabilityOfPrecipitation: { value: (item.pop || 0) * 100 }
      }))
      
      setHourlyData(processedHourly)
      
      // Create daily forecast from hourly data
      const dailyData = []
      const daysProcessed = new Set()
      
      processedHourly.forEach(item => {
        const date = new Date(item.startTime)
        const dayKey = date.toDateString()
        
        if (!daysProcessed.has(dayKey) && dailyData.length < 10) {
          daysProcessed.add(dayKey)
          
          const dayItems = processedHourly.filter(d => 
            new Date(d.startTime).toDateString() === dayKey
          )
          
          const temps = dayItems.map(d => d.temperature)
          const high = Math.max(...temps)
          const low = Math.min(...temps)
          
          dailyData.push({
            name: date.toLocaleDateString([], { weekday: 'long' }),
            startTime: item.startTime,
            temperature: high,
            temperatureUnit: 'F',
            shortForecast: item.shortForecast,
            detailedForecast: `High: ${high}°F, Low: ${low}°F. ${item.detailedForecast}`,
            windSpeed: item.windSpeed,
            windDirection: item.windDirection,
            relativeHumidity: dayItems[0].relativeHumidity
          })
        }
      })
      
      setForecastData(dailyData)
      setLastUpdated(new Date().toISOString())
      
    } catch (error) {
      console.error('❌ OpenWeatherMap fallback failed:', error)
      setError('Weather data not available. Please try again later.')
    }
  }

  // Helper function for wind direction
  const getWindDirection = (degrees) => {
    if (!degrees) return 'N'
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
    const index = Math.round(degrees / 45) % 8
    return directions[index]
  }

  // Enhanced chart data with multiple metrics
  const chartData = useMemo(() => {
    if (!hourlyData.length) return null
    
    const next24Hours = hourlyData.slice(0, 24)
    const labels = next24Hours.map(item => 
      new Date(item.startTime || item.dt * 1000).toLocaleTimeString([], { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    )
    
    const datasets = {
      temperature: {
        label: 'Temperature (°F)',
        data: next24Hours.map(item => item.temperature || Math.round((item.main?.temp || 70) * 9/5 + 32)),
        borderColor: '#FF6B6B',
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        fill: true,
        tension: 0.4
      },
      humidity: {
        label: 'Humidity (%)',
        data: next24Hours.map(item => item.relativeHumidity?.value || item.main?.humidity || 50),
        borderColor: '#4FC3F7',
        backgroundColor: 'rgba(79, 195, 247, 0.1)',
        fill: true,
        tension: 0.4
      },
      precipitation: {
        label: 'Precipitation Chance (%)',
        data: next24Hours.map(item => item.probabilityOfPrecipitation?.value || (item.pop || 0) * 100),
        borderColor: '#2196F3',
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        fill: true,
        tension: 0.4
      }
    }
    
    return {
      labels,
      datasets: [datasets[selectedMetric]]
    }
  }, [hourlyData, selectedMetric])

  // Chart options optimized for both environments
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      },
      tooltip: {
        mode: 'index',
        intersect: false
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false
        }
      },
      y: {
        display: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  }

  // Load data on mount and location change
  useEffect(() => {
    if (globalLocation) {
      fetchWeatherData()
    }
  }, [globalLocation, fetchWeatherData])

  // Auto-refresh every 10 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (globalLocation) {
        fetchWeatherData()
      }
    }, 10 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [globalLocation, fetchWeatherData])

  if (loading) {
    return (
      <div className="forecast-page">
        <Header />
        <div className="forecast-loading">
          <div className="loading-spinner"></div>
          <h2>Loading Forecast Data...</h2>
          <p>Fetching weather information for {location}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="forecast-page">
        <Header />
        <div className="forecast-error">
          <div className="error-icon">⚠️</div>
          <h2>Forecast Error</h2>
          <p>{error}</p>
          <button onClick={fetchWeatherData} className="retry-btn">
            🔄 Try Again
          </button>
          <Link to="/" className="back-btn">
            ← Back to Weather
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="forecast-page">
      <Header />
      
      <div className="forecast-header">
        <div className="header-content">
          <Link to="/" className="back-link">
            <span className="back-icon">←</span>
            <span className="back-text">Back to Weather</span>
          </Link>
          
          <div className="forecast-title">
            <h1>Weather Forecast</h1>
            <p className="location-name">{location}</p>
            {lastUpdated && (
              <p className="last-updated">
                Last updated: {new Date(lastUpdated).toLocaleTimeString()}
              </p>
            )}
          </div>
          
          {weatherAlerts.length > 0 && (
            <div className="weather-alerts">
              <div className="alert-badge">
                <span className="alert-icon">🚨</span>
                <span className="alert-count">{weatherAlerts.length}</span>
              </div>
              <div className="alert-summary">
                {weatherAlerts[0].properties.event}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="forecast-tabs">
        <button 
          className={`tab-btn ${activeTab === 'today' ? 'active' : ''}`}
          onClick={() => setActiveTab('today')}
        >
          Today
        </button>
        <button 
          className={`tab-btn ${activeTab === 'hourly' ? 'active' : ''}`}
          onClick={() => setActiveTab('hourly')}
        >
          Hourly
        </button>
        <button 
          className={`tab-btn ${activeTab === '10day' ? 'active' : ''}`}
          onClick={() => setActiveTab('10day')}
        >
          10-Day
        </button>
        <button 
          className={`tab-btn ${activeTab === 'charts' ? 'active' : ''}`}
          onClick={() => setActiveTab('charts')}
        >
          Charts
        </button>
      </div>

      <div className="forecast-content">
        {activeTab === 'today' && (
          <div className="today-forecast">
            <div className="current-conditions">
              {currentWeather && (
                <div className="current-weather-card">
                  <div className="current-temp">
                    <span className="temp-value">{currentWeather.temperature}</span>
                    <span className="temp-unit">°F</span>
                  </div>
                  <div className="current-details">
                    <p className="current-condition">{currentWeather.conditions}</p>
                    <div className="weather-details">
                      <div className="detail-item">
                        <span className="detail-label">Humidity:</span>
                        <span className="detail-value">{currentWeather.humidity}%</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Wind:</span>
                        <span className="detail-value">{currentWeather.windSpeed} mph {currentWeather.windDirection}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Pressure:</span>
                        <span className="detail-value">{currentWeather.pressure} in</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Visibility:</span>
                        <span className="detail-value">{currentWeather.visibility} mi</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {forecastData.length > 0 && (
              <div className="today-details">
                <h3>Today's Forecast</h3>
                <div className="period-forecast">
                  {forecastData.slice(0, 4).map((period, index) => (
                    <div key={index} className="period-card">
                      <div className="period-time">{period.name}</div>
                      <div className="period-temp">
                        {period.temperature}°{period.temperatureUnit}
                      </div>
                      <div className="period-condition">{period.shortForecast}</div>
                      <div className="period-details">
                        <p>{period.detailedForecast}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'hourly' && (
          <div className="hourly-forecast-section">
            <div className="section-header">
              <h2>24-Hour Forecast</h2>
              <button 
                className="expand-btn"
                onClick={() => setExpandedForecast(!expandedForecast)}
              >
                {expandedForecast ? 'Collapse' : 'Expand'}
              </button>
            </div>
            <HourlyForecast data={hourlyData} expanded={expandedForecast} />
          </div>
        )}

        {activeTab === '10day' && (
          <div className="ten-day-forecast-section">
            <div className="section-header">
              <h2>10-Day Forecast</h2>
              <p>Extended weather outlook</p>
            </div>
            <TenDayForecast data={hourlyData} />
          </div>
        )}

        {activeTab === 'charts' && (
          <div className="charts-section">
            <div className="chart-controls">
              <div className="metric-selector">
                <label htmlFor="metric-select">Display:</label>
                <select 
                  id="metric-select"
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value)}
                >
                  <option value="temperature">Temperature</option>
                  <option value="humidity">Humidity</option>
                  <option value="precipitation">Precipitation Chance</option>
                </select>
              </div>
            </div>
            
            <div className="chart-container">
              <h3>24-Hour {selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)} Trend</h3>
              {chartData && (
                <div className="chart-wrapper">
                  <Line data={chartData} options={chartOptions} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {weatherAlerts.length > 0 && (
        <div className="alerts-section">
          <h3>Weather Alerts</h3>
          <div className="alerts-list">
            {weatherAlerts.map((alert, index) => (
              <div key={index} className="alert-item">
                <div className="alert-header">
                  <span className="alert-title">{alert.properties.event}</span>
                  <span className="alert-severity">{alert.properties.severity}</span>
                </div>
                <div className="alert-description">
                  {alert.properties.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ForecastPage

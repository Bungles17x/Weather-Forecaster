import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
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
  BarElement,
  ArcElement,
  RadialLinearScale
} from 'chart.js'
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2'
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
  Filler,
  ArcElement,
  RadialLinearScale
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
  const [chartType, setChartType] = useState('line')
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h')
  const [comparisonMode, setComparisonMode] = useState(false)
  const [airQualityData, setAirQualityData] = useState(null)
  const [uvIndex, setUvIndex] = useState(null)
  const [sunriseSunset, setSunriseSunset] = useState(null)
  const [moonPhase, setMoonPhase] = useState(null)
  const [historicalData, setHistoricalData] = useState([])
  const [favorites, setFavorites] = useState([])
  const [isFavorite, setIsFavorite] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [offlineMode, setOfflineMode] = useState(false)
  const [cachedData, setCachedData] = useState(null)
  const [dataQuality, setDataQuality] = useState('excellent')
  const [animationEnabled, setAnimationEnabled] = useState(true)
  
  // Refs for performance optimization
  const chartRef = useRef(null)
  const updateIntervalRef = useRef(null)
  const abortControllerRef = useRef(null)
  
  // Use global location context
  const { location: globalLocation, coordinates, setLocation: setGlobalLocation } = useGlobalLocation()
  const locationState = useLocation()
  
  // Get location from global context or URL state
  const location = globalLocation || locationState.state?.location || 'New York, NY'

  // Enhanced fetch with comprehensive error handling and multiple data sources
  const fetchWeatherData = useCallback(async (forceRefresh = false) => {
    if (!globalLocation) return
    
    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    abortControllerRef.current = new AbortController()
    
    setLoading(true)
    setError(null)
    
    try {
      console.log('🌤️ ForecastPage: Enhanced fetch for:', globalLocation)
      
      // Check for cached data first (unless force refresh)
      if (!forceRefresh && cachedData && cachedData.location === globalLocation) {
        const cacheAge = Date.now() - new Date(cachedData.timestamp).getTime()
        if (cacheAge < 10 * 60 * 1000) { // 10 minutes cache
          console.log('📦 Using cached data')
          setForecastData(cachedData.forecastData)
          setHourlyData(cachedData.hourlyData)
          setCurrentWeather(cachedData.currentWeather)
          setWeatherAlerts(cachedData.weatherAlerts)
          setAirQualityData(cachedData.airQualityData)
          setUvIndex(cachedData.uvIndex)
          setSunriseSunset(cachedData.sunriseSunset)
          setMoonPhase(cachedData.moonPhase)
          setLastUpdated(cachedData.timestamp)
          setDataQuality('cached')
          setLoading(false)
          return
        }
      }
      
      // Use coordinates if available, otherwise geocode the location
      let lat, lon
      if (coordinates) {
        lat = coordinates.lat
        lon = coordinates.lon
        console.log('📍 Using cached coordinates:', { lat, lon })
      } else {
        // Enhanced geocoding with multiple providers
        try {
          const geocodePromises = [
            fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(globalLocation)}&limit=1`),
            fetch(`https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?address=${encodeURIComponent(globalLocation)}&f=json&maxLocations=1`)
          ]
          
          const geocodeResults = await Promise.allSettled(geocodePromises)
          let geocodeData = null
          
          for (const result of geocodeResults) {
            if (result.status === 'fulfilled' && result.value.ok) {
              const data = await result.value.json()
              if (data.length > 0 || data.candidates?.length > 0) {
                geocodeData = data.length > 0 ? data : data.candidates
                break
              }
            }
          }
          
          if (!geocodeData || geocodeData.length === 0) {
            throw new Error('Location not found')
          }
          
          lat = geocodeData[0].lat || geocodeData[0].location?.y
          lon = geocodeData[0].lon || geocodeData[0].location?.x
          console.log('📍 Coordinates found:', { lat, lon })
          
          // Cache coordinates in global context
          setGlobalLocation(globalLocation)
        } catch (geocodeError) {
          console.warn('⚠️ Geocoding failed, using default coordinates:', geocodeError)
          // Fallback to New York coordinates
          lat = 40.7128
          lon = -74.0060
          setDataQuality('estimated')
        }
      }
      
      // Enhanced data fetching with multiple sources
      const dataPromises = []
      
      // Primary NWS data
      try {
        const pointsResponse = await fetch(`https://api.weather.gov/points/${lat},${lon}`, {
          signal: abortControllerRef.current.signal
        })
        if (pointsResponse.ok) {
          const pointsData = await pointsResponse.json()
          const { forecast, forecastHourly, forecastGridData } = pointsData.properties
          
          // Add NWS data promises
          dataPromises.push(
            fetch(forecast, { signal: abortControllerRef.current.signal }),
            fetch(forecastHourly, { signal: abortControllerRef.current.signal }),
            fetch(`${forecastGridData}/stations`, { signal: abortControllerRef.current.signal })
          )
          
          // Current conditions
          const stationsResponse = await fetch(`${forecastGridData}/stations`, {
            signal: abortControllerRef.current.signal
          })
          if (stationsResponse.ok) {
            const stationsData = await stationsResponse.json()
            if (stationsData.features?.length > 0) {
              const stationId = stationsData.features[0].properties.stationIdentifier
              dataPromises.push(
                fetch(`https://api.weather.gov/stations/${stationId}/observations/latest`, {
                  signal: abortControllerRef.current.signal
                })
              )
            }
          }
          
          // Weather alerts
          dataPromises.push(
            fetch(`https://api.weather.gov/alerts/active?point=${lat},${lon}`, {
              signal: abortControllerRef.current.signal
            })
          )
          
          console.log('🏢 NWS office:', pointsData.properties.cwa)
        }
      } catch (nwsError) {
        console.warn('⚠️ NWS API failed, using fallbacks:', nwsError)
        setDataQuality('fallback')
      }
      
      // OpenWeatherMap fallback data
      dataPromises.push(
        fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=demo`, {
          signal: abortControllerRef.current.signal
        }),
        fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=demo`, {
          signal: abortControllerRef.current.signal
        })
      )
      
      // Air quality data
      dataPromises.push(
        fetch(`https://api.waqi.info/feed/geo:${lat};${lon}/?token=demo`, {
          signal: abortControllerRef.current.signal
        })
      )
      
      // UV index data
      dataPromises.push(
        fetch(`https://api.openuv.io/v1/uv?lat=${lat}&lon=${lng}&apikey=demo`, {
          signal: abortControllerRef.current.signal
        })
      )
      
      // Execute all data requests
      const results = await Promise.allSettled(dataPromises)
      
      // Process results
      let processedForecastData = []
      let processedHourlyData = []
      let processedCurrentWeather = null
      let processedAlerts = []
      let processedAirQuality = null
      let processedUVIndex = null
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.ok) {
          // Process based on the type of request
          // This would need to be expanded based on actual API responses
        }
      })
      
      // Process OpenWeatherMap data as primary fallback
      const owmForecastResult = results.find(r => 
        r.status === 'fulfilled' && r.value.url?.includes('forecast')
      )
      
      if (owmForecastResult) {
        const forecastData = await owmForecastResult.value.json()
        
        // Process hourly data
        processedHourlyData = forecastData.list.map(item => ({
          startTime: item.dt * 1000,
          temperature: Math.round(item.main.temp),
          temperatureUnit: 'F',
          shortForecast: item.weather[0].main,
          detailedForecast: item.weather[0].description,
          windSpeed: `${Math.round(item.wind.speed)} mph`,
          windDirection: getWindDirection(item.wind.deg),
          relativeHumidity: { value: item.main.humidity },
          probabilityOfPrecipitation: { value: (item.pop || 0) * 100 },
          pressure: item.main.pressure,
          visibility: item.visibility ? Math.round(item.visibility / 1609.34) : null,
          uvIndex: item.uvi || null,
          clouds: item.clouds.all,
          feelsLike: Math.round(item.main.feels_like)
        }))
        
        // Create daily forecast from hourly data
        const dailyData = []
        const daysProcessed = new Set()
        
        processedHourlyData.forEach(item => {
          const date = new Date(item.startTime)
          const dayKey = date.toDateString()
          
          if (!daysProcessed.has(dayKey) && dailyData.length < 10) {
            daysProcessed.add(dayKey)
            
            const dayItems = processedHourlyData.filter(d => 
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
              relativeHumidity: dayItems[0].relativeHumidity.value,
              precipitationChance: Math.max(...dayItems.map(d => d.probabilityOfPrecipitation.value))
            })
          }
        })
        
        processedForecastData = dailyData
      }
      
      // Process current weather
      const owmCurrentResult = results.find(r => 
        r.status === 'fulfilled' && r.value.url?.includes('weather')
      )
      
      if (owmCurrentResult) {
        const currentData = await owmCurrentResult.value.json()
        processedCurrentWeather = {
          temperature: Math.round(currentData.main.temp),
          humidity: currentData.main.humidity,
          windSpeed: Math.round(currentData.wind.speed),
          windDirection: getWindDirection(currentData.wind.deg),
          pressure: Math.round(currentData.main.pressure * 0.02953),
          visibility: currentData.visibility ? Math.round(currentData.visibility / 1609.34) : null,
          conditions: currentData.weather[0].description,
          feelsLike: Math.round(currentData.main.feels_like),
          dewPoint: Math.round(currentData.main.dew_point * 9/5 + 32),
          cloudCover: currentData.clouds.all,
          uvIndex: currentData.uvi || null,
          sunrise: currentData.sys.sunrise,
          sunset: currentData.sys.sunset,
          timestamp: new Date().toISOString()
        }
        
        setSunriseSunset({
          sunrise: currentData.sys.sunrise,
          sunset: currentData.sys.sunset
        })
      }
      
      // Process air quality
      const airQualityResult = results.find(r => 
        r.status === 'fulfilled' && r.value.url?.includes('waqi')
      )
      
      if (airQualityResult) {
        const aqiData = await airQualityResult.value.json()
        if (aqiData.status === 'ok') {
          processedAirQuality = {
            aqi: aqiData.data.aqi,
            level: getAQILevel(aqiData.data.aqi),
            description: getAQIDescription(aqiData.data.aqi),
            pm25: aqiData.data.iaqi.pm25?.v,
            pm10: aqiData.data.iaqi.pm10?.v,
            o3: aqiData.data.iaqi.o3?.v,
            no2: aqiData.data.iaqi.no2?.v,
            so2: aqiData.data.iaqi.so2?.v,
            co: aqiData.data.iaqi.co?.v
          }
        }
      }
      
      // Set all processed data
      setForecastData(processedForecastData)
      setHourlyData(processedHourlyData)
      setCurrentWeather(processedCurrentWeather)
      setWeatherAlerts(processedAlerts)
      setAirQualityData(processedAirQuality)
      setUvIndex(processedUVIndex)
      setLastUpdated(new Date().toISOString())
      
      // Cache the data
      const cacheData = {
        location: globalLocation,
        forecastData: processedForecastData,
        hourlyData: processedHourlyData,
        currentWeather: processedCurrentWeather,
        weatherAlerts: processedAlerts,
        airQualityData: processedAirQuality,
        uvIndex: processedUVIndex,
        sunriseSunset,
        moonPhase,
        timestamp: new Date().toISOString()
      }
      setCachedData(cacheData)
      
      // Save to localStorage for offline access
      try {
        localStorage.setItem('weatherCache', JSON.stringify(cacheData))
      } catch (e) {
        console.warn('Could not cache data:', e)
      }
      
      // Check if favorite
      const savedFavorites = JSON.parse(localStorage.getItem('favoriteLocations') || '[]')
      setIsFavorite(savedFavorites.includes(globalLocation))
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request aborted')
        return
      }
      
      console.error('❌ ForecastPage: Error fetching weather data:', error)
      setError(error.message || 'Failed to fetch weather data')
      
      // Try to load from localStorage cache
      try {
        const savedCache = localStorage.getItem('weatherCache')
        if (savedCache) {
          const cacheData = JSON.parse(savedCache)
          if (cacheData.location === globalLocation) {
            setForecastData(cacheData.forecastData || [])
            setHourlyData(cacheData.hourlyData || [])
            setCurrentWeather(cacheData.currentWeather)
            setWeatherAlerts(cacheData.weatherAlerts || [])
            setAirQualityData(cacheData.airQualityData)
            setUvIndex(cacheData.uvIndex)
            setLastUpdated(cacheData.timestamp)
            setOfflineMode(true)
            setDataQuality('offline')
            return
          }
        }
      } catch (cacheError) {
        console.error('Could not load cached data:', cacheError)
      }
    } finally {
      setLoading(false)
    }
  }, [globalLocation, coordinates, setGlobalLocation, cachedData])

  // Helper functions
  const getWindDirection = (degrees) => {
    if (!degrees) return 'N'
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
    const index = Math.round(degrees / 45) % 8
    return directions[index]
  }

  const getAQILevel = (aqi) => {
    if (aqi <= 50) return 'good'
    if (aqi <= 100) return 'moderate'
    if (aqi <= 150) return 'unhealthy_sensitive'
    if (aqi <= 200) return 'unhealthy'
    if (aqi <= 300) return 'very_unhealthy'
    return 'hazardous'
  }

  const getAQIDescription = (aqi) => {
    if (aqi <= 50) return 'Air quality is satisfactory'
    if (aqi <= 100) return 'Air quality is acceptable'
    if (aqi <= 150) return 'Sensitive groups may experience effects'
    if (aqi <= 200) return 'Everyone may begin to experience effects'
    if (aqi <= 300) return 'Health warnings of emergency conditions'
    return 'Emergency conditions: everyone affected'
  }

  const getUVIndexLevel = (uv) => {
    if (uv <= 2) return { level: 'low', color: '#4CAF50', description: 'Low' }
    if (uv <= 5) return { level: 'moderate', color: '#FFC107', description: 'Moderate' }
    if (uv <= 7) return { level: 'high', color: '#FF9800', description: 'High' }
    if (uv <= 10) return { level: 'very_high', color: '#F44336', description: 'Very High' }
    return { level: 'extreme', color: '#9C27B0', description: 'Extreme' }
  }

  // Enhanced chart data with multiple metrics and time ranges
  const chartData = useMemo(() => {
    if (!hourlyData.length) return null
    
    let timeRange = hourlyData
    if (selectedTimeRange === '12h') {
      timeRange = hourlyData.slice(0, 12)
    } else if (selectedTimeRange === '48h') {
      timeRange = hourlyData.slice(0, 48)
    } else if (selectedTimeRange === '7d') {
      timeRange = hourlyData.slice(0, 168) // 7 days * 24 hours
    }
    
    const labels = timeRange.map(item => 
      new Date(item.startTime || item.dt * 1000).toLocaleTimeString([], { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    )
    
    const datasets = {
      temperature: {
        label: 'Temperature (°F)',
        data: timeRange.map(item => item.temperature || Math.round((item.main?.temp || 70) * 9/5 + 32)),
        borderColor: '#FF6B6B',
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        fill: true,
        tension: 0.4
      },
      humidity: {
        label: 'Humidity (%)',
        data: timeRange.map(item => item.relativeHumidity?.value || item.main?.humidity || 50),
        borderColor: '#4FC3F7',
        backgroundColor: 'rgba(79, 195, 247, 0.1)',
        fill: true,
        tension: 0.4
      },
      precipitation: {
        label: 'Precipitation Chance (%)',
        data: timeRange.map(item => item.probabilityOfPrecipitation?.value || (item.pop || 0) * 100),
        borderColor: '#2196F3',
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        fill: true,
        tension: 0.4
      },
      pressure: {
        label: 'Pressure (inHg)',
        data: timeRange.map(item => item.pressure ? item.pressure * 0.02953 : 30),
        borderColor: '#9C27B0',
        backgroundColor: 'rgba(156, 39, 176, 0.1)',
        fill: true,
        tension: 0.4
      },
      windSpeed: {
        label: 'Wind Speed (mph)',
        data: timeRange.map(item => {
          const speed = item.windSpeed || item.wind?.speed || 0
          return typeof speed === 'string' ? parseInt(speed) : speed
        }),
        borderColor: '#FF9800',
        backgroundColor: 'rgba(255, 152, 0, 0.1)',
        fill: true,
        tension: 0.4
      },
      feelsLike: {
        label: 'Feels Like (°F)',
        data: timeRange.map(item => item.feelsLike || Math.round((item.main?.feels_like || 70) * 9/5 + 32)),
        borderColor: '#795548',
        backgroundColor: 'rgba(121, 85, 72, 0.1)',
        fill: true,
        tension: 0.4
      }
    }
    
    return {
      labels,
      datasets: [datasets[selectedMetric]]
    }
  }, [hourlyData, selectedMetric, selectedTimeRange])

  // Enhanced chart options with animations
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: animationEnabled ? 1000 : 0,
      easing: 'easeInOutQuart'
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: 'white',
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'white',
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        display: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'white'
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

  // Auto-refresh with configurable interval
  useEffect(() => {
    const interval = 10 * 60 * 1000 // 10 minutes
    
    updateIntervalRef.current = setInterval(() => {
      if (globalLocation && !offlineMode) {
        fetchWeatherData(true) // Force refresh
      }
    }, interval)
    
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
      }
    }
  }, [globalLocation, fetchWeatherData, offlineMode])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
      }
    }
  }, [])

  // Toggle favorite location
  const toggleFavorite = () => {
    const savedFavorites = JSON.parse(localStorage.getItem('favoriteLocations') || '[]')
    let newFavorites
    
    if (isFavorite) {
      newFavorites = savedFavorites.filter(loc => loc !== globalLocation)
    } else {
      newFavorites = [...savedFavorites, globalLocation]
    }
    
    localStorage.setItem('favoriteLocations', JSON.stringify(newFavorites))
    setFavorites(newFavorites)
    setIsFavorite(!isFavorite)
    
    // Show notification
    const notification = {
      id: Date.now(),
      message: isFavorite ? 'Removed from favorites' : 'Added to favorites',
      type: 'success'
    }
    setNotifications(prev => [...prev, notification])
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id))
    }, 3000)
  }

  // Share functionality
  const shareWeatherData = () => {
    const shareData = {
      title: `Weather Forecast for ${location}`,
      text: `Current: ${currentWeather?.temperature}°F, ${currentWeather?.conditions}`,
      url: window.location.href
    }
    
    if (navigator.share) {
      navigator.share(shareData)
    } else {
      navigator.clipboard.writeText(window.location.href)
      const notification = {
        id: Date.now(),
        message: 'Link copied to clipboard',
        type: 'success'
      }
      setNotifications(prev => [...prev, notification])
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id))
      }, 3000)
    }
  }

  // Export data functionality
  const exportData = () => {
    const exportData = {
      location,
      currentWeather,
      forecastData,
      hourlyData,
      lastUpdated,
      airQualityData,
      uvIndex
    }
    
    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `weather-data-${location}-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="forecast-page">
        <Header />
        <div className="forecast-loading">
          <div className="loading-spinner"></div>
          <h2>Loading Enhanced Forecast Data...</h2>
          <p>Fetching comprehensive weather information for {location}</p>
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
          <div className="error-icon">⚠️</div>
          <h2>Forecast Error</h2>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={() => fetchWeatherData(true)} className="retry-btn">
              🔄 Try Again
            </button>
            <button onClick={() => setOfflineMode(true)} className="offline-btn">
              📱 Use Offline Data
            </button>
            <Link to="/" className="back-btn">
              ← Back to Weather
            </Link>
          </div>
          {offlineMode && (
            <div className="offline-notice">
              <p>📱 Using cached data - some features may be limited</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="forecast-page">
      <Header />
      
      {/* Notifications */}
      <div className="notifications-container">
        {notifications.map(notification => (
          <div key={notification.id} className={`notification ${notification.type}`}>
            {notification.message}
          </div>
        ))}
      </div>
      
      <div className="forecast-header">
        <div className="header-content">
          <Link to="/" className="back-link">
            <span className="back-icon">←</span>
            <span className="back-text">Back to Weather</span>
          </Link>
          
          <div className="forecast-title">
            <h1>Enhanced Weather Forecast</h1>
            <p className="location-name">{location}</p>
            <div className="header-meta">
              {lastUpdated && (
                <p className="last-updated">
                  Last updated: {new Date(lastUpdated).toLocaleTimeString()}
                </p>
              )}
              <div className="data-quality">
                <span className={`quality-indicator ${dataQuality}`}>
                  {dataQuality === 'excellent' && '🟢 Excellent'}
                  {dataQuality === 'cached' && '🟡 Cached'}
                  {dataQuality === 'fallback' && '🟠 Fallback'}
                  {dataQuality === 'estimated' && '🔴 Estimated'}
                  {dataQuality === 'offline' && '📱 Offline'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="header-actions">
            <button 
              onClick={toggleFavorite}
              className={`favorite-btn ${isFavorite ? 'active' : ''}`}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              {isFavorite ? '❤️' : '🤍'}
            </button>
            
            <button 
              onClick={shareWeatherData}
              className="share-btn"
              title="Share weather data"
            >
              📤
            </button>
            
            <button 
              onClick={exportData}
              className="export-btn"
              title="Export weather data"
            >
              💾
            </button>
            
            <button 
              onClick={() => setAnimationEnabled(!animationEnabled)}
              className="animation-btn"
              title={animationEnabled ? 'Disable animations' : 'Enable animations'}
            >
              {animationEnabled ? '✨' : '⏸️'}
            </button>
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
        <button 
          className={`tab-btn ${activeTab === 'air' ? 'active' : ''}`}
          onClick={() => setActiveTab('air')}
        >
          Air Quality
        </button>
        <button 
          className={`tab-btn ${activeTab === 'analysis' ? 'active' : ''}`}
          onClick={() => setActiveTab('analysis')}
        >
          Analysis
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
                    <span className="feels-like">Feels like {currentWeather.feelsLike}°</span>
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
                      <div className="detail-item">
                        <span className="detail-label">Dew Point:</span>
                        <span className="detail-value">{currentWeather.dewPoint}°F</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Cloud Cover:</span>
                        <span className="detail-value">{currentWeather.cloudCover}%</span>
                      </div>
                      {uvIndex && (
                        <div className="detail-item">
                          <span className="detail-label">UV Index:</span>
                          <span className="detail-value" style={{ color: getUVIndexLevel(uvIndex).color }}>
                            {uvIndex} ({getUVIndexLevel(uvIndex).description})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Sun/Moon Information */}
              {sunriseSunset && (
                <div className="sun-moon-card">
                  <div className="sun-info">
                    <div className="sun-item">
                      <span className="sun-icon">🌅</span>
                      <div>
                        <div className="sun-label">Sunrise</div>
                        <div className="sun-time">
                          {new Date(sunriseSunset.sunrise * 1000).toLocaleTimeString([], { 
                            hour: 'numeric', 
                            minute: '2-digit',
                            hour12: true 
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="sun-item">
                      <span className="sun-icon">🌇</span>
                      <div>
                        <div className="sun-label">Sunset</div>
                        <div className="sun-time">
                          {new Date(sunriseSunset.sunset * 1000).toLocaleTimeString([], { 
                            hour: 'numeric', 
                            minute: '2-digit',
                            hour12: true 
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Air Quality Card */}
            {airQualityData && (
              <div className="air-quality-card">
                <h3>Air Quality</h3>
                <div className="aqi-display">
                  <div className={`aqi-value ${airQualityData.level}`}>
                    {airQualityData.aqi}
                  </div>
                  <div className="aqi-info">
                    <div className="aqi-level">{airQualityData.level.replace('_', ' ').toUpperCase()}</div>
                    <div className="aqi-description">{airQualityData.description}</div>
                  </div>
                </div>
                <div className="pollutants">
                  {airQualityData.pm25 && (
                    <div className="pollutant">
                      <span className="pollutant-name">PM2.5</span>
                      <span className="pollutant-value">{airQualityData.pm25}</span>
                    </div>
                  )}
                  {airQualityData.pm10 && (
                    <div className="pollutant">
                      <span className="pollutant-name">PM10</span>
                      <span className="pollutant-value">{airQualityData.pm10}</span>
                    </div>
                  )}
                  {airQualityData.o3 && (
                    <div className="pollutant">
                      <span className="pollutant-name">O₃</span>
                      <span className="pollutant-value">{airQualityData.o3}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
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
                        {period.precipitationChance && (
                          <div className="precipitation-chance">
                            🌧️ {period.precipitationChance}%
                          </div>
                        )}
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
              <div className="header-controls">
                <button 
                  className="expand-btn"
                  onClick={() => setExpandedForecast(!expandedForecast)}
                >
                  {expandedForecast ? 'Collapse' : 'Expand'}
                </button>
                <button 
                  className="refresh-btn"
                  onClick={() => fetchWeatherData(true)}
                >
                  🔄 Refresh
                </button>
              </div>
            </div>
            <HourlyForecast data={hourlyData} expanded={expandedForecast} />
          </div>
        )}

        {activeTab === '10day' && (
          <div className="ten-day-forecast-section">
            <div className="section-header">
              <h2>10-Day Forecast</h2>
              <p>Extended weather outlook with detailed analysis</p>
            </div>
            <TenDayForecast data={hourlyData} />
          </div>
        )}

        {activeTab === 'charts' && (
          <div className="charts-section">
            <div className="chart-controls">
              <div className="control-group">
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
                    <option value="pressure">Pressure</option>
                    <option value="windSpeed">Wind Speed</option>
                    <option value="feelsLike">Feels Like</option>
                  </select>
                </div>
                
                <div className="time-range-selector">
                  <label htmlFor="time-range">Time Range:</label>
                  <select 
                    id="time-range"
                    value={selectedTimeRange}
                    onChange={(e) => setSelectedTimeRange(e.target.value)}
                  >
                    <option value="12h">12 Hours</option>
                    <option value="24h">24 Hours</option>
                    <option value="48h">48 Hours</option>
                    <option value="7d">7 Days</option>
                  </select>
                </div>
                
                <div className="chart-type-selector">
                  <label htmlFor="chart-type">Chart Type:</label>
                  <select 
                    id="chart-type"
                    value={chartType}
                    onChange={(e) => setChartType(e.target.value)}
                  >
                    <option value="line">Line Chart</option>
                    <option value="bar">Bar Chart</option>
                  </select>
                </div>
              </div>
              
              <div className="chart-actions">
                <button 
                  className="comparison-btn"
                  onClick={() => setComparisonMode(!comparisonMode)}
                >
                  {comparisonMode ? 'Hide Comparison' : 'Show Comparison'}
                </button>
                <button 
                  className="download-btn"
                  onClick={() => {
                    if (chartRef.current) {
                      const canvas = chartRef.current.canvas
                      const url = canvas.toDataURL('image/png')
                      const link = document.createElement('a')
                      link.download = `weather-chart-${selectedMetric}-${new Date().toISOString().split('T')[0]}.png`
                      link.href = url
                      link.click()
                    }
                  }}
                >
                  📥 Download
                </button>
              </div>
            </div>
            
            <div className="chart-container">
              <h3>24-Hour {selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)} Trend</h3>
              {chartData && (
                <div className="chart-wrapper" ref={chartRef}>
                  {chartType === 'line' ? (
                    <Line data={chartData} options={chartOptions} />
                  ) : (
                    <Bar data={chartData} options={chartOptions} />
                  )}
                </div>
              )}
            </div>
            
            {comparisonMode && (
              <div className="comparison-chart">
                <h3>Historical Comparison</h3>
                {/* Add historical comparison chart here */}
              </div>
            )}
          </div>
        )}

        {activeTab === 'air' && (
          <div className="air-quality-section">
            <div className="section-header">
              <h2>Air Quality & Environmental Data</h2>
              <p>Detailed air quality information and health recommendations</p>
            </div>
            
            {airQualityData && (
              <div className="air-quality-details">
                <div className="aqi-main">
                  <div className={`aqi-circle ${airQualityData.level}`}>
                    <div className="aqi-number">{airQualityData.aqi}</div>
                    <div className="aqi-label">AQI</div>
                  </div>
                  <div className="aqi-info">
                    <h3>{airQualityData.level.replace('_', ' ').toUpperCase()}</h3>
                    <p>{airQualityData.description}</p>
                    <div className="health-recommendations">
                      {airQualityData.aqi <= 50 && <p>✅ Air quality is satisfactory for most people</p>}
                      {airQualityData.aqi > 50 && airQualityData.aqi <= 100 && <p>⚠️ Unusually sensitive people should consider limiting prolonged outdoor exertion</p>}
                      {airQualityData.aqi > 100 && airQualityData.aqi <= 150 && <p>🚨 Sensitive groups should limit prolonged outdoor exertion</p>}
                      {airQualityData.aqi > 150 && <p>🚨 Everyone should limit prolonged outdoor exertion</p>}
                    </div>
                  </div>
                </div>
                
                <div className="pollutants-grid">
                  <h3>Pollutant Breakdown</h3>
                  <div className="pollutant-cards">
                    {airQualityData.pm25 && (
                      <div className="pollutant-card">
                        <div className="pollutant-header">
                          <span className="pollutant-name">PM2.5</span>
                          <span className="pollutant-value">{airQualityData.pm25}</span>
                        </div>
                        <div className="pollutant-bar">
                          <div className="pollutant-fill" style={{ width: `${Math.min(airQualityData.pm25, 100)}%` }}></div>
                        </div>
                      </div>
                    )}
                    {airQualityData.pm10 && (
                      <div className="pollutant-card">
                        <div className="pollutant-header">
                          <span className="pollutant-name">PM10</span>
                          <span className="pollutant-value">{airQualityData.pm10}</span>
                        </div>
                        <div className="pollutant-bar">
                          <div className="pollutant-fill" style={{ width: `${Math.min(airQualityData.pm10, 100)}%` }}></div>
                        </div>
                      </div>
                    )}
                    {airQualityData.o3 && (
                      <div className="pollutant-card">
                        <div className="pollutant-header">
                          <span className="pollutant-name">Ozone</span>
                          <span className="pollutant-value">{airQualityData.o3}</span>
                        </div>
                        <div className="pollutant-bar">
                          <div className="pollutant-fill" style={{ width: `${Math.min(airQualityData.o3, 100)}%` }}></div>
                        </div>
                      </div>
                    )}
                    {airQualityData.no2 && (
                      <div className="pollutant-card">
                        <div className="pollutant-header">
                          <span className="pollutant-name">NO₂</span>
                          <span className="pollutant-value">{airQualityData.no2}</span>
                        </div>
                        <div className="pollutant-bar">
                          <div className="pollutant-fill" style={{ width: `${Math.min(airQualityData.no2, 100)}%` }}></div>
                        </div>
                      </div>
                    )}
                    {airQualityData.so2 && (
                      <div className="pollutant-card">
                        <div className="pollutant-header">
                          <span className="pollutant-name">SO₂</span>
                          <span className="pollutant-value">{airQualityData.so2}</span>
                        </div>
                        <div className="pollutant-bar">
                          <div className="pollutant-fill" style={{ width: `${Math.min(airQualityData.so2, 100)}%` }}></div>
                        </div>
                      </div>
                    )}
                    {airQualityData.co && (
                      <div className="pollutant-card">
                        <div className="pollutant-header">
                          <span className="pollutant-name">CO</span>
                          <span className="pollutant-value">{airQualityData.co}</span>
                        </div>
                        <div className="pollutant-bar">
                          <div className="pollutant-fill" style={{ width: `${Math.min(airQualityData.co, 100)}%` }}></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {uvIndex && (
              <div className="uv-index-section">
                <h3>UV Index</h3>
                <div className="uv-display">
                  <div className={`uv-circle ${getUVIndexLevel(uvIndex).level}`}>
                    <div className="uv-number">{uvIndex}</div>
                    <div className="uv-label">UV</div>
                  </div>
                  <div className="uv-info">
                    <h4>{getUVIndexLevel(uvIndex).description}</h4>
                    <div className="uv-recommendations">
                      {uvIndex <= 2 && <p>🟢 No protection needed</p>}
                      {uvIndex > 2 && uvIndex <= 5 && <p>🟡 Wear sunglasses on bright days</p>}
                      {uvIndex > 5 && uvIndex <= 7 && <p>🟠 Seek shade during midday hours</p>}
                      {uvIndex > 7 && uvIndex <= 10 && <p>🔴 Reduce time in the sun between 10am and 4pm</p>}
                      {uvIndex > 10 && <p>🟣 Avoid being outside during midday hours</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="analysis-section">
            <div className="section-header">
              <h2>Weather Analysis & Insights</h2>
              <p>Advanced weather patterns and trends</p>
            </div>
            
            <div className="analysis-grid">
              <div className="analysis-card">
                <h3>Temperature Trends</h3>
                <div className="trend-analysis">
                  {/* Add temperature trend analysis */}
                </div>
              </div>
              
              <div className="analysis-card">
                <h3>Precipitation Patterns</h3>
                <div className="precipitation-analysis">
                  {/* Add precipitation analysis */}
                </div>
              </div>
              
              <div className="analysis-card">
                <h3>Wind Patterns</h3>
                <div className="wind-analysis">
                  {/* Add wind pattern analysis */}
                </div>
              </div>
              
              <div className="analysis-card">
                <h3>Pressure Changes</h3>
                <div className="pressure-analysis">
                  {/* Add pressure analysis */}
                </div>
              </div>
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
                <div className="alert-actions">
                  <button className="alert-dismiss">Dismiss</button>
                  <button className="alert-details">View Details</button>
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

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Header from './Header'
import CurrentWeather from './CurrentWeather'
import HourlyForecast from './HourlyForecast'
import TenDayForecast from './TenDayForecast'
import WeatherMap from './WeatherMap'
import WeatherIndicators from './WeatherIndicators'
import './WeatherApp.css'

const WeatherApp = () => {
  // Core state
  const [weatherData, setWeatherData] = useState(null)
  const [forecastData, setForecastData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [location, setLocation] = useState('New York, NY')
  const [isUsingCoordinates, setIsUsingCoordinates] = useState(false)
  
  // Enhanced UI state
  const [loadingMessage, setLoadingMessage] = useState('Fetching weather data...')
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [changingLocation, setChangingLocation] = useState(false)
  const [gettingLocation, setGettingLocation] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [searchHistory, setSearchHistory] = useState([])
  const [connectionStatus, setConnectionStatus] = useState('checking')
  const [dataQuality, setDataQuality] = useState('unknown')
  
  // Refs for optimization
  const hasFetched = useRef(false)
  const retryCount = useRef(0)
  const abortController = useRef(null)
  const debounceTimer = useRef(null)
  const autoRefreshTimer = useRef(null)

  // Save search history to localStorage
  useEffect(() => {
    if (searchHistory.length > 0) {
      localStorage.setItem('weatherSearchHistory', JSON.stringify(searchHistory))
    }
  }, [searchHistory])

  // Load persisted location on initial load
  useEffect(() => {
    const cachedLocation = localStorage.getItem('weatherLastLocation')
    if (cachedLocation) {
      console.log('📍 Loading cached location:', cachedLocation)
      setLocation(cachedLocation)
    }
  }, [])

  // Clear any cached location on initial load to ensure default location
  useEffect(() => {
    const cachedLocation = localStorage.getItem('weatherLastLocation')
    if (cachedLocation && cachedLocation !== 'New York, NY') {
      localStorage.removeItem('weatherLastLocation')
      setLocation('New York, NY')
    }
  }, [])

  // Enhanced fetch with better error handling and performance
  const fetchWeatherData = useCallback(async (locationParam = location, isLocationChange = false) => {
    // Cancel any ongoing requests
    if (abortController.current) {
      abortController.current.abort()
    }
    
    // Create new abort controller for this request
    abortController.current = new AbortController()
    
    console.log('🚀 fetchWeatherData called:', { 
      locationParam, 
      isLocationChange,
      retryCount: retryCount.current
    })
    
    // Set loading states
    if (isLocationChange) {
      setChangingLocation(true)
      setLoadingMessage(`Finding weather for ${locationParam}...`)
    } else {
      setLoading(true)
      setLoadingMessage('Fetching weather data...')
    }
    setError(null)
    setLoadingProgress(0)
    setConnectionStatus('connecting')
    
    try {
      const apiKey = import.meta.env.VITE_OPENWEATHER_KEY
      
      console.log('🔑 API Key Debug:', { 
        hasKey: !!apiKey, 
        keyLength: apiKey?.length,
        keyPrefix: apiKey?.substring(0, 8) + '...',
        fullKey: apiKey
      })
      
      // Enhanced API key validation
      if (!apiKey || apiKey === 'YOUR_API_KEY_HERE' || apiKey.length < 10) {
        console.log('❌ API Key validation failed')
        throw new Error('API_KEY_INVALID')
      }

      console.log('✅ API Key validation passed')

      setLoadingProgress(20)
      setLoadingMessage('Connecting to weather service...')
      setConnectionStatus('connected')
      
      // Enhanced timeout with better error handling
      const timeoutId = setTimeout(() => {
        if (abortController.current) {
          abortController.current.abort()
        }
      }, 15000) // Increased to 15 seconds
      
      // Fetch current weather with enhanced error handling
      const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(locationParam)}&appid=${apiKey}&units=imperial`
      console.log('🌐 Making API call to:', apiUrl)
      
      const currentResponse = await fetch(apiUrl, { signal: abortController.current.signal })
      
      console.log('📊 API Response:', { 
        status: currentResponse.status, 
        ok: currentResponse.ok,
        statusText: currentResponse.statusText 
      })
      
      clearTimeout(timeoutId)
      
      // Enhanced response validation
      if (!currentResponse.ok) {
        const errorData = await currentResponse.json().catch(() => ({}))
        throw new Error(`HTTP_${currentResponse.status}_${errorData.message || currentResponse.statusText}`)
      }
      
      setLoadingProgress(50)
      setLoadingMessage('Processing current weather data...')
      
      const currentData = await currentResponse.json()
      
      // Validate current data structure
      if (!currentData.name || !currentData.main || !currentData.weather) {
        throw new Error('INVALID_DATA_STRUCTURE')
      }
      
      setLoadingProgress(70)
      setLoadingMessage('Loading forecast data...')
      
      // Fetch forecast data with similar enhancements
      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(locationParam)}&appid=${apiKey}&units=imperial`,
        { signal: abortController.current.signal }
      )
      
      if (!forecastResponse.ok) {
        const errorData = await forecastResponse.json().catch(() => ({}))
        throw new Error(`FORECAST_HTTP_${forecastResponse.status}_${errorData.message || forecastResponse.statusText}`)
      }
      
      setLoadingProgress(85)
      setLoadingMessage('Processing forecast information...')
      
      const forecastData = await forecastResponse.json()
      
      // Validate forecast data
      if (!forecastData.list || !Array.isArray(forecastData.list)) {
        throw new Error('INVALID_FORECAST_DATA')
      }
      
      // Process and set data
      setWeatherData(currentData)
      setForecastData(forecastData.list)
      setLocation(locationParam)
      setLastUpdate(new Date())
      setDataQuality('real')
      setConnectionStatus('connected')
      
      // Save current location to localStorage for persistence
      localStorage.setItem('weatherLastLocation', locationParam)
      
      // Reset retry count on success
      retryCount.current = 0
      
      // Enhanced search history management
      if (locationParam && !searchHistory.includes(locationParam)) {
        setSearchHistory(prev => [...prev.slice(-9), locationParam])
      }
      
      setLoadingProgress(100)
      setLoadingMessage('Weather data loaded successfully!')
      
      console.log('🎉 Weather data loaded successfully for:', locationParam)
      
    } catch (err) {
      console.error('❌ Error fetching weather data:', err)
      
      // Enhanced error classification
      let errorType = 'UNKNOWN_ERROR'
      let errorMessage = 'Unable to fetch weather data.'
      
      if (err.name === 'AbortError') {
        errorType = 'REQUEST_TIMEOUT'
        errorMessage = 'Request timed out. Please check your connection.'
      } else if (err.message.includes('API_KEY_INVALID')) {
        errorType = 'API_KEY_ERROR'
        errorMessage = 'Invalid API key. Please check your configuration.'
      } else if (err.message.includes('HTTP_404')) {
        errorType = 'LOCATION_NOT_FOUND'
        errorMessage = `Location "${locationParam}" not found. Please check the spelling.`
      } else if (err.message.includes('HTTP_401')) {
        errorType = 'AUTHENTICATION_ERROR'
        errorMessage = 'Invalid API key for weather service.'
      } else if (err.message.includes('HTTP_429')) {
        errorType = 'RATE_LIMIT_ERROR'
        errorMessage = 'API rate limit exceeded. Please wait a moment.'
      } else if (err.message.includes('HTTP_5')) {
        errorType = 'SERVER_ERROR'
        errorMessage = 'Weather service is temporarily unavailable.'
      } else if (err.message.includes('INVALID_DATA')) {
        errorType = 'DATA_ERROR'
        errorMessage = 'Received invalid weather data.'
      }
      
      setConnectionStatus('error')
      setDataQuality('simulated')
      
      // Use fallback data
      const simulatedData = getSimulatedWeatherData()
      const simulatedForecast = getSimulatedForecastData()
      
      setWeatherData(simulatedData)
      setForecastData(simulatedForecast)
      setLocation(locationParam)
      setLastUpdate(new Date())
      setLoadingProgress(100)
      
      // Show appropriate error message
      setError(`${errorMessage} Using simulated weather data.`)
      setTimeout(() => setError(null), 8000)
      
      // Implement exponential backoff for retries
      if (retryCount.current < 3) {
        retryCount.current++
        const backoffDelay = Math.min(1000 * Math.pow(2, retryCount.current), 5000)
        console.log(`🔄 Scheduling retry ${retryCount.current} in ${backoffDelay}ms`)
        
        setTimeout(() => {
          if (retryCount.current <= 3) {
            fetchWeatherData(locationParam, isLocationChange)
          }
        }, backoffDelay)
      }
      
    } finally {
      setLoading(false)
      setChangingLocation(false)
      setLoadingMessage('Fetching weather data...')
    }
  }, [location, searchHistory])

  useEffect(() => {
    if (!hasFetched.current && !loading) {
      console.log('🚀 Initial data fetch useEffect triggered')
      hasFetched.current = true
      
      // Try to fetch with a small delay to ensure everything is loaded
      const timer = setTimeout(() => {
        fetchWeatherData()
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [fetchWeatherData, loading])
  
  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (abortController.current) {
        abortController.current.abort()
      }
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
      if (autoRefreshTimer.current) {
        clearInterval(autoRefreshTimer.current)
      }
    }
  }, [])
  
  // Enhanced retry function with better feedback
  const handleRetry = useCallback(() => {
    console.log('🔄 Manual retry triggered')
    retryCount.current = 0
    setError('Attempting to fetch fresh weather data...')
    setTimeout(() => {
      fetchWeatherData()
    }, 500)
  }, [fetchWeatherData])

  // Enhanced geolocation with better error handling
  const handleCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return
    }

    setGettingLocation(true)
    setLoadingMessage('Getting your location...')
    setConnectionStatus('locating')

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        console.log('📍 Got location:', { latitude, longitude })
        
        try {
          // Enhanced reverse geocoding with timeout
          const apiKey = import.meta.env.VITE_OPENWEATHER_KEY
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 10000)
          
          const geoResponse = await fetch(
            `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${apiKey}`,
            { signal: controller.signal }
          )
          
          clearTimeout(timeoutId)
          
          if (geoResponse.ok) {
            const geoData = await geoResponse.json()
            const cityName = geoData[0]?.name || 'Your Location'
            console.log('🏙️ City name:', cityName)
            await fetchWeatherData(cityName, true)
          } else {
            // Fallback to coordinates
            await fetchWeatherData(`${latitude.toFixed(4)},${longitude.toFixed(4)}`, true)
          }
        } catch (error) {
          console.error('❌ Geocoding error:', error)
          await fetchWeatherData(`${latitude.toFixed(4)},${longitude.toFixed(4)}`, true)
        }
      },
      (error) => {
        console.error('❌ Geolocation error:', error)
        let errorMessage = 'Unable to get your location.'
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.'
            break
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.'
            break
          default:
            errorMessage = 'An unknown error occurred.'
        }
        
        setError(errorMessage)
        setGettingLocation(false)
        setLoading(false)
        setConnectionStatus('error')
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000 // 5 minutes
      }
    )
  }, [fetchWeatherData])

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    fetchWeatherData()
  }, [fetchWeatherData])

  // Enhanced auto-refresh functionality
  const toggleAutoRefresh = useCallback(() => {
    setAutoRefresh(prev => {
      const newAutoRefresh = !prev
      
      if (newAutoRefresh) {
        // Set up auto-refresh timer
        autoRefreshTimer.current = setInterval(() => {
          fetchWeatherData()
        }, 300000) // Refresh every 5 minutes
        console.log('🔄 Auto-refresh enabled (5 minute intervals)')
      } else {
        // Clear auto-refresh timer
        if (autoRefreshTimer.current) {
          clearInterval(autoRefreshTimer.current)
          autoRefreshTimer.current = null
        }
        console.log('⏸️ Auto-refresh disabled')
      }
      
      return newAutoRefresh
    })
  }, [fetchWeatherData])

  // Enhanced location change handler with coordinate support
  const handleLocationChange = useCallback((newLocation) => {
    console.log('📍 WeatherApp received location:', newLocation)
    
    // Check if the location looks like coordinates (contains comma and numbers)
    const isCoordinateLocation = newLocation.includes(',') && 
      newLocation.split(',').length === 2 &&
      newLocation.split(',').every(coord => {
        const num = parseFloat(coord.trim())
        return !isNaN(num) && num >= -90 && num <= 90
      })
    
    if (isCoordinateLocation) {
      console.log('🌍 Using coordinate-based location:', newLocation)
      setIsUsingCoordinates(true)
      
      // For coordinates, try to use reverse geocoding first
      const [lat, lon] = newLocation.split(',').map(coord => parseFloat(coord.trim()))
      
      // Try reverse geocoding to get city name
      const reverseGeocode = async () => {
        try {
          const apiKey = import.meta.env.VITE_OPENWEATHER_KEY
          const response = await fetch(
            `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`
          )
          
          if (response.ok) {
            const data = await response.json()
            const cityName = data[0]?.name || 'Your Location'
            console.log('🏙️ Reverse geocoded city:', cityName)
            return cityName
          }
        } catch (error) {
          console.error('❌ Reverse geocoding failed:', error)
          return null
        }
      }
      
      // Try reverse geocoding
      reverseGeocode().then(cityName => {
        if (cityName) {
          setLocation(cityName)
          fetchWeatherData(cityName)
        } else {
          // Fallback: Use coordinates directly with a different API approach
          console.log('🌍 Using coordinates directly as fallback')
          setLocation(`Coordinates: ${lat.toFixed(2)}, ${lon.toFixed(2)}`)
          // For now, use a nearby major city approximation
          let approximateCity = 'New York, NY' // default
          
          // Better coordinate mapping based on actual coordinates
          if (lat >= 38.0 && lat <= 42.0 && lon >= -78.0 && lon <= -76.0) {
            approximateCity = 'New York, NY'
          } else if (lat >= 25.0 && lat <= 48.0 && lon >= -125.0 && lon <= -66.0) {
            approximateCity = 'Chicago, IL'
          } else if (lat >= 34.0 && lat <= 41.0 && lon >= -119.0 && lon <= -117.0) {
            approximateCity = 'Los Angeles, CA'
          } else if (lat >= 29.0 && lat <= 33.0 && lon >= -96.0 && lon <= -94.0) {
            approximateCity = 'Houston, TX'
          } else if (lat >= 33.0 && lat <= 34.0 && lon >= -112.0 && lon <= -110.0) {
            approximateCity = 'Phoenix, AZ'
          } else if (lat >= 39.0 && lat <= 41.0 && lon >= -76.0 && lon <= -73.0) {
            approximateCity = 'Philadelphia, PA'
          } else if (lat >= 29.0 && lat <= 31.0 && lon >= -99.0 && lon <= -97.0) {
            approximateCity = 'San Antonio, TX'
          } else if (lat >= 32.0 && lat <= 34.0 && lon >= -118.0 && lon <= -116.0) {
            approximateCity = 'San Diego, CA'
          } else if (lat >= 32.0 && lat <= 34.0 && lon >= -97.0 && lon <= -95.0) {
            approximateCity = 'Dallas, TX'
          }
          
          setLocation(approximateCity)
          fetchWeatherData(approximateCity)
        }
      })
    } else {
      console.log('🏙️ Using city-based location:', newLocation)
      setIsUsingCoordinates(false)
      setLocation(newLocation)
      fetchWeatherData(newLocation)
    }
  }, [fetchWeatherData])

  // Debounced location change handler
  const handleLocationChangeDebounced = useCallback((newLocation) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }
    
    debounceTimer.current = setTimeout(() => {
      handleLocationChange(newLocation)
    }, 500)
  }, [handleLocationChange])

  // Memoized values for performance
  const shouldShowLoading = useMemo(() => loading || changingLocation || gettingLocation, [loading, changingLocation, gettingLocation])
  const isUsingSimulatedData = useMemo(() => 
    weatherData?.name === 'Kansas City' && weatherData?.main?.temp === 72,
    [weatherData]
  )
  const timeSinceLastUpdate = useMemo(() => {
    if (!lastUpdate) return null
    const now = new Date()
    const diff = Math.floor((now - lastUpdate) / 1000)
    
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }, [lastUpdate])
  
  // Enhanced simulated data with more realistic variations
  const getSimulatedWeatherData = useCallback(() => {
    const baseTemp = 65 + Math.random() * 25
    const conditions = ['Clear', 'Clouds', 'Rain', 'Drizzle', 'Thunderstorm', 'Snow', 'Mist']
    const condition = conditions[Math.floor(Math.random() * conditions.length)]
    
    return {
      name: 'Kansas City',
      sys: { 
        country: 'US', 
        sunrise: 1640998800, 
        sunset: 1641031200 
      },
      main: {
        temp: Math.round(baseTemp),
        feels_like: Math.round(baseTemp + (Math.random() - 0.5) * 10),
        temp_min: Math.round(baseTemp - 5),
        temp_max: Math.round(baseTemp + 5),
        humidity: 40 + Math.random() * 40,
        pressure: 29.5 + Math.random() * 2,
        visibility: 5 + Math.random() * 10
      },
      weather: [
        {
          main: condition,
          description: condition.toLowerCase(),
          icon: '01d'
        }
      ],
      wind: {
        speed: 3 + Math.random() * 15,
        deg: Math.random() * 360
      },
      clouds: {
        all: Math.random() * 100
      },
      dt: Math.floor(Date.now() / 1000)
    }
  }, [])

  // Enhanced simulated forecast data with realistic patterns
  const getSimulatedForecastData = useCallback(() => {
    const forecast = []
    const now = Date.now() / 1000
    const baseTemp = 65 + Math.random() * 20
    const conditions = ['Clear', 'Clouds', 'Rain', 'Drizzle', 'Thunderstorm', 'Snow', 'Mist']
    
    for (let i = 0; i < 40; i++) {
      const time = now + (i * 3 * 3600) // Every 3 hours
      const tempVariation = Math.sin(i / 8) * 10 // Temperature variation over time
      const temp = Math.round(baseTemp + tempVariation + (Math.random() - 0.5) * 5)
      const condition = conditions[Math.floor(Math.random() * conditions.length)]
      
      forecast.push({
        dt: time,
        main: {
          temp: temp,
          temp_min: temp - 3 - Math.random() * 4,
          temp_max: temp + 3 + Math.random() * 4,
          humidity: 40 + Math.random() * 40,
          pressure: 29.5 + Math.random() * 2
        },
        weather: [
          {
            main: condition,
            description: condition.toLowerCase(),
            icon: '01d'
          }
        ],
        wind: {
          speed: 3 + Math.random() * 12,
          deg: Math.random() * 360
        },
        clouds: {
          all: Math.random() * 100
        },
        dt_txt: new Date(time * 1000).toISOString()
      })
    }
    
    return forecast
  }, [])

  return (
    <div className="weather-app">
      <Header onLocationChange={handleLocationChangeDebounced} />
      
      {/* Enhanced Loading Overlay */}
      {shouldShowLoading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <h2 className="loading-title">Loading Weather Data</h2>
            <p className="loading-message">{loadingMessage}</p>
            <div className="loading-progress">
              <div 
                className="progress-bar" 
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>
            
            {/* Connection Status Indicator */}
            <div className="connection-status">
              <span className={`status-indicator ${connectionStatus}`}></span>
              <span className="status-text">
                {connectionStatus === 'connecting' && 'Connecting...'}
                {connectionStatus === 'connected' && 'Connected'}
                {connectionStatus === 'locating' && 'Getting location...'}
                {connectionStatus === 'error' && 'Connection error'}
                {connectionStatus === 'checking' && 'Checking connection...'}
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Enhanced Error Banner */}
      {!shouldShowLoading && error && (
        <div className="error-notification notification-error">
          <div className="error-icon">⚠️</div>
          <div className="error-content">
            <h4>Weather Data Notice</h4>
            <p>{error}</p>
            <div className="error-actions">
              <button 
                onClick={handleRetry} 
                className="btn btn-primary btn-sm"
              >
                Try Real Data
              </button>
              <button 
                onClick={() => setError(null)} 
                className="btn btn-secondary btn-sm"
              >
                Dismiss
              </button>
            </div>
          </div>
          <button 
            onClick={() => setError(null)} 
            className="notification-close"
          >
            ×
          </button>
        </div>
      )}
      
      {/* Simulated Data Banner */}
      {!shouldShowLoading && isUsingSimulatedData && (
        <div className="simulated-data-banner">
          <div className="banner-content">
            <span className="banner-icon">📊</span>
            <span className="banner-text">Showing simulated weather data</span>
            <button 
              className="banner-retry-btn"
              onClick={() => {
                setError('Attempting to get real weather data...')
                setTimeout(() => {
                  handleRetry()
                }, 1000)
              }}
            >
              Try Real Data
            </button>
          </div>
        </div>
      )}
      
      <main className="weather-content">
        {/* Enhanced Refresh Indicator */}
        {!shouldShowLoading && refreshing && (
          <div className="refresh-indicator">
            <div className="refresh-spinner"></div>
            <span>Updating weather data...</span>
          </div>
        )}
        
        {/* Status Bar */}
        {!shouldShowLoading && weatherData && (
          <div className="weather-status-bar">
            <div className="status-left">
              <span className="data-quality">
                {dataQuality === 'real' ? '🟢 Live Data' : '🟡 Simulated Data'}
              </span>
              {lastUpdate && (
                <span className="last-update">
                  Last updated: {timeSinceLastUpdate}
                </span>
              )}
            </div>
            <div className="status-right">
              <button 
                onClick={toggleAutoRefresh}
                className={`auto-refresh-toggle ${autoRefresh ? 'active' : ''}`}
                title="Toggle auto-refresh (5 minutes)"
              >
                {autoRefresh ? '🔄 Auto-refresh ON' : '🔄 Auto-refresh OFF'}
              </button>
              <button 
                onClick={handleRefresh}
                className="refresh-btn"
                title="Refresh weather data"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        )}
        
        {/* Weather Components */}
        {!shouldShowLoading && weatherData && (
          <>
            <CurrentWeather data={weatherData} />
            <HourlyForecast data={forecastData.slice(0, 8)} />
            <TenDayForecast data={forecastData} />
            <WeatherMap data={weatherData} onLocationChange={handleLocationChange} />
            <WeatherIndicators data={weatherData} />
          </>
        )}
      </main>
    </div>
  )
}

export default WeatherApp

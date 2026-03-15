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
  const [loadingMessage, setLoadingMessage] = useState('Fetching weather data...')
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [changingLocation, setChangingLocation] = useState(false)
  const [gettingLocation, setGettingLocation] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [searchHistory, setSearchHistory] = useState([])
  const hasFetched = React.useRef(false)
  const retryCount = React.useRef(0)

  // Save search history to localStorage
  useEffect(() => {
    if (searchHistory.length > 0) {
      localStorage.setItem('weatherSearchHistory', JSON.stringify(searchHistory))
    }
  }, [searchHistory])

  const fetchWeatherData = useCallback(async (locationParam = location, isLocationChange = false) => {
    console.log('🚀 fetchWeatherData called:', { 
      locationParam, 
      isLocationChange,
      stackTrace: new Error().stack?.split('\n').slice(1, 4).join(' | ')
    })
    
    if (isLocationChange) {
      setChangingLocation(true)
      setLoadingMessage(`Finding weather for ${locationParam}...`)
      setError(null)
    } else {
      setLoading(true)
      setLoadingMessage('Fetching weather data...')
      setError(null)
    }
    setLoadingProgress(0)
    
    try {
      const apiKey = import.meta.env.VITE_OPENWEATHER_KEY
      console.log('🔑 API Key check:', { 
        hasKey: !!apiKey, 
        keyLength: apiKey?.length,
        keyPrefix: apiKey?.substring(0, 8) + '...'
      })
      
      if (!apiKey || apiKey === 'YOUR_API_KEY_HERE' || apiKey.length < 10) {
        console.log('❌ Invalid API key, using fallback data')
        throw new Error('Invalid or missing API key. Using simulated weather data.')
      }

      setLoadingProgress(20)
      setLoadingMessage('Connecting to weather service...')
      
      // Add timeout and better error handling
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
      
      console.log('🌐 Fetching current weather for:', locationParam)
      const currentResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(locationParam)}&appid=${apiKey}&units=imperial`,
        { signal: controller.signal }
      )
      
      clearTimeout(timeoutId)
      console.log('📊 Current weather response:', { 
        status: currentResponse.status, 
        ok: currentResponse.ok,
        statusText: currentResponse.statusText 
      })
      
      if (!currentResponse.ok) {
        if (currentResponse.status === 404) {
          throw new Error(`Location "${locationParam}" not found. Please check the spelling and try again.`)
        } else if (currentResponse.status === 401) {
          throw new Error('Invalid API key. Please check your OpenWeather API configuration.')
        } else if (currentResponse.status === 429) {
          throw new Error('API rate limit exceeded. Please wait a moment and try again.')
        } else {
          throw new Error(`Failed to fetch current weather data: ${currentResponse.statusText}`)
        }
      }
      
      setLoadingProgress(50)
      setLoadingMessage('Processing current weather data...')
      const currentData = await currentResponse.json()
      console.log('✅ Current weather data received:', { 
        name: currentData.name, 
        temp: currentData.main?.temp,
        weather: currentData.weather?.[0]?.main 
      })

      setLoadingProgress(60)
      setLoadingMessage('Loading forecast data...')
      
      const controller2 = new AbortController()
      const timeoutId2 = setTimeout(() => controller2.abort(), 10000)
      
      console.log('🌐 Fetching forecast data for:', locationParam)
      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(locationParam)}&appid=${apiKey}&units=imperial`,
        { signal: controller2.signal }
      )
      
      clearTimeout(timeoutId2)
      console.log('📊 Forecast response:', { 
        status: forecastResponse.status, 
        ok: forecastResponse.ok,
        statusText: forecastResponse.statusText 
      })
      
      if (!forecastResponse.ok) {
        if (forecastResponse.status === 404) {
          throw new Error(`Forecast data not available for "${locationParam}".`)
        } else if (forecastResponse.status === 401) {
          throw new Error('Invalid API key for forecast data.')
        } else if (forecastResponse.status === 429) {
          throw new Error('API rate limit exceeded. Please wait a moment and try again.')
        } else {
          throw new Error(`Forecast API error: ${forecastResponse.status} - ${forecastResponse.statusText}`)
        }
      }
      
      setLoadingProgress(80)
      setLoadingMessage('Processing forecast information...')
      const forecastData = await forecastResponse.json()
      console.log('✅ Forecast data received:', { 
        listLength: forecastData.list?.length,
        firstItem: forecastData.list?.[0]?.dt_txt 
      })

      setWeatherData(currentData)
      setForecastData(forecastData.list)
      setLocation(locationParam)
      setLastUpdate(new Date())
      
      // Reset retry count on success
      retryCount.current = 0
      
      // Add to search history
      if (locationParam && !searchHistory.includes(locationParam)) {
        setSearchHistory(prev => [...prev.slice(-9), locationParam])
      }
      
      setLoadingProgress(100)
      setLoadingMessage('Weather data loaded successfully!')
      console.log('🎉 Weather data loaded successfully for:', locationParam)
      
    } catch (err) {
      console.error('❌ Error fetching weather data:', err)
      console.log('🔄 Using simulated data as fallback')
      
      // Always provide fallback data so app never shows "Weather Data Unavailable"
      const simulatedData = getSimulatedWeatherData()
      const simulatedForecast = getSimulatedForecastData()
      
      setWeatherData(simulatedData)
      setForecastData(simulatedForecast)
      setLocation(locationParam)
      setLastUpdate(new Date())
      setLoadingProgress(100)
      retryCount.current = 0
      
      // Show a brief error message but don't block the app
      let errorMessage = 'Using simulated weather data.'
      if (err.name === 'AbortError') {
        errorMessage = 'Request timed out. Using simulated weather data.'
      } else if (err.message.includes('rate limit') || err.message.includes('429')) {
        errorMessage = 'API rate limit exceeded. Showing simulated weather data.'
      } else if (err.message.includes('API key') || err.message.includes('401')) {
        errorMessage = 'Invalid API key. Showing simulated weather data.'
      } else if (err.message.includes('404') || err.message.includes('not found')) {
        errorMessage = 'Location not found. Showing simulated weather data.'
      } else {
        errorMessage = err.message || 'Network error. Using simulated weather data.'
      }
      
      setError(errorMessage)
      setTimeout(() => setError(null), 5000)
      
    } finally {
      setLoading(false)
      setChangingLocation(false)
      setLoadingMessage('Fetching weather data...')
    }
  }, [location, searchHistory])

  // Initial data fetch with retry mechanism
  useEffect(() => {
    if (!hasFetched.current) {
      console.log('🚀 Initial data fetch useEffect triggered')
      hasFetched.current = true
      
      // Try to fetch with a small delay to ensure everything is loaded
      const timer = setTimeout(() => {
        fetchWeatherData()
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [])

  // Retry function for manual retry
  const handleRetry = () => {
    console.log('🔄 Manual retry triggered')
    retryCount.current = 0
    fetchWeatherData()
  }

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return
    }

    setGettingLocation(true)
    setLoadingMessage('Getting your location...')

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        console.log('📍 Got location:', { latitude, longitude })
        
        try {
          // Reverse geocoding to get city name
          const apiKey = import.meta.env.VITE_OPENWEATHER_KEY
          const geoResponse = await fetch(
            `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${apiKey}`
          )
          
          if (geoResponse.ok) {
            const geoData = await geoResponse.json()
            const cityName = geoData[0]?.name || 'Your Location'
            console.log('🏙️ City name:', cityName)
            await fetchWeatherData(cityName, true)
          } else {
            // Fallback to coordinates
            await fetchWeatherData(`${latitude},${longitude}`, true)
          }
        } catch (error) {
          console.error('❌ Geocoding error:', error)
          await fetchWeatherData(`${latitude},${longitude}`, true)
        }
      },
      async (error) => {
        console.error('❌ Geolocation error:', error)
        setError('Unable to get your location. Please check your browser permissions.')
        setGettingLocation(false)
        setLoading(false)
      }
    )
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchWeatherData()
  }

  const handleLocationChange = (newLocation) => {
    if (newLocation && newLocation !== location) {
      setLocation(newLocation)
      fetchWeatherData(newLocation, true)
    }
  }

  const shouldShowLoading = loading || changingLocation || gettingLocation

  // Simulated weather data for fallback
  const getSimulatedWeatherData = () => ({
    name: 'Kansas City',
    sys: { country: 'US', sunrise: 1640998800, sunset: 1641031200 },
    main: {
      temp: 72,
      feels_like: 75,
      temp_min: 65,
      temp_max: 78,
      humidity: 65,
      pressure: 30.15,
      visibility: 10
    },
    weather: [
      {
        main: 'Clouds',
        description: 'partly cloudy',
        icon: '02d'
      }
    ],
    wind: {
      speed: 8.5,
      deg: 210
    },
    clouds: {
    
    forecast.push({
      dt: time,
      main: {
        temp: temp,
        temp_min: temp - 5,
        temp_max: temp + 5,
        humidity: 50 + Math.random() * 30
      },
      weather: [
        {
          main: condition,
          description: condition.toLowerCase(),
          icon: '01d'
        }
      ],
      wind: {
        speed: 5 + Math.random() * 10,
        deg: Math.random() * 360
      },
      dt_txt: new Date(time * 1000).toISOString()
    })
  }
  
  return forecast
}
            className="btn btn-primary btn-sm"
          >
            Try Real Data
          </button>
        </div>
        <button 
          onClick={() => setError(null)} 
          className="notification-close"
        >
          ×
        </button>
      </div>
    )}
    
    <main className="weather-content">
      {!shouldShowLoading && refreshing && (
        <div className="refresh-indicator">
          <div className="refresh-spinner"></div>
          <span>Updating weather data...</span>
        </div>
      )}
      
      {!shouldShowLoading && weatherData && (
        <>
          {/* Show banner if using simulated data */}
          {weatherData.name === 'Kansas City' && weatherData.main?.temp === 72 && (
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
          
          <CurrentWeather data={weatherData} />
          <HourlyForecast data={forecastData.slice(0, 8)} />
          <TenDayForecast data={forecastData} />
          <WeatherMap data={weatherData} />
          <WeatherIndicators data={weatherData} />
        </>
      )}
    </main>
  </div>
)

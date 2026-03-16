import React, { useState, useEffect, useCallback, useMemo } from 'react'
import Header from './Header'
import { WeatherIcon } from './WeatherIcons'
import './WeatherApp.css'

// Cache busting timestamp - FORCE RELOAD
console.log('🔄 WeatherApp.jsx loaded at:', new Date().toISOString(), 'CACHE BUST: 2024-03-15-18-27')

// Location persistence utilities
const saveLocationToHistory = (location) => {
  try {
    const history = JSON.parse(localStorage.getItem('weatherLocationHistory') || '[]')
    const newHistory = [location, ...history.filter(loc => loc !== location)].slice(0, 10)
    localStorage.setItem('weatherLocationHistory', JSON.stringify(newHistory))
  } catch (error) {
    console.error('Failed to save location history:', error)
  }
}

const getLocationHistory = () => {
  try {
    return JSON.parse(localStorage.getItem('weatherLocationHistory') || '[]')
  } catch (error) {
    console.error('Failed to get location history:', error)
    return []
  }
}

const getLastLocation = () => {
  try {
    return localStorage.getItem('lastWeatherLocation') || 'New York, NY'
  } catch (error) {
    console.error('Failed to get last location:', error)
    return 'New York, NY'
  }
}

const saveLastLocation = (location) => {
  try {
    localStorage.setItem('lastWeatherLocation', location)
  } catch (error) {
    console.error('Failed to save last location:', error)
  }
}

const WeatherApp = () => {
  // Core state
  const [weatherData, setWeatherData] = useState(null)
  const [forecastData, setForecastData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [location, setLocation] = useState(getLastLocation())
  const [lastUpdate, setLastUpdate] = useState(null)

  // NWS API endpoints
  const NWS_BASE_URL = 'https://api.weather.gov'
  const NWS_ALERTS_URL = 'https://api.weather.gov/alerts/active'

  // Get coordinates from location name using OpenStreetMap Nominatim
  const getCoordinatesFromLocation = useCallback(async (locationName) => {
    try {
      // Fallback coordinates for major cities
      const fallbackCities = {
        'new york': { latitude: 40.7128, longitude: -74.0060, displayName: 'New York, NY, USA' },
        'new york, ny': { latitude: 40.7128, longitude: -74.0060, displayName: 'New York, NY, USA' },
        'los angeles': { latitude: 34.0522, longitude: -118.2437, displayName: 'Los Angeles, CA, USA' },
        'los angeles, ca': { latitude: 34.0522, longitude: -118.2437, displayName: 'Los Angeles, CA, USA' },
        'chicago': { latitude: 41.8781, longitude: -87.6298, displayName: 'Chicago, IL, USA' },
        'chicago, il': { latitude: 41.8781, longitude: -87.6298, displayName: 'Chicago, IL, USA' },
        'houston': { latitude: 29.7604, longitude: -95.3698, displayName: 'Houston, TX, USA' },
        'houston, tx': { latitude: 29.7604, longitude: -95.3698, displayName: 'Houston, TX, USA' },
        'phoenix': { latitude: 33.4484, longitude: -112.0740, displayName: 'Phoenix, AZ, USA' },
        'phoenix, az': { latitude: 33.4484, longitude: -112.0740, displayName: 'Phoenix, AZ, USA' },
        'philadelphia': { latitude: 39.9526, longitude: -75.1652, displayName: 'Philadelphia, PA, USA' },
        'philadelphia, pa': { latitude: 39.9526, longitude: -75.1652, displayName: 'Philadelphia, PA, USA' },
        'san antonio': { latitude: 29.4241, longitude: -98.4936, displayName: 'San Antonio, TX, USA' },
        'san antonio, tx': { latitude: 29.4241, longitude: -98.4936, displayName: 'San Antonio, TX, USA' },
        'san diego': { latitude: 32.7157, longitude: -117.1611, displayName: 'San Diego, CA, USA' },
        'san diego, ca': { latitude: 32.7157, longitude: -117.1611, displayName: 'San Diego, CA, USA' },
        'dallas': { latitude: 32.7767, longitude: -96.7970, displayName: 'Dallas, TX, USA' },
        'dallas, tx': { latitude: 32.7767, longitude: -96.7970, displayName: 'Dallas, TX, USA' },
        'san jose': { latitude: 37.3382, longitude: -121.8863, displayName: 'San Jose, CA, USA' },
        'san jose, ca': { latitude: 37.3382, longitude: -121.8863, displayName: 'San Jose, CA, USA' },
        'austin': { latitude: 30.2672, longitude: -97.7431, displayName: 'Austin, TX, USA' },
        'austin, tx': { latitude: 30.2672, longitude: -97.7431, displayName: 'Austin, TX, USA' },
        'jacksonville': { latitude: 30.3322, longitude: -81.6557, displayName: 'Jacksonville, FL, USA' },
        'jacksonville, fl': { latitude: 30.3322, longitude: -81.6557, displayName: 'Jacksonville, FL, USA' },
        'fort worth': { latitude: 32.7555, longitude: -97.3308, displayName: 'Fort Worth, TX, USA' },
        'fort worth, tx': { latitude: 32.7555, longitude: -97.3308, displayName: 'Fort Worth, TX, USA' },
        'columbus': { latitude: 39.9612, longitude: -82.9988, displayName: 'Columbus, OH, USA' },
        'columbus, oh': { latitude: 39.9612, longitude: -82.9988, displayName: 'Columbus, OH, USA' },
        'charlotte': { latitude: 35.2271, longitude: -80.8431, displayName: 'Charlotte, NC, USA' },
        'charlotte, nc': { latitude: 35.2271, longitude: -80.8431, displayName: 'Charlotte, NC, USA' },
        'san francisco': { latitude: 37.7749, longitude: -122.4194, displayName: 'San Francisco, CA, USA' },
        'san francisco, ca': { latitude: 37.7749, longitude: -122.4194, displayName: 'San Francisco, CA, USA' },
        'indianapolis': { latitude: 39.7684, longitude: -86.1581, displayName: 'Indianapolis, IN, USA' },
        'indianapolis, in': { latitude: 39.7684, longitude: -86.1581, displayName: 'Indianapolis, IN, USA' },
        'seattle': { latitude: 47.6062, longitude: -122.3321, displayName: 'Seattle, WA, USA' },
        'seattle, wa': { latitude: 47.6062, longitude: -122.3321, displayName: 'Seattle, WA, USA' },
        'denver': { latitude: 39.7392, longitude: -104.9903, displayName: 'Denver, CO, USA' },
        'denver, co': { latitude: 39.7392, longitude: -104.9903, displayName: 'Denver, CO, USA' },
        'washington': { latitude: 38.9072, longitude: -77.0369, displayName: 'Washington, DC, USA' },
        'washington, dc': { latitude: 38.9072, longitude: -77.0369, displayName: 'Washington, DC, USA' },
        'boston': { latitude: 42.3601, longitude: -71.0589, displayName: 'Boston, MA, USA' },
        'boston, ma': { latitude: 42.3601, longitude: -71.0589, displayName: 'Boston, MA, USA' },
        'el paso': { latitude: 31.7619, longitude: -106.4850, displayName: 'El Paso, TX, USA' },
        'el paso, tx': { latitude: 31.7619, longitude: -106.4850, displayName: 'El Paso, TX, USA' },
        'detroit': { latitude: 42.3314, longitude: -83.0458, displayName: 'Detroit, MI, USA' },
        'detroit, mi': { latitude: 42.3314, longitude: -83.0458, displayName: 'Detroit, MI, USA' },
        'nashville': { latitude: 36.1627, longitude: -86.7816, displayName: 'Nashville, TN, USA' },
        'nashville, tn': { latitude: 36.1627, longitude: -86.7816, displayName: 'Nashville, TN, USA' },
        'portland': { latitude: 45.5152, longitude: -122.6784, displayName: 'Portland, OR, USA' },
        'portland, or': { latitude: 45.5152, longitude: -122.6784, displayName: 'Portland, OR, USA' },
        'memphis': { latitude: 35.1495, longitude: -90.0490, displayName: 'Memphis, TN, USA' },
        'memphis, tn': { latitude: 35.1495, longitude: -90.0490, displayName: 'Memphis, TN, USA' },
        'oklahoma city': { latitude: 35.4676, longitude: -97.5164, displayName: 'Oklahoma City, OK, USA' },
        'oklahoma city, ok': { latitude: 35.4676, longitude: -97.5164, displayName: 'Oklahoma City, OK, USA' },
        'las vegas': { latitude: 36.1699, longitude: -115.1398, displayName: 'Las Vegas, NV, USA' },
        'las vegas, nv': { latitude: 36.1699, longitude: -115.1398, displayName: 'Las Vegas, NV, USA' },
        'baltimore': { latitude: 39.2904, longitude: -76.6122, displayName: 'Baltimore, MD, USA' },
        'baltimore, md': { latitude: 39.2904, longitude: -76.6122, displayName: 'Baltimore, MD, USA' },
        'milwaukee': { latitude: 43.0642, longitude: -87.9676, displayName: 'Milwaukee, WI, USA' },
        'milwaukee, wi': { latitude: 43.0642, longitude: -87.9676, displayName: 'Milwaukee, WI, USA' },
        'tucson': { latitude: 32.2226, longitude: -110.9747, displayName: 'Tucson, AZ, USA' },
        'tucson, az': { latitude: 32.2226, longitude: -110.9747, displayName: 'Tucson, AZ, USA' },
        'albuquerque': { latitude: 35.0844, longitude: -106.6504, displayName: 'Albuquerque, NM, USA' },
        'albuquerque, nm': { latitude: 35.0844, longitude: -106.6504, displayName: 'Albuquerque, NM, USA' },
        'fresno': { latitude: 36.7378, longitude: -119.7871, displayName: 'Fresno, CA, USA' },
        'fresno, ca': { latitude: 36.7378, longitude: -119.7871, displayName: 'Fresno, CA, USA' },
        'sacramento': { latitude: 38.5816, longitude: -121.4944, displayName: 'Sacramento, CA, USA' },
        'sacramento, ca': { latitude: 38.5816, longitude: -121.4944, displayName: 'Sacramento, CA, USA' },
        'kansas city': { latitude: 39.0997, longitude: -94.5786, displayName: 'Kansas City, MO, USA' },
        'kansas city, mo': { latitude: 39.0997, longitude: -94.5786, displayName: 'Kansas City, MO, USA' },
        'mesa': { latitude: 33.4152, longitude: -111.8315, displayName: 'Mesa, AZ, USA' },
        'mesa, az': { latitude: 33.4152, longitude: -111.8315, displayName: 'Mesa, AZ, USA' },
        'atlanta': { latitude: 33.7490, longitude: -84.3880, displayName: 'Atlanta, GA, USA' },
        'atlanta, ga': { latitude: 33.7490, longitude: -84.3880, displayName: 'Atlanta, GA, USA' },
        'omaha': { latitude: 41.2565, longitude: -95.9345, displayName: 'Omaha, NE, USA' },
        'omaha, ne': { latitude: 41.2565, longitude: -95.9345, displayName: 'Omaha, NE, USA' },
        'charlotte': { latitude: 35.2271, longitude: -80.8431, displayName: 'Charlotte, NC, USA' },
        'charlotte, nc': { latitude: 35.2271, longitude: -80.8431, displayName: 'Charlotte, NC, USA' },
        'tampa': { latitude: 27.9506, longitude: -82.4572, displayName: 'Tampa, FL, USA' },
        'tampa, fl': { latitude: 27.9506, longitude: -82.4572, displayName: 'Tampa, FL, USA' },
        'cincinnati': { latitude: 39.1031, longitude: -84.5120, displayName: 'Cincinnati, OH, USA' },
        'cincinnati, oh': { latitude: 39.1031, longitude: -84.5120, displayName: 'Cincinnati, OH, USA' }
      }
      
      const normalizedLocation = locationName.toLowerCase().trim()
      
      // Check if it's a major city with fallback coordinates
      if (fallbackCities[normalizedLocation]) {
        console.log('📍 Using fallback coordinates for:', locationName)
        return fallbackCities[normalizedLocation]
      }
      
      // Try OpenStreetMap Nominatim for geocoding
      console.log('🔍 Geocoding location:', locationName)
      const geoResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}&limit=1&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'WeatherForecaster/1.0' // Required by Nominatim
          }
        }
      )
      
      if (!geoResponse.ok) {
        throw new Error('Failed to geocode location')
      }
      
      const geoData = await geoResponse.json()
      if (!geoData || geoData.length === 0) {
        throw new Error('Location not found')
      }
      
      const { lat, lon, display_name } = geoData[0]
      console.log('📍 Geocoding result:', { lat, lon, display_name })
      
      return { 
        latitude: parseFloat(lat), 
        longitude: parseFloat(lon),
        displayName: display_name
      }
    } catch (error) {
      console.error('Geocoding error:', error)
      
      // If all else fails, use New York as default
      console.log('📍 Using default coordinates (New York)')
      return { 
        latitude: 40.7128, 
        longitude: -74.0060,
        displayName: 'New York, NY, USA'
      }
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
    console.log('🚀 NEW getCurrentWeather function called - VERSION 2.0')
    try {
      console.log('🔍 Attempting to get current weather for office:', office, 'grid:', gridX, gridY)
      
      // Try to get stations first
      const stationsUrl = `${NWS_BASE_URL}/gridpoints/${office}/${gridX},${gridY}/stations`
      console.log('📡 Fetching stations from:', stationsUrl)
      
      const stationsResponse = await fetch(stationsUrl)
      
      if (!stationsResponse.ok) {
        console.log('⚠️ Stations API failed, using forecast fallback')
        throw new Error('Failed to get weather stations')
      }
      
      const stationsData = await stationsResponse.json()
      console.log('📡 Stations data received:', stationsData)
      
      // Check if stations data is available and has features
      if (!stationsData || !stationsData.features || !Array.isArray(stationsData.features) || stationsData.features.length === 0) {
        console.log('⚠️ No weather stations found, using grid point forecast for current conditions')
        // Fallback: use the latest forecast period as "current" weather
        const forecastUrl = `${NWS_BASE_URL}/gridpoints/${office}/${gridX},${gridY}/forecast`
        console.log('🌤️ Using forecast fallback from:', forecastUrl)
        
        const forecastResponse = await fetch(forecastUrl)
        
        if (!forecastResponse.ok) {
          console.log('⚠️ Forecast API failed, using ultimate fallback')
          throw new Error('Failed to get forecast data')
        }
        
        const forecastData = await forecastResponse.json()
        console.log('📅 Forecast data received:', forecastData)
        
        if (!forecastData.properties || !forecastData.properties.periods || !Array.isArray(forecastData.properties.periods) || forecastData.properties.periods.length === 0) {
          console.log('⚠️ No forecast periods available, using ultimate fallback')
          throw new Error('No forecast periods available')
        }
        
        const currentPeriod = forecastData.properties.periods[0]
        console.log('🌤️ Using current period:', currentPeriod)
        
        // Convert forecast data to observation-like format
        return {
          temperature: { value: currentPeriod.temperature === null ? null : 
            currentPeriod.temperatureUnit === 'F' ? currentPeriod.temperature : 
            currentPeriod.temperature * 9/5 + 32 }, // Convert C to F if needed
          textDescription: currentPeriod.shortForecast || currentPeriod.detailedForecast || 'No data available',
          relativeHumidity: { value: null }, // Not available in forecast
          windSpeed: { value: currentPeriod.windSpeed ? 
            typeof currentPeriod.windSpeed === 'string' ? 
              parseInt(currentPeriod.windSpeed.match(/\d+/)?.[0]) || null : 
              currentPeriod.windSpeed : null },
          windDirection: currentPeriod.windDirection || null,
          visibility: { value: null }, // Not available in forecast
          barometricPressure: { value: null }, // Not available in forecast
          timestamp: new Date().toISOString()
        }
      }
      
      // Use the first available station
      console.log('📡 Stations available, count:', stationsData.features.length)
      const firstStation = stationsData.features[0]
      if (!firstStation || !firstStation.properties || !firstStation.properties.stationIdentifier) {
        console.log('⚠️ Invalid station data, using forecast fallback')
        throw new Error('Invalid station data')
      }
      
      const stationId = firstStation.properties.stationIdentifier
      console.log('📡 Using station:', stationId)
      
      // Get latest observations from the station
      const observationsUrl = `${NWS_BASE_URL}/stations/${stationId}/observations/latest`
      console.log('🔍 Fetching observations from:', observationsUrl)
      
      const obsResponse = await fetch(observationsUrl)
      
      if (!obsResponse.ok) {
        console.log('⚠️ Observations API failed, using fallback')
        throw new Error('Failed to get weather observations')
      }
      
      const obsData = await obsResponse.json()
      console.log('🔍 Observations data received:', obsData)
      
      // Check if observations data is available
      if (!obsData || !obsData.features || !Array.isArray(obsData.features) || obsData.features.length === 0) {
        console.log('⚠️ No observations found, using forecast fallback data')
        // Fallback to forecast data instead of ultimate fallback
        try {
          const forecastUrl = `${NWS_BASE_URL}/gridpoints/${office}/${gridX},${gridY}/forecast`
          console.log('🌤️ Using forecast fallback from:', forecastUrl)
          
          const forecastResponse = await fetch(forecastUrl)
          
          if (!forecastResponse.ok) {
            console.log('⚠️ Forecast API failed, using ultimate fallback')
            throw new Error('Failed to get forecast data')
          }
          
          const forecastData = await forecastResponse.json()
          console.log('📅 Forecast data received:', forecastData)
          
          if (!forecastData.properties || !forecastData.properties.periods || !Array.isArray(forecastData.properties.periods) || forecastData.properties.periods.length === 0) {
            console.log('⚠️ No forecast periods available, using ultimate fallback')
            throw new Error('No forecast periods available')
          }
          
          const currentPeriod = forecastData.properties.periods[0]
          console.log('🌤️ Using current period for current weather:', currentPeriod)
          
          // Convert forecast data to observation-like format
          return {
            temperature: { value: currentPeriod.temperature === null ? null : 
              currentPeriod.temperatureUnit === 'F' ? currentPeriod.temperature : 
              currentPeriod.temperature * 9/5 + 32 }, // Convert C to F if needed
            textDescription: currentPeriod.shortForecast || currentPeriod.detailedForecast || 'No data available',
            relativeHumidity: { value: null }, // Not available in forecast
            windSpeed: { value: currentPeriod.windSpeed ? 
              typeof currentPeriod.windSpeed === 'string' ? 
                parseInt(currentPeriod.windSpeed.match(/\d+/)?.[0]) || null : 
                currentPeriod.windSpeed : null },
            windDirection: currentPeriod.windDirection || null,
            visibility: { value: null }, // Not available in forecast
            barometricPressure: { value: null }, // Not available in forecast
            timestamp: new Date().toISOString()
          }
        } catch (forecastError) {
          console.log('⚠️ Forecast fallback failed:', forecastError)
          throw new Error('No observations available and forecast fallback failed')
        }
      }
      
      const firstObservation = obsData.features[0]
      if (!firstObservation || !firstObservation.properties) {
        console.log('⚠️ Invalid observation data, using fallback')
        throw new Error('Invalid observation data')
      }
      
      console.log('🌡️ Successfully got observation data')
      return firstObservation.properties
      
    } catch (error) {
      console.error('Current weather error:', error)
      
      // Return fallback data if all else fails
      console.log('🛡️ Using ultimate fallback data')
      return {
        temperature: { value: null },
        textDescription: 'Weather data temporarily unavailable',
        relativeHumidity: { value: null },
        windSpeed: { value: null },
        windDirection: null,
        visibility: { value: null },
        barometricPressure: { value: null },
        timestamp: new Date().toISOString()
      }
    }
  }, [])

  // Get forecast from NWS
  const getForecast = useCallback(async (office, gridX, gridY) => {
    try {
      // Try the hourly forecast endpoint first
      const forecastUrl = `${NWS_BASE_URL}/gridpoints/${office}/${gridX},${gridY}/forecast/hourly`
      console.log('📅 Fetching hourly forecast from:', forecastUrl)
      const response = await fetch(forecastUrl)
      
      if (!response.ok) {
        console.log('⚠️ Hourly forecast API failed, trying daily forecast')
        // Fallback to daily forecast
        const dailyForecastUrl = `${NWS_BASE_URL}/gridpoints/${office}/${gridX},${gridY}/forecast`
        const dailyResponse = await fetch(dailyForecastUrl)
        
        if (!dailyResponse.ok) {
          console.log('⚠️ Daily forecast API also failed')
          return []
        }
        
        const dailyData = await dailyResponse.json()
        console.log('📅 Daily forecast data:', dailyData)
        
        if (!dailyData.properties || !dailyData.properties.periods) {
          console.log('⚠️ No daily forecast properties or periods found')
          return []
        }
        
        const periods = dailyData.properties.periods
        console.log('📅 Daily forecast periods:', periods)
        return periods
      }
      
      const data = await response.json()
      console.log('📅 Raw hourly forecast data:', data)
      
      if (!data.properties || !data.properties.periods) {
        console.log('⚠️ No hourly forecast properties or periods found')
        return []
      }
      
      const periods = data.properties.periods
      console.log('📅 Hourly forecast periods:', periods)
      return periods
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
      const { latitude, longitude, displayName } = await getCoordinatesFromLocation(locationName)
      console.log('📍 Coordinates:', { latitude, longitude })
      
      // Step 2: Get NWS office info
      const nwsInfo = await getNWSOffice(latitude, longitude)
      console.log('🏢 NWS Office:', nwsInfo)
      
      // Step 3: Get current weather
      const currentWeather = await getCurrentWeather(nwsInfo.office, nwsInfo.gridX, nwsInfo.gridY)
      console.log('🌡️ Current Weather:', currentWeather)
      
      // Step 4: Get forecast
      const forecast = await getForecast(nwsInfo.office, nwsInfo.gridX, nwsInfo.gridY)
      console.log('📅 Forecast received:', forecast)
      console.log('📅 Forecast length:', forecast?.length)
      console.log('📅 Forecast data type:', typeof forecast)
      
      // Step 5: Get alerts
      const alerts = await getAlerts(latitude, longitude)
      console.log('⚠️ Alerts:', alerts)
      
      // Process and set data
      const processedWeatherData = {
        location: displayName || locationName,
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
      console.log('📅 Setting forecast data:', forecast)
      console.log('📅 Forecast data is array:', Array.isArray(forecast))
      
      // If forecast is empty, create mock data for testing
      const finalForecast = forecast && forecast.length > 0 ? forecast : [
        {
          name: 'Tonight',
          temperature: 65,
          temperatureUnit: 'F',
          shortForecast: 'Partly Cloudy',
          detailedForecast: 'Partly cloudy with a chance of showers'
        },
        {
          name: 'Tomorrow',
          temperature: 72,
          temperatureUnit: 'F',
          shortForecast: 'Mostly Sunny',
          detailedForecast: 'Mostly sunny with clear skies'
        },
        {
          name: 'Monday',
          temperature: 68,
          temperatureUnit: 'F',
          shortForecast: 'Sunny',
          detailedForecast: 'Sunny and pleasant'
        }
      ]
      
      setForecastData(finalForecast)
      setLastUpdate(new Date())
      setLocation(displayName || locationName)
      
    } catch (error) {
      console.error('❌ NWS fetch error:', error)
      setError(`Failed to fetch NWS data: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }, [getCoordinatesFromLocation, getNWSOffice, getCurrentWeather, getForecast, getAlerts])

  // Handle location change from Header
  const handleLocationChange = useCallback((newLocation) => {
    console.log('📍 Location change requested:', newLocation)
    if (newLocation && newLocation !== location) {
      // Save to history
      saveLocationToHistory(newLocation)
      // Save as last location
      saveLastLocation(newLocation)
      // Update state and fetch data
      setLocation(newLocation)
      fetchNWSData(newLocation)
    }
  }, [location, fetchNWSData])

  // Initial data fetch
  useEffect(() => {
    fetchNWSData(location)
  }, [])

  // Enhanced formatters with better data handling
  const formatTemp = (temp) => {
    if (temp === null || temp === undefined) return '--°F'
    return `${Math.round(temp)}°F`
  }

  const formatTempWithUnit = (temp, showUnit = true) => {
    if (temp === null || temp === undefined) return '--°'
    const rounded = Math.round(temp)
    return showUnit ? `${rounded}°F` : `${rounded}°`
  }

  const getWindDirection = (direction) => {
    if (!direction) return ''
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
    const index = Math.round(((direction % 360) / 22.5)) % 16
    return directions[index]
  }

  const getWindSpeedWithDirection = (speed, direction) => {
    const speedStr = formatWindSpeed(speed)
    const dirStr = getWindDirection(direction)
    return dirStr ? `${speedStr} ${dirStr}` : speedStr
  }

  const formatWindSpeed = (speed) => {
    if (speed === null || speed === undefined) return '-- mph'
    
    // Handle different wind speed formats
    if (typeof speed === 'string') {
      // Parse strings like "10 mph" or "5 to 10 mph"
      const match = speed.match(/(\d+)/)
      if (match) {
        return `${match[1]} mph`
      }
      return speed
    }
    
    return `${Math.round(speed)} mph`
  }

  const formatVisibility = (visibility) => {
    if (visibility === null || visibility === undefined) return '--'
    if (visibility >= 10) return '10+ miles'
    return `${visibility} miles`
  }

  const formatPressure = (pressure) => {
    if (pressure === null || pressure === undefined) return '--'
    return `${Math.round(pressure)} mb`
  }

  const formatHumidity = (humidity) => {
    if (humidity === null || humidity === undefined) return '--%'
    return `${Math.round(humidity)}%`
  }

  const getSeverityColor = (severity) => {
    const colors = {
      'Extreme': '#dc2626',
      'Severe': '#ea580c', 
      'Moderate': '#f59e0b',
      'Minor': '#3b82f6',
      'Unknown': '#6b7280'
    }
    return colors[severity] || colors.Unknown
  }

  const getAlertIcon = (event) => {
    const lowerEvent = event.toLowerCase()
    if (lowerEvent.includes('tornado')) return '⚡'
    if (lowerEvent.includes('thunderstorm') || lowerEvent.includes('storm')) return '⛈'
    if (lowerEvent.includes('flood')) return '🌊'
    if (lowerEvent.includes('wind')) return '💨'
    if (lowerEvent.includes('snow') || lowerEvent.includes('blizzard')) return '❄'
    if (lowerEvent.includes('ice') || lowerEvent.includes('freezing')) return '🧊'
    if (lowerEvent.includes('heat')) return '🔥'
    if (lowerEvent.includes('cold') || lowerEvent.includes('freeze')) return '🥶'
    if (lowerEvent.includes('fog')) return '🌫'
    if (lowerEvent.includes('fire') || lowerEvent.includes('red flag')) return '🔥'
    return '⚠'
  }

  const formatAlertTime = (expires) => {
    if (!expires) return ''
    const date = new Date(expires)
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const getWeatherIcon = (description) => {
    return <WeatherIcon condition={description} size={48} />
  }

  const getTemperatureColor = (temp) => {
    if (temp === null || temp === undefined) return '#ffffff'
    if (temp >= 90) return '#dc2626'
    if (temp >= 80) return '#ea580c'
    if (temp >= 70) return '#f59e0b'
    if (temp >= 60) return '#3b82f6'
    if (temp >= 50) return '#06b6d4'
    if (temp >= 40) return '#10b981'
    if (temp >= 32) return '#6366f1'
    return '#8b5cf6'
  }

  return (
    <div className="weather-app">
      <Header onLocationChange={handleLocationChange} />
      
      <main className="weather-content">
        {loading && (
          <div className="loading-overlay">
            <div className="loading-content">
              <div className="loading-spinner"></div>
              <h3>⚑ Fetching NWS Weather Data...</h3>
              <p>Getting data from National Weather Service</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="error-notification">
            <div className="error-content">
              <div className="error-icon">⚠️</div>
              <div className="error-message">
                <h4>⚠️ NWS Data Error</h4>
                <p>{error}</p>
                <button 
                  onClick={() => fetchNWSData(location)} 
                  className="retry-btn"
                >
                  ↻ Retry
                </button>
              </div>
            </div>
          </div>
        )}
        
        {weatherData && !loading && !error && (
          <div className="nws-weather-display">
            <div className="nws-header">
              <h2>⚑ National Weather Service Data</h2>
              <p className="data-source">🇺🇸 Official U.S. Weather Data</p>
            </div>
            
            <div className="current-weather">
              <div className="current-weather-header">
                <h3>🌤️ Current Conditions in {weatherData.location}</h3>
                <div className="weather-icon-large">
                  {getWeatherIcon(weatherData.current.description)}
                </div>
              </div>
              <div className="weather-main">
                <div className="temperature">
                  <span 
                    className="temp-value" 
                    style={{ color: getTemperatureColor(weatherData.current.temperature) }}
                  >
                    {formatTempWithUnit(weatherData.current.temperature)}
                  </span>
                  <span className="temp-desc">{weatherData.current.description}</span>
                </div>
                
                <div className="weather-details">
                  <div className="detail-item">
                    <span className="detail-label">Humidity:</span>
                    <span className="detail-value">
                      {formatHumidity(weatherData.current.humidity)}
                    </span>
                  </div>
                  
                  <div className="detail-item">
                    <span className="detail-label">Wind:</span>
                    <span className="detail-value">
                      {getWindSpeedWithDirection(weatherData.current.windSpeed, weatherData.current.windDirection)}
                    </span>
                  </div>
                  
                  <div className="detail-item">
                    <span className="detail-label">Visibility:</span>
                    <span className="detail-value">
                      {formatVisibility(weatherData.current.visibility)}
                    </span>
                  </div>
                  
                  <div className="detail-item">
                    <span className="detail-label">Pressure:</span>
                    <span className="detail-value">
                      {formatPressure(weatherData.current.pressure)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="nws-info">
              <h4>🏢 ⚑ NWS Office Information</h4>
              <div className="office-details">
                <div className="office-item">
                  <span className="office-label">📍 Office:</span>
                  <span className="office-value">{weatherData.nwsInfo.office}</span>
                </div>
                <div className="office-item">
                  <span className="office-label">📊 Grid:</span>
                  <span className="office-value">{weatherData.nwsInfo.gridX}, {weatherData.nwsInfo.gridY}</span>
                </div>
                <div className="office-item">
                  <span className="office-label">🏛️ County:</span>
                  <span className="office-value">{weatherData.nwsInfo.county.split('/').pop()}</span>
                </div>
              </div>
            </div>
            
            {forecastData && forecastData.length > 0 && (
              <div className="forecast-section">
                <h3>📅 ⚑ Extended Forecast</h3>
                <div className="forecast-grid">
                  {forecastData.slice(0, 7).map((period, index) => (
                    <div key={index} className="forecast-item">
                      <div className="forecast-period">{period.name}</div>
                      <div className="forecast-icon">
                        {getWeatherIcon(period.shortForecast)}
                      </div>
                      <div className="forecast-temp">
                        <span className="forecast-high">{period.temperature || '--'}°</span>
                        {period.temperatureUnit && (
                          <span className="forecast-unit">{period.temperatureUnit}</span>
                        )}
                      </div>
                      <div className="forecast-desc">{period.shortForecast}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {weatherData.alerts.length > 0 && (
              <div className="alerts-section">
                <div className="alerts-header">
                  <h4>
                    ⚠ Active Alerts ({weatherData.alerts.length})
                    {weatherData.alerts.some(alert => alert.properties.severity === 'Extreme') && 
                      <span className="extreme-alert-indicator">⚠ EXTREME WEATHER</span>
                    }
                  </h4>
                  <div className="alert-summary">
                    {weatherData.alerts.filter(alert => alert.properties.severity === 'Extreme').length > 0 && (
                      <span className="alert-count extreme">
                        {weatherData.alerts.filter(alert => alert.properties.severity === 'Extreme').length} Extreme
                      </span>
                    )}
                    {weatherData.alerts.filter(alert => alert.properties.severity === 'Severe').length > 0 && (
                      <span className="alert-count severe">
                        {weatherData.alerts.filter(alert => alert.properties.severity === 'Severe').length} Severe
                      </span>
                    )}
                    {weatherData.alerts.filter(alert => alert.properties.severity === 'Moderate').length > 0 && (
                      <span className="alert-count moderate">
                        {weatherData.alerts.filter(alert => alert.properties.severity === 'Moderate').length} Moderate
                      </span>
                    )}
                  </div>
                </div>
                <div className="alerts-list">
                  {weatherData.alerts.map((alert, index) => {
                    const severityColor = getSeverityColor(alert.properties.severity)
                    const alertIcon = getAlertIcon(alert.properties.event)
                    const expires = formatAlertTime(alert.properties.expires)
                    const isExpired = new Date(alert.properties.expires) < new Date()
                    
                    return (
                      <div 
                        key={index} 
                        className={`alert-item ${isExpired ? 'expired' : ''}`}
                        style={{ 
                          borderLeft: `4px solid ${severityColor}`,
                          backgroundColor: `${severityColor}15`
                        }}
                      >
                        <div className="alert-header">
                          <div className="alert-title">
                            <span className="alert-icon">{alertIcon}</span>
                            <div className="alert-title-text">
                              <span className="alert-event">{alert.properties.event}</span>
                              <span className="alert-urgency">{alert.properties.urgency || 'Unknown'}</span>
                            </div>
                          </div>
                          <div className="alert-meta">
                            <span 
                              className="alert-severity"
                              style={{ backgroundColor: severityColor }}
                            >
                              {alert.properties.severity}
                            </span>
                            {expires && (
                              <span className={`alert-expires ${isExpired ? 'expired' : ''}`}>
                                {isExpired ? 'Expired' : `Until ${expires}`}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="alert-description">
                          {alert.properties.description}
                        </div>
                        <div className="alert-details">
                          <div className="alert-areas">
                            <strong>📍 Affected Areas:</strong> {alert.properties.areaDesc}
                          </div>
                          {alert.properties.instruction && (
                            <div className="alert-instructions">
                              <strong>🛡️ Safety Instructions:</strong> {alert.properties.instruction}
                            </div>
                          )}
                          <div className="alert-contact">
                            <strong>📞 Contact:</strong> {alert.properties.contact || 'Local Emergency Management'}
                          </div>
                          <div className="alert-web">
                            <strong>🌐 More Info:</strong> 
                            {alert.properties.web && (
                              <a href={alert.properties.web} target="_blank" rel="noopener noreferrer">
                                View Full Alert
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            
            {lastUpdate && (
              <div className="update-info">
                <div className="update-header">
                  <span className="update-time">🕐 Last updated: {lastUpdate.toLocaleString()}</span>
                  <span className="data-source">⚑ {weatherData.dataSource}</span>
                </div>
                <div className="update-actions">
                  <button 
                    onClick={() => fetchNWSData(location)} 
                    className="refresh-btn"
                    disabled={loading}
                  >
                    {loading ? '↻ Refreshing...' : '↻ Refresh Data'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default WeatherApp

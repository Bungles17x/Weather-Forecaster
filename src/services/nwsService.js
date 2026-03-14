// NWS Weather Service
// Fetches real National Weather Service alerts and data

const NWS_API_BASE = 'https://api.weather.gov'

export const nwsService = {
  // Get active weather alerts for a location
  async getActiveAlerts(lat, lon) {
    try {
      // Find the nearest NWS office
      const pointsUrl = `${NWS_API_BASE}/points/${lat},${lon}`
      const pointsResponse = await fetch(pointsUrl)
      
      if (!pointsResponse.ok) {
        throw new Error('Failed to find NWS office')
      }
      
      const pointsData = await pointsResponse.json()
      const office = pointsData.properties?.cwa
      
      if (!office) {
        throw new Error('No NWS office found for this location')
      }
      
      // Get alerts for the office area
      const alertsUrl = `${NWS_API_BASE}/alerts/active?area=${office}`
      const alertsResponse = await fetch(alertsUrl)
      
      if (!alertsResponse.ok) {
        throw new Error('Failed to fetch NWS alerts')
      }
      
      const alertsData = await alertsResponse.json()
      return this.formatAlerts(alertsData.features || [])
      
    } catch (error) {
      console.error('Error fetching NWS alerts:', error)
      return []
    }
  },

  // Get point forecast for a location
  async getPointForecast(lat, lon) {
    try {
      const pointsUrl = `${NWS_API_BASE}/points/${lat},${lon}`
      const pointsResponse = await fetch(pointsUrl)
      
      if (!pointsResponse.ok) {
        throw new Error('Failed to find NWS office')
      }
      
      const pointsData = await pointsResponse.json()
      const office = pointsData.properties?.cwa
      const gridX = pointsData.properties?.gridX
      const gridY = pointsData.properties?.gridY
      
      if (!office || gridX === undefined || gridY === undefined) {
        throw new Error('No NWS grid found for this location')
      }
      
      // Get grid forecast
      const forecastUrl = `${NWS_API_BASE}/gridpoints/${office}/${gridX},${gridY}/forecast`
      const forecastResponse = await fetch(forecastUrl)
      
      if (!forecastResponse.ok) {
        throw new Error('Failed to fetch NWS forecast')
      }
      
      const forecastData = await forecastResponse.json()
      return this.formatForecast(forecastData)
      
    } catch (error) {
      console.error('Error fetching NWS forecast:', error)
      return null
    }
  },

  // Get current conditions for a location
  async getCurrentConditions(lat, lon) {
    try {
      const pointsUrl = `${NWS_API_BASE}/points/${lat},${lon}`
      const pointsResponse = await fetch(pointsUrl)
      
      if (!pointsResponse.ok) {
        throw new Error('Failed to find NWS office')
      }
      
      const pointsData = await pointsResponse.json()
      const office = pointsData.properties?.cwa
      const gridX = pointsData.properties?.gridX
      const gridY = pointsData.properties?.gridY
      
      if (!office || gridX === undefined || gridY === undefined) {
        throw new Error('No NWS grid found for this location')
      }
      
      // Get stations
      const stationsUrl = `${NWS_API_BASE}/gridpoints/${office}/${gridX},${gridY}/stations`
      const stationsResponse = await fetch(stationsUrl)
      
      if (!stationsResponse.ok) {
        throw new Error('Failed to fetch NWS stations')
      }
      
      const stationsData = await stationsResponse.json()
      const stationId = stationsData.features[0]?.properties?.stationIdentifier
      
      if (!stationId) {
        throw new Error('No NWS station found')
      }
      
      // Get current conditions
      const conditionsUrl = `${NWS_API_BASE}/stations/${stationId}/observations/latest`
      const conditionsResponse = await fetch(conditionsUrl)
      
      if (!conditionsResponse.ok) {
        throw new Error('Failed to fetch NWS conditions')
      }
      
      const conditionsData = await conditionsResponse.json()
      return this.formatConditions(conditionsData)
      
    } catch (error) {
      console.error('Error fetching NWS conditions:', error)
      return null
    }
  },

  // Format NWS alerts to our alert format
  formatAlerts(nwsAlerts) {
    return nwsAlerts.map(alert => {
      const properties = alert.properties
      const severity = this.getAlertSeverity(properties.severity || properties.event || properties.headline)
      
      return {
        type: properties.event?.toLowerCase().replace(/\s+/g, '-') || 'nws-alert',
        icon: this.getAlertIcon(properties.event || properties.headline),
        title: properties.headline || properties.event || 'Weather Alert',
        message: properties.description || properties.instruction || 'Weather alert in effect for this area.',
        severity: severity,
        urgency: properties.urgency,
        certainty: properties.certainty,
        areas: properties.areas,
        effective: properties.effective,
        expires: properties.expires,
        source: 'NWS'
      }
    })
  },

  // Get severity level from NWS alert
  getAlertSeverity(nwsSeverity) {
    const severity = (nwsSeverity || '').toLowerCase()
    
    if (severity.includes('extreme') || severity.includes('warning') || severity.includes('severe')) {
      return 'extreme'
    } else if (severity.includes('watch') || severity.includes('advisory')) {
      return severity.includes('watch') ? 'high' : 'moderate'
    } else if (severity.includes('statement') || severity.includes('outlook')) {
      return 'low'
    }
    
    return 'moderate' // default
  },

  // Get appropriate icon for alert type
  getAlertIcon(event) {
    const eventType = (event || '').toLowerCase()
    
    if (eventType.includes('heat') || eventType.includes('excessive heat')) return '🔥'
    if (eventType.includes('cold') || eventType.includes('freeze')) return '❄️'
    if (eventType.includes('wind') || eventType.includes('hurricane')) return '💨'
    if (eventType.includes('flood') || eventType.includes('flash flood')) return '🌊'
    if (eventType.includes('fog') || eventType.includes('visibility')) return '🌫️'
    if (eventType.includes('snow') || eventType.includes('winter')) return '🌨️'
    if (eventType.includes('thunderstorm') || eventType.includes('severe')) return '⛈️'
    if (eventType.includes('fire') || eventType.includes('red flag')) return '🔥'
    if (eventType.includes('tornado')) return '🌪'
    
    return '⚠️' // default
  },

  // Format NWS forecast data
  formatForecast(forecastData) {
    if (!forecastData.properties) return null
    
    const periods = forecastData.properties.periods || []
    return periods.map(period => ({
      time: new Date(period.startTime),
      temperature: period.temperature || 0,
      windSpeed: period.windSpeed || 0,
      windDirection: period.windDirection || '',
      precipitation: period.probabilityOfPrecipitation || 0,
      humidity: period.relativeHumidity?.value || 50,
      visibility: period.visibility?.value || 10000,
      description: period.shortForecast || period.detailedForecast || '',
      icon: period.icon || '',
      isDaytime: period.isDaytime || false
    }))
  },

  // Format NWS current conditions
  formatConditions(conditionsData) {
    if (!conditionsData.properties) return null
    
    const props = conditionsData.properties
    return {
      temperature: props.temperature?.value || 0,
      feelsLike: props.heatIndex?.value || props.temperature?.value || 0,
      humidity: props.relativeHumidity?.value || 50,
      windSpeed: props.windSpeed?.value || 0,
      windDirection: props.windDirection?.value || '',
      visibility: props.visibility?.value || 10000,
      pressure: props.barometricPressure?.value || 1013,
      description: props.textDescription || '',
      icon: props.iconCode || '',
      timestamp: props.timestamp || new Date().toISOString()
    }
  },

  // Search for locations
  async searchLocations(query) {
    try {
      const searchUrl = `${NWS_API_BASE}/locations?query=${encodeURIComponent(query)}&limit=5`
      const response = await fetch(searchUrl)
      
      if (!response.ok) {
        throw new Error('Failed to search locations')
      }
      
      const data = await response.json()
      return data.features?.map(feature => ({
        name: feature.properties?.name || '',
        state: feature.properties?.state || '',
        lat: feature.geometry?.coordinates?.[1] || 0,
        lon: feature.geometry?.coordinates?.[0] || 0,
        type: feature.properties?.type || ''
      })) || []
      
    } catch (error) {
      console.error('Error searching NWS locations:', error)
      return []
    }
  }
}

export default nwsService

import React, { useState, useEffect, useRef, useCallback } from 'react'
import './WeatherMapRadar.css'

const WeatherMapRadar = ({ weatherData, coordinates }) => {
  const [mapCenter, setMapCenter] = useState({ lat: 40.7128, lng: -74.0060 })
  const [zoom, setZoom] = useState(10)
  const [mapStyle, setMapStyle] = useState('roadmap')
  const [radarOverlay, setRadarOverlay] = useState(true)
  const [weatherLayer, setWeatherLayer] = useState(true)
  const [loading, setLoading] = useState(true)
  const mapRef = useRef(null)

  // Initialize map
  useEffect(() => {
    if (coordinates) {
      setMapCenter({ lat: coordinates.latitude, lng: coordinates.longitude })
      setZoom(12)
    } else if (weatherData?.coord) {
      setMapCenter({ lat: weatherData.coord.lat, lng: weatherData.coord.lon })
      setZoom(10)
    }
  }, [coordinates, weatherData])

  // Load map script
  useEffect(() => {
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&libraries=places`
    script.async = true
    script.onload = () => {
      setLoading(false)
      initializeMap()
    }
    script.onerror = () => {
      console.error('Failed to load Google Maps API')
      setLoading(false)
      // Fallback to OpenStreetMap
      initializeOpenStreetMap()
    }
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
    }
  }, [])

  const initializeMap = useCallback(() => {
    if (!window.google || !window.google.maps) {
      console.error('Google Maps API not loaded')
      return
    }

    const mapOptions = {
      center: mapCenter,
      zoom: zoom,
      styles: getMapStyles(),
      disableDefaultUI: true,
      zoomControl: true,
      streetViewControl: false,
      mapTypeControl: true,
      fullscreenControl: false
    }

    const map = new window.google.maps.Map(mapRef.current, mapOptions)
    
    // Add weather layers
    addWeatherLayers(map)
    
    // Add radar overlay
    if (radarOverlay) {
      addRadarOverlay(map)
    }

    // Add weather markers
    if (weatherData) {
      addWeatherMarkers(map, weatherData)
    }

    // Add location marker
    if (coordinates) {
      addLocationMarker(map, coordinates)
    }

  }, [mapCenter, zoom, radarOverlay, weatherData, coordinates])

  const initializeOpenStreetMap = useCallback(() => {
    if (!window.L) {
      console.error('Leaflet not loaded')
      return
    }

    const map = window.L.map(mapRef.current, {
      center: [mapCenter.lat, mapCenter.lng],
      zoom: zoom,
      zoomControl: true
    })

    // Add OpenStreetMap tiles
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map)

    // Add weather layers
    addWeatherLayersOSM(map)
    
    // Add radar overlay
    if (radarOverlay) {
      addRadarOverlayOSM(map)
    }

    // Add weather markers
    if (weatherData) {
      addWeatherMarkersOSM(map, weatherData)
    }

    // Add location marker
    if (coordinates) {
      addLocationMarkerOSM(map, coordinates)
    }

  }, [mapCenter, zoom, radarOverlay, weatherData, coordinates])

  const addWeatherLayers = (map) => {
    // Weather radar layer
    const weatherLayer = new window.google.maps.ImageMapType({
      getTileUrl: (coord, zoom) => {
        return `https://tile.openweathermap.org/map/weather_new/{zoom}/{coord.x}/{coord.y}.png?appid=YOUR_OPENWEATHER_KEY`
      },
      name: 'Weather',
      alt: 'Weather Layer'
    })

    // Temperature layer
    const tempLayer = new window.google.maps.ImageMapType({
      getTileUrl: (coord, zoom) => {
        return `https://tile.openweathermap.org/map/temp_new/{zoom}/{coord.x}/{coord.y}.png?appid=YOUR_OPENWEATHER_KEY`
      },
      name: 'Temperature',
      alt: 'Temperature Layer'
    })

    // Precipitation layer
    const precipLayer = new window.google.maps.ImageMapType({
      getTileUrl: (coord, zoom) => {
        return `https://tile.openweathermap.org/map/precipitation_new/{zoom}/{coord.x}/{coord.y}.png?appid=YOUR_OPENWEATHER_KEY`
      },
      name: 'Precipitation',
      alt: 'Precipitation Layer'
    })

    // Clouds layer
    const cloudLayer = new window.google.maps.ImageMapType({
      getTileUrl: (coord, zoom) => {
        return `https://tile.openweathermap.org/map/clouds_new/{zoom}/{coord.x}/{coord.y}.png?appid=YOUR_OPENWEATHER_KEY`
      },
      name: 'Clouds',
      alt: 'Clouds Layer'
    })

    // Wind layer
    const windLayer = new window.google.maps.ImageMapType({
      getTileUrl: (coord, zoom) => {
        return `https://tile.openweathermap.org/map/wind_new/{zoom}/{coord.x}/{coord.y}.png?appid=YOUR_OPENWEATHER_KEY`
      },
      name: 'Wind',
      alt: 'Wind Layer'
    })

    return {
      weather: weatherLayer,
      temperature: tempLayer,
      precipitation: precipLayer,
      clouds: cloudLayer,
      wind: windLayer
    }
  }

  const addRadarOverlay = (map) => {
    // NEXRAD radar overlay
    const nexradLayer = new window.google.maps.GroundOverlay({
      url: 'https://radar.weather.gov/ridge/Conus/Loop/NEXRAD.gif',
      bounds: new window.google.maps.LatLngBounds(
        new window.google.maps.LatLng(20.0, -130.0),
        new window.google.maps.LatLng(55.0, -60.0)
      ),
      opacity: 0.7
    })

    nexradLayer.setMap(map)
    return nexradLayer
  }

  const addWeatherMarkers = (map, data) => {
    const markers = []

    // Current weather marker
    const currentMarker = new window.google.maps.Marker({
      position: { lat: data.coord.lat, lng: data.coord.lon },
      map: map,
      title: data.name,
      icon: {
        url: getWeatherIcon(data.weather[0].icon),
        scaledSize: new window.google.maps.Size(50, 50),
        origin: new window.google.maps.Point(0, 0),
        anchor: new window.google.maps.Point(25, 25)
      },
      animation: window.google.maps.Animation.DROP
    })

    // Info window for current weather
    const infoWindow = new window.google.maps.InfoWindow({
      content: `
        <div class="weather-info-window">
          <h3>${data.name}</h3>
          <p><strong>${data.weather[0].description}</strong></p>
          <p>Temperature: ${Math.round(data.main.temp)}°F</p>
          <p>Humidity: ${data.main.humidity}%</p>
          <p>Wind: ${data.wind.speed} mph</p>
        </div>
      `
    })

    currentMarker.addListener('click', () => {
      infoWindow.open(map, currentMarker)
    })

    markers.push(currentMarker)

    // Add nearby weather stations
    if (data.weather && data.coord) {
      const nearbyStations = getNearbyWeatherStations(data.coord.lat, data.coord.lon)
      nearbyStations.forEach(station => {
        const stationMarker = new window.google.maps.Marker({
          position: { lat: station.lat, lng: station.lon },
          map: map,
          title: station.name,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 4,
            fillColor: '#FF0000',
            fillOpacity: 0.7,
            strokeColor: '#FFFFFF',
            strokeWeight: 2
          }
        })

        const stationInfo = new window.google.maps.InfoWindow({
          content: `
            <div class="station-info-window">
              <h4>${station.name}</h4>
              <p>Temperature: ${station.temp}°F</p>
              <p>Humidity: ${station.humidity}%</p>
            </div>
          `
        })

        stationMarker.addListener('click', () => {
          stationInfo.open(map, stationMarker)
        })

        markers.push(stationMarker)
      })
    }

    return markers
  }

  const addLocationMarker = (map, coords) => {
    const locationMarker = new window.google.maps.Marker({
      position: { lat: coords.latitude, lng: coords.longitude },
      map: map,
      title: 'Your Location',
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 6,
        fillColor: '#4285F4',
        fillOpacity: 0.8,
        strokeColor: '#FFFFFF',
        strokeWeight: 3
      },
      animation: window.google.maps.Animation.BOUNCE
    })

    const locationInfo = new window.google.maps.InfoWindow({
      content: `
        <div class="location-info-window">
          <h4>📍 Your Location</h4>
          <p>Lat: ${coords.latitude.toFixed(4)}</p>
          <p>Lng: ${coords.longitude.toFixed(4)}</p>
        </div>
      `
    })

    locationMarker.addListener('click', () => {
      locationInfo.open(map, locationMarker)
    })

    return locationMarker
  }

  const getWeatherIcon = (iconCode) => {
    const iconMap = {
      '01d': '☀️',
      '01n': '🌙',
      '02d': '⛅',
      '02n': '☁️',
      '03d': '☁️',
      '03n': '☁️',
      '04d': '☁️',
      '04n': '☁️',
      '09d': '🌧',
      '09n': '🌧',
      '10d': '🌧',
      '10n': '🌧',
      '11d': '🌧',
      '11n': '🌧',
      '13d': '🌧',
      '13n': '🌧',
      '50d': '🌫',
      '50n': '🌫'
    }
    return iconMap[iconCode] || '🌤'
  }

  const getNearbyWeatherStations = (lat, lon) => {
    // Simulate nearby weather stations
    return [
      { name: 'Station A', lat: lat + 0.1, lon: lon + 0.1, temp: 72, humidity: 65 },
      { name: 'Station B', lat: lat - 0.1, lon: lon + 0.1, temp: 68, humidity: 70 },
      { name: 'Station C', lat: lat + 0.1, lon: lon - 0.1, temp: 75, humidity: 60 }
    ]
  }

  const getMapStyles = () => {
    return [
      {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [
          { color: '#e9e3e8' }
        ]
      },
      {
        featureType: 'landscape',
        elementType: 'geometry',
        stylers: [
          { color: '#f5f5f5' }
        ]
      }
    ]
  }

  const handleStyleChange = (style) => {
    setMapStyle(style)
  }

  const handleZoomChange = (newZoom) => {
    setZoom(newZoom)
  }

  const handleRadarToggle = () => {
    setRadarOverlay(!radarOverlay)
  }

  const handleWeatherLayerToggle = () => {
    setWeatherLayer(!weatherLayer)
  }

  if (loading) {
    return (
      <div className="map-loading">
        <div className="loading-spinner"></div>
        <p>Loading weather map...</p>
      </div>
    )
  }

  return (
    <div className="weather-map-radar">
      <div className="map-controls">
        <div className="control-group">
          <label>Map Style:</label>
          <select value={mapStyle} onChange={(e) => handleStyleChange(e.target.value)}>
            <option value="roadmap">Roadmap</option>
            <option value="satellite">Satellite</option>
            <option value="terrain">Terrain</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>

        <div className="control-group">
          <label>Zoom:</label>
          <input 
            type="range" 
            min="1" 
            max="20" 
            value={zoom} 
            onChange={(e) => handleZoomChange(parseInt(e.target.value))}
          />
          <span>{zoom}</span>
        </div>

        <div className="control-group">
          <label>
            <input 
              type="checkbox" 
              checked={radarOverlay} 
              onChange={handleRadarToggle}
            />
            Radar Overlay
          </label>
        </div>

        <div className="control-group">
          <label>
            <input 
              type="checkbox" 
              checked={weatherLayer} 
              onChange={handleWeatherLayerToggle}
            />
            Weather Layer
          </label>
        </div>
      </div>

      <div className="map-container">
        <div ref={mapRef} className="map-canvas"></div>
      </div>

      <div className="map-legend">
        <h4>Legend</h4>
        <div className="legend-item">
          <span className="legend-icon">🌧</span>
          <span>Temperature Layer</span>
        </div>
        <div className="legend-item">
          <span className="legend-icon">💧</span>
          <span>Precipitation</span>
        </div>
        <div className="legend-item">
          <span className="legend-icon">☁️</span>
          <span>Clouds</span>
        </div>
        <div className="legend-item">
          <span className="legend-icon">💨</span>
          <span>Wind</span>
        </div>
        <div className="legend-item">
          <span className="legend-icon">📍</span>
          <span>Your Location</span>
        </div>
      </div>
    </div>
  )
}

export default WeatherMapRadar

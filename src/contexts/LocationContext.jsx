import React, { createContext, useContext, useState, useEffect } from 'react'

// Create Location Context
const LocationContext = createContext()

// Location Provider Component
export const LocationProvider = ({ children }) => {
  const [location, setLocation] = useState('New York, NY')
  const [coordinates, setCoordinates] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Load saved location on mount
  useEffect(() => {
    const savedLocation = localStorage.getItem('weatherLocation') || 'New York, NY'
    const savedCoordinates = localStorage.getItem('weatherCoordinates')
    
    setLocation(savedLocation)
    if (savedCoordinates) {
      try {
        setCoordinates(JSON.parse(savedCoordinates))
      } catch (e) {
        console.log('Could not parse saved coordinates')
      }
    }
  }, [])

  // Handle location change with geocoding
  const handleLocationChange = async (newLocation) => {
    if (!newLocation || newLocation.trim() === '') return
    
    setLoading(true)
    setError(null)
    
    try {
      console.log('🌍 LocationContext: Geocoding location:', newLocation)
      
      // Geocode the location to get coordinates
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(newLocation)}&limit=1`
      )
      const data = await response.json()
      
      if (!data || data.length === 0) {
        throw new Error('Location not found')
      }
      
      const { lat, lon, display_name } = data[0]
      const coords = { lat: parseFloat(lat), lon: parseFloat(lon) }
      
      // Update state
      setLocation(newLocation)
      setCoordinates(coords)
      
      // Save to localStorage
      localStorage.setItem('weatherLocation', newLocation)
      localStorage.setItem('weatherCoordinates', JSON.stringify(coords))
      localStorage.setItem('weatherLocationHistory', JSON.stringify([
        newLocation,
        ...JSON.parse(localStorage.getItem('weatherLocationHistory') || '[]')
          .filter(loc => loc !== newLocation)
          .slice(0, 9)
      ]))
      
      console.log('✅ LocationContext: Location updated:', { location: newLocation, coordinates: coords })
      
    } catch (error) {
      console.error('❌ LocationContext: Error geocoding location:', error)
      setError(error.message || 'Failed to find location')
    } finally {
      setLoading(false)
    }
  }

  // Handle coordinates change (from GPS location)
  const handleCoordinatesChange = async (coords, locationName) => {
    setLoading(true)
    setError(null)
    
    try {
      const locationString = locationName || `${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}`
      
      setLocation(locationString)
      setCoordinates(coords)
      
      // Save to localStorage
      localStorage.setItem('weatherLocation', locationString)
      localStorage.setItem('weatherCoordinates', JSON.stringify(coords))
      
      console.log('✅ LocationContext: Coordinates updated:', { location: locationString, coordinates: coords })
      
    } catch (error) {
      console.error('❌ LocationContext: Error updating coordinates:', error)
      setError(error.message || 'Failed to update location')
    } finally {
      setLoading(false)
    }
  }

  // Get location history
  const getLocationHistory = () => {
    try {
      return JSON.parse(localStorage.getItem('weatherLocationHistory') || '[]')
    } catch (e) {
      return []
    }
  }

  const value = {
    location,
    coordinates,
    loading,
    error,
    setLocation: handleLocationChange,
    setCoordinates: handleCoordinatesChange,
    getLocationHistory
  }

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  )
}

// Custom hook to use location context
export const useLocation = () => {
  const context = useContext(LocationContext)
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider')
  }
  return context
}

export default LocationContext

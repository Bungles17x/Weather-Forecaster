import React, { createContext, useContext, useState, useEffect } from 'react'
import { resolveLocation } from '../services/weatherData'

const LocationContext = createContext()
const DEFAULT_LOCATION = 'Washington, District of Columbia'
const DEFAULT_COORDINATES = { lat: 38.9072, lon: -77.0369 }

export const LocationProvider = ({ children }) => {
  const [location, setLocationState] = useState(DEFAULT_LOCATION)
  const [coordinates, setCoordinatesState] = useState(DEFAULT_COORDINATES)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const savedLocation = localStorage.getItem('weatherLocation')
      const savedCoordinates = localStorage.getItem('weatherCoordinates')
      if (savedLocation) setLocationState(savedLocation)
      if (savedCoordinates) {
        const parsed = JSON.parse(savedCoordinates)
        if (Number.isFinite(Number(parsed.lat)) && Number.isFinite(Number(parsed.lon))) {
          setCoordinatesState({ lat: Number(parsed.lat), lon: Number(parsed.lon) })
        }
      }
    } catch (storageError) {
      console.warn('Saved location could not be restored.', storageError)
    } finally {
      setReady(true)
    }
  }, [])

  const persistLocation = (name, coords) => {
    setLocationState(name)
    setCoordinatesState(coords)
    try {
      localStorage.setItem('weatherLocation', name)
      localStorage.setItem('weatherCoordinates', JSON.stringify(coords))
      const history = JSON.parse(localStorage.getItem('weatherLocationHistory') || '[]')
      localStorage.setItem('weatherLocationHistory', JSON.stringify([name, ...history.filter(item => item !== name)].slice(0, 10)))
    } catch (storageError) {
      // The app remains usable if private browsing blocks local storage.
      console.info('Location preferences were not saved on this device.')
    }
  }

  const handleLocationChange = async newLocation => {
    if (!newLocation || !newLocation.trim()) return
    setLoading(true)
    setError(null)
    try {
      const result = await resolveLocation(newLocation.trim())
      persistLocation(result.name, { lat: result.lat, lon: result.lon })
    } catch (lookupError) {
      setError(lookupError.message || 'Could not resolve that location.')
    } finally {
      setLoading(false)
    }
  }

  const handleCoordinatesChange = async (coords, locationName) => {
    const lat = Number(coords?.lat)
    const lon = Number(coords?.lon)
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
      setError('The provided coordinates are invalid.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      let name = locationName
      if (!name) {
        try {
          const point = await fetch(`https://api.weather.gov/points/${lat.toFixed(4)},${lon.toFixed(4)}`, { headers: { Accept: 'application/geo+json' } })
          if (point.ok) {
            const payload = await point.json()
            const relative = payload.properties?.relativeLocation?.properties
            name = relative?.city && relative?.state ? `${relative.city}, ${relative.state}` : `${lat.toFixed(3)}, ${lon.toFixed(3)}`
          }
        } catch { /* Keep coordinate label below. */ }
      }
      persistLocation(name || `${lat.toFixed(3)}, ${lon.toFixed(3)}`, { lat, lon })
    } finally {
      setLoading(false)
    }
  }

  const getLocationHistory = () => {
    try { return JSON.parse(localStorage.getItem('weatherLocationHistory') || '[]') }
    catch { return [] }
  }

  return <LocationContext.Provider value={{ location, coordinates, loading, error, ready, setLocation: handleLocationChange, setCoordinates: handleCoordinatesChange, getLocationHistory }}>
    {children}
  </LocationContext.Provider>
}

export const useLocation = () => {
  const context = useContext(LocationContext)
  if (!context) throw new Error('useLocation must be used within a LocationProvider')
  return context
}

export default LocationContext

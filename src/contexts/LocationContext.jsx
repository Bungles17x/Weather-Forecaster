import React, { createContext, useContext, useState, useEffect } from 'react'
import { resolveLocation } from '../services/weatherData'
import { SAVED_LOCATIONS_KEY, addSavedLocation, hasSavedLocation, normalizeSavedLocations, removeSavedLocation } from '../services/savedLocations'

const LocationContext = createContext()
const DEFAULT_LOCATION = 'Washington, District of Columbia'
const DEFAULT_COORDINATES = { lat: 38.9072, lon: -77.0369 }

export const LocationProvider = ({ children }) => {
  const [location, setLocationState] = useState(DEFAULT_LOCATION)
  const [coordinates, setCoordinatesState] = useState(DEFAULT_COORDINATES)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [ready, setReady] = useState(false)
  const [savedLocations, setSavedLocations] = useState([])

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
      const savedPlaces = localStorage.getItem(SAVED_LOCATIONS_KEY)
      if (savedPlaces) setSavedLocations(normalizeSavedLocations(JSON.parse(savedPlaces)))
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

  const persistSavedLocations = next => {
    setSavedLocations(next)
    try {
      localStorage.setItem(SAVED_LOCATIONS_KEY, JSON.stringify(next))
    } catch (storageError) {
      console.info('Saved places were not stored on this device.')
    }
  }

  // Bookmarking re-uses the location already on screen, so saving a place never
  // costs a geocoding request.
  const saveCurrentLocation = () => {
    persistSavedLocations(addSavedLocation(savedLocations, { name: location, coordinates }))
  }

  const forgetSavedLocation = key => {
    persistSavedLocations(removeSavedLocation(savedLocations, key))
  }

  const selectSavedLocation = saved => {
    if (!saved?.coordinates) return
    persistLocation(saved.name, saved.coordinates)
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

  return <LocationContext.Provider value={{
    location, coordinates, loading, error, ready,
    setLocation: handleLocationChange,
    setCoordinates: handleCoordinatesChange,
    getLocationHistory,
    savedLocations,
    saveCurrentLocation,
    forgetSavedLocation,
    selectSavedLocation,
    isCurrentSaved: hasSavedLocation(savedLocations, coordinates)
  }}>
    {children}
  </LocationContext.Provider>
}

export const useLocation = () => {
  const context = useContext(LocationContext)
  if (!context) throw new Error('useLocation must be used within a LocationProvider')
  return context
}

export default LocationContext

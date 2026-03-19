import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useLocation as useGlobalLocation } from '../contexts/LocationContext'
import './Header.css'
import { LogoIcon } from './WeatherIcons'
import VersionManager from '../utils/versionManager'

const Header = ({ onLocationChange }) => {
  // Use global location context
  const { location: globalLocation, setLocation: setGlobalLocation, getLocationHistory } = useGlobalLocation()
  
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false)
  const [locationInput, setLocationInput] = useState('New York, NY')
  const [searchInput, setSearchInput] = useState('')
  const [searchSuggestions, setSearchSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [locating, setLocating] = useState(false)
  const [currentCoordinates, setCurrentCoordinates] = useState(null)
  const [showLocationSearch, setShowLocationSearch] = useState(false)
  const [locationSearchInput, setLocationSearchInput] = useState('')
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [currentVersion, setCurrentVersion] = useState('v1.0.0')
  const [latestVersion, setLatestVersion] = useState('v1.0.0')
  const [versionManager] = useState(() => new VersionManager())
  const location = useLocation()

  // Version checking logic
  useEffect(() => {
    const checkVersion = () => {
      const versionInfo = versionManager.checkForUpdates()
      setCurrentVersion(versionInfo.currentVersion)
      setLatestVersion(versionInfo.latestVersion)
      setUpdateAvailable(versionInfo.updateAvailable)
    }
    
    checkVersion()
    
    // Check for updates every 5 minutes
    const interval = setInterval(checkVersion, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [versionManager])

  // Make version manager globally accessible for debugging
  useEffect(() => {
    window.debugVersionManager = versionManager
    console.log('🔧 Debug: Version manager available at window.debugVersionManager')
    console.log('💡 To trigger update: window.debugVersionManager.debugTriggerUpdate()')
  }, [versionManager])

  // Handle app restart for update
  const handleRestartForUpdate = () => {
    console.log('🔄 Restarting app for update...')
    versionManager.restartForUpdate()
  }

  // Handle dismissing update notification
  const handleDismissUpdate = () => {
    setUpdateAvailable(false)
    versionManager.clearUpdate()
  }

  // Sync location input with global location
  useEffect(() => {
    setLocationInput(globalLocation || 'New York, NY')
  }, [globalLocation])

  // Get current page for active navigation
  const getCurrentPage = () => {
    const path = location.pathname
    if (path === '/' || path === '') return 'weather'
    if (path === '/home') return 'home'
    if (path === '/forecast') return 'forecast'
    if (path === '/map') return 'map'
    if (path === '/alerts') return 'alerts'
    if (path === '/settings') return 'settings'
    return 'weather'
  }

  const currentPage = getCurrentPage()

  const handleLocationChange = () => {
    setIsLocationModalOpen(true)
  }

  const handleLocateMe = () => {
    console.log('🔘 Locate button clicked!')
    
    if (!navigator.geolocation) {
      console.error('❌ Geolocation is not supported by your browser')
      alert('Geolocation is not supported by your browser')
      return
    }

    console.log('📍 Starting geolocation request...')
    
    // Check current permission status
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        console.log('🔐 Current geolocation permission:', result.state)
        
        if (result.state === 'denied') {
          console.log('❌ Location permission previously denied - showing search modal')
          setLocating(false)
          // Show search city form when permission was denied
          setShowLocationSearch(true)
          setLocationSearchInput('')
          return
        }
        
        if (result.state === 'granted') {
          console.log('✅ Location permission already granted')
          // Proceed with location request
          requestLocation()
        } else {
          console.log('🔐 Location permission not set - requesting...')
          // Request permission
          requestLocation()
        }
      }).catch((error) => {
        console.log('🔐 Permission API not supported, proceeding anyway...')
        requestLocation()
      })
    } else {
      console.log('🔐 Permission API not supported, proceeding anyway...')
      requestLocation()
    }
  }

  const requestLocation = () => {
    setLocating(true)

    // Use watchPosition instead of getCurrentPosition to trigger permission dialog
    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        console.log('✅ GPS position obtained:', position)
        const { latitude, longitude } = position.coords
        const coordinates = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
        console.log('📍 Navbar location found:', { latitude, longitude })
        
        // Clear the watch immediately after getting position
        navigator.geolocation.clearWatch(watchId)
        
        // Store coordinates
        setCurrentCoordinates(coordinates)
        
        try {
          console.log('🌍 Starting reverse geocoding...')
          // Reverse geocode to get location name
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`)
          const data = await response.json()
          console.log('🌍 Geocoding response:', data)
          
          let locationName = `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`

          if (data && data.display_name) {
            locationName = data.display_name
            console.log('📍 Reverse geocoded location:', locationName)
          }
          
          // Update location display and global context
          setLocationInput(locationName)
          setGlobalLocation(locationName)
          
          // Also call parent callback if provided
          if (onLocationChange) {
            console.log('🔄 Calling onLocationChange with:', locationName)
            onLocationChange(locationName)
          }
        } catch (error) {
          console.error('❌ Reverse geocoding error:', error)
          // Fallback to coordinates
          const fallbackLocation = `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`

          setLocationInput(fallbackLocation)
          setGlobalLocation(fallbackLocation)
          
          if (onLocationChange) {
            onLocationChange(fallbackLocation)
          }
        }
        
        setLocating(false)
      },
      (error) => {
        console.error('❌ Navbar geolocation error:', error)
        setLocating(false)
        
        console.log('🔍 About to show location search modal...')
        // Show search city form when location fails
        setShowLocationSearch(true)
        setLocationSearchInput('')
        console.log('🔍 Location search modal state set to true')
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0 // Force fresh location
      }
    )
  }

  const handleLocationSearchSubmit = (e) => {
    e.preventDefault()
    if (locationSearchInput.trim()) {
      console.log('📍 Header: Location search submitted:', locationSearchInput)
      
      // Use global location context
      setGlobalLocation(locationSearchInput)
      setShowLocationSearch(false)
      setLocationSearchInput('')
      
      // Also call parent callback if provided
      if (onLocationChange) {
        onLocationChange(locationSearchInput)
      }
    }
  }

  const handleLocationSearchInputChange = (e) => {
    const value = e.target.value
    setLocationSearchInput(value)
  }

  const closeLocationSearch = () => {
    setShowLocationSearch(false)
    setLocationSearchInput('')
  }

  const handleLocationSubmit = (e) => {
    e.preventDefault()
    if (locationInput.trim()) {
      console.log('📍 Header: Location submitted:', locationInput)
      
      // Use global location context
      setGlobalLocation(locationInput)
      setIsLocationModalOpen(false)
      
      // Also call parent callback if provided
      if (onLocationChange) {
        onLocationChange(locationInput)
      }
    }
  }

  const handleSearch = (e) => {
    const query = e.target.value
    setSearchInput(query)
    
    if (query.length > 0) {
      // Get location history from localStorage
      const history = JSON.parse(localStorage.getItem('weatherLocationHistory') || '[]')
      const suggestions = [
        ...history,
        'New York, NY',
        'Los Angeles, CA',
        'Chicago, IL',
        'Houston, TX',
        'Phoenix, AZ',
        'Philadelphia, PA',
        'San Antonio, TX',
        'San Diego, CA',
        'Dallas, TX'
      ].filter(city => 
        city.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5) // Limit to 5 suggestions
      setSearchSuggestions(suggestions)
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
      setSearchSuggestions([])
    }
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchInput.trim()) {
      console.log('📍 Header: Search submitted:', searchInput)
      
      // Use global location context
      setGlobalLocation(searchInput)
      setSearchInput('')
      setSearchSuggestions([])
      setShowSuggestions(false)
      
      // Also call parent callback if provided
      if (onLocationChange) {
        onLocationChange(searchInput)
      }
    }
  }

  const handleSuggestionClick = (suggestion) => {
    console.log('📍 Header: Suggestion clicked:', suggestion)
    
    // Use global location context
    setGlobalLocation(suggestion)
    setLocationInput(suggestion)
    setSearchSuggestions([])
    setShowSuggestions(false)
    setIsLocationModalOpen(false)
    
    // Also call parent callback if provided
    if (onLocationChange) {
      onLocationChange(suggestion)
    }
  }

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const handleMenuClose = () => {
    setIsMenuOpen(false)
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  const handleSettings = () => {
    window.location.href = '/settings'
  }

  const clearSearchHistory = () => {
    setSearchSuggestions([])
    localStorage.removeItem('weatherLocationHistory')
    localStorage.removeItem('weatherSearchHistory')
  }

  // Load location history from localStorage
  useEffect(() => {
    const history = localStorage.getItem('weatherLocationHistory')
    if (history) {
      setSearchSuggestions(JSON.parse(history))
    }
  }, [])

  return (
    <>
      <header className="weather-header">
        <div className="header-content">
          <div className="header-left">
            <Link to="/" className="logo-container">
              <LogoIcon />
              <span className="app-title">Weather Forecaster</span>
            </Link>
          </div>
          
          <div className="header-center">
            <div className="search-container">
              <form className="search-form" onSubmit={handleSearchSubmit}>
                <div className="search-input-wrapper">
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search location..."
                    value={searchInput}
                    onChange={handleSearch}
                    onFocus={() => searchInput && setShowSuggestions(true)}
                  />
                  <button type="submit" className="search-button">
                    🔍
                  </button>
                </div>
              </form>
              
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="search-suggestions">
                  <div className="suggestions-header">
                    <span>📍 Recent Locations</span>
                    <button className="clear-history-btn" onClick={clearSearchHistory}>
                      Clear History
                    </button>
                  </div>
                  {searchSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="suggestion-item"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <span className="suggestion-icon">📍</span>
                      <span className="suggestion-text">{suggestion}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="desktop-nav">
            <Link to="/" className={`desktop-nav-item ${currentPage === 'weather' ? 'active' : ''}`}>
              <div className="shimmer"></div>
              <div className="glow"></div>
              <span className="desktop-nav-icon">🌤️</span>
              <span className="desktop-nav-label">Weather</span>
            </Link>
            <Link to="/home" className={`desktop-nav-item ${currentPage === 'home' ? 'active' : ''}`}>
              <div className="shimmer"></div>
              <div className="glow"></div>
              <span className="desktop-nav-icon">🏠</span>
              <span className="desktop-nav-label">Home</span>
            </Link>
            <Link to="/forecast" className={`desktop-nav-item ${currentPage === 'forecast' ? 'active' : ''}`}>
              <div className="shimmer"></div>
              <div className="glow"></div>
              <span className="desktop-nav-icon">📅</span>
              <span className="desktop-nav-label">Forecast</span>
            </Link>
            <Link to="/map" className={`desktop-nav-item ${currentPage === 'map' ? 'active' : ''}`}>
              <div className="shimmer"></div>
              <div className="glow"></div>
              <span className="desktop-nav-icon">🗺️</span>
              <span className="desktop-nav-label">radar</span>
            </Link>
            <Link to="/alerts" className={`desktop-nav-item ${currentPage === 'alerts' ? 'active' : ''}`}>
              <div className="shimmer"></div>
              <div className="glow"></div>
              <span className="desktop-nav-icon">🚨</span>
              <span className="desktop-nav-label">Alerts</span>
            </Link>
            <Link to="/settings" className={`desktop-nav-item ${currentPage === 'settings' ? 'active' : ''}`}>
              <div className="shimmer"></div>
              <div className="glow"></div>
              <span className="desktop-nav-icon">⚙️</span>
              <span className="desktop-nav-label">Settings</span>
            </Link>
          </div>
          
          <div className="header-right">
            {/* Version Display and Update Button */}
            {updateAvailable && (
              <div className="update-notification">
                <div className="update-info">
                  <span className="update-badge">🔄</span>
                  <span className="update-text">Update Available</span>
                  <span className="version-info">{latestVersion}</span>
                </div>
                <div className="update-actions">
                  <button 
                    className="update-btn"
                    onClick={handleRestartForUpdate}
                    title="Restart to update to latest version"
                  >
                    Restart
                  </button>
                  <button 
                    className="dismiss-btn"
                    onClick={handleDismissUpdate}
                    title="Dismiss update notification"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
            
            {/* Current Version Display */}
            <div className="version-display" title={`Current version: ${currentVersion}`}>
              <span className="version-text">{currentVersion}</span>
            </div>
            
            <nav className="header-nav">
              <button
                onClick={handleLocateMe}
                className={`locate-me-btn ${locating ? 'locating' : ''}`}
                disabled={locating}
                title="Find my current location"
              >
                <span className="locate-me-icon">{locating ? '🔄' : '📍'}</span>
                <span className="locate-me-text">
                  {locating ? 'Locating...' : 'Locate Me'}
                </span>
              </button>
              
              <button
                onClick={handleMenuToggle}
                className={`menu-toggle ${isMenuOpen ? 'open' : ''}`}
                title="Toggle menu"
              >
                <span className="menu-icon">☰</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <div className="mobile-bottom-nav">
        <Link to="/" className="mobile-nav-btn" title="Current weather">
          <span className="mobile-nav-icon">🌤️</span>
          <span className="mobile-nav-label">Weather</span>
        </Link>
        
        <Link to="/forecast" className="mobile-nav-btn" title="View forecast">
          <span className="mobile-nav-icon">📅</span>
          <span className="mobile-nav-label">Forecast</span>
        </Link>
        
        <Link to="/map" className="mobile-nav-btn" title="View weather map">
          <span className="mobile-nav-icon">🗺️</span>
          <span className="mobile-nav-label">radar</span>
        </Link>
        
        <Link to="/alerts" className="mobile-nav-btn" title="View weather alerts">
          <span className="mobile-nav-icon">🚨</span>
          <span className="mobile-nav-label">Alerts</span>
        </Link>
        
        <button
          onClick={handleLocateMe}
          className={`mobile-nav-btn ${locating ? 'locating' : ''}`}
          disabled={locating}
          title="Find my current location"
        >
          <span className="mobile-nav-icon">{locating ? '🔄' : '📍'}</span>
          <span className="mobile-nav-label">
            {locating ? 'Locating...' : 'Locate'}
          </span>
        </button>
      </div>

      {/* Location Search Modal - Shown when GPS fails */}
      {console.log('🔍 Rendering check - showLocationSearch:', showLocationSearch) || showLocationSearch && (
        <div className="location-search-overlay" onClick={closeLocationSearch}>
          <div className="location-search-modal" onClick={(e) => e.stopPropagation()}>
            <div className="location-search-header">
              <h3>📍 Enter Your Location</h3>
              <button className="close-search-btn" onClick={closeLocationSearch}>✕</button>
            </div>
            <div className="location-search-content">
              <p className="location-search-message">
                We couldn't get your location automatically. Please enter your city name manually.
              </p>
              <form className="location-search-form" onSubmit={handleLocationSearchSubmit}>
                <div className="location-search-input-wrapper">
                  <input
                    type="text"
                    className="location-search-input"
                    placeholder="Enter city name (e.g., New York, NY)"
                    value={locationSearchInput}
                    onChange={handleLocationSearchInputChange}
                    autoFocus
                  />
                  <button type="submit" className="location-search-submit-btn">
                    🔍
                  </button>
                </div>
              </form>
              <div className="location-search-suggestions">
                <p className="suggestions-title">Popular Cities:</p>
                <div className="quick-city-buttons">
                  <button onClick={() => {setLocationSearchInput('New York, NY');}} className="quick-city-btn">New York</button>
                  <button onClick={() => {setLocationSearchInput('Los Angeles, CA');}} className="quick-city-btn">Los Angeles</button>
                  <button onClick={() => {setLocationSearchInput('Chicago, IL');}} className="quick-city-btn">Chicago</button>
                  <button onClick={() => {setLocationSearchInput('Houston, TX');}} className="quick-city-btn">Houston</button>
                  <button onClick={() => {setLocationSearchInput('Phoenix, AZ');}} className="quick-city-btn">Phoenix</button>
                  <button onClick={() => {setLocationSearchInput('Philadelphia, PA');}} className="quick-city-btn">Philadelphia</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="menu-overlay" onClick={handleMenuClose}>
          <div className="menu-sidebar" onClick={(e) => e.stopPropagation()}>
            <div className="menu-header">
              <h3>Weather Forecaster</h3>
              <button className="menu-close-btn" onClick={handleMenuClose}>✕</button>
            </div>
            
            <div className="menu-content">
              <div className="menu-section">
                <h4>Navigation</h4>
                <Link to="/" className="menu-item" onClick={handleMenuClose}>
                  <span className="menu-icon">🌤️</span>
                  <span>Weather</span>
                </Link>
                <Link to="/home" className="menu-item" onClick={handleMenuClose}>
                  <span className="menu-icon">🏠</span>
                  <span>Home</span>
                </Link>
                <Link to="/forecast" className="menu-item" onClick={handleMenuClose}>
                  <span className="menu-icon">📅</span>
                  <span>Forecast</span>
                </Link>
                <Link to="/map" className="menu-item" onClick={handleMenuClose}>
                  <span className="menu-icon">🗺️</span>
                  <span>Map</span>
                </Link>
                <Link to="/alerts" className="menu-item" onClick={handleMenuClose}>
                  <span className="menu-icon">🚨</span>
                  <span>Alerts</span>
                </Link>
                <Link to="/settings" className="menu-item" onClick={handleMenuClose}>
                  <span className="menu-icon">⚙️</span>
                  <span>Settings</span>
                </Link>
              </div>
              
              <div className="menu-section">
                <h4>Actions</h4>
                <button className="menu-item" onClick={() => { handleMenuClose(); handleRefresh(); }}>
                  <span className="menu-icon">🔄</span>
                  <span>Refresh Weather</span>
                </button>
                <button className="menu-item" onClick={() => { handleMenuClose(); handleLocationChange(); }}>
                  <span className="menu-icon">📍</span>
                  <span>Change Location</span>
                </button>
                <button className="menu-item" onClick={() => { handleMenuClose(); handleSettings(); }}>
                  <span className="menu-icon">⚙️</span>
                  <span>Settings</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Location Modal */}
      {isLocationModalOpen && (
        <div className="modal-overlay" onClick={() => setIsLocationModalOpen(false)}>
          <div className="location-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Change Location</h3>
              <button className="modal-close-btn" onClick={() => setIsLocationModalOpen(false)}>✕</button>
            </div>
            
            <form className="location-form" onSubmit={handleLocationSubmit}>
              <div className="form-group">
                <label className="form-label">Enter Location</label>
                <input
                  type="text"
                  className="form-input"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  placeholder="e.g., New York, NY"
                />
              </div>
              
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  Get Weather
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setIsLocationModalOpen(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default Header

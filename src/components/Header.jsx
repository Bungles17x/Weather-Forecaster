import React, { useState } from 'react'
import './Header.css'
import { LogoIcon } from './WeatherIcons'

const Header = ({ onLocationChange }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false)
  const [locationInput, setLocationInput] = useState('Mount Union, PA')
  const [searchInput, setSearchInput] = useState('')
  const [searchSuggestions, setSearchSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const handleLocationChange = () => {
    setIsLocationModalOpen(true)
  }

  const handleLocationSubmit = (e) => {
    e.preventDefault()
    if (locationInput.trim()) {
      onLocationChange && onLocationChange(locationInput)
      setIsLocationModalOpen(false)
    }
  }

  const handleSearch = (e) => {
    const query = e.target.value
    setSearchInput(query)
    
    if (query.length > 0) {
      // Generate search suggestions
      const cities = [
        'New York, NY',
        'Los Angeles, CA', 
        'Chicago, IL',
        'Houston, TX',
        'Phoenix, AZ',
        'Philadelphia, PA',
        'San Antonio, TX',
        'San Diego, CA',
        'Dallas, TX',
        'San Jose, CA',
        'Austin, TX',
        'Jacksonville, FL',
        'Fort Worth, TX',
        'Columbus, OH',
        'Charlotte, NC',
        'San Francisco, CA',
        'Indianapolis, IN',
        'Seattle, WA',
        'Denver, CO',
        'Washington, DC',
        'Boston, MA',
        'El Paso, TX',
        'Nashville, TN',
        'Oklahoma City, OK',
        'Las Vegas, NV',
        'Detroit, MI',
        'Portland, OR',
        'Memphis, TN',
        'Louisville, KY',
        'Milwaukee, WI',
        'Baltimore, MD',
        'Albuquerque, NM',
        'Tucson, AZ',
        'Fresno, CA',
        'Sacramento, CA',
        'Kansas City, MO',
        'Mesa, AZ',
        'Atlanta, GA',
        'Omaha, NE',
        'Colorado Springs, CO',
        'Raleigh, NC',
        'Miami, FL',
        'Oakland, CA',
        'Tulsa, OK',
        'Minneapolis, MN',
        'Cleveland, OH',
        'Wichita, KS',
        'Arlington, TX',
        'New Orleans, LA',
        'Bakersfield, CA',
        'Tampa, FL',
        'Honolulu, HI',
        'Anaheim, CA',
        'Aurora, CO',
        'Santa Ana, CA',
        'St. Louis, MO',
        'Riverside, CA',
        'Corpus Christi, TX',
        'Lexington, KY',
        'Pittsburgh, PA',
        'Anchorage, AK',
        'Stockton, CA',
        'Cincinnati, OH',
        'Saint Paul, MN',
        'Toledo, OH',
        'Greensboro, NC',
        'Newark, NJ',
        'Plano, TX',
        'Henderson, NV',
        'Lincoln, NE',
        'Buffalo, NY',
        'Jersey City, NJ',
        'Chula Vista, CA',
        'Fort Wayne, IN',
        'Orlando, FL',
        'St. Petersburg, FL',
        'Chandler, AZ',
        'Laredo, TX',
        'Norfolk, VA',
        'Durham, NC',
        'Madison, WI',
        'Lubbock, TX',
        'Irvine, CA',
        'Winston-Salem, NC',
        'Glendale, AZ',
        'Garland, TX',
        'Hialeah, FL',
        'Reno, NV',
        'Chesapeake, VA',
        'Gilbert, AZ',
        'Baton Rouge, LA',
        'Irving, TX',
        'Scottsdale, AZ',
        'North Las Vegas, NV',
        'Fremont, CA',
        'Boise, ID',
        'Richmond, VA'
      ]
      
      const filtered = cities.filter(city => 
        city.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
      
      setSearchSuggestions(filtered)
      setShowSuggestions(true)
    } else {
      setSearchSuggestions([])
      setShowSuggestions(false)
    }
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchInput.trim()) {
      onLocationChange && onLocationChange(searchInput)
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = (suggestion) => {
    setSearchInput(suggestion)
    onLocationChange && onLocationChange(suggestion)
    setShowSuggestions(false)
  }

  const handleSearchBlur = () => {
    // Delay hiding suggestions to allow click on suggestion
    setTimeout(() => setShowSuggestions(false), 200)
  }

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const handleMenuClose = () => {
    setIsMenuOpen(false)
  }

  const handleRefresh = () => {
    // TODO: Implement weather data refresh
    console.log('Refreshing weather data...')
    window.location.reload() // Temporary solution
  }

  const handleSettings = () => {
    // TODO: Implement settings modal
    console.log('Opening settings...')
    alert('Settings feature coming soon!')
  }

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      handleMenuClose()
    } else {
      console.log(`Section ${sectionId} not found`)
      handleMenuClose()
    }
  }

  return (
    <>
      <header className="weather-header">
        <div className="container">
          <div className="flex justify-between align-center">
            <div className="header-left">
              <div className="logo">
                <LogoIcon size={32} />
                <span className="logo-text">Weather Forecaster</span>
              </div>
            </div>
            
            <div className="header-center">
              {/* Search Bar */}
              <div className="search-container">
                <form onSubmit={handleSearchSubmit} className="search-form">
                  <div className="search-input-wrapper">
                    <input
                      type="text"
                      value={searchInput}
                      onChange={handleSearch}
                      onBlur={handleSearchBlur}
                      onFocus={() => searchInput.length > 0 && setShowSuggestions(true)}
                      placeholder="Search city, state..."
                      className="search-input"
                    />
                    <button type="submit" className="search-btn">
                      🔍
                    </button>
                  </div>
                  
                  {/* Search Suggestions Dropdown */}
                  {showSuggestions && searchSuggestions.length > 0 && (
                    <div className="search-suggestions">
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
                </form>
              </div>
              
              <div className="location-display">
                <span className="location-icon">📍</span>
                <span className="location-name">Mount Union, PA</span>
                <button className="btn btn-secondary btn-sm" onClick={handleLocationChange}>
                  Change
                </button>
              </div>
            </div>
            
            <div className="header-right">
              <nav className="header-nav">
                <button className="nav-btn refresh-btn" onClick={handleRefresh} title="Refresh Weather">
                  🔄
                </button>
                <button className="nav-btn menu-btn" onClick={handleMenuToggle} title="Menu">
                  ☰
                </button>
              </nav>
            </div>
          </div>
        </div>
      </header>

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
                <button className="menu-item" onClick={handleRefresh}>
                  <span className="menu-icon">🔄</span>
                  <span>Refresh Weather</span>
                </button>
                <button className="menu-item" onClick={handleLocationChange}>
                  <span className="menu-icon">📍</span>
                  <span>Change Location</span>
                </button>
                <button className="menu-item" onClick={handleSettings}>
                  <span className="menu-icon">⚙️</span>
                  <span>Settings</span>
                </button>
              </div>
              
              <div className="menu-section">
                <h4>Quick Actions</h4>
                <button className="menu-item" onClick={() => scrollToSection('hourly-forecast')}>
                  <span className="menu-icon">⏰</span>
                  <span>Hourly Forecast</span>
                </button>
                <button className="menu-item" onClick={() => scrollToSection('ten-day-forecast')}>
                  <span className="menu-icon">📅</span>
                  <span>10-Day Forecast</span>
                </button>
                <button className="menu-item" onClick={() => scrollToSection('weather-map-section')}>
                  <span className="menu-icon">🗺️</span>
                  <span>Weather Map</span>
                </button>
              </div>
              
              <div className="menu-footer">
                <div className="menu-info">
                  <p>Version 1.0.0</p>
                  <p>Powered by OpenWeatherMap</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Location Change Modal */}
      {isLocationModalOpen && (
        <div className="modal-overlay" onClick={() => setIsLocationModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Change Location</h3>
              <button className="modal-close" onClick={() => setIsLocationModalOpen(false)}>✕</button>
            </div>
            
            <form id="location-form" onSubmit={handleLocationSubmit} className="modal-body">
              <div className="form-group">
                <label htmlFor="location">Enter City, State or ZIP Code</label>
                <input
                  type="text"
                  id="location"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  placeholder="e.g., New York, NY or 10001"
                  className="location-input"
                  autoFocus
                />
              </div>
              
              <div className="quick-locations">
                <p>Quick Locations:</p>
                <div className="quick-location-buttons">
                  <button type="button" onClick={() => setLocationInput('New York, NY')}>New York</button>
                  <button type="button" onClick={() => setLocationInput('Los Angeles, CA')}>Los Angeles</button>
                  <button type="button" onClick={() => setLocationInput('Chicago, IL')}>Chicago</button>
                  <button type="button" onClick={() => setLocationInput('Houston, TX')}>Houston</button>
                </div>
              </div>
            </form>
            
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setIsLocationModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" form="location-form" className="btn btn-primary">
                Update Location
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Header

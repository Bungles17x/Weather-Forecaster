import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [locationInput, setLocationInput] = useState('New York, NY')
  const location = useLocation()

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

  const handleLocationSubmit = (e) => {
    e.preventDefault()
    if (locationInput.trim()) {
      // Simple location handling without context
      console.log('Location submitted:', locationInput)
    }
  }

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <Link to="/" className="logo">
            <span className="logo-icon">🌤️</span>
            <span className="logo-text">Weather Forecaster</span>
          </Link>
        </div>
        
        <div className="header-center">
          <form onSubmit={handleLocationSubmit} className="location-search">
            <input
              type="text"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              placeholder="Enter location..."
              className="location-input"
            />
            <button type="submit" className="search-btn">
              🔍
            </button>
          </form>
        </div>
        
        <div className="header-right">
          <nav className="header-nav">
            <Link to="/" className={`nav-link ${currentPage === 'weather' ? 'active' : ''}`}>
              Weather
            </Link>
            <Link to="/forecast" className={`nav-link ${currentPage === 'forecast' ? 'active' : ''}`}>
              Forecast
            </Link>
            <Link to="/map" className={`nav-link ${currentPage === 'map' ? 'active' : ''}`}>
              Map
            </Link>
            <Link to="/alerts" className={`nav-link ${currentPage === 'alerts' ? 'active' : ''}`}>
              Alerts
            </Link>
            <Link to="/settings" className={`nav-link ${currentPage === 'settings' ? 'active' : ''}`}>
              Settings
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}

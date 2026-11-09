import React, { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { WeatherDeskIcon } from './WeatherIcons'
import './MobileNav.css'

const primaryItems = [
  { to: '/', label: 'Home', icon: 'home', end: true },
  { to: '/map', label: 'Radar', icon: 'radar' },
  { to: '/forecast', label: 'Forecast', icon: 'forecast' },
  { to: '/alerts', label: 'Alerts', icon: 'alerts' },
]

const secondaryItems = [
  { to: '/analysis', label: 'Storm lab', icon: 'thunderstorm' },
  { to: '/assistant', label: 'AI Assistant', icon: 'help' },
  { to: '/observations', label: 'Observations', icon: 'observations' },
  { to: '/errors', label: 'Error History', icon: 'database' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
]

export default function MobileNav() {
  const { pathname } = useLocation()
  const [moreOpen, setMoreOpen] = useState(false)
  const moreActive = secondaryItems.some(item => pathname.startsWith(item.to))
  const isMap = pathname === '/map'

  useEffect(() => {
    document.body.classList.toggle('has-mobile-nav', !isMap)
    return () => document.body.classList.remove('has-mobile-nav')
  }, [isMap])

  useEffect(() => {
    setMoreOpen(false)
    document.body.style.overflow = ''
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = moreOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [moreOpen])

  useEffect(() => {
    const onKey = event => { if (event.key === 'Escape') setMoreOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (isMap) return null

  return (
    <>
      <nav className="mobile-nav" aria-label="Primary navigation">
        {primaryItems.map(item => (
          <NavLink key={item.to} to={item.to} end={item.end} className="mobile-nav-item">
            <WeatherDeskIcon name={item.icon} size={21} />
            <span>{item.label}</span>
          </NavLink>
        ))}
        <button
          type="button"
          className={`mobile-nav-item mobile-nav-more ${moreActive || moreOpen ? 'is-active' : ''}`}
          onClick={() => setMoreOpen(value => !value)}
          aria-expanded={moreOpen}
          aria-controls="mobile-nav-sheet"
        >
          <WeatherDeskIcon name={moreOpen ? 'close' : 'menu'} size={21} />
          <span>More</span>
        </button>
      </nav>

      {moreOpen && (
        <div className="mobile-nav-sheet-wrap" role="presentation" onClick={() => setMoreOpen(false)}>
          <div
            id="mobile-nav-sheet"
            className="mobile-nav-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="More navigation"
            onClick={event => event.stopPropagation()}
          >
            <div className="mobile-nav-sheet-grip" aria-hidden="true" />
            <strong className="mobile-nav-sheet-title">More</strong>
            <nav className="mobile-nav-sheet-grid" aria-label="Additional navigation">
              {secondaryItems.map(item => (
                <NavLink key={item.to} to={item.to} className="mobile-nav-sheet-item">
                  <span className="mobile-nav-sheet-icon"><WeatherDeskIcon name={item.icon} size={22} /></span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  )
}

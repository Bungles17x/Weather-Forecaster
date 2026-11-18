import React, { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useLocation } from '../contexts/LocationContext'
import { useWeather } from '../contexts/WeatherContext'
import { LogoIcon, WeatherDeskIcon } from './WeatherIcons'
import './Header.css'
import './SavedPlaces.css'

const navItems = [
  { to: '/', label: 'Overview', icon: 'home', end: true },
  { to: '/forecast', label: 'Forecast', icon: 'forecast' },
  { to: '/map', label: 'Radar', icon: 'radar' },
  { to: '/alerts', label: 'Alerts', icon: 'alerts' },
  { to: '/analysis', label: 'Storm lab', icon: 'thunderstorm' },
  { to: '/assistant', label: 'AI Assistant', icon: 'help' },
  { to: '/observations', label: 'Observations', icon: 'observations' },
  { to: '/errors', label: 'Error History', icon: 'database' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
]

export default function Header() {
  const { location, setLocation, loading, error, setCoordinates, savedLocations, saveCurrentLocation, forgetSavedLocation, selectSavedLocation, isCurrentSaved } = useLocation()
  const { weather, refreshing, refresh, error: weatherError } = useWeather()
  const [query, setQuery] = useState(location || '')
  const [installPrompt, setInstallPrompt] = useState(null)
  const [showIOSHelp, setShowIOSHelp] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [installed, setInstalled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [savedOpen, setSavedOpen] = useState(false)

  useEffect(() => {
    const ua = window.navigator.userAgent || ''
    setIsIOS(/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))
    setInstalled(window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true)
    const onPrompt = event => { event.preventDefault(); setInstallPrompt(event) }
    const onInstalled = () => { setInstalled(true); setInstallPrompt(null); setShowIOSHelp(false) }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => { window.removeEventListener('beforeinstallprompt', onPrompt); window.removeEventListener('appinstalled', onInstalled) }
  }, [])
  useEffect(() => setQuery(location || ''), [location])

  const submit = async event => {
    event.preventDefault()
    if (query.trim()) {
      await setLocation(query.trim())
      setSearchOpen(false)
    }
  }
  const locate = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setCoordinates({ lat: coords.latitude, lon: coords.longitude }),
      () => {},
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    )
  }
  const install = async () => {
    if (installPrompt) {
      installPrompt.prompt()
      await installPrompt.userChoice
      setInstallPrompt(null)
    } else if (!installed) setShowIOSHelp(value => !value)
  }

  return <>
    <header className="app-header">
      <Link className="app-logo" to="/" aria-label="Weather Forecaster home">
        <span className="logo-mark"><LogoIcon size={36} className="wd-icon--brand" /></span>
        <span className="logo-copy"><strong>WEATHER<span>DESK</span></strong><small>NATIONAL FORECAST WORKSTATION</small></span>
      </Link>
      <nav aria-label="Main navigation" className="main-navigation">
        {navItems.map(item => <NavLink key={item.to} to={item.to} end={item.end}><WeatherDeskIcon name={item.icon} size={18} className={item.icon === 'alerts' ? 'wd-icon--alert' : ''} />{item.label}</NavLink>)}
      </nav>
      <div className="header-tools">
        <button className="icon-button search-toggle" type="button" onClick={() => setSearchOpen(value => !value)} aria-label="Search location" title="Search location"><WeatherDeskIcon name="search" size={18} /></button>
        <button className="icon-button saved-places-toggle" type="button" onClick={() => setSavedOpen(value => !value)} aria-expanded={savedOpen} aria-label="Saved places" title="Saved places"><WeatherDeskIcon name="bookmark" size={18} /></button>
        <button className="icon-button" type="button" onClick={locate} aria-label="Use my location" title="Use my location"><WeatherDeskIcon name="location" size={18} /></button>
        <button className="icon-button" type="button" onClick={refresh} disabled={refreshing} aria-label="Refresh weather data" title="Refresh weather data"><WeatherDeskIcon name={refreshing ? 'clock' : 'refresh'} size={18} /></button>
        {!installed && <button className="install-app-button" type="button" onClick={install}>{installPrompt ? 'Install app' : <><WeatherDeskIcon name="download" size={14} /> Install</>}</button>}
      </div>
    </header>
    <div className={`location-bar ${searchOpen ? 'location-bar-open' : ''}`}>
      <div className="location-current"><span className={`status-light ${weatherError ? 'status-light-error' : ''}`} aria-label={weatherError ? 'Weather feed issue' : 'Weather feed status indicator'}/><span>VIEWING</span><strong>{location || 'Selected location'}</strong><small>{weather?.point?.forecastOffice?.split('/').pop() ? `NWS OFFICE ${weather.point.forecastOffice.split('/').pop()}` : 'NWS DATA FEED'}</small></div>
      <form onSubmit={submit} className="location-search" role="search">
        <WeatherDeskIcon name="search" size={18} /><input aria-label="Search location" value={query} onChange={event => setQuery(event.target.value)} placeholder="City, state, ZIP, or lat, lon" autoComplete="postal-code"/><button disabled={loading || !query.trim()}>{loading ? 'Searching…' : 'Go'}</button>
      </form>
    </div>
    {error && <div className="location-error" role="status"><strong>Location lookup:</strong> {error}</div>}
    {savedOpen && <div className="saved-places-panel" role="dialog" aria-label="Saved places">
      <div className="saved-places-head"><strong>Saved places</strong><button type="button" className="saved-close" onClick={() => setSavedOpen(false)} aria-label="Close saved places"><WeatherDeskIcon name="close" size={16} /></button></div>
      {savedLocations.length === 0
        ? <p className="saved-empty">No saved places yet. Bookmark the location you are viewing to switch back to it in one click.</p>
        : <ul>{savedLocations.map(item => <li key={item.key}>
            <button type="button" className="saved-pick" onClick={() => { selectSavedLocation(item); setSavedOpen(false) }}>
              <WeatherDeskIcon name="location" size={14} />
              <span><strong>{item.name}</strong><small>{item.coordinates.lat.toFixed(3)}, {item.coordinates.lon.toFixed(3)}</small></span>
            </button>
            <button type="button" className="saved-remove" onClick={() => forgetSavedLocation(item.key)} aria-label={`Remove ${item.name}`} title={`Remove ${item.name}`}><WeatherDeskIcon name="close" size={13} /></button>
          </li>)}</ul>}
      <button type="button" className="saved-add" onClick={saveCurrentLocation} disabled={isCurrentSaved}>
        <WeatherDeskIcon name={isCurrentSaved ? 'check' : 'bookmark'} size={14} />
        {isCurrentSaved ? 'Current location is saved' : 'Save current location'}
      </button>
    </div>}
    {showIOSHelp && <div className="install-help" role="dialog" aria-label="Add Weather Forecaster to Home Screen"><button type="button" className="install-help-close" onClick={() => setShowIOSHelp(false)} aria-label="Close instructions"><WeatherDeskIcon name="close" size={18} /></button><strong>{isIOS ? 'Add Weather Forecaster to your iPhone/iPad' : 'Install Weather Forecaster'}</strong><p>{isIOS ? <>In Safari, tap <b>Share</b> and choose <b>Add to Home Screen</b>.</> : <>Open your browser menu and choose <b>Install app</b> or <b>Add to Home Screen</b>, if available.</>}</p><small>Installation requires HTTPS when hosted publicly.</small></div>}
  </>
}

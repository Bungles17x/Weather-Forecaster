import React from 'react'
import './AnalysisPage.css'
import Header from '../components/Header'
import { WeatherDeskIcon } from '../components/WeatherIcons'
import { useLocation } from '../contexts/LocationContext'
import { useWeather } from '../contexts/WeatherContext'
import { useSettings } from '../contexts/SettingsContext'
import { convertTemperature, convertWindSpeed, formatNumber, formatTemperature, getGridValue } from '../services/weatherData'

function currentGrid(grid, key) { return getGridValue(grid, key) }
function displayGrid(grid, key, unit = '', converter = value => value, digits = 0) {
  const data = currentGrid(grid, key)
  if (!data) return 'Not provided'
  const value = converter(data.value, data.unitCode)
  return value === null || !Number.isFinite(Number(value)) ? 'Not provided' : `${formatNumber(value, digits)}${unit}`
}
function displayTemperatureGrid(grid, key, units) {
  const data = currentGrid(grid, key)
  if (!data) return 'Not provided'
  const temperature = convertTemperature(data.value, data.unitCode)
  return temperature === null ? 'Not provided' : formatTemperature(temperature, units, 1)
}

export default function AnalysisPage() {
  const { location } = useLocation()
  const { settings } = useSettings()
  const { weather, loading, refreshing, error, refresh } = useWeather()
  const grid = weather?.grid
  const firstForecast = weather?.forecast?.periods?.[0]
  const thunder = currentGrid(grid, 'probabilityOfThunder')
  const cards = [
    { label: 'NWS Thunder Probability', value: thunder ? `${formatNumber(thunder.value)}%` : 'Not provided', note: 'Forecast-grid probability, not a storm diagnosis.', tag: 'FORECAST GRID' },
    { label: 'Forecast Wind', value: displayGrid(grid, 'windSpeed', ' mph', convertWindSpeed), note: 'NWS grid forecast wind at the valid time.', tag: 'GRID GUIDANCE' },
    { label: 'Forecast Gust', value: displayGrid(grid, 'windGust', ' mph', convertWindSpeed), note: 'Maximum forecast gust if the grid field is available.', tag: 'GRID GUIDANCE' },
    { label: 'Relative Humidity', value: displayGrid(grid, 'relativeHumidity', '%'), note: 'Forecast grid relative humidity.', tag: 'GRID GUIDANCE' },
    { label: 'Temperature', value: displayTemperatureGrid(grid, 'temperature', settings.units), note: 'Forecast-grid temperature; not a station observation.', tag: 'GRID GUIDANCE' },
    { label: 'Dew Point', value: displayTemperatureGrid(grid, 'dewpoint', settings.units), note: 'Forecast-grid dew point; useful moisture context.', tag: 'GRID GUIDANCE' }
  ]
  const unavailable = [
    { label: 'CAPE', note: 'The standard NWS point forecast grid does not expose a parcel CAPE field here.' },
    { label: 'CIN', note: 'CIN is not supplied in this point forecast response.' },
    { label: '0–6 km bulk shear', note: 'A vertical wind profile is required; this endpoint does not provide the needed layers.' },
    { label: 'Storm-relative helicity', note: 'Requires a suitable vertical wind profile and storm motion estimate.' }
  ]

  return <div className="data-page"><Header/><main className="data-main">
    <div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-dot"/> FORECAST TOOLS / ENVIRONMENT</div><h1>Storm environment</h1><p>{location} · NWS forecast-grid context, not automated storm detection.</p></div><div className="heading-actions"><div className={`data-chip ${error ? 'chip-warning' : ''}`}>{loading && !weather ? 'CONNECTING' : error ? 'DATA ISSUE' : 'NWS GRID DATA'}</div><button className="secondary-action" onClick={refresh} disabled={refreshing}>{refreshing ? 'Updating…' : <><WeatherDeskIcon name="refresh" size={15} /> Refresh</>}</button></div></div>
    {error && <div className="error-card" role="alert">{error}</div>}
    <section className="analysis-hero panel-card"><div className="analysis-hero-icon"><WeatherDeskIcon name="thunderstorm" size={25} /></div><div><span className="eyebrow">AVAILABLE NWS ENVIRONMENT FIELDS</span><h2>{firstForecast?.shortForecast || 'Atmospheric context'}</h2><p>Use official point/grid guidance to examine wind, moisture, temperature, and thunder probability when those fields are present.</p></div><div className="analysis-hero-status"><small>GRID</small><strong>{weather?.point?.gridId || '—'} {weather?.point?.gridX ?? ''},{weather?.point?.gridY ?? ''}</strong><small>{grid?.updateTime ? `Updated ${new Date(grid.updateTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : 'Update time unavailable'}</small></div></section>
    <div className="section-title-row standalone-title"><div><div className="eyebrow">OFFICIAL GRID FORECAST PARAMETERS</div><h2>What the NWS point forecast provides</h2><p>Values are taken from the nearest NWS forecast grid. If a field is absent, the app reports it as unavailable.</p></div><span className="source-pill">SOURCE: API.WEATHER.GOV</span></div>
    <section className="analysis-parameter-grid">{cards.map(card => <article className="analysis-parameter-card" key={card.label}><span className="parameter-label">{card.label}</span><strong>{card.value}</strong><p>{card.note}</p><small>{card.tag}</small></article>)}</section>
    <section className="brief-panel"><div className="section-title-row"><div><div className="eyebrow">NOT EXPOSED IN THIS FEED</div><h2>Advanced severe-weather indices</h2><p>These are intentionally not estimated from surface-only data.</p></div><span className="source-pill muted-source">NO FABRICATED VALUES</span></div><div className="unavailable-grid">{unavailable.map(item => <article key={item.label}><span className="unavailable-mark"><WeatherDeskIcon name="info" size={16} /></span><div><strong>{item.label}</strong><p>{item.note}</p></div><span className="unavailable-badge">NOT IN API</span></article>)}</div><p className="small-print">The standard api.weather.gov point forecast is designed for official forecast products and selected gridded fields, not as a complete atmospheric sounding. To keep this app NWS-only, it does not substitute another model provider for these missing parameters.</p></section>
    <section className="brief-panel"><div className="section-title-row"><div><div className="eyebrow">INTERPRETATION</div><h2>Read the atmosphere in context</h2></div></div><div className="interpretation-grid"><article><strong>Wind & gusts</strong><p>Forecast values describe the expected near-surface conditions. They are not a direct observation of the wind at a storm.</p></article><article><strong>Moisture</strong><p>Dew point and relative humidity provide context for low-level moisture but cannot describe atmospheric instability on their own.</p></article><article><strong>Thunder probability</strong><p>This forecast-grid probability is not an alert, severe-storm probability, or tornado probability.</p></article></div></section>
    <footer className="app-footer"><span>DATA: NATIONAL WEATHER SERVICE GRIDPOINT API</span><span>For official warnings visit <a href="https://www.weather.gov/alerts" target="_blank" rel="noreferrer"><WeatherDeskIcon name="arrowUpRight" size={13} /> weather.gov/alerts</a></span></footer>
  </main></div>
}

import React from 'react'
import './ObservationsPage.css'
import Header from '../components/Header'
import { WeatherDeskIcon } from '../components/WeatherIcons'
import { useLocation } from '../contexts/LocationContext'
import { useWeather } from '../contexts/WeatherContext'
import { useSettings } from '../contexts/SettingsContext'
import { convertDistanceMiles, convertPressure, convertTemperature, convertWindSpeed, formatNumber, formatTemperature, observationValue } from '../services/weatherData'

export default function ObservationsPage() {
  const { location } = useLocation()
  const { settings } = useSettings()
  const { weather, loading, refreshing, error, refresh } = useWeather()
  const obs = weather?.observation
  const temperature = observationValue(obs, 'temperature', convertTemperature)
  const dewpoint = observationValue(obs, 'dewpoint', convertTemperature)
  const wind = observationValue(obs, 'windSpeed', convertWindSpeed)
  const gust = observationValue(obs, 'windGust', convertWindSpeed)
  const humidity = observationValue(obs, 'relativeHumidity')
  const direction = observationValue(obs, 'windDirection')
  const pressure = observationValue(obs, 'seaLevelPressure', convertPressure) ?? observationValue(obs, 'barometricPressure', convertPressure)
  const visibility = observationValue(obs, 'visibility', convertDistanceMiles)
  const altimeter = observationValue(obs, 'altimeter', convertPressure)
  const metrics = [
    ['Air temperature', temperature === null ? '—' : formatTemperature(temperature, settings.units, 1), 'Station measurement', 'temperature'],
    ['Dew point', dewpoint === null ? '—' : formatTemperature(dewpoint, settings.units, 1), 'Station measurement', 'dewpoint'],
    ['Relative humidity', humidity === null ? '—' : `${Math.round(humidity)}%`, 'Station measurement', 'humidity'],
    ['Wind speed', wind === null ? '—' : `${formatNumber(wind, 1)} mph`, gust === null ? 'Gust not reported' : `Gust ${formatNumber(gust, 1)} mph`, 'wind'],
    ['Wind direction', direction === null ? '—' : `${Math.round(direction)}°`, direction === null ? 'Direction unavailable' : `${direction === 0 ? 'From north' : 'Meteorological bearing'}`, 'direction'],
    ['Sea-level pressure', pressure === null ? '—' : `${formatNumber(pressure, 1)} hPa`, 'Station-reported pressure', 'pressure'],
    ['Visibility', visibility === null ? '—' : `${formatNumber(visibility, 1)} mi`, 'Reported station visibility', 'visibility'],
    ['Altimeter', altimeter === null ? '—' : `${formatNumber(altimeter, 1)} hPa`, 'Reported altimeter setting', 'altimeter']
  ]
  return <div className="data-page"><Header/><main className="data-main">
    <div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-dot"/> REAL-TIME STATION DATA</div><h1>Observations</h1><p>Latest available station report nearest to {location}.</p></div><div className="heading-actions"><div className={`data-chip ${error ? 'chip-warning' : ''}`}>{loading && !weather ? 'CONNECTING' : obs ? 'STATION OBS' : 'NO OBSERVATION'}</div><button className="secondary-action" onClick={refresh} disabled={refreshing}>{refreshing ? 'Updating…' : <><WeatherDeskIcon name="refresh" size={15} /> Refresh</>}</button></div></div>
    {error && <div className="error-card" role="alert">{error}</div>}
    <section className="station-banner panel-card"><div className="station-emblem"><WeatherDeskIcon name="observations" size={26} /></div><div className="station-banner-main"><span className="eyebrow">NATIONAL WEATHER SERVICE · API.WEATHER.GOV</span><h2>{weather?.stationName || 'Nearby observing station'}</h2><p>{weather?.stationId ? `Station identifier ${weather.stationId}` : 'Station identifier unavailable'} · {obs?.timestamp ? `Observation time ${new Date(obs.timestamp).toLocaleString()}` : 'No observation timestamp returned'}</p></div><div className="station-temp"><strong>{temperature === null ? '—' : formatTemperature(temperature, settings.units)}</strong><small>{obs?.textDescription || 'Condition not reported'}</small></div></section>
    <section className="observation-detail-grid">{metrics.map(([label, value, description, icon]) => <article className="observation-detail-card" key={label}><span className={`observation-symbol obs-${icon}`}><WeatherDeskIcon name={icon === 'direction' ? 'windDirection' : icon === 'altimeter' ? 'pressure' : icon} size={21} /></span><div className="observation-detail-label">{label}</div><strong>{value}</strong><small>{description}</small></article>)}</section>
    <section className="brief-panel"><div className="section-title-row"><div><div className="eyebrow">STATION DATA NOTES</div><h2>How fresh is this report?</h2></div></div><div className="station-notes-grid"><article><span>STATION ID</span><strong>{weather?.stationId || 'Not available'}</strong></article><article><span>OBSERVATION TIME</span><strong>{obs?.timestamp ? new Date(obs.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' }) : 'Not available'}</strong></article><article><span>APP RETRIEVAL</span><strong>{weather?.updatedAt ? new Date(weather.updatedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'Not available'}</strong></article></div><p className="small-print">Station reports may be delayed or have missing fields. The nearest station may be several miles away and conditions can differ from the selected point. The NWS notes that many stations in its API are operated by partners rather than directly by the NWS; check station metadata when that distinction matters.</p><a className="primary-link" href={weather?.stationId ? `https://api.weather.gov/stations/${weather.stationId}/observations/latest` : 'https://www.weather.gov/'} target="_blank" rel="noreferrer"><WeatherDeskIcon name="arrowUpRight" size={13} /> Open original station observation</a></section>
    <footer className="app-footer"><span>OBSERVATION SOURCE <i>•</i> NATIONAL WEATHER SERVICE API</span><span><a href="https://www.weather.gov/documentation/services-web-api" target="_blank" rel="noreferrer"><WeatherDeskIcon name="arrowUpRight" size={12} /> API documentation</a></span></footer>
  </main></div>
}

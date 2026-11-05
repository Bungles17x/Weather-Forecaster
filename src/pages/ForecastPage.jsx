import React from 'react'
import './ForecastPage.css'
import Header from '../components/Header'
import { SmallWeatherIcon, WeatherDeskIcon } from '../components/WeatherIcons'
import { useLocation } from '../contexts/LocationContext'
import { useWeather } from '../contexts/WeatherContext'
import { useSettings } from '../contexts/SettingsContext'
import { convertTemperature, convertWindSpeed, formatTemperature, observationValue, temperatureToFahrenheit } from '../services/weatherData'

const precipitation = period => period?.probabilityOfPrecipitation?.value
const temp = (period, units) => {
  if (period?.temperature === null || period?.temperature === undefined) return '—'
  return formatTemperature(temperatureToFahrenheit(period.temperature, period.temperatureUnit || 'F'), units)
}

export default function ForecastPage() {
  const { location } = useLocation()
  const { settings } = useSettings()
  const { weather, loading, refreshing, error, refresh } = useWeather()
  const observation = weather?.observation
  const periods = weather?.forecast?.periods || []
  const hours = weather?.hourly?.periods || []
  const dayPeriods = periods.filter(period => period.isDaytime).slice(0, 7)
  const temperature = observationValue(observation, 'temperature', convertTemperature)
  const wind = observationValue(observation, 'windSpeed', convertWindSpeed)
  const feels = observationValue(observation, 'windChill', convertTemperature)
  const humidity = observationValue(observation, 'relativeHumidity')

  return <div className="data-page"><Header/><main className="data-main">
    <div className="page-heading"><div><div className="eyebrow">PRODUCT / LOCAL FORECAST</div><h1>Forecast outlook</h1><p>{location} · official forecast periods issued by the responsible NWS forecast office.</p></div><div className="heading-actions"><div className={`data-chip ${error ? 'chip-warning' : ''}`}>{loading && !weather ? 'LOADING NWS' : error ? 'DATA ISSUE' : refreshing ? 'REFRESHING' : 'WEATHER.GOV'}</div><button className="secondary-action" onClick={refresh} disabled={refreshing}>{refreshing ? 'Updating…' : <><WeatherDeskIcon name="refresh" size={15} /> Refresh</>}</button></div></div>
    {error && <div className="error-card" role="alert">{error}</div>}
    <section className="forecast-hero panel-card"><div className="forecast-hero-copy"><span className="eyebrow">LATEST NEARBY STATION REPORT</span><h2>{observation?.textDescription || periods[0]?.shortForecast || (loading ? 'Retrieving current conditions…' : 'Conditions unavailable')}</h2><p>{weather?.stationName || weather?.stationId ? `Observation from ${weather.stationName || weather.stationId} (${weather.stationId})` : 'A current station report has not been returned.'}</p><div className="forecast-hero-tags"><span>{wind === null ? 'Wind —' : `Wind ${Math.round(wind)} mph`}</span><span>{humidity === null ? 'RH —' : `RH ${Math.round(humidity)}%`}</span><span>{observation?.timestamp ? `Observed ${new Date(observation.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : 'Time unavailable'}</span></div></div><div className="forecast-hero-temp"><strong>{temperature === null ? '—' : formatTemperature(temperature, settings.units)}</strong><span>Station temperature</span>{feels !== null && <small>Wind chill field: {formatTemperature(feels, settings.units)}</small>}</div></section>

    <section className="dashboard-section"><div className="section-title-row"><div><div className="eyebrow">HOURLY · NEXT 24 PERIODS</div><h2>Hour by hour</h2><p>Temperature, forecast wording, and precipitation chance from NWS hourly forecast periods.</p></div><span className="source-pill">NWS HOURLY FORECAST</span></div><div className="hourly-grid">{hours.slice(0, 24).map((period, i) => <article className="hourly-card" key={`${period.startTime}-${i}`}><small>{new Date(period.startTime).toLocaleTimeString([], { hour: 'numeric' })}</small><SmallWeatherIcon condition={period.shortForecast} size={37} /><strong>{temp(period, settings.units)}</strong><span>{period.shortForecast}</span><div className="hourly-rain"><i style={{ height: `${Math.max(3, Math.min(100, precipitation(period) ?? 0))}%` }}/></div><small>{precipitation(period) === null || precipitation(period) === undefined ? 'PoP —' : `${precipitation(period)}% precip.`}</small><small>Wind {period.windSpeed || '—'} {period.windDirection || ''}</small></article>)}</div>{!hours.length && <div className="empty-card">{loading ? 'Loading official hourly periods…' : 'Hourly periods are unavailable for this location right now.'}</div>}</section>

    <section className="dashboard-section"><div className="section-title-row"><div><div className="eyebrow">DAYTIME PERIODS · UP TO 7 DAYS</div><h2>Extended forecast</h2><p>Daytime periods published by your local National Weather Service forecast office.</p></div></div><div className="extended-list">{dayPeriods.map((period, i) => <article className="extended-row" key={period.number || period.startTime}><div className="extended-day"><strong>{i === 0 ? 'Today / next day' : period.name}</strong><small>{new Date(period.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}</small></div><SmallWeatherIcon condition={period.shortForecast} size={37} /><div className="extended-forecast"><strong>{period.shortForecast}</strong><small>{period.detailedForecast}</small></div><div className="extended-temp"><strong>{temp(period, settings.units)}</strong><small>High</small></div><div className="extended-wind"><strong>{period.windSpeed || '—'}</strong><small>{period.windDirection || 'Wind'}</small></div><div className="extended-pop"><strong>{precipitation(period) == null ? '—' : `${precipitation(period)}%`}</strong><small>Precip.</small></div></article>)}</div>{!dayPeriods.length && <div className="empty-card">{loading ? 'Loading extended forecast…' : 'Extended forecast periods are unavailable.'}</div>}</section>

    <section className="info-panel"><div className="info-panel-icon"><WeatherDeskIcon name="info" size={19} /></div><div><strong>About this forecast</strong><p>These are the forecast periods produced by the responsible National Weather Service office for the selected point. Station observations and forecast grids can differ because they describe different locations, times, and products. Check the issue times and official product for context.</p><a href={weather?.point?.forecast || 'https://www.weather.gov/'} target="_blank" rel="noreferrer"><WeatherDeskIcon name="arrowUpRight" size={13} /> Open official NWS forecast data</a></div></section>
    <footer className="app-footer"><span>FORECAST SOURCE <i>•</i> WEATHER.GOV / API.WEATHER.GOV</span><span>Updated {weather?.updatedAt ? new Date(weather.updatedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'not yet'}</span></footer>
  </main></div>
}

import React from 'react'
import './HomePage.css'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import { useLocation } from '../contexts/LocationContext'
import { useWeather } from '../contexts/WeatherContext'
import { useSettings } from '../contexts/SettingsContext'
import { SmallWeatherIcon, WeatherDeskIcon } from '../components/WeatherIcons'
import DailyBriefing from '../components/DailyBriefing'
import WeatherMetrics from '../components/WeatherMetrics'
import RadarPreview from '../components/RadarPreview'
import ForecastCharts from '../components/ForecastCharts'
import { convertPressure, convertTemperature, convertWindSpeed, formatTemperature, observationValue, temperatureToFahrenheit } from '../services/weatherData'

function tempText(obs, units) {
  const value = observationValue(obs, 'temperature', convertTemperature)
  return value === null ? '—' : formatTemperature(value, units)
}
function severityColor(severity) {
  return ({ Extreme: '#ff5c68', Severe: '#ff8b52', Moderate: '#ffd166', Minor: '#67b7ff' })[severity] || '#91a4ba'
}

export default function HomePage() {
  const { location } = useLocation()
  const { settings } = useSettings()
  const { weather, loading, refreshing, error, refresh } = useWeather()
  const obs = weather?.observation
  const forecastPeriods = weather?.forecast?.periods || []
  const hourly = weather?.hourly?.periods || []
  const alerts = weather?.alerts || []
  const topAlert = alerts.slice().sort((a, b) => ({ Extreme: 0, Severe: 1, Moderate: 2, Minor: 3 }[a.properties?.severity] ?? 4) - ({ Extreme: 0, Severe: 1, Moderate: 2, Minor: 3 }[b.properties?.severity] ?? 4))[0]
  const wind = observationValue(obs, 'windSpeed', convertWindSpeed)
  const gust = observationValue(obs, 'windGust', convertWindSpeed)
  const humidity = observationValue(obs, 'relativeHumidity')
  const dewPoint = observationValue(obs, 'dewpoint', convertTemperature)
  const pressure = observationValue(obs, 'seaLevelPressure', convertPressure) ?? observationValue(obs, 'barometricPressure', convertPressure)

  return <div className="data-page home-page"><Header/><main className="data-main home-main">
    <div className="page-heading dashboard-heading"><div><div className="eyebrow"><span className="eyebrow-dot"/> NATIONAL WEATHER SERVICE DATA</div><h1>Weather, with context.</h1><p>Local conditions, official forecasts, radar, and active hazards—together in one desk.</p></div><div className="heading-actions"><div className={`data-chip ${error ? 'chip-warning' : ''}`}><span className={`status-light ${error ? 'status-light-error' : ''}`}/>{loading && !weather ? 'CONNECTING TO NWS' : error ? 'FEED ISSUE' : refreshing ? 'REFRESHING' : 'NWS FEED'}</div><button className="secondary-action" onClick={refresh} disabled={refreshing}>{refreshing ? 'Refreshing…' : <><WeatherDeskIcon name="refresh" size={15} /> Update now</>}</button></div></div>
    {error && <div className="error-card" role="alert"><strong>Weather data issue.</strong> {error} Check each product time and retry before relying on unavailable or potentially stale data.</div>}
    {topAlert ? <Link to="/alerts" className="alert-ribbon" style={{ '--alert-color': severityColor(topAlert.properties?.severity) }}><span className="alert-ribbon-icon"><WeatherDeskIcon name="alerts" size={22} /></span><span className="alert-ribbon-copy"><small>ACTIVE NWS ALERT · {topAlert.properties?.severity || 'SEVERITY UNKNOWN'}</small><strong>{topAlert.properties?.event || 'Weather alert'}</strong><span>{topAlert.properties?.headline || topAlert.properties?.areaDesc || 'Open the alert center for official details.'}</span></span><span className="ribbon-action">Review alert <WeatherDeskIcon name="arrowUpRight" size={14} /></span></Link> : <div className="calm-ribbon"><span className="calm-icon"><WeatherDeskIcon name="check" size={18} /></span><span><strong>{weather && !weather.errors?.alerts ? 'No active point-based NWS alerts returned' : 'Alert status not yet confirmed'}</strong><small>Always check the official NWS alert page during threatening weather.</small></span><a href="https://www.weather.gov/alerts" target="_blank" rel="noreferrer"><WeatherDeskIcon name="arrowUpRight" size={14} /> Official alerts</a></div>}

    <section className="hero-weather-grid">
      <article className="hero-weather-card">
        <div className="hero-weather-top"><div><span className="eyebrow">LATEST STATION OBSERVATION</span><h2>{location || 'Selected location'}</h2><p>{weather?.stationName || weather?.stationId ? `${weather.stationName || weather.stationId} · ${weather.stationId || ''}` : 'Waiting for nearby station data'}</p></div><span className="weather-symbol" aria-hidden="true"><SmallWeatherIcon condition={forecastPeriods[0]?.shortForecast || obs?.textDescription} size={74} /></span></div>
        <div className="hero-temperature-row"><strong>{tempText(obs, settings.units)}</strong><div><span>{obs?.textDescription || forecastPeriods[0]?.shortForecast || (loading ? 'Loading conditions…' : 'Conditions unavailable')}</span><small>Feels-like and model values are shown on the Forecast page.</small></div></div>
        <div className="hero-weather-meta"><span><b>OBSERVED</b>{obs?.timestamp ? new Date(obs.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'No timestamp'}</span><span><b>DATA SOURCE</b>Weather.gov / NWS</span><span><b>POINT</b>{weather?.point?.gridId ? `${weather.point.gridId} ${weather.point.gridX},${weather.point.gridY}` : 'NWS point'}</span></div>
      </article>
      <article className="radar-teaser-card"><RadarPreview/><div className="radar-teaser-bottom"><div><span className="eyebrow">NWS RADAR SERVICES</span><strong>Live reflectivity</strong><small>Official NEXRAD mosaic centered on your location · auto-refreshes every 5 minutes.</small></div><Link to="/map" className="round-arrow" aria-label="Open full radar map"><WeatherDeskIcon name="arrowUpRight" size={18} /></Link></div></article>
    </section>

    <section className="metric-grid dashboard-metrics" aria-label="Latest observations">
      {[['Wind', wind === null ? '—' : `${Math.round(wind)} mph`, gust === null ? 'Gust not reported' : `Gust ${Math.round(gust)} mph`, 'wind'], ['Humidity', humidity === null ? '—' : `${Math.round(humidity)}%`, 'Relative humidity', 'humidity'], ['Dew point', dewPoint === null ? '—' : formatTemperature(dewPoint, settings.units), 'Moisture indicator', 'dewpoint'], ['Sea-level pressure', pressure === null ? '—' : `${pressure.toFixed(1)} hPa`, 'Station-reported · hPa', 'pressure']].map(([title, value, sub, symbol]) => <article className="metric-card" key={title}><span className="metric-symbol"><WeatherDeskIcon name={symbol} size={21} /></span><span className="metric-label">{title}</span><strong>{value}</strong><small>{sub}</small></article>)}
    </section>

    <WeatherMetrics observation={obs} settings={settings} grid={weather?.grid} />

    <section className="dashboard-section"><div className="section-title-row"><div><div className="eyebrow">THE NEXT 24 HOURS</div><h2>Hourly forecast</h2><p>Official NWS forecast periods, refreshed from the selected point.</p></div><Link to="/forecast" className="text-link">Full forecast <WeatherDeskIcon name="chevronRight" size={14} /></Link></div>
      <div className="hourly-rail">{hourly.slice(0, 12).map((period, index) => <article className={`hour-chip ${index === 0 ? 'hour-chip-current' : ''}`} key={`${period.startTime}-${period.name}`}><small>{index === 0 ? 'NEXT' : new Date(period.startTime).toLocaleTimeString([], { hour: 'numeric' })}</small><SmallWeatherIcon condition={period.shortForecast} size={31} /><strong>{period.temperature === null ? '—' : formatTemperature(temperatureToFahrenheit(period.temperature, period.temperatureUnit || 'F'), settings.units)}</strong><span>{period.probabilityOfPrecipitation?.value == null ? 'PoP —' : `PoP ${period.probabilityOfPrecipitation.value}%`}</span></article>)}</div>
      {!hourly.length && <div className="empty-card compact-empty">{loading ? 'Loading hourly forecast from weather.gov…' : 'Hourly forecast data is not available right now.'}</div>}
    </section>

    <ForecastCharts weather={weather} units={settings.units} />

    <DailyBriefing weather={weather} units={settings.units}/>

    <section className="dashboard-section"><div className="section-title-row"><div><div className="eyebrow">WORKSTATION MODULES</div><h2>Your weather desk</h2><p>Focused pages for the products you need.</p></div></div><div className="module-grid">
      <Link to="/map" className="module-card"><span className="module-icon"><WeatherDeskIcon name="radar" size={24} /></span><span className="module-copy"><strong>Radar & warnings</strong><small>NWS radar layers, local alert polygons, map controls</small></span><span className="module-arrow"><WeatherDeskIcon name="arrowUpRight" size={17} /></span></Link>
      <Link to="/alerts" className="module-card"><span className="module-icon module-alert"><WeatherDeskIcon name="alerts" size={24} /></span><span className="module-copy"><strong>Alert center</strong><small>{alerts.length ? `${alerts.length} active point-based alerts` : 'Official watches, warnings, and advisories'}</small></span><span className="module-arrow"><WeatherDeskIcon name="arrowUpRight" size={17} /></span></Link>
      <Link to="/analysis" className="module-card"><span className="module-icon module-analysis"><WeatherDeskIcon name="thunderstorm" size={24} /></span><span className="module-copy"><strong>Storm environment</strong><small>Available NWS grid guidance, with unsupported fields labeled</small></span><span className="module-arrow"><WeatherDeskIcon name="arrowUpRight" size={17} /></span></Link>
      <Link to="/observations" className="module-card"><span className="module-icon module-observations"><WeatherDeskIcon name="observations" size={24} /></span><span className="module-copy"><strong>Station observations</strong><small>Latest available measurement from a nearby station</small></span><span className="module-arrow"><WeatherDeskIcon name="arrowUpRight" size={17} /></span></Link>
      <Link to="/assistant" className="module-card"><span className="module-icon module-assistant"><WeatherDeskIcon name="help" size={24} /></span><span className="module-copy"><strong>Weather Forecaster AI</strong><small>Ask about forecast timing, alerts, weather planning, or learn meteorology</small></span><span className="module-arrow"><WeatherDeskIcon name="arrowUpRight" size={17} /></span></Link>
    </div></section>

    <footer className="app-footer"><span>WEATHER FORECASTER <i>•</i> INDEPENDENT EDUCATIONAL WORKSTATION</span><span>Weather data: <a href="https://www.weather.gov/documentation/services-web-api" target="_blank" rel="noreferrer"><WeatherDeskIcon name="arrowUpRight" size={12} /> National Weather Service API</a></span><p>Not an official NWS product. For life-safety decisions, use official alerts and instructions at weather.gov and from local authorities.</p></footer>
  </main></div>
}

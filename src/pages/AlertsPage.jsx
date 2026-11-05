import React, { useMemo, useState } from 'react'
import './AlertsPage.css'
import Header from '../components/Header'
import { WeatherDeskIcon } from '../components/WeatherIcons'
import { useLocation } from '../contexts/LocationContext'
import { useWeather } from '../contexts/WeatherContext'

const severityOrder = { Extreme: 0, Severe: 1, Moderate: 2, Minor: 3, Unknown: 4 }
const EMPTY_ALERTS = []
const severityColor = { Extreme: '#ff5364', Severe: '#ff8d52', Moderate: '#f2c45e', Minor: '#68b8ff', Unknown: '#91a4ba' }

function dateTime(value) {
  if (!value) return 'Not specified'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Not specified' : date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
}

export default function AlertsPage() {
  const { location } = useLocation()
  const { weather, loading, refreshing, error, refresh, autoRefresh, refreshInterval } = useWeather()
  const [filter, setFilter] = useState('All')
  const [query, setQuery] = useState('')
  const alerts = weather?.alerts ?? EMPTY_ALERTS
  const shown = useMemo(() => alerts.filter(alert => {
    const p = alert.properties || {}
    const severity = p.severity || 'Unknown'
    const text = `${p.event || ''} ${p.areaDesc || ''} ${p.headline || ''} ${p.description || ''}`.toLowerCase()
    return (filter === 'All' || severity === filter) && text.includes(query.trim().toLowerCase())
  }).sort((a, b) => {
    const pA = a.properties || {}, pB = b.properties || {}
    return (severityOrder[pA.severity] ?? 4) - (severityOrder[pB.severity] ?? 4) || Date.parse(pA.expires || '') - Date.parse(pB.expires || '')
  }), [alerts, filter, query])

  return <div className="data-page"><Header/><main className="data-main">
    <div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-dot"/> NATIONAL WEATHER SERVICE / HAZARDS</div><h1>Alert center</h1><p>Active official alerts intersecting the selected forecast point near {location}.</p></div><div className="heading-actions"><div className={`data-chip ${error ? 'chip-warning' : ''}`}>{loading && !weather ? 'CONNECTING' : error ? 'FEED ISSUE' : `${alerts.length} ACTIVE`}</div><button className="secondary-action" onClick={refresh} disabled={refreshing}>{refreshing ? 'Updating…' : <><WeatherDeskIcon name="refresh" size={15} /> Refresh alerts</>}</button></div></div>
    <div className="alert-safety-banner"><span className="alert-safety-icon"><WeatherDeskIcon name="warning" size={22} /></span><div><strong>Use official instructions for safety decisions</strong><p>This viewer displays NWS API alerts but may not receive every alert immediately. For urgent weather threats, verify the product at weather.gov and follow local emergency officials.</p></div><a href="https://www.weather.gov/alerts" target="_blank" rel="noreferrer"><WeatherDeskIcon name="arrowUpRight" size={13} /> NWS alerts</a></div>
    {error && <div className="error-card" role="alert"><strong>Data retrieval issue.</strong> {error}</div>}
    <div className="alert-toolbar"><label className="search-field"><WeatherDeskIcon name="search" size={18} /><input aria-label="Search alerts" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search alerts, areas, headlines…"/></label><label className="filter-field"><span>Severity</span><select value={filter} onChange={event => setFilter(event.target.value)} aria-label="Filter by severity">{['All','Extreme','Severe','Moderate','Minor','Unknown'].map(value => <option key={value}>{value}</option>)}</select></label><div className="alert-total"><strong>{shown.length}</strong><span>matching alerts</span></div></div>
    <div className="feed-line"><span className={error ? 'feed-dot feed-dot-error' : 'feed-dot'}/>{weather?.errors?.alerts ? `NWS alert endpoint: ${weather.errors.alerts}` : weather?.updatedAt ? `NWS API request completed ${dateTime(weather.updatedAt)} · ${autoRefresh ? `Auto-refresh every ${refreshInterval} minutes while app is open` : 'Manual refresh only'}` : 'Waiting for a successful NWS alert response'}</div>
    <section className="alert-card-list" aria-live="polite">
      {shown.map((alert, index) => {
        const p = alert.properties || {}
        const color = severityColor[p.severity] || severityColor.Unknown
        return <details className="official-alert-card" key={alert.id || `${p.event}-${index}`} style={{ '--alert-color': color }}>
          <summary><span className="official-alert-stripe"/><span className="official-alert-main"><span className="alert-kickers"><b>{p.severity || 'Severity unknown'}</b><i>·</i><span>{p.urgency || 'Urgency unspecified'}</span>{p.certainty && <><i>·</i><span>{p.certainty}</span></>}</span><strong>{p.event || 'NWS weather alert'}</strong><span>{p.headline || p.areaDesc || 'Open for official details'}</span></span><span className="official-alert-timing"><small>EXPIRES</small><b>{p.expires ? new Date(p.expires).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Not specified'}</b></span><span className="expand-chevron"><WeatherDeskIcon name="chevronDown" size={16} /></span></summary>
          <div className="official-alert-body"><div className="alert-detail-grid"><div><small>ISSUED</small><strong>{dateTime(p.sent || p.effective)}</strong></div><div><small>BEGINS</small><strong>{dateTime(p.onset || p.effective)}</strong></div><div><small>ENDS</small><strong>{dateTime(p.ends || p.expires)}</strong></div><div><small>AFFECTED AREAS</small><strong>{p.areaDesc || 'Area not specified'}</strong></div></div>{p.description && <div className="alert-text-block"><small>OFFICIAL DESCRIPTION</small><p>{p.description}</p></div>}{p.instruction && <div className="alert-text-block alert-instructions"><small>OFFICIAL INSTRUCTIONS</small><p>{p.instruction}</p></div>}<a className="primary-link" href={alert.id || p['@id'] || 'https://www.weather.gov/alerts'} target="_blank" rel="noreferrer"><WeatherDeskIcon name="arrowUpRight" size={13} /> Open original NWS alert</a></div>
        </details>
      })}
    </section>
    {!shown.length && <div className="empty-state"><div className="empty-state-icon"><WeatherDeskIcon name="alerts" size={28} /></div><h2>{loading ? 'Checking active alerts…' : alerts.length ? 'No alerts match those filters' : 'No active point alerts returned'}</h2><p>{alerts.length ? 'Adjust the search or severity filter to see other alert products.' : 'This does not guarantee that no hazard exists. Check the official National Weather Service alert page for the location.'}</p><a href="https://www.weather.gov/alerts" target="_blank" rel="noreferrer"><WeatherDeskIcon name="arrowUpRight" size={13} /> Open weather.gov alerts</a></div>}
    <footer className="app-footer"><span>OFFICIAL PRODUCT ORIGIN <i>•</i> NWS / NOAA</span><span><a href="https://www.weather.gov/documentation/services-web-api" target="_blank" rel="noreferrer"><WeatherDeskIcon name="arrowUpRight" size={12} /> API documentation</a></span></footer>
  </main></div>
}

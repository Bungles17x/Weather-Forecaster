// Presentation helpers shared by the alert list, the map layer and the details
// dialog, so a severity always looks the same everywhere.
import { getWeatherIconName } from '../components/WeatherIcons'

const SEVERITY_COLORS = {
  Extreme: '#ff5364',
  Severe: '#ff8d52',
  Moderate: '#f2c45e',
  Minor: '#68b8ff'
}

export function severityColor(severity) {
  return SEVERITY_COLORS[severity] || '#91a4ba'
}

export function alertOfficialUrl(feature) {
  const id = feature?.properties?.['@id'] || feature?.id
  return typeof id === 'string' && id.startsWith('http') ? id : 'https://www.weather.gov/alerts'
}

export function formatAlertTime(value) {
  const parsed = Date.parse(value || '')
  if (!Number.isFinite(parsed)) return 'Not provided'
  return new Date(parsed).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

// Compact expiry for the list row: today keeps just the clock.
export function formatAlertShort(value) {
  const parsed = Date.parse(value || '')
  if (!Number.isFinite(parsed)) return ''
  const date = new Date(parsed)
  const clock = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  return date.toDateString() === new Date().toDateString()
    ? `until ${clock}`
    : `until ${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${clock}`
}

// A glyph for the hazard itself, so a list of warnings reads at a glance.
export function alertIcon(event = '') {
  const text = String(event).toLowerCase()
  if (/heat/.test(text)) return 'sun'
  if (/freeze|frost|cold|winter|snow|blizzard|ice/.test(text)) return 'snow'
  if (/fire|smoke|air quality|dust|haze/.test(text)) return 'haze'
  if (/flood|hydrolog|rain|surf/.test(text)) return 'rain'
  if (/marine|small craft|gale|rip current|wind/.test(text)) return 'wind'
  return getWeatherIconName(text)
}

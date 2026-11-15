const NWS_API = 'https://api.weather.gov'
const GEO_API = 'https://nominatim.openstreetmap.org/search'
const ACCEPT = 'application/geo+json, application/ld+json;q=0.9, application/json;q=0.8'

// UV index estimation based on latitude, month, and solar elevation
export function estimateUVIndex(lat, lon, date = new Date()) {
  const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24))
  const declination = 23.45 * Math.sin((360 / 365) * (dayOfYear - 81) * (Math.PI / 180))
  const hourAngle = 15 * (date.getHours() + date.getMinutes() / 60 - 12)
  const latRad = lat * (Math.PI / 180)
  const decRad = declination * (Math.PI / 180)
  const hourRad = hourAngle * (Math.PI / 180)
  const solarElevation = Math.asin(Math.sin(latRad) * Math.sin(decRad) + Math.cos(latRad) * Math.cos(decRad) * Math.cos(hourRad)) * (180 / Math.PI)
  if (solarElevation < 0) return 0
  const maxUV = 11 * Math.cos((lat - declination) * (Math.PI / 180))
  const uv = maxUV * Math.pow(Math.sin(solarElevation * (Math.PI / 180)), 1.2)
  return Math.max(0, Math.min(11, uv))
}

// Sun position calculations (NOAA/ESRL sunrise equation).
// Julian Day 2440587.5 is 1970-01-01T00:00:00Z, so that — not J2000 — is the
// anchor for converting a Julian date back into a JavaScript Date. Using J2000
// shifted every result by 10957.5 days and reported sunrise near sunset.
const JULIAN_UNIX_EPOCH = 2440587.5
const MS_PER_DAY = 86400000

const julianToDate = julian => new Date((julian - JULIAN_UNIX_EPOCH) * MS_PER_DAY)
const toRadians = degrees => degrees * (Math.PI / 180)
const normalizeDegrees = degrees => ((degrees % 360) + 360) % 360

export function calculateSunPosition(lat, lon, date = new Date()) {
  if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lon))) {
    return { sunrise: null, sunset: null, solarNoon: null, dayLength: null, polar: false }
  }
  const latitude = Number(lat)
  const longitude = Number(lon)
  const J2000 = 2451545.0
  const jd = JULIAN_UNIX_EPOCH + (date.getTime() / MS_PER_DAY)
  // The mean solar noon must be anchored to the start of the Julian day; keeping
  // the time-of-day fraction here shifted every sunrise/sunset by the current hour.
  const n = Math.ceil(jd - J2000 + 0.0008)
  const Jstar = n - longitude / 360
  const M = normalizeDegrees(357.5291 + 0.98560028 * Jstar)
  const C = 1.9148 * Math.sin(toRadians(M)) + 0.0200 * Math.sin(toRadians(2 * M)) + 0.0003 * Math.sin(toRadians(3 * M))
  const lambda = normalizeDegrees(M + C + 180 + 102.9372)
  const Jtransit = J2000 + Jstar + 0.0053 * Math.sin(toRadians(M)) - 0.0069 * Math.sin(toRadians(2 * lambda))
  const declination = Math.asin(Math.sin(toRadians(lambda)) * Math.sin(toRadians(23.4397)))
  const solarNoon = julianToDate(Jtransit)

  const cosHourAngle = (Math.sin(toRadians(-0.833)) - Math.sin(toRadians(latitude)) * Math.sin(declination)) /
    (Math.cos(toRadians(latitude)) * Math.cos(declination))

  // Beyond the polar circles the sun can stay above or below the horizon all day;
  // there is no sunrise or sunset to report and acos() would return NaN.
  if (!Number.isFinite(cosHourAngle) || cosHourAngle < -1 || cosHourAngle > 1) {
    return {
      sunrise: null,
      sunset: null,
      solarNoon,
      dayLength: cosHourAngle < -1 ? 24 : 0,
      polar: true
    }
  }

  const hourAngle = Math.acos(cosHourAngle) * (180 / Math.PI)
  const sunrise = julianToDate(Jtransit - hourAngle / 360)
  const sunset = julianToDate(Jtransit + hourAngle / 360)
  return {
    sunrise,
    sunset,
    solarNoon,
    dayLength: (sunset.getTime() - sunrise.getTime()) / 3600000,
    polar: false
  }
}

// Moon phase calculation
export function calculateMoonPhase(date = new Date()) {
  const synodic = 29.53058867
  const knownNew = new Date('2000-01-06T18:14:00Z')
  const daysSince = (date - knownNew) / (1000 * 60 * 60 * 24)
  const phase = (daysSince % synodic) / synodic
  const age = phase * synodic
  const illumination = 0.5 * (1 - Math.cos(2 * Math.PI * phase))
  const phaseNames = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent']
  const phaseIndex = Math.floor(phase * 8)
  return { phase: phaseNames[phaseIndex], age: Math.round(age), illumination: Math.round(illumination * 100) }
}

// Air quality placeholder (actual data requires separate API integration)
export function getAirQualityPlaceholder(_lat, _lon) {
  return { aqi: null, category: 'Air quality data requires EPA AirNow API integration', primaryPollutant: null }
}

async function fetchJson(url, signal) {
  const controller = new AbortController()
  let timedOut = false
  const abortFromParent = () => controller.abort()
  if (signal?.aborted) controller.abort()
  else signal?.addEventListener('abort', abortFromParent, { once: true })
  const timeout = window.setTimeout(() => {
    timedOut = true
    controller.abort()
  }, 18000)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: ACCEPT },
      cache: 'no-cache'
    })
    if (!response.ok) {
      const source = url.startsWith(NWS_API) ? 'The National Weather Service API' : 'The location lookup service'
      const error = new Error(`${source} returned HTTP ${response.status}`)
      error.status = response.status
      throw error
    }
    return await response.json()
  } catch (error) {
    if (signal?.aborted) throw error
    if (timedOut) throw new Error('The request took too long. Check your connection and try again.')
    throw error
  } finally {
    window.clearTimeout(timeout)
    signal?.removeEventListener('abort', abortFromParent)
  }
}

export async function resolveLocation(query, signal) {
  const value = String(query || '').trim()
  if (!value) throw new Error('Enter a city, state, ZIP code, or coordinates.')
  const coordinateMatch = value.match(/^\s*(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$/)
  if (coordinateMatch) {
    const lat = Number(coordinateMatch[1])
    const lon = Number(coordinateMatch[2])
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) throw new Error('Those coordinates are outside the valid range.')
    const point = await fetchJson(`${NWS_API}/points/${lat.toFixed(4)},${lon.toFixed(4)}`, signal)
    const relative = point.properties?.relativeLocation?.properties
    return { lat, lon, name: relative ? `${relative.city}, ${relative.state}` : `${lat.toFixed(3)}, ${lon.toFixed(3)}` }
  }

  // Weather.gov's API resolves weather data from coordinates but does not offer a
  // city-name geocoder. Nominatim is used only to translate a user-entered place
  // into coordinates; forecasts, observations, alerts, and radar remain NWS data.
  const url = `${GEO_API}?format=jsonv2&limit=5&countrycodes=us&addressdetails=1&q=${encodeURIComponent(value)}`
  let results
  try {
    results = await fetchJson(url, signal)
  } catch (error) {
    throw new Error('Location lookup is unavailable. Try coordinates such as 38.9072, -77.0369, or check your connection.')
  }
  const result = (Array.isArray(results) ? results : []).find(item => item.lat && item.lon)
  if (!result) throw new Error('Location not found. Try a U.S. city and state, ZIP code, or latitude, longitude.')
  const address = result.address || {}
  const city = address.city || address.town || address.village || address.hamlet || address.county || result.name
  const state = address.state || ''
  return { lat: Number(result.lat), lon: Number(result.lon), name: state ? `${city}, ${state}` : result.display_name?.split(',').slice(0, 2).join(',') || city }
}

// CAP messages that represent a currently actionable alert. Cancel/Ack/Error
// messages are excluded so stale or administrative traffic never draws polygons.
const ALERT_MESSAGE_TYPES = new Set(['Alert', 'Update'])
const ZONE_ENDPOINT_TYPES = ['county', 'forecast', 'marine', 'fire', 'publicLand']
// Most active warning polygons are zone-based: the nationwide feed returned 463
// alerts with only 7 embedded geometries. Ten lookups left the map effectively
// empty, so resolve a realistic set, cache it, and keep concurrency polite.
const MAX_ZONE_LOOKUPS = 120
const MAX_ZONES_PER_ALERT = 24
const ZONE_LOOKUP_CONCURRENCY = 8
const ZONE_GEOMETRY_CACHE = new Map()
const ZONE_GEOMETRY_MISSES = new Set()

async function mapWithConcurrency(items, limit, worker) {
  let cursor = 0
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor
      cursor += 1
      await worker(items[index])
    }
  })
  await Promise.all(runners)
}

function alertDedupeKey(feature) {
  const props = feature.properties || {}
  const zones = (props.geocode?.UGC || []).slice().sort().join(',')
  return `${props.event || ''}|${zones || props.areaDesc || feature.id || ''}`
}

// Keeps the newest message per event+zone set so Alert/Update pairs do not stack
// duplicate polygons, while still covering every warning, watch, and advisory.
function dedupeAlertFeatures(features) {
  const cancels = new Map()
  for (const feature of features) {
    const props = feature.properties || {}
    if (props.messageType !== 'Cancel') continue
    const sent = Date.parse(props.sent || props.effective || '') || 0
    const key = alertDedupeKey(feature)
    if (sent >= (cancels.get(key) || 0)) cancels.set(key, sent)
  }
  const latest = new Map()
  for (const feature of features) {
    const props = feature.properties || {}
    if (props.status !== 'Actual') continue
    if (!ALERT_MESSAGE_TYPES.has(props.messageType || 'Alert')) continue
    const key = alertDedupeKey(feature)
    const sent = Date.parse(props.sent || props.effective || '') || 0
    if (sent <= (cancels.get(key) || -1)) continue
    const previous = latest.get(key)
    const previousSent = Date.parse(previous?.properties?.sent || previous?.properties?.effective || '') || 0
    if (!previous || sent >= previousSent) latest.set(key, feature)
  }
  return [...latest.values()]
}

async function fetchZoneGeometry(ugc, signal) {
  // NWS zone codes are [State][Type][Number], e.g. TXZ229, CAC001, AMZ671.
  // Detect zone type from the 3rd character (the type code) and query that
  // endpoint first: county zones 404 under /zones/forecast/.
  if (ZONE_GEOMETRY_CACHE.has(ugc)) return ZONE_GEOMETRY_CACHE.get(ugc)
  if (ZONE_GEOMETRY_MISSES.has(ugc)) return null

  const typeCode = ugc.length >= 3 ? ugc[2].toUpperCase() : ''
  let types = ZONE_ENDPOINT_TYPES
  if (typeCode === 'C') types = ['county', 'forecast', 'marine', 'fire', 'publicLand']
  else if (typeCode === 'F' || typeCode === 'Z') types = ['forecast', 'county', 'marine', 'fire', 'publicLand']
  else if (typeCode === 'M') types = ['marine', 'forecast', 'county', 'fire', 'publicLand']
  else if (typeCode === 'A') types = ['publicLand', 'forecast', 'county', 'marine', 'fire']

  for (const type of types) {
    try {
      const data = await fetchJson(`${NWS_API}/zones/${type}/${encodeURIComponent(ugc)}`, signal)
      if (data?.geometry) {
        ZONE_GEOMETRY_CACHE.set(ugc, data.geometry)
        return data.geometry
      }
    } catch (error) {
      if (signal?.aborted) throw error
      // A wrong endpoint type is a normal miss; a transport failure should not
      // be retried against four more endpoints for the same zone.
      if (error?.status === 404 || error?.status === 400) continue
      return null
    }
  }
  ZONE_GEOMETRY_MISSES.add(ugc)
  return null
}

function geometryCoordinates(geometry) {
  if (!geometry?.coordinates) return []
  return geometry.type === 'MultiPolygon' ? geometry.coordinates : [geometry.coordinates]
}

// Zone-based alerts (many watches and advisories) carry UGC zone codes instead
// of embedded polygons. Resolve those codes against the official NWS zones API
// so every active alert can draw its polygon, bounded to keep load reasonable.
const SEVERITY_RANK = { Extreme: 0, Severe: 1, Moderate: 2, Minor: 3 }

async function augmentAlertGeometries(features, signal, maxZoneLookups = MAX_ZONE_LOOKUPS) {
  const missing = features
    .filter(feature => !feature.geometry && (feature.properties?.geocode?.UGC || []).length)
    .sort((a, b) => (SEVERITY_RANK[a.properties?.severity] ?? 4) - (SEVERITY_RANK[b.properties?.severity] ?? 4))
  if (!missing.length) return features
  const wanted = [...new Set(missing.flatMap(feature => feature.properties.geocode.UGC))].slice(0, maxZoneLookups)
  const geometries = new Map()
  await mapWithConcurrency(wanted, ZONE_LOOKUP_CONCURRENCY, async ugc => {
    try {
      const geometry = await fetchZoneGeometry(ugc, signal)
      if (geometry) geometries.set(ugc, geometry)
    } catch (error) {
      if (signal?.aborted) throw error
    }
  })
  if (signal?.aborted) return features
  if (!geometries.size) return features
  for (const feature of missing) {
    const polygons = (feature.properties.geocode.UGC || [])
      .slice(0, MAX_ZONES_PER_ALERT)
      .flatMap(ugc => geometryCoordinates(geometries.get(ugc)))
    if (!polygons.length) continue
    feature.geometry = polygons.length === 1
      ? { type: 'Polygon', coordinates: polygons[0] }
      : { type: 'MultiPolygon', coordinates: polygons }
  }
  return features
}

async function processAlertFeatures(rawFeatures, signal, { maxZoneLookups = MAX_ZONE_LOOKUPS } = {}) {
  const features = dedupeAlertFeatures(Array.isArray(rawFeatures) ? rawFeatures : [])
  try {
    await augmentAlertGeometries(features, signal, maxZoneLookups)
  } catch (error) {
    if (signal?.aborted) throw error
  }
  return features
}

export async function getPointAlerts(coords, signal) {
  const url = `${NWS_API}/alerts/active?point=${Number(coords.lat)},${Number(coords.lon)}`
  const payload = await fetchJson(url, signal)
  return processAlertFeatures(payload.features, signal)
}

// Every currently active NWS alert nationwide — used for map polygons so watches,
// warnings, and advisories render regardless of whether they touch the point.
// The raw feed is several megabytes and zone geometries are cached, so a short
// TTL keeps revisiting the map from re-downloading and re-resolving everything.
const ACTIVE_ALERTS_TTL_MS = 2 * 60 * 1000
const activeAlertsCache = { at: 0, features: null }

export async function getAllActiveAlerts(signal) {
  if (activeAlertsCache.features?.length && Date.now() - activeAlertsCache.at < ACTIVE_ALERTS_TTL_MS) {
    return activeAlertsCache.features
  }
  const payload = await fetchJson(`${NWS_API}/alerts/active`, signal)
  const features = await processAlertFeatures(payload.features, signal, { maxZoneLookups: MAX_ZONE_LOOKUPS })
  activeAlertsCache.at = Date.now()
  activeAlertsCache.features = features
  return features
}

async function getLatestStationObservation(stationsUrl, signal) {
  if (!stationsUrl) throw new Error('Nearby station list is not available for this point.')
  const payload = await fetchJson(stationsUrl, signal)
  const stations = (payload.features || []).slice(0, 5)
  let lastError
  for (const station of stations) {
    const props = station.properties || {}
    const id = props.stationIdentifier || station.id?.split('/').pop()
    if (!id) continue
    try {
      const result = await fetchJson(`${NWS_API}/stations/${encodeURIComponent(id)}/observations/latest`, signal)
      if (result.properties) return { properties: result.properties, stationId: id, stationName: props.name || id }
    } catch (error) {
      if (signal?.aborted) throw error
      lastError = error
    }
  }
  throw lastError || new Error('No nearby weather station returned a current observation.')
}

async function settleRequest(url, signal) {
  if (!url) return { data: null, error: 'This NWS product is not available for the selected point.' }
  try { return { data: await fetchJson(url, signal), error: null } }
  catch (error) { if (signal?.aborted) throw error; return { data: null, error: error.message || 'Data unavailable' } }
}

export async function getWeatherBundle(coords, signal) {
  const pointUrl = `${NWS_API}/points/${Number(coords.lat).toFixed(4)},${Number(coords.lon).toFixed(4)}`
  const pointPayload = await fetchJson(pointUrl, signal)
  const point = pointPayload.properties || {}
  const [forecastResult, hourlyResult, gridResult, alertsResult, observationResult] = await Promise.all([
    settleRequest(point.forecast, signal),
    settleRequest(point.forecastHourly, signal),
    settleRequest(point.forecastGridData, signal),
    settleRequest(`${NWS_API}/alerts/active?point=${Number(coords.lat)},${Number(coords.lon)}`, signal),
    (async () => {
      try { return { data: await getLatestStationObservation(point.observationStations, signal), error: null } }
      catch (error) { if (signal?.aborted) throw error; return { data: null, error: error.message || 'Station observations unavailable' } }
    })()
  ])
  const alerts = await processAlertFeatures(alertsResult.data?.features, signal)
  return {
    point,
    forecast: forecastResult.data?.properties || null,
    hourly: hourlyResult.data?.properties || null,
    grid: gridResult.data?.properties || null,
    alerts,
    observation: observationResult.data?.properties || null,
    stationId: observationResult.data?.stationId || null,
    stationName: observationResult.data?.stationName || null,
    updatedAt: new Date().toISOString(),
    errors: {
      forecast: forecastResult.error,
      hourly: hourlyResult.error,
      grid: gridResult.error,
      alerts: alertsResult.error,
      observation: observationResult.error
    }
  }
}

export function getGridValue(grid, propertyName, at = Date.now()) {
  const values = grid?.[propertyName]?.values
  if (!Array.isArray(values) || values.length === 0) return null
  const parsed = values.map(item => {
    const [startText, durationText] = String(item.validTime || '').split('/')
    const start = Date.parse(startText)
    const duration = parseIsoDuration(durationText)
    return { ...item, start, end: Number.isFinite(start) && Number.isFinite(duration) ? start + duration : NaN }
  }).filter(item => Number.isFinite(item.start) && item.value !== null && item.value !== undefined && item.value !== '' && Number.isFinite(Number(item.value)))
  const current = parsed.find(item => item.start <= at && (!Number.isFinite(item.end) || item.end > at))
  const next = parsed.find(item => item.start >= at)
  const selected = current || next || parsed[parsed.length - 1]
  return selected && Number.isFinite(Number(selected.value)) ? { value: Number(selected.value), unitCode: grid[propertyName]?.uom || selected.unitCode || '' , validTime: selected.validTime } : null
}

export function parseIsoDuration(value = '') {
  const match = String(value).match(/^P(?:(\d+(?:\.\d+)?)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/)
  if (!match) return NaN
  return (((Number(match[1] || 0) * 24 + Number(match[2] || 0)) * 60 + Number(match[3] || 0)) * 60 + Number(match[4] || 0)) * 1000
}

export function formatNumber(value, digits = 0) {
  if (value === null || value === undefined || value === '' || !Number.isFinite(Number(value))) return '—'
  return Number(value).toFixed(digits)
}

export function convertTemperature(value, unitCode = '') {
  if (value === null || value === undefined || value === '' || !Number.isFinite(Number(value))) return null
  const unit = String(unitCode)
  if (unit.includes('degC') || unit.includes('celsius')) return Number(value) * 9 / 5 + 32
  return Number(value)
}

export function convertWindSpeed(value, unitCode = '') {
  if (value === null || value === undefined || value === '' || !Number.isFinite(Number(value))) return null
  const unit = String(unitCode)
  if (unit.includes('m_s-1') || unit.includes('m/s')) return Number(value) * 2.236936
  if (unit.includes('km_h-1') || unit.includes('km/h')) return Number(value) * 0.621371
  if (unit.includes('kn') || unit.includes('knot')) return Number(value) * 1.15078
  return Number(value)
}

export function convertPressure(value, unitCode = '') {
  if (value === null || value === undefined || value === '' || !Number.isFinite(Number(value))) return null
  const unit = String(unitCode)
  if (unit.includes('Pa') && !unit.includes('hPa')) return Number(value) / 100
  if (unit.toLowerCase().includes('inhg') || unit.toLowerCase().includes('in_hg')) return Number(value) * 33.8639
  return Number(value)
}

export function convertDistanceMiles(value, unitCode = '') {
  if (value === null || value === undefined || value === '' || !Number.isFinite(Number(value))) return null
  const unit = String(unitCode)
  if (unit.includes('km')) return Number(value) * 0.621371
  if (unit.includes('m') && !unit.includes('mi')) return Number(value) / 1609.344
  return Number(value)
}

export function observationValue(observation, key, converter = value => value) {
  const field = observation?.[key]
  if (!field || field.value === null || field.value === undefined) return null
  return converter(field.value, field.unitCode)
}

export function getNwsPointLabel(point, fallback = '') {
  const relative = point?.relativeLocation?.properties
  return relative?.city && relative?.state ? `${relative.city}, ${relative.state}` : fallback
}

export const NWS_HOME = 'https://www.weather.gov/'
export const NWS_ALERTS = 'https://www.weather.gov/alerts'
export const NWS_RADAR = 'https://radar.weather.gov/'

// Display helpers: the saved preference changes temperature display only.
export function temperatureToFahrenheit(value, inputUnit = 'F') {
  if (value === null || value === undefined || value === '' || !Number.isFinite(Number(value))) return null
  const unit = String(inputUnit).toLowerCase()
  if (unit === 'k' || unit.includes('kelvin') || unit.includes('degk')) return (Number(value) - 273.15) * 9 / 5 + 32
  if (unit === 'c' || unit.includes('degc') || unit.includes('celsius')) return Number(value) * 9 / 5 + 32
  return Number(value)
}

export function formatTemperature(valueF, units = 'imperial', digits = 0) {
  if (valueF === null || valueF === undefined || valueF === '' || !Number.isFinite(Number(valueF))) return '—'
  const fahrenheit = Number(valueF)
  const fixed = value => (Math.round((value + Number.EPSILON * Math.abs(value)) * (10 ** digits)) / (10 ** digits)).toFixed(digits)
  if (units === 'metric') return `${fixed((fahrenheit - 32) * 5 / 9)}°C`
  if (units === 'kelvin') return `${fixed((fahrenheit + 459.67) * 5 / 9)} K`
  return `${fixed(fahrenheit)}°F`
}

// Enhanced weather data utilities
export function getSunriseSunset(_grid) {
  // NWS may provide sunrise/sunset in the grid data
  // const sunrise = getGridValue(grid, 'apparentTemperature') // Placeholder - actual field may differ
  // const sunset = getGridValue(grid, 'probabilityOfPrecipitation') // Placeholder
  return { sunrise: null, sunset: null } // Return null if not available in NWS API
}

export function calculateHeatIndex(tempF, humidity) {
  if (tempF === null || humidity === null || tempF < 80 || humidity < 40) return null
  const T = tempF
  const RH = humidity
  // Rothfusz regression
  let HI = -42.379 + 2.04901523 * T + 10.14333127 * RH - 0.22475541 * T * RH
  HI -= 0.00683783 * T * T - 0.05481717 * RH * RH + 0.00122874 * T * T * RH
  HI += 0.00085282 * T * RH * RH - 0.00000199 * T * T * RH * RH
  return HI
}

export function calculateWindChill(tempF, windSpeedMph) {
  if (tempF === null || windSpeedMph === null || tempF > 50 || windSpeedMph < 3) return null
  const T = tempF
  const V = windSpeedMph
  return 35.74 + 0.6215 * T - 35.75 * Math.pow(V, 0.16) + 0.4275 * T * Math.pow(V, 0.16)
}

export function getDewPointCategory(dewPointF) {
  if (dewPointF === null) return { category: 'Unknown', color: '#91a4ba' }
  if (dewPointF < 50) return { category: 'Dry', color: '#67b7ff' }
  if (dewPointF < 55) return { category: 'Comfortable', color: '#6ee7f9' }
  if (dewPointF < 60) return { category: 'Muggy', color: '#ffd166' }
  if (dewPointF < 65) return { category: 'Oppressive', color: '#ff8b52' }
  return { category: 'Miserable', color: '#ff5c68' }
}

export function getWindDescription(speedMph) {
  if (speedMph === null) return 'Calm'
  if (speedMph < 1) return 'Calm'
  if (speedMph < 4) return 'Light air'
  if (speedMph < 8) return 'Light breeze'
  if (speedMph < 13) return 'Gentle breeze'
  if (speedMph < 19) return 'Moderate breeze'
  if (speedMph < 25) return 'Fresh breeze'
  if (speedMph < 32) return 'Strong breeze'
  if (speedMph < 39) return 'Near gale'
  if (speedMph < 47) return 'Gale'
  if (speedMph < 55) return 'Strong gale'
  if (speedMph < 64) return 'Storm'
  return 'Hurricane force'
}

export function getPressureTrend(currentPressure, previousPressure) {
  if (!currentPressure || !previousPressure) return 'Steady'
  const diff = currentPressure - previousPressure
  if (diff > 0.5) return 'Rising'
  if (diff < -0.5) return 'Falling'
  return 'Steady'
}

export function validateWeatherData(data) {
  const errors = []
  const warnings = []

  if (!data) {
    errors.push('No weather data available')
    return { valid: false, errors, warnings }
  }

  // Validate coordinates
  if (!data.point || !Number.isFinite(data.point?.gridX) || !Number.isFinite(data.point?.gridY)) {
    warnings.push('Grid coordinates may be invalid')
  }

  // Validate forecast
  if (!data.forecast || !data.forecast.periods || data.forecast.periods.length === 0) {
    warnings.push('Forecast data unavailable')
  }

  // Validate observation
  if (!data.observation) {
    warnings.push('Station observation unavailable')
  } else {
    if (data.observation.temperature?.value === null) {
      warnings.push('Temperature reading missing')
    }
    if (data.observation.relativeHumidity?.value === null) {
      warnings.push('Humidity reading missing')
    }
  }

  // Validate alerts
  if (!data.alerts) {
    warnings.push('Alert data unavailable')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    dataQuality: errors.length === 0 && warnings.length <= 2 ? 'Good' : warnings.length <= 4 ? 'Fair' : 'Poor'
  }
}

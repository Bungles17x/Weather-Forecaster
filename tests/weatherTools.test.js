import test from 'node:test'
import assert from 'node:assert/strict'
import { executeWeatherTool, WEATHER_TOOL_DEFINITIONS } from '../server/weather-tools.mjs'

const context = {
  location: 'Example, PA', source: 'National Weather Service (Weather.gov)', bundleUpdatedAt: '2026-01-01T12:00:00Z',
  observation: { temperatureDisplayed: '45°F', observedAt: '2026-01-01T11:50:00Z', description: 'Cloudy' },
  hourly: [
    { startTime: '2026-01-01T13:00:00Z', temperatureF: 45, precipitationChancePercent: 25 },
    { startTime: '2026-01-01T14:00:00Z', temperatureF: 42, precipitationChancePercent: 70 },
  ],
  forecastPeriods: [{ name: 'This Afternoon', temperature: 45, temperatureUnit: 'F' }],
  alerts: [], productErrors: { alerts: null, hourly: null, forecast: null },
}

test('weather assistant tools expose only the supported snapshot operations', () => {
  assert.deepEqual(WEATHER_TOOL_DEFINITIONS.map(item => item.function.name), ['get_current_conditions', 'get_forecast', 'get_active_alerts', 'find_precipitation_windows'])
})

test('forecast tool returns the actual loaded forecast and source timestamp', () => {
  const result = executeWeatherTool('get_forecast', { periodType: 'daily', limit: 1 }, context)
  assert.equal(result.location, 'Example, PA')
  assert.equal(result.periodType, 'daily')
  assert.equal(result.bundleUpdatedAt, context.bundleUpdatedAt)
  assert.equal(result.periods[0].name, 'This Afternoon')
})

test('precipitation tool finds actual probabilities and describes what probability means', () => {
  const result = executeWeatherTool('find_precipitation_windows', { minProbability: 50, limit: 3 }, context)
  assert.equal(result.periods.length, 1)
  assert.equal(result.periods[0].precipitationChancePercent, 70)
  assert.match(result.note, /not a guarantee/)
})

test('alert tool never treats a failed feed as an all-clear', () => {
  const result = executeWeatherTool('get_active_alerts', {}, { ...context, productErrors: { alerts: 'timeout' } })
  assert.equal(result.status, 'unavailable')
  assert.equal(result.dataAvailable, false)
  assert.match(result.caveat, /not an all-clear/)
})

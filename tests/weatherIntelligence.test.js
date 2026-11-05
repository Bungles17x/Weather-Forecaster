import test from 'node:test'
import assert from 'node:assert/strict'
import { buildDailyBriefing, buildWeatherContext, getLocalAssistantReply } from '../src/services/weatherIntelligence.js'

const now = Date.parse('2026-01-01T12:00:00Z')
const sampleWeather = {
  updatedAt: '2026-01-01T12:00:00Z',
  stationName: 'Sample Station',
  stationId: 'KABC',
  observation: {
    timestamp: '2026-01-01T11:50:00Z',
    textDescription: 'Cloudy',
    temperature: { value: 3, unitCode: 'wmoUnit:degC' },
    windSpeed: { value: 10, unitCode: 'wmoUnit:km_h-1' },
    relativeHumidity: { value: 70, unitCode: 'wmoUnit:percent' },
  },
  hourly: { periods: [
    { startTime: '2026-01-01T13:00:00Z', temperature: 30, temperatureUnit: 'F', probabilityOfPrecipitation: { value: 20 }, shortForecast: 'Partly Cloudy' },
    { startTime: '2026-01-01T14:00:00Z', temperature: 29, temperatureUnit: 'F', probabilityOfPrecipitation: { value: 65 }, shortForecast: 'Chance Rain' },
    { startTime: '2026-01-01T15:00:00Z', temperature: 31, temperatureUnit: 'F', probabilityOfPrecipitation: { value: 45 }, shortForecast: 'Chance Rain' },
  ] },
  forecast: { periods: [{ name: 'This Afternoon', startTime: '2026-01-01T12:00:00Z', temperature: 30, temperatureUnit: 'F', shortForecast: 'Partly Cloudy', detailedForecast: 'Partly cloudy.' }] },
  alerts: [], errors: { alerts: null },
}

test('buildWeatherContext normalizes observation units and carries product limitations', () => {
  const context = buildWeatherContext({ weather: sampleWeather, location: 'Sample, PA', units: 'imperial', now })
  assert.equal(context.location, 'Sample, PA')
  assert.equal(context.observation.temperatureF, 37.4)
  assert.equal(context.observation.windMph, 6.21371)
  assert.equal(context.hourly.length, 3)
  assert.ok(context.limitations.some(item => item.includes('No radar image is included')))
})

test('daily briefing calls out precipitation probability and below-freezing forecast periods', () => {
  const items = buildDailyBriefing(sampleWeather, 'imperial', now)
  assert.ok(items.some(item => item.id === 'precipitation' && item.title.includes('65%')))
  assert.ok(items.some(item => item.id === 'freezing' && item.kind === 'warning'))
})

test('local assistant distinguishes missing alerts from an unavailable alert feed', () => {
  const context = buildWeatherContext({ weather: sampleWeather, location: 'Sample, PA', units: 'imperial', now })
  const answer = getLocalAssistantReply('Are there any warnings?', context)
  assert.match(answer, /No active point-based NWS alerts were returned/)
  const unavailable = { ...context, productErrors: { alerts: 'API unavailable' } }
  assert.match(getLocalAssistantReply('Any alerts?', unavailable), /not an all-clear/)
})

test('local assistant answers dry-window questions using the lowest loaded probability', () => {
  const context = buildWeatherContext({ weather: sampleWeather, location: 'Sample, PA', units: 'imperial', now })
  const answer = getLocalAssistantReply('When is the best dry window?', context)
  assert.match(answer, /lowest listed precipitation probability/)
  assert.match(answer, /not a guarantee of dry weather/)
})

test('local assistant answers rain questions from the loaded hourly data', () => {
  const context = buildWeatherContext({ weather: sampleWeather, location: 'Sample, PA', units: 'imperial', now })
  const answer = getLocalAssistantReply('When is rain most likely?', context)
  assert.match(answer, /65%/)
  assert.match(answer, /forecast probability/)
})

test('local assistant does not turn an empty alert list into a safety guarantee', () => {
  const context = buildWeatherContext({ weather: sampleWeather, location: 'Sample, PA', units: 'imperial', now })
  const answer = getLocalAssistantReply('Is there a tornado? Is it safe outside?', context)
  assert.match(answer, /does not prove there is no hazard/)
  assert.match(answer, /cannot confirm a tornado/)
})

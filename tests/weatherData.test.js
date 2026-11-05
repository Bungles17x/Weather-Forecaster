import test from 'node:test'
import assert from 'node:assert/strict'
import {
  convertDistanceMiles,
  convertPressure,
  convertTemperature,
  convertWindSpeed,
  formatTemperature,
  getGridValue,
  observationValue,
  parseIsoDuration,
  temperatureToFahrenheit
} from '../src/services/weatherData.js'

test('temperature conversion handles Celsius, Fahrenheit, Kelvin, and missing values', () => {
  assert.equal(convertTemperature(0, 'wmoUnit:degC'), 32)
  assert.equal(temperatureToFahrenheit(20, 'C'), 68)
  assert.ok(Math.abs(temperatureToFahrenheit(293.15, 'K') - 68) < 1e-10)
  assert.equal(temperatureToFahrenheit(null, 'C'), null)
  assert.equal(formatTemperature(null, 'imperial'), '—')
  assert.equal(formatTemperature(32, 'metric'), '0°C')
  assert.equal(formatTemperature(32, 'kelvin', 1), '273.2 K')
})

test('wind, pressure, and distance values convert to the display units', () => {
  assert.ok(Math.abs(convertWindSpeed(10, 'wmoUnit:m_s-1') - 22.36936) < 1e-5)
  assert.equal(convertPressure(100000, 'wmoUnit:Pa'), 1000)
  assert.ok(Math.abs(convertPressure(29.92, 'wmoUnit:in_hg') - 1013.2078880000001) < 1e-5)
  assert.ok(Math.abs(convertDistanceMiles(1609.344, 'wmoUnit:m') - 1) < 1e-8)
  assert.equal(convertDistanceMiles(null, 'wmoUnit:m'), null)
})

test('ISO durations are parsed into milliseconds', () => {
  assert.equal(parseIsoDuration('PT1H'), 3_600_000)
  assert.equal(parseIsoDuration('PT30M'), 1_800_000)
  assert.equal(parseIsoDuration('P1DT1H'), 90_000_000)
  assert.ok(Number.isNaN(parseIsoDuration('invalid')))
})

test('grid helpers do not turn null forecast values into zero', () => {
  const now = Date.parse('2026-10-22T12:00:00Z')
  const grid = { temperature: { uom: 'wmoUnit:degC', values: [
    { validTime: '2026-10-22T11:00:00Z/PT2H', value: null },
    { validTime: '2026-10-22T13:00:00Z/PT1H', value: 12 }
  ] } }
  assert.equal(getGridValue(grid, 'temperature', now).value, 12)
  assert.equal(getGridValue({ temperature: { values: [{ validTime: '2026-10-22T11:00:00Z/PT1H', value: null }] } }, 'temperature', now), null)
})

test('observation accessor returns null when the NWS field is missing', () => {
  assert.equal(observationValue({}, 'temperature'), null)
  assert.equal(observationValue({ temperature: { value: 10, unitCode: 'wmoUnit:degC' } }, 'temperature', convertTemperature), 50)
})

import test from 'node:test'
import assert from 'node:assert/strict'
import {
  MAX_SAVED_LOCATIONS,
  addSavedLocation,
  hasSavedLocation,
  locationKey,
  normalizeSavedLocations,
  removeSavedLocation
} from '../src/services/savedLocations.js'

const denver = { name: 'Denver, Colorado', coordinates: { lat: 39.7392, lon: -104.9903 } }
const chicago = { name: 'Chicago, Illinois', coordinates: { lat: 41.8781, lon: -87.6298 } }

test('saving keeps the newest place first and collapses duplicates', () => {
  let list = addSavedLocation([], denver)
  assert.deepEqual(list.map(item => item.name), ['Denver, Colorado'])

  list = addSavedLocation(list, chicago)
  assert.deepEqual(list.map(item => item.name), ['Chicago, Illinois', 'Denver, Colorado'])

  // Re-saving Denver moves it to the front rather than duplicating it.
  list = addSavedLocation(list, denver)
  assert.deepEqual(list.map(item => item.name), ['Denver, Colorado', 'Chicago, Illinois'])
  assert.equal(list.length, 2)
})

test('saved places without a usable name or coordinates are rejected', () => {
  assert.deepEqual(normalizeSavedLocations(null), [])
  assert.deepEqual(normalizeSavedLocations([{ name: '', coordinates: denver.coordinates }]), [])
  assert.deepEqual(normalizeSavedLocations([{ name: 'Nowhere', coordinates: { lat: 'x', lon: 2 } }]), [])
  assert.deepEqual(normalizeSavedLocations([{ name: 'Out of range', coordinates: { lat: 120, lon: 10 } }]), [])
  assert.equal(addSavedLocation([], { name: 'Bad', coordinates: null }).length, 0)
})

test('the list is capped and removals match on the rounded coordinate key', () => {
  let list = []
  for (let i = 0; i < MAX_SAVED_LOCATIONS + 4; i++) {
    list = addSavedLocation(list, { name: `Place ${i}`, coordinates: { lat: 30 + i, lon: -90 - i } })
  }
  assert.equal(list.length, MAX_SAVED_LOCATIONS)
  assert.equal(list[0].name, `Place ${MAX_SAVED_LOCATIONS + 3}`)

  const key = locationKey(chicago.coordinates)
  list = removeSavedLocation(list, key)
  assert.equal(list.some(item => item.key === key), false)

  // A slightly different coordinate resolves to the same key and matches too.
  assert.equal(locationKey({ lat: 41.87814, lon: -87.62981 }), key)
  assert.equal(hasSavedLocation(addSavedLocation([], chicago), { lat: 41.87814, lon: -87.62981 }), true)
})

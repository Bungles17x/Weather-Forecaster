// Saved places: the small list of locations a person switches between.
//
// Kept as pure functions so the ordering, de-duplication and validation rules can
// be tested without a browser, and so the context only has to own the state.

export const SAVED_LOCATIONS_KEY = 'weatherdeskSavedLocations'
export const MAX_SAVED_LOCATIONS = 12

// Coordinates round to ~110 m, so the same place saved twice collapses into one
// entry instead of two entries that differ in the fourth decimal.
export function locationKey(coordinates) {
  const lat = Number(coordinates?.lat)
  const lon = Number(coordinates?.lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return ''
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return ''
  return `${lat.toFixed(3)},${lon.toFixed(3)}`
}

// Anything restored from storage is untrusted: entries without a usable name or
// coordinates are dropped rather than rendered as blank rows.
export function normalizeSavedLocations(input) {
  if (!Array.isArray(input)) return []
  const seen = new Set()
  const list = []
  for (const entry of input) {
    const name = String(entry?.name ?? '').trim()
    const lat = Number(entry?.coordinates?.lat ?? entry?.lat)
    const lon = Number(entry?.coordinates?.lon ?? entry?.lon)
    const key = locationKey({ lat, lon })
    if (!name || !key || seen.has(key)) continue
    seen.add(key)
    list.push({ name, key, coordinates: { lat, lon } })
    if (list.length >= MAX_SAVED_LOCATIONS) break
  }
  return list
}

// Most recently saved first, and re-saving an existing place moves it to the top
// instead of adding a duplicate.
export function addSavedLocation(list, location) {
  const [entry] = normalizeSavedLocations([location])
  if (!entry) return normalizeSavedLocations(list)
  const rest = normalizeSavedLocations(list).filter(item => item.key !== entry.key)
  return [entry, ...rest].slice(0, MAX_SAVED_LOCATIONS)
}

export function removeSavedLocation(list, key) {
  return normalizeSavedLocations(list).filter(item => item.key !== key)
}

export function hasSavedLocation(list, coordinates) {
  const key = locationKey(coordinates)
  if (!key) return false
  return normalizeSavedLocations(list).some(item => item.key === key)
}

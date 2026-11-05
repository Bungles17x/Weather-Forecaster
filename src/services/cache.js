const store = new Map()

export function cacheGet(key) {
  const hit = store.get(key)
  if (!hit) return undefined
  if (Date.now() > hit.expires) {
    store.delete(key)
    return undefined
  }
  return hit.value
}

export function cacheSet(key, value, ttlMs = 300000) {
  store.set(key, { value, expires: Date.now() + ttlMs, storedAt: Date.now() })
  return value
}

export function cachePeek(key) {
  const hit = store.get(key)
  if (!hit) return null
  return { expires: hit.expires, storedAt: hit.storedAt, expired: Date.now() > hit.expires }
}

export function clearCache() {
  store.clear()
}

export function getCacheStats() {
  const now = Date.now()
  const entries = [...store.entries()].map(([key, value]) => ({
    key,
    storedAt: value.storedAt,
    expires: value.expires,
    stale: now > value.expires
  }))
  return { size: store.size, entries }
}

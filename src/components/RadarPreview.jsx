import React, { useEffect, useMemo, useState } from 'react'
import './RadarPreview.css'
import { useLocation } from '../contexts/LocationContext'
import { NATIONAL_RADAR_PRODUCTS } from '../services/radarProducts'
import { WeatherDeskIcon } from './WeatherIcons'

const EARTH_RADIUS = 6378137
const MAX_MERCATOR_LAT = 85.05112878
const VIEW_HALF_WIDTH_METERS = 170000
const REFRESH_MS = 5 * 60 * 1000

function toWebMercator(lon, lat) {
  const clamped = Math.min(Math.max(lat, -MAX_MERCATOR_LAT), MAX_MERCATOR_LAT)
  return [
    EARTH_RADIUS * lon * Math.PI / 180,
    EARTH_RADIUS * Math.log(Math.tan(Math.PI / 4 + clamped * Math.PI / 360))
  ]
}

function buildRadarImageUrl(lat, lon, productId, cacheBust) {
  const product = NATIONAL_RADAR_PRODUCTS[productId] || NATIONAL_RADAR_PRODUCTS.bref
  const [x, y] = toWebMercator(lon, lat)
  const bbox = [x - VIEW_HALF_WIDTH_METERS, y - VIEW_HALF_WIDTH_METERS, x + VIEW_HALF_WIDTH_METERS, y + VIEW_HALF_WIDTH_METERS]
  const params = new URLSearchParams({
    service: 'WMS',
    version: '1.1.1',
    request: 'GetMap',
    layers: product.layerName,
    styles: '',
    bbox: bbox.join(','),
    width: '640',
    height: '400',
    srs: 'EPSG:3857',
    format: 'image/png',
    transparent: 'true',
    t: String(cacheBust)
  })
  return `${product.url}?${params}`
}

export default function RadarPreview() {
  const { coordinates } = useLocation()
  const [refreshIndex, setRefreshIndex] = useState(0)
  const [productId, setProductId] = useState('bref')
  const [loadedAt, setLoadedAt] = useState(null)
  const [failed, setFailed] = useState(false)

  const lat = Number(coordinates?.lat)
  const lon = Number(coordinates?.lon)
  const hasPoint = Number.isFinite(lat) && Number.isFinite(lon)

  useEffect(() => {
    if (!hasPoint) return undefined
    const timer = window.setInterval(() => setRefreshIndex(value => value + 1), REFRESH_MS)
    return () => window.clearInterval(timer)
  }, [hasPoint])

  const imageUrl = useMemo(
    () => (hasPoint ? buildRadarImageUrl(lat, lon, productId, refreshIndex) : null),
    [hasPoint, lat, lon, productId, refreshIndex]
  )

  if (!hasPoint) {
    return (
      <div className="radar-live radar-live-empty">
        <WeatherDeskIcon name="radar" size={34} />
        <span>Waiting for a location to center the NWS radar mosaic.</span>
      </div>
    )
  }

  return (
    <div className="radar-live">
      {failed ? (
        <div className="radar-live-fallback" role="alert">
          <WeatherDeskIcon name="radar" size={30} />
          <span>Live radar is unavailable right now. The NWS service may be busy — try again shortly.</span>
          <button type="button" className="radar-live-retry" onClick={() => { setFailed(false); setRefreshIndex(value => value + 1) }}>Retry</button>
        </div>
      ) : (
        <img
          key={imageUrl}
          className="radar-live-image"
          src={imageUrl}
          alt={`Live NWS ${NATIONAL_RADAR_PRODUCTS[productId]?.title || 'radar'} centered on your location`}
          loading="lazy"
          onLoad={() => { setLoadedAt(new Date()); setFailed(false) }}
          onError={() => setFailed(true)}
        />
      )}
      <div className="radar-live-top">
        <span className="radar-live-badge"><span className="radar-live-dot" />LIVE · NEXRAD</span>
        <select
          className="radar-live-select"
          aria-label="Radar product"
          value={productId}
          onChange={event => { setProductId(event.target.value); setLoadedAt(null); setFailed(false) }}
        >
          {Object.entries(NATIONAL_RADAR_PRODUCTS).map(([id, product]) => (
            <option key={id} value={id}>{product.label}</option>
          ))}
        </select>
        <span className="radar-live-time">
          {loadedAt ? `Updated ${loadedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : 'Loading official NWS imagery…'}
        </span>
      </div>
      <button
        type="button"
        className="radar-live-refresh"
        onClick={() => setRefreshIndex(value => value + 1)}
        aria-label="Refresh radar image"
        title="Refresh radar image"
      >
        <WeatherDeskIcon name="refresh" size={13} />
      </button>
    </div>
  )
}

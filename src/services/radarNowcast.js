// Client-side "future radar" for WeatherDesk.
//
// NWS/NOAA do not publish a free forecast-reflectivity WMS layer, so future
// frames are produced by measuring storm motion between the two most recent
// official scans and advecting the newest frame forward. Every value here comes
// from official imagery; the picture is a short-range extrapolation, not an
// official forecast, and the UI labels it that way.

const EARTH_RADIUS = 6378137
const MAX_MERCATOR_LAT = 85.05112878

export const PAST_FRAMES = 7
export const FUTURE_FRAMES = 6
export const TOTAL_FRAMES = PAST_FRAMES + FUTURE_FRAMES
export const PAST_STEP_MINUTES = 5
export const FUTURE_STEP_MINUTES = 10

const MOTION_SAMPLE_WIDTH = 320
const SEARCH_RADIUS = 6

// How far back the motion estimate may look, shortest first.
const MOTION_BASELINES = [5, 10, 20, 30]
// Upper bound on believable storm motion (about 90 mph), used to size the search.
const MAX_MOTION_METRES_PER_SECOND = 40

const COMPASS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']

const toRadians = degrees => degrees * (Math.PI / 180)

function toMercator(lng, lat) {
  const clamped = Math.min(Math.max(lat, -MAX_MERCATOR_LAT), MAX_MERCATOR_LAT)
  return [
    EARTH_RADIUS * toRadians(lng),
    EARTH_RADIUS * Math.log(Math.tan(Math.PI / 4 + toRadians(clamped) / 2))
  ]
}

// Timeline anchored to the newest scan the product actually publishes.
export function frameTimes(anchorMs) {
  if (!Number.isFinite(anchorMs)) return []
  const past = Array.from(
    { length: PAST_FRAMES },
    (_, index) => anchorMs - (PAST_FRAMES - 1 - index) * PAST_STEP_MINUTES * 60000
  )
  const future = Array.from(
    { length: FUTURE_FRAMES },
    (_, index) => anchorMs + (index + 1) * FUTURE_STEP_MINUTES * 60000
  )
  return [...past, ...future]
}

export function wmsTime(ms) {
  return new Date(ms).toISOString().replace(/\.\d{3}Z$/, 'Z')
}

export function buildViewImageUrl(definition, view, time) {
  const params = new URLSearchParams({
    service: 'WMS',
    version: '1.1.1',
    request: 'GetMap',
    layers: definition.layerName,
    styles: definition.style || '',
    format: 'image/png',
    transparent: 'true',
    srs: 'EPSG:3857',
    bbox: view.bbox.join(','),
    width: String(view.width),
    height: String(view.height)
  })
  if (Number.isFinite(time)) params.set('time', wmsTime(time))
  return `${definition.url}?${params.toString()}`
}

// Snapshot of the current Leaflet view in EPSG:3857 metres, which is what the
// NWS WMS expects for srs=EPSG:3857 in version 1.1.1.
export function readView(map) {
  const bounds = map.getBounds()
  const size = map.getSize()
  const west = Math.max(-180, Math.min(180, bounds.getWest()))
  const east = Math.max(-180, Math.min(180, bounds.getEast()))
  const south = Math.max(-MAX_MERCATOR_LAT, Math.min(MAX_MERCATOR_LAT, bounds.getSouth()))
  const north = Math.max(-MAX_MERCATOR_LAT, Math.min(MAX_MERCATOR_LAT, bounds.getNorth()))
  if (!(east > west) || !(north > south)) return null

  const [xmin, ymin] = toMercator(west, south)
  const [xmax, ymax] = toMercator(east, north)
  const width = Math.round(Math.min(1024, Math.max(320, size.x || 640)))
  const height = Math.round(Math.min(1024, Math.max(200, width * ((size.y || 400) / Math.max(1, size.x || 640)))))
  return { bbox: [xmin, ymin, xmax, ymax], width, height }
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    // The NWS WMS sends Access-Control-Allow-Origin: *, so the canvas stays
    // readable and the frames can be exported as images.
    image.crossOrigin = 'anonymous'
    image.decoding = 'async'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('An official radar frame could not be loaded for the nowcast.'))
    image.src = url
  })
}

// Radar echoes are the opaque pixels of a transparent PNG: alpha says where the
// precipitation is, brightness gives the matcher something to line up.
function echoGrid(image) {
  const naturalWidth = image.naturalWidth || image.width || MOTION_SAMPLE_WIDTH
  const scale = Math.min(1, MOTION_SAMPLE_WIDTH / naturalWidth)
  const width = Math.max(1, Math.round(naturalWidth * scale))
  const height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { willReadFrequently: true })
  context.drawImage(image, 0, 0, width, height)
  const { data } = context.getImageData(0, 0, width, height)
  const mask = new Uint8Array(width * height)
  const value = new Uint8Array(width * height)
  const intensity = new Uint8Array(width * height)
  for (let index = 0; index < mask.length; index += 1) {
    const alpha = data[index * 4 + 3]
    if (alpha <= 24) continue
    mask[index] = 1
    const r = data[index * 4]
    const g = data[index * 4 + 1]
    const b = data[index * 4 + 2]
    value[index] = Math.max(1, Math.round((r * 0.299 + g * 0.587 + b * 0.114) * (alpha / 255)))
    intensity[index] = Math.max(1, Math.round(echoIntensity(r, g, b) * (alpha / 255)))
  }
  return { mask, value, intensity, width, height }
}

// Reflectivity palettes run green -> yellow -> orange -> red -> magenta, so plain
// brightness is not monotonic with intensity (yellow is brighter than red). Rank
// the palette bands instead, on a 0..255 scale, for growth/decay measurement.
function echoIntensity(r, g, b) {
  let band
  if (b > 90 && r > 90) band = 4 + b / 255
  else if (r > 120 && g < 90) band = 3 + r / 255
  else if (r > 140 && g >= 90 && g < 190) band = 2 + r / 255
  else if (r > 160 && g >= 190) band = 1 + g / 255
  else band = Math.max(r, g) / 255
  return (Math.min(5, band) / 5) * 255
}

// Whole-frame motion from two official scans.
//
// Each candidate offset is scored by the mean absolute brightness difference
// over the echo pixels both scans share (normalised, so an offset that only
// overlaps a small patch cannot win by covering less). Offsets are tried from
// zero outward and only a meaningfully lower cost is accepted, so a flat,
// ambiguous field stays put instead of drifting. The winning offset is the shift
// that best maps the previous scan onto the current one, so the echo itself
// moved the opposite way.
// Returns the displacement in *sampled* pixels, with a confidence figure.
// `searchRadius` is in sampled pixels and grows with the view: a city-sized map
// moves echoes many samples per scan, a national mosaic moves them one or two.
// The search runs every second offset and then refines around the winner, which
// keeps a wide window affordable.
export function estimateMotion(previous, current, searchRadius = SEARCH_RADIUS) {
  const { width, height } = current
  const radius = Math.min(32, Math.max(2, Math.round(searchRadius)))
  const STEP = 2
  const MIN_OVERLAP = 150

  const differenceAt = (dx, dy) => {
    let difference = 0
    let overlap = 0
    for (let y = 0; y < height; y += STEP) {
      const qy = y + dy
      if (qy < 0 || qy >= height) continue
      for (let x = 0; x < width; x += STEP) {
        const qx = x + dx
        if (qx < 0 || qx >= width) continue
        const a = current.value[y * width + x]
        const b = previous.value[qy * width + qx]
        if (!a && !b) continue
        difference += a > b ? a - b : b - a
        overlap += 1
      }
    }
    return overlap >= MIN_OVERLAP ? { cost: difference / overlap, overlap } : null
  }

  const cache = new Map()
  const cachedCost = (dx, dy) => {
    const key = `${dx},${dy}`
    if (!cache.has(key)) cache.set(key, differenceAt(dx, dy))
    return cache.get(key)
  }

  const stationary = cachedCost(0, 0)
  if (!stationary) return { dx: 0, dy: 0, samples: 0, clamped: false, confidence: 0 }

  let best = { dx: 0, dy: 0, cost: stationary.cost, radius: 0 }
  const consider = (dx, dy, measured) => {
    // A candidate has to be clearly better, so noise cannot nudge the motion.
    if (!measured || measured.cost >= best.cost - 0.5) return
    best = { dx, dy, cost: measured.cost, radius: Math.hypot(dx, dy) }
  }

  for (let dy = -radius; dy <= radius; dy += 2) {
    for (let dx = -radius; dx <= radius; dx += 2) {
      if (!dx && !dy) continue
      if (dx * dx + dy * dy > radius * radius) continue
      consider(dx, dy, cachedCost(dx, dy))
    }
  }
  for (let dy = best.dy - 1; dy <= best.dy + 1; dy += 1) {
    for (let dx = best.dx - 1; dx <= best.dx + 1; dx += 1) {
      if (!dx && !dy) continue
      if (dx * dx + dy * dy > radius * radius) continue
      consider(dx, dy, cachedCost(dx, dy))
    }
  }

  // Integer offsets only give a coarse speed, so fit a parabola through the
  // winning cost and its neighbours to recover the sub-pixel minimum.
  const subPixel = (centre, before, after) => {
    if (!before || !after) return 0
    const denominator = before.cost - 2 * centre.cost + after.cost
    if (!Number.isFinite(denominator) || denominator <= 0) return 0
    const shift = (0.5 * (before.cost - after.cost)) / denominator
    return Math.max(-0.4, Math.min(0.4, shift))
  }
  const shiftX = subPixel(best, cachedCost(best.dx - 1, best.dy), cachedCost(best.dx + 1, best.dy))
  const shiftY = subPixel(best, cachedCost(best.dx, best.dy - 1), cachedCost(best.dx, best.dy + 1))

  const improvement = stationary.cost > 0 ? (stationary.cost - best.cost) / stationary.cost : 0
  const confident = improvement > 0.05 && best.radius > 0

  return {
    dx: confident ? -(best.dx + shiftX) : 0,
    dy: confident ? -(best.dy + shiftY) : 0,
    samples: stationary.overlap,
    clamped: best.radius >= radius - 1.01,
    confidence: improvement
  }
}

// Growth and decay between two official scans.
//
// The same echo is compared at the measured offset, cell by cell, so a core that
// is strengthening and an edge that is falling apart get their own rate. Rates are
// clamped to a defensible hourly range so sampling noise cannot invent explosive
// growth, and cells with too little echo fall back to the frame-wide trend.
const TREND_CELL = 8
const TREND_LOG_LIMIT_PER_MINUTE = 0.012
const TREND_MIN_PIXELS = 12

export function estimateTrend(previous, current, dx, dy) {
  const { width, height } = current
  const cellsW = Math.max(1, Math.ceil(width / TREND_CELL))
  const cellsH = Math.max(1, Math.ceil(height / TREND_CELL))
  const sums = new Float64Array(cellsW * cellsH)
  const counts = new Uint32Array(cellsW * cellsH)
  const offsetX = Math.round(-dx)
  const offsetY = Math.round(-dy)

  for (let y = 0; y < height; y += 1) {
    const qy = y + offsetY
    if (qy < 0 || qy >= height) continue
    for (let x = 0; x < width; x += 1) {
      const qx = x + offsetX
      if (qx < 0 || qx >= width) continue
      const a = current.value[y * width + x]
      const b = previous.value[qy * width + qx]
      if (!a && !b) continue
      const cell = Math.floor(y / TREND_CELL) * cellsW + Math.floor(x / TREND_CELL)
      // A small floor keeps near-transparent pixels from dominating the ratio.
      sums[cell] += Math.log((current.intensity[y * width + x] + 10) / (previous.intensity[qy * width + qx] + 10))
      counts[cell] += 1
    }
  }

  const rates = new Float32Array(cellsW * cellsH)
  let weighted = 0
  let weight = 0
  for (let index = 0; index < rates.length; index += 1) {
    if (counts[index] < TREND_MIN_PIXELS) {
      rates[index] = Number.NaN
      continue
    }
    const rate = Math.max(
      -TREND_LOG_LIMIT_PER_MINUTE,
      Math.min(TREND_LOG_LIMIT_PER_MINUTE, sums[index] / counts[index])
    )
    rates[index] = rate
    weighted += rate * counts[index]
    weight += counts[index]
  }

  return { cellsW, cellsH, rates, globalRate: weight ? weighted / weight : 0 }
}

// Applies one frame's worth of that trend to already-advected pixels: decaying
// areas lose opacity so they thin out, strengthening areas brighten.
function applyTrend(context, trend, minutes, width, height) {
  const image = context.getImageData(0, 0, width, height)
  const data = image.data
  const cellWidth = width / trend.cellsW
  const cellHeight = height / trend.cellsH

  for (let y = 0; y < height; y += 1) {
    const row = Math.min(trend.cellsH - 1, Math.floor(y / cellHeight)) * trend.cellsW
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4
      if (!data[index + 3]) continue
      let rate = trend.rates[row + Math.min(trend.cellsW - 1, Math.floor(x / cellWidth))]
      if (!Number.isFinite(rate)) rate = trend.globalRate
      const factor = Math.min(2, Math.max(0.35, Math.exp(rate * minutes)))
      if (factor < 1) {
        // Decaying echoes thin out rather than just dimming, the way real cells
        // lose coverage as the updraft collapses.
        const alpha = data[index + 3] * factor
        data[index + 3] = alpha < 6 ? 0 : alpha
        continue
      }
      const r = data[index]
      const g = data[index + 1]
      const b = data[index + 2]
      const gain = 1 + (factor - 1) * 0.45
      data[index] = Math.min(255, r * gain)
      data[index + 1] = Math.min(255, g * gain)
      data[index + 2] = Math.min(255, b * gain)
      // Green sits at the bottom of the reflectivity scale, so a strengthening
      // green echo only reads as stronger once it starts moving toward yellow.
      if (g > r && g > b) data[index] = Math.min(255, data[index] + 255 * (factor - 1) * 0.3)
    }
  }
  context.putImageData(image, 0, 0)
}

export function compassPoint(bearing) {
  return COMPASS[Math.round(((bearing % 360) / 22.5)) % 16]
}

// Renders the extrapolated frames and describes the measured motion.
export async function buildNowcast({ definition, view, anchorMs }) {
  if (!definition?.layerName) throw new Error('Future radar is only available for a national NWS mosaic.')
  if (!view?.bbox?.length) throw new Error('The current map view cannot be extrapolated.')

  // Storm motion is measured over a baseline long enough to show at this zoom:
  // across a whole-state view a five-minute drift is well under one sampled
  // pixel, so the shortest usable baseline wins and longer ones are tried only
  // when the field looks stationary. Every baseline is a pair of real scans.
  const scans = await Promise.all(
    MOTION_BASELINES.map(minutes =>
      loadImage(buildViewImageUrl(definition, view, anchorMs - minutes * 60000)).catch(() => null)
    )
  )
  const latest = await loadImage(buildViewImageUrl(definition, view, anchorMs))
  const currentGrid = echoGrid(latest)

  // Displacement is measured on the downsampled grid, so scale it back to ground
  // metres (for the reported speed) and to output pixels (for the advection).
  const metresPerSamplePixel = (view.bbox[2] - view.bbox[0]) / Math.max(1, currentGrid.width)

  let motion = { dx: 0, dy: 0, samples: 0, clamped: false, confidence: 0 }
  let baselineMinutes = MOTION_BASELINES[0]
  let trendGrid = null
  for (let index = 0; index < MOTION_BASELINES.length; index += 1) {
    const image = scans[index]
    if (!image) continue
    const minutes = MOTION_BASELINES[index]
    const reach = (MAX_MOTION_METRES_PER_SECOND * minutes * 60) / Math.max(1, metresPerSamplePixel)
    const previousGrid = echoGrid(image)
    const measured = estimateMotion(previousGrid, currentGrid, Math.min(32, Math.max(6, Math.ceil(reach))))
    baselineMinutes = minutes
    motion = measured
    trendGrid = previousGrid
    // Accept the first baseline that produced a match we can trust; otherwise
    // keep looking further back before admitting the field looks stationary.
    if (measured.confidence >= 0.05 && !measured.clamped && Math.hypot(measured.dx, measured.dy) >= 1) break
  }

  const viewPixelsPerSamplePixel = Math.max(1, view.width) / Math.max(1, currentGrid.width)
  const speedMph = Math.round((Math.hypot(motion.dx, motion.dy) * metresPerSamplePixel / baselineMinutes / 60) * 2.2369362920544)
  const bearing = ((Math.atan2(motion.dx, -motion.dy) * 180) / Math.PI + 360) % 360

  // Too few usable echo pixels, a match that ran into the search edge, a speed no
  // storm travels, or a match too weak to trust all mean the estimate cannot be
  // used. Holding the newest scan is honest; drifting it at an invented speed is not.
  const uncertain = motion.samples < 150 || motion.clamped || speedMph > 90 || motion.confidence < 0.05
  const perMinuteX = uncertain ? 0 : (motion.dx * viewPixelsPerSamplePixel) / baselineMinutes
  const perMinuteY = uncertain ? 0 : (motion.dy * viewPixelsPerSamplePixel) / baselineMinutes

  // Only reflectivity products have a meaningful intensity scale to extrapolate;
  // categorical layers (precipitation type) are advected unchanged.
  const trend = !uncertain && definition.trend && trendGrid
    ? estimateTrend(trendGrid, currentGrid, motion.dx, motion.dy)
    : null
  const trendChange = trend ? Math.exp(trend.globalRate * 60) - 1 : 0

  const frames = []
  for (let step = 1; step <= FUTURE_FRAMES; step += 1) {
    const minutes = step * FUTURE_STEP_MINUTES
    const canvas = document.createElement('canvas')
    canvas.width = view.width
    canvas.height = view.height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('This browser cannot render the extrapolated radar frames.')
    // Each step is the newest official frame advected along the measured motion,
    // drawn at full opacity so the only thing that changes between frames is the
    // position of the echoes.
    context.drawImage(latest, perMinuteX * minutes, perMinuteY * minutes, view.width, view.height)
    if (trend) applyTrend(context, trend, minutes, view.width, view.height)
    frames.push({ minutes, url: canvas.toDataURL('image/png') })
  }

  return {
    frames,
    speedMph: uncertain ? 0 : speedMph,
    compass: uncertain ? '' : compassPoint(bearing),
    motionSamples: motion.samples,
    motionBaselineMinutes: baselineMinutes,
    confidence: Number(motion.confidence.toFixed(3)),
    trend: !trend ? 'unknown' : trendChange > 0.08 ? 'growing' : trendChange < -0.08 ? 'weakening' : 'steady',
    trendPercent: Math.round(trendChange * 100),
    uncertain,
    still: uncertain || Math.hypot(perMinuteX, perMinuteY) < 0.15
  }
}

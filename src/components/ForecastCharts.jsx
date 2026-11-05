import React, { useEffect, useMemo, useRef, useState } from 'react'
import './ForecastCharts.css'
import { formatTemperature, parseIsoDuration, temperatureToFahrenheit } from '../services/weatherData'
import { WeatherDeskIcon } from './WeatherIcons'

const CHART_HEIGHT = 190
const PAD = { top: 14, right: 12, bottom: 26, left: 34 }

function useElementWidth() {
  const ref = useRef(null)
  const [width, setWidth] = useState(560)
  useEffect(() => {
    const node = ref.current
    if (!node || typeof ResizeObserver === 'undefined') return undefined
    const observer = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect?.width
      if (w) setWidth(Math.max(220, Math.round(w)))
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  return [ref, width]
}

function useHoverIndex(count) {
  const [index, setIndex] = useState(null)
  const move = event => {
    const rect = event.currentTarget.getBoundingClientRect()
    if (!rect.width || !count) return
    const ratio = (event.clientX - rect.left) / rect.width
    setIndex(Math.max(0, Math.min(count - 1, Math.round(ratio * (count - 1)))))
  }
  const leave = () => setIndex(null)
  return [index, move, leave]
}

function ChartTooltip({ xPct, children }) {
  if (xPct === null || xPct === undefined) return null
  const left = Math.min(88, Math.max(4, xPct))
  return <div className="fc-tooltip" style={{ left: `${left}%` }}>{children}</div>
}

function niceMax(value) {
  if (value <= 0) return 1
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const normalized = value / magnitude
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  return step * magnitude
}

function hourlyTimeLabel(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString([], { hour: 'numeric' })
}

function dayLabel(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString([], { weekday: 'short' })
}

// ── Chart 1: precipitation timing (hourly probability of precipitation) ──────
function PrecipTimingChart({ hourly }) {
  const [wrapRef, width] = useElementWidth()
  const [hover, onMove, onLeave] = useHoverIndex(hourly.length)
  const plotW = width - PAD.left - PAD.right
  const plotH = CHART_HEIGHT - PAD.top - PAD.bottom
  const barW = Math.max(4, (plotW / hourly.length) * 0.62)
  const maxY = 100
  const y = value => PAD.top + plotH - (value / maxY) * plotH
  const x = index => PAD.left + (index + 0.5) * (plotW / hourly.length)

  const gridLines = [0, 25, 50, 75, 100]
  const labelEvery = Math.max(1, Math.ceil(hourly.length / 8))

  return (
    <div className="fc-card" ref={wrapRef}>
      <div className="fc-card-head">
        <div><span className="eyebrow">PRECIPITATION TIMING</span><strong>Chance of precipitation · next {hourly.length}h</strong></div>
        <span className="fc-unit">%</span>
      </div>
      {!hourly.length ? <EmptyState text="Hourly precipitation probabilities are not available yet." /> : (
        <div className="fc-plot-wrap">
          <svg width={width} height={CHART_HEIGHT} onMouseMove={onMove} onMouseLeave={onLeave} role="img" aria-label="Hourly precipitation probability chart">
            {gridLines.map(v => (
              <g key={v}>
                <line x1={PAD.left} x2={width - PAD.right} y1={y(v)} y2={y(v)} className="fc-grid" />
                <text x={PAD.left - 6} y={y(v) + 3} className="fc-axis" textAnchor="end">{v}%</text>
              </g>
            ))}
            {hourly.map((period, i) => {
              const chance = Number(period.probabilityOfPrecipitation?.value)
              const h = Math.max(2, y(0) - y(Math.min(100, chance)))
              const active = hover === i
              return (
                <rect
                  key={`${period.startTime}-${i}`}
                  x={x(i) - barW / 2}
                  y={y(Math.min(100, chance))}
                  width={barW}
                  height={h}
                  rx={Math.min(3, barW / 3)}
                  className={`fc-bar fc-bar-pop ${active ? 'fc-active' : ''}`}
                  style={{ '--pop': Math.min(100, chance) / 100 }}
                />
              )
            })}
            {hourly.map((period, i) => i % labelEvery === 0 && (
              <text key={`l-${i}`} x={x(i)} y={CHART_HEIGHT - 8} className="fc-axis" textAnchor="middle">{hourlyTimeLabel(period.startTime)}</text>
            ))}
            {hover !== null && (
              <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + plotH} className="fc-crosshair" />
            )}
          </svg>
          <ChartTooltip xPct={hover === null ? null : (x(hover) / width) * 100}>
            {hover !== null && hourly[hover] && (
              <>
                <strong>{new Date(hourly[hover].startTime).toLocaleString([], { weekday: 'short', hour: 'numeric' })}</strong>
                <span>{hourly[hover].probabilityOfPrecipitation?.value ?? '—'}% chance · {hourly[hover].shortForecast || 'Forecast'}</span>
              </>
            )}
          </ChartTooltip>
        </div>
      )}
    </div>
  )
}

// ── Chart 2: precipitation intensity (QPF from the NWS forecast grid) ────────
function parseQpf(grid, units) {
  const prop = grid?.quantitativePrecipitation
  const values = prop?.values
  if (!Array.isArray(values) || !values.length) return { series: [], unit: '' }
  const rawUnit = String(prop.uom || '')
  const toInches = rawUnit.includes('mm') || rawUnit.toLowerCase().includes('millimeter')
  const displayUnit = toInches ? (units === 'metric' ? 'mm' : 'in') : (rawUnit.includes('in') ? 'in' : rawUnit || 'units')
  const factor = toInches ? (units === 'metric' ? 1 : 1 / 25.4) : 1
  const series = values
    .map(item => {
      const [startText, durationText] = String(item.validTime || '').split('/')
      const start = Date.parse(startText)
      const duration = parseIsoDuration(durationText)
      const value = Number(item.value)
      if (!Number.isFinite(start) || !Number.isFinite(value) || value < 0) return null
      return { start, end: Number.isFinite(start + duration) ? start + duration : start, value: value * factor }
    })
    .filter(Boolean)
    .sort((a, b) => a.start - b.start)
  return { series, unit: displayUnit }
}

function PrecipIntensityChart({ grid, units }) {
  const [wrapRef, width] = useElementWidth()
  const { series, unit } = useMemo(() => parseQpf(grid, units), [grid, units])
  const plotW = width - PAD.left - PAD.right
  const plotH = CHART_HEIGHT - PAD.top - PAD.bottom
  const maxValue = Math.max(0.01, ...series.map(item => item.value))
  const maxY = niceMax(maxValue * 1.15)
  const t0 = series[0]?.start
  const t1 = series[series.length - 1]?.end
  const span = Math.max(1, (t1 || 0) - (t0 || 0))
  const y = value => PAD.top + plotH - (value / maxY) * plotH
  const x = time => PAD.left + ((time - t0) / span) * plotW

  const [activeIndex, setActiveIndex] = useState(null)
  const move = event => {
    if (!series.length) return
    const rect = event.currentTarget.getBoundingClientRect()
    const ratio = (event.clientX - rect.left) / rect.width
    const time = t0 + ratio * span
    let best = 0
    series.forEach((item, i) => { if (time >= item.start && time <= item.end) best = i })
    setActiveIndex(best)
  }
  const gridLines = [0, maxY / 2, maxY]

  return (
    <div className="fc-card" ref={wrapRef}>
      <div className="fc-card-head">
        <div><span className="eyebrow">PRECIPITATION INTENSITY</span><strong>Forecast quantitative precipitation</strong></div>
        <span className="fc-unit">{unit || 'QPF'}</span>
      </div>
      {!series.length ? <EmptyState text="Quantitative precipitation is not available for this point yet." /> : (
        <div className="fc-plot-wrap">
          <svg width={width} height={CHART_HEIGHT} onMouseMove={move} onMouseLeave={() => setActiveIndex(null)} role="img" aria-label="Quantitative precipitation forecast chart">
            {gridLines.map((v, i) => (
              <g key={i}>
                <line x1={PAD.left} x2={width - PAD.right} y1={y(v)} y2={y(v)} className="fc-grid" />
                <text x={PAD.left - 6} y={y(v) + 3} className="fc-axis" textAnchor="end">{v >= 1 ? v.toFixed(1) : v.toFixed(2)}</text>
              </g>
            ))}
            {series.map((item, i) => {
              const active = activeIndex === i
              return (
                <rect
                  key={i}
                  x={x(item.start)}
                  y={y(item.value)}
                  width={Math.max(2, x(item.end) - x(item.start) - 1)}
                  height={Math.max(2, y(0) - y(item.value))}
                  className={`fc-bar fc-bar-qpf ${active ? 'fc-active' : ''}`}
                />
              )
            })}
            {series.length > 1 && series.map((item, i) => i % Math.ceil(series.length / 6) === 0 && (
              <text key={`l-${i}`} x={x(item.start)} y={CHART_HEIGHT - 8} className="fc-axis" textAnchor="middle">{dayLabel(item.start)}</text>
            ))}
            {activeIndex !== null && series[activeIndex] && (
              <line x1={x(series[activeIndex].start)} x2={x(series[activeIndex].end)} y1={PAD.top} y2={PAD.top + plotH} className="fc-crosshair" />
            )}
          </svg>
          <ChartTooltip xPct={activeIndex === null || !series[activeIndex] ? null : ((x(series[activeIndex].start) + x(series[activeIndex].end)) / 2 / width) * 100}>
            {activeIndex !== null && series[activeIndex] && (
              <>
                <strong>{new Date(series[activeIndex].start).toLocaleString([], { weekday: 'short', hour: 'numeric' })} – {new Date(series[activeIndex].end).toLocaleTimeString([], { hour: 'numeric' })}</strong>
                <span>{series[activeIndex].value.toFixed(2)} {unit} expected</span>
              </>
            )}
          </ChartTooltip>
        </div>
      )}
      <p className="fc-note">Official NWS grid QPF — an estimate, not a rain-gauge total.</p>
    </div>
  )
}

// ── Chart 2b: hourly precipitation amount + probability ─────────────────────
function bucketHourlyPrecip(series, hourlyPeriods, hours = 48) {
  const now = Date.now()
  const popByHour = new Map()
  for (const period of hourlyPeriods || []) {
    const start = Date.parse(period.startTime)
    if (Number.isFinite(start)) popByHour.set(Math.floor(start / 3600000), period)
  }
  const buckets = []
  for (let i = 0; i < hours; i += 1) {
    const start = now + i * 3600000
    const end = start + 3600000
    let amount = 0
    for (const item of series) {
      const overlap = Math.min(end, item.end) - Math.max(start, item.start)
      if (overlap > 0 && item.end > item.start) amount += item.value * (overlap / (item.end - item.start))
    }
    buckets.push({ start, amount, period: popByHour.get(Math.floor(start / 3600000)) || null })
  }
  return buckets
}

function HourlyPrecipChart({ grid, hourly, units }) {
  const [wrapRef, width] = useElementWidth()
  const { series, unit } = useMemo(() => parseQpf(grid, units), [grid, units])
  const buckets = useMemo(() => bucketHourlyPrecip(series, hourly, 48), [series, hourly])
  const [activeIndex, setActiveIndex] = useState(null)
  const plotW = width - PAD.left - PAD.right
  const plotH = CHART_HEIGHT - PAD.top - PAD.bottom
  const maxAmount = Math.max(0.001, ...buckets.map(b => b.amount))
  const maxY = niceMax(maxAmount * 1.2)
  const y = value => PAD.top + plotH - (value / maxY) * plotH
  const x = index => PAD.left + (buckets.length === 1 ? plotW / 2 : (index / (buckets.length - 1)) * plotW)
  const barW = Math.max(3, (plotW / buckets.length) * 0.6)

  const move = event => {
    if (!buckets.length) return
    const rect = event.currentTarget.getBoundingClientRect()
    const ratio = (event.clientX - rect.left) / rect.width
    setActiveIndex(Math.max(0, Math.min(buckets.length - 1, Math.round(ratio * (buckets.length - 1)))))
  }
  const ticks = [0, maxY / 2, maxY]
  const labelEvery = Math.ceil(buckets.length / 8)

  return (
    <div className="fc-card" ref={wrapRef}>
      <div className="fc-card-head">
        <div><span className="eyebrow">HOURLY PRECIPITATION</span><strong>Expected amount + chance · next 48h</strong></div>
        <span className="fc-unit">{unit || 'QPF'}</span>
      </div>
      {!series.length ? <EmptyState text="Hourly precipitation amounts are not available for this point yet." /> : (
        <div className="fc-plot-wrap">
          <svg width={width} height={CHART_HEIGHT} onMouseMove={move} onMouseLeave={() => setActiveIndex(null)} role="img" aria-label="Hourly precipitation amount and probability chart">
            {ticks.map((v, i) => (
              <g key={i}>
                <line x1={PAD.left} x2={width - PAD.right} y1={y(v)} y2={y(v)} className="fc-grid" />
                <text x={PAD.left - 6} y={y(v) + 3} className="fc-axis" textAnchor="end">{v >= 1 ? v.toFixed(1) : v.toFixed(2)}</text>
              </g>
            ))}
            {buckets.map((bucket, i) => {
              const h = Math.max(1.5, y(0) - y(bucket.amount))
              const pop = bucket.period?.probabilityOfPrecipitation?.value
              const active = activeIndex === i
              return (
                <g key={i}>
                  <rect
                    x={x(i) - barW / 2}
                    y={y(bucket.amount)}
                    width={barW}
                    height={h}
                    rx={2}
                    className={`fc-bar fc-bar-hourly ${active ? 'fc-active' : ''}`}
                    style={{ '--pop': Math.min(1, (pop ?? 0) / 100) }}
                  />
                  {pop != null && pop >= 20 && (
                    <circle cx={x(i)} cy={y(bucket.amount) - 7} r={2.2} className="fc-popdot" />
                  )}
                </g>
              )
            })}
            {buckets.map((bucket, i) => i % labelEvery === 0 && (
              <text key={`l-${i}`} x={x(i)} y={CHART_HEIGHT - 8} className="fc-axis" textAnchor="middle">{hourlyTimeLabel(bucket.start)}</text>
            ))}
            {activeIndex !== null && (
              <line x1={x(activeIndex)} x2={x(activeIndex)} y1={PAD.top} y2={PAD.top + plotH} className="fc-crosshair" />
            )}
          </svg>
          <ChartTooltip xPct={activeIndex === null ? null : (x(activeIndex) / width) * 100}>
            {activeIndex !== null && buckets[activeIndex] && (
              <>
                <strong>{new Date(buckets[activeIndex].start).toLocaleString([], { weekday: 'short', hour: 'numeric' })}</strong>
                <span>{buckets[activeIndex].amount < 0.01 ? 'Trace' : `${buckets[activeIndex].amount.toFixed(2)} ${unit}`} expected{buckets[activeIndex].period?.probabilityOfPrecipitation?.value != null ? ` · ${buckets[activeIndex].period.probabilityOfPrecipitation.value}% chance` : ''}</span>
                {buckets[activeIndex].period?.shortForecast && <span>{buckets[activeIndex].period.shortForecast}</span>}
              </>
            )}
          </ChartTooltip>
        </div>
      )}
      <p className="fc-note">Hourly amounts prorated from the official NWS QPF grid; dots mark hours with ≥20% precipitation chance.</p>
    </div>
  )
}

// ── Chart 3: daily high / low temperatures ──────────────────────────────────
function buildDailyTemps(periods) {
  const days = new Map()
  for (const period of periods || []) {
    const start = Date.parse(period.startTime)
    if (!Number.isFinite(start)) continue
    const tempF = temperatureToFahrenheit(period.temperature, period.temperatureUnit || 'F')
    if (!Number.isFinite(tempF)) continue
    const key = new Date(start).toDateString()
    const entry = days.get(key) || { date: start, high: null, low: null, label: dayLabel(start) }
    if (period.isDaytime) entry.high = entry.high === null ? tempF : Math.max(entry.high, tempF)
    else entry.low = entry.low === null ? tempF : Math.min(entry.low, tempF)
    days.set(key, entry)
  }
  // Fill gaps: carry the nearest known value so lines stay continuous.
  const list = [...days.values()].sort((a, b) => a.date - b.date).slice(0, 8)
  let lastHigh = null
  let lastLow = null
  return list.map(day => {
    if (day.high !== null) lastHigh = day.high
    if (day.low !== null) lastLow = day.low
    return { ...day, high: day.high ?? lastHigh, low: day.low ?? lastLow }
  })
}

function TempChart({ periods, units }) {
  const [wrapRef, width] = useElementWidth()
  const days = useMemo(() => buildDailyTemps(periods), [periods])
  const [activeIndex, setActiveIndex] = useState(null)
  const plotW = width - PAD.left - PAD.right
  const plotH = CHART_HEIGHT - PAD.top - PAD.bottom
  const values = days.flatMap(d => [d.high, d.low]).filter(v => v !== null)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = Math.max(4, max - min)
  const lo = min - span * 0.15
  const hi = max + span * 0.15
  const y = value => PAD.top + plotH - ((value - lo) / (hi - lo)) * plotH
  const x = index => PAD.left + (days.length === 1 ? plotW / 2 : (index / (days.length - 1)) * plotW)

  const move = event => {
    if (!days.length) return
    const rect = event.currentTarget.getBoundingClientRect()
    const ratio = (event.clientX - rect.left) / rect.width
    setActiveIndex(Math.max(0, Math.min(days.length - 1, Math.round(ratio * (days.length - 1)))))
  }
  const path = key => days.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(d[key]).toFixed(1)}`).join(' ')
  const area = key => `${path(key)} L${x(days.length - 1).toFixed(1)},${(PAD.top + plotH).toFixed(1)} L${x(0).toFixed(1)},${(PAD.top + plotH).toFixed(1)} Z`
  const ticks = [lo + (hi - lo) * 0.15, (lo + hi) / 2, hi - (hi - lo) * 0.15]

  return (
    <div className="fc-card" ref={wrapRef}>
      <div className="fc-card-head">
        <div><span className="eyebrow">HIGH / LOW TEMPERATURE</span><strong>Daily forecast extremes</strong></div>
        <div className="fc-legend"><span className="fc-key fc-key-high">High</span><span className="fc-key fc-key-low">Low</span></div>
      </div>
      {!days.length ? <EmptyState text="Daily temperature forecast is not available yet." /> : (
        <div className="fc-plot-wrap">
          <svg width={width} height={CHART_HEIGHT} onMouseMove={move} onMouseLeave={() => setActiveIndex(null)} role="img" aria-label="Daily high and low temperature chart">
            {ticks.map((v, i) => (
              <g key={i}>
                <line x1={PAD.left} x2={width - PAD.right} y1={y(v)} y2={y(v)} className="fc-grid" />
                <text x={PAD.left - 6} y={y(v) + 3} className="fc-axis" textAnchor="end">{formatTemperature(v, units)}</text>
              </g>
            ))}
            <path d={area('low')} className="fc-area fc-area-low" />
            <path d={area('high')} className="fc-area fc-area-high" />
            <path d={path('low')} className="fc-line fc-line-low" />
            <path d={path('high')} className="fc-line fc-line-high" />
            {days.map((d, i) => (
              <g key={i}>
                {d.high !== null && <circle cx={x(i)} cy={y(d.high)} r={activeIndex === i ? 4.5 : 3} className="fc-dot fc-dot-high" />}
                {d.low !== null && <circle cx={x(i)} cy={y(d.low)} r={activeIndex === i ? 4.5 : 3} className="fc-dot fc-dot-low" />}
                <text x={x(i)} y={CHART_HEIGHT - 8} className="fc-axis" textAnchor="middle">{d.label}</text>
              </g>
            ))}
            {activeIndex !== null && days[activeIndex] && (
              <line x1={x(activeIndex)} x2={x(activeIndex)} y1={PAD.top} y2={PAD.top + plotH} className="fc-crosshair" />
            )}
          </svg>
          <ChartTooltip xPct={activeIndex === null || !days[activeIndex] ? null : (x(activeIndex) / width) * 100}>
            {activeIndex !== null && days[activeIndex] && (
              <>
                <strong>{new Date(days[activeIndex].date).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}</strong>
                <span>High {formatTemperature(days[activeIndex].high, units)} · Low {formatTemperature(days[activeIndex].low, units)}</span>
              </>
            )}
          </ChartTooltip>
        </div>
      )}
    </div>
  )
}

function EmptyState({ text }) {
  return <div className="fc-empty"><WeatherDeskIcon name="info" size={20} /><span>{text}</span></div>
}

export default function ForecastCharts({ weather, units = 'imperial' }) {
  const hourly = useMemo(() => (weather?.hourly?.periods || []).slice(0, 24), [weather])
  return (
    <section className="dashboard-section forecast-charts-section">
      <div className="section-title-row">
        <div>
          <div className="eyebrow">FORECAST TRENDS</div>
          <h2>Precipitation & temperature outlook</h2>
          <p>Interactive charts built from the official NWS hourly and grid forecast. Hover any chart for details.</p>
        </div>
      </div>
      <div className="forecast-charts-grid">
        <PrecipTimingChart hourly={hourly} />
        <HourlyPrecipChart grid={weather?.grid} hourly={hourly} units={units} />
        <PrecipIntensityChart grid={weather?.grid} units={units} />
        <TempChart periods={weather?.forecast?.periods} units={units} />
      </div>
    </section>
  )
}

import React from 'react'
import { WeatherDeskIcon } from './WeatherIcons'
import {
  calculateHeatIndex,
  calculateWindChill,
  getDewPointCategory,
  getWindDescription,
  formatTemperature,
  convertTemperature,
  convertWindSpeed,
  observationValue
} from '../services/weatherData'
import './WeatherMetrics.css'

// NWS station observations arrive in SI units (degC, km/h). The comfort indices
// are defined in Fahrenheit and mph, so convert once here instead of feeding
// Celsius straight into a Fahrenheit formula.
export default function WeatherMetrics({ observation, settings, _grid }) {
  // observationValue() reads the NWS unitCode for each field, so degC and km/h
  // are converted rather than silently treated as degrees Fahrenheit.
  const temperatureF = observationValue(observation, 'temperature', convertTemperature)
  const humidity = observationValue(observation, 'relativeHumidity')
  const windMph = observationValue(observation, 'windSpeed', convertWindSpeed)
  const dewPointF = observationValue(observation, 'dewpoint', convertTemperature)

  const heatIndex = calculateHeatIndex(temperatureF, humidity)
  const windChill = calculateWindChill(temperatureF, windMph)
  const dewPointInfo = getDewPointCategory(dewPointF)
  const windDesc = getWindDescription(windMph)

  const windDisplay = windMph === null
    ? 'N/A'
    : settings.units === 'metric'
      ? `${Math.round(windMph * 1.60934)} km/h`
      : `${Math.round(windMph)} mph`

  const metrics = [
    {
      icon: 'temperature',
      label: 'Heat Index',
      value: heatIndex !== null ? formatTemperature(heatIndex, settings.units) : 'N/A',
      subtext: heatIndex !== null && temperatureF !== null && heatIndex > temperatureF ? 'Feels warmer' : 'Not applicable',
      color: heatIndex !== null && heatIndex > 105 ? '#ff5c68' : '#67b7ff'
    },
    {
      icon: 'wind',
      label: 'Wind Chill',
      value: windChill !== null ? formatTemperature(windChill, settings.units) : 'N/A',
      subtext: windChill !== null && temperatureF !== null && windChill < temperatureF ? 'Feels colder' : 'Not applicable',
      color: windChill !== null && windChill < 20 ? '#67b7ff' : '#6ee7f9'
    },
    {
      icon: 'dewpoint',
      label: 'Dew Point',
      value: dewPointF !== null ? formatTemperature(dewPointF, settings.units) : 'N/A',
      subtext: dewPointInfo.category,
      color: dewPointInfo.color
    },
    {
      icon: 'windDirection',
      label: 'Wind Conditions',
      value: windDisplay,
      subtext: windDesc,
      color: '#ffd166'
    }
  ]

  return (
    <section className="weather-metrics-section">
      <div className="metrics-header">
        <span className="metrics-eyebrow">ADVANCED METRICS</span>
        <h2>Comfort Index</h2>
        <p>Calculated from the latest station report: heat index, wind chill, dew point, and wind character.</p>
      </div>
      <div className="metrics-grid">
        {metrics.map((metric, index) => (
          <article key={index} className="metric-card enhanced">
            <div className="metric-icon-wrapper" style={{ borderColor: metric.color }}>
              <WeatherDeskIcon name={metric.icon} size={24} style={{ color: metric.color }} />
            </div>
            <div className="metric-content">
              <span className="metric-label">{metric.label}</span>
              <strong className="metric-value" style={{ color: metric.color }}>{metric.value}</strong>
              <small className="metric-subtext">{metric.subtext}</small>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

import React from 'react'
import { WeatherDeskIcon } from './WeatherIcons'
import { calculateHeatIndex, calculateWindChill, getDewPointCategory, getWindDescription, formatTemperature } from '../services/weatherData'
import './WeatherMetrics.css'

export default function WeatherMetrics({ observation, settings, _grid }) {
  const temp = observation?.temperature?.value
  const humidity = observation?.relativeHumidity?.value
  const windSpeed = observation?.windSpeed?.value
  const dewPoint = observation?.dewpoint?.value

  const heatIndex = calculateHeatIndex(temp, humidity)
  const windChill = calculateWindChill(temp, windSpeed)
  const dewPointInfo = getDewPointCategory(dewPoint)
  const windDesc = getWindDescription(windSpeed)

  const metrics = [
    {
      icon: 'temperature',
      label: 'Heat Index',
      value: heatIndex !== null ? formatTemperature(heatIndex, settings.units) : 'N/A',
      subtext: heatIndex !== null && heatIndex > temp ? 'Feels warmer' : 'Not applicable',
      color: heatIndex !== null && heatIndex > 105 ? '#ff5c68' : '#67b7ff'
    },
    {
      icon: 'wind',
      label: 'Wind Chill',
      value: windChill !== null ? formatTemperature(windChill, settings.units) : 'N/A',
      subtext: windChill !== null && windChill < temp ? 'Feels colder' : 'Not applicable',
      color: windChill !== null && windChill < 20 ? '#67b7ff' : '#6ee7f9'
    },
    {
      icon: 'dewpoint',
      label: 'Dew Point',
      value: dewPoint !== null ? formatTemperature(dewPoint, settings.units) : 'N/A',
      subtext: dewPointInfo.category,
      color: dewPointInfo.color
    },
    {
      icon: 'windDirection',
      label: 'Wind Conditions',
      value: windSpeed !== null ? `${Math.round(windSpeed)} mph` : 'N/A',
      subtext: windDesc,
      color: '#ffd166'
    }
  ]

  return (
    <section className="weather-metrics-section">
      <div className="metrics-header">
        <span className="metrics-eyebrow">ADVANCED METRICS</span>
        <h2>Comfort Index</h2>
        <p>Calculated indices based on current conditions</p>
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

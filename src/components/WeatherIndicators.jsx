import React from 'react'
import './WeatherIndicators.css'

const WeatherIndicators = ({ data }) => {
  if (!data) return null

  const {
    main: { humidity },
    wind: { speed },
    visibility,
    uv
  } = data

  const indicators = [
    {
      label: 'Humidity',
      value: `${humidity}%`,
      icon: '💧'
    },
    {
      label: 'Wind Speed',
      value: `${Math.round(speed)} mph`,
      icon: '💨'
    },
    {
      label: 'UV Index',
      value: uv || 'Moderate',
      icon: '☀️'
    },
    {
      label: 'Visibility',
      value: visibility !== null && visibility !== undefined && !isNaN(visibility) ? `${(visibility * 0.000621371).toFixed(1)} miles` : '10 miles',
      icon: '👁️'
    },
    {
      label: 'Air Quality',
      value: 'Good',
      icon: '🌬️'
    }
  ]

  return (
    <section className="weather-indicators-section">
      <div className="container">
        <div className="weather-indicators">
          {indicators.map((indicator, index) => (
            <div key={index} className="indicator">
              <div className="indicator-icon">
                {indicator.icon}
              </div>
              <div className="indicator-value">
                {indicator.value}
              </div>
              <div className="indicator-label">
                {indicator.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default WeatherIndicators

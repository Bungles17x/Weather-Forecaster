import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import TenDayForecast from '../components/TenDayForecast'
import HourlyForecast from '../components/HourlyForecast'
import CurrentWeather from '../components/CurrentWeather'
import Header from '../components/Header'
import './ForecastPage.css'

const ForecastPage = () => {
  const [weatherData, setWeatherData] = useState(null)
  const [forecastData, setForecastData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Load sample data for demo
    const loadForecastData = () => {
      setLoading(true)
      setTimeout(() => {
        // Sample forecast data
        const sampleForecast = Array.from({ length: 40 }, (_, i) => ({
          dt: Date.now() / 1000 + (i * 3 * 3600), // Every 3 hours
          main: {
            temp: 72 + Math.sin(i * 0.5) * 10,
            humidity: 65 + Math.random() * 20,
            pressure: 1013 + Math.random() * 10
          },
          weather: [{
            main: ['Clear', 'Clouds', 'Rain', 'Snow'][Math.floor(Math.random() * 4)],
            description: 'Sample weather',
            icon: '01d'
          }],
          wind: {
            speed: 5 + Math.random() * 10,
            deg: Math.random() * 360
          },
          dt_txt: new Date(Date.now() + i * 3 * 3600 * 1000).toLocaleString()
        }))

        setForecastData(sampleForecast)
        setLoading(false)
      }, 1000)
    }

    loadForecastData()
  }, [])

  return (
    <div className="forecast-page">
      <Header />
      
      <div className="forecast-content">
        <div className="forecast-header">
          <div className="forecast-nav">
            <Link to="/" className="back-link">← Back to Weather</Link>
            <h1>Weather Forecast</h1>
            <div className="forecast-tabs">
              <button className="tab active">Hourly</button>
              <button className="tab">Daily</button>
              <button className="tab">Extended</button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="forecast-loading">
            <div className="loading-spinner"></div>
            <p>Loading forecast data...</p>
          </div>
        ) : error ? (
          <div className="forecast-error">
            <h3>Unable to load forecast</h3>
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>Retry</button>
          </div>
        ) : (
          <div className="forecast-sections">
            <section className="hourly-section">
              <h2>Hourly Forecast</h2>
              <HourlyForecast forecast={forecastData} location="Current Location" />
            </section>

            <section className="daily-section">
              <h2>10-Day Forecast</h2>
              <TenDayForecast forecast={forecastData} location="Current Location" />
            </section>

            <section className="forecast-summary">
              <h2>Forecast Summary</h2>
              <div className="summary-cards">
                <div className="summary-card">
                  <h3>Today</h3>
                  <p>Partly cloudy with a high of 75°F</p>
                  <div className="summary-icon">⛅</div>
                </div>
                <div className="summary-card">
                  <h3>Tomorrow</h3>
                  <p>Sunny with a high of 78°F</p>
                  <div className="summary-icon">☀️</div>
                </div>
                <div className="summary-card">
                  <h3>Weekend</h3>
                  <p>Mixed conditions, chance of rain</p>
                  <div className="summary-icon">🌧️</div>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}

export default ForecastPage

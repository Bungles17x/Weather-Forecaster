import React, { useState } from 'react'
import './HourlyForecast.css'
import { SmallWeatherIcon } from './WeatherIcons'

const HourlyForecast = ({ data }) => {
  const [selectedHour, setSelectedHour] = useState(null)
  const [expandedView, setExpandedView] = useState(false)
  const [alertPopup, setAlertPopup] = useState(null)
  
  if (!data || data.length === 0) return null

  // Get next 24 hours of data
  const hourlyData = data.slice(0, 24)

  const formatHour = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleTimeString([], { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const formatDay = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString([], { 
      weekday: 'short' 
    })
  }

  const isNow = (timestamp) => {
    const now = new Date()
    const hour = new Date(timestamp * 1000)
    return hour.getHours() === now.getHours() && 
           hour.getDate() === now.getDate()
  }

  const getWindDirection = (degrees) => {
    if (!degrees) return 'N'
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
    const index = Math.round(degrees / 45) % 8
    return directions[index]
  }

  const getPrecipitationColor = (pop) => {
    if (!pop || pop === 0) return 'rgba(255, 255, 255, 0.6)'
    if (pop < 20) return 'rgba(255, 255, 255, 0.8)'
    if (pop < 50) return '#4FC3F7'
    if (pop < 80) return '#2196F3'
    return '#1976D2'
  }

  const getTemperatureColor = (temp) => {
    if (temp < 32) return '#64B5F6'  // Freezing - Blue
    if (temp < 50) return '#81C784'  // Cold - Green
    if (temp < 70) return '#FFB74D'  // Cool - Orange
    if (temp < 85) return '#FF8A65'  // Warm - Red-Orange
    return '#EF5350'  // Hot - Red
  }

  const getHourType = (timestamp) => {
    const hour = new Date(timestamp * 1000).getHours()
    if (hour >= 6 && hour < 12) return 'morning'
    if (hour >= 12 && hour < 18) return 'afternoon'
    if (hour >= 18 && hour < 22) return 'evening'
    return 'night'
  }

  const getWeatherAlerts = (hour) => {
    const alerts = []
    const temp = hour.main?.temp || 0
    const windSpeed = hour.wind?.speed || 0
    const pop = hour.pop || 0
    const visibility = hour.visibility || 10000
    const humidity = hour.main?.humidity || 50
    
    // NWS Weather Warnings - Official National Weather Service terminology
    
    // TEMPERATURE WARNINGS, WATCHES, AND ADVISORIES
    if (temp >= 105) {
      alerts.push({
        type: 'excessive-heat-warning',
        icon: '🔥',
        title: 'Excessive Heat Warning',
        message: `Dangerously hot conditions. Heat index values up to ${Math.round(temp)}°F expected. Heat stroke likely.`,
        severity: 'extreme'
      })
    } else if (temp >= 100) {
      alerts.push({
        type: 'excessive-heat-watch',
        icon: '⚠️',
        title: 'Excessive Heat Watch',
        message: `Excessive heat possible. Heat index values may reach ${Math.round(temp)}°F. Monitor conditions.`,
        severity: 'high'
      })
    } else if (temp >= 95) {
      alerts.push({
        type: 'heat-advisory',
        icon: '🌡️',
        title: 'Heat Advisory',
        message: `Hot conditions expected. Heat index values up to ${Math.round(temp)}°F. Heat illnesses possible.`,
        severity: 'moderate'
      })
    } else if (temp >= 90) {
      alerts.push({
        type: 'heat-advisory',
        icon: '☀️',
        title: 'Heat Advisory',
        message: `Warm to hot conditions. Heat index up to ${Math.round(temp)}°F. Use caution outdoors.`,
        severity: 'low'
      })
    }
    
    // COLD WEATHER WARNINGS, WATCHES, AND ADVISORIES
    if (temp <= -20) {
      alerts.push({
        type: 'extreme-cold-warning',
        icon: '❄️',
        title: 'Extreme Cold Warning',
        message: `Dangerously cold wind chills. Wind chill values down to ${Math.round(temp)}°F expected. Frostbite possible in minutes.`,
        severity: 'extreme'
      })
    } else if (temp <= -10) {
      alerts.push({
        type: 'extreme-cold-watch',
        icon: '🥶',
        title: 'Extreme Cold Watch',
        message: `Extreme cold possible. Wind chill values may reach ${Math.round(temp)}°F. Prepare for dangerous cold.`,
        severity: 'high'
      })
    } else if (temp <= 0) {
      alerts.push({
        type: 'wind-chill-advisory',
        icon: '🌡️',
        title: 'Wind Chill Advisory',
        message: `Cold wind chills expected. Values down to ${Math.round(temp)}°F. Limit outdoor exposure.`,
        severity: 'moderate'
      })
    } else if (temp <= 32) {
      alerts.push({
        type: 'freeze-warning',
        icon: '🧊',
        title: 'Freeze Warning',
        message: `Sub-freezing temperatures expected. Low of ${Math.round(temp)}°F. Protect sensitive vegetation and pipes.`,
        severity: 'low'
      })
    }

    // WIND WARNINGS, WATCHES, AND ADVISORIES
    if (windSpeed >= 74) { // Hurricane force
      alerts.push({
        type: 'hurricane-force-wind-warning',
        icon: '🌀',
        title: 'Hurricane Force Wind Warning',
        message: `Dangerous hurricane force winds. Gusts to ${Math.round(windSpeed)} mph. Widespread damage expected.`,
        severity: 'extreme'
      })
    } else if (windSpeed >= 58) { // Severe thunderstorm winds
      alerts.push({
        type: 'severe-thunderstorm-warning',
        icon: '⛈️',
        title: 'Severe Thunderstorm Warning',
        message: `Severe thunderstorms with damaging winds. Gusts to ${Math.round(windSpeed)} mph. Seek shelter immediately.`,
        severity: 'extreme'
      })
    } else if (windSpeed >= 48) {
      alerts.push({
        type: 'high-wind-watch',
        icon: '💨',
        title: 'High Wind Watch',
        message: `High winds possible. Gusts may reach ${Math.round(windSpeed)} mph. Secure outdoor items.`,
        severity: 'high'
      })
    } else if (windSpeed >= 40) {
      alerts.push({
        type: 'high-wind-warning',
        icon: '🌬️',
        title: 'High Wind Warning',
        message: `Hazardous high winds expected. Gusts to ${Math.round(windSpeed)} mph. Property damage possible.`,
        severity: 'moderate'
      })
    } else if (windSpeed >= 25) {
      alerts.push({
        type: 'wind-advisory',
        icon: '�',
        title: 'Wind Advisory',
        message: `Breezy to windy conditions. Gusts to ${Math.round(windSpeed)} mph. Difficult driving conditions.`,
        severity: 'low'
      })
    }

    // PRECIPITATION WARNINGS, WATCHES, AND ADVISORIES
    if (pop >= 90) {
      alerts.push({
        type: 'flash-flood-warning',
        icon: '🌊',
        title: 'Flash Flood Warning',
        message: `Dangerous flash flooding possible. ${Math.round(pop)}% chance of heavy rain. Move to higher ground immediately.`,
        severity: 'extreme'
      })
    } else if (pop >= 80) {
      alerts.push({
        type: 'flood-warning',
        icon: '🌧️',
        title: 'Flood Warning',
        message: `Flooding expected. ${Math.round(pop)}% chance of heavy rainfall. Prepare for flooding immediately.`,
        severity: 'high'
      })
    } else if (pop >= 70) {
      alerts.push({
        type: 'flood-watch',
        icon: '⚠️',
        title: 'Flood Watch',
        message: `Flooding possible. ${Math.round(pop)}% chance of heavy rain. Monitor conditions closely and be prepared.`,
        severity: 'moderate'
      })
    } else if (pop >= 60) {
      alerts.push({
        type: 'hydrologic-advisory',
        icon: '💧',
        title: 'Hydrologic Advisory',
        message: `Elevated flood risk. ${Math.round(pop)}% chance of precipitation. Stay informed about conditions.`,
        severity: 'low'
      })
    }

    // VISIBILITY WARNINGS AND ADVISORIES
    if (visibility && visibility !== null && visibility !== undefined && !isNaN(visibility) && visibility <= 500) {
      alerts.push({
        type: 'dense-fog-advisory',
        icon: '🌫️',
        title: 'Dense Fog Advisory',
        message: `Visibility reduced to ${(visibility/1000).toFixed(1)} miles or less. Extreme driving hazard. Avoid travel if possible.`,
        severity: 'high'
      })
    } else if (visibility && visibility !== null && visibility !== undefined && !isNaN(visibility) && visibility <= 1000) {
      alerts.push({
        type: 'fog-advisory',
        icon: '👁️',
        title: 'Fog Advisory',
        message: `Visibility reduced to ${(visibility/1000).toFixed(1)} miles. Use extreme caution when traveling.`,
        severity: 'moderate'
      })
    } else if (visibility && visibility !== null && visibility !== undefined && !isNaN(visibility) && visibility <= 3000) {
      alerts.push({
        type: 'visibility-advisory',
        icon: '🌫️',
        title: 'Visibility Advisory',
        message: `Reduced visibility to ${(visibility/1000).toFixed(1)} miles. Hazardous driving conditions.`,
        severity: 'low'
      })
    }

    // WINTER WEATHER WARNINGS, WATCHES, AND ADVISORIES
    if (hour.weather && hour.weather[0]) {
      const condition = hour.weather[0].main.toLowerCase()
      
      if (condition === 'snow' || condition === 'blizzard') {
        if (temp <= 20 && pop >= 80) {
          alerts.push({
            type: 'winter-storm-warning',
            icon: '🌨️',
            title: 'Winter Storm Warning',
            message: `Heavy snow expected. Significant impacts to travel. ${Math.round(pop)}% chance of precipitation. Avoid travel.`,
            severity: 'extreme'
          })
        } else if (temp <= 25 && pop >= 70) {
          alerts.push({
            type: 'winter-storm-watch',
            icon: '⚠️',
            title: 'Winter Storm Watch',
            message: `Winter storm conditions possible. ${Math.round(pop)}% chance of heavy snow. Monitor forecasts and prepare.`,
            severity: 'high'
          })
        } else if (temp <= 32 && pop >= 60) {
          alerts.push({
            type: 'winter-weather-advisory',
            icon: '❄️',
            title: 'Winter Weather Advisory',
            message: `Snow expected. Travel impacts possible. ${Math.round(pop)}% chance of precipitation. Use caution traveling.`,
            severity: 'moderate'
          })
        } else if (pop >= 40) {
          alerts.push({
            type: 'winter-weather-advisory',
            icon: '🌨️',
            title: 'Winter Weather Advisory',
            message: `Light snow possible. Minor travel impacts. ${Math.round(pop)}% chance of precipitation.`,
            severity: 'low'
          })
        }
      }
      
      if (condition === 'thunderstorm' || condition === 'severe thunderstorm') {
        if (windSpeed >= 58) {
          alerts.push({
            type: 'severe-thunderstorm-warning',
            icon: '⛈️',
            title: 'Severe Thunderstorm Warning',
            message: `Severe thunderstorms with destructive winds and large hail. Seek shelter now. ${Math.round(pop)}% chance.`,
            severity: 'extreme'
          })
        } else if (windSpeed >= 40) {
          alerts.push({
            type: 'severe-thunderstorm-watch',
            icon: '⚡',
            title: 'Severe Thunderstorm Watch',
            message: `Severe thunderstorms possible. Monitor conditions and be ready to act. ${Math.round(pop)}% chance.`,
            severity: 'high'
          })
        } else if (pop >= 50) {
          alerts.push({
            type: 'thunderstorm-advisory',
            icon: '🌩️',
            title: 'Thunderstorm Advisory',
            message: `Thunderstorms expected. ${Math.round(pop)}% chance of precipitation. Move indoors during storms.`,
            severity: 'moderate'
          })
        }
      }
      
      if (condition === 'freezing rain' || (temp <= 32 && pop >= 70)) {
        alerts.push({
          type: 'freezing-rain-advisory',
          icon: '🧊',
          title: 'Freezing Rain Advisory',
          message: `Freezing rain possible. ${Math.round(pop)}% chance. Extremely hazardous travel conditions. Avoid travel.`,
          severity: 'high'
        })
      }
      
      if (condition === 'sleet' || (temp <= 32 && pop >= 60)) {
        alerts.push({
          type: 'winter-weather-advisory',
          icon: '🌨️',
          title: 'Winter Weather Advisory',
          message: `Sleet expected. ${Math.round(pop)}% chance. Hazardous travel conditions. Use extreme caution.`,
          severity: 'moderate'
        })
      }
    }

    // FIRE WEATHER WARNINGS, WATCHES, AND ADVISORIES
    if (humidity <= 15 && temp >= 95) {
      alerts.push({
        type: 'red-flag-warning',
        icon: '🔥',
        title: 'Red Flag Warning',
        message: `Critical fire weather conditions. Low humidity and high temperatures. Extreme fire danger. No outdoor burning.`,
        severity: 'extreme'
      })
    } else if (humidity <= 20 && temp >= 90) {
      alerts.push({
        type: 'fire-weather-watch',
        icon: '⚠️',
        title: 'Fire Weather Watch',
        message: `Elevated fire danger. Low humidity and warm temperatures. Be fire aware and prepared.`,
        severity: 'high'
      })
    } else if (humidity <= 25 && temp >= 85) {
      alerts.push({
        type: 'fire-weather-advisory',
        icon: '🔥',
        title: 'Fire Weather Advisory',
        message: `Increased fire danger. ${humidity}% humidity with ${Math.round(temp)}°F. Use caution with fire.`,
        severity: 'moderate'
      })
    }

    // SPECIAL WEATHER ADVISORIES
    if (humidity >= 90 && temp >= 75) {
      alerts.push({
        type: 'heat-advisory',
        icon: '🌡️',
        title: 'Heat Advisory',
        message: `High heat and humidity. Heat index values up to ${Math.round(temp)}°F. Heat stress likely. Stay hydrated.`,
        severity: 'moderate'
      })
    }
    
    if (humidity >= 95 && temp >= 80) {
      alerts.push({
        type: 'special-weather-advisory',
        icon: '💧',
        title: 'Special Weather Advisory',
        message: `Extreme humidity with high heat. ${humidity}% humidity and ${Math.round(temp)}°F. Dangerous heat stress.`,
        severity: 'high'
      })
    }

    // COASTAL AND MARINE ADVISORIES (if applicable)
    if (windSpeed >= 35 && pop >= 70) {
      alerts.push({
        type: 'coastal-flood-advisory',
        icon: '🌊',
        title: 'Coastal Flood Advisory',
        message: `Coastal flooding possible with strong winds and heavy rain. ${Math.round(pop)}% chance of precipitation.`,
        severity: 'moderate'
      })
    }

    // AIR QUALITY ADVISORIES
    if (humidity <= 30 && temp >= 85) {
      alerts.push({
        type: 'air-quality-advisory',
        icon: '💨',
        title: 'Air Quality Advisory',
        message: `Poor air quality possible due to weather conditions. Limit outdoor exertion if sensitive.`,
        severity: 'low'
      })
    }

    return alerts
  }

  const handleHourClick = (index) => {
    const hour = hourlyData[index]
    const alerts = getWeatherAlerts(hour)
    
    if (alerts.length > 0) {
      setAlertPopup({
        hour: hour,
        alerts: alerts,
        time: formatHour(hour.dt)
      })
    }
    
    setSelectedHour(selectedHour === index ? null : index)
  }

  const closeAlertPopup = () => {
    setAlertPopup(null)
  }

  const toggleExpandedView = () => {
    setExpandedView(!expandedView)
  }

  return (
    <section id="hourly-forecast" className="hourly-forecast">
      <div className="container">
        <div className="hourly-header">
          <h2 className="section-title">Hourly Forecast</h2>
          <div className="hourly-subtitle">Next 24 hours</div>
          <button className="expand-toggle-btn" onClick={toggleExpandedView}>
            {expandedView ? 'Compact View' : 'Expanded View'}
          </button>
        </div>
        
        <div className="hourly-scroll-container">
          <div className={`hourly-scroll ${expandedView ? 'expanded' : ''}`}>
            <div className="hourly-items">
              {hourlyData.map((hour, index) => {
                const hourType = getHourType(hour.dt)
                const isSelected = selectedHour === index
                const temp = hour.main?.temp || 0
                const pop = hour.pop || 0
                const windSpeed = hour.wind?.speed || 0
                const windDir = getWindDirection(hour.wind?.deg)
                
                return (
                  <div 
                    key={index} 
                    className={`hourly-item ${hourType} ${isSelected ? 'selected' : ''} ${isNow(hour.dt) ? 'now' : ''}`}
                    onClick={() => handleHourClick(index)}
                  >
                    {isNow(hour.dt) && (
                      <div className="now-badge">NOW</div>
                    )}
                    
                    <div className="hourly-time">
                      <div className="hour">{formatHour(hour.dt)}</div>
                      <div className="day">{formatDay(hour.dt)}</div>
                    </div>
                    
                    <div className="hourly-icon">
                      {hour.weather && hour.weather[0] && 
                        <SmallWeatherIcon condition={hour.weather[0].description} size={expandedView ? 48 : 32} />
                      }
                    </div>
                    
                    <div className="hourly-temp" style={{ color: getTemperatureColor(temp) }}>
                      <div className="temp">{Math.round(temp)}°</div>
                      {expandedView && (
                        <div className="temp-range">
                          {Math.round(hour.main?.temp_min || temp)}° / {Math.round(hour.main?.temp_max || temp)}°
                        </div>
                      )}
                    </div>
                    
                    <div className="hourly-condition">
                      <div className="condition">{hour.weather && hour.weather[0] ? hour.weather[0].main : 'N/A'}</div>
                      {expandedView && hour.weather && hour.weather[0] && (
                        <div className="description">{hour.weather[0].description}</div>
                      )}
                    </div>
                    
                    <div className="hourly-precipitation" style={{ color: getPrecipitationColor(pop) }}>
                      <div className="precip-icon">💧</div>
                      <div className="precip-value">{pop > 0 ? `${Math.round(pop * 100)}%` : '--'}</div>
                    </div>
                    
                    <div className="hourly-wind">
                      <div className="wind-speed">{Math.round(windSpeed)} mph</div>
                      {expandedView && (
                        <div className="wind-dir">{windDir}</div>
                      )}
                    </div>
                    
                    {isSelected && expandedView && (
                      <div className="hourly-details">
                        <div className="detail-row">
                          <span className="detail-label">Feels Like:</span>
                          <span className="detail-value">{Math.round(hour.main?.feels_like || temp)}°</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Humidity:</span>
                          <span className="detail-value">{hour.main?.humidity || '--'}%</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Pressure:</span>
                          <span className="detail-value">{hour.main?.pressure || '--'} mb</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Wind Gusts:</span>
                          <span className="detail-value">{hour.wind?.gust ? `${Math.round(hour.wind.gust)} mph` : 'None'}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Visibility:</span>
                          <span className="detail-value">{hour.visibility ? `${(hour.visibility / 1000).toFixed(1)} km` : 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">UV Index:</span>
                          <span className="detail-value">--</span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        
        {/* Weather Alert Popup */}
        {alertPopup && (
          <div className="weather-alert-overlay" onClick={closeAlertPopup}>
            <div className="weather-alert-popup" onClick={(e) => e.stopPropagation()}>
              <div className="alert-popup-header">
                <h3>Weather Alerts for {alertPopup.time}</h3>
                <button className="alert-popup-close" onClick={closeAlertPopup}>✕</button>
              </div>
              
              <div className="alert-popup-content">
                {alertPopup.alerts.map((alert, index) => (
                  <div key={index} className={`alert-item alert-${alert.severity}`}>
                    <div className="alert-icon-large">{alert.icon}</div>
                    <div className="alert-content">
                      <h4 className="alert-title">{alert.title}</h4>
                      <p className="alert-message">{alert.message}</p>
                      <div className="alert-severity">
                        Severity: <span className={`severity-${alert.severity}`}>{alert.severity.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {alertPopup.alerts.length === 0 && (
                  <div className="no-alerts">
                    <div className="no-alerts-icon">✅</div>
                    <h4>No Weather Alerts</h4>
                    <p>Conditions are normal for this time period.</p>
                  </div>
                )}
              </div>
              
              <div className="alert-popup-footer">
                <button className="alert-popup-btn" onClick={closeAlertPopup}>
                  Close Alerts
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default HourlyForecast

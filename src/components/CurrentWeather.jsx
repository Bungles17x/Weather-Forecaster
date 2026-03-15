import React, { useState, useEffect } from 'react'
import './CurrentWeather.css'
import { WeatherIcon } from './WeatherIcons'
import WeatherAlerts from './WeatherAlerts'

// Fixed getUVIndex function - cache refresh

const CurrentWeather = ({ data }) => {
  const [selectedAlert, setSelectedAlert] = useState(null)

  const handleAlertClick = (alert) => {
    setSelectedAlert(selectedAlert?.id === alert.id ? null : alert)
  }

  const closeAlertDetails = () => {
    setSelectedAlert(null)
  }

  if (!data) return null

  const {
    main: { temp, feels_like, humidity, pressure, temp_min, temp_max },
    weather: [{ description }],
    wind: { speed, deg, gust },
    visibility,
    sys: { sunrise, sunset, country },
    name,
    dt,
    clouds: { all }
  } = data

  const getWindDirection = (degrees) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
    const index = Math.round(degrees / 45) % 8
    return directions[index]
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString([], {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    })
  }

  const isDaytime = () => {
    const currentTime = dt * 1000
    const sunriseTime = sunrise * 1000
    const sunsetTime = sunset * 1000
    return currentTime >= sunriseTime && currentTime <= sunsetTime
  }

  const getUVIndex = () => {
    // Simplified UV index calculation based on cloud cover and time
    const hour = new Date(dt * 1000).getHours()
    const midday = hour >= 11 && hour <= 15
    const cloudFactor = 1 - (all / 100)
    let uvIndex = 0
    
    if (isDaytime() && midday) {
      uvIndex = Math.round(8 * cloudFactor)
    } else if (isDaytime()) {
      uvIndex = Math.round(4 * cloudFactor)
    }
    
    return Math.max(0, Math.min(11, uvIndex))
  }

  const getUVLevel = (index) => {
    if (index <= 2) return { level: 'Low', color: '#00ff00' }
    if (index <= 5) return { level: 'Moderate', color: '#ffff00' }
    if (index <= 7) return { level: 'High', color: '#ff8800' }
    if (index <= 10) return { level: 'Very High', color: '#ff0000' }
    return { level: 'Extreme', color: '#8b0000' }
  }

  const getDewPoint = () => {
    // Simplified dew point calculation
    const a = 17.27
    const b = 237.7
    const alpha = ((a * temp) / (b + temp)) + Math.log(humidity / 100)
    const dewPoint = (b * alpha) / (a - alpha)
    return Math.round(dewPoint)
  }

  const getComfortIndex = () => {
    const dewPoint = getDewPoint()
    const tempDiff = Math.abs(temp - dewPoint)
    
    if (tempDiff > 15) return { level: 'Very Comfortable', color: '#00ff00' }
    if (tempDiff > 10) return { level: 'Comfortable', color: '#90ee90' }
    if (tempDiff > 5) return { level: 'Muggy', color: '#ffa500' }
    return { level: 'Very Muggy', color: '#ff6347' }
  }

  const getVisibilityDescription = (vis) => {
    if (!vis) return 'N/A'
    const visKm = vis / 1000
    if (visKm >= 10) return 'Excellent'
    if (visKm >= 5) return 'Good'
    if (visKm >= 2) return 'Fair'
    if (visKm >= 1) return 'Poor'
    return 'Very Poor'
  }

  const getAirQuality = () => {
    // Simplified air quality based on weather conditions
    let aqi = 50 // Base moderate
    
    if (humidity > 80) aqi += 20
    if (visibility < 5000) aqi += 30
    if (pressure < 1000) aqi += 10
    
    if (aqi <= 50) return { level: 'Good', color: '#00e400' }
    if (aqi <= 100) return { level: 'Moderate', color: '#ffff00' }
    if (aqi <= 150) return { level: 'Unhealthy for Sensitive', color: '#ff7e00' }
    return { level: 'Unhealthy', color: '#ff0000' }
  }

  const uvIndex = getUVIndex()
  const uvLevel = getUVLevel(uvIndex)
  const comfortIndex = getComfortIndex()
  const airQuality = getAirQuality()

  const currentTime = new Date().toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  })

  return (
    <section className="main-weather">
      <div className="container">
        <div className="current-weather-display">
          {/* Location and Time */}
          <div className="location-header">
            <div className="location-info">
              <h1 className="location-name">{name}, {country}</h1>
              <div className="current-time">{currentTime}</div>
              <div className="current-date">{formatDate(dt)}</div>
              <div className="day-night-indicator">
                {isDaytime() ? '☀️ Daytime' : '🌙 Nighttime'}
              </div>
            </div>
            
            <div className="last-updated">
              Updated {formatTime(dt)}
            </div>
          </div>

          {/* Main Weather Display */}
          <div className="weather-main">
            <div className="weather-icon-section">
              <div className="weather-icon-large">
                <WeatherIcon condition={description} size={120} />
              </div>
              <div className="temperature-display">
                <div className="current-temp">{Math.round(temp)}°</div>
                <div className="feels-like">Feels like {Math.round(feels_like)}°</div>
              </div>
            </div>
            
            <div className="weather-details">
              <div className="condition-text">
                {description.charAt(0).toUpperCase() + description.slice(1)}
              </div>
              <div className="high-low">
                <span>H: {Math.round(temp_max)}°</span>
                <span>L: {Math.round(temp_min)}°</span>
              </div>
            </div>
          </div>

          {/* Weather Alerts */}
          <WeatherAlerts coordinates={data?.coord ? { latitude: data.coord.lat, longitude: data.coord.lon } : null} />

          {/* Alert Details Modal */}
          {selectedAlert && (
            <div className="alert-details-overlay" onClick={closeAlertDetails}>
              <div className="alert-details-modal" onClick={(e) => e.stopPropagation()}>
                <div className="alert-details-header">
                  <h3>{selectedAlert.title}</h3>
                  <button className="alert-details-close" onClick={closeAlertDetails}>✕</button>
                </div>
                
                <div className="alert-details-content">
                  <div className="alert-details-main">
                    <div className="alert-details-icon-large">{selectedAlert.icon}</div>
                    <div className="alert-details-info">
                      <div className="alert-details-title">{selectedAlert.title}</div>
                      <div className="alert-details-message">{selectedAlert.message}</div>
                      
                      {/* Full NWS Alert Details */}
                      {selectedAlert.source === 'NWS' && (
                        <div className="nws-alert-details">
                          <div className="nws-alert-section">
                            <h4>Official Information</h4>
                            <div className="nws-info-grid">
                              {selectedAlert.event && (
                                <div className="nws-info-item">
                                  <span className="nws-label">Event Type:</span>
                                  <span className="nws-value">{selectedAlert.event}</span>
                                </div>
                              )}
                              {selectedAlert.senderName && (
                                <div className="nws-info-item">
                                  <span className="nws-label">Issued By:</span>
                                  <span className="nws-value">{selectedAlert.senderName}</span>
                                </div>
                              )}
                              {selectedAlert.nwsId && (
                                <div className="nws-info-item">
                                  <span className="nws-label">Alert ID:</span>
                                  <span className="nws-value">{selectedAlert.nwsId}</span>
                                </div>
                              )}
                              {selectedAlert.category && (
                                <div className="nws-info-item">
                                  <span className="nws-label">Category:</span>
                                  <span className="nws-value">{selectedAlert.category}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Timing Information */}
                          <div className="nws-alert-section">
                            <h4>Timing</h4>
                            <div className="nws-timing-grid">
                              {selectedAlert.effective && (
                                <div className="nws-timing-item">
                                  <span className="nws-label">Effective:</span>
                                  <span className="nws-value">{new Date(selectedAlert.effective).toLocaleString()}</span>
                                </div>
                              )}
                              {selectedAlert.expires && (
                                <div className="nws-timing-item">
                                  <span className="nws-label">Expires:</span>
                                  <span className="nws-value">{new Date(selectedAlert.expires).toLocaleString()}</span>
                                </div>
                              )}
                              {selectedAlert.onset && (
                                <div className="nws-timing-item">
                                  <span className="nws-label">Onset:</span>
                                  <span className="nws-value">{new Date(selectedAlert.onset).toLocaleString()}</span>
                                </div>
                              )}
                              {selectedAlert.ends && (
                                <div className="nws-timing-item">
                                  <span className="nws-label">Ends:</span>
                                  <span className="nws-value">{new Date(selectedAlert.ends).toLocaleString()}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Affected Areas */}
                          {selectedAlert.areas && (
                            <div className="nws-alert-section">
                              <h4>Affected Areas</h4>
                              <div className="nws-areas">
                                <span className="nws-areas-text">{selectedAlert.areas}</span>
                              </div>
                            </div>
                          )}

                          {/* Safety Instructions */}
                          {selectedAlert.instruction && (
                            <div className="nws-alert-section">
                              <h4>Safety Instructions</h4>
                              <div className="nws-instructions">
                                <p>{selectedAlert.instruction}</p>
                              </div>
                            </div>
                          )}

                          {/* Full Description */}
                          {selectedAlert.description && selectedAlert.description !== selectedAlert.message && (
                            <div className="nws-alert-section">
                              <h4>Full Description</h4>
                              <div className="nws-description">
                                <p>{selectedAlert.description}</p>
                              </div>
                            </div>
                          )}

                          {/* Contact Information */}
                          {selectedAlert.contact && (
                            <div className="nws-alert-section">
                              <h4>Contact Information</h4>
                              <div className="nws-contact">
                                <p>{selectedAlert.contact}</p>
                              </div>
                            </div>
                          )}

                          {/* Web Link */}
                          {selectedAlert.web && (
                            <div className="nws-alert-section">
                              <h4>More Information</h4>
                              <div className="nws-web">
                                <a href={selectedAlert.web} target="_blank" rel="noopener noreferrer" className="nws-link">
                                  View Full Alert on NWS.gov
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="alert-details-meta">
                        <div className="meta-item">
                          <span className="meta-label">Severity:</span>
                          <span className={`meta-value severity-${selectedAlert.severity}`}>
                            {selectedAlert.severity.toUpperCase()}
                          </span>
                        </div>
                        
                        {selectedAlert.urgency && (
                          <div className="meta-item">
                            <span className="meta-label">Urgency:</span>
                            <span className="meta-value">{selectedAlert.urgency}</span>
                          </div>
                        )}
                        
                        {selectedAlert.certainty && (
                          <div className="meta-item">
                            <span className="meta-label">Certainty:</span>
                            <span className="meta-value">{selectedAlert.certainty}</span>
                          </div>
                        )}
                        
                        {selectedAlert.areas && (
                          <div className="meta-item">
                            <span className="meta-label">Areas:</span>
                            <span className="meta-value">{selectedAlert.areas}</span>
                          </div>
                        )}
                        
                        {selectedAlert.effective && (
                          <div className="meta-item">
                            <span className="meta-label">Effective:</span>
                            <span className="meta-value">
                              {new Date(selectedAlert.effective).toLocaleString()}
                            </span>
                          </div>
                        )}
                        
                        {selectedAlert.expires && (
                          <div className="meta-item">
                            <span className="meta-label">Expires:</span>
                            <span className="meta-value">
                              {new Date(selectedAlert.expires).toLocaleString()}
                            </span>
                          </div>
                        )}
                        
                        {selectedAlert.source && (
                          <div className="meta-item">
                            <span className="meta-label">Source:</span>
                            <span className="meta-value">{selectedAlert.source}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="alert-details-footer">
                  <button className="alert-details-btn" onClick={closeAlertDetails}>
                    Close Details
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Weather Details Grid */}
          <div className="weather-details-grid">
            <div className="detail-item">
              <div className="detail-icon">💧</div>
              <div className="detail-info">
                <div className="detail-value">{humidity}%</div>
                <div className="detail-label">Humidity</div>
              </div>
         \   </div>
            
            <div className="detail-item">
              <div className="detail-icon">💨</div>
              <div className="detail-info">
                <div className="detail-value">{Math.round(speed)} mph</div>
                <div className="detail-label">Wind {getWindDirection(deg)}</div>
                {gust && <div className="detail-sub">Gusts {Math.round(gust)} mph</div>}
              </div>
            </div>
            
            <div className="detail-item">
              <div className="detail-icon">🌅</div>
              <div className="detail-info">
                <div className="detail-value">{formatTime(sunrise)}</div>
                <div className="detail-label">Sunrise</div>
              </div>
            </div>
            
            <div className="detail-item">
              <div className="detail-icon">🌇</div>
              <div className="detail-info">
                <div className="detail-value">{formatTime(sunset)}</div>
                <div className="detail-label">Sunset</div>
              </div>
            </div>
            
            <div className="detail-item">
              <div className="detail-icon">👁️</div>
              <div className="detail-info">
                <div className="detail-value">{getVisibilityDescription(visibility)}</div>
                <div className="detail-label">Visibility</div>
              </div>
            </div>
            
            <div className="detail-item">
              <div className="detail-icon">🌡️</div>
              <div className="detail-info">
                <div className="detail-value">{pressure} mb</div>
                <div className="detail-label">Pressure</div>
              </div>
            </div>
            
            <div className="detail-item">
              <div className="detail-icon">☀️</div>
              <div className="detail-info">
                <div className="detail-value">{uvIndex}</div>
                <div className="detail-label">UV Index</div>
                <div className="detail-sub" style={{ color: uvLevel.color }}>
                  {uvLevel.level}
                </div>
              </div>
            </div>
            
            <div className="detail-item">
              <div className="detail-icon">💧</div>
              <div className="detail-info">
                <div className="detail-value">{getDewPoint()}°</div>
                <div className="detail-label">Dew Point</div>
              </div>
            </div>
            
            <div className="detail-item">
              <div className="detail-icon">😌</div>
              <div className="detail-info">
                <div className="detail-value">{comfortIndex.level}</div>
                <div className="detail-label">Comfort</div>
                <div className="detail-sub" style={{ color: comfortIndex.color }}>
                  {Math.abs(temp - getDewPoint())}° spread
                </div>
              </div>
            </div>
            
            <div className="detail-item">
              <div className="detail-icon">�️</div>
              <div className="detail-info">
                <div className="detail-value">{all}%</div>
                <div className="detail-label">Cloud Cover</div>
              </div>
            </div>
            
            <div className="detail-item">
              <div className="detail-icon">🌬️</div>
              <div className="detail-info">
                <div className="detail-value">{airQuality.level}</div>
                <div className="detail-label">Air Quality</div>
                <div className="detail-sub" style={{ color: airQuality.color }}>
                  Estimated
                </div>
              </div>
            </div>
          </div>

          {/* Weather Summary */}
          <div className="weather-summary">
            <div className="summary-text">
              {description.charAt(0).toUpperCase() + description.slice(1)} conditions with a temperature of {Math.round(temp)}°F. 
              Humidity is at {humidity}% with winds from the {getWindDirection(deg)} at {Math.round(speed)} mph.
              The UV index is {uvIndex} ({uvLevel.level.toLowerCase()}) with {getVisibilityDescription(visibility)} visibility.
              {comfortIndex.level.includes('Muggy') && ` It feels ${comfortIndex.level.toLowerCase()} due to the ${Math.abs(temp - getDewPoint())}° temperature-dew point spread.`}
            </div>
          </div>

          {/* Additional Weather Channel Features */}
          <div className="weather-features">
            <div className="feature-row">
              <div className="feature-item">
                <h4>Feels Like</h4>
                <div className="feature-value">{Math.round(feels_like)}°F</div>
                <div className="feature-desc">
                  {Math.round(feels_like) > temp ? 'Warmer than actual' : 'Same as actual'}
                </div>
              </div>
              
              <div className="feature-item">
                <h4>Precipitation Chance</h4>
                <div className="feature-value">--%</div>
                <div className="feature-desc">No rain expected</div>
              </div>
              
              <div className="feature-item">
                <h4>Moon Phase</h4>
                <div className="feature-value">🌒</div>
                <div className="feature-desc">Waxing Crescent</div>
              </div>
            </div>
            
            <div className="feature-row">
              <div className="feature-item">
                <h4>Sun Protection</h4>
                <div className="feature-value" style={{ color: uvLevel.color }}>
                  {uvIndex <= 2 ? 'Not needed' : uvIndex <= 5 ? 'Recommended' : 'Required'}
                </div>
                <div className="feature-desc">UV {uvLevel.level}</div>
              </div>
              
              <div className="feature-item">
                <h4>Driving Conditions</h4>
                <div className="feature-value">Good</div>
                <div className="feature-desc">Clear roads expected</div>
              </div>
              
              <div className="feature-item">
                <h4>Outdoor Activities</h4>
                <div className="feature-value" style={{ color: comfortIndex.color }}>
                  {comfortIndex.level.includes('Comfortable') ? 'Good' : 'Limited'}
                </div>
                <div className="feature-desc">{comfortIndex.level} conditions</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CurrentWeather

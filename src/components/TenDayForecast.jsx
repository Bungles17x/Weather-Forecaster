import React, { useState } from 'react'
import './TenDayForecast.css'
import { SmallWeatherIcon } from './WeatherIcons'

const TenDayForecast = ({ data }) => {
  const [selectedDay, setSelectedDay] = useState(null)
  
  if (!data || data.length === 0) return null

  // Group data by day and get daily highs/lows
  const dailyData = []
  const daysProcessed = new Set()

  data.forEach(item => {
    const date = new Date(item.dt * 1000 || item.startTime)
    const dayKey = date.toDateString()
    
    if (!daysProcessed.has(dayKey)) {
      daysProcessed.add(dayKey)
      
      // Find all items for this day
      const dayItems = data.filter(d => 
        new Date(d.dt * 1000 || d.startTime).toDateString() === dayKey
      )
      
      // Handle both old API format (main.temp) and new format (temperature)
      const temps = dayItems.map(d => d.main?.temp || d.temperature || 70)
      const high = Math.max(...temps)
      const low = Math.min(...temps)
      
      // Calculate average humidity and wind for the day
      const humidities = dayItems.map(d => d.main?.humidity || d.relativeHumidity?.value || 50)
      const avgHumidity = Math.round(humidities.reduce((a, b) => a + b, 0) / humidities.length)
      
      const windSpeeds = dayItems.map(d => {
        const speed = d.wind?.speed || (typeof d.windSpeed === 'string' ? parseInt(d.windSpeed) : d.windSpeed) || 0
        return speed
      })
      const avgWindSpeed = Math.round(windSpeeds.reduce((a, b) => a + b, 0) / windSpeeds.length)
      
      // Get the most common weather condition for the day
      const conditions = dayItems.map(d => {
        if (d.weather && d.weather[0]) {
          return d.weather[0].main
        }
        return d.shortForecast || 'Clear'
      })
      const conditionCounts = conditions.reduce((acc, cond) => {
        acc[cond] = (acc[cond] || 0) + 1
        return acc
      }, {})
      const mainCondition = Object.keys(conditionCounts).reduce((a, b) => 
        conditionCounts[a] > conditionCounts[b] ? a : b
      )
      
      // Get weather description
      const descriptions = dayItems.map(d => {
        if (d.weather && d.weather[0]) {
          return d.weather[0].description
        }
        return d.detailedForecast || 'Weather conditions'
      })
      const mainDescription = descriptions[0] || ''
      
      dailyData.push({
        date,
        high,
        low,
        condition: mainCondition,
        description: mainDescription,
        pop: Math.max(...dayItems.map(d => d.pop || d.probabilityOfPrecipitation?.value || 0)),
        humidity: avgHumidity,
        windSpeed: avgWindSpeed,
        dayItems
      })
    }
  })

  const formatDate = (date, isToday = false) => {
    if (isToday) return 'Today'
    
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
    
    return date.toLocaleDateString([], { 
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const getDayType = (date) => {
    const today = new Date()
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) return 'today'
    if (date.toDateString() === tomorrow.toDateString()) return 'tomorrow'
    return 'future'
  }

  const getTempRange = (high, low) => {
    const range = high - low
    if (range <= 10) return 'narrow'
    if (range <= 20) return 'moderate'
    return 'wide'
  }

  const handleDayClick = (index) => {
    setSelectedDay(selectedDay === index ? null : index)
  }

  return (
    <section id="ten-day-forecast" className="ten-day-forecast">
      <div className="container">
        <div className="forecast-header">
          <h2 className="section-title">10-Day Forecast</h2>
          <div className="forecast-subtitle">Extended weather outlook</div>
        </div>
        
        <div className="forecast-grid">
          {dailyData.slice(0, 10).map((day, index) => {
            const dayType = getDayType(day.date)
            const tempRange = getTempRange(day.high, day.low)
            
            return (
              <div 
                key={index} 
                className={`forecast-day ${dayType} ${selectedDay === index ? 'selected' : ''} ${tempRange}`}
                onClick={() => handleDayClick(index)}
              >
                <div className="forecast-date">
                  {formatDate(day.date, dayType === 'today')}
                </div>
                
                <div className="forecast-icon">
                  <SmallWeatherIcon condition={day.description || day.condition} size={48} />
                </div>
                
                <div className="forecast-condition">
                  {day.description || day.condition}
                </div>
                
                <div className="forecast-temps">
                  <div className="temp-high">{Math.round(day.high)}°</div>
                  <div className="temp-low">{Math.round(day.low)}°</div>
                </div>
                
                <div className="forecast-details">
                  <div className="forecast-rain">
                    💧 {Math.round(day.pop * 100)}%
                  </div>
                  
                  <div className="forecast-humidity">
                    🌫️ {day.humidity}%
                  </div>
                  
                  <div className="forecast-wind">
                    💨 {day.windSpeed} mph
                  </div>
                </div>
                
                {selectedDay === index && (
                  <div className="forecast-expanded">
                    <div className="expanded-details">
                      <h4>{formatDate(day.date, dayType === 'today')} Details</h4>
                      
                      <div className="detail-grid">
                        <div className="detail-item">
                          <span className="detail-label">High:</span>
                          <span className="detail-value">{Math.round(day.high)}°F</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Low:</span>
                          <span className="detail-value">{Math.round(day.low)}°F</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Condition:</span>
                          <span className="detail-value">{day.description || day.condition}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Precipitation:</span>
                          <span className="detail-value">{Math.round(day.pop * 100)}%</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Humidity:</span>
                          <span className="detail-value">{day.humidity}%</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Wind:</span>
                          <span className="detail-value">{day.windSpeed} mph</span>
                        </div>
                      </div>
                      
                      <div className="day-summary">
                        <p>
                          {day.description || day.condition} conditions expected with 
                          temperatures ranging from {Math.round(day.low)}°F to {Math.round(day.high)}°F.
                          {day.pop > 30 && ` ${Math.round(day.pop * 100)}% chance of precipitation.`}
                          {day.windSpeed > 15 && ` Winds will be around ${day.windSpeed} mph.`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        
        {selectedDay !== null && (
          <div className="selected-day-summary">
            <div className="summary-content">
              <h3>
                {formatDate(dailyData[selectedDay].date, getDayType(dailyData[selectedDay].date) === 'today')} - 
                {dailyData[selectedDay].description || dailyData[selectedDay].condition}
              </h3>
              <p>
                High of {Math.round(dailyData[selectedDay].high)}°F and low of {Math.round(dailyData[selectedDay].low)}°F.
                {dailyData[selectedDay].pop > 0 && ` ${Math.round(dailyData[selectedDay].pop * 100)}% chance of rain.`}
                Humidity will be around {dailyData[selectedDay].humidity}% with winds at {dailyData[selectedDay].windSpeed} mph.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default TenDayForecast

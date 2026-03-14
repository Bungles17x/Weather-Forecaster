import React from 'react'
import { SmallWeatherIcon } from './WeatherIcons'

const IconTest = () => {
  const testConditions = [
    'clear sky',
    'few clouds', 
    'scattered clouds',
    'broken clouds',
    'shower rain',
    'rain',
    'light rain',
    'drizzle',
    'thunderstorm',
    'snow',
    'mist',
    'fog',
    'haze'
  ]

  return (
    <div style={{ padding: '20px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', margin: '20px' }}>
      <h3 style={{ color: 'white', marginBottom: '20px' }}>Weather Icon Test</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '15px' }}>
        {testConditions.map((condition, index) => (
          <div key={index} style={{ 
            textAlign: 'center', 
            padding: '10px', 
            background: 'rgba(255,255,255,0.05)', 
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <SmallWeatherIcon condition={condition} size={32} />
            <div style={{ 
              color: 'white', 
              fontSize: '0.75rem', 
              marginTop: '5px',
              wordBreak: 'break-word'
            }}>
              {condition}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default IconTest

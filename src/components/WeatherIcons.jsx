import React from 'react'

// Weather icon components using CSS/SVG instead of emojis
export const WeatherIcon = ({ condition, size = 48 }) => {
  const getIcon = (condition) => {
    const main = condition?.toLowerCase() || ''
    const description = condition?.toLowerCase() || ''
    
    // Check for specific conditions first
    if (main.includes('thunderstorm') || description.includes('thunderstorm')) {
      return (
        <div className="weather-icon-svg" style={{ width: size, height: size }}>
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" fill="#757575" stroke="#616161" strokeWidth="1"/>
            <path d="M13 16l-3 5h2l-1 3 4-5h-2z" fill="#FFD700" stroke="#FFA500" strokeWidth="1"/>
          </svg>
        </div>
      )
    }
    
    if (main.includes('drizzle') || description.includes('drizzle') || description.includes('light rain')) {
      return (
        <div className="weather-icon-svg" style={{ width: size, height: size }}>
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" fill="#BDBDBD" stroke="#9E9E9E" strokeWidth="1"/>
            <g stroke="#4FC3F7" strokeWidth="1.5" strokeLinecap="round">
              <line x1="8" y1="18" x2="8" y2="20"/>
              <line x1="12" y1="17" x2="12" y2="19"/>
              <line x1="16" y1="18" x2="16" y2="20"/>
              <line x1="10" y1="20" x2="10" y2="22"/>
              <line x1="14" y1="20" x2="14" y2="22"/>
            </g>
          </svg>
        </div>
      )
    }
    
    if (main.includes('rain') || description.includes('rain') || description.includes('shower')) {
      return (
        <div className="weather-icon-svg" style={{ width: size, height: size }}>
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" fill="#9E9E9E" stroke="#757575" strokeWidth="1"/>
            <g stroke="#2196F3" strokeWidth="2" strokeLinecap="round">
              <line x1="8" y1="19" x2="8" y2="21"/>
              <line x1="12" y1="19" x2="12" y2="21"/>
              <line x1="16" y1="19" x2="16" y2="21"/>
              <line x1="10" y1="21" x2="10" y2="23"/>
              <line x1="14" y1="21" x2="14" y2="23"/>
            </g>
          </svg>
        </div>
      )
    }
    
    if (main.includes('snow') || description.includes('snow') || description.includes('flurries')) {
      return (
        <div className="weather-icon-svg" style={{ width: size, height: size }}>
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" fill="#E0E0E0" stroke="#9E9E9E" strokeWidth="1"/>
            <g fill="#B3E5FC">
              <circle cx="8" cy="19" r="1"/>
              <circle cx="12" cy="19" r="1"/>
              <circle cx="16" cy="19" r="1"/>
              <circle cx="10" cy="21" r="1"/>
              <circle cx="14" cy="21" r="1"/>
              <circle cx="8" cy="23" r="0.8"/>
              <circle cx="12" cy="23" r="0.8"/>
              <circle cx="16" cy="23" r="0.8"/>
            </g>
          </svg>
        </div>
      )
    }
    
    if (main.includes('clear') || description.includes('clear') || description.includes('sunny')) {
      return (
        <div className="weather-icon-svg" style={{ width: size, height: size }}>
          <svg viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="5" fill="#FFD700" stroke="#FFA500" strokeWidth="1"/>
            <g stroke="#FFD700" strokeWidth="2" strokeLinecap="round">
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </g>
          </svg>
        </div>
      )
    }
    
    if (main.includes('clouds') || main.includes('cloud') || description.includes('cloudy') || description.includes('overcast')) {
      // Check if it's clear with clouds (partly cloudy) - use a different design
      if (description.includes('partly') || description.includes('few') || description.includes('scattered')) {
        return (
          <div className="weather-icon-svg" style={{ width: size, height: size }}>
            <svg viewBox="0 0 24 24" fill="none">
              {/* Sun on the left */}
              <circle cx="8" cy="10" r="3" fill="#FFD700" stroke="#FFA500" strokeWidth="1"/>
              <g stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round">
                <line x1="8" y1="4" x2="8" y2="5"/>
                <line x1="8" y1="15" x2="8" y2="16"/>
                <line x1="3" y1="10" x2="4" y2="10"/>
                <line x1="12" y1="10" x2="13" y2="10"/>
                <line x1="4.5" y1="5.5" x2="5.5" y2="6.5"/>
                <line x1="10.5" y1="13.5" x2="11.5" y2="14.5"/>
              </g>
              {/* Cloud on the right */}
              <path d="M16 8h-0.5A4 4 0 1010 14h5a2 2 0 000-4z" fill="#E0E0E0" stroke="#9E9E9E" strokeWidth="1"/>
            </svg>
          </div>
        )
      }
      // Fully cloudy - use overlapping clouds for depth
      return (
        <div className="weather-icon-svg" style={{ width: size, height: size }}>
          <svg viewBox="0 0 24 24" fill="none">
            {/* Back cloud */}
            <path d="M16 13h-1.26A6 6 0 106 19h7a3.5 3.5 0 000-7z" fill="#BDBDBD" stroke="#9E9E9E" strokeWidth="1"/>
            {/* Front cloud */}
            <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" fill="#E0E0E0" stroke="#9E9E9E" strokeWidth="1"/>
          </svg>
        </div>
      )
    }
    
    if (main.includes('mist') || main.includes('fog') || description.includes('mist') || description.includes('fog')) {
      return (
        <div className="weather-icon-svg" style={{ width: size, height: size }}>
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" fill="#E0E0E0" stroke="#BDBDBD" strokeWidth="1"/>
            <g stroke="#9E9E9E" strokeWidth="1" opacity="0.6">
              <line x1="6" y1="18" x2="18" y2="18"/>
              <line x1="6" y1="20" x2="18" y2="20"/>
              <line x1="6" y1="22" x2="16" y2="22"/>
              <line x1="8" y1="16" x2="20" y2="16"/>
            </g>
          </svg>
        </div>
      )
    }
    
    if (main.includes('haze') || description.includes('haze')) {
      return (
        <div className="weather-icon-svg" style={{ width: size, height: size }}>
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" fill="#F5F5F5" stroke="#E0E0E0" strokeWidth="1"/>
            <g stroke="#FFA726" strokeWidth="1" opacity="0.7">
              <line x1="6" y1="16" x2="18" y2="16"/>
              <line x1="8" y1="18" x2="16" y2="18"/>
              <line x1="10" y1="20" x2="14" y2="20"/>
            </g>
          </svg>
        </div>
      )
    }
    
    // Fog/Mist
    if (main.includes('fog') || description.includes('fog') || description.includes('mist') || description.includes('haze')) {
      return (
        <div className="weather-icon-svg" style={{ width: size, height: size }}>
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" fill="#B0BEC5" stroke="#90A4AE" strokeWidth="1"/>
            <g opacity="0.7">
              <rect x="6" y="15" width="12" height="2" rx="1" fill="#CFD8DC"/>
              <rect x="8" y="17" width="8" height="2" rx="1" fill="#CFD8DC"/>
              <rect x="7" y="19" width="10" height="2" rx="1" fill="#CFD8DC"/>
            </g>
          </svg>
        </div>
      )
    }
    
    // Hail
    if (main.includes('hail') || description.includes('hail') || description.includes('ice pellets')) {
      return (
        <div className="weather-icon-svg" style={{ width: size, height: size }}>
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" fill="#9E9E9E" stroke="#757575" strokeWidth="1"/>
            <g fill="#E1F5FE" stroke="#81D4FA" strokeWidth="1">
              <rect x="8" y="16" width="3" height="3" rx="0.5" transform="rotate(45 9.5 17.5)"/>
              <rect x="13" y="17" width="3" height="3" rx="0.5" transform="rotate(45 14.5 18.5)"/>
              <rect x="10" y="19" width="3" height="3" rx="0.5" transform="rotate(45 11.5 20.5)"/>
              <rect x="15" y="20" width="3" height="3" rx="0.5" transform="rotate(45 16.5 21.5)"/>
            </g>
          </svg>
        </div>
      )
    }
    
    // Sleet/Freezing Rain
    if (main.includes('sleet') || description.includes('sleet') || description.includes('freezing rain') || description.includes('freezing drizzle')) {
      return (
        <div className="weather-icon-svg" style={{ width: size, height: size }}>
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" fill="#B0BEC5" stroke="#90A4AE" strokeWidth="1"/>
            <g stroke="#4FC3F7" strokeWidth="1.5" strokeLinecap="round">
              <line x1="8" y1="18" x2="8" y2="20"/>
              <line x1="12" y1="17" x2="12" y2="19"/>
              <line x1="16" y1="18" x2="16" y2="20"/>
            </g>
            <g fill="#E1F5FE" stroke="#81D4FA" strokeWidth="1">
              <rect x="10" y="19" width="2.5" height="2.5" rx="0.3" transform="rotate(45 11.25 20.25)"/>
              <rect x="14" y="20" width="2.5" height="2.5" rx="0.3" transform="rotate(45 15.25 21.25)"/>
            </g>
          </svg>
        </div>
      )
    }
    
    // Tornado/Cyclone
    if (main.includes('tornado') || description.includes('tornado') || description.includes('cyclone') || description.includes('funnel cloud')) {
      return (
        <div className="weather-icon-svg" style={{ width: size, height: size }}>
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" fill="#757575" stroke="#616161" strokeWidth="1"/>
            <path d="M12 8 Q8 10 8 14 T12 20 Q16 18 16 14 T12 8" fill="none" stroke="#FF5722" strokeWidth="2" opacity="0.8"/>
            <path d="M12 10 Q9 11 9 14 T12 18 Q15 17 15 14 T12 10" fill="none" stroke="#FF9800" strokeWidth="1.5" opacity="0.6"/>
          </svg>
        </div>
      )
    }
    
    // Hurricane/Typhoon
    if (main.includes('hurricane') || description.includes('hurricane') || description.includes('typhoon') || description.includes('tropical storm')) {
      return (
        <div className="weather-icon-svg" style={{ width: size, height: size }}>
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" fill="#424242" stroke="#212121" strokeWidth="1"/>
            <g transform="translate(12, 14)">
              <circle cx="0" cy="0" r="2" fill="#FF5722" opacity="0.8"/>
              <path d="M0,-2 Q-3,-1 -3,2 T0,6 Q3,5 3,2 T0,-2" fill="none" stroke="#FF9800" strokeWidth="1.5" opacity="0.7"/>
              <path d="M0,-4 Q-5,-2 -5,3 T0,8 Q5,6 5,3 T0,-4" fill="none" stroke="#FFC107" strokeWidth="1" opacity="0.5"/>
            </g>
          </svg>
        </div>
      )
    }
    
    // Windy
    if (main.includes('wind') || description.includes('wind') || description.includes('windy') || description.includes('breezy')) {
      return (
        <div className="weather-icon-svg" style={{ width: size, height: size }}>
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" fill="#E3F2FD" stroke="#BBDEFB" strokeWidth="1"/>
            <g stroke="#2196F3" strokeWidth="2" strokeLinecap="round" fill="none">
              <path d="M6 12 Q10 10 14 12"/>
              <path d="M5 15 Q11 13 17 15"/>
              <path d="M7 18 Q13 16 19 18"/>
            </g>
          </svg>
        </div>
      )
    }
    
    // Dust/Sand
    if (main.includes('dust') || description.includes('dust') || description.includes('sand') || description.includes('ash')) {
      return (
        <div className="weather-icon-svg" style={{ width: size, height: size }}>
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" fill="#D7CCC8" stroke="#BCAAA4" strokeWidth="1"/>
            <g opacity="0.6">
              <circle cx="8" cy="16" r="1" fill="#8D6E63"/>
              <circle cx="12" cy="17" r="0.8" fill="#A1887F"/>
              <circle cx="16" cy="16" r="1" fill="#8D6E63"/>
              <circle cx="10" cy="19" r="0.6" fill="#A1887F"/>
              <circle cx="14" cy="18" r="0.8" fill="#8D6E63"/>
            </g>
          </svg>
        </div>
      )
    }
    
    // Freezing
    if (main.includes('freezing') || description.includes('freezing') || description.includes('ice') || description.includes('cold')) {
      return (
        <div className="weather-icon-svg" style={{ width: size, height: size }}>
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" fill="#E1F5FE" stroke="#B3E5FC" strokeWidth="1"/>
            <g stroke="#0288D1" strokeWidth="1.5" fill="none">
              <path d="M8 16 L8 21 M6 18 L10 18"/>
              <path d="M12 15 L12 20 M10 17 L14 17"/>
              <path d="M16 16 L16 21 M14 18 L18 18"/>
            </g>
          </svg>
        </div>
      )
    }
    
    // Hot/Sweltering
    if (main.includes('hot') || description.includes('hot') || description.includes('heat') || description.includes('sweltering') || description.includes('scorching')) {
      return (
        <div className="weather-icon-svg" style={{ width: size, height: size }}>
          <svg viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="6" fill="#FF5722" stroke="#D84315" strokeWidth="1"/>
            <g stroke="#FF5722" strokeWidth="2" strokeLinecap="round">
              <line x1="12" y1="0" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="24"/>
              <line x1="3" y1="12" x2="0" y2="12"/>
              <line x1="21" y1="12" x2="24" y2="12"/>
              <line x1="4.22" y1="4.22" x2="2" y2="2"/>
              <line x1="19.78" y1="19.78" x2="22" y2="22"/>
              <line x1="4.22" y1="19.78" x2="2" y2="22"/>
              <line x1="19.78" y1="4.22" x2="22" y2="2"/>
            </g>
            <text x="12" y="16" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">HOT</text>
          </svg>
        </div>
      )
    }
    
    // Cold/Freezing
    if (main.includes('cold') || description.includes('cold') || description.includes('chilly') || description.includes('cool')) {
      return (
        <div className="weather-icon-svg" style={{ width: size, height: size }}>
          <svg viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="6" fill="#0288D1" stroke="#01579B" strokeWidth="1"/>
            <g stroke="#0288D1" strokeWidth="2" strokeLinecap="round">
              <line x1="12" y1="0" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="24"/>
              <line x1="3" y1="12" x2="0" y2="12"/>
              <line x1="21" y1="12" x2="24" y2="12"/>
              <line x1="4.22" y1="4.22" x2="2" y2="2"/>
              <line x1="19.78" y1="19.78" x2="22" y2="22"/>
              <line x1="4.22" y1="19.78" x2="2" y2="22"/>
              <line x1="19.78" y1="4.22" x2="22" y2="2"/>
            </g>
            <text x="12" y="16" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">COLD</text>
          </svg>
        </div>
      )
    }
    
    // Default to a simple sun icon
    return (
      <div className="weather-icon-svg" style={{ width: size, height: size }}>
        <svg viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="5" fill="#FFD700" stroke="#FFA500" strokeWidth="1"/>
          <g stroke="#FFD700" strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </g>
        </svg>
      </div>
    )
  }

  return <div className="weather-icon">{getIcon(condition)}</div>
}

// Small weather icon for compact displays
export const SmallWeatherIcon = ({ condition, size = 24 }) => {
  return <WeatherIcon condition={condition} size={size} />
}

// Logo icon for the header
export const LogoIcon = ({ size = 32 }) => {
  return (
    <div className="weather-icon-svg" style={{ width: size, height: size }}>
      <svg viewBox="0 0 24 24" fill="none">
        {/* Single, menacing storm cloud */}
        <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" fill="#1a1a2e" stroke="#0f0f1e" strokeWidth="1"/>
        {/* Dramatic, jagged lightning bolt */}
        <path d="M13 16l-3 5h2l-1 3 4-5h-2z" fill="#ff6b35" stroke="#ff4500" strokeWidth="1"/>
        {/* Additional smaller lightning for intensity */}
        <path d="M10 14l-1.5 2.5h1l-0.5 1.5 2-2.5h-1z" fill="#ffa500" stroke="#ff8c00" strokeWidth="0.5"/>
      </svg>
    </div>
  )
}

export default WeatherIcon

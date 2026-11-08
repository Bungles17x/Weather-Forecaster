import React from 'react'
import './WeatherIcons.css'

/* Weather Forecaster's original neon-outline icon family. All icons are local SVG,
   so they stay crisp on high-DPI displays and do not depend on remote images. */
const glyphs = {
  brand: <>
    <circle cx="13" cy="15" r="8" />
    <circle cx="13" cy="15" r="4.6" opacity=".72" />
    <path d="M13 5v20M3 15h20" className="wd-muted-stroke" />
    <path d="M4.5 12.3C4.5 8.7 7.4 6.6 10.5 7c2.4-5.3 10.3-4 11.3 2.4 3.8.1 5.4 4.4 3.2 7.2" className="wd-purple-stroke" />
    <path d="m15 6-6 10h4.6l-2 6.5L20 11h-5.1L17 6z" className="wd-cyan-fill" />
  </>,
  home: <path d="m3 11 9-8 9 8v10h-6v-6H9v6H3z" />,
  forecast: <>
    <circle cx="8" cy="7" r="3.2" className="wd-yellow-stroke" />
    <path d="M8 1v2M8 11v2M2 7H1m13 0h-2M3.5 2.5 5 4m7 7 1.5 1.5" className="wd-yellow-stroke" />
    <path d="M8 20h10a4 4 0 0 0 0-8 6 6 0 0 0-11-1 4.5 4.5 0 0 0 1 9z" />
  </>,
  sun: <>
    <circle cx="12" cy="12" r="4.5" className="wd-yellow-stroke" />
    <path d="M12 1.8v2.4m0 15.6v2.4M1.8 12h2.4m15.6 0h2.4M4.8 4.8l1.7 1.7m11 11 1.7 1.7m0-14.4-1.7 1.7m-11 11-1.7 1.7" className="wd-yellow-stroke" />
  </>,
  partlyCloudy: <>
    <circle cx="8" cy="7" r="3" className="wd-yellow-stroke" />
    <path d="M8 1.5v2m0 7v2M2.5 7h2m7 0h2M4 3l1.4 1.4" className="wd-yellow-stroke" />
    <path d="M7 20h11a4 4 0 0 0 0-8 6 6 0 0 0-11-1 4.5 4.5 0 0 0 0 9z" />
  </>,
  cloud: <path d="M6 19h12a5 5 0 0 0 0-10 7 7 0 0 0-13-1 5.5 5.5 0 0 0 1 11z" />,
  overcast: <>
    <path d="M5 16h12a4.5 4.5 0 0 0 0-9 6.4 6.4 0 0 0-12-1 5 5 0 0 0 0 10z" />
    <path d="M3 20h12a4 4 0 0 0 0-8" className="wd-blue-stroke" />
  </>,
  rain: <>
    <path d="M6 15h12a4.5 4.5 0 0 0 0-9 6.4 6.4 0 0 0-12-1 5 5 0 0 0 0 10z" />
    <path d="m8 17-1.5 3m7-3-1.5 3m7-3-1.5 3" className="wd-blue-stroke" />
  </>,
  heavyRain: <>
    <path d="M6 14h12a4.5 4.5 0 0 0 0-9 6.4 6.4 0 0 0-12-1 5 5 0 0 0 0 10z" />
    <path d="m6 16-2 4m7-4-2 5m7-5-2 5m7-5-2 4" className="wd-blue-stroke" />
  </>,
  thunderstorm: <>
    <path d="M6 14h12a4.5 4.5 0 0 0 0-9 6.4 6.4 0 0 0-12-1 5 5 0 0 0 0 10z" />
    <path d="m13 12-5 6h4l-1 4.5 6-8h-4l1-2.5z" className="wd-purple-fill" />
  </>,
  snow: <>
    <path d="M6 13h12a4.5 4.5 0 0 0 0-9 6.4 6.4 0 0 0-12-1 5 5 0 0 0 0 10z" />
    <path d="M7 17v5m-2.2-2.5h4.4M5.4 18.2l3.2 3.1m0-3.1-3.2 3.1M17 16v6m-2.3-3h4.6" className="wd-blue-stroke" />
  </>,
  ice: <>
    <path d="M12 2v20M3.4 7l17.2 10M3.4 17 20.6 7M8 4l4 2 4-2M8 20l4-2 4 2M3.5 11l.2-4.5L8 6m8 12 4.3.5-.2-4.5" className="wd-blue-stroke" />
  </>,
  fog: <>
    <path d="M5 9a7 7 0 0 1 14 0" />
    <path d="M2 12h20M5 16h14M3 20h10" className="wd-blue-stroke" />
  </>,
  haze: <>
    <path d="M12 2a6 6 0 0 1 6 6H6a6 6 0 0 1 6-6z" className="wd-yellow-stroke" />
    <path d="M2 13h20M5 17h14M8 21h8" className="wd-blue-stroke" />
  </>,
  wind: <>
    <path d="M2 7h13a3 3 0 1 0-3-3M2 12h18a2.5 2.5 0 1 1-2.5 2.5M2 17h11a3 3 0 1 1-3 3" />
  </>,
  tornado: <>
    <path d="M3 4h18M5 8h14M7 12h10M9 16h6M11 20h2" />
    <path d="M16 4c0 5-5 6-5 10s3 4 2 6" className="wd-purple-stroke" />
  </>,
  hurricane: <>
    <path d="M12 3c5-2 9 2 7 6s-8 4-10 7c-2 3 2 6 5 4" />
    <path d="M12 21c-5 2-9-2-7-6s8-4 10-7c2-3-2-6-5-4" className="wd-purple-stroke" />
    <circle cx="12" cy="12" r="2.2" className="wd-purple-stroke" />
  </>,
  alerts: <>
    <path d="M12 3 22 20H2z" className="wd-magenta-stroke" />
    <path d="M12 9v5m0 3v.3" className="wd-magenta-stroke" />
  </>,
  warning: <>
    <path d="M12 3 22 20H2z" className="wd-magenta-stroke" />
    <path d="M12 9v5m0 3v.3" className="wd-magenta-stroke" />
  </>,
  radar: <>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5.3" className="wd-blue-stroke" />
    <path d="M12 3v18M3 12h18" className="wd-muted-stroke" />
    <path d="M12 12 18.5 5.5" className="wd-purple-stroke" />
    <circle cx="12" cy="12" r="1.5" className="wd-cyan-fill" />
  </>,
  satellite: <>
    <rect x="9" y="9" width="6" height="6" rx="1" transform="rotate(45 12 12)" />
    <path d="m8 8-4-4m12 12 4 4M4 9l5-5m6 15 5-5" />
    <path d="M3 13a10 10 0 0 1 10-10M21 11A10 10 0 0 1 11 21" className="wd-blue-stroke" />
  </>,
  layers: <>
    <path d="m12 3 10 5-10 5L2 8z" />
    <path d="m2 12 10 5 10-5M2 16l10 5 10-5" className="wd-blue-stroke" />
  </>,
  play: <path d="m8 5 11 7-11 7z" className="wd-purple-stroke" />,
  pause: <><path d="M7 5v14M17 5v14" className="wd-purple-stroke" /></>,
  zoomIn: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5M10.5 7v7m-3.5-3.5h7" /></>,
  zoomOut: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5M7 10.5h7" /></>,
  maximize: <path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" />,
  crosshair: <><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="2" className="wd-purple-stroke" /><path d="M12 1v4m0 14v4M1 12h4m14 0h4" /></>,
  location: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0z" /><circle cx="12" cy="10" r="2.5" className="wd-purple-stroke" /></>,
  settings: <><circle cx="12" cy="12" r="3.3" /><path d="m10 2-.5 2.1a8 8 0 0 0-1.7.8L5.7 4 4 5.7l1 2.1a8 8 0 0 0-.8 1.7L2 10v4l2.2.5a8 8 0 0 0 .8 1.7L4 18.3 5.7 20l2.1-1a8 8 0 0 0 1.7.8L10 22h4l.5-2.2a8 8 0 0 0 1.7-.8l2.1 1 1.7-1.7-1-2.1a8 8 0 0 0 .8-1.7L22 14v-4l-2.2-.5a8 8 0 0 0-.8-1.7l1-2.1L18.3 4l-2.1 1a8 8 0 0 0-1.7-.8L14 2z" /></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
  menu: <path d="M3 6h18M3 12h18M3 18h18" />,
  observations: <><path d="M4 20V9m5 11V4m5 16v-8m5 8V6" /><circle cx="4" cy="7" r="2" /><circle cx="9" cy="2" r="2" /><circle cx="14" cy="10" r="2" /><circle cx="19" cy="4" r="2" /></>,
  temperature: <><path d="M10 14.5V5a3 3 0 0 1 6 0v9.5a5 5 0 1 1-6 0z" /><path d="M13 8v9" className="wd-magenta-stroke" /><circle cx="13" cy="18" r="2" className="wd-magenta-fill" /></>,
  humidity: <><path d="M12 2S4 11 4 15a8 8 0 0 0 16 0c0-4-8-13-8-13z" /><path d="M9 16a3 3 0 0 0 3 3" className="wd-blue-stroke" /></>,
  pressure: <><path d="M4 18a9 9 0 1 1 16 0" /><path d="M12 13 17 8" className="wd-purple-stroke" /><circle cx="12" cy="13" r="1.5" /><path d="M3 19h18" /></>,
  visibility: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" className="wd-blue-stroke" /></>,
  dewpoint: <><path d="M12 2S5 10 5 14a7 7 0 0 0 14 0c0-4-7-12-7-12z" /><path d="M9 15a3 3 0 0 0 3 3" className="wd-purple-stroke" /></>,
  windDirection: <><path d="M12 21V4m-6 6 6-6 6 6" /><path d="M4 20h16" className="wd-blue-stroke" /></>,
  database: <><ellipse cx="12" cy="5" rx="8.5" ry="3" /><path d="M3.5 5v14c0 1.7 3.8 3 8.5 3s8.5-1.3 8.5-3V5M3.5 12c0 1.7 3.8 3 8.5 3s8.5-1.3 8.5-3" /></>,
  refresh: <><path d="M20 7V3l-4 4a8 8 0 0 0-13 5M4 17v4l4-4a8 8 0 0 0 13-5" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l4 2" /></>,
  check: <path d="m4 12 5 5L20 6" className="wd-cyan-stroke" />,
  back: <path d="m15 18-6-6 6-6M9 12h12" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  chevronRight: <path d="m9 6 6 6-6 6" />,
  arrowUpRight: <path d="M7 17 17 7M8 7h9v9" />,
  theme: <><path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5z" /><path d="M15 3v4m-2-2h4" className="wd-purple-stroke" /></>,
  moon: <><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></>,
  units: <><path d="M7 3v18m10-18v18M4 7h6m4 4h6m-6 5h6" /><path d="M7 3h.01M17 3h.01" className="wd-purple-stroke" /></>,
  notifications: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" className="wd-purple-stroke" /></>,
  share: <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.7 10.6 6.6-4.2m-6.6 9 6.6 4.1" /></>,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.6 2.6 0 1 1 4.4 1.9c-1.2 1-1.9 1.3-1.9 3.1m0 3v.1" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6m0-10v.1" /></>,
  bookmark: <path d="M6 3h12v18l-6-4-6 4z" />,
  download: <><path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4" /></>,
  precipitation: <><path d="M6 13h12a4 4 0 0 0 0-8 6 6 0 0 0-11-1 4.5 4.5 0 0 0-1 9z" /><path d="m9 16-1.5 3m7-3-1.5 3" className="wd-blue-stroke" /></>,
  uv: <><circle cx="12" cy="12" r="4" className="wd-yellow-stroke" /><path d="M12 1.5v2m0 17v2M1.5 12h2m17 0h2M4.5 4.5l1.4 1.4m12.2 12.2 1.4 1.4m0-15-1.4 1.4M5.9 18.1l-1.4 1.4" className="wd-yellow-stroke" /></>,
  feelsLike: <><path d="M10 14.5V5a3 3 0 0 1 6 0v9.5a5 5 0 1 1-6 0z" /><path d="M13 8v9" className="wd-magenta-stroke" /><path d="M18 5h3m-2-2v4" className="wd-blue-stroke" /></>,
  airQuality: <><path d="M3 17c3-2 5 2 8 0s5 2 10 0M3 12c3-2 5 2 8 0s5 2 10 0M3 7c3-2 5 2 8 0s5 2 10 0" /><path d="M5 21h14" className="wd-blue-stroke" /></>,
  fire: <path d="M12 22c5 0 8-4 7-8-.5-2-2-3-2-5-2 1-3 3-3 4-2-3-1-6-4-10 0 4-5 7-5 12a7 7 0 0 0 7 7z" className="wd-magenta-stroke" />,
  marine: <><path d="M2 15c2 0 2-2 5-2s3 2 5 2 3-2 5-2 3 2 5 2" /><path d="M2 20c2 0 2-2 5-2s3 2 5 2 3-2 5-2 3 2 5 2" className="wd-blue-stroke" /><path d="M12 2v7m-4-3 4 4 4-4" className="wd-purple-stroke" /></>,
  flood: <><path d="M3 19h18M5 19V8l7-5 7 5v11" /><path d="M3 14c2-2 3 2 5 0s3 2 5 0 3 2 5 0 2 1 3 0" className="wd-blue-stroke" /></>,
  winter: <><path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7" /><path d="m8 4 4 2 4-2m-8 16 4-2 4 2" className="wd-blue-stroke" /></>,
  map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z" /><path d="M9 3v15m6-12v15" className="wd-blue-stroke" /></>,
  legend: <><path d="M5 6h14M5 12h14M5 18h14" /><circle cx="3" cy="6" r="1" className="wd-purple-stroke" /><circle cx="3" cy="12" r="1" className="wd-purple-stroke" /><circle cx="3" cy="18" r="1" className="wd-purple-stroke" /></>
}

export function WeatherDeskIcon({ name = 'cloud', size = 24, title, className = '', strokeWidth = 1.7 }) {
  const glyph = glyphs[name] || glyphs.cloud
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={`wd-icon ${className}`.trim()}
      data-icon={name}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : 'true'}
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {title && <title>{title}</title>}
      {glyph}
    </svg>
  )
}

export function LogoIcon({ size = 32, className = '' }) {
  return <WeatherDeskIcon name="brand" size={size} className={className} />
}

export function getWeatherIconName(condition = '') {
  const text = String(condition || '').toLowerCase()
  if (/tornado|funnel|waterspout/.test(text)) return 'tornado'
  if (/hurricane|tropical cyclone|typhoon/.test(text)) return 'hurricane'
  if (/thunder|t-storm|lightning|severe storm/.test(text)) return 'thunderstorm'
  if (/blizzard|heavy snow|snow|sleet|wintry mix|freezing rain|ice storm|ice pellets|flurr/.test(text)) return /freezing rain|ice storm|ice pellets|sleet|wintry mix/.test(text) ? 'ice' : 'snow'
  if (/heavy rain|downpour|showers likely|rain showers|heavy drizzle/.test(text)) return 'heavyRain'
  if (/rain|drizzle|shower|sprinkle/.test(text)) return 'rain'
  if (/fog|mist/.test(text)) return 'fog'
  if (/haze|smoke|dust/.test(text)) return 'haze'
  if (/wind|breezy|gust/.test(text)) return 'wind'
  if (/mostly sunny|partly sunny|partly cloudy|mostly clear|fair/.test(text)) return 'partlyCloudy'
  if (/clear|sunny/.test(text)) return 'sun'
  if (/overcast/.test(text)) return 'overcast'
  if (/cloud|mostly cloudy/.test(text)) return 'cloud'
  return 'cloud'
}

export function SmallWeatherIcon({ type, condition, size = 28, className = '', title }) {
  const iconName = type ? (glyphs[type] ? type : getWeatherIconName(type)) : getWeatherIconName(condition)
  return <WeatherDeskIcon name={iconName} size={size} className={`wd-weather-icon wd-weather-${iconName} ${className}`.trim()} title={title || condition || type || 'Weather condition'} />
}

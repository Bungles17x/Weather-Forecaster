import React from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import { WeatherDeskIcon } from '../components/WeatherIcons'
import { useSettings } from '../contexts/SettingsContext'
import './SettingsPage.css'

export default function SettingsPage() {
  const { settings, updateSetting, resetSettings } = useSettings()

  return (
    <div className="settings-page data-page">
      <Header />
      <main className="settings-content">
        <div className="settings-heading">
          <div>
            <div className="eyebrow"><span className="eyebrow-dot" /> PERSONALIZE YOUR WORKSTATION</div>
            <h1>Settings</h1>
            <p>Fine-tune the display and how often Weather Forecaster requests official weather data.</p>
          </div>
          <Link to="/" className="back-link"><WeatherDeskIcon name="back" size={15} /> Back to overview</Link>
        </div>

        <div className="settings-auto-save" role="status"><span className="settings-check"><WeatherDeskIcon name="check" size={18} /></span><span><strong>Settings save automatically</strong><small>Preferences are stored locally in this browser on this device.</small></span></div>

        <div className="settings-sections">
          <section className="settings-section">
            <div className="settings-section-heading"><span className="settings-section-icon"><WeatherDeskIcon name="theme" size={22} /></span><div><h2>Appearance</h2><p>Choose a comfortable visual style and temperature scale.</p></div></div>
            <div className="settings-form-grid">
              <label className="setting-item" htmlFor="temperature-units">
                <span className="setting-label">Temperature units</span>
                <select id="temperature-units" value={settings.units} onChange={event => updateSetting('units', event.target.value)} className="setting-select">
                  <option value="imperial">Fahrenheit (°F)</option>
                  <option value="metric">Celsius (°C)</option>
                  <option value="kelvin">Kelvin (K)</option>
                </select>
                <span className="setting-description">Changes temperature values throughout the dashboard, forecast, observations, and storm environment pages.</span>
              </label>
              <label className="setting-item" htmlFor="app-theme">
                <span className="setting-label">Color theme</span>
                <select id="app-theme" value={settings.theme} onChange={event => updateSetting('theme', event.target.value)} className="setting-select">
                  <option value="neon-storm">Neon Storm (default)</option>
                  <option value="aurora">Aurora</option>
                  <option value="sunset">Sunset</option>
                  <option value="midnight-oled">Midnight OLED (true black)</option>
                  <option value="paper">Paper (high legibility)</option>
                  <option value="high-contrast">High Contrast</option>
                  <option value="auto-sky">Auto-Sky (local time)</option>
                  <option value="auto">Follow device setting</option>
                </select>
                <span className="setting-description">Auto mode follows your device&apos;s dark/light preference.</span>
              </label>
              <label className="setting-item" htmlFor="accent-color">
                <span className="setting-label">Accent color</span>
                <input id="accent-color" type="color" value={settings.accentColor || '#6ee7f9'} onChange={event => updateSetting('accentColor', event.target.value)} className="setting-select" />
                <span className="setting-description">Choose your highlight color for links, focus rings, and interactive accents.</span>
              </label>
              <label className="setting-item" htmlFor="font-scale">
                <span className="setting-label">Text size</span>
                <select id="font-scale" value={settings.fontScale || 'normal'} onChange={event => updateSetting('fontScale', event.target.value)} className="setting-select"><option value="small">Small</option><option value="normal">Default</option><option value="large">Large</option><option value="xlarge">Extra large</option></select>
              </label>
              <label className="setting-item" htmlFor="density">
                <span className="setting-label">Interface density</span>
                <select id="density" value={settings.density || 'comfortable'} onChange={event => updateSetting('density', event.target.value)} className="setting-select"><option value="comfortable">Comfortable</option><option value="compact">Compact</option></select>
              </label>
              <div className="setting-row"><div><span className="setting-label">Animated backgrounds and motion</span><p className="setting-description">Turn off decorative motion. System reduced-motion preferences are always respected.</p></div><label className="toggle-switch" aria-label="Animated backgrounds and motion"><input type="checkbox" checked={settings.motion !== false} onChange={event => updateSetting('motion', event.target.checked)} /><span className="toggle-slider" /></label></div>
            </div>
          </section>

          <section className="settings-section">
            <div className="settings-section-heading"><span className="settings-section-icon"><WeatherDeskIcon name="refresh" size={22} /></span><div><h2>Data refresh</h2><p>Control background requests while the app is open.</p></div></div>
            <div className="setting-row">
              <div><span className="setting-label">Automatic refresh</span><p className="setting-description">Refresh official NWS forecasts, station observations, and point alerts periodically while this page is open.</p></div>
              <label className="toggle-switch" aria-label="Automatic refresh">
                <input type="checkbox" checked={Boolean(settings.autoRefresh)} onChange={event => updateSetting('autoRefresh', event.target.checked)} />
                <span className="toggle-slider" />
              </label>
            </div>
            <div className="setting-item setting-interval">
              <label htmlFor="refresh-interval" className="setting-label">Refresh interval</label>
              <select id="refresh-interval" value={settings.refreshInterval} onChange={event => updateSetting('refreshInterval', Number(event.target.value))} className="setting-select" disabled={!settings.autoRefresh}>
                <option value={5}>Every 5 minutes</option>
                <option value={10}>Every 10 minutes</option>
                <option value={15}>Every 15 minutes</option>
                <option value={30}>Every 30 minutes</option>
                <option value={60}>Every hour</option>
              </select>
              <span className="setting-description">The app requests data only while open. This is not a background emergency-alert or push-notification service.</span>
            </div>
          </section>

          <section className="settings-section">
            <div className="settings-section-heading"><span className="settings-section-icon"><WeatherDeskIcon name="location" size={22} /></span><div><h2>Location</h2><p>Choose what forecast is shown on every page.</p></div></div>
            <div className="location-settings-card"><div className="location-settings-symbol"><WeatherDeskIcon name="location" size={22} /></div><div><strong>Current forecast location</strong><p>Use the location search in the header to enter a U.S. city, ZIP code, or latitude/longitude. The location button can request your device location after you grant browser permission.</p><small>Location access is optional. Your saved location stays in this browser.</small></div></div>
          </section>

          <section className="settings-section">
            <div className="settings-section-heading"><span className="settings-section-icon"><WeatherDeskIcon name="info" size={22} /></span><div><h2>Data sources & limitations</h2><p>Know what feeds the workstation—and what it does not claim to provide.</p></div></div>
            <div className="data-source-list">
              <div><span className="source-status source-status-good"/><span><strong>Forecasts, hourly forecasts, station observations, and alerts</strong><small>Official National Weather Service API at api.weather.gov.</small></span></div>
              <div><span className="source-status source-status-good"/><span><strong>Radar overlays</strong><small>Official NWS / NOAA radar GIS services. Layer availability can vary by product and radar.</small></span></div>
              <div><span className="source-status source-status-note"/><span><strong>Location search and base maps</strong><small>External geographic services are used only for place-name lookup and map backgrounds—not to provide weather measurements or alerts.</small></span></div>
            </div>
            <div className="settings-notice"><strong>Not an official NWS product</strong><p>Weather Forecaster is an independent educational display. Radar can be delayed or unavailable, and advanced indices such as CAPE, deep-layer shear, and storm-relative helicity are marked unavailable when the selected NWS endpoint does not provide them. For urgent decisions, follow official warnings and emergency instructions.</p><a href="https://www.weather.gov/alerts" target="_blank" rel="noreferrer"><WeatherDeskIcon name="arrowUpRight" size={13} /> Open official NWS alerts</a></div>
            <div className="about-links">
              <a href="https://www.weather.gov/documentation/services-web-api" target="_blank" rel="noreferrer" className="about-link"><WeatherDeskIcon name="arrowUpRight" size={13} /> NWS API documentation</a>
              <a href="https://radar.weather.gov/" target="_blank" rel="noreferrer" className="about-link"><WeatherDeskIcon name="arrowUpRight" size={13} /> Official radar</a>
              <a href="https://github.com/Bungles17x/Weather-Forecaster" target="_blank" rel="noreferrer" className="about-link"><WeatherDeskIcon name="arrowUpRight" size={13} /> Source repository</a>
            </div>
          </section>

          <section className="settings-reset-section">
            <div><strong>Reset preferences</strong><p>Restore the original temperature, theme, and refresh settings for this browser.</p></div>
            <button type="button" className="reset-btn" onClick={resetSettings}>Reset settings</button>
          </section>
        </div>
        <footer className="settings-footer">WEATHER FORECASTER · VERSION 2.0.0 · FORECAST DATA FROM NWS / NOAA</footer>
      </main>
    </div>
  )
}

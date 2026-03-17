import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import { useSettings } from '../contexts/SettingsContext'
import './SettingsPage.css'

const SettingsPage = () => {
  const { settings, updateSetting, resetSettings } = useSettings()
  const [saved, setSaved] = useState(false)

  const handleSettingChange = (key, value) => {
    updateSetting(key, value)
  }

  const saveSettings = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleResetSettings = () => {
    resetSettings()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="settings-page">
      <Header />
      
      <div className="settings-content">
        <div className="settings-header">
          <div className="settings-nav">
            <Link to="/" className="back-link">← Back to Weather</Link>
            <h1>Settings</h1>
            <div className="settings-actions">
              <button 
                className={`save-btn ${saved ? 'saved' : ''}`}
                onClick={saveSettings}
              >
                {saved ? '✓ Saved' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>

        <div className="settings-sections">
          <section className="settings-section">
            <h2>General</h2>
            <div className="setting-group">
              <div className="setting-item">
                <label>
                  <span className="setting-label">Temperature Units</span>
                  <select 
                    value={settings.units}
                    onChange={(e) => handleSettingChange('units', e.target.value)}
                    className="setting-select"
                  >
                    <option value="imperial">Fahrenheit (°F)</option>
                    <option value="metric">Celsius (°C)</option>
                    <option value="kelvin">Kelvin (K)</option>
                  </select>
                </label>
                <p className="setting-description">Choose your preferred temperature unit</p>
              </div>

              <div className="setting-item">
                <label>
                  <span className="setting-label">Theme</span>
                  <select 
                    value={settings.theme}
                    onChange={(e) => handleSettingChange('theme', e.target.value)}
                    className="setting-select"
                  >
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                    <option value="auto">Auto</option>
                  </select>
                </label>
                <p className="setting-description">Choose the app theme</p>
              </div>

              <div className="setting-item">
                <label>
                  <span className="setting-label">Language</span>
                  <select 
                    value={settings.language}
                    onChange={(e) => handleSettingChange('language', e.target.value)}
                    className="setting-select"
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                  </select>
                </label>
                <p className="setting-description">Choose your preferred language</p>
              </div>
            </div>
          </section>

          <section className="settings-section">
            <h2>Location</h2>
            <div className="setting-group">
              <div className="setting-item">
                <label>
                  <span className="setting-label">Default Location</span>
                  <select 
                    value={settings.location}
                    onChange={(e) => handleSettingChange('location', e.target.value)}
                    className="setting-select"
                  >
                    <option value="auto">Auto-detect</option>
                    <option value="manual">Manual</option>
                  </select>
                </label>
                <p className="setting-description">How the app determines your location</p>
              </div>
            </div>
          </section>

          <section className="settings-section">
            <h2>Data & Refresh</h2>
            <div className="setting-group">
              <div className="setting-item">
                <label className="toggle-label">
                  <span className="setting-label">Auto-refresh</span>
                  <div className="toggle-switch">
                    <input 
                      type="checkbox"
                      checked={settings.autoRefresh}
                      onChange={(e) => handleSettingChange('autoRefresh', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </div>
                </label>
                <p className="setting-description">Automatically refresh weather data</p>
              </div>

              <div className="setting-item">
                <label>
                  <span className="setting-label">Refresh Interval</span>
                  <select 
                    value={settings.refreshInterval}
                    onChange={(e) => handleSettingChange('refreshInterval', parseInt(e.target.value))}
                    className="setting-select"
                    disabled={!settings.autoRefresh}
                  >
                    <option value={5}>5 minutes</option>
                    <option value={10}>10 minutes</option>
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                  </select>
                </label>
                <p className="setting-description">How often to refresh weather data</p>
              </div>
            </div>
          </section>

          <section className="settings-section">
            <h2>Notifications</h2>
            <div className="setting-group">
              <div className="setting-item">
                <label className="toggle-label">
                  <span className="setting-label">Weather Alerts</span>
                  <div className="toggle-switch">
                    <input 
                      type="checkbox"
                      checked={settings.notifications}
                      onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </div>
                </label>
                <p className="setting-description">Receive severe weather alerts</p>
              </div>
            </div>
          </section>

          <section className="settings-section">
            <h2>About</h2>
            <div className="setting-group">
              <div className="setting-item">
                <div className="about-info">
                  <h3>Weather Forecaster</h3>
                  <p>Version 1.0.0</p>
                  <p>A professional weather application with real-time data and forecasts.</p>
                  <div className="about-links">
                    <a href="#" className="about-link">Privacy Policy</a>
                    <a href="#" className="about-link">Terms of Service</a>
                    <a href="#" className="about-link">Support</a>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="settings-section">
            <h2>Danger Zone</h2>
            <div className="setting-group">
              <div className="setting-item">
                <button className="reset-btn" onClick={handleResetSettings}>
                  Reset All Settings
                </button>
                <p className="setting-description">Reset all settings to default values</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage

import React, { useEffect, useState } from 'react'
import { WeatherDeskIcon } from './WeatherIcons'
import { APP_VERSION } from '../utils/appInfo'
import './DesktopUpdate.css'

// The Windows shell is the only place that can install an update, so this panel
// reports what that process is doing. In a browser there is nothing to update —
// the site is always the just-deployed build.
const RELEASES_URL = 'https://github.com/Bungles17x/Weather-Forecaster/releases/latest'

function describeStatus(state) {
  switch (state?.status) {
    case 'checking': return 'Checking the GitHub release feed…'
    case 'downloading': return `Downloading the update${Number.isFinite(state.percent) ? ` · ${state.percent}%` : ''}…`
    case 'ready': return `Version ${state.version || 'new'} downloaded — restart WeatherDesk to install it.`
    case 'current': return 'You are running the latest published build.'
    case 'error': return `Update check failed: ${state.reason || 'unknown error'}. The app keeps working and will retry later.`
    case 'unavailable': return 'Updates apply to the installed Windows app.'
    default: return 'Not checked yet this session.'
  }
}

export default function DesktopUpdatePanel() {
  const bridge = typeof window !== 'undefined' ? window.weatherdeskDesktop : null
  const [state, setState] = useState({ status: bridge ? 'idle' : 'web' })
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!bridge?.onUpdateStatus) return undefined
    return bridge.onUpdateStatus(next => {
      if (next?.status) setState(next)
    })
  }, [bridge])

  const check = async () => {
    if (!bridge?.checkForUpdates) return
    setBusy(true)
    try {
      const result = await bridge.checkForUpdates()
      if (result?.status) setState(result)
    } finally {
      setBusy(false)
    }
  }

  const working = busy || state.status === 'checking' || state.status === 'downloading'

  return (
    <section className="settings-section desktop-update-section">
      <div className="settings-section-heading">
        <span className="settings-section-icon"><WeatherDeskIcon name="download" size={22} /></span>
        <div>
          <h2>Desktop app</h2>
          <p>Version and update status for the installed Windows build.</p>
        </div>
      </div>
      <div className="desktop-update-card">
        <div className="desktop-update-row">
          <span className="setting-label">Installed version</span>
          <code className="desktop-update-version">v{APP_VERSION}</code>
        </div>
        <div className="desktop-update-row">
          <span className="setting-label">Running as</span>
          <span className={`desktop-update-badge ${bridge ? 'is-desktop' : ''}`}>
            {bridge ? 'Windows desktop app' : 'Web browser'}
          </span>
        </div>
        <div className="desktop-update-row desktop-update-row-status">
          <span className="setting-label">Update status</span>
          <span className="desktop-update-status" role="status">{describeStatus(state)}</span>
        </div>
        {bridge ? (
          <button type="button" className="desktop-update-button" onClick={check} disabled={working}>
            <WeatherDeskIcon name="refresh" size={15} />
            {state.status === 'checking' ? 'Checking…' : state.status === 'downloading' ? `Downloading ${state.percent ?? 0}%` : 'Check for updates'}
          </button>
        ) : (
          <p className="desktop-update-note">
            Updates arrive with each website deploy, so the browser build is never stale.
            {' '}
            <a href={RELEASES_URL} target="_blank" rel="noreferrer">Install the Windows app</a>
            {' '}to get automatic updates through GitHub releases.
          </p>
        )}
      </div>
    </section>
  )
}

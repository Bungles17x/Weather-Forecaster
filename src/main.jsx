import React from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { LocationProvider } from './contexts/LocationContext'
import { SettingsProvider } from './contexts/SettingsContext'
import { WeatherProvider } from './contexts/WeatherContext'
import { NotificationProvider } from './components/NotificationSystem'
import ErrorBoundary from './components/ErrorBoundary'
import ErrorScreen from './components/ErrorScreen'
import RuntimeErrorMonitor from './components/RuntimeErrorMonitor'
import { installGlobalErrorCapture } from './services/runtimeCapture'
import { errorManager } from './services/errorManager'
import { APP_NAME, APP_VERSION } from './utils/appInfo'
import './styles.css'
import './design-polish.css'

// Load dev tools in development
if (import.meta.env.DEV) {
  import('./utils/devTools')
}

// Capture starts before React renders, so a failure during startup reaches the
// error screen instead of dying quietly in the console.
installGlobalErrorCapture()

const rootElement = document.getElementById('root')

try {
  createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <HashRouter>
          <RuntimeErrorMonitor />
          <NotificationProvider>
            <SettingsProvider>
              <LocationProvider>
                <WeatherProvider>
                  <App />
                </WeatherProvider>
              </LocationProvider>
            </SettingsProvider>
          </NotificationProvider>
        </HashRouter>
      </ErrorBoundary>
    </React.StrictMode>
  )
} catch (bootError) {
  // Nothing else can render the app, so fall back to the crash screen itself in
  // a separate container (reusing #root would trip React's double-root warning).
  errorManager.logError(bootError, { kind: 'boot' })
  try {
    const fallback = document.createElement('div')
    fallback.id = 'boot-error-fallback'
    document.body.appendChild(fallback)
    createRoot(fallback).render(<ErrorScreen error={bootError} />)
  } catch {
    document.body.innerHTML = '<div style="min-height:100vh;display:grid;place-items:center;padding:24px;background:#050b13;color:#e6f2ff;font:15px/1.6 system-ui,sans-serif;text-align:center">WeatherDesk could not start. Reload the page to try again.<br><a style="color:#6ee7f9" href="">Reload</a></div>'
  }
}

// Dismiss the boot splash once React has mounted.
const bootSplash = document.getElementById('boot-splash')
if (bootSplash) {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    bootSplash.classList.add('boot-splash-out')
    window.setTimeout(() => bootSplash.remove(), 600)
  }))
}

// Console test hooks — e.g. window.__weatherForecaster.testError()
window.__weatherForecaster = {
  version: APP_VERSION,
  testError() {
    setTimeout(() => { throw new Error('[test] Simulated runtime error — triggered via window.__weatherForecaster.testError()') }, 0)
  },
  testRejection() {
    Promise.reject(new Error('[test] Simulated unhandled rejection — triggered via window.__weatherForecaster.testRejection()'))
  }
}
if (import.meta.env.DEV) {
      console.info(`[${APP_NAME}] Crash-screen test hooks: window.__weatherForecaster.testError()`)
}

// Clear the one-shot chunk-reload guard once the app has started successfully.
setTimeout(() => {
  try { sessionStorage.removeItem('weatherdesk:chunk-reload') } catch { /* ignore */ }
}, 5000)

// Register the installable app shell on secure hosting (HTTPS or localhost).
// The desktop shell ships its own files and updates through its installer, so it
// has no service worker to register.
if ('serviceWorker' in navigator && import.meta.env.PROD && !window.weatherdeskDesktop) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL })
      .catch(() => { /* The website remains usable if offline support is unavailable. */ })
  })
}

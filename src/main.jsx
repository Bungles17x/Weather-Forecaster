import React from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { LocationProvider } from './contexts/LocationContext'
import { SettingsProvider } from './contexts/SettingsContext'
import { WeatherProvider } from './contexts/WeatherContext'
import { NotificationProvider } from './components/NotificationSystem'
import ErrorBoundary from './components/ErrorBoundary'
import RuntimeErrorMonitor from './components/RuntimeErrorMonitor'
import './styles.css'
import './design-polish.css'

// Load dev tools in development
if (import.meta.env.DEV) {
  import('./utils/devTools')
}

createRoot(document.getElementById('root')).render(
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
  version: '2.1.1',
  testError() {
    setTimeout(() => { throw new Error('[test] Simulated runtime error — triggered via window.__weatherForecaster.testError()') }, 0)
  },
  testRejection() {
    Promise.reject(new Error('[test] Simulated unhandled rejection — triggered via window.__weatherForecaster.testRejection()'))
  }
}
if (import.meta.env.DEV) {
  console.info('[Weather Forecaster] Test the error screen: window.__weatherForecaster.testError()')
}

// Clear the one-shot chunk-reload guard once the app has started successfully.
setTimeout(() => {
  try { sessionStorage.removeItem('weatherdesk:chunk-reload') } catch { /* ignore */ }
}, 5000)

// Register the installable app shell on secure hosting (HTTPS or localhost).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL })
      .catch(() => { /* The website remains usable if offline support is unavailable. */ })
  })
}

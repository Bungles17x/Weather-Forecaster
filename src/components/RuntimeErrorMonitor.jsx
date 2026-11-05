import React, { useEffect, useState } from 'react'
import './RuntimeErrorMonitor.css'

const BENIGN = [
  /resizeobserver loop/i,
  /script error\.?/i,
  /chrome-extension:/i,
  /moz-extension:/i,
  /download the react devtools/i,
  /^warning:/i,
  /react does not recognize/i,
  /validatedomnesting/i,
  /cannot update a component/i,
  /a component is changing an uncontrolled/i,
  /leaflet/i
]

function stringifyArgs(args) {
  return args.map(value => {
    if (value instanceof Error) return `${value.name}: ${value.message}${value.stack ? `\n${value.stack}` : ''}`
    if (typeof value === 'string') return value
    try { return JSON.stringify(value) } catch { return String(value) }
  }).join(' ')
}

function isBenign(detail) {
  const text = String(detail || '')
  return BENIGN.some(pattern => pattern.test(text))
}

/**
 * Captures uncaught exceptions and console errors.
 * Full-screen recovery is reserved for real uncaught runtime failures.
 * Console errors are recorded in a non-blocking diagnostic dock so React/library
 * logging cannot take over the workstation UI.
 */
export default function RuntimeErrorMonitor() {
  const [runtimeError, setRuntimeError] = useState(null)
  const [errorHistory, setErrorHistory] = useState([])
  const [dockOpen, setDockOpen] = useState(false)

  useEffect(() => {
    const originalConsoleError = console.error
    const originalConsoleWarn = console.warn
    const originalConsoleLog = console.log
    let lastSignature = ''
    let lastAt = 0

    const record = (title, detail, severity, blocking) => {
      const message = [title, detail].filter(Boolean).join('\n')
      if (isBenign(message)) return
      const now = Date.now()
      if (message === lastSignature && now - lastAt < 1500) return
      lastSignature = message
      lastAt = now
      const errorEntry = {
        title,
        detail: String(detail || title).slice(0, 15000),
        time: new Date().toLocaleTimeString(),
        severity,
        timestamp: now,
        blocking
      }
      setErrorHistory(prev => [errorEntry, ...prev].slice(0, 50))
      if (blocking) setRuntimeError(errorEntry)
    }

    console.error = (...args) => {
      originalConsoleError.apply(console, args)
      const detail = stringifyArgs(args)
      record('Console Error Detected', detail || 'The application wrote an error to the console.', 'error', false)
    }

    console.warn = (...args) => {
      originalConsoleWarn.apply(console, args)
    }

    const handleError = event => {
      const detail = event.error?.stack || event.message || 'Unknown JavaScript error'
      if (isBenign(detail)) return
      record('Uncaught Runtime Error', detail, 'error', true)
    }

    const handleRejection = event => {
      const reason = event.reason
      const detail = reason instanceof Error ? `${reason.name}: ${reason.message}\n${reason.stack || ''}` : String(reason ?? 'Unknown rejection')
      if (isBenign(detail)) return
      record('Unhandled Promise Rejection', detail, 'error', true)
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleRejection)

    return () => {
      console.error = originalConsoleError
      console.warn = originalConsoleWarn
      console.log = originalConsoleLog
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleRejection)
    }
  }, [])

  const severityColors = {
    error: '#ff5c68',
    warning: '#ffd166',
    info: '#67b7ff'
  }

  const nonBlocking = errorHistory.filter(item => !item.blocking)

  return (
    <>
      {runtimeError && (
        <div className="runtime-error-overlay" role="alertdialog" aria-modal="true" aria-labelledby="runtime-error-title">
          <section className="runtime-error-panel">
            <div className="runtime-error-mark" style={{ borderColor: severityColors[runtimeError.severity], color: severityColors[runtimeError.severity] }} aria-hidden="true">!</div>
            <p className="runtime-error-eyebrow">WEATHER FORECASTER · RUNTIME MONITOR</p>
            <h1 id="runtime-error-title">Something went wrong</h1>
            <p className="runtime-error-summary">Weather Forecaster caught an uncaught {runtimeError.severity.toUpperCase()}. The workstation can often continue after a reload. Console diagnostics stay in the dock and no longer block the UI.</p>
            <div className="runtime-error-meta">
              <span className="runtime-error-severity" style={{ color: severityColors[runtimeError.severity] }}>
                {runtimeError.severity.toUpperCase()}
              </span>
              <span>Detected at {runtimeError.time}</span>
            </div>
            <pre className="runtime-error-details">{runtimeError.title}{'\n\n'}{runtimeError.detail}</pre>
            {errorHistory.length > 1 && (
              <details className="runtime-error-history">
                <summary>Error History ({errorHistory.length} entries)</summary>
                <div className="runtime-error-history-list">
                  {errorHistory.slice(1).map((err, idx) => (
                    <div key={`${err.timestamp}-${idx}`} className="runtime-error-history-item">
                      <span className="history-time">{err.time}</span>
                      <span className="history-severity" style={{ color: severityColors[err.severity] }}>{err.severity}</span>
                      <span className="history-title">{err.title}</span>
                    </div>
                  ))}
                </div>
              </details>
            )}
            <div className="runtime-error-actions">
              <button type="button" className="runtime-error-primary" onClick={() => window.location.reload()}>
                Reload Weather Forecaster
              </button>
              <button type="button" className="runtime-error-secondary" onClick={() => setRuntimeError(null)}>
                Continue using the app
              </button>
              <button type="button" className="runtime-error-tertiary" onClick={() => { setErrorHistory([]); setRuntimeError(null) }}>
                Clear History
              </button>
            </div>
            <p className="runtime-error-footnote">This diagnostic screen does not replace official weather alerts or emergency instructions.</p>
          </section>
        </div>
      )}

      {!runtimeError && nonBlocking.length > 0 && (
        <div className="runtime-error-dock">
          <button type="button" className="runtime-error-dock-toggle" onClick={() => setDockOpen(open => !open)} aria-expanded={dockOpen}>
            {nonBlocking.length} console {nonBlocking.length === 1 ? 'issue' : 'issues'}
          </button>
          {dockOpen && (
            <div className="runtime-error-dock-panel" role="status">
              <pre className="runtime-error-details">{nonBlocking[0].title}{'\n\n'}{nonBlocking[0].detail}</pre>
              <button type="button" className="runtime-error-tertiary" onClick={() => setErrorHistory([])}>Clear</button>
            </div>
          )}
        </div>
      )}
    </>
  )
}

import React, { useEffect, useState } from 'react'
import { errorManager, ERROR_SEVERITY } from '../services/errorManager'
import './RuntimeErrorMonitor.css'

function stringifyArgs(args) {
  return args.map(value => {
    if (value instanceof Error) return `${value.name}: ${value.message}${value.stack ? `\n${value.stack}` : ''}`
    if (typeof value === 'string') return value
    try { return JSON.stringify(value) } catch { return String(value) }
  }).join(' ')
}

/**
 * Captures uncaught exceptions and console errors.
 * Integrates with the centralized error manager for tracking and reporting.
 */
export default function RuntimeErrorMonitor() {
  const [runtimeError, setRuntimeError] = useState(null)
  const [errorHistory, setErrorHistory] = useState([])
  const [dockOpen, setDockOpen] = useState(false)

  useEffect(() => {
    // Subscribe to error manager events
    const unsubscribe = errorManager.subscribe((event, data) => {
      if (event === 'errorLogged' || event === 'errorGrouped') {
        // Convert error manager format to runtime monitor format
        const errorEntry = {
          title: `${data.category.toUpperCase()} ERROR`,
          detail: data.message,
          time: new Date(data.timestamp).toLocaleTimeString(),
          severity: data.severity,
          timestamp: data.timestamp,
          blocking: data.severity === ERROR_SEVERITY.FATAL || data.severity === ERROR_SEVERITY.CRITICAL,
          count: data.count,
          code: data.id
        }
        setErrorHistory(prev => [errorEntry, ...prev].slice(0, 50))
        if (errorEntry.blocking) setRuntimeError(errorEntry)
      }
    })

    const originalConsoleError = console.error
    const originalConsoleWarn = console.warn
    const originalConsoleLog = console.log

    console.error = (...args) => {
      originalConsoleError.apply(console, args)
      const detail = stringifyArgs(args)
      const error = args[0] instanceof Error ? args[0] : new Error(detail)
      errorManager.logError(error, { source: 'console' })
    }

    console.warn = (...args) => {
      originalConsoleWarn.apply(console, args)
    }

    const handleError = event => {
      const error = event.error || new Error(event.message)
      errorManager.logError(error, {
        source: event.filename,
        line: event.lineno,
        column: event.colno
      })
    }

    const handleRejection = event => {
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason))
      errorManager.logError(error, { promise: true })
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleRejection)

    return () => {
      unsubscribe()
      console.error = originalConsoleError
      console.warn = originalConsoleWarn
      console.log = originalConsoleLog
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleRejection)
    }
  }, [])

  const severityColors = {
    fatal: '#ff003c',
    critical: '#ff6a7a',
    warning: '#ffd166',
    minor: '#67b7ff'
  }

  const copyToClipboard = () => {
    const text = errorHistory.map(err => `[${err.time}] ${err.severity.toUpperCase()}: ${err.title}\n${err.detail}`).join('\n\n---\n\n')
    navigator.clipboard.writeText(text).catch(() => {})
  }

  const exportReport = () => {
    const report = errorManager.exportReport()
    const blob = new Blob([report], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `weather-forecaster-error-report-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const clearHistory = () => {
    errorManager.clearHistory()
    setErrorHistory([])
    setRuntimeError(null)
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
              {runtimeError.count > 1 && <span>Count: {runtimeError.count}</span>}
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
              <button type="button" className="runtime-error-tertiary" onClick={copyToClipboard}>
                Copy Details
              </button>
              <button type="button" className="runtime-error-tertiary" onClick={exportReport}>
                Export Report
              </button>
              <button type="button" className="runtime-error-tertiary" onClick={clearHistory}>
                Clear History
              </button>
            </div>
            <div className="runtime-error-system">
              <strong>System Status:</strong>
              <span>Online: {navigator.onLine ? 'Yes' : 'No'}</span>
              <span>URL: {window.location.href}</span>
              <span>User Agent: {navigator.userAgent?.slice(0, 60)}...</span>
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
              <button type="button" className="runtime-error-tertiary" onClick={() => { errorManager.clearHistory(); setErrorHistory([]) }}>Clear</button>
            </div>
          )}
        </div>
      )}
    </>
  )
}

import React, { useEffect, useState } from 'react'
import Header from '../components/Header'
import { errorManager } from '../services/errorManager'
import { WeatherDeskIcon } from '../components/WeatherIcons'
import './ErrorHistoryPage.css'

export default function ErrorHistoryPage() {
  const [errorHistory, setErrorHistory] = useState([])
  const [errorGroups, setErrorGroups] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [selectedSeverity, setSelectedSeverity] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')

  useEffect(() => {
    const loadData = () => {
      setErrorHistory(errorManager.getErrorHistory())
      setErrorGroups(errorManager.getErrorGroups())
      setStatistics(errorManager.getStatistics())
    }

    loadData()

    const unsubscribe = errorManager.subscribe(() => {
      loadData()
    })

    return unsubscribe
  }, [])

  const filteredErrors = errorHistory.filter(error => {
    if (selectedSeverity !== 'all' && error.severity !== selectedSeverity) return false
    if (selectedCategory !== 'all' && error.category !== selectedCategory) return false
    return true
  })

  const clearHistory = () => {
    if (window.confirm('Are you sure you want to clear all error history?')) {
      errorManager.clearHistory()
      setErrorHistory([])
      setErrorGroups([])
      setStatistics(errorManager.getStatistics())
    }
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

  const resolveError = (signature) => {
    errorManager.resolveError(signature)
    setErrorGroups(errorManager.getErrorGroups())
    setStatistics(errorManager.getStatistics())
  }

  const severityColor = (severity) => ({
    fatal: '#ff003c',
    critical: '#ff6a7a',
    warning: '#ffd166',
    minor: '#67b7ff'
  }[severity] || '#91a4ba')

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <div className="data-page error-history-page">
      <Header />
      <main className="data-main">
        <div className="page-heading">
          <div>
            <div className="eyebrow"><span className="eyebrow-dot" /> ERROR MANAGEMENT SYSTEM</div>
            <h1>Error History Dashboard</h1>
            <p>View, analyze, and manage all application errors with detailed diagnostics and statistics.</p>
          </div>
          <div className="heading-actions">
            <button className="secondary-action" onClick={exportReport}>
              <WeatherDeskIcon name="download" size={15} /> Export Report
            </button>
            <button className="secondary-action" onClick={clearHistory}>
              <WeatherDeskIcon name="refresh" size={15} /> Clear History
            </button>
          </div>
        </div>

        {statistics && (
          <section className="error-statistics">
            <h2>Error Statistics</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-label">Total Errors</span>
                <strong className="stat-value">{statistics.total}</strong>
              </div>
              <div className="stat-card">
                <span className="stat-label">Fatal</span>
                <strong className="stat-value" style={{ color: severityColor('fatal') }}>{statistics.bySeverity.fatal}</strong>
              </div>
              <div className="stat-card">
                <span className="stat-label">Critical</span>
                <strong className="stat-value" style={{ color: severityColor('critical') }}>{statistics.bySeverity.critical}</strong>
              </div>
              <div className="stat-card">
                <span className="stat-label">Warning</span>
                <strong className="stat-value" style={{ color: severityColor('warning') }}>{statistics.bySeverity.warning}</strong>
              </div>
              <div className="stat-card">
                <span className="stat-label">Minor</span>
                <strong className="stat-value" style={{ color: severityColor('minor') }}>{statistics.bySeverity.minor}</strong>
              </div>
              <div className="stat-card">
                <span className="stat-label">Resolved</span>
                <strong className="stat-value" style={{ color: '#8ce6bf' }}>{statistics.resolved}</strong>
              </div>
            </div>
          </section>
        )}

        <section className="error-filters">
          <h2>Filter Errors</h2>
          <div className="filter-controls">
            <div className="filter-group">
              <label>Severity</label>
              <select value={selectedSeverity} onChange={e => setSelectedSeverity(e.target.value)}>
                <option value="all">All Severities</option>
                <option value="fatal">Fatal</option>
                <option value="critical">Critical</option>
                <option value="warning">Warning</option>
                <option value="minor">Minor</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Category</label>
              <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                <option value="all">All Categories</option>
                <option value="network">Network</option>
                <option value="api">API</option>
                <option value="render">Render</option>
                <option value="validation">Validation</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
          </div>
        </section>

        <section className="error-list-section">
          <div className="section-title-row">
            <div>
              <h2>Error History</h2>
              <p>Showing {filteredErrors.length} of {errorHistory.length} total errors</p>
            </div>
          </div>

          {filteredErrors.length === 0 ? (
            <div className="empty-card">
              <WeatherDeskIcon name="check" size={48} />
              <strong>No errors recorded</strong>
              <p>The application is running smoothly. Errors will appear here as they occur.</p>
            </div>
          ) : (
            <div className="error-list">
              {filteredErrors.map((error, index) => (
                <div key={`${error.id}-${index}`} className="error-card">
                  <div className="error-card-header">
                    <div className="error-card-badges">
                      <span className="error-badge" style={{ background: severityColor(error.severity) + '20', color: severityColor(error.severity), borderColor: severityColor(error.severity) }}>
                        {error.severity.toUpperCase()}
                      </span>
                      <span className="error-badge category-badge">
                        {error.category.toUpperCase()}
                      </span>
                    </div>
                    <span className="error-time">{formatTimestamp(error.timestamp)}</span>
                  </div>
                  <h3 className="error-message">{error.message}</h3>
                  <div className="error-meta">
                    <span>Occurrences: {error.count}</span>
                    <span>Last seen: {formatTimestamp(error.lastSeen)}</span>
                    {error.resolved && <span className="resolved-badge">Resolved</span>}
                  </div>
                  <details className="error-details">
                    <summary>View Details</summary>
                    <div className="error-details-content">
                      <div className="detail-row">
                        <span>Error ID:</span>
                        <code>{error.id}</code>
                      </div>
                      <div className="detail-row">
                        <span>Signature:</span>
                        <code>{error.signature}</code>
                      </div>
                      <div className="detail-row">
                        <span>URL:</span>
                        <code>{error.context?.url || 'N/A'}</code>
                      </div>
                      <div className="detail-row">
                        <span>Online:</span>
                        <code>{error.context?.online ? 'Yes' : 'No'}</code>
                      </div>
                      <pre className="error-stack">{error.stack}</pre>
                    </div>
                  </details>
                  {!error.resolved && (
                    <button className="resolve-btn" onClick={() => resolveError(error.signature)}>
                      Mark as Resolved
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="error-groups-section">
          <h2>Error Groups (Recent Similar Errors)</h2>
          {errorGroups.length === 0 ? (
            <div className="empty-card compact-empty">
              <strong>No error groups</strong>
            </div>
          ) : (
            <div className="error-groups">
              {errorGroups.slice(0, 10).map((group, index) => (
                <div key={`${group.signature}-${index}`} className="error-group-card">
                  <div className="group-header">
                    <strong>{group.message?.slice(0, 80)}...</strong>
                    <span className="group-count">{group.count} occurrences</span>
                  </div>
                  <div className="group-meta">
                    <span>{group.category.toUpperCase()}</span>
                    <span style={{ color: severityColor(group.severity) }}>{group.severity.toUpperCase()}</span>
                    <span>Last: {formatTimestamp(group.lastSeen)}</span>
                  </div>
                  {group.resolved && <span className="resolved-badge">Resolved</span>}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="error-architecture-note">
          <h2>Email Reporting Architecture</h2>
          <div className="note-card">
            <strong>Backend Required for Email Delivery</strong>
            <p>To automatically email error reports without exposing API keys, you need a separate backend service. Recommended architecture:</p>
            <ul>
              <li><strong>Vercel Serverless Function</strong> - Deploy an API endpoint that receives error reports via POST</li>
              <li><strong>AWS Lambda + SES</strong> - Use AWS Lambda with Simple Email Service for delivery</li>
              <li><strong>Cloudflare Workers</strong> - Edge functions with email integration</li>
              <li><strong>Third-party services</strong> - Sentry, LogRocket, or similar for production error tracking</li>
            </ul>
            <p>The frontend can securely send error reports to your backend endpoint, which then handles email delivery with proper credentials stored in server-side environment variables.</p>
            <p><strong>Current implementation:</strong> Error detection, grouping, history, and export are fully functional. Email integration requires the backend service described above.</p>
          </div>
        </section>

        <footer className="app-footer">
          <span>WEATHER FORECASTER <i>•</i> ERROR MANAGEMENT SYSTEM</span>
          <p>Errors are stored locally in your browser. Export reports for sharing with developers.</p>
        </footer>
      </main>
    </div>
  )
}

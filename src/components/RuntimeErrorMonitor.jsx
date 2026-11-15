import React, { useEffect, useRef, useState } from 'react'
import { errorManager, ERROR_SEVERITY } from '../services/errorManager'
import { WeatherDeskIcon } from './WeatherIcons'
import { APP_NAME, APP_VERSION } from '../utils/appInfo'
import { copyText } from '../utils/clipboard'
import './RuntimeErrorMonitor.css'

const SEVERITY_COLORS = {
  fatal: '#ff5c7a',
  critical: '#ff8b5c',
  warning: '#ffd166',
  minor: '#67b7ff'
}

const KIND_LABELS = {
  uncaught: 'Uncaught exception',
  rejection: 'Unhandled promise rejection',
  boundary: 'Render failure',
  boot: 'Startup failure',
  console: 'Console error',
  warning: 'Console warning',
  resource: 'Resource load failure'
}

function toEntry(record) {
  const kind = record?.context?.kind || 'console'
  const severity = record?.severity || 'minor'
  return {
    id: record?.id || `${record?.timestamp || Date.now()}-${Math.random().toString(36).slice(2)}`,
    kind,
    kindLabel: KIND_LABELS[kind] || 'Captured issue',
    article: /^[aeiou]/i.test(KIND_LABELS[kind] || 'issue') ? 'An' : 'A',
    severity,
    color: SEVERITY_COLORS[severity] || '#91a4ba',
    message: record?.message || 'Unknown error',
    stack: record?.stack || '',
    category: record?.category || 'unknown',
    code: `WD-${String(record?.signature || 'unknown').toUpperCase()}`,
    timestamp: record?.timestamp || new Date().toISOString(),
    time: record?.timestamp ? new Date(record.timestamp).toLocaleTimeString() : 'just now',
    count: record?.count || 1,
    // Both errors and warnings open the screen automatically; this only decides
    // how the dock counts them and whether the panel uses crash wording.
    isError: kind === 'warning'
      ? false
      : kind === 'resource'
        ? severity !== ERROR_SEVERITY.WARNING
        : true,
  }
}

// One clipboard document covering every captured issue, for pasting into a
// support request without exporting a file first.
function buildAllReports(issues) {
  const header = [
    `${APP_NAME} captured issue report`,
    `version: ${APP_VERSION}`,
    `generated: ${new Date().toISOString()}`,
    `route: ${window.location.hash || '#/'}`,
    `url: ${window.location.href}`,
    `online: ${navigator.onLine ? 'yes' : 'no'}`,
    `issues: ${issues.length}`,
    ''
  ].join('\n')

  const blocks = issues.map((issue, index) => [
    `${index + 1} of ${issues.length} · ${issue.severity} · ${issue.kindLabel}`,
    `code: ${issue.code}`,
    `category: ${issue.category}`,
    `detected: ${issue.timestamp}`,
    `occurrences: ${issue.count}`,
    '',
    issue.message,
    '',
    issue.stack || 'No stack trace captured.'
  ].join('\n'))

  return [header, ...blocks].join('\n\n────────────────────────\n\n')
}

function buildIssueReport(issue) {
  return [
    `${APP_NAME} runtime report`,
    `version: ${APP_VERSION}`,
    `code: ${issue.code}`,
    `kind: ${issue.kindLabel}`,
    `severity: ${issue.severity}`,
    `category: ${issue.category}`,
    `detected: ${issue.timestamp}`,
    `occurrences: ${issue.count}`,
    `route: ${window.location.hash || '#/'}`,
    `url: ${window.location.href}`,
    `online: ${navigator.onLine ? 'yes' : 'no'}`,
    '',
    issue.message,
    '',
    issue.stack || 'No stack trace captured.'
  ].join('\n')
}

export default function RuntimeErrorMonitor() {
  const [issues, setIssues] = useState([])
  const [activeIssue, setActiveIssue] = useState(null)
  const [dockOpen, setDockOpen] = useState(false)
  const [copyState, setCopyState] = useState('idle')
  const [copyAllState, setCopyAllState] = useState('idle')
  const panelRef = useRef(null)
  const copyTimer = useRef(null)
  // Issues already shown once, so a repeating warning cannot reopen the screen.
  const shownIssues = useRef(new Set())

  useEffect(() => {
    let mounted = true

    const publish = (event, data) => {
      if (!mounted) return
      // Defer past the current React work: console.error is often called while
      // another component renders, and updating state then would itself warn.
      queueMicrotask(() => {
        if (!mounted) return
        if (event === 'historyCleared') {
          setIssues([])
          setActiveIssue(null)
          return
        }
        if (event !== 'errorLogged' && event !== 'errorGrouped') return
        const entry = toEntry(data)
        setIssues(previous => [entry, ...previous.filter(item => item.id !== entry.id)].slice(0, 40))
        // Show every new failure on its own. Repeats of an issue that was already
        // displayed only update the counter, and nothing replaces an open panel.
        if (shownIssues.current.has(entry.id)) return
        shownIssues.current.add(entry.id)
        setActiveIssue(current => current ?? entry)
      })
    }

    const unsubscribe = errorManager.subscribe(publish)

    // Capture itself lives in services/runtimeCapture.js and is installed before
    // React mounts, so anything that failed before this component existed is
    // already in the store. Surface it instead of losing it.
    const pending = errorManager.getSessionErrors().slice(0, 40).map(toEntry)
    if (pending.length) {
      setIssues(pending)
      pending.forEach(entry => shownIssues.current.add(entry.id))
      setActiveIssue(pending[0])
    }

    return () => {
      mounted = false
      unsubscribe()
      if (copyTimer.current) window.clearTimeout(copyTimer.current)
    }
  }, [])

  // Escape dismisses the takeover view; focus moves into the panel when it opens.
  useEffect(() => {
    if (!activeIssue) return undefined
    panelRef.current?.focus()
    const onKeyDown = event => {
      if (event.key === 'Escape') setActiveIssue(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeIssue])

  const flash = (setter, copied) => {
    setter(copied ? 'copied' : 'failed')
    if (copyTimer.current) window.clearTimeout(copyTimer.current)
    copyTimer.current = window.setTimeout(() => {
      setCopyState('idle')
      setCopyAllState('idle')
    }, 2400)
  }

  const copyIssue = async issue => {
    flash(setCopyState, await copyText(buildIssueReport(issue || activeIssue)))
  }

  const copyAllIssues = async () => {
    flash(setCopyAllState, await copyText(buildAllReports(issues)))
  }

  const exportReport = () => {
    const blob = new Blob([errorManager.exportReport()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `weatherdesk-error-report-${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const clearHistory = () => {
    errorManager.clearHistory()
    setIssues([])
    setActiveIssue(null)
    setDockOpen(false)
  }

  const copyLabel = copyState === 'copied' ? 'Copied to clipboard' : copyState === 'failed' ? 'Copy blocked' : 'Copy report'
  const copyAllLabel = copyAllState === 'copied' ? 'Copied all reports' : copyAllState === 'failed' ? 'Copy blocked' : 'Copy all reports'
  const isWarning = activeIssue?.severity === ERROR_SEVERITY.WARNING
  // The dock counts errors and warnings separately: both are captured, only the
  // errors are allowed to take over the screen.
  const errorCount = issues.filter(item => item.isError).length
  const warningCount = issues.length - errorCount
  const dockCounts = [
    errorCount ? `${errorCount} ${errorCount === 1 ? 'error' : 'errors'}` : '',
    warningCount ? `${warningCount} ${warningCount === 1 ? 'warning' : 'warnings'}` : ''
  ].filter(Boolean).join(' · ')

  return (
    <>
      {activeIssue && (
        <div
          className="runtime-error-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="runtime-error-title"
          aria-describedby="runtime-error-summary"
        >
          <section className="runtime-error-panel" ref={panelRef} tabIndex={-1}>
            <header className="runtime-error-head">
              <span
                className="runtime-error-mark"
                aria-hidden="true"
                style={isWarning
                  ? {
                    color: activeIssue.color,
                    borderColor: `${activeIssue.color}66`,
                    background: `linear-gradient(150deg, ${activeIssue.color}2e, ${activeIssue.color}0d)`,
                    animation: 'none'
                  }
                  : undefined}
              >
                <WeatherDeskIcon name="warning" size={22} />
              </span>
              <span className="runtime-error-brand">
                <strong>{APP_NAME}</strong>
                <small>Runtime monitor</small>
              </span>
              <span className="runtime-error-severity" style={{ color: activeIssue.color, borderColor: `${activeIssue.color}66` }}>
                {activeIssue.severity}
              </span>
              <button
                type="button"
                className="runtime-error-close"
                onClick={() => setActiveIssue(null)}
                aria-label="Dismiss and keep using the app"
              >
                <WeatherDeskIcon name="close" size={16} />
              </button>
            </header>

            <h1 id="runtime-error-title">
              {isWarning ? 'A warning was recorded' : 'Something interrupted the workstation'}
            </h1>
            <p id="runtime-error-summary" className="runtime-error-summary">
              {isWarning
                ? `${activeIssue.article} ${activeIssue.kindLabel.toLowerCase()} was captured and recorded. Nothing on screen was changed — dismiss this panel and keep working, or share the details with support.`
                : `${activeIssue.article} ${activeIssue.kindLabel.toLowerCase()} was captured and recorded. Weather that is already on screen stays as it was. Reload for a clean session, or dismiss this panel and keep working.`}
            </p>

            <dl className="runtime-error-meta">
              <div><dt>Code</dt><dd className="runtime-error-code">{activeIssue.code}</dd></div>
              <div><dt>Detected</dt><dd>{activeIssue.time}</dd></div>
              <div><dt>Category</dt><dd>{activeIssue.category}</dd></div>
              <div><dt>Occurrences</dt><dd>{activeIssue.count}</dd></div>
            </dl>

            <div className="runtime-error-trace">
              <div className="runtime-error-trace-head">
                <span>Captured output</span>
                <button type="button" onClick={() => copyIssue(activeIssue)}>
                  <WeatherDeskIcon name={copyState === 'copied' ? 'check' : 'copy'} size={13} />
                  {copyLabel}
                </button>
              </div>
              <pre>{activeIssue.stack || activeIssue.message}</pre>
            </div>

            {issues.length > 1 && (
              <details className="runtime-error-history">
                <summary>
                  {issues.length - 1} earlier {issues.length - 1 === 1 ? 'entry' : 'entries'} in this session
                </summary>
                <ol>
                  {issues.filter(item => item.id !== activeIssue.id).slice(0, 8).map(item => (
                    <li key={item.id}>
                      <span className="history-time">{item.time}</span>
                      <span className="history-severity" style={{ color: item.color }}>{item.severity}</span>
                      <span className="history-title">{item.message}</span>
                    </li>
                  ))}
                </ol>
              </details>
            )}

            <div className="runtime-error-actions">
              {isWarning ? (
                <>
                  <button type="button" className="runtime-error-primary" onClick={() => setActiveIssue(null)}>
                    <WeatherDeskIcon name="check" size={15} />
                    Dismiss
                  </button>
                  <button type="button" className="runtime-error-secondary" onClick={() => window.location.reload()}>
                    <WeatherDeskIcon name="refresh" size={15} />
                    Reload app
                  </button>
                </>
              ) : (
                <>
                  <button type="button" className="runtime-error-primary" onClick={() => window.location.reload()}>
                    <WeatherDeskIcon name="refresh" size={15} />
                    Reload app
                  </button>
                  <button type="button" className="runtime-error-secondary" onClick={() => setActiveIssue(null)}>
                    Keep working
                  </button>
                </>
              )}
              <button type="button" className="runtime-error-tertiary" onClick={copyAllIssues}>
                <WeatherDeskIcon name={copyAllState === 'copied' ? 'check' : 'copy'} size={14} />
                {copyAllLabel}
              </button>
              <button type="button" className="runtime-error-tertiary" onClick={exportReport}>
                <WeatherDeskIcon name="download" size={14} />
                Export report
              </button>
              <button type="button" className="runtime-error-tertiary" onClick={clearHistory}>
                Clear history
              </button>
            </div>

            <footer className="runtime-error-footnote">
              Diagnostics stay in this browser until you clear them. This monitor does not replace official
              NWS warnings or emergency instructions.
            </footer>
          </section>
        </div>
      )}

      {!activeIssue && issues.length > 0 && (
        <div className="runtime-error-dock">
          <button
            type="button"
            className="runtime-error-dock-toggle"
            onClick={() => setDockOpen(open => !open)}
            aria-expanded={dockOpen}
          >
            <WeatherDeskIcon name="bug" size={14} />
            {dockCounts}
          </button>

          {dockOpen && (
            <div className="runtime-error-dock-panel" role="status">
              <ol className="runtime-error-dock-list">
                {issues.slice(0, 6).map(issue => (
                  <li key={issue.id}>
                    <span className="dock-dot" style={{ background: issue.color }} aria-hidden="true" />
                    <button
                      type="button"
                      className="dock-copy-button"
                      onClick={() => setActiveIssue(issue)}
                      title="Open the captured details"
                    >
                      <strong>{issue.message}</strong>
                      <small>{issue.time} · {issue.severity} · ×{issue.count}</small>
                    </button>
                    <button type="button" onClick={() => copyIssue(issue)} aria-label="Copy this issue">
                      <WeatherDeskIcon name="copy" size={13} />
                    </button>
                  </li>
                ))}
              </ol>
              <div className="runtime-error-dock-actions">
                <button type="button" onClick={copyAllIssues}>{copyAllState === 'copied' ? 'Copied' : 'Copy all'}</button>
                <button type="button" onClick={exportReport}>Export</button>
                <button type="button" onClick={clearHistory}>Clear</button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { WeatherDeskIcon } from './WeatherIcons'
import { APP_NAME, APP_VERSION, SUPPORT_EMAIL } from '../utils/appInfo'
import { copyText, downloadJson } from '../utils/clipboard'
import './ErrorScreen.css'

const REPO_URL = 'https://github.com/Bungles17x/Weather-Forecaster'

function normalizeError(error) {
  if (error instanceof Error) {
    return { name: error.name || 'Error', message: error.message || 'No message was provided.', stack: error.stack || '' }
  }
  if (typeof error === 'string' && error.trim()) {
    return { name: 'Error', message: error.trim(), stack: '' }
  }
  if (error && typeof error === 'object') {
    try {
      return { name: 'Error', message: JSON.stringify(error) || 'Unknown error', stack: '' }
    } catch {
      return { name: 'Error', message: String(error), stack: '' }
    }
  }
  return { name: 'Error', message: 'An unexpected error occurred.', stack: '' }
}

// Stable, shareable code so a support conversation can refer to one error.
function shortCode(message) {
  let hash = 0
  for (let index = 0; index < message.length; index += 1) {
    hash = (hash * 31 + message.charCodeAt(index)) >>> 0
  }
  return `WD-${hash.toString(16).toUpperCase().padStart(6, '0').slice(-6)}`
}

function readMemory() {
  // performance.memory is Chromium-only; everywhere else we simply omit it.
  if (typeof performance === 'undefined' || !performance.memory) return null
  const mb = bytes => `${(Number(bytes) / 1048576).toFixed(2)} MB`
  return {
    used: mb(performance.memory.usedJSHeapSize),
    total: mb(performance.memory.totalJSHeapSize),
    limit: mb(performance.memory.jsHeapSizeLimit)
  }
}

function buildSnapshot(errorInfo, errorDetails) {
  const details = errorDetails || {}
  const safeWindow = typeof window !== 'undefined' ? window : null
  const safeNavigator = typeof navigator !== 'undefined' ? navigator : null

  return {
    app: APP_NAME,
    version: APP_VERSION,
    code: details.code || shortCode(errorInfo.message),
    error: `${errorInfo.name}: ${errorInfo.message}`,
    stack: errorInfo.stack || 'No stack trace captured.',
    componentStack: details.componentStack || null,
    file: details.fileName || safeWindow?.location?.pathname || 'Unknown',
    line: details.lineNumber || null,
    column: details.columnNumber || null,
    route: safeWindow?.location?.hash || '#/',
    url: safeWindow?.location?.href || 'Unknown',
    detectedAt: new Date().toISOString(),
    online: safeNavigator ? safeNavigator.onLine : null,
    language: safeNavigator?.language || null,
    viewport: safeWindow ? `${safeWindow.innerWidth}×${safeWindow.innerHeight}` : 'Unknown',
    devicePixelRatio: safeWindow?.devicePixelRatio ?? null,
    userAgent: safeNavigator?.userAgent || 'Unknown',
    memory: readMemory()
  }
}

function formatReport(snapshot) {
  return [
    `${snapshot.app} diagnostic snapshot`,
    `generated: ${snapshot.detectedAt}`,
    `version: ${snapshot.version}`,
    `code: ${snapshot.code}`,
    `route: ${snapshot.route}`,
    `url: ${snapshot.url}`,
    `online: ${snapshot.online === null ? 'unknown' : snapshot.online ? 'yes' : 'no'}`,
    `viewport: ${snapshot.viewport} @${snapshot.devicePixelRatio ?? '?'}x`,
    `language: ${snapshot.language || 'unknown'}`,
    `userAgent: ${snapshot.userAgent}`,
    snapshot.memory ? `memory: used ${snapshot.memory.used} / total ${snapshot.memory.total} / limit ${snapshot.memory.limit}` : null,
    '',
    `error: ${snapshot.error}`,
    `source: ${snapshot.file}${snapshot.line ? `:${snapshot.line}` : ''}${snapshot.column ? `:${snapshot.column}` : ''}`,
    '',
    'stack:',
    snapshot.stack,
    snapshot.componentStack ? '\ncomponent stack:' : null,
    snapshot.componentStack || null
  ].filter(line => line !== null).join('\n')
}

export default function ErrorScreen({ error, resetError, errorDetails = null }) {
  const errorInfo = normalizeError(error)
  const snapshot = buildSnapshot(errorInfo, errorDetails)
  const [copyState, setCopyState] = useState('idle')
  const [downloadState, setDownloadState] = useState('idle')
  const screenRef = useRef(null)
  const feedbackTimer = useRef(null)

  // Move focus into the screen so keyboard and screen-reader users land here,
  // without focusing a destructive action by accident.
  useEffect(() => {
    screenRef.current?.focus()
    return () => {
      if (feedbackTimer.current) window.clearTimeout(feedbackTimer.current)
    }
  }, [])

  const flash = useCallback((setter, value) => {
    setter(value)
    if (feedbackTimer.current) window.clearTimeout(feedbackTimer.current)
    feedbackTimer.current = window.setTimeout(() => setter('idle'), 2600)
  }, [])

  // No router context is required: the boundary that renders this screen lives
  // outside <HashRouter>, so navigation has to work with the raw hash.
  const goToDashboard = () => {
    if (resetError) resetError()
    window.location.hash = '#/'
  }

  const retry = () => {
    if (resetError) resetError()
    else window.location.reload()
  }

  const handleCopy = async () => {
    const copied = await copyText(formatReport(snapshot))
    flash(setCopyState, copied ? 'copied' : 'failed')
  }

  const handleDownload = () => {
    const saved = downloadJson(`weatherdesk-diagnostics-${snapshot.code}-${Date.now()}.json`, snapshot)
    flash(setDownloadState, saved ? 'saved' : 'failed')
  }

  const detectedTime = new Date(snapshot.detectedAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })

  const mailSubject = `${APP_NAME} error report ${snapshot.code}`
  const mailBody = [
    `Hi ${APP_NAME} support,`,
    '',
    'The workstation stopped with an unexpected error.',
    '',
    `Error code: ${snapshot.code}`,
    `Message: ${errorInfo.message}`,
    `Version: ${snapshot.version}`,
    `Route: ${snapshot.route}`,
    `Detected: ${snapshot.detectedAt}`,
    '',
    'I can attach the diagnostics file exported from the crash screen.'
  ].join('\n')
  const mailtoHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`

  return (
    <div className="error-screen" role="alert" aria-labelledby="error-screen-title">
      <div className="error-screen-backdrop" aria-hidden="true">
        <span className="error-glint error-glint-1" />
        <span className="error-glint error-glint-2" />
        <span className="error-glint error-glint-3" />
      </div>

      <section className="error-shell" tabIndex={-1} ref={screenRef}>
        <header className="error-shell-head">
          <span className="error-brand">
            <span className="error-brand-mark" aria-hidden="true">
              <WeatherDeskIcon name="brand" size={18} />
            </span>
            <span className="error-brand-copy">
              <strong>{APP_NAME}</strong>
              <small>Forecast workstation</small>
            </span>
          </span>
          <span className="error-status">
            <span className="error-status-dot" aria-hidden="true" />
            Application error
          </span>
        </header>

        <div className="error-hero">
          <span className="error-icon-wrapper" aria-hidden="true">
            <WeatherDeskIcon name="thunderstorm" size={34} />
          </span>
          <div className="error-hero-copy">
            <h1 className="error-title" id="error-screen-title">
              The workstation hit an unexpected error
            </h1>
            <p className="error-description">
              Your saved location and display preferences are untouched, and no data was sent anywhere.
              Retry the last action, restart the app, or share the diagnostic snapshot with support.
            </p>
          </div>
        </div>

        <dl className="error-facts">
          <div className="error-fact">
            <dt>Error code</dt>
            <dd className="error-fact-code">{snapshot.code}</dd>
          </div>
          <div className="error-fact">
            <dt>Detected</dt>
            <dd>{detectedTime}</dd>
          </div>
          <div className="error-fact">
            <dt>Route</dt>
            <dd>{snapshot.route}</dd>
          </div>
          <div className="error-fact">
            <dt>Connection</dt>
            <dd className={snapshot.online ? 'is-ok' : 'is-warn'}>
              {snapshot.online === null ? 'Unknown' : snapshot.online ? 'Online' : 'Offline'}
            </dd>
          </div>
        </dl>

        <div className="error-actions">
          <button type="button" className="error-button error-button-primary" onClick={() => window.location.reload()}>
            <WeatherDeskIcon name="refresh" size={16} />
            Restart app
          </button>
          <button type="button" className="error-button error-button-secondary" onClick={retry}>
            <WeatherDeskIcon name="sync" size={16} />
            Try again
          </button>
          <button type="button" className="error-button error-button-ghost" onClick={goToDashboard}>
            <WeatherDeskIcon name="home" size={16} />
            Back to dashboard
          </button>
        </div>

        <details className="error-details">
          <summary>
            <span className="error-details-label">
              <WeatherDeskIcon name="terminal" size={15} />
              Technical details
            </span>
            <span className="error-details-hint">stack trace, source, environment</span>
          </summary>

          <div className="error-details-body">
            <div className="error-detail-grid">
              <div><span>Thrown</span><code>{snapshot.error}</code></div>
              <div><span>Source</span><code>{snapshot.file}{snapshot.line ? `:${snapshot.line}` : ''}{snapshot.column ? `:${snapshot.column}` : ''}</code></div>
              <div><span>Version</span><code>{snapshot.version}</code></div>
              <div><span>Viewport</span><code>{snapshot.viewport} @{snapshot.devicePixelRatio ?? '?'}×</code></div>
              <div><span>Language</span><code>{snapshot.language || 'Unknown'}</code></div>
              <div><span>Memory</span><code>{snapshot.memory ? `${snapshot.memory.used} / ${snapshot.memory.total}` : 'Not reported by this browser'}</code></div>
            </div>

            <div className="error-trace-block">
              <span className="error-trace-label">Stack trace</span>
              <pre className="error-trace">{snapshot.stack}</pre>
            </div>

            {snapshot.componentStack && (
              <div className="error-trace-block">
                <span className="error-trace-label">React component stack</span>
                <pre className="error-trace">{snapshot.componentStack}</pre>
              </div>
            )}

            <div className="error-details-actions">
              <button type="button" className="error-button error-button-secondary error-button-small" onClick={handleCopy}>
                <WeatherDeskIcon name={copyState === 'copied' ? 'check' : 'copy'} size={14} />
                {copyState === 'copied' ? 'Copied to clipboard' : copyState === 'failed' ? 'Copy blocked — select the text' : 'Copy diagnostics'}
              </button>
              <button type="button" className="error-button error-button-secondary error-button-small" onClick={handleDownload}>
                <WeatherDeskIcon name={downloadState === 'saved' ? 'check' : 'download'} size={14} />
                {downloadState === 'saved' ? 'Report downloaded' : downloadState === 'failed' ? 'Download blocked' : 'Download JSON report'}
              </button>
            </div>
          </div>
        </details>

        <div className="error-recovery">
          <div className="error-recovery-steps">
            <strong>Before you report it</strong>
            <ol>
              <li>Retry with <b>Try again</b> — most one-off errors clear on a re-render.</li>
              <li>Reload with <b>Restart app</b> for a clean session.</li>
              <li>Confirm you are online if radar, forecasts, or alerts look stale.</li>
              <li>Still stuck? Send the error code and the JSON report to support.</li>
            </ol>
          </div>
          <div className="error-recovery-contact">
            <a className="error-button error-button-secondary" href={mailtoHref}>
              <WeatherDeskIcon name="contact" size={15} />
              Email support
            </a>
            <a className="error-inline-link" href={REPO_URL} target="_blank" rel="noreferrer">
              <WeatherDeskIcon name="arrowUpRight" size={13} />
              Report an issue on GitHub
            </a>
            <small>
              Nothing is uploaded automatically. Only what you choose to copy, download, or paste into an email leaves this browser.
            </small>
          </div>
        </div>

        <footer className="error-footnote">
          Weather data comes from the U.S. National Weather Service. {APP_NAME} is an independent educational
          workstation and never replaces official warnings or emergency instructions.
        </footer>
      </section>
    </div>
  )
}

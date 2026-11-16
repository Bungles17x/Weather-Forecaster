// Centralized error store for WeatherDesk.
//
// This module owns storage, grouping, statistics and reporting only. The global
// browser hooks (window 'error', 'unhandledrejection' and console.error) live in
// components/RuntimeErrorMonitor.jsx, so each failure is captured exactly once
// instead of being logged twice by two competing listeners.

const ERROR_SEVERITY = {
  FATAL: 'fatal',
  CRITICAL: 'critical',
  WARNING: 'warning',
  MINOR: 'minor'
}

const SEVERITY_VALUES = new Set(Object.values(ERROR_SEVERITY))

const ERROR_CATEGORIES = {
  NETWORK: 'network',
  API: 'api',
  RENDER: 'render',
  VALIDATION: 'validation',
  UNKNOWN: 'unknown'
}

// Vite exposes only VITE_-prefixed keys on import.meta.env. Reading process.env
// here would be undefined in the browser.
const env = import.meta.env || {}
const ERROR_REPORTING_ENDPOINT = String(env.VITE_ERROR_REPORTING_ENDPOINT || '').trim()

// Third-party messages that are build advice rather than app failures. They are
// never captured, and records stored by earlier builds are dropped on load.
const IGNORED_MESSAGE_PATTERNS = [
  /React Router Future Flag Warning/i,
  /v7_startTransition|v7_relativeSplatPath|v7_fetcherPersist/i,
  /Sourcemap for .* points to missing source files/i,
  /Download the React DevTools/i,
  // Extensions inject their own scripts into the page. A failure inside one
  // ("Cannot redefine property: location" is the common one) says nothing about
  // WeatherDesk, so it is dropped instead of filling the report a user sends.
  /(?:chrome|moz|safari|ms-browser|edge)-extension:\/\//i,
  // NOAA retired these national mosaics; their GetMap requests 404 by design and
  // the app no longer offers them. Records from older builds are dropped too.
  /conus_(?:[a-z0-9]+:)?(?:mtmp|srmt_v\d+|vil)\b/i
]

function isIgnorableMessage(text) {
  return IGNORED_MESSAGE_PATTERNS.some(pattern => pattern.test(String(text || '')))
}

// localStorage throws in private mode and is absent in non-browser contexts.
const storage = {
  get(key) {
    try { return window.localStorage.getItem(key) } catch { return null }
  },
  set(key, value) {
    try { window.localStorage.setItem(key, value); return true } catch { return false }
  }
}

class ErrorManager {
  constructor() {
    this.errorHistory = []
    this.errorGroups = new Map()
    this.listeners = new Set()
    this.maxHistorySize = 100
    this.groupingTimeout = 5 * 60 * 1000 // 5 minutes
    this.emailEnabled = storage.get('weatherForecaster_emailEnabled') === 'true'
    // Marks this page load: the monitor uses it to tell freshly captured issues
    // apart from history restored from a previous session.
    this.sessionStartedAt = new Date().toISOString()
    this.captureSuspended = false
    this.loadFromStorage()
  }

  // True while this module is writing to the console itself. Its own reports
  // must never be captured as new failures, or reporting would feed itself.
  isCaptureSuspended() {
    return this.captureSuspended
  }

  // Console output that is part of error reporting, not a new error.
  warnSilently(...args) {
    this.captureSuspended = true
    try {
      console.warn(...args)
    } finally {
      this.captureSuspended = false
    }
  }

  // Failures captured during this page load, newest first. Timestamps are
  // compared as dates: string comparison would treat an unparseable timestamp
  // from an older payload as newer than this session.
  getSessionErrors() {
    const sessionStart = Date.parse(this.sessionStartedAt)
    return this.errorHistory.filter(entry => {
      const detected = Date.parse(entry?.timestamp)
      return Number.isFinite(detected) && detected >= sessionStart
    })
  }

  // Enable or disable email reporting
  setEmailEnabled(enabled) {
    this.emailEnabled = Boolean(enabled)
    storage.set('weatherForecaster_emailEnabled', String(this.emailEnabled))
  }

  // Reporting needs both an explicit opt-in and a configured endpoint.
  isEmailEnabled() {
    return this.emailEnabled && Boolean(ERROR_REPORTING_ENDPOINT)
  }

  // What the user actually ticked, independent of endpoint configuration.
  isEmailOptedIn() {
    return this.emailEnabled
  }

  isReportingConfigured() {
    return Boolean(ERROR_REPORTING_ENDPOINT)
  }

  // Generate a unique error signature for grouping
  generateErrorSignature(error) {
    const message = error?.message || String(error)
    const stack = error?.stack || ''
    return this.hashString(`${message}-${stack.split('\n')[1] || ''}`)
  }

  // Simple hash function for error grouping
  hashString(str) {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(36)
  }

  // Categorize error based on type and message
  categorizeError(error, context = {}) {
    const message = String(error?.message || error || '')
    const lower = message.toLowerCase()

    if (context.kind === 'resource') return ERROR_CATEGORIES.NETWORK

    if (error?.name === 'ChunkLoadError' || /failed to fetch dynamically imported module/.test(lower)) {
      return ERROR_CATEGORIES.NETWORK
    }
    if (lower.includes('fetch') || lower.includes('network') || lower.includes('request')) {
      return ERROR_CATEGORIES.NETWORK
    }
    if (lower.includes('api') || lower.includes('weather.gov') || lower.includes('nominatim')) {
      return ERROR_CATEGORIES.API
    }
    if (error instanceof TypeError || error instanceof ReferenceError || error instanceof RangeError) {
      return ERROR_CATEGORIES.RENDER
    }
    if (lower.includes('validation') || lower.includes('invalid')) {
      return ERROR_CATEGORIES.VALIDATION
    }
    return ERROR_CATEGORIES.UNKNOWN
  }

  // Determine error severity
  determineSeverity(error, category) {
    const message = String(error?.message || '').toLowerCase()
    if (error instanceof ReferenceError) return ERROR_SEVERITY.FATAL
    if (/failed to fetch dynamically imported module|loading chunk/.test(message)) {
      return ERROR_SEVERITY.CRITICAL
    }
    if (error instanceof TypeError) return ERROR_SEVERITY.FATAL
    if (category === ERROR_CATEGORIES.API && message.includes('404')) return ERROR_SEVERITY.CRITICAL
    if (category === ERROR_CATEGORIES.NETWORK) return ERROR_SEVERITY.WARNING
    // Anything that reached the screen is a real failure, never "minor".
    return ERROR_SEVERITY.CRITICAL
  }

  // Severity for a single record. A console warning is always a warning, a
  // console.error is at least critical (the app itself reported a failure), and
  // a caller may pin a severity — a broken stylesheet is not a broken image.
  resolveSeverity(error, category, context = {}) {
    if (context.kind === 'warning') return ERROR_SEVERITY.WARNING
    if (SEVERITY_VALUES.has(context.severity)) return context.severity
    return this.determineSeverity(error, category)
  }

  // Log and process an error
  logError(error, context = {}) {
    const normalized = error instanceof Error ? error : new Error(String(error))
    const timestamp = new Date().toISOString()
    const category = this.categorizeError(normalized, context)
    const severity = this.resolveSeverity(normalized, category, context)
    const signature = this.generateErrorSignature(normalized)

    const errorRecord = {
      id: `${timestamp}-${signature}`,
      timestamp,
      signature,
      message: normalized.message || String(normalized),
      // A plain console message carries no stack of its own; the frames it could
      // attach would only point at the capture wrapper.
      stack: context.stackless
        ? 'No stack trace captured (console message).'
        : (normalized.stack || 'No stack trace captured.'),
      category,
      severity,
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        online: navigator.onLine,
        ...context
      },
      count: 1,
      lastSeen: timestamp,
      resolved: false
    }

    const existingGroup = this.errorGroups.get(signature)
    if (existingGroup && (Date.now() - new Date(existingGroup.timestamp).getTime() < this.groupingTimeout)) {
      existingGroup.count += 1
      existingGroup.lastSeen = timestamp
      existingGroup.resolved = false
      // Persist the new count: a burst of grouped failures must survive a reload.
      this.saveToStorage()
      this.notifyListeners('errorGrouped', existingGroup)
    } else {
      this.errorGroups.set(signature, errorRecord)
      this.errorHistory.unshift(errorRecord)

      if (this.errorHistory.length > this.maxHistorySize) {
        this.errorHistory = this.errorHistory.slice(0, this.maxHistorySize)
      }

      this.saveToStorage()
      this.notifyListeners('errorLogged', errorRecord)

      // Parentheses matter here: without them the endpoint flag alone would be
      // enough to send mail for every warning.
      if (this.isEmailEnabled() && (severity === ERROR_SEVERITY.FATAL || severity === ERROR_SEVERITY.CRITICAL)) {
        this.sendEmailReport(errorRecord)
      }
    }

    return errorRecord
  }

  // Send error report to the configured backend
  async sendEmailReport(errorRecord) {
    if (!ERROR_REPORTING_ENDPOINT) return

    try {
      const response = await fetch(ERROR_REPORTING_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorRecord)
      })
      // console.warn (not console.error) keeps report failures out of the
      // capture path, which would otherwise create a reporting feedback loop.
      if (!response.ok) this.warnSilently('[WeatherDesk] Error report rejected:', response.status)
    } catch (reportError) {
      this.warnSilently('[WeatherDesk] Error report could not be sent:', reportError?.message || reportError)
    }
  }

  // Mark an error as resolved
  resolveError(signature) {
    const group = this.errorGroups.get(signature)
    if (!group) return
    group.resolved = true
    group.resolvedAt = new Date().toISOString()
    this.saveToStorage()
    this.notifyListeners('errorResolved', group)
  }

  // Get error history
  getErrorHistory() {
    return [...this.errorHistory]
  }

  // Get error groups
  getErrorGroups() {
    return Array.from(this.errorGroups.values())
  }

  // Get errors by severity
  getErrorsBySeverity(severity) {
    return this.errorHistory.filter(entry => entry.severity === severity)
  }

  // Get errors by category
  getErrorsByCategory(category) {
    return this.errorHistory.filter(entry => entry.category === category)
  }

  // Get error statistics
  getStatistics() {
    const bySeverity = {
      fatal: this.getErrorsBySeverity(ERROR_SEVERITY.FATAL).length,
      critical: this.getErrorsBySeverity(ERROR_SEVERITY.CRITICAL).length,
      warning: this.getErrorsBySeverity(ERROR_SEVERITY.WARNING).length,
      minor: this.getErrorsBySeverity(ERROR_SEVERITY.MINOR).length
    }
    const byCategory = {
      network: this.getErrorsByCategory(ERROR_CATEGORIES.NETWORK).length,
      api: this.getErrorsByCategory(ERROR_CATEGORIES.API).length,
      render: this.getErrorsByCategory(ERROR_CATEGORIES.RENDER).length,
      validation: this.getErrorsByCategory(ERROR_CATEGORIES.VALIDATION).length,
      unknown: this.getErrorsByCategory(ERROR_CATEGORIES.UNKNOWN).length
    }

    return {
      total: this.errorHistory.length,
      bySeverity,
      byCategory,
      resolved: this.getErrorGroups().filter(group => group.resolved).length
    }
  }

  // Clear error history
  clearHistory() {
    this.errorHistory = []
    this.errorGroups.clear()
    this.saveToStorage()
    this.notifyListeners('historyCleared')
  }

  // Subscribe to error events
  subscribe(listener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  // Notify all listeners. A failing listener must never surface as a new error.
  notifyListeners(event, data) {
    this.listeners.forEach(listener => {
      try {
        listener(event, data)
      } catch (listenerError) {
        this.warnSilently('[WeatherDesk] Error listener failed:', listenerError?.message || listenerError)
      }
    })
  }

  // Save to localStorage
  saveToStorage() {
    try {
      storage.set('weatherForecaster_errors', JSON.stringify({
        history: this.errorHistory.slice(0, 50),
        groups: Array.from(this.errorGroups.entries()).slice(0, 50)
      }))
    } catch (storageError) {
      this.warnSilently('[WeatherDesk] Error history could not be saved:', storageError?.message || storageError)
    }
  }

  // Load from localStorage
  loadFromStorage() {
    const raw = storage.get('weatherForecaster_errors')
    if (!raw) return
    try {
      const parsed = JSON.parse(raw)
      // A stored record is judged on its message and its stack: an extension's
      // throw only names its origin in the frames, never in the message.
      const keep = entry => !isIgnorableMessage(entry?.message) && !isIgnorableMessage(entry?.stack)
      this.errorHistory = (Array.isArray(parsed.history) ? parsed.history : []).filter(keep)
      this.errorGroups = new Map(
        (Array.isArray(parsed.groups) ? parsed.groups : [])
          .filter(([, entry]) => keep(entry))
      )
    } catch {
      // Corrupt or stale payload from an older build: start clean.
      this.errorHistory = []
      this.errorGroups = new Map()
    }
  }

  // Export error report
  exportReport() {
    return JSON.stringify({
      app: 'WeatherDesk',
      timestamp: new Date().toISOString(),
      environment: {
        url: window.location.href,
        route: window.location.hash || '#/',
        userAgent: navigator.userAgent,
        online: navigator.onLine,
        viewport: `${window.innerWidth}×${window.innerHeight}`,
        language: navigator.language
      },
      statistics: this.getStatistics(),
      recentErrors: this.errorHistory.slice(0, 20),
      errorGroups: this.getErrorGroups().slice(0, 20)
    }, null, 2)
  }
}

// Create singleton instance
const errorManager = new ErrorManager()

export { errorManager, ERROR_SEVERITY, ERROR_CATEGORIES, ERROR_REPORTING_ENDPOINT, isIgnorableMessage }

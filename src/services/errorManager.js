// Centralized Error Management System
// This system detects, categorizes, and manages all errors in the application

const ERROR_SEVERITY = {
  FATAL: 'fatal',
  CRITICAL: 'critical',
  WARNING: 'warning',
  MINOR: 'minor'
}

const ERROR_CATEGORIES = {
  NETWORK: 'network',
  API: 'api',
  RENDER: 'render',
  VALIDATION: 'validation',
  UNKNOWN: 'unknown'
}

// Backend endpoint for error reporting (update this to your deployed function URL)
const ERROR_REPORTING_ENDPOINT = process.env.VITE_ERROR_REPORTING_ENDPOINT || ''

class ErrorManager {
  constructor() {
    this.errorHistory = []
    this.errorGroups = new Map()
    this.listeners = new Set()
    this.maxHistorySize = 100
    this.groupingTimeout = 5 * 60 * 1000 // 5 minutes
    this.emailEnabled = localStorage.getItem('weatherForecaster_emailEnabled') === 'true'
    this.loadFromStorage()
  }

  // Enable or disable email reporting
  setEmailEnabled(enabled) {
    this.emailEnabled = enabled
    localStorage.setItem('weatherForecaster_emailEnabled', String(enabled))
  }

  // Check if email reporting is enabled
  isEmailEnabled() {
    return this.emailEnabled && ERROR_REPORTING_ENDPOINT
  }

  // Generate a unique error signature for grouping
  generateErrorSignature(error) {
    const message = error.message || error.toString()
    const stack = error.stack || ''
    const signature = `${message}-${stack.split('\n')[0] || ''}`
    return this.hashString(signature)
  }

  // Simple hash function for error grouping
  hashString(str) {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return hash.toString(36)
  }

  // Categorize error based on type and message
  categorizeError(error) {
    const message = error.message || error.toString() || ''
    
    if (message.includes('fetch') || message.includes('network') || message.includes('request')) {
      return ERROR_CATEGORIES.NETWORK
    }
    if (message.includes('API') || message.includes('weather.gov') || message.includes('nominatim')) {
      return ERROR_CATEGORIES.API
    }
    if (error instanceof TypeError || error instanceof ReferenceError) {
      return ERROR_CATEGORIES.RENDER
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return ERROR_CATEGORIES.VALIDATION
    }
    return ERROR_CATEGORIES.UNKNOWN
  }

  // Determine error severity
  determineSeverity(error, category) {
    if (error instanceof TypeError || error instanceof ReferenceError) {
      return ERROR_SEVERITY.FATAL
    }
    if (category === ERROR_CATEGORIES.API && error.message?.includes('404')) {
      return ERROR_SEVERITY.CRITICAL
    }
    if (category === ERROR_CATEGORIES.NETWORK) {
      return ERROR_SEVERITY.WARNING
    }
    return ERROR_SEVERITY.MINOR
  }

  // Log and process an error
  logError(error, context = {}) {
    const timestamp = new Date().toISOString()
    const category = this.categorizeError(error)
    const severity = this.determineSeverity(error, category)
    const signature = this.generateErrorSignature(error)

    const errorRecord = {
      id: `${timestamp}-${signature}`,
      timestamp,
      signature,
      message: error.message || error.toString(),
      stack: error.stack || 'No stack trace available',
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

    // Check if this error was recently seen (grouping)
    const existingGroup = this.errorGroups.get(signature)
    if (existingGroup && (Date.now() - existingGroup.timestamp < this.groupingTimeout)) {
      existingGroup.count++
      existingGroup.lastSeen = timestamp
      existingGroup.resolved = false
      this.notifyListeners('errorGrouped', existingGroup)
    } else {
      this.errorGroups.set(signature, errorRecord)
      this.errorHistory.unshift(errorRecord)
      
      // Trim history if needed
      if (this.errorHistory.length > this.maxHistorySize) {
        this.errorHistory = this.errorHistory.slice(0, this.maxHistorySize)
      }
      
      this.saveToStorage()
      this.notifyListeners('errorLogged', errorRecord)

      // Send email report if enabled and this is a new error group
      if (this.emailEnabled && severity === ERROR_SEVERITY.FATAL || severity === ERROR_SEVERITY.CRITICAL) {
        this.sendEmailReport(errorRecord)
      }
    }

    return errorRecord
  }

  // Send error report to backend
  async sendEmailReport(errorRecord) {
    if (!ERROR_REPORTING_ENDPOINT) {
      console.warn('Error reporting endpoint not configured')
      return
    }

    try {
      const response = await fetch(ERROR_REPORTING_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(errorRecord)
      })

      if (!response.ok) {
        console.error('Failed to send error report:', response.status, await response.text())
      } else {
        console.log('Error report sent successfully')
      }
    } catch (error) {
      console.error('Error sending error report:', error)
    }
  }

  // Mark an error as resolved
  resolveError(signature) {
    const group = this.errorGroups.get(signature)
    if (group) {
      group.resolved = true
      group.resolvedAt = new Date().toISOString()
      this.saveToStorage()
      this.notifyListeners('errorResolved', group)
    }
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
    return this.errorHistory.filter(e => e.severity === severity)
  }

  // Get errors by category
  getErrorsByCategory(category) {
    return this.errorHistory.filter(e => e.category === category)
  }

  // Get error statistics
  getStatistics() {
    const total = this.errorHistory.length
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
    const resolved = this.getErrorGroups().filter(g => g.resolved).length

    return { total, bySeverity, byCategory, resolved }
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

  // Notify all listeners
  notifyListeners(event, data) {
    this.listeners.forEach(listener => {
      try {
        listener(event, data)
      } catch (e) {
        console.error('Error in error listener:', e)
      }
    })
  }

  // Save to localStorage
  saveToStorage() {
    try {
      const data = {
        history: this.errorHistory.slice(0, 50), // Only save last 50
        groups: Array.from(this.errorGroups.entries()).slice(0, 50)
      }
      localStorage.setItem('weatherForecaster_errors', JSON.stringify(data))
    } catch (e) {
      console.error('Failed to save error history:', e)
    }
  }

  // Load from localStorage
  loadFromStorage() {
    try {
      const data = localStorage.getItem('weatherForecaster_errors')
      if (data) {
        const parsed = JSON.parse(data)
        this.errorHistory = parsed.history || []
        this.errorGroups = new Map(parsed.groups || [])
      }
    } catch (e) {
      console.error('Failed to load error history:', e)
    }
  }

  // Export error report
  exportReport() {
    const report = {
      timestamp: new Date().toISOString(),
      statistics: this.getStatistics(),
      recentErrors: this.errorHistory.slice(0, 20),
      errorGroups: this.getErrorGroups().slice(0, 20)
    }
    return JSON.stringify(report, null, 2)
  }
}

// Create singleton instance
const errorManager = new ErrorManager()

// Global error handlers
if (typeof window !== 'undefined') {
  // Catch uncaught errors
  window.addEventListener('error', (event) => {
    errorManager.logError(event.error || new Error(event.message), {
      source: event.filename,
      line: event.lineno,
      column: event.colno
    })
  })

  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    errorManager.logError(event.reason || new Error('Unhandled promise rejection'), {
      promise: true
    })
  })

  // Catch console errors
  const originalError = console.error
  console.error = (...args) => {
    originalError.apply(console, args)
    const error = args[0]
    if (error instanceof Error) {
      errorManager.logError(error, { source: 'console' })
    }
  }
}

export { errorManager, ERROR_SEVERITY, ERROR_CATEGORIES }

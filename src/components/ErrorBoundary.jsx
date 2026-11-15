import React, { Component } from 'react'
import ErrorScreen from './ErrorScreen'
import { errorManager } from '../services/errorManager'

// Pull the first frame that names a real file so the crash screen can show
// something more useful than "Unknown file".
function locateSource(error) {
  const stack = String(error?.stack || '')
  const lines = stack.split('\n').slice(1)
  for (const line of lines) {
    const match = line.match(/([^\s()]+?):(\d+):(\d+)\)?\s*$/)
    if (!match) continue
    const fileName = match[1].replace(/^.*\/\/[^/]+/, '') || match[1]
    return { fileName, lineNumber: match[2], columnNumber: match[3] }
  }
  return { fileName: '', lineNumber: '', columnNumber: '' }
}

export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null, componentStack: '' }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // Record the failure once, through the central store, instead of re-emitting
    // it to console.error (which the runtime monitor would capture a second time).
    errorManager.logError(error instanceof Error ? error : new Error(String(error)), {
      kind: 'boundary',
      componentStack: errorInfo?.componentStack || ''
    })
    this.setState({ componentStack: errorInfo?.componentStack || '' })
  }

  resetError = () => {
    this.setState({ hasError: false, error: null, componentStack: '' })
  }

  render() {
    const { hasError, error, componentStack } = this.state
    if (!hasError) return this.props.children

    const source = locateSource(error)
    return (
      <ErrorScreen
        error={error}
        resetError={this.resetError}
        errorDetails={{ ...source, componentStack }}
      />
    )
  }
}

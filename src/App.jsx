import React from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { LocationProvider } from './contexts/LocationContext'
import { AlertProvider } from './contexts/AlertContext'
import { SettingsProvider } from './contexts/SettingsContext'
import WeatherApp from './components/WeatherApp'
import HomePage from './pages/HomePage'
import ForecastPage from './pages/ForecastPage'
import MapPage from './pages/MapPage'
import AlertsPage from './pages/AlertsPage'
import SettingsPage from './pages/SettingsPage'
import './App.css'

// Enhanced Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    const errorId = Date.now().toString(36)
    this.setState({
      error,
      errorInfo,
      errorId,
      retryCount: this.state.retryCount + 1
    })
    
    // Log error details for debugging
    console.error('🚨 App Error Caught:', {
      error: error.toString(),
      errorInfo,
      errorId,
      retryCount: this.state.retryCount + 1,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    })

    // Try to recover automatically
    this.attemptRecovery()
  }

  attemptRecovery = () => {
    const { retryCount } = this.state
    if (retryCount < 3) {
      // Try to reload the app after a short delay
      setTimeout(() => {
        console.log('🔄 Attempting automatic recovery...', retryCount + 1)
        window.location.reload()
      }, 2000 * retryCount)
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '2rem',
            borderRadius: '15px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            maxWidth: '500px',
            textAlign: 'left'
          }}>
            <h2 style={{ margin: '0 0 1rem 0', color: '#ff6b6b' }}>
              🚨 Something went wrong
            </h2>
            <p style={{ margin: '0.5rem 0', opacity: 0.8 }}>
              The weather app encountered an unexpected error. We're working to fix it.
            </p>
            <details style={{ 
              whiteSpace: 'pre-wrap', 
              background: 'rgba(0, 0, 0, 0.2)', 
              padding: '1rem', 
              borderRadius: '8px',
              margin: '1rem 0',
              fontSize: '0.9rem'
            }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                📋 Error Details (Click to expand)
              </summary>
              <div style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
                <div><strong>Error:</strong> {this.state.error && this.state.error.toString()}</div>
                <div><strong>Error ID:</strong> {this.state.errorId}</div>
                <div><strong>Retry Count:</strong> {this.state.retryCount}</div>
                {this.state.errorInfo && (
                  <div>
                    <strong>Component Stack:</strong>
                    <pre style={{ 
                      fontSize: '0.7rem', 
                      overflow: 'auto', 
                      maxHeight: '200px',
                      background: 'rgba(0, 0, 0, 0.1)',
                      padding: '0.5rem',
                      borderRadius: '4px',
                      marginTop: '0.5rem'
                    }}>
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                )}
                <div style={{ marginTop: '1rem', fontSize: '0.8rem' }}>
                  <strong>Timestamp:</strong> {new Date().toLocaleString()}
                </div>
              </div>
            </details>
            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <button
                onClick={this.handleRetry}
                style={{
                  background: '#4fc3f7',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  transition: 'all 0.3s ease',
                  marginRight: '0.5rem'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = '#29b6f6'
                  e.target.style.transform = 'scale(1.05)'
                }}
                onMouseOut={(e) => {
                  e.target.style.background = '#4fc3f7'
                  e.target.style.transform = 'scale(1)'
                }}
              >
                � Try Again
              </button>
              <button
                onClick={() => window.location.href = '/Weather-Forecaster/'}
                style={{
                  background: '#ff6b6b',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = '#e55555'
                  e.target.style.transform = 'scale(1.05)'
                }}
                onMouseOut={(e) => {
                  e.target.style.background = '#ff6b6b'
                  e.target.style.transform = 'scale(1)'
                }}
              >
                🏠 Go Home
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

function App() {
  const [appState, setAppState] = React.useState('app')
  const [isOnline, setIsOnline] = React.useState(navigator.onLine)

  // Monitor online/offline status
  React.useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      console.log('🌐 App is online')
    }
    
    const handleOffline = () => {
      setIsOnline(false)
      console.log('📴 App is offline')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Performance monitoring
  React.useEffect(() => {
    if ('performance' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            console.log('⚡ Page Load Performance:', {
              loadTime: entry.loadEventEnd - entry.loadEventStart,
              domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
              firstPaint: entry.paintTiming?.firstPaint,
              timestamp: new Date().toISOString()
            })
          }
        }
      })
      
      observer.observe({ entryTypes: ['navigation'] })
    }
  }, [])

  return (
    <ErrorBoundary>
      <SettingsProvider>
        <LocationProvider>
          <AlertProvider>
            <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <div className={`App ${!isOnline ? 'offline' : 'online'}`}>
                <Routes>
                  <Route path="/" element={<WeatherApp />} />
                  <Route path="/home" element={<HomePage />} />
                  <Route path="/forecast" element={<ForecastPage />} />
                  <Route path="/map" element={<MapPage />} />
                  <Route path="/alerts" element={<AlertsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Routes>
                
                {/* Offline indicator */}
                {!isOnline && (
                  <div style={{
                    position: 'fixed',
                    top: '10px',
                    right: '10px',
                    background: '#ff6b6b',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: 'bold',
                    zIndex: '9999',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                    animation: 'slideIn 0.3s ease-out'
                  }}>
                    📴 Offline Mode
                  </div>
                )}
              </div>
            </HashRouter>
          </AlertProvider>
        </LocationProvider>
      </SettingsProvider>
    </ErrorBoundary>
  )
}

export default App

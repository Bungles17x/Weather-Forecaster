import React, { Suspense } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import WeatherApp from './components/WeatherApp'
import HomePage from './pages/HomePage'
import ForecastPage from './pages/ForecastPage'
import MapPage from './pages/MapPage'
import AlertsPage from './pages/AlertsPage'
import SettingsPage from './pages/SettingsPage'
import { LocationProvider } from './contexts/LocationContext'
import { AlertProvider } from './contexts/AlertContext'
import { SettingsProvider } from './contexts/SettingsContext'
import './App.css'

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    })
    console.error('App Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Something went wrong.</h2>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo.componentStack}
          </details>
        </div>
      )
    }

    return this.props.children
  }
}

// Loading Component
const LoadingFallback = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh',
    fontSize: '18px',
    color: '#666'
  }}>
    Loading Weather App...
  </div>
)

function App() {
  return (
    <ErrorBoundary>
      <SettingsProvider>
        <LocationProvider>
          <AlertProvider>
            <HashRouter>
              <div className="App">
                <Suspense fallback={<LoadingFallback />}>
                  <Routes>
                    <Route path="/" element={<WeatherApp />} />
                    <Route path="/home" element={<HomePage />} />
                    <Route path="/forecast" element={<ForecastPage />} />
                    <Route path="/map" element={<MapPage />} />
                    <Route path="/alerts" element={<AlertsPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                  </Routes>
                </Suspense>
              </div>
            </HashRouter>
          </AlertProvider>
        </LocationProvider>
      </SettingsProvider>
    </ErrorBoundary>
  )
}

export default App

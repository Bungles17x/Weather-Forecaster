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

console.log('🔍 App.jsx - React imported:', React)
console.log('🚀 App component loading')

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

function App() {
  console.log('🚀 App function rendering...')
  
  try {
    const [appState, setAppState] = React.useState('app')
    console.log('✅ useState works in App')
  } catch (error) {
    console.error('❌ useState failed in App:', error)
    return <div>useState Error in App: {error.message}</div>
  }

  return (
    <ErrorBoundary>
      <SettingsProvider>
        <LocationProvider>
          <AlertProvider>
            <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <div className="App">
                <Routes>
                  <Route path="/" element={<WeatherApp />} />
                  <Route path="/home" element={<HomePage />} />
                  <Route path="/forecast" element={<ForecastPage />} />
                  <Route path="/map" element={<MapPage />} />
                  <Route path="/alerts" element={<AlertsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Routes>
              </div>
            </HashRouter>
          </AlertProvider>
        </LocationProvider>
      </SettingsProvider>
    </ErrorBoundary>
  )
}

export default App

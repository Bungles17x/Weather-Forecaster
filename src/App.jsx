import React from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { LocationProvider } from './contexts/LocationContext'
import { AlertProvider } from './contexts/AlertContext'
import './App.css'

console.log('🔍 App.jsx - React imported:', React)

// Simple test component to isolate the issue
const TestComponent = () => {
  console.log('🧪 TestComponent rendering...')
  
  try {
    const [testState, setTestState] = React.useState('test')
    console.log('✅ useState works in TestComponent')
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Weather App Debug</h1>
        <p>React useState works: {testState}</p>
        <button onClick={() => setTestState('clicked')}>
          Click me
        </button>
        <p>If you can see this, React is working!</p>
      </div>
    )
  } catch (error) {
    console.error('❌ useState failed in TestComponent:', error)
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
        <h1>useState Error</h1>
        <p>Error: {error.message}</p>
      </div>
    )
  }
}

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
      <LocationProvider>
        <AlertProvider>
          <HashRouter>
            <div className="App">
              <Routes>
                <Route path="/" element={<TestComponent />} />
              </Routes>
            </div>
          </HashRouter>
        </AlertProvider>
      </LocationProvider>
    </ErrorBoundary>
  )
}

export default App

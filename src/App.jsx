import React from 'react'
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

function App() {
  return (
    <SettingsProvider>
      <LocationProvider>
        <AlertProvider>
          <HashRouter>
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
  )
}

export default App

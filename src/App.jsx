import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import WeatherApp from './components/WeatherApp'
import HomePage from './pages/HomePage'
import ForecastPage from './pages/ForecastPage'
import MapPage from './pages/MapPage'
import SettingsPage from './pages/SettingsPage'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route path="/" element={<WeatherApp />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/forecast" element={<ForecastPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App

import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import WeatherApp from './components/WeatherApp'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <WeatherApp />
      </div>
    </BrowserRouter>
  )
}

export default App

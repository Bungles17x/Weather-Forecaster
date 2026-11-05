import React from 'react'
import './MapPage.css'
import Header from '../components/Header'
import WeatherMap from '../components/WeatherMap'
import { useLocation } from '../contexts/LocationContext'
import { WeatherDeskIcon } from '../components/WeatherIcons'

export default function MapPage() {
  const { location } = useLocation()
  return <div className="map-page data-page"><Header/><main className="data-main map-main">
    <section className="page-heading map-heading"><div><div className="eyebrow"><span className="eyebrow-dot"/> NWS / NOAA GIS PRODUCTS</div><h1>Radar & alert map</h1><p>{location} · official National Weather Service radar imagery and alert geometry.</p></div><a className="source-pill official-pill" href="https://radar.weather.gov/" target="_blank" rel="noreferrer"><WeatherDeskIcon name="arrowUpRight" size={14} /> Open official radar</a></section>
    <section className="public-map-container" aria-label="Interactive NWS radar and alert map"><WeatherMap/></section>
  </main></div>
}

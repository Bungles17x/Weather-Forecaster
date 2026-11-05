import React from 'react'
import { Link } from 'react-router-dom'
import { WeatherDeskIcon } from './WeatherIcons'
import { buildDailyBriefing } from '../services/weatherIntelligence'

export default function DailyBriefing({ weather, units }) {
  const items = buildDailyBriefing(weather, units)
  return <section className="dashboard-section daily-briefing-section">
    <div className="section-title-row"><div><div className="eyebrow">FORECAST INTELLIGENCE</div><h2>Your weather briefing</h2><p>Practical signals calculated from the latest available NWS hourly forecast and alert feed.</p></div><Link to="/assistant" className="text-link">Ask Weather Forecaster AI <WeatherDeskIcon name="chevronRight" size={14}/></Link></div>
    <div className="insights-grid daily-briefing-grid">{items.map(item => <article className={`insight-card daily-briefing-card daily-briefing-${item.kind}`} key={item.id}><span className="insight-icon"><WeatherDeskIcon name={item.icon} size={23}/></span><div className="insight-content"><strong>{item.title}</strong><small>{item.detail}</small></div></article>)}</div>
    <p className="briefing-footnote"><WeatherDeskIcon name="info" size={13}/> These are rule-based summaries, not official alerts or AI-generated warnings. Review the full forecast before making time-sensitive plans.</p>
  </section>
}

import React, { useEffect, useRef, useState } from 'react'
import Header from '../components/Header'
import { WeatherDeskIcon } from '../components/WeatherIcons'
import { useLocation } from '../contexts/LocationContext'
import { useWeather } from '../contexts/WeatherContext'
import { useSettings } from '../contexts/SettingsContext'
import { askWeatherDesk, isRemoteAssistantConfigured, getReviews, clearReviews } from '../services/weatherAssistant'
import './AssistantPage.css'

const HISTORY_KEY = 'weatherdeskAssistantHistoryV1'
const starterPrompts = [
  { title: 'Explain something', prompt: 'Explain a difficult topic in simple terms, then give me a practical example.' },
  { title: 'Help me write', prompt: 'Help me draft a clear, polished piece of writing. Ask what you need to know first.' },
  { title: 'Code & troubleshoot', prompt: 'Help me debug a coding problem. Tell me what information you need and explain the fix.' },
  { title: 'Plan my day', prompt: 'Help me make a practical plan for today. Ask one focused question if you need more details.' },
  { title: 'Rate the app', prompt: 'I want to leave a review or feedback about Weather Forecaster.' },
]
const welcome = {
  id: 'welcome', role: 'assistant', mode: 'welcome', createdAt: new Date().toISOString(),
  text: 'Ask me about almost anything: writing, ideas, studying, science, coding, troubleshooting, planning, or everyday questions. I can also use the weather data Weather Forecaster has loaded when you ask about the forecast or alerts. I’ll be clear about what I know, what I’m estimating, and what data is unavailable.'
}

function readHistory() {
  try {
    const value = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
    return Array.isArray(value) ? value.filter(item => item && ['user', 'assistant'].includes(item.role) && typeof item.text === 'string').slice(-40) : []
  } catch { return [] }
}

function linkify(text) {
  const parts = String(text).split(/(https?:\/\/[^\s)]+)/g)
  return parts.map((part, index) => /^https?:\/\//.test(part)
    ? <a key={index} href={part} target="_blank" rel="noreferrer">{part}</a>
    : part)
}

function MessageText({ text }) {
  return <div className="assistant-message-text">{String(text).split('\n').map((line, index) => line.trim() ? <p key={`${index}-${line.slice(0, 12)}`}>{line.replace(/^\*\*(.*?)\*\*$/, '$1').split(/(\*\*.*?\*\*)/g).map((segment, i) => segment.startsWith('**') && segment.endsWith('**') ? <strong key={i}>{linkify(segment.slice(2, -2))}</strong> : linkify(segment))}</p> : <div key={`gap-${index}`} className="assistant-message-gap" />)}</div>
}

export default function AssistantPage() {
  const { location } = useLocation()
  const { weather, loading, error, refresh } = useWeather()
  const { settings } = useSettings()
  const [messages, setMessages] = useState(readHistory)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [mode, setMode] = useState(isRemoteAssistantConfigured() ? 'configured' : 'local')
  const [notice, setNotice] = useState('')
  const [reviews, setReviews] = useState(getReviews)
  const listRef = useRef(null)
  const abortRef = useRef(null)
  const hasConversation = messages.length > 0

  useEffect(() => {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-40))) } catch { /* Chat remains available for this session if storage is blocked. */ }
  }, [messages])

  useEffect(() => {
    const node = listRef.current
    if (node) node.scrollTop = node.scrollHeight
  }, [messages, busy])

  useEffect(() => () => abortRef.current?.abort(), [])

  const send = async raw => {
    const question = String(raw || '').trim()
    if (!question || busy) return
    const userMessage = { id: `${Date.now()}-u`, role: 'user', text: question, createdAt: new Date().toISOString() }
    setMessages(previous => [...previous, userMessage].slice(-40))
    setDraft('')
    setBusy(true)
    setNotice('')
    abortRef.current = new AbortController()
    try {
      const result = await askWeatherDesk({ question, weather, location, units: settings.units, signal: abortRef.current.signal })
      setReviews(getReviews())
      setMode(result.mode === 'ai' ? 'ai' : 'local')
      setMessages(previous => [...previous, { id: `${Date.now()}-a`, role: 'assistant', text: result.text, mode: result.mode, createdAt: new Date().toISOString(), updatedAt: result.context?.bundleUpdatedAt || null }].slice(-40))
      if (result.mode === 'local-fallback') setNotice('AI service unreachable · local weather helper used')
    } catch (sendError) {
      if (sendError?.name !== 'AbortError') setNotice(sendError.message || 'The response could not be generated. Please try again.')
    } finally {
      setBusy(false)
      abortRef.current = null
    }
  }

  const clearHistory = () => {
    abortRef.current?.abort()
    setMessages([])
    setBusy(false)
    setNotice('Conversation history cleared from this browser.')
  }

  const copyText = async text => {
    try { await navigator.clipboard.writeText(text); setNotice('Response copied to clipboard.') }
    catch { setNotice('Clipboard access is unavailable in this browser. Select the text to copy it.') }
  }

  return <div className="data-page assistant-page"><Header/><main className="data-main assistant-main">
    <div className="assistant-page-heading">
      <div><div className="eyebrow"><span className="eyebrow-dot"/> WEATHER INTELLIGENCE</div><h1>Weather Forecaster <span>AI</span></h1><p>A general-purpose AI assistant for questions, writing, learning, coding, planning, and weather.</p></div>
      <div className={`assistant-mode-pill ${mode === 'ai' ? 'assistant-mode-ai' : ''}`}><span className="assistant-mode-dot"/>{mode === 'ai' ? 'AI RESPONSE ACTIVE' : mode === 'configured' ? 'AI ENDPOINT CONFIGURED' : 'LOCAL WEATHER HELPER'}</div>
    </div>

    <div className="assistant-status-row">
      <div className="assistant-context-card"><span className="assistant-context-icon"><WeatherDeskIcon name="location" size={18}/></span><div><small>ACTIVE LOCATION</small><strong>{location || 'Selected location'}</strong><span>{weather?.updatedAt ? `Weather data loaded ${new Date(weather.updatedAt).toLocaleString()}` : loading ? 'Loading live NWS products…' : 'No weather bundle loaded yet'}</span></div></div>
      <div className="assistant-context-card"><span className="assistant-context-icon"><WeatherDeskIcon name="database" size={18}/></span><div><small>LIVE DATA CONTEXT</small><strong>{weather ? `${(weather.hourly?.periods || []).length} hourly periods · ${(weather.alerts || []).length} alerts` : 'Waiting for forecast'}</strong><span>Forecast and alert context from Weather.gov</span></div><button type="button" className="assistant-refresh" onClick={refresh} title="Refresh weather data" aria-label="Refresh weather data"><WeatherDeskIcon name="refresh" size={16}/></button></div>
    </div>

    <section className="assistant-workspace" aria-label="Weather Forecaster AI conversation">
      <div className="assistant-chat-panel">
        <div className="assistant-chat-header"><div className="assistant-orb"><WeatherDeskIcon name="brand" size={25}/></div><div><strong>Weather companion</strong><small>{isRemoteAssistantConfigured() ? 'AI endpoint configured · connection confirmed after a successful response' : 'General AI requires the secure backend; local mode offers limited weather help'}</small></div><button type="button" className="assistant-clear" onClick={clearHistory} disabled={!hasConversation && !busy}>Clear chat</button></div>
        {notice && <div className="assistant-notice" role="status">{notice}</div>}
        {error && <div className="assistant-data-warning" role="status"><WeatherDeskIcon name="info" size={17}/><span>Weather feed issue: {error} Assistant replies will use only data that successfully loaded.</span></div>}
        <div className="assistant-message-list" ref={listRef} aria-live="polite" aria-label="Conversation messages">
          {!hasConversation && <article className="assistant-message assistant-message-bot"><div className="assistant-avatar"><WeatherDeskIcon name="brand" size={18}/></div><div className="assistant-bubble"><div className="assistant-message-meta"><strong>Weather Forecaster</strong><span>Ready</span></div><MessageText text={welcome.text}/><small className="assistant-source-note">Live weather questions use the latest loaded data. Official source: weather.gov.</small></div></article>}
          {messages.map(message => <article className={`assistant-message ${message.role === 'user' ? 'assistant-message-user' : 'assistant-message-bot'}`} key={message.id}>
            {message.role === 'assistant' && <div className="assistant-avatar"><WeatherDeskIcon name="brand" size={18}/></div>}
            <div className="assistant-bubble"><div className="assistant-message-meta"><strong>{message.role === 'user' ? 'You' : 'Weather Forecaster'}</strong><span>{message.role === 'assistant' ? (message.mode === 'ai' ? 'AI response' : message.mode === 'local-fallback' ? 'Local fallback' : 'Local helper') : 'Question'}</span></div><MessageText text={message.text}/>{message.role === 'assistant' && <div className="assistant-message-actions"><small>{message.updatedAt ? `Weather context updated ${new Date(message.updatedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : 'Educational guidance may use general meteorology knowledge.'}</small><button type="button" onClick={() => copyText(message.text)} aria-label="Copy response"><WeatherDeskIcon name="share" size={14}/> Copy</button></div>}</div>
            {message.role === 'user' && <div className="assistant-avatar assistant-avatar-user">YOU</div>}
          </article>)}
          {busy && <article className="assistant-message assistant-message-bot"><div className="assistant-avatar"><WeatherDeskIcon name="brand" size={18}/></div><div className="assistant-bubble assistant-thinking"><span/><span/><span/><small>{mode === 'ai' || mode === 'configured' ? 'Checking configured AI endpoint…' : 'Reviewing loaded forecast data…'}</small></div></article>}
        </div>
        {!hasConversation && <div className="assistant-starters"><span className="assistant-starters-label">TRY ASKING</span><div className="assistant-starter-grid">{starterPrompts.map(item => <button key={item.title} type="button" onClick={() => send(item.prompt)} disabled={busy}><span>{item.title}</span><WeatherDeskIcon name="arrowUpRight" size={15}/></button>)}</div></div>}
        <form className="assistant-composer" onSubmit={event => { event.preventDefault(); send(draft) }}><label className="sr-only" htmlFor="weatherdesk-question">Ask Weather Forecaster</label><textarea id="weatherdesk-question" value={draft} onChange={event => setDraft(event.target.value)} placeholder="Ask anything — write, explain, plan, code, troubleshoot, or ask about weather…" rows={2} maxLength={1600} disabled={busy} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); send(draft) } }}/><div className="assistant-composer-bottom"><small>Enter to send · Shift+Enter for a new line</small><button type="submit" disabled={busy || !draft.trim()}><WeatherDeskIcon name="arrowUpRight" size={17}/>{busy ? 'Working…' : 'Ask Weather Forecaster'}</button></div></form>
      </div>
      <aside className="assistant-side-panel">
        <section className="assistant-side-card"><div className="assistant-side-heading"><span><WeatherDeskIcon name="database" size={17}/></span><div><small>GROUND TRUTH</small><strong>What the assistant knows</strong></div></div><p>When a general AI endpoint is configured, ask about writing, coding, studying, planning, troubleshooting, and everyday topics. Weather questions can use data loaded in this app. Local-only mode is limited and is not a full AI model.</p><div className="assistant-data-list"><div><span>Observed station</span><strong>{weather?.stationName || weather?.stationId || 'Not available'}</strong></div><div><span>Observation time</span><strong>{weather?.observation?.timestamp ? new Date(weather.observation.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'Not reported'}</strong></div><div><span>Active point alerts</span><strong>{weather?.errors?.alerts ? 'Not confirmed' : (weather?.alerts || []).length}</strong></div><div><span>Data source</span><strong><a href="https://www.weather.gov/documentation/services-web-api" target="_blank" rel="noreferrer">NWS / Weather.gov ↗</a></strong></div></div></section>
        <section className="assistant-side-card"><div className="assistant-side-heading"><span><WeatherDeskIcon name="forecast" size={17}/></span><div><small>GENERAL ASSISTANCE</small><strong>What you can ask</strong></div></div><div className="assistant-capability-list"><div><WeatherDeskIcon name="precipitation" size={16}/><span>Writing, ideas, and everyday planning</span></div><div><WeatherDeskIcon name="temperature" size={16}/><span>Explaining topics and studying</span></div><div><WeatherDeskIcon name="alerts" size={16}/><span>Coding and troubleshooting</span></div><div><WeatherDeskIcon name="radar" size={16}/><span>Weather, forecasts, and alerts</span></div><div><WeatherDeskIcon name="observations" size={16}/><span>Science and meteorology learning</span></div></div></section>
        <section className="assistant-side-card"><div className="assistant-side-heading"><span><WeatherDeskIcon name="bookmark" size={17}/></span><div><small>APP REVIEWS</small><strong>{reviews.length} stored on this device</strong></div>{reviews.length > 0 && <button type="button" className="assistant-clear" onClick={() => { clearReviews(); setReviews([]); setNotice('Stored reviews cleared from this browser.') }}>Clear</button>}</div>{reviews.length ? <div className="assistant-data-list">{reviews.slice(0, 3).map(review => <div key={review.id}><span>{new Date(review.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span><strong>{review.text.length > 90 ? `${review.text.slice(0, 90)}…` : review.text}</strong></div>)}</div> : <p>Tell the assistant what you think of Weather Forecaster — try &ldquo;I&rsquo;d like to leave a review.&rdquo; Feedback is saved locally in this browser.</p>}</section>
        <section className="assistant-caution-card"><WeatherDeskIcon name="info" size={18}/><p><strong>Safety comes first.</strong> AI explanations are not official warnings. During severe weather, follow the actual NWS alert text and local emergency instructions. The assistant cannot see a radar image unless that image or its data is explicitly supplied.</p></section>
      </aside>
    </section>
    <footer className="assistant-footer">Conversation history is stored locally in this browser so you can review it. Use <b>Clear chat</b> to remove it. No account is required.</footer>
  </main></div>
}

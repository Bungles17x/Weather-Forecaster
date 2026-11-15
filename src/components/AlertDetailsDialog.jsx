import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { WeatherDeskIcon } from './WeatherIcons'
import { alertIcon, alertOfficialUrl, formatAlertTime, severityColor } from '../utils/alertPresentation'
import './AlertDetailsDialog.css'

// Full record for one NWS alert. The map list and the polygons both open this,
// so the complete product (facts, description and instructions) is always one
// click away instead of squeezed into the side panel.
export default function AlertDetailsDialog({ alert, onClose }) {
  const closeRef = useRef(null)
  const properties = alert?.properties || {}
  const color = severityColor(properties.severity)

  useEffect(() => {
    closeRef.current?.focus()
    const handleKeyDown = event => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  if (!alert) return null

  // Portalled to <body>: the map shell has an identity transform and overflow:
  // hidden, which would otherwise trap a fixed-position dialog inside it.
  return createPortal(
    <div
      className="wf-alert-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wf-alert-modal-title"
      onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}
    >
      <article className="wf-alert-modal-card" style={{ '--alert-color': color }}>
        <header className="wf-alert-modal-head">
          <span className="wf-alert-modal-icon" aria-hidden="true">
            <WeatherDeskIcon name={alertIcon(properties.event)} size={22} />
          </span>
          <div className="wf-alert-modal-heading">
            <span className="wf-alert-modal-sev">{properties.severity || 'Unknown severity'}</span>
            <h2 className="wf-alert-modal-event" id="wf-alert-modal-title">{properties.event || 'NWS alert'}</h2>
          </div>
          <button ref={closeRef} type="button" className="wf-alert-modal-close" onClick={onClose} aria-label="Close alert details">
            <WeatherDeskIcon name="close" size={16} />
          </button>
        </header>

        <div className="wf-alert-modal-body">
          {properties.headline && <p className="wf-alert-modal-headline">{properties.headline}</p>}

          <dl className="wf-alert-modal-facts">
            <div><dt>Urgency</dt><dd>{properties.urgency || '—'}</dd></div>
            <div><dt>Certainty</dt><dd>{properties.certainty || '—'}</dd></div>
            <div><dt>Status</dt><dd>{properties.status || '—'}</dd></div>
            <div><dt>Category</dt><dd>{properties.category || '—'}</dd></div>
            <div><dt>Issued</dt><dd>{formatAlertTime(properties.sent)}</dd></div>
            <div><dt>Effective</dt><dd>{formatAlertTime(properties.onset || properties.effective)}</dd></div>
            <div><dt>Expires</dt><dd>{formatAlertTime(properties.ends || properties.expires)}</dd></div>
            <div><dt>Issuing office</dt><dd>{properties.senderName || '—'}</dd></div>
          </dl>

          <section className="wf-alert-modal-section">
            <h3>Affected areas</h3>
            <p>{properties.areaDesc || 'Area not specified'}</p>
          </section>

          {properties.description && (
            <section className="wf-alert-modal-section">
              <h3>Official NWS description</h3>
              <p className="is-preserve">{properties.description}</p>
            </section>
          )}

          {properties.instruction && (
            <section className="wf-alert-modal-section is-instruction">
              <h3>Instructions</h3>
              <p className="is-preserve">{properties.instruction}</p>
            </section>
          )}
        </div>

        <footer className="wf-alert-modal-foot">
          <a href={alertOfficialUrl(alert)} target="_blank" rel="noreferrer">
            <WeatherDeskIcon name="arrowUpRight" size={13} /> Official NWS alert record
          </a>
          <button type="button" onClick={onClose}>Close</button>
        </footer>
      </article>
    </div>,
    document.body
  )
}

import React from 'react'
import './LoadingSkeleton.css'

export default function LoadingSkeleton({ type = 'card', count = 1 }) {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className="skeleton-card">
            <div className="skeleton-header">
              <div className="skeleton-title" />
              <div className="skeleton-subtitle" />
            </div>
            <div className="skeleton-content">
              <div className="skeleton-value" />
              <div className="skeleton-label" />
            </div>
          </div>
        )
      case 'list':
        return (
          <div className="skeleton-list">
            <div className="skeleton-item" />
            <div className="skeleton-item" />
            <div className="skeleton-item" />
          </div>
        )
      case 'text':
        return (
          <div className="skeleton-text">
            <div className="skeleton-line" />
            <div className="skeleton-line short" />
          </div>
        )
      case 'weather':
        return (
          <div className="skeleton-weather">
            <div className="skeleton-weather-icon" />
            <div className="skeleton-weather-temp" />
            <div className="skeleton-weather-desc" />
          </div>
        )
      case 'metric':
        return (
          <div className="skeleton-metric">
            <div className="skeleton-metric-icon" />
            <div className="skeleton-metric-value" />
            <div className="skeleton-metric-label" />
          </div>
        )
      default:
        return <div className="skeleton-box" />
    }
  }

  return (
    <div className="skeleton-wrapper">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>{renderSkeleton()}</div>
      ))}
    </div>
  )
}

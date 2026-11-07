import { lazy } from 'react'

function importWithRetry(factory) {
  return factory().catch(() => new Promise((resolve, reject) => {
    setTimeout(() => {
      factory().then(resolve).catch(error => {
        // Reloading can't help while offline — go straight to the error boundary.
        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
          reject(error)
          return
        }
        const reloadKey = 'weatherdesk:chunk-reload'
        try {
          if (!sessionStorage.getItem(reloadKey)) {
            sessionStorage.setItem(reloadKey, '1')
            window.location.reload()
            return
          }
        } catch { /* sessionStorage unavailable — fall through to error boundary */ }
        reject(error)
      })
    }, 400)
  }))
}

// Wraps React.lazy so a failed dynamic import (typically a stale hashed chunk
// after a redeploy) is retried once, then triggers a single page reload so the
// browser picks up the fresh index.html and assets.
export default function lazyWithRetry(factory) {
  return lazy(() => importWithRetry(factory))
}

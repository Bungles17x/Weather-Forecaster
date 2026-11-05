import React, { useEffect, useState } from 'react'

/** A truthful, unobtrusive indicator: online status does not guarantee that NWS is reachable. */
export default function ConnectivityStatus() {
  const [online, setOnline] = useState(() => typeof navigator === 'undefined' ? true : navigator.onLine)

  useEffect(() => {
    const markOnline = () => setOnline(true)
    const markOffline = () => setOnline(false)
    window.addEventListener('online', markOnline)
    window.addEventListener('offline', markOffline)
    return () => {
      window.removeEventListener('online', markOnline)
      window.removeEventListener('offline', markOffline)
    }
  }, [])

  if (online) return null
  return (
    <div className="connectivity-banner" role="status" aria-live="polite">
      <span className="connectivity-banner__dot" aria-hidden="true" />
      <span><strong>Offline mode</strong> — saved app files may work, but live forecasts, alerts, and radar need a connection.</span>
    </div>
  )
}

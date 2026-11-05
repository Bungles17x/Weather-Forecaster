export const severityOrder = { Extreme: 0, Severe: 1, Moderate: 2, Minor: 3, Unknown: 4 }
export const severityColor = {
  Extreme: '#ff5364',
  Severe: '#ff8d52',
  Moderate: '#f2c45e',
  Minor: '#68b8ff',
  Unknown: '#91a4ba'
}

export function alertKind(properties = {}) {
  const event = String(properties.event || '').toLowerCase()
  const type = String(properties.messageType || '').toLowerCase()
  if (event.includes('warning') || type === 'alert' && event.includes('warning')) return 'warning'
  if (event.includes('watch')) return 'watch'
  if (event.includes('advisory')) return 'advisory'
  if (event.includes('statement') || event.includes('outlook') || type === 'update') return 'statement'
  if (event.includes('warning')) return 'warning'
  return 'statement'
}

export function issuingOffice(properties = {}) {
  const sender = String(properties.senderName || properties.sender || '')
  const officeMatch = sender.match(/\b([A-Z]{4})\b/)
  return {
    name: sender || 'Issuing office not specified',
    id: officeMatch?.[1] || properties.parameters?.NWSheadline?.[0] || null
  }
}

export function sortAlerts(alerts) {
  return [...(alerts || [])].sort((a, b) => {
    const pA = a.properties || {}
    const pB = b.properties || {}
    return (severityOrder[pA.severity] ?? 4) - (severityOrder[pB.severity] ?? 4)
      || Date.parse(pA.expires || '') - Date.parse(pB.expires || '')
  })
}

export function rememberAlerts(alerts) {
  try {
    const existing = JSON.parse(sessionStorage.getItem('weatherDeskAlertHistory') || '[]')
    const incoming = (alerts || []).map(alert => ({
      id: alert.id,
      event: alert.properties?.event,
      severity: alert.properties?.severity,
      sent: alert.properties?.sent || alert.properties?.effective,
      expires: alert.properties?.expires,
      area: alert.properties?.areaDesc,
      recordedAt: new Date().toISOString()
    }))
    const merged = [...incoming, ...existing.filter(item => !incoming.some(next => next.id === item.id))].slice(0, 80)
    sessionStorage.setItem('weatherDeskAlertHistory', JSON.stringify(merged))
    return merged
  } catch {
    return alerts || []
  }
}

export function readAlertHistory() {
  try { return JSON.parse(sessionStorage.getItem('weatherDeskAlertHistory') || '[]') }
  catch { return [] }
}

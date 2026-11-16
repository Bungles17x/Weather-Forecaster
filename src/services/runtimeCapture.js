// Browser-level error capture for WeatherDesk.
//
// Everything that can go wrong in a page — a thrown error, a rejected promise, a
// console.error/warn, or a resource that fails to load — is funnelled into the
// single error store from here. Installing the hooks in one module (rather than
// inside a React component) means failures that happen before React mounts are
// captured too, and every failure is recorded exactly once.

import { errorManager, isIgnorableMessage } from './errorManager'

let installed = false

function describe(args) {
  return args
    .map(value => {
      if (value instanceof Error) return `${value.name}: ${value.message}`
      if (typeof value === 'string') return value
      try { return JSON.stringify(value) } catch { return String(value) }
    })
    .filter(Boolean)
    .join(' ')
}

// Browser extensions inject their own scripts into the page, and a broken one
// throws here like app code does (one common case: "Cannot redefine property:
// location"). Those failures say nothing about WeatherDesk, so they are dropped
// rather than polluting the error report a user is asked to send.
const EXTENSION_ORIGIN = /(chrome|moz|safari|ms-browser|edge)-extension:\/\//i

function fromBrowserExtension(value) {
  if (!value) return false
  if (typeof value === 'string') return EXTENSION_ORIGIN.test(value)
  return EXTENSION_ORIGIN.test(`${value.stack || ''} ${value.message || ''}`)
}

// Images, scripts, stylesheets and fonts report failures as an 'error' event on
// the element itself. Those do not bubble, so they only reach a capture-phase
// window listener.
function failedResource(event) {
  const target = event?.target
  if (!target || target === window || target === document) return null
  const url = target.currentSrc || target.src || target.href
  if (!url) return null
  return { tag: String(target.tagName || 'resource').toLowerCase(), url: String(url) }
}

// A WMS map is requested tile by tile, so every failing URL differs only in its
// bbox: a retired layer would otherwise fill the history with one record per
// tile. Report the service and layer, which is what actually failed.
function describeResourceUrl(url) {
  try {
    const parsed = new URL(url)
    const layers = parsed.searchParams.get('layers') || parsed.searchParams.get('LAYERS')
    const isMapRequest = /getmap|getlegendgraphic/i.test(parsed.search) || /\/(wms|ows)$/i.test(parsed.pathname)
    if (!layers || !isMapRequest) return url
    return `${parsed.origin}${parsed.pathname} · layers=${layers}`
  } catch {
    return url
  }
}

export function installGlobalErrorCapture() {
  if (installed || typeof window === 'undefined') return () => {}
  installed = true

  const originalConsoleError = console.error
  const originalConsoleWarn = console.warn

  console.error = (...args) => {
    originalConsoleError.apply(console, args)
    if (errorManager.isCaptureSuspended()) return
    const text = describe(args) || 'Console error'
    if (isIgnorableMessage(text)) return
    const errorArg = args.find(value => value instanceof Error)
    // A plain console message has no stack of its own; the frames we could attach
    // would only point at this wrapper, so record that instead of misleading.
    errorManager.logError(errorArg || new Error(text), { kind: 'console', stackless: !errorArg })
  }

  // Warnings are recorded and listed in the monitor and the history page, but
  // they never take over the screen — a warning must not lock anyone out.
  console.warn = (...args) => {
    originalConsoleWarn.apply(console, args)
    if (errorManager.isCaptureSuspended()) return
    const text = describe(args) || 'Console warning'
    if (isIgnorableMessage(text)) return
    const errorArg = args.find(value => value instanceof Error)
    errorManager.logError(errorArg || new Error(text), { kind: 'warning', stackless: !errorArg })
  }

  const handleError = event => {
    if (errorManager.isCaptureSuspended()) return
    if (fromBrowserExtension(event?.filename) || fromBrowserExtension(event?.error)) return

    const resource = failedResource(event)
    if (resource) {
      const isImage = resource.tag === 'img'
      const message = `Failed to load ${resource.tag}: ${describeResourceUrl(resource.url)}`
      if (isIgnorableMessage(message)) return
      errorManager.logError(new Error(message), {
        kind: 'resource',
        resourceTag: resource.tag,
        resourceUrl: resource.url,
        // A broken image is cosmetic; a failed script or stylesheet is not.
        severity: isImage ? undefined : 'critical'
      })
      return
    }

    errorManager.logError(
      event?.error instanceof Error ? event.error : new Error(event?.message || 'Unknown script error'),
      { kind: 'uncaught', source: event?.filename, line: event?.lineno, column: event?.colno }
    )
  }

  const handleRejection = event => {
    if (errorManager.isCaptureSuspended()) return
    const reason = event?.reason
    if (fromBrowserExtension(reason)) return
    errorManager.logError(
      reason instanceof Error ? reason : new Error(String(reason ?? 'Unhandled rejection')),
      { kind: 'rejection' }
    )
  }

  window.addEventListener('error', handleError, true)
  window.addEventListener('unhandledrejection', handleRejection)

  return () => {
    console.error = originalConsoleError
    console.warn = originalConsoleWarn
    window.removeEventListener('error', handleError, true)
    window.removeEventListener('unhandledrejection', handleRejection)
    installed = false
  }
}

export default installGlobalErrorCapture

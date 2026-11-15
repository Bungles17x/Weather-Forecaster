import { APP_VERSION } from './appInfo'
import { errorManager } from '../services/errorManager'

/**
 * Development Tools for WeatherDesk
 * These functions are available in the browser console for testing purposes.
 *
 * Every console.error, console.warn, thrown error, rejected promise and failed
 * resource load is captured by services/runtimeCapture.js:
 *   - errors open the runtime monitor panel
 *   - warnings are listed in the corner dock and the error history page
 */

export function testConsoleCapture() {
  console.error('Test error: simulated console issue for the runtime monitor')
  console.warn('Test warning: simulated warning captured as a non-blocking warning')
  return 'Console error and warning triggered. The error opens the runtime monitor; the warning waits in the dock.'
}

// Simulate different error types
export function testErrorTypes() {
  console.error('Simulated Error: Something went wrong')
  console.warn('Simulated Warning: This is a warning')
  console.log('Simulated Info: This is informational')
  return 'Console error and warning captured. console.log is not treated as an issue.'
}

// A missing image is a resource failure: captured, but non-blocking.
export function testResourceFailure() {
  const image = new Image()
  image.alt = ''
  image.style.display = 'none'
  image.src = `/weatherdesk-missing-${Date.now()}.png`
  document.body.appendChild(image)
  return 'Missing image requested. It should appear in the runtime dock as a resource warning.'
}

// Force a JavaScript error
export function testJavaScriptError() {
  throw new Error('Test error: This is a deliberate error to test error handling')
}

// Test promise rejection
export function testPromiseRejection() {
  Promise.reject(new Error('Test rejection: This is a deliberate promise rejection'))
  return 'Promise rejection test triggered'
}

// Register dev tools globally (only in development)
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  window.WeatherDeskDevTools = {
    testConsoleCapture,
    testErrorTypes,
    testResourceFailure,
    testJavaScriptError,
    testPromiseRejection,
    errorManager,
    version: APP_VERSION
  }

  console.log('%c WeatherDesk Dev Tools Loaded ', 'background: #6ee7f9; color: #03131b; font-weight: bold; padding: 4px 8px; border-radius: 4px;')
  console.log('Available commands:')
  console.log('  WeatherDeskDevTools.testConsoleCapture() - Capture a console error and warning')
  console.log('  WeatherDeskDevTools.testErrorTypes() - Test all console levels')
  console.log('  WeatherDeskDevTools.testResourceFailure() - Fail an image load')
  console.log('  WeatherDeskDevTools.testJavaScriptError() - Force a JS error')
  console.log('  WeatherDeskDevTools.testPromiseRejection() - Test promise rejection')
  console.log('  WeatherDeskDevTools.errorManager - Inspect captured issues')
  console.log('  WeatherDeskDevTools.testNotifications() - Test notifications (available after app loads)')
}

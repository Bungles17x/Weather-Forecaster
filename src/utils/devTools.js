/**
 * Development Tools for Weather Forecaster
 * These functions are available in the browser console for testing purposes
 */

// Test the runtime error screen
export function testErrorScreen() {
  console.error('Test error: This is a simulated error to test the error screen')
  console.warn('Test warning: This is a simulated warning')
  return 'Error screen test triggered. Check the error screen overlay.'
}

// Simulate different error types
export function testErrorTypes() {
  console.error('Simulated Error: Something went wrong')
  console.warn('Simulated Warning: This is a warning')
  console.log('Simulated Info: This is informational')
  return 'All error types tested'
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
    testErrorScreen,
    testErrorTypes,
    testJavaScriptError,
    testPromiseRejection,
    version: '2.1.0'
  }

  console.log('%c Weather Forecaster Dev Tools Loaded ', 'background: #6ee7f9; color: #03131b; font-weight: bold; padding: 4px 8px; border-radius: 4px;')
  console.log('Available commands:')
  console.log('  WeatherDeskDevTools.testErrorScreen() - Test the error screen')
  console.log('  WeatherDeskDevTools.testErrorTypes() - Test all error types')
  console.log('  WeatherDeskDevTools.testJavaScriptError() - Force a JS error')
  console.log('  WeatherDeskDevTools.testPromiseRejection() - Test promise rejection')
  console.log('  WeatherDeskDevTools.testNotifications() - Test notifications (available after app loads)')
}

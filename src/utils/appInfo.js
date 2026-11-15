// Product identity and version, defined once for the whole client bundle.
//
// Vite injects __APP_VERSION__ from package.json (see vite.config.js), so the
// UI, the diagnostics export and the crash screen can never drift apart again.
export const APP_NAME = 'WeatherDesk'
export const APP_VERSION = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '0.0.0-dev'
export const SUPPORT_EMAIL = 'weatherforecasterservices@yahoo.com'

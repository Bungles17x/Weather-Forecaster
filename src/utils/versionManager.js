// Version Management Utility
export class VersionManager {
  constructor() {
    this.currentVersion = this.getCurrentVersion()
    this.latestVersion = this.getLatestVersion()
  }

  getCurrentVersion() {
    // Get version from build time or package.json
    const buildTime = new Date().toISOString().split('T')[0]
    return `v1.0.0-${buildTime}`
  }

  getLatestVersion() {
    // Check localStorage for latest version
    return localStorage.getItem('weather-app-latest-version') || this.currentVersion
  }

  checkForUpdates() {
    // Simulate checking for updates
    const storedVersion = localStorage.getItem('weather-app-version')
    const latestVersion = localStorage.getItem('weather-app-latest-version')
    
    if (latestVersion && latestVersion !== this.currentVersion) {
      return {
        updateAvailable: true,
        currentVersion: this.currentVersion,
        latestVersion: latestVersion
      }
    }
    
    return {
      updateAvailable: false,
      currentVersion: this.currentVersion,
      latestVersion: this.currentVersion
    }
  }

  // Simulate triggering an update (for testing)
  triggerUpdate() {
    const newVersion = `v1.0.1-${new Date().toISOString().split('T')[0]}`
    localStorage.setItem('weather-app-latest-version', newVersion)
    return newVersion
  }

  // Clear update notification
  clearUpdate() {
    localStorage.removeItem('weather-app-latest-version')
  }

  // Restart app for update
  restartForUpdate() {
    // Clear cache
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name)
        })
      })
    }
    
    // Force reload
    window.location.reload(true)
  }

  // Debug function to simulate update (call from browser console)
  debugTriggerUpdate() {
    console.log('🔄 Debug: Triggering update notification...')
    const newVersion = this.triggerUpdate()
    console.log(`📦 New version: ${newVersion}`)
    return newVersion
  }
}

export default VersionManager

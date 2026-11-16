// Desktop auto-update.
//
// Releases are published to GitHub by electron-builder (see the "build" section of
// package.json and .github/workflows/desktop.yml). At runtime electron-updater
// reads that release's latest.yml, downloads the new installer in the background,
// and installs it on quit — or immediately when the user accepts the prompt.

const { app, dialog } = require('electron')

const CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000
const STARTUP_DELAY_MS = 8 * 1000

let updater = null
let window = null
let checking = false
let lastStatus = { status: 'idle' }

function requireUpdater() {
  if (updater) return updater
  // Loaded lazily so a development run without the package still starts.
  try {
    updater = require('electron-updater').autoUpdater
  } catch {
    updater = null
  }
  return updater
}

function broadcast(status) {
  lastStatus = { ...status, at: new Date().toISOString() }
  if (window && !window.isDestroyed()) window.webContents.send('weatherdesk:update-status', lastStatus)
  return lastStatus
}

// A packaged build updates itself. An unpackaged `npm run desktop` run has no
// latest.yml to compare against, so it reports that instead of failing.
function isUpdatable() {
  return app.isPackaged && Boolean(requireUpdater())
}

async function checkForUpdates(win, { interactive = false } = {}) {
  const target = requireUpdater()
  if (!isUpdatable()) {
    const status = broadcast({ status: 'unavailable', reason: 'Updates apply to installed copies of WeatherDesk.' })
    if (interactive) {
      await dialog.showMessageBox(win || window, {
        type: 'info',
        title: 'Updates',
        message: 'This is a development build',
        detail: 'Auto-update runs in the installed WeatherDesk app, which compares itself with the latest published release.',
        buttons: ['OK']
      })
    }
    return status
  }
  if (checking) return lastStatus

  checking = true
  broadcast({ status: 'checking' })
  try {
    const result = await target.checkForUpdates()
    const version = result?.updateInfo?.version
    if (interactive && !result?.updateInfo) {
      await dialog.showMessageBox(win || window, {
        type: 'info',
        title: 'Updates',
        message: 'WeatherDesk is up to date',
        detail: `You are running version ${app.getVersion()}.`,
        buttons: ['OK']
      })
    } else if (interactive && version && result.updateInfo.version === app.getVersion()) {
      await dialog.showMessageBox(win || window, {
        type: 'info',
        title: 'Updates',
        message: 'WeatherDesk is up to date',
        detail: `You are running version ${app.getVersion()}.`,
        buttons: ['OK']
      })
    }
    return lastStatus
  } catch (error) {
    const status = broadcast({ status: 'error', reason: error?.message || String(error) })
    if (interactive) {
      await dialog.showMessageBox(win || window, {
        type: 'warning',
        title: 'Update check failed',
        message: 'WeatherDesk could not reach the release feed',
        detail: `${error?.message || error}\n\nThe app keeps working; it will try again later.`,
        buttons: ['OK']
      })
    }
    return status
  } finally {
    checking = false
  }
}

function setupAutoUpdates(win) {
  window = win
  const target = requireUpdater()
  if (!isUpdatable()) {
    broadcast({ status: 'unavailable', reason: 'development build' })
    return
  }

  target.autoDownload = true
  target.autoInstallOnAppQuit = true
  target.logger = console

  target.on('checking-for-update', () => broadcast({ status: 'checking' }))
  target.on('update-available', info => broadcast({ status: 'downloading', version: info?.version }))
  target.on('update-not-available', info => broadcast({ status: 'current', version: info?.version || app.getVersion() }))
  target.on('download-progress', progress => broadcast({
    status: 'downloading',
    version: lastStatus.version,
    percent: Math.round(progress?.percent || 0)
  }))
  target.on('error', error => broadcast({ status: 'error', reason: error?.message || String(error) }))

  target.on('update-downloaded', async info => {
    broadcast({ status: 'ready', version: info?.version })
    const { response } = await dialog.showMessageBox(window || undefined, {
      type: 'info',
      title: 'Update ready',
      message: `WeatherDesk ${info?.version} is ready to install`,
      detail: 'Restart now to finish updating, or keep working — the update installs when you close the app.',
      buttons: ['Restart now', 'Later'],
      defaultId: 0,
      cancelId: 1
    })
    if (response === 0) target.quitAndInstall()
  })

  setTimeout(() => { checkForUpdates(window) }, STARTUP_DELAY_MS)
  const timer = setInterval(() => { checkForUpdates(window) }, CHECK_INTERVAL_MS)
  timer.unref?.()

  app.on('will-quit', () => clearInterval(timer))
}

module.exports = { setupAutoUpdates, checkForUpdates }

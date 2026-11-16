// WeatherDesk desktop shell.
//
// The website is a static Vite build (relative asset paths), so the window simply
// loads the packaged index.html. Hash routing means the whole app lives in one
// document, and every weather request is a normal HTTPS fetch to NWS/NOAA.

const { app, BrowserWindow, Menu, shell, ipcMain, protocol, net } = require('electron')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { setupAutoUpdates, checkForUpdates } = require('./updater.cjs')

const APP_ROOT = path.join(__dirname, '..', 'dist-desktop')
const APP_ORIGIN = 'app://bundle'
const WINDOW_ICON = path.join(__dirname, '..', 'public', 'icons', 'weather-512.png')
const EXTERNAL_URL = /^https?:\/\//i
const DEBUG = Boolean(process.env.WEATHERDESK_DEBUG)

// The built app is a set of ES modules, and Chromium refuses module scripts on a
// file:// page. Serving the bundle from a privileged custom scheme gives it a
// real, secure origin instead, so modules, fetch and snapPoints behave as they
// do on the website.
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } }
])

function serveBundle() {
  protocol.handle('app', request => {
    const { host, pathname } = new URL(request.url)
    if (host !== 'bundle') return new Response('Not found', { status: 404 })
    const relative = decodeURIComponent(pathname === '/' ? '/index.html' : pathname)
    const target = path.join(APP_ROOT, relative)
    // Never hand back a path outside the bundle, even if a request says so.
    if (!target.startsWith(APP_ROOT)) return new Response('Not found', { status: 404 })
    return net.fetch(pathToFileURL(target).toString())
  })
}

let mainWindow = null

function openExternally(url) {
  if (EXTERNAL_URL.test(url)) shell.openExternal(url)
}

function buildMenu() {
  const template = [
    {
      label: 'File',
      submenu: [{ role: 'quit' }]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Check for updates…',
          click: () => { checkForUpdates(mainWindow, { interactive: true }) }
        },
        {
          label: 'Official NWS radar viewer',
          click: () => { openExternally('https://radar.weather.gov/') }
        },
        {
          label: 'NWS alerts',
          click: () => { openExternally('https://www.weather.gov/alerts') }
        },
        { type: 'separator' },
        {
          label: `WeatherDesk ${app.getVersion()}`,
          enabled: false
        }
      ]
    }
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    show: false,
    backgroundColor: '#07101c',
    title: 'WeatherDesk',
    icon: WINDOW_ICON,
    autoHideMenuBar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: true
    }
  })

  mainWindow.once('ready-to-show', () => mainWindow.show())
  mainWindow.on('closed', () => { mainWindow = null })

  // Weather links belong in the user's browser, not in a chromeless window.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    openExternally(url)
    return { action: 'deny' }
  })
  // In-app hash navigation never leaves the document; anything else is a real
  // link and belongs in the browser.
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(`${APP_ORIGIN}/`)) {
      event.preventDefault()
      openExternally(url)
    }
  })

  if (DEBUG) {
    // Used by the packaging smoke test: proves the renderer mounted the app
    // rather than only that a window exists.
    mainWindow.webContents.on('did-finish-load', () => {
      mainWindow.webContents.executeJavaScript(
        '({ root: document.getElementById("root")?.childElementCount ?? -1, route: location.hash, heading: document.querySelector("h1")?.textContent?.trim().slice(0, 40) || "" })'
      ).then(state => console.log('[weatherdesk] renderer', JSON.stringify(state)))
        .catch(error => console.log('[weatherdesk] probe failed', error?.message || error))
    })
    mainWindow.webContents.on('console-message', (...args) => {
      const event = args[0]
      const detail = event?.level !== undefined ? `${event.level} ${event.message}` : `${args[1]} ${args[2]}`
      console.log(`[weatherdesk console] ${detail}`)
    })
  }
  mainWindow.webContents.on('did-fail-load', (_event, code, description, url) => {
    console.error('[weatherdesk] load failed', code, description, url)
  })

  mainWindow.loadURL(`${APP_ORIGIN}/index.html`)
}

// A second launch focuses the running window instead of starting a second copy,
// which matters because only one instance may own the updater.
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  })

  app.whenReady().then(() => {
    serveBundle()
    buildMenu()
    createWindow()
    setupAutoUpdates(mainWindow)

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
}

// The renderer can ask for a check without a menu; it never installs anything
// itself — the update runs in this process.
ipcMain.handle('weatherdesk:check-for-updates', () => checkForUpdates(mainWindow, { interactive: true }))

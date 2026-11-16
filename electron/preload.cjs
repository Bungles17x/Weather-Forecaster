// Bridge between the desktop shell and the web app. Only these few capabilities
// are exposed: the app is otherwise the same website, with no Node access.
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('weatherdeskDesktop', {
  isDesktop: true,
  checkForUpdates: () => ipcRenderer.invoke('weatherdesk:check-for-updates'),
  onUpdateStatus: callback => {
    if (typeof callback !== 'function') return () => {}
    const listener = (_event, status) => callback(status)
    ipcRenderer.on('weatherdesk:update-status', listener)
    return () => ipcRenderer.removeListener('weatherdesk:update-status', listener)
  }
})

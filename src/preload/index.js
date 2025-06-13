import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  send: (channel, data) => {
    ipcRenderer.send(channel, data)
  },
  on: (channel, callback) => {
    // Enhanced handler with error protection
    const handler = (_event, data) => {
      try {
        // Ensure we always pass valid data
        const processedData = typeof data === 'string' ? { data } : data
        callback(processedData)
      } catch (error) {
        console.error(`Error in ${channel} handler:`, error)
      }
    }
    ipcRenderer.on(channel, handler)
    // Return a cleanup function
    return () => ipcRenderer.removeListener(channel, handler)
  },
  once: (channel, callback) => {
    ipcRenderer.once(channel, (_event, data) => {
      try {
        callback(typeof data === 'string' ? { data } : data)
      } catch (error) {
        console.error(`Error in ${channel} once handler:`, error)
      }
    })
  },
  removeListener: (channel, callback) => {
    ipcRenderer.removeListener(channel, callback)
  },
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}

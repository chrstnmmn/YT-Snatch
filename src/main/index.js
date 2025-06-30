const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const path = require('path')
const fs = require('fs')
const { execSync, spawn } = require('child_process')
const crypto = require('crypto')
const electronToolkit = require('@electron-toolkit/utils')
const { is } = electronToolkit

// ==============================================
// Path Resolver - Handles all binary path resolution
// ==============================================
class PathResolver {
  static getPythonPath() {
    return this.getBinaryPath('python', [
      path.join(process.env.LOCALAPPDATA, 'Programs', 'Python', 'Python311', 'python.exe'),
      path.join(process.env.ProgramFiles, 'Python311', 'python.exe')
    ])
  }

  static getFFmpegPath() {
    return this.getBinaryPath('ffmpeg', [
      path.join(process.env.ProgramFiles, 'ffmpeg', 'bin', 'ffmpeg.exe')
    ])
  }

  static getYtDlpPath() {
    return this.getBinaryPath('yt-dlp', [
      path.join(process.env.LOCALAPPDATA, 'yt-dlp', 'yt-dlp.exe'),
      path.join(process.env.APPDATA, 'yt-dlp', 'yt-dlp.exe')
    ])
  }

  static getScriptPath() {
    if (is.dev) {
      return path.join(__dirname, '../../src/renderer/script.py')
    }

    const possiblePaths = [
      path.join(process.resourcesPath, 'bin', 'script.py'),
      path.join(process.resourcesPath, 'Resources', 'bin', 'script.py')
    ]

    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        return possiblePath
      }
    }
    return possiblePaths[0]
  }

  static getBinaryPath(binaryName, platformSpecificPaths = []) {
    // Check system PATH first
    try {
      const command = process.platform === 'win32' ? 'where' : 'which'
      execSync(`${command} ${binaryName}`)
      return binaryName
    } catch {}

    // Check platform-specific paths
    for (const possiblePath of platformSpecificPaths) {
      if (fs.existsSync(possiblePath)) {
        return possiblePath
      }
    }

    return binaryName // Fallback to system PATH
  }
}

// ==============================================
// Dependency Manager - Handles dependency verification
// ==============================================
class DependencyManager {
  static async verifyAll() {
    const dependencies = [
      { name: 'python', command: '--version', required: true, getPath: PathResolver.getPythonPath },
      { name: 'ffmpeg', command: '-version', required: true, getPath: PathResolver.getFFmpegPath },
      { name: 'yt-dlp', command: '--version', required: true, getPath: PathResolver.getYtDlpPath }
    ]

    const results = []

    for (const dep of dependencies) {
      try {
        const binaryPath = dep.getPath()
        const output = execSync(`"${binaryPath}" ${dep.command}`).toString().trim()
        results.push({
          name: dep.name,
          path: binaryPath,
          installed: true,
          version: output.split('\n')[0],
          required: dep.required
        })
      } catch (error) {
        results.push({
          name: dep.name,
          installed: false,
          required: dep.required,
          error: error.message
        })
      }
    }

    return results
  }
}

// ==============================================
// Download Manager - Handles download processes
// ==============================================
class DownloadManager {
  constructor() {
    this.process = null
    this.status = 'idle' // 'idle' | 'running' | 'paused' | 'error'
    this.outputBuffer = ''
    this.mainWindow = null
  }

  setWindow(mainWindow) {
    this.mainWindow = mainWindow
  }

  getProcessEnv() {
    return {
      ...process.env,
      PATH: `${path.dirname(PathResolver.getFFmpegPath())}${path.delimiter}${process.env.PATH}`,
      PYTHONIOENCODING: 'utf-8',
      FFMPEG_PATH: PathResolver.getFFmpegPath(),
      YT_DLP_PATH: PathResolver.getYtDlpPath()
    }
  }

  start(params) {
    if (this.process) {
      throw new Error('Download already in progress')
    }

    this.status = 'running'
    this.process = spawn(
      PathResolver.getPythonPath(),
      [PathResolver.getScriptPath(), params.url, params.quality, params.folder],
      {
        env: this.getProcessEnv(),
        shell: true,
        stdio: ['pipe', 'pipe', 'pipe']
      }
    )

    this.setupProcessHandlers()
    this.sendToRenderer('download-started')
  }

  setupProcessHandlers() {
    this.process.stdout.on('data', (data) => this.handleOutput(data))
    this.process.stderr.on('data', (data) => this.handleError(data))
    this.process.on('close', (code) => this.handleClose(code))
    this.process.on('error', (err) => this.handleProcessError(err))
  }

  handleOutput(data) {
    this.outputBuffer += data.toString()
    const lines = this.outputBuffer.split('\n')
    this.outputBuffer = lines.pop()

    lines.forEach((line) => {
      if (line.trim()) {
        this.sendToRenderer('download-output', line)

        if (line.includes('⏸ Download paused')) {
          this.status = 'paused'
          this.sendToRenderer('download-paused')
        } else if (line.includes('▶ Download resumed')) {
          this.status = 'running'
          this.sendToRenderer('download-resumed')
        } else if (line.includes('✅ Download complete')) {
          this.status = 'idle'
          this.sendToRenderer('download-complete')
        }
      }
    })
  }

  handleError(data) {
    const error = data.toString()
    this.status = 'error'
    this.sendToRenderer('download-error', error)
  }

  handleClose(code) {
    if (code !== 0 && code !== null && this.status !== 'paused') {
      this.status = 'error'
      this.sendToRenderer('download-error', `Process exited with code ${code}`)
    } else {
      this.status = 'idle'
    }
    this.process = null
  }

  handleProcessError(err) {
    this.status = 'error'
    this.sendToRenderer('download-error', err.message)
    this.process = null
  }

  pause() {
    if (this.process && this.status === 'running') {
      this.process.stdin.write('pause\n')
      this.status = 'paused'
    }
  }

  resume() {
    if (this.process && this.status === 'paused') {
      this.process.stdin.write('resume\n')
      this.status = 'running'
    }
  }

  cancel() {
    if (this.process) {
      try {
        this.process.stdin.write('cancel\n')
        setTimeout(() => {
          if (this.process && !this.process.killed) {
            this.process.kill('SIGTERM')
          }
        }, 1000)
      } catch (err) {
        this.sendToRenderer('download-error', err.message)
      }
      this.process = null
      this.status = 'idle'
    }
  }

  sendToRenderer(channel, ...args) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, ...args)
    }
  }
}

// ==============================================
// Main App Class - Core application management
// ==============================================
class ElectronApp {
  constructor() {
    this.mainWindow = null
    this.downloadManager = new DownloadManager()
    electronToolkit.electronApp.setAppUserModelId('com.electron')
  }

  async initialize() {
    await this.setupAppLifecycle()
    this.setupIPC()
  }

  async createWindow() {
    const width = 840
    const height = 380

    this.mainWindow = new BrowserWindow({
      minWidth: width,
      minHeight: height,
      width: width,
      height: height,
      show: false,
      autoHideMenuBar: true,
      ...(process.platform === 'linux'
        ? { icon: path.join(__dirname, '../../build/icon.png') }
        : {}),
      webPreferences: {
        preload: path.join(__dirname, '../preload/index.js'),
        contextIsolation: true,
        sandbox: false,
        nodeIntegration: false,
        devTools: is.dev
      },
      titleBarStyle: 'hidden',
      resizable: false,
      maximizable: false,
      fullscreen: false,
      fullscreenable: false
    })

    this.mainWindow.setFullScreenable(false)
    this.downloadManager.setWindow(this.mainWindow)

    // DevTools in development
    if (is.dev || fs.existsSync(path.join(app.getAppPath(), 'DEBUG'))) {
      this.mainWindow.webContents.openDevTools()
    }

    this.mainWindow.on('ready-to-show', () => {
      this.mainWindow.show()
      this.verifyDependencies()
    })

    this.mainWindow.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url)
      return { action: 'deny' }
    })

    // Load the app
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      this.mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../../out/renderer/index.html'))
    }

    // Keyboard shortcuts
    this.mainWindow.webContents.on('before-input-event', (event, input) => {
      if (input.control && input.shift && input.alt && input.key === 'D') {
        this.mainWindow.webContents.toggleDevTools()
        event.preventDefault()
      } else if (!is.dev && (input.key === 'F12' || (input.control && input.key === 'I'))) {
        event.preventDefault()
      }
    })
  }

  async setupAppLifecycle() {
    // Wait for app to be ready before creating window
    await app.whenReady()

    await this.createWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createWindow()
      }
    })

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit()
      }
    })

    // Setup window shortcuts after creation
    app.on('browser-window-created', (_, window) => {
      electronToolkit.optimizer.watchWindowShortcuts(window)
    })
  }

  setupIPC() {
    // Dependency checks
    ipcMain.handle('check-dependencies', async () => {
      return await DependencyManager.verifyAll()
    })

    // Download management
    ipcMain.on('download-video', (_, params) => {
      this.downloadManager.start(params)
    })

    ipcMain.on('pause-download', () => {
      this.downloadManager.pause()
    })

    ipcMain.on('resume-download', () => {
      this.downloadManager.resume()
    })

    ipcMain.on('cancel-download', () => {
      this.downloadManager.cancel()
    })

    // File dialogs
    ipcMain.handle('open-directory-dialog', async () => {
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory']
      })

      if (!result.canceled && result.filePaths.length > 0) {
        return result.filePaths[0]
      }
      return null
    })

    // App control
    ipcMain.on('close-app', () => {
      app.quit()
    })
    ipcMain.on('minimize-app', () => {
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.minimize()
      }
    })
  }

  async verifyDependencies() {
    const results = await DependencyManager.verifyAll()
    const missingRequired = results.some((dep) => !dep.installed && dep.required)

    if (missingRequired) {
      this.mainWindow.webContents.send('missing-dependencies', results)
    }
  }
}

// ==============================================
// Application Startup
// ==============================================
;(async () => {
  try {
    const electronApp = new ElectronApp()
    await electronApp.initialize()
  } catch (error) {
    console.error('Failed to initialize application:', error)
    app.quit()
  }
})()

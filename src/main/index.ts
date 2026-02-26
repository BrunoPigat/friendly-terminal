import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { join } from 'path'
import Store from 'electron-store'
import { registerPtyIpc, killAllPty } from './pty/pty-ipc'
import { registerFsIpc, closeAllWatchers } from './filesystem/fs-ipc'
import { registerProjectIpc } from './project/project-ipc'
import { detectEngines, getAvailableEngines } from './ai-engines/engine-registry'
import { getCommand, isInSessionCommand } from './ai-engines/command-dictionary'
import { registerConfigIpc } from './ai-engines/config-ipc'
import { initAutoUpdater, checkForUpdates, downloadUpdate, quitAndInstall } from './updater/auto-updater'
import { startGuiServer, stopGuiServer } from './gui-control/gui-server'
import { getProjectsDir } from './util/paths'

const settingsStore = new Store({
  name: 'settings',
  defaults: {
    defaultEngine: 'claude',
    sidebarWidth: 280,
    sidebarCollapsed: false,
    rightPanelWidth: 280
  }
})

// Log uncaught exceptions to console instead of showing a dialog
process.on('uncaughtException', (error) => {
  console.error(`[UNCAUGHT] ${error.stack || error.message}`)
})

process.on('unhandledRejection', (reason) => {
  console.error(`[UNHANDLED REJECTION] ${reason instanceof Error ? reason.stack || reason.message : String(reason)}`)
})

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 500,
    show: false,
    title: 'Your Friendly Terminal',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  })

  // Show window once ready to avoid visual flash
  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  // Open external links in the system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:')) {
      shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  // Load the renderer
  const isDev = !app.isPackaged
  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

/**
 * Registers IPC handlers that don't depend on the main window instance.
 */
function registerGlobalIpc(): void {
  // AI engine detection
  ipcMain.handle('engines:detect', async () => {
    return detectEngines()
  })

  ipcMain.handle('engines:available', async () => {
    return getAvailableEngines()
  })

  ipcMain.handle(
    'engines:command',
    async (_event, engineId: string, intent: string, params?: Record<string, string>) => {
      return getCommand(engineId, intent as Parameters<typeof getCommand>[1], params)
    }
  )

  ipcMain.handle('engines:is-in-session', async (_event, intent: string) => {
    return isInSessionCommand(intent as Parameters<typeof isInSessionCommand>[0])
  })

  // Updater controls
  ipcMain.handle('updater:check', async () => {
    await checkForUpdates()
  })

  ipcMain.handle('updater:download', async () => {
    await downloadUpdate()
  })

  ipcMain.handle('updater:install', async () => {
    quitAndInstall()
  })

  // Settings
  ipcMain.handle('settings:get', async (_event, key: string) => {
    return settingsStore.get(key)
  })

  ipcMain.handle('settings:set', async (_event, key: string, value: unknown) => {
    settingsStore.set(key, value)
  })

  // Window controls
  ipcMain.on('window:minimize', () => {
    mainWindow?.minimize()
  })

  ipcMain.on('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  })

  ipcMain.on('window:close', () => {
    mainWindow?.close()
  })
}

// --- App lifecycle ---

app.whenReady().then(() => {
  // Register IPC handlers that don't need the window
  registerGlobalIpc()
  registerProjectIpc()
  registerConfigIpc()

  // Create the main window
  createWindow()

  // Register IPC handlers that need the window reference
  if (mainWindow) {
    registerFsIpc(mainWindow)
    registerPtyIpc(mainWindow)
    initAutoUpdater(mainWindow)
    startGuiServer(mainWindow).catch((err) => {
      console.error('[main] Failed to start GUI control server:', err)
    })

    // Check for updates after a short delay to not block startup
    setTimeout(() => {
      checkForUpdates()
    }, 3000)
  }

  // macOS: re-create window when dock icon is clicked and no windows exist
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
      if (mainWindow) {
        registerPtyIpc(mainWindow)
        initAutoUpdater(mainWindow)
      }
    }
  })
})

app.on('window-all-closed', () => {
  // Kill all PTY processes, close watchers, and stop GUI server before quitting
  killAllPty()
  closeAllWatchers()
  stopGuiServer()

  // On macOS, apps typically stay active until Cmd+Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  killAllPty()
  stopGuiServer()
})

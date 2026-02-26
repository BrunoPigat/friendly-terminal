import { app, BrowserWindow, screen, shell, ipcMain, Menu, clipboard } from 'electron'
import { join } from 'path'
import Store from 'electron-store'
import { registerPtyIpc, killAllPty, detachPtysForWindow } from './pty/pty-ipc'
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

/** Store pre-focus-mode bounds so we can restore when exiting focus mode */
const preFocusBounds = new Map<BrowserWindow, Electron.Rectangle>()

function setupWindow(win: BrowserWindow): void {
  // Intercept Ctrl+V before Chromium handles it — send clipboard text to renderer
  win.webContents.on('before-input-event', (event, input) => {
    if (win.isDestroyed()) return
    if (input.control && input.key.toLowerCase() === 'v' && input.type === 'keyDown') {
      const text = clipboard.readText()
      if (text) {
        win.webContents.send('clipboard:paste', text)
        event.preventDefault()
      }
    }
  })

  // Show window maximized once ready to avoid visual flash
  win.on('ready-to-show', () => {
    win.maximize()
    win.show()
  })

  // Open external links in the system browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:')) {
      shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  win.on('close', () => {
    console.log('[window] main close — detaching PTYs')
    detachPtysForWindow(win)
  })
}

function createBrowserWindow(): BrowserWindow {
  return new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 500,
    show: false,
    frame: false,
    icon: join(__dirname, '../../resources/icon.png'),
    title: 'Your Friendly Terminal',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  })
}

function createWindow(): void {
  mainWindow = createBrowserWindow()
  setupWindow(mainWindow)

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

  // Window controls — use event.sender to target the correct window
  ipcMain.on('window:minimize', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize()
  })

  ipcMain.on('window:maximize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win?.isMaximized()) {
      win.unmaximize()
    } else {
      win?.maximize()
    }
  })

  ipcMain.on('window:close', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close()
  })

  // Focus mode — resize window to mobile-like dimensions or restore
  ipcMain.on('window:set-focus-mode', (event, enabled: boolean) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return

    if (enabled) {
      // Save current bounds before resizing
      preFocusBounds.set(win, win.getBounds())
      // If maximized, unmaximize first so setBounds works
      if (win.isMaximized()) win.unmaximize()
      // Mobile-like: 420px wide, 760px tall, centered on current display
      const workArea = screen.getDisplayMatching(win.getBounds()).workArea
      const focusW = 420
      const focusH = 760
      const x = workArea.x + Math.round((workArea.width - focusW) / 2)
      const y = workArea.y + Math.round((workArea.height - focusH) / 2)
      win.setMinimumSize(360, 500)
      win.setBounds({ x, y, width: focusW, height: focusH })
    } else {
      // Restore previous bounds
      const saved = preFocusBounds.get(win)
      win.setMinimumSize(800, 500)
      if (saved) {
        win.setBounds(saved)
        preFocusBounds.delete(win)
      }
    }
  })

}

// --- App lifecycle ---

app.whenReady().then(() => {
  // Remove default menu so its accelerators (Ctrl+V, etc.) don't intercept terminal input
  Menu.setApplicationMenu(null)

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
  // Double-check there are truly no windows left (safety guard for multi-window)
  if (BrowserWindow.getAllWindows().length > 0) return

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

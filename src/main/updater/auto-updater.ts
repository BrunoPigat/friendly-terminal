import { autoUpdater, UpdateInfo } from 'electron-updater'
import { BrowserWindow } from 'electron'

export interface UpdateEvents {
  onUpdateAvailable?: (info: UpdateInfo) => void
  onUpdateDownloaded?: (info: UpdateInfo) => void
  onUpdateError?: (error: Error) => void
  onUpdateNotAvailable?: (info: UpdateInfo) => void
}

/**
 * Initializes the auto-updater and begins checking for updates.
 * Sends update status events to the renderer via the main window.
 */
export function initAutoUpdater(
  mainWindow: BrowserWindow,
  events?: UpdateEvents
): void {
  // Disable auto-download so the user can choose when to install
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('update-available', (info: UpdateInfo) => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send('updater:update-available', {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: info.releaseNotes
      })
    }
    events?.onUpdateAvailable?.(info)
  })

  autoUpdater.on('update-not-available', (info: UpdateInfo) => {
    events?.onUpdateNotAvailable?.(info)
  })

  autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send('updater:update-downloaded', {
        version: info.version
      })
    }
    events?.onUpdateDownloaded?.(info)
  })

  autoUpdater.on('error', (error: Error) => {
    console.error('Auto-updater error:', error.message)
    events?.onUpdateError?.(error)
  })
}

/**
 * Checks for available updates. Safe to call at any time;
 * errors are caught and logged.
 */
export async function checkForUpdates(): Promise<void> {
  try {
    await autoUpdater.checkForUpdates()
  } catch (err) {
    console.error('Failed to check for updates:', err)
  }
}

/**
 * Downloads the available update.
 */
export async function downloadUpdate(): Promise<void> {
  try {
    await autoUpdater.downloadUpdate()
  } catch (err) {
    console.error('Failed to download update:', err)
  }
}

/**
 * Quits the app and installs the downloaded update.
 */
export function quitAndInstall(): void {
  autoUpdater.quitAndInstall()
}

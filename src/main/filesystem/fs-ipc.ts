import { ipcMain, BrowserWindow } from 'electron'
import { stat, readFile, writeFile, mkdir } from 'fs/promises'
import { watch, type FSWatcher } from 'fs'
import { dirname } from 'path'
import { listDisks } from './disk-service'
import { readDirectory } from './tree-service'

const watchers = new Map<string, FSWatcher>()

/** Map watched dirPath → the BrowserWindow that requested the watch */
const watchOwners = new Map<string, BrowserWindow>()

/**
 * Registers all filesystem-related IPC handlers.
 * Call once. Uses event.sender to route watch events to the correct window.
 */
export function registerFsIpc(_mainWindow: BrowserWindow): void {
  // Guard against double-registration (second window)
  if ((registerFsIpc as { _registered?: boolean })._registered) return
  ;(registerFsIpc as { _registered?: boolean })._registered = true

  ipcMain.handle('fs:list-disks', async () => {
    console.log('[fs:list-disks] listing drives')
    return listDisks()
  })

  ipcMain.handle('fs:read-dir', async (_event, dirPath: string) => {
    return readDirectory(dirPath)
  })

  ipcMain.handle('fs:stat', async (_event, filePath: string) => {
    try {
      const info = await stat(filePath)
      return {
        exists: true,
        isDirectory: info.isDirectory(),
        isFile: info.isFile(),
        size: info.size,
        modified: info.mtime.toISOString(),
        created: info.birthtime.toISOString()
      }
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code
      if (code === 'ENOENT') {
        return { exists: false }
      }
      console.error(`[fs:stat] FAILED "${filePath}": ${(err as Error).message}`)
      throw err
    }
  })

  ipcMain.handle('fs:read-file', async (_event, filePath: string) => {
    try {
      return await readFile(filePath, 'utf-8')
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code
      if (code === 'ENOENT') return null
      console.error(`[fs:read-file] FAILED "${filePath}": ${(err as Error).message}`)
      throw err
    }
  })

  ipcMain.handle('fs:write-file', async (_event, filePath: string, content: string) => {
    try {
      await mkdir(dirname(filePath), { recursive: true })
      await writeFile(filePath, content, 'utf-8')
    } catch (err) {
      console.error(`[fs:write-file] FAILED "${filePath}": ${(err as Error).message}`)
      throw err
    }
  })

  // ---- Filesystem watcher ---------------------------------------------------

  ipcMain.handle('fs:watch', async (event, dirPath: string) => {
    // Already watching this path
    if (watchers.has(dirPath)) return

    // Track which window requested this watch
    const senderWindow = BrowserWindow.fromWebContents(event.sender)
    if (senderWindow) watchOwners.set(dirPath, senderWindow)

    try {
      let debounceTimer: ReturnType<typeof setTimeout> | null = null

      const watcher = watch(dirPath, { recursive: true }, (_eventType, filename) => {
        // Debounce: batch rapid changes into a single notification
        if (debounceTimer) clearTimeout(debounceTimer)
        debounceTimer = setTimeout(() => {
          try {
            const win = watchOwners.get(dirPath)
            if (win && !win.isDestroyed()) {
              // Send the directory that changed so the renderer knows what to reload
              const changedDir = filename ? dirname(`${dirPath}/${filename}`) : dirPath
              win.webContents.send('fs:changed', dirPath, changedDir)
            }
          } catch {
            // Window may have been destroyed between check and send
          }
        }, 300)
      })

      watcher.on('error', (err) => {
        console.warn(`[fs:watch] watcher error for "${dirPath}": ${err.message}`)
        watchers.delete(dirPath)
        watchOwners.delete(dirPath)
      })

      watchers.set(dirPath, watcher)
      console.log(`[fs:watch] watching "${dirPath}"`)
    } catch (err) {
      console.error(`[fs:watch] FAILED to watch "${dirPath}": ${(err as Error).message}`)
    }
  })

  ipcMain.handle('fs:unwatch', async (_event, dirPath: string) => {
    const watcher = watchers.get(dirPath)
    if (watcher) {
      watcher.close()
      watchers.delete(dirPath)
      watchOwners.delete(dirPath)
      console.log(`[fs:unwatch] stopped watching "${dirPath}"`)
    }
  })
}

/**
 * Close all watchers. Call during app shutdown.
 */
export function closeAllWatchers(): void {
  for (const [path, watcher] of watchers) {
    watcher.close()
    watchers.delete(path)
  }
}

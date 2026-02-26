import { ipcMain, BrowserWindow } from 'electron'
import { PtyManager, PtySpawnOptions } from './pty-manager'

const ptyManager = new PtyManager()

/**
 * Registers all PTY-related IPC handlers.
 * Data and exit events are pushed to the renderer via webContents.send.
 */
export function registerPtyIpc(mainWindow: BrowserWindow): void {
  ipcMain.handle(
    'pty:spawn',
    async (
      _event,
      id: string,
      options: PtySpawnOptions
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        console.log(`[pty:spawn] id="${id}" shell="${options?.shell || 'default'}" cwd="${options?.cwd || 'default'}"`)
        ptyManager.spawn(
          id,
          options,
          (data: string) => {
            if (!mainWindow.isDestroyed()) {
              mainWindow.webContents.send('pty:data', id, data)
            }
          },
          (exitCode: number, signal?: number) => {
            console.log(`[pty:exit] id="${id}" exitCode=${exitCode} signal=${signal}`)
            if (!mainWindow.isDestroyed()) {
              mainWindow.webContents.send('pty:exit', id, exitCode, signal)
            }
          }
        )
        return { success: true }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error(`[pty:spawn] FAILED id="${id}": ${message}`)
        return { success: false, error: message }
      }
    }
  )

  ipcMain.on('pty:write', (_event, id: string, data: string) => {
    console.log(`[pty:write] id="${id}" data="${data.replace(/\n/g, '\\n').slice(0, 100)}"`)
    ptyManager.write(id, data)
  })

  ipcMain.on('pty:resize', (_event, id: string, cols: number, rows: number) => {
    ptyManager.resize(id, cols, rows)
  })

  ipcMain.handle(
    'pty:kill',
    async (_event, id: string): Promise<void> => {
      console.log(`[pty:kill] id="${id}"`)
      ptyManager.kill(id)
    }
  )
}

/**
 * Kills all PTY processes. Call during app shutdown.
 */
export function killAllPty(): void {
  ptyManager.killAll()
}

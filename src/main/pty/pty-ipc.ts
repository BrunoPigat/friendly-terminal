import { ipcMain, BrowserWindow } from 'electron'
import { PtyManager, PtySpawnOptions } from './pty-manager'

const ptyManager = new PtyManager()

/** Map pty id → the BrowserWindow that owns it, so events route to the right window */
const ptyOwners = new Map<string, BrowserWindow>()

/**
 * Registers all PTY-related IPC handlers.
 * Call once. Uses event.sender to route data back to the originating window.
 */
export function registerPtyIpc(_mainWindow: BrowserWindow): void {
  // Guard against double-registration (second window)
  if ((registerPtyIpc as { _registered?: boolean })._registered) return
  ;(registerPtyIpc as { _registered?: boolean })._registered = true

  ipcMain.handle(
    'pty:spawn',
    async (
      event,
      id: string,
      options: PtySpawnOptions
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        console.log(`[pty:spawn] id="${id}" shell="${options?.shell || 'default'}" cwd="${options?.cwd || 'default'}"`)

        // Find the BrowserWindow that sent this request
        const senderWindow = BrowserWindow.fromWebContents(event.sender)
        if (senderWindow) ptyOwners.set(id, senderWindow)

        ptyManager.spawn(
          id,
          options,
          (data: string) => {
            try {
              const win = ptyOwners.get(id)
              if (win && !win.isDestroyed()) {
                win.webContents.send('pty:data', id, data)
              }
            } catch {
              // Window may have been destroyed between the check and the send
            }
          },
          (exitCode: number, signal?: number) => {
            console.log(`[pty:exit] id="${id}" exitCode=${exitCode} signal=${signal}`)
            try {
              const win = ptyOwners.get(id)
              if (win && !win.isDestroyed()) {
                win.webContents.send('pty:exit', id, exitCode, signal)
              }
            } catch {
              // Window may have been destroyed between the check and the send
            }
            ptyOwners.delete(id)
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
      ptyOwners.delete(id)
    }
  )
}

/**
 * Kills all PTY processes. Call during app shutdown.
 */
export function killAllPty(): void {
  ptyManager.killAll()
}

/**
 * Returns PTY IDs owned by a specific window (without modifying anything).
 */
export function collectPtyIdsForWindow(win: BrowserWindow): string[] {
  const ids: string[] = []
  for (const [id, owner] of ptyOwners) {
    if (owner === win) ids.push(id)
  }
  return ids
}

/**
 * Detaches or kills PTY processes owned by a specific window.
 * When detachOnly is true, callbacks are nulled but PTY processes stay alive.
 */
export function killPtysForWindow(win: BrowserWindow, { detachOnly = false } = {}): void {
  const idsToProcess = collectPtyIdsForWindow(win)
  if (idsToProcess.length === 0) return

  console.log(`[pty-ipc] killPtysForWindow: ${detachOnly ? 'detaching' : 'killing'} ${idsToProcess.length} PTYs: ${idsToProcess.join(', ')}`)

  for (const id of idsToProcess) {
    ptyOwners.delete(id)
    if (detachOnly) {
      ptyManager.detach(id)
    } else {
      ptyManager.kill(id)
    }
  }
}

/**
 * Kill a single PTY by id. Used for deferred kills after window destruction.
 */
export function killPtyById(id: string): void {
  ptyManager.kill(id)
}

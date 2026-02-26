import * as pty from 'node-pty'

export interface PtySpawnOptions {
  shell?: string
  cwd?: string
  env?: Record<string, string>
  cols?: number
  rows?: number
}

interface PtyInstance {
  process: pty.IPty
  onDataCallback: ((data: string) => void) | null
  onExitCallback: ((exitCode: number, signal?: number) => void) | null
}

export class PtyManager {
  private instances: Map<string, PtyInstance> = new Map()

  /**
   * Spawns a new PTY process and stores it by id.
   */
  spawn(
    id: string,
    options: PtySpawnOptions,
    onData: (data: string) => void,
    onExit: (exitCode: number, signal?: number) => void
  ): void {
    // Kill existing instance with same id if present
    if (this.instances.has(id)) {
      this.kill(id)
    }

    const shell = options.shell || PtyManager.getDefaultShell()
    const cols = options.cols || 120
    const rows = options.rows || 30

    const env = options.env
      ? { ...process.env, ...options.env }
      : { ...process.env }

    const ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-256color',
      cols,
      rows,
      cwd: options.cwd || process.env.USERPROFILE || process.env.HOME || 'C:\\',
      env: env as Record<string, string>,
      useConpty: true
    })

    const instance: PtyInstance = {
      process: ptyProcess,
      onDataCallback: onData,
      onExitCallback: onExit
    }

    ptyProcess.onData((data: string) => {
      if (instance.onDataCallback) {
        instance.onDataCallback(data)
      }
    })

    ptyProcess.onExit(({ exitCode, signal }) => {
      if (instance.onExitCallback) {
        instance.onExitCallback(exitCode, signal)
      }
      this.instances.delete(id)
    })

    this.instances.set(id, instance)
  }

  /**
   * Writes data to the stdin of a PTY instance.
   */
  write(id: string, data: string): void {
    const instance = this.instances.get(id)
    if (!instance) {
      console.warn(`[PtyManager] write ignored — PTY "${id}" not found (not yet spawned or already exited)`)
      return
    }
    instance.process.write(data)
  }

  /**
   * Resizes a PTY instance.
   */
  resize(id: string, cols: number, rows: number): void {
    const instance = this.instances.get(id)
    if (!instance) {
      console.warn(`[PtyManager] resize ignored — PTY "${id}" not found (not yet spawned or already exited)`)
      return
    }
    instance.process.resize(cols, rows)
  }

  /**
   * Kills a PTY instance and removes it from the map.
   */
  kill(id: string): void {
    const instance = this.instances.get(id)
    if (!instance) {
      console.log(`[PtyManager] kill skipped — PTY "${id}" not found`)
      return
    }
    console.log(`[PtyManager] killing PTY "${id}"`)
    // Detach callbacks before kill to prevent exit handler re-entry
    instance.onDataCallback = null
    instance.onExitCallback = null
    try {
      instance.process.kill()
    } catch (err) {
      console.warn(`[PtyManager] kill error for "${id}" (process may have already exited): ${(err as Error).message}`)
    }
    this.instances.delete(id)
  }

  /**
   * Kills all PTY instances. Used during app shutdown.
   */
  killAll(): void {
    for (const id of this.instances.keys()) {
      this.kill(id)
    }
  }

  /**
   * Returns whether a PTY instance with the given id exists.
   */
  has(id: string): boolean {
    return this.instances.has(id)
  }

  /**
   * Returns the default shell for the current platform.
   */
  static getDefaultShell(): string {
    if (process.platform === 'win32') {
      return 'powershell.exe'
    }
    return process.env.SHELL || '/bin/bash'
  }
}

import { useEffect, useRef, useCallback } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebglAddon } from '@xterm/addon-webgl'
import { DEFAULT_TERMINAL_OPTIONS } from '@/lib/constants'
import * as api from '@/lib/api'

import '@xterm/xterm/css/xterm.css'

interface UseTerminalOptions {
  terminalId: string
  cwd?: string
}

/**
 * Tracks which PTY IDs have been spawned so that React StrictMode
 * double-mount doesn't spawn a second time for the same ID.
 */
const spawnedPtys = new Set<string>()

export function useTerminal({ terminalId, cwd }: UseTerminalOptions) {
  const containerRef = useRef<HTMLDivElement>(null)
  const terminalRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const disposeDataRef = useRef<(() => void) | null>(null)
  const disposeExitRef = useRef<(() => void) | null>(null)
  const ptyReadyRef = useRef(false)

  const fit = useCallback(() => {
    const fitAddon = fitAddonRef.current
    const terminal = terminalRef.current
    if (!fitAddon || !terminal) return
    try {
      fitAddon.fit()
      if (ptyReadyRef.current) {
        api.ptyResize(terminalId, terminal.cols, terminal.rows)
      }
    } catch {
      // Container may not be visible yet
    }
  }, [terminalId])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const terminal = new Terminal(DEFAULT_TERMINAL_OPTIONS)
    terminalRef.current = terminal

    const fitAddon = new FitAddon()
    fitAddonRef.current = fitAddon
    terminal.loadAddon(fitAddon)

    terminal.open(container)

    try {
      const webglAddon = new WebglAddon()
      webglAddon.onContextLoss(() => {
        webglAddon.dispose()
      })
      terminal.loadAddon(webglAddon)
    } catch {
      console.warn('[useTerminal] WebGL addon not available, falling back to canvas renderer.')
    }

    fitAddon.fit()

    let disposed = false
    ptyReadyRef.current = false

    async function initPty() {
      // Skip spawn if this PTY was already created (StrictMode remount)
      const alreadySpawned = spawnedPtys.has(terminalId)

      try {
        if (!alreadySpawned) {
          spawnedPtys.add(terminalId)
          await api.ptySpawn(terminalId, {
            cols: terminal.cols,
            rows: terminal.rows,
            cwd: cwd ?? undefined
          })
        }

        if (disposed) {
          // Don't kill — the next mount will reuse this PTY
          return
        }

        ptyReadyRef.current = true

        // PTY → Terminal
        disposeDataRef.current = api.onPtyData((id, data) => {
          if (id === terminalId) {
            terminal.write(data)
          }
        })

        // PTY exit
        disposeExitRef.current = api.onPtyExit((id, exitCode) => {
          if (id === terminalId) {
            ptyReadyRef.current = false
            spawnedPtys.delete(terminalId)
            terminal.write(`\r\n[Process exited with code ${exitCode}]\r\n`)
          }
        })

        // Terminal → PTY (only after spawn is done)
        terminal.onData((data) => {
          if (ptyReadyRef.current) {
            api.ptyWrite(terminalId, data)
          }
        })

        // Sync size now that PTY exists
        fitAddon.fit()
        api.ptyResize(terminalId, terminal.cols, terminal.rows)
      } catch (err) {
        console.error('[useTerminal] Failed to create PTY:', err)
        spawnedPtys.delete(terminalId)
        terminal.write('\r\n[Failed to start terminal process]\r\n')
      }
    }

    initPty()

    // ResizeObserver — only forward resize to PTY if it's ready
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        try {
          fitAddon.fit()
          if (ptyReadyRef.current) {
            api.ptyResize(terminalId, terminal.cols, terminal.rows)
          }
        } catch {
          // ignore
        }
      })
    })
    resizeObserver.observe(container)

    return () => {
      disposed = true
      ptyReadyRef.current = false
      resizeObserver.disconnect()
      disposeDataRef.current?.()
      disposeExitRef.current?.()
      // Don't kill PTY here — StrictMode will remount and reuse it.
      // PTY gets killed when the tab is explicitly closed (via TerminalTabs).
      terminal.dispose()
      terminalRef.current = null
      fitAddonRef.current = null
    }
  }, [terminalId, cwd, fit])

  return { containerRef, terminalRef, fit }
}

import { useEffect, useRef, useCallback } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebglAddon } from '@xterm/addon-webgl'
import { DEFAULT_TERMINAL_OPTIONS } from '@/lib/constants'
import { useTerminalStore } from '@/stores/terminal-store'
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

/**
 * Tracks which PTY IDs have had the engine command sent,
 * so we only auto-start once even across StrictMode remounts.
 */
const engineStartedPtys = new Set<string>()

export function useTerminal({ terminalId, cwd }: UseTerminalOptions) {
  const containerRef = useRef<HTMLDivElement>(null)
  const terminalRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const disposeDataRef = useRef<(() => void) | null>(null)
  const disposeExitRef = useRef<(() => void) | null>(null)
  const ptyReadyRef = useRef(false)
  const engineCommandSentRef = useRef(false)
  const engineReadyRef = useRef(false)
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const updateTerminal = useTerminalStore((s) => s.updateTerminal)

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

    // Capture the engine type for auto-starting (captured once at effect start)
    const terminalEntry = useTerminalStore.getState().terminals.get(terminalId)
    const engineCommand = terminalEntry?.engine === 'claude' ? 'claude' : 'gemini'

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

            // Only detect engine readiness AFTER the engine command has been sent
            // (ignore shell prompts that appear before the engine starts)
            if (engineCommandSentRef.current && !engineReadyRef.current) {
              // Strip all ANSI escape sequences (SGR, cursor, erase, OSC, etc.)
              const cleanData = data.replace(/\x1b(?:\[[0-9;?]*[a-zA-Z]|\][^\x07]*\x07|\(B)/g, '')

              // Claude Code shows '>' or '❯' prompt when ready
              // Gemini CLI shows '❯' prompt when ready
              if (cleanData.includes('> ') || cleanData.includes('❯') || cleanData.trim().endsWith('>')) {
                console.log('[useTerminal] ✅ Engine ready detected! Setting isLoading=false for', terminalId)
                updateTerminal(terminalId, { isLoading: false })
                engineReadyRef.current = true
                if (loadingTimeoutRef.current) {
                  clearTimeout(loadingTimeoutRef.current)
                  loadingTimeoutRef.current = null
                }
              }
            }
          }
        })

        // PTY exit
        disposeExitRef.current = api.onPtyExit((id, exitCode) => {
          if (id === terminalId) {
            ptyReadyRef.current = false
            spawnedPtys.delete(terminalId)
            engineStartedPtys.delete(terminalId)
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

        // Auto-start the AI engine command (separate from PTY spawn guard)
        if (!engineStartedPtys.has(terminalId) && terminalEntry) {
          engineStartedPtys.add(terminalId)
          console.log('[useTerminal] 🚀 Will auto-start engine:', engineCommand, 'for terminal:', terminalId)
          // Wait for the shell to be ready, then cd to project dir and send the command
          setTimeout(() => {
            if (!ptyReadyRef.current) {
              console.warn('[useTerminal] ⚠️ PTY not ready, cannot send engine command for:', terminalId)
              updateTerminal(terminalId, { isLoading: false })
              return
            }

            // Ensure we're in the project directory before starting the engine
            if (cwd) {
              console.log('[useTerminal] 📂 Changing to project dir:', cwd)
              api.ptyWrite(terminalId, `cd "${cwd}"\r`)
            }

            // Small delay after cd to ensure the shell processes it before engine starts
            setTimeout(() => {
              if (!ptyReadyRef.current) return
              console.log('[useTerminal] 📤 Sending engine command:', engineCommand, 'to terminal:', terminalId)
              api.ptyWrite(terminalId, `${engineCommand}\r`)
              engineCommandSentRef.current = true

              // Start fallback timeout — if engine doesn't show a prompt within 15s, clear loading anyway
              loadingTimeoutRef.current = setTimeout(() => {
                if (!engineReadyRef.current) {
                  console.log('[useTerminal] ⏱️ Fallback timeout: setting isLoading=false for', terminalId)
                  updateTerminal(terminalId, { isLoading: false })
                  engineReadyRef.current = true
                }
              }, 15000)
            }, 500)
          }, 1000)
        } else {
          console.log('[useTerminal] ⏭️ Skipping auto-start (already started or no terminal entry)', {
            alreadyStarted: engineStartedPtys.has(terminalId),
            hasTerminalEntry: !!terminalEntry,
            terminalId
          })
        }
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
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
        loadingTimeoutRef.current = null
      }
      // Don't kill PTY here — StrictMode will remount and reuse it.
      // PTY gets killed when the tab is explicitly closed (via TerminalTabs).
      terminal.dispose()
      terminalRef.current = null
      fitAddonRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [terminalId, cwd])

  return { containerRef, terminalRef, fit }
}

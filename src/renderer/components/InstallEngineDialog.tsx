import { useEffect, useRef, useCallback, useState } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import * as api from '@/lib/api'
import { useSettingsStore } from '@/stores/settings-store'

interface Props {
  engineName: string
  installCommand: string
  onClose: (installed: boolean) => void
}

interface Hint {
  type: 'info' | 'warn'
  message: string
}

// Patterns in raw PTY output that trigger user-facing hints
const HINT_PATTERNS: Array<{ pattern: RegExp; hint: Hint }> = [
  {
    pattern: /EBADENGINE/,
    hint: {
      type: 'info',
      message: 'Node version mismatch warning — this is usually harmless and won\'t stop the installation.'
    }
  },
  {
    pattern: /EACCES|permission denied/i,
    hint: {
      type: 'warn',
      message: 'Permission error detected. On macOS/Linux try running the install command with sudo in a terminal.'
    }
  },
  {
    pattern: /ENOTFOUND|network/i,
    hint: {
      type: 'warn',
      message: 'Network issue detected. Check your internet connection and try again.'
    }
  },
  {
    pattern: /npm warn/i,
    hint: {
      type: 'info',
      message: 'npm warnings are informational — they don\'t mean the installation failed.'
    }
  }
]

export default function InstallEngineDialog({ engineName, installCommand, onClose }: Props) {
  const theme = useSettingsStore((s) => s.getResolvedTheme())
  const containerRef = useRef<HTMLDivElement>(null)
  const terminalRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const ptyIdRef = useRef<string>(`install-${Date.now()}`)
  const [running, setRunning] = useState(true)
  const [exitCode, setExitCode] = useState<number | null>(null)
  const [hints, setHints] = useState<Hint[]>([])
  const shownHintsRef = useRef<Set<string>>(new Set())

  const addHintIfNew = useCallback((hint: Hint) => {
    if (shownHintsRef.current.has(hint.message)) return
    shownHintsRef.current.add(hint.message)
    setHints((prev) => [...prev, hint])
  }, [])

  const handleClose = useCallback(() => {
    const term = terminalRef.current
    if (term) {
      term.dispose()
      terminalRef.current = null
    }
    api.ptyKill(ptyIdRef.current).catch(() => {})
    onClose(exitCode === 0)
  }, [onClose, exitCode])

  useEffect(() => {
    const ptyId = ptyIdRef.current
    const resolvedTheme = useSettingsStore.getState().getResolvedTheme()
    const terminal = new Terminal({
      fontSize: 13,
      fontFamily: "'Cascadia Code', 'Consolas', monospace",
      theme: {
        background: resolvedTheme.background,
        foreground: resolvedTheme.foreground,
        cursor: resolvedTheme.cursor
      },
      cursorBlink: false,
      disableStdin: true,
      convertEol: true,
      scrollback: 1000
    })
    const fitAddon = new FitAddon()
    terminal.loadAddon(fitAddon)

    terminalRef.current = terminal
    fitAddonRef.current = fitAddon

    if (containerRef.current) {
      terminal.open(containerRef.current)
      fitAddon.fit()
    }

    terminal.writeln(`\x1b[1;36mInstalling ${engineName}...\x1b[0m`)
    terminal.writeln(`\x1b[90m$ ${installCommand}\x1b[0m\n`)

    let active = true

    const unsubData = api.onPtyData((id, data) => {
      if (id !== ptyId) return
      console.log('[InstallEngine] PTY data:', JSON.stringify(data))
      terminal.write(data)
      for (const { pattern, hint } of HINT_PATTERNS) {
        if (pattern.test(data)) addHintIfNew(hint)
      }
    })

    const unsubExit = api.onPtyExit((id, code) => {
      if (id !== ptyId) return
      console.log('[InstallEngine] PTY exited with code:', code)
      setRunning(false)
      setExitCode(code)
      if (code === 0) {
        terminal.writeln('\n\x1b[1;32mInstallation completed successfully!\x1b[0m')
      } else {
        terminal.writeln(`\n\x1b[1;31mInstallation failed (exit code ${code})\x1b[0m`)
      }
    })

    // Spawn PTY and write install command
    const isWindows = navigator.userAgent.includes('Windows')
    // Use cmd.exe on Windows — PowerShell parses '@' as a splatting expression
    // which breaks scoped package names like @google/gemini-cli
    const shell = isWindows ? 'cmd.exe' : '/bin/bash'
    const lineEnd = isWindows ? '\r\n' : '\n'
    console.log('[InstallEngine] Spawning PTY', { ptyId, shell, installCommand })
    api.ptySpawn(ptyId, {
      shell,
      cols: terminal.cols,
      rows: terminal.rows
    }).then(() => {
      if (!active) {
        console.log('[InstallEngine] Effect cleaned up before spawn resolved, skipping write')
        return
      }
      console.log('[InstallEngine] PTY spawned, writing install command')
      api.ptyWrite(ptyId, installCommand + lineEnd + 'exit' + lineEnd)
    }).catch((err) => {
      console.error('[InstallEngine] Failed to spawn PTY:', err)
      if (!active) return
      terminal.writeln(`\x1b[1;31mFailed to start installer: ${err}\x1b[0m`)
      setRunning(false)
    })

    const handleResize = () => fitAddon.fit()
    window.addEventListener('resize', handleResize)

    return () => {
      active = false
      window.removeEventListener('resize', handleResize)
      unsubData()
      unsubExit()
      terminal.dispose()
      terminalRef.current = null
      api.ptyKill(ptyId).catch(() => {})
    }
  }, [engineName, installCommand, addHintIfNew])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [handleClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-lg border border-win-border bg-win-card p-6">
        <h2 className="mb-1 text-lg font-semibold text-win-text">
          Installing {engineName}
        </h2>
        <p className="mb-4 text-sm text-win-text-secondary">
          {running
            ? 'Installation in progress — this may take a minute...'
            : exitCode === 0
            ? 'Done! You can close this dialog.'
            : 'Installation failed. Check the output above for details.'}
        </p>

        <div
          ref={containerRef}
          className="h-64 w-full rounded-md border border-win-border p-1"
          style={{ backgroundColor: theme.background }}
        />

        {/* Contextual hints based on detected output patterns */}
        {hints.length > 0 && (
          <div className="mt-3 space-y-2">
            {hints.map((hint, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 rounded-md px-3 py-2 text-xs ${
                  hint.type === 'warn'
                    ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                    : 'bg-gray-100 text-gray-500 border border-gray-200'
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {hint.message}
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleClose}
            className="rounded-lg bg-win-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-win-accent-dark transition-colors"
          >
            {running ? 'Cancel' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  )
}

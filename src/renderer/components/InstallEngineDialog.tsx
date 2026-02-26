import { useEffect, useRef, useCallback, useState } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import * as api from '@/lib/api'

interface Props {
  engineName: string
  installCommand: string
  onClose: (installed: boolean) => void
}

export default function InstallEngineDialog({ engineName, installCommand, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const terminalRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const ptyIdRef = useRef<string>(`install-${Date.now()}`)
  const [running, setRunning] = useState(true)
  const [exitCode, setExitCode] = useState<number | null>(null)

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
    const terminal = new Terminal({
      fontSize: 13,
      fontFamily: "'Cascadia Code', 'Consolas', monospace",
      theme: {
        background: '#1E1E1E',
        foreground: '#CCCCCC',
        cursor: '#CCCCCC'
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

    const unsubData = api.onPtyData((id, data) => {
      if (id === ptyId) terminal.write(data)
    })

    const unsubExit = api.onPtyExit((id, code) => {
      if (id !== ptyId) return
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
    const shell = isWindows ? 'powershell.exe' : '/bin/bash'
    api.ptySpawn(ptyId, {
      shell,
      cols: terminal.cols,
      rows: terminal.rows
    }).then(() => {
      api.ptyWrite(ptyId, installCommand + '\nexit\n')
    }).catch((err) => {
      terminal.writeln(`\x1b[1;31mFailed to start installer: ${err}\x1b[0m`)
      setRunning(false)
    })

    const handleResize = () => fitAddon.fit()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      unsubData()
      unsubExit()
      terminal.dispose()
      terminalRef.current = null
      api.ptyKill(ptyId).catch(() => {})
    }
  }, [engineName, installCommand])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !running) handleClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [running, handleClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-lg border border-win-border bg-win-card p-6">
        <h2 className="mb-1 text-lg font-semibold text-win-text">
          Installing {engineName}
        </h2>
        <p className="mb-4 text-sm text-win-text-secondary">
          {running ? 'Installation in progress...' : exitCode === 0 ? 'Done! You can close this dialog.' : 'Installation failed. Check the output for details.'}
        </p>

        <div
          ref={containerRef}
          className="h-72 w-full rounded-md border border-win-border bg-[#1E1E1E] p-1"
        />

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleClose}
            disabled={running}
            className="rounded-lg bg-win-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-win-accent-dark disabled:opacity-40 transition-colors"
          >
            {running ? 'Installing...' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  )
}

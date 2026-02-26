import { useTerminal } from '@/hooks/useTerminal'
import { useTerminalStore } from '@/stores/terminal-store'

interface TerminalInstanceProps {
  terminalId: string
  cwd: string
}

/**
 * Renders a single xterm.js terminal.
 * The heavy lifting (PTY creation, data flow, resize, cleanup)
 * is handled by the useTerminal hook.
 */
export default function TerminalInstance({ terminalId, cwd }: TerminalInstanceProps) {
  const { containerRef } = useTerminal({ terminalId, cwd: cwd || undefined })
  // Only subscribe to the specific terminal's loading state
  const terminal = useTerminalStore((s) => s.terminals.get(terminalId))

  return (
    <>
      {terminal?.isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 z-10">
          <div className="flex flex-col items-center gap-3">
            {/* Loading spinner */}
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-800 border-t-orange-400" />
            <div className="text-sm text-zinc-400">Starting {terminal.engine === 'claude' ? 'Claude' : 'Gemini'}...</div>
          </div>
        </div>
      )}
      <div
        ref={containerRef}
        className="h-full w-full bg-zinc-950 p-1"
        data-terminal-id={terminalId}
        style={{ opacity: terminal?.isLoading ? 0 : 1 }}
      />
    </>
  )
}

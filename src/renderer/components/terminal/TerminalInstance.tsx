import { useTerminal } from '@/hooks/useTerminal'
import { useTerminalStore } from '@/stores/terminal-store'
import { useSettingsStore } from '@/stores/settings-store'

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
  const terminal = useTerminalStore((s) => s.terminals.get(terminalId))
  const theme = useSettingsStore((s) => s.getResolvedTheme())

  return (
    <>
      {terminal?.isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10" style={{ backgroundColor: theme.background }}>
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-win-accent animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="h-2.5 w-2.5 rounded-full bg-win-accent animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="h-2.5 w-2.5 rounded-full bg-win-accent animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <div className="text-sm" style={{ color: theme.foreground }}>Connecting to your AI assistant...</div>
            <div className="text-xs" style={{ color: theme.brightBlack }}>This may take a few seconds</div>
          </div>
        </div>
      )}
      <div
        ref={containerRef}
        className="h-full w-full p-1"
        data-terminal-id={terminalId}
        style={{ backgroundColor: theme.background, opacity: terminal?.isLoading ? 0 : 1 }}
      />
    </>
  )
}

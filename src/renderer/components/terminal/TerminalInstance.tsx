import { useTerminal } from '@/hooks/useTerminal'

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

  return (
    <div
      ref={containerRef}
      className="h-full w-full bg-zinc-950 p-1"
      data-terminal-id={terminalId}
    />
  )
}

import { useTerminalStore } from '@/stores/terminal-store'
import { useChatPtyBridge } from '@/hooks/useChatPtyBridge'

/**
 * Always-mounted non-rendering component that runs useChatPtyBridge
 * for every active terminal. This ensures the PTY→chat bridge stays
 * alive even when the ChatView isn't rendered (e.g., terminal view mode).
 */
export default function ChatSessionManager() {
  // Use shallow equality to prevent infinite re-renders from new array references
  const terminalIds = useTerminalStore(
    (s) => Array.from(s.terminals.keys()),
    (a, b) => {
      if (a.length !== b.length) return false
      return a.every((id, idx) => id === b[idx])
    }
  )

  console.log('[ChatSessionManager] Rendering with terminal IDs:', terminalIds)

  return (
    <>
      {terminalIds.map((id) => (
        <BridgeInstance key={id} terminalId={id} />
      ))}
    </>
  )
}

function BridgeInstance({ terminalId }: { terminalId: string }) {
  console.log('[BridgeInstance] Mounting for terminalId:', terminalId)
  useChatPtyBridge(terminalId)
  return null
}

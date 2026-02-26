import { useEffect, useRef } from 'react'
import { useChatStore } from '@/stores/chat-store'
import { stripAnsi, normalizeOutput } from '@/lib/ansi'
import * as api from '@/lib/api'

/**
 * Ready-prompt pattern: Claude Code prints `>` or `❯` when waiting for input.
 * We check if the last non-empty line of stripped output matches this.
 */
const READY_PROMPT_RE = /^[>❯]\s*$/

/**
 * Tool approval patterns — Claude asks for permission to run tools.
 */
const TOOL_APPROVAL_RE = /\(Y\)es|\(y\/n\)|Allow |Do you want to proceed/i

/**
 * Debounce time (ms) to wait after last PTY data before considering
 * the assistant message complete.
 */
const FLUSH_DEBOUNCE_MS = 300

/**
 * Bridge hook that subscribes to PTY data for a specific terminal
 * and feeds parsed messages into the chat store.
 *
 * This hook should be mounted once per terminal, regardless of
 * whether the chat view is visible.
 */
export function useChatPtyBridge(terminalId: string) {
  console.log('[useChatPtyBridge] Mounted for terminalId:', terminalId)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rawBufferRef = useRef('')

  useEffect(() => {
    console.log('[useChatPtyBridge] Effect running for terminalId:', terminalId)
    const store = useChatStore.getState()
    // Ensure session exists
    if (!store.sessions.has(terminalId)) {
      console.log('[useChatPtyBridge] Session does not exist, initializing...')
      store.initSession(terminalId)
    } else {
      console.log('[useChatPtyBridge] Session already exists')
    }

    const disposeData = api.onPtyData((id, data) => {
      if (id !== terminalId) return

      console.log('[useChatPtyBridge] PTY data received:', { terminalId, dataLength: data.length, preview: data.slice(0, 50) })

      const chatStore = useChatStore.getState()
      const session = chatStore.sessions.get(terminalId)
      if (!session) {
        console.warn('[useChatPtyBridge] No session found for terminalId:', terminalId)
        return
      }

      // --- Phase 1: Shell ready + auto-start Claude ---
      if (!session.shellReady) {
        console.log('[useChatPtyBridge] Shell not ready yet, setting shellReady=true')
        // First data from PTY means shell has printed its prompt
        chatStore.setShellReady(terminalId, true)

        if (!session.claudeStarted) {
          console.log('[useChatPtyBridge] Auto-starting Claude Code...')
          // Auto-start Claude Code
          chatStore.setClaudeStarted(terminalId, true)
          // Small delay to let shell fully initialize
          setTimeout(() => {
            api.ptyWrite(terminalId, 'claude\n')
            console.log('[useChatPtyBridge] Claude command written to PTY')
          }, 200)
        }
        return
      }

      // --- Phase 2: Accumulate data ---
      rawBufferRef.current += data

      // Strip ANSI for analysis
      const stripped = normalizeOutput(rawBufferRef.current)

      // Filter user input echo
      if (session.lastUserInput) {
        const echoLine = session.lastUserInput.trim()
        if (stripped.startsWith(echoLine)) {
          // Remove the echo from our analysis but keep accumulating
        }
      }

      // Mark as streaming
      if (!session.isStreaming) {
        chatStore.setStreaming(terminalId, true)
      }

      // Update streaming content for live preview
      chatStore.setStreamingContent(terminalId, stripped)

      // --- Phase 3: Check for ready prompt (debounced) ---
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      debounceRef.current = setTimeout(() => {
        const currentStore = useChatStore.getState()
        const currentSession = currentStore.sessions.get(terminalId)
        if (!currentSession) return

        const currentStripped = normalizeOutput(rawBufferRef.current)
        const lines = currentStripped.split('\n').filter((l) => l.trim().length > 0)
        const lastLine = lines[lines.length - 1] ?? ''

        if (READY_PROMPT_RE.test(lastLine.trim())) {
          // Claude is ready for input — flush accumulated output as assistant message
          let content = currentStripped

          // Remove the ready prompt line from the message content
          const contentLines = content.split('\n')
          while (contentLines.length > 0 && READY_PROMPT_RE.test(contentLines[contentLines.length - 1].trim())) {
            contentLines.pop()
          }
          content = contentLines.join('\n').trim()

          // Filter out user echo from the beginning
          if (currentSession.lastUserInput) {
            const echo = currentSession.lastUserInput.trim()
            if (content.startsWith(echo)) {
              content = content.slice(echo.length).trim()
            }
          }

          // Determine message role
          let role: 'assistant' | 'tool' | 'system' = 'assistant'

          // Check if this is the startup message (first assistant message)
          if (currentSession.messages.length === 0) {
            role = 'system'
          }

          // Check for tool approval prompt
          if (TOOL_APPROVAL_RE.test(content)) {
            role = 'tool'
          }

          if (content.trim()) {
            currentStore.addMessage(terminalId, {
              terminalId,
              role,
              content
            })
          }

          // Reset state
          rawBufferRef.current = ''
          currentStore.clearBuffer(terminalId)
          currentStore.setStreaming(terminalId, false)
          currentStore.setLastUserInput(terminalId, null)
        }
      }, FLUSH_DEBOUNCE_MS)
    })

    const disposeExit = api.onPtyExit((id, exitCode) => {
      if (id !== terminalId) return

      const chatStore = useChatStore.getState()
      chatStore.addMessage(terminalId, {
        terminalId,
        role: 'system',
        content: `Process exited with code ${exitCode}`
      })
      chatStore.setStreaming(terminalId, false)
      rawBufferRef.current = ''
    })

    return () => {
      disposeData()
      disposeExit()
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [terminalId])
}

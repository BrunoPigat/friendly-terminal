import { useState, useCallback, useRef, useEffect } from 'react'
import { useChatStore } from '@/stores/chat-store'
import * as api from '@/lib/api'

interface ChatInputProps {
  terminalId: string
}

export default function ChatInput({ terminalId }: ChatInputProps) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const session = useChatStore((s) => s.sessions.get(terminalId))
  const addMessage = useChatStore((s) => s.addMessage)
  const setLastUserInput = useChatStore((s) => s.setLastUserInput)

  const isDisabled = session?.isStreaming ?? false

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 150)}px`
  }, [text])

  const handleSend = useCallback(() => {
    const trimmed = text.trim()
    if (!trimmed || isDisabled) return

    console.log('[ChatInput] Sending message:', { terminalId, text: trimmed })

    // Add user message to chat
    addMessage(terminalId, {
      terminalId,
      role: 'user',
      content: trimmed
    })

    // Store for echo filtering
    setLastUserInput(terminalId, trimmed)

    // Write to PTY
    api.ptyWrite(terminalId, trimmed + '\n')
    console.log('[ChatInput] Message written to PTY')

    setText('')
  }, [text, isDisabled, terminalId, addMessage, setLastUserInput])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  return (
    <div className="shrink-0 border-t border-zinc-800 bg-zinc-950 px-4 py-3">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isDisabled}
          placeholder={isDisabled ? 'Claude is thinking...' : 'Type a message...'}
          rows={1}
          className="flex-1 resize-none rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-zinc-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        />
        <button
          onClick={handleSend}
          disabled={isDisabled || !text.trim()}
          className="shrink-0 rounded-xl bg-blue-600 p-2.5 text-white hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Send message"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  )
}

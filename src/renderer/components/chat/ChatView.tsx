import { useEffect, useRef } from 'react'
import { useChatStore } from '@/stores/chat-store'
import { normalizeOutput } from '@/lib/ansi'
import ChatBubble from './ChatBubble'
import ChatInput from './ChatInput'

interface ChatViewProps {
  terminalId: string
}

export default function ChatView({ terminalId }: ChatViewProps) {
  console.log('[ChatView] Rendering for terminalId:', terminalId)
  const session = useChatStore((s) => s.sessions.get(terminalId))
  const scrollRef = useRef<HTMLDivElement>(null)

  const messages = session?.messages ?? []
  const isStreaming = session?.isStreaming ?? false
  const streamingContent = session?.streamingContent ?? ''

  console.log('[ChatView] Session state:', {
    terminalId,
    hasSession: !!session,
    messagesCount: messages.length,
    isStreaming
  })

  // Auto-scroll to bottom when new messages arrive or streaming updates
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages.length, streamingContent])

  return (
    <div className="flex h-full flex-col bg-zinc-950">
      {/* Message list */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-4">
        {messages.length === 0 && !isStreaming && (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-zinc-500">Starting Claude Code...</p>
          </div>
        )}

        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}

        {/* Streaming indicator */}
        {isStreaming && streamingContent.trim() && (
          <div className="flex justify-start px-4 py-1">
            <div className="max-w-[80%] rounded-2xl rounded-bl-md bg-zinc-800 px-4 py-2 text-sm text-zinc-100">
              <p className="whitespace-pre-wrap break-words text-zinc-300">
                {normalizeOutput(streamingContent).slice(0, 500)}
                {normalizeOutput(streamingContent).length > 500 && '...'}
              </p>
            </div>
          </div>
        )}

        {isStreaming && !streamingContent.trim() && (
          <div className="flex justify-start px-4 py-1">
            <div className="rounded-2xl rounded-bl-md bg-zinc-800 px-4 py-2">
              <div className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-zinc-500 animate-bounce [animation-delay:0ms]" />
                <span className="h-2 w-2 rounded-full bg-zinc-500 animate-bounce [animation-delay:150ms]" />
                <span className="h-2 w-2 rounded-full bg-zinc-500 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput terminalId={terminalId} />
    </div>
  )
}

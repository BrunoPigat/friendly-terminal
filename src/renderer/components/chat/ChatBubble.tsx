import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { ChatMessage } from '@/stores/chat-store'
import * as api from '@/lib/api'

interface ChatBubbleProps {
  message: ChatMessage
}

export default function ChatBubble({ message }: ChatBubbleProps) {
  const { role, content, timestamp } = message

  const time = new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  })

  // --- User message (right-aligned, blue) ---
  if (role === 'user') {
    return (
      <div className="flex justify-end px-4 py-1">
        <div className="max-w-[80%] rounded-2xl rounded-br-md bg-blue-600 px-4 py-2 text-sm text-white">
          <p className="whitespace-pre-wrap break-words">{content}</p>
          <p className="mt-1 text-[10px] text-blue-200 text-right">{time}</p>
        </div>
      </div>
    )
  }

  // --- System message (centered, muted) ---
  if (role === 'system') {
    return (
      <div className="flex justify-center px-4 py-1">
        <div className="max-w-[90%] rounded-lg bg-zinc-800/50 px-3 py-1.5 text-xs text-zinc-400 text-center">
          <p className="whitespace-pre-wrap break-words">{content}</p>
        </div>
      </div>
    )
  }

  // --- Tool approval message (left-aligned, amber) ---
  if (role === 'tool') {
    return (
      <div className="flex justify-start px-4 py-1">
        <div className="max-w-[80%] rounded-2xl rounded-bl-md border border-amber-700/50 bg-amber-950/40 px-4 py-2 text-sm text-amber-100">
          <div className="prose prose-invert prose-sm max-w-none prose-pre:bg-zinc-900 prose-pre:text-zinc-300 prose-code:text-amber-200">
            <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
          </div>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => api.ptyWrite(message.terminalId, 'y\n')}
              className="rounded bg-green-700 px-3 py-1 text-xs font-medium text-white hover:bg-green-600 transition-colors"
            >
              Yes
            </button>
            <button
              onClick={() => api.ptyWrite(message.terminalId, 'n\n')}
              className="rounded bg-zinc-700 px-3 py-1 text-xs font-medium text-zinc-200 hover:bg-zinc-600 transition-colors"
            >
              No
            </button>
          </div>
          <p className="mt-1 text-[10px] text-amber-300/60">{time}</p>
        </div>
      </div>
    )
  }

  // --- Assistant message (left-aligned, gray, markdown) ---
  return (
    <div className="flex justify-start px-4 py-1">
      <div className="max-w-[80%] rounded-2xl rounded-bl-md bg-zinc-800 px-4 py-2 text-sm text-zinc-100">
        <div className="prose prose-invert prose-sm max-w-none prose-pre:bg-zinc-900 prose-pre:text-zinc-300 prose-code:text-violet-300 prose-a:text-blue-400">
          <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
        </div>
        <p className="mt-1 text-[10px] text-zinc-500">{time}</p>
      </div>
    </div>
  )
}

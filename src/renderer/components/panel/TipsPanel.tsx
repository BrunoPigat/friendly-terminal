import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useProjectStore } from '@/stores/project-store'
import { useTerminalStore } from '@/stores/terminal-store'
import { useSettingsStore } from '@/stores/settings-store'
import * as api from '@/lib/api'

/**
 * Strips markdown formatting to produce plain text suitable for terminal input.
 */
function stripMarkdown(md: string): string {
  return md
    .replace(/\*\*(.+?)\*\*/g, '$1')   // bold
    .replace(/\*(.+?)\*/g, '$1')        // italic
    .replace(/_(.+?)_/g, '$1')          // italic alt
    .replace(/`(.+?)`/g, '$1')          // inline code
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // links
    .replace(/^#+\s+/gm, '')            // headings
    .replace(/^[-*]\s+/gm, '')          // list markers
    .replace(/^\d+\.\s+/gm, '')         // numbered lists
    .trim()
}

function ChatBubble({
  content,
  index,
  activeTerminalId
}: {
  content: string
  index: number
  activeTerminalId: string | null
}) {
  const handleSend = useCallback(() => {
    if (!activeTerminalId) return
    const plainText = stripMarkdown(content)
    api.ptyWrite(activeTerminalId, plainText + '\n')
  }, [activeTerminalId, content])

  return (
    <div className="flex gap-2 items-end" style={{ animationDelay: `${index * 80}ms` }}>
      {/* Avatar */}
      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center mb-0.5">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </div>
      {/* Bubble */}
      <div className="group relative max-w-[85%] rounded-xl rounded-bl-sm bg-zinc-800/80 border border-zinc-700/50 px-3 py-2 shadow-sm">
        <div className="prose prose-invert prose-sm max-w-none
          prose-p:text-[11px] prose-p:leading-relaxed prose-p:text-zinc-300 prose-p:m-0
          prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
          prose-code:text-[10px] prose-code:bg-zinc-900/80 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-blue-300 prose-code:font-mono
          prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-700 prose-pre:rounded prose-pre:text-[10px]
          prose-ul:text-[11px] prose-ul:text-zinc-300 prose-ul:my-1 prose-ol:text-[11px] prose-ol:text-zinc-300 prose-ol:my-1
          prose-li:text-[11px] prose-li:text-zinc-300 prose-li:my-0
          prose-strong:text-zinc-100
          prose-em:text-zinc-400">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
        {activeTerminalId && (
          <button
            onClick={handleSend}
            title="Send to chat"
            className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity
              p-1 rounded-md text-zinc-500 hover:text-blue-400 hover:bg-zinc-700/50"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

export default function TipsPanel() {
  const activeProject = useProjectStore((s) => s.activeProject)
  const activeTerminalId = useTerminalStore((s) => s.activeTerminalId)
  const [content, setContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const prevPathRef = useRef<string | null>(null)

  useEffect(() => {
    if (!activeProject) {
      setContent(null)
      prevPathRef.current = null
      return
    }

    const projectPath = activeProject.path
    const tipsPath = `${projectPath}/tips.md`

    const load = async () => {
      setLoading(true)
      try {
        const text = await api.readFile(tipsPath)
        setContent(text)
      } catch {
        setContent(null)
      } finally {
        setLoading(false)
      }
    }

    load()

    api.fsWatch(projectPath)
    prevPathRef.current = projectPath

    const unsub = api.onFsChanged((rootPath, changedDir) => {
      if (rootPath !== projectPath) return
      const normalizedChanged = changedDir.replace(/\\/g, '/')
      const normalizedRoot = projectPath.replace(/\\/g, '/')
      if (normalizedChanged === normalizedRoot || changedDir === projectPath) {
        api.readFile(tipsPath).then((text) => {
          setContent(text)
          // Auto-switch to Tips tab and open panel when tips.md changes
          if (text !== null) {
            useSettingsStore.getState().setRightPanelActiveTab('tips')
            useSettingsStore.getState().setRightPanelCollapsed(false)
          }
        }).catch(() => setContent(null))
      }
    })

    return () => {
      unsub()
    }
  }, [activeProject])

  // Split content by horizontal rules (---) into individual messages
  const messages = useMemo(() => {
    if (!content) return []
    return content
      .split(/\n---\n/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
  }, [content])

  if (!activeProject) {
    return (
      <div className="p-4 text-xs text-zinc-500">
        Select a project to view tips.
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-4 text-xs text-zinc-500">Loading tips...</div>
    )
  }

  if (content === null) {
    return (
      <div className="flex flex-col items-center gap-2 p-6 text-center">
        <div className="text-zinc-600">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </div>
        <p className="text-xs text-zinc-500">No tips.md found.</p>
        <p className="text-[10px] text-zinc-600">
          Create a <code className="rounded bg-zinc-800 px-1">tips.md</code> in your project root to see tips here.
        </p>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 p-6 text-center">
        <div className="text-zinc-600">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <p className="text-xs text-zinc-500">No tips yet.</p>
        <p className="text-[10px] text-zinc-600">
          Tips will appear here as you chat with the AI assistant.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 p-3 overflow-y-auto">
      {messages.map((msg, i) => (
        <ChatBubble key={i} content={msg} index={i} activeTerminalId={activeTerminalId} />
      ))}
    </div>
  )
}

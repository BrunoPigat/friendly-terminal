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
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/^#+\s+/gm, '')
    .replace(/^[-*]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
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
      <div className="flex-shrink-0 w-8 h-8 rounded-md bg-win-accent-subtle flex items-center justify-center mb-0.5">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-win-accent">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      </div>
      {/* Bubble */}
      <div className="group relative max-w-[85%] rounded-lg rounded-bl-sm bg-win-accent-subtle border border-win-accent/15 px-5 py-3.5">
        <div className="prose prose-sm max-w-none
          prose-p:text-sm prose-p:leading-relaxed prose-p:text-win-text prose-p:m-0
          prose-a:text-win-accent prose-a:no-underline hover:prose-a:underline
          prose-code:text-xs prose-code:bg-white prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-win-accent-dark prose-code:font-mono prose-code:border prose-code:border-win-border
          prose-pre:bg-white prose-pre:border prose-pre:border-win-border prose-pre:rounded prose-pre:text-xs
          prose-ul:text-sm prose-ul:text-win-text prose-ul:my-1.5 prose-ol:text-sm prose-ol:text-win-text prose-ol:my-1.5
          prose-li:text-sm prose-li:text-win-text prose-li:my-0.5
          prose-strong:text-win-text
          prose-em:text-win-text-secondary">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
        {activeTerminalId && (
          <button
            onClick={handleSend}
            title="Send to chat"
            className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity
              p-1 rounded-md text-win-text-tertiary hover:text-win-accent hover:bg-win-hover"
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
          if (text !== null) {
            useSettingsStore.getState().setRightPanelActiveTab('tips')
          }
        }).catch(() => setContent(null))
      }
    })

    return () => {
      unsub()
    }
  }, [activeProject])

  const messages = useMemo(() => {
    if (!content) return []
    return content
      .split(/\n---\n/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
  }, [content])

  if (!activeProject) {
    return (
      <div className="p-4 text-sm text-win-text-tertiary">
        Select a project to see suggestions.
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-4 text-sm text-win-text-tertiary">Loading tips...</div>
    )
  }

  if (content === null) {
    return (
      <div className="flex flex-col items-center gap-2 p-6 text-center">
        <div className="text-win-text-tertiary">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </div>
        <p className="text-sm text-win-text-secondary">No tips.md found.</p>
        <p className="text-xs text-win-text-tertiary">
          Create a <code className="rounded bg-win-hover px-1 border border-win-border">tips.md</code> in your project root to see tips here.
        </p>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 p-6 text-center">
        <div className="text-win-text-tertiary">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <p className="text-sm text-win-text-secondary">No suggestions yet</p>
        <p className="text-xs text-win-text-tertiary">
          Suggestions will appear here as you chat with your AI assistant.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto">
      {messages.map((msg, i) => (
        <ChatBubble key={i} content={msg} index={i} activeTerminalId={activeTerminalId} />
      ))}
    </div>
  )
}

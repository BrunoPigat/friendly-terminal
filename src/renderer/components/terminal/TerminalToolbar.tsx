import { useCallback, useState, useEffect, useRef } from 'react'
import { useTerminalStore, generateTerminalId } from '@/stores/terminal-store'
import { useProjectStore } from '@/stores/project-store'
import { useSettingsStore } from '@/stores/settings-store'
import { ENGINE_NAMES, type EngineId } from '@/lib/constants'
import type { AIEngineInfo } from '@/preload/types'
import * as api from '@/lib/api'
import ClearSessionDialog from './ClearSessionDialog'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/** Install URLs for each engine */
const ENGINE_INSTALL_URLS: Record<EngineId, string> = {
  claude: 'https://docs.anthropic.com/en/docs/claude-code/overview',
  gemini: 'https://github.com/google-gemini/gemini-cli?tab=readme-ov-file#-installation'
}

/**
 * Modal that displays the engine's memory file (CLAUDE.md or GEMINI.md).
 */
function MemoryModal({
  projectPath,
  engine,
  onClose
}: {
  projectPath: string
  engine: EngineId
  onClose: () => void
}) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const [content, setContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fileName = engine === 'claude' ? 'CLAUDE.md' : 'GEMINI.md'

  useEffect(() => {
    const filePath = `${projectPath}/${fileName}`
    api.readFile(filePath)
      .then((text) => {
        setContent(text)
        setLoading(false)
      })
      .catch(() => {
        setContent(null)
        setLoading(false)
      })
  }, [projectPath, fileName])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current) onClose()
    },
    [onClose]
  )

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
    >
      <div className="w-full max-w-2xl max-h-[80vh] rounded-lg border border-win-border bg-win-card flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-win-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-win-accent-subtle">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-win-accent">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-win-text">Project Memory</h2>
              <p className="text-xs text-win-text-tertiary">{fileName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-win-text-tertiary hover:bg-win-hover hover:text-win-text transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="1" y1="1" x2="13" y2="13" />
              <line x1="13" y1="1" x2="1" y2="13" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="flex items-center gap-3 text-sm text-win-text-tertiary">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-win-border border-t-win-accent" />
              Loading memory file...
            </div>
          ) : content === null || content.trim() === '' ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-win-text-tertiary">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <p className="text-sm text-win-text-secondary">No memory file found</p>
              <p className="text-xs text-win-text-tertiary">
                The AI assistant will create <code className="rounded bg-win-hover px-1.5 py-0.5 border border-win-border">{fileName}</code> as it learns about your project.
              </p>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none
              prose-headings:text-win-text prose-headings:font-semibold
              prose-h1:text-lg prose-h1:mb-3 prose-h1:mt-0
              prose-h2:text-base prose-h2:mb-2 prose-h2:mt-5
              prose-h3:text-sm prose-h3:mb-1.5 prose-h3:mt-4
              prose-p:text-sm prose-p:leading-relaxed prose-p:text-win-text-secondary prose-p:mb-2
              prose-a:text-win-accent prose-a:no-underline hover:prose-a:underline
              prose-code:text-xs prose-code:bg-win-hover prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-win-accent-dark prose-code:font-mono prose-code:border prose-code:border-win-border
              prose-pre:bg-win-bg prose-pre:border prose-pre:border-win-border prose-pre:rounded-lg prose-pre:text-xs prose-pre:p-4
              prose-ul:text-sm prose-ul:text-win-text-secondary prose-ol:text-sm prose-ol:text-win-text-secondary
              prose-li:text-sm prose-li:text-win-text-secondary prose-li:my-0.5
              prose-strong:text-win-text
              prose-em:text-win-text-secondary
              prose-hr:border-win-border">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-win-border shrink-0">
          <button
            onClick={onClose}
            className="rounded-md bg-win-accent px-5 py-2 text-sm font-medium text-white hover:bg-win-accent-dark transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Toolbar above the terminal area.
 * Contains: AI engine selector, session action buttons, and project memory.
 */
export default function TerminalToolbar() {
  const terminals = useTerminalStore((s) => s.terminals)
  const activeTerminalId = useTerminalStore((s) => s.activeTerminalId)
  const addTerminal = useTerminalStore((s) => s.addTerminal)
  const activeProject = useProjectStore((s) => s.activeProject)
  const defaultEngine = useSettingsStore((s) => s.defaultEngine)

  const minifiedView = useSettingsStore((s) => s.minifiedView)
  const toggleMinifiedView = useSettingsStore((s) => s.toggleMinifiedView)

  const activeTerminal = activeTerminalId ? terminals.get(activeTerminalId) : undefined
  const currentEngine = activeTerminal?.engine ?? defaultEngine

  const [selectedEngine, setSelectedEngine] = useState<EngineId>(defaultEngine)
  const [showClearDialog, setShowClearDialog] = useState(false)
  const [showMemory, setShowMemory] = useState(false)
  const [engines, setEngines] = useState<AIEngineInfo[]>([])
  const [engineDropdownOpen, setEngineDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Detect installed engines on mount
  useEffect(() => {
    api.detectEngines().then(setEngines)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    if (!engineDropdownOpen) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setEngineDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [engineDropdownOpen])

  const atMaxTerminals = terminals.size >= 4

  const handleEngineChange = useCallback(
    (engine: EngineId) => {
      setSelectedEngine(engine)
      setEngineDropdownOpen(false)

      // If already at max, don't create a new terminal
      if (atMaxTerminals) return

      // Create a new terminal with the selected engine
      const id = generateTerminalId()
      const count = terminals.size + 1
      addTerminal({
        id,
        ptyId: null,
        name: `${ENGINE_NAMES[engine]} #${count}`,
        engine,
        isActive: true,
        cwd: activeProject?.path ?? '',
        isLoading: true
      })
    },
    [addTerminal, terminals.size, activeProject, atMaxTerminals]
  )

  const handleNewSession = useCallback(() => {
    const id = generateTerminalId()
    const count = terminals.size + 1
    addTerminal({
      id,
      ptyId: null,
      name: `${ENGINE_NAMES[selectedEngine]} #${count}`,
      engine: selectedEngine,
      isActive: true,
      cwd: activeProject?.path ?? '',
      isLoading: true
    })
  }, [addTerminal, selectedEngine, terminals.size, activeProject])

  const handleContinueSession = useCallback(() => {
    if (!activeTerminal) return
    api.ptyWrite(activeTerminal.id, 'claude --continue\n')
  }, [activeTerminal])

  // ---- Clear session handlers ----

  const handleClearClick = useCallback(() => {
    if (!activeTerminal?.ptyId) return
    setShowClearDialog(true)
  }, [activeTerminal])

  const handleClear = useCallback(() => {
    if (!activeTerminal) return
    api.ptyWrite(activeTerminal.id, '/clear\n')
    setShowClearDialog(false)
  }, [activeTerminal])

  const handleSaveAndClear = useCallback(async () => {
    if (!activeTerminal || !activeProject) return

    const engineMdFile = currentEngine === 'claude' ? 'CLAUDE.md' : 'GEMINI.md'

    const summarizePrompt =
      `Before clearing, summarize this session using the /summarizer skill format and append the summary to \`${engineMdFile}\` in the project root. ` +
      `Add a "## Session - ${new Date().toLocaleDateString()}" heading before the summary. ` +
      `After saving, confirm with "Summary saved."`

    api.ptyWrite(activeTerminal.id, summarizePrompt + '\n')
    setShowClearDialog(false)

    setTimeout(() => {
      api.ptyWrite(activeTerminal.id, '/clear\n')
    }, 30000)
  }, [activeTerminal, activeProject, currentEngine])

  // ---- Compact handler ----

  const handleCompact = useCallback(() => {
    if (!activeTerminal?.ptyId) return
    const command = currentEngine === 'claude' ? '/compact' : '/compress'
    api.ptyWrite(activeTerminal.id, command + '\n')
  }, [activeTerminal, currentEngine])

  const hasPty = !!activeTerminal?.ptyId

  return (
    <>
      <div className="flex h-12 shrink-0 items-center gap-3 border-b border-win-border bg-win-surface px-4">
        {/* AI assistant selector */}
        <div className="relative flex items-center gap-2" ref={dropdownRef}>
          <label className="text-sm font-medium text-win-text-secondary">
            Assistant
          </label>
          <button
            onClick={() => setEngineDropdownOpen((v) => !v)}
            className="flex items-center gap-2 rounded-md border border-win-border bg-win-card px-3 py-2 text-sm text-win-text hover:bg-win-hover transition-colors cursor-pointer"
          >
            <span className={`h-2 w-2 rounded-full ${selectedEngine === 'claude' ? 'bg-orange-400' : 'bg-blue-400'}`} />
            {ENGINE_NAMES[selectedEngine]}
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-win-text-tertiary">
              <path d="M2 4l3 3 3-3" />
            </svg>
          </button>

          {engineDropdownOpen && (
            <div className="absolute left-0 top-full mt-1 z-50 min-w-[200px] rounded-lg border border-win-border bg-win-card shadow-lg overflow-hidden">
              {(Object.entries(ENGINE_NAMES) as [EngineId, string][]).map(([key, name]) => {
                const info = engines.find((e) => e.id === key)
                const isInstalled = info?.isAvailable ?? false
                const isCurrent = key === selectedEngine

                if (isInstalled) {
                  return (
                    <button
                      key={key}
                      onClick={() => handleEngineChange(key)}
                      disabled={atMaxTerminals && !isCurrent}
                      className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-sm transition-colors ${
                        isCurrent
                          ? 'bg-win-accent-subtle text-win-accent font-medium'
                          : 'text-win-text hover:bg-win-hover disabled:opacity-40 disabled:cursor-not-allowed'
                      }`}
                    >
                      <span className={`h-2 w-2 shrink-0 rounded-full ${key === 'claude' ? 'bg-orange-400' : 'bg-blue-400'}`} />
                      <span className="flex-1 text-left">{name}</span>
                      {isCurrent && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                      {atMaxTerminals && !isCurrent && (
                        <span className="text-[10px] text-win-text-tertiary">4/4</span>
                      )}
                    </button>
                  )
                }

                return (
                  <div
                    key={key}
                    className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-win-text-tertiary"
                  >
                    <span className="h-2 w-2 shrink-0 rounded-full bg-neutral-300" />
                    <span className="flex-1 text-left">{name}</span>
                    <a
                      href={ENGINE_INSTALL_URLS[key]}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEngineDropdownOpen(false)
                      }}
                      className="text-xs font-medium text-win-accent hover:underline"
                    >
                      Install
                    </a>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleNewSession}
            disabled={terminals.size >= 4}
            className="flex items-center gap-2 rounded-md bg-win-accent px-5 py-2 text-sm font-medium text-white hover:bg-win-accent-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Chat
          </button>

          {/* Resume Chat - only for Claude */}
          {(activeTerminal?.engine === 'claude' || selectedEngine === 'claude') && (
            <button
              onClick={handleContinueSession}
              disabled={!hasPty}
              className="flex items-center gap-2 rounded-md border border-win-border bg-win-card px-4 py-2 text-sm text-win-text-secondary hover:bg-win-hover hover:text-win-text disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Resume
            </button>
          )}

          {/* Separator */}
          <div className="mx-0.5 h-4 w-px bg-win-border" />

          {/* Reset Chat button */}
          <button
            onClick={handleClearClick}
            disabled={!hasPty}
            title="Reset chat — start a fresh conversation"
            className="flex items-center gap-2 rounded-md border border-win-border bg-win-card px-4 py-2 text-sm text-win-text-secondary hover:bg-win-hover hover:text-win-text disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
            Reset
          </button>

          {/* Summarize button */}
          <button
            onClick={handleCompact}
            disabled={!hasPty}
            title="Summarize the conversation to free up context"
            className="flex items-center gap-2 rounded-md border border-win-border bg-win-card px-4 py-2 text-sm text-win-text-secondary hover:bg-win-hover hover:text-win-text disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="4 14 10 14 10 20" />
              <polyline points="20 10 14 10 14 4" />
              <line x1="14" y1="10" x2="21" y2="3" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
            Summarize
          </button>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Project Memory button */}
        {activeProject && (
          <button
            onClick={() => setShowMemory(true)}
            title="View project memory file"
            className="flex items-center gap-2 rounded-md border border-win-border bg-win-card px-4 py-2 text-sm text-win-text-secondary hover:bg-win-hover hover:text-win-text transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
            Project Memory
          </button>
        )}

        {/* Minified view toggle */}
        <button
          onClick={toggleMinifiedView}
          title={minifiedView ? 'Exit focus mode' : 'Focus mode — hide sidebar and panels'}
          className={`flex items-center justify-center h-8 w-8 rounded-md border transition-colors ${
            minifiedView
              ? 'border-win-accent bg-win-accent-subtle text-win-accent'
              : 'border-win-border bg-win-card text-win-text-secondary hover:bg-win-hover hover:text-win-text'
          }`}
        >
          {minifiedView ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 3 21 3 21 9" />
              <polyline points="9 21 3 21 3 15" />
              <line x1="21" y1="3" x2="14" y2="10" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="4 14 10 14 10 20" />
              <polyline points="20 10 14 10 14 4" />
              <line x1="14" y1="10" x2="21" y2="3" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
          )}
        </button>
      </div>

      {/* Clear session confirmation dialog */}
      {showClearDialog && (
        <ClearSessionDialog
          engineName={ENGINE_NAMES[currentEngine]}
          onClose={() => setShowClearDialog(false)}
          onClear={handleClear}
          onSaveAndClear={handleSaveAndClear}
        />
      )}

      {/* Memory modal */}
      {showMemory && activeProject && (
        <MemoryModal
          projectPath={activeProject.path}
          engine={currentEngine}
          onClose={() => setShowMemory(false)}
        />
      )}
    </>
  )
}

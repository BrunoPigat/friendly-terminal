import { useCallback, useState } from 'react'
import { useTerminalStore, generateTerminalId } from '@/stores/terminal-store'
import { useProjectStore } from '@/stores/project-store'
import { useSettingsStore } from '@/stores/settings-store'
import { ENGINE_NAMES, type EngineId } from '@/lib/constants'
import * as api from '@/lib/api'
import ClearSessionDialog from './ClearSessionDialog'

/**
 * Toolbar above the terminal area.
 * Contains: AI engine selector, session action buttons (New, Continue, Clear, Compact),
 * and current working directory display.
 */
export default function TerminalToolbar() {
  const terminals = useTerminalStore((s) => s.terminals)
  const activeTerminalId = useTerminalStore((s) => s.activeTerminalId)
  const addTerminal = useTerminalStore((s) => s.addTerminal)
  const updateTerminal = useTerminalStore((s) => s.updateTerminal)
  const activeProject = useProjectStore((s) => s.activeProject)
  const defaultEngine = useSettingsStore((s) => s.defaultEngine)

  const activeTerminal = activeTerminalId ? terminals.get(activeTerminalId) : undefined
  const currentEngine = activeTerminal?.engine ?? defaultEngine

  const [selectedEngine, setSelectedEngine] = useState<EngineId>(defaultEngine)
  const [showClearDialog, setShowClearDialog] = useState(false)

  const handleEngineChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const engine = e.target.value as EngineId
      setSelectedEngine(engine)
      if (activeTerminalId) {
        updateTerminal(activeTerminalId, { engine })
      }
    },
    [activeTerminalId, updateTerminal]
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
        <div className="flex items-center gap-2">
          <label htmlFor="engine-select" className="text-sm font-medium text-win-text-secondary">
            Assistant
          </label>
          <select
            id="engine-select"
            value={selectedEngine}
            onChange={handleEngineChange}
            className="rounded-md border border-win-border bg-win-card px-3 py-2 text-sm text-win-text outline-none focus:border-win-accent transition-colors cursor-pointer"
          >
            {(Object.entries(ENGINE_NAMES) as [EngineId, string][]).map(([key, name]) => (
              <option key={key} value={key}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleNewSession}
            className="flex items-center gap-2 rounded-md bg-win-accent px-5 py-2 text-sm font-medium text-white hover:bg-win-accent-dark transition-colors"
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

        {/* Current working directory */}
        {activeTerminal?.cwd && (
          <div className="flex items-center gap-1.5 text-sm text-win-text-tertiary truncate max-w-[300px]">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0"
            >
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            <span className="truncate">{activeTerminal.cwd}</span>
          </div>
        )}
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
    </>
  )
}

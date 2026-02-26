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
    // Both Claude Code and Gemini CLI support /clear
    api.ptyWrite(activeTerminal.id, '/clear\n')
    setShowClearDialog(false)
  }, [activeTerminal])

  const handleSaveAndClear = useCallback(async () => {
    if (!activeTerminal || !activeProject) return

    // Ask the engine to run the summarizer, then we'll clear
    // The summary will be written by asking the engine to summarize and write to ENGINE.md
    const engineMdFile = currentEngine === 'claude' ? 'CLAUDE.md' : 'GEMINI.md'
    const engineMdPath = `${activeProject.path}/${engineMdFile}`.replace(/\\/g, '/')

    // Send the summarizer command — ask the engine to summarize and save to file
    const summarizePrompt =
      `Before clearing, summarize this session using the /summarizer skill format and append the summary to \`${engineMdFile}\` in the project root. ` +
      `Add a "## Session - ${new Date().toLocaleDateString()}" heading before the summary. ` +
      `After saving, confirm with "Summary saved."`

    api.ptyWrite(activeTerminal.id, summarizePrompt + '\n')

    // Close the dialog immediately — the engine will handle the save
    setShowClearDialog(false)

    // Wait a moment for the engine to process, then send /clear
    // We use a generous delay since the engine needs to generate + write the summary
    setTimeout(() => {
      api.ptyWrite(activeTerminal.id, '/clear\n')
    }, 30000)
  }, [activeTerminal, activeProject, currentEngine])

  // ---- Compact handler ----

  const handleCompact = useCallback(() => {
    if (!activeTerminal?.ptyId) return
    // Claude Code uses /compact, Gemini CLI uses /compress
    const command = currentEngine === 'claude' ? '/compact' : '/compress'
    api.ptyWrite(activeTerminal.id, command + '\n')
  }, [activeTerminal, currentEngine])

  const hasPty = !!activeTerminal?.ptyId

  return (
    <>
      <div className="flex h-10 shrink-0 items-center gap-3 border-b border-zinc-800 bg-zinc-950 px-3">
        {/* AI engine selector */}
        <div className="flex items-center gap-1.5">
          <label htmlFor="engine-select" className="text-[10px] uppercase tracking-wider text-zinc-500">
            Engine
          </label>
          <select
            id="engine-select"
            value={selectedEngine}
            onChange={handleEngineChange}
            className="rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-300 outline-none focus:border-zinc-600 transition-colors cursor-pointer"
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
            className="rounded bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
          >
            New Session
          </button>

          {/* Continue Session - only for Claude engine */}
          {(activeTerminal?.engine === 'claude' || selectedEngine === 'claude') && (
            <button
              onClick={handleContinueSession}
              disabled={!hasPty}
              className="rounded bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Continue
            </button>
          )}

          {/* Separator */}
          <div className="mx-0.5 h-4 w-px bg-zinc-800" />

          {/* Clear button */}
          <button
            onClick={handleClearClick}
            disabled={!hasPty}
            title="Clear session"
            className="rounded bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Clear
          </button>

          {/* Compact button */}
          <button
            onClick={handleCompact}
            disabled={!hasPty}
            title={currentEngine === 'claude' ? 'Compact conversation context' : 'Compress conversation context'}
            className="rounded bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Compact
          </button>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Current working directory */}
        {activeTerminal?.cwd && (
          <div className="flex items-center gap-1 text-xs text-zinc-500 truncate max-w-[300px]">
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

import { useCallback, useState } from 'react'
import { useTerminalStore, generateTerminalId } from '@/stores/terminal-store'
import { useSettingsStore } from '@/stores/settings-store'
import { ENGINE_NAMES, type EngineId } from '@/lib/constants'
import * as api from '@/lib/api'

/**
 * Toolbar above the terminal area.
 * Contains: AI engine selector, New Session / Continue Session buttons,
 * and current working directory display.
 */
export default function TerminalToolbar() {
  const terminals = useTerminalStore((s) => s.terminals)
  const activeTerminalId = useTerminalStore((s) => s.activeTerminalId)
  const addTerminal = useTerminalStore((s) => s.addTerminal)
  const updateTerminal = useTerminalStore((s) => s.updateTerminal)
  const setViewMode = useTerminalStore((s) => s.setViewMode)
  const defaultEngine = useSettingsStore((s) => s.defaultEngine)

  const activeTerminal = activeTerminalId ? terminals.get(activeTerminalId) : undefined

  const [selectedEngine, setSelectedEngine] = useState<EngineId>(defaultEngine)

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
      cwd: '',
      viewMode: 'chat'
    })
  }, [addTerminal, selectedEngine, terminals.size])

  const handleContinueSession = useCallback(() => {
    if (!activeTerminal) return
    // Send "claude --continue" to the active PTY
    api.ptyWrite(activeTerminal.id, 'claude --continue\n')
  }, [activeTerminal])

  return (
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
            disabled={!activeTerminal?.ptyId}
            className="rounded bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Continue Session
          </button>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Chat / Terminal view toggle */}
      {activeTerminal && (
        <div className="flex items-center rounded-md border border-zinc-800 overflow-hidden">
          <ViewToggleButton
            active={activeTerminal.viewMode === 'chat'}
            onClick={() => setViewMode(activeTerminal.id, 'chat')}
            label="Chat"
          >
            {/* Chat icon */}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </ViewToggleButton>
          <ViewToggleButton
            active={activeTerminal.viewMode === 'terminal'}
            onClick={() => setViewMode(activeTerminal.id, 'terminal')}
            label="Terminal"
          >
            {/* Terminal icon */}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="4 17 10 11 4 5" />
              <line x1="12" y1="19" x2="20" y2="19" />
            </svg>
          </ViewToggleButton>
        </div>
      )}

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
  )
}

function ViewToggleButton({
  active,
  onClick,
  label,
  children
}: {
  active: boolean
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-2 py-1 text-[10px] uppercase tracking-wider transition-colors ${
        active
          ? 'bg-zinc-700 text-zinc-100'
          : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300'
      }`}
      title={label}
    >
      {children}
      <span>{label}</span>
    </button>
  )
}

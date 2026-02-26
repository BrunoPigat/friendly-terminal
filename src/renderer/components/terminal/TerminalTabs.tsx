import { useCallback } from 'react'
import { useTerminalStore, generateTerminalId } from '@/stores/terminal-store'
import { useSettingsStore } from '@/stores/settings-store'
import { useProjectStore } from '@/stores/project-store'
import { ENGINE_NAMES, type EngineId } from '@/lib/constants'
import * as api from '@/lib/api'

/**
 * Horizontal tab bar for terminal sessions.
 * Each tab shows the terminal name and engine.
 * Includes an add (+) button and close (x) per tab.
 */
export default function TerminalTabs() {
  const terminals = useTerminalStore((s) => s.terminals)
  const activeTerminalId = useTerminalStore((s) => s.activeTerminalId)
  const addTerminal = useTerminalStore((s) => s.addTerminal)
  const removeTerminal = useTerminalStore((s) => s.removeTerminal)
  const setActive = useTerminalStore((s) => s.setActive)
  const defaultEngine = useSettingsStore((s) => s.defaultEngine)
  const activeProject = useProjectStore((s) => s.activeProject)

  const tabList = Array.from(terminals.values())

  const handleNew = useCallback(() => {
    const id = generateTerminalId()
    addTerminal({
      id,
      ptyId: null,
      name: `Terminal ${tabList.length + 1}`,
      engine: defaultEngine,
      isActive: true,
      cwd: activeProject?.path || '',
      isLoading: true
    })
  }, [addTerminal, defaultEngine, tabList.length, activeProject])

  const handleClose = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation()
      api.ptyKill(id)
      removeTerminal(id)
    },
    [removeTerminal, terminals]
  )

  const handleSelect = useCallback(
    (id: string) => {
      setActive(id)
    },
    [setActive]
  )

  return (
    <div className="flex h-9 shrink-0 items-center border-b border-zinc-800 bg-zinc-950">
      {/* Tabs */}
      <div className="flex flex-1 items-center overflow-x-auto">
        {tabList.map((term) => {
          const isActive = term.id === activeTerminalId
          return (
            <button
              key={term.id}
              onClick={() => handleSelect(term.id)}
              className={`group flex h-9 items-center gap-1.5 border-r border-zinc-800 px-3 text-xs transition-colors ${
                isActive
                  ? 'bg-zinc-900 text-zinc-100'
                  : 'bg-zinc-950 text-zinc-500 hover:bg-zinc-900/50 hover:text-zinc-300'
              }`}
            >
              {/* Engine dot */}
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                  term.engine === 'claude' ? 'bg-orange-400' : 'bg-blue-400'
                }`}
              />

              <span className="truncate max-w-[120px]">{term.name}</span>

              <span className="text-[10px] text-zinc-600">
                {ENGINE_NAMES[term.engine]}
              </span>

              {/* Close button */}
              <span
                onClick={(e) => handleClose(e, term.id)}
                className="ml-1 flex h-4 w-4 shrink-0 items-center justify-center rounded text-zinc-600 hover:bg-zinc-700 hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity"
                role="button"
                aria-label={`Close ${term.name}`}
              >
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <line x1="1" y1="1" x2="7" y2="7" />
                  <line x1="7" y1="1" x2="1" y2="7" />
                </svg>
              </span>
            </button>
          )
        })}
      </div>

      {/* Add new terminal */}
      <button
        onClick={handleNew}
        className="flex h-9 w-9 shrink-0 items-center justify-center text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
        aria-label="New terminal"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="7" y1="2" x2="7" y2="12" />
          <line x1="2" y1="7" x2="12" y2="7" />
        </svg>
      </button>
    </div>
  )
}

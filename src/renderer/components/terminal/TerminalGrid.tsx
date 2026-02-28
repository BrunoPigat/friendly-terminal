import { useTerminalStore } from '@/stores/terminal-store'
import { useSettingsStore } from '@/stores/settings-store'
import { ENGINE_NAMES } from '@/lib/constants'
import * as api from '@/lib/api'
import TerminalInstance from './TerminalInstance'

/**
 * Renders all terminals in a 2-column grid layout.
 * 1 terminal = full width, 2 = 2 columns, 3-4 = 2x2 grid.
 * Each cell has a small header with the terminal name, engine badge, and close button.
 */
export default function TerminalGrid() {
  const terminals = useTerminalStore((s) => s.terminals)
  const activeTerminalId = useTerminalStore((s) => s.activeTerminalId)
  const removeTerminal = useTerminalStore((s) => s.removeTerminal)
  const themeBg = useSettingsStore((s) => s.getResolvedTheme().background)

  const termList = Array.from(terminals.values())
  const count = termList.length

  if (count === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-win-text-secondary text-sm">
        No terminal open. Click <span className="font-semibold mx-1">+ New Chat</span> to create one.
      </div>
    )
  }

  const handleClose = (id: string) => {
    api.ptyKill(id)
    removeTerminal(id)
  }

  // Grid layout: 1 = single full, 2+ = 2 columns
  const cols = count === 1 ? 1 : 2
  const rows = Math.ceil(count / cols)

  return (
    <div
      className="flex-1 overflow-hidden"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        gap: '2px',
        background: '#d1d5db' // neutral-300 gap color for visual separation
      }}
    >
      {termList.map((term) => {
        const isActive = term.id === activeTerminalId
        return (
          <div
            key={term.id}
            className="flex flex-col overflow-hidden min-h-0 min-w-0"
            style={{ background: themeBg }}
          >
            {/* Cell header — only show when there are 2+ terminals */}
            {count > 1 && (
              <div className="relative flex h-7 shrink-0 items-center justify-between px-2 bg-[#2D2D2D] border-b border-[#404040]">
                {/* Active indicator — smooth accent line at the top */}
                <div
                  className="absolute top-0 left-0 right-0 h-[2px] transition-all duration-200 ease-out"
                  style={{
                    backgroundColor: isActive ? 'var(--color-win-accent)' : 'transparent',
                    opacity: isActive ? 1 : 0,
                    transform: isActive ? 'scaleX(1)' : 'scaleX(0)'
                  }}
                />
                <div className="flex items-center gap-1.5 min-w-0">
                  {/* Engine-colored dot */}
                  <div
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      term.engine === 'claude' ? 'bg-orange-400' : 'bg-blue-400'
                    }`}
                  />
                  <span
                    className="text-xs truncate transition-colors duration-200"
                    style={{ color: isActive ? '#E0E0E0' : '#999999' }}
                  >
                    {term.name}
                  </span>
                  <span className="text-[10px] text-[#808080] shrink-0">
                    {ENGINE_NAMES[term.engine]}
                  </span>
                </div>
                <button
                  onClick={() => handleClose(term.id)}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[#808080] hover:bg-[#404040] hover:text-[#CCCCCC] transition-colors"
                  title={`Close ${term.name}`}
                >
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <line x1="1" y1="1" x2="7" y2="7" />
                    <line x1="7" y1="1" x2="1" y2="7" />
                  </svg>
                </button>
              </div>
            )}

            {/* Terminal instance */}
            <div className="relative flex-1 overflow-hidden">
              <TerminalInstance
                key={term.id}
                terminalId={term.id}
                cwd={term.cwd}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

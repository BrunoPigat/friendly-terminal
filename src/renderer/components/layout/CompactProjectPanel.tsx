import { useCallback } from 'react'
import { useSplitViewStore, COMPACT_PANEL_WIDTH, type ProjectPanel } from '@/stores/split-view-store'
import TerminalInstance from '@/components/terminal/TerminalInstance'
import { ENGINE_NAMES } from '@/lib/constants'
import * as api from '@/lib/api'

interface CompactProjectPanelProps {
  panel: ProjectPanel
}

/**
 * Minimal panel for non-active projects in split view.
 * Uses the panel's assigned color for its header to visually distinguish projects.
 */
export default function CompactProjectPanel({ panel }: CompactProjectPanelProps) {
  const activatePanel = useSplitViewStore((s) => s.activatePanel)
  const closePanel = useSplitViewStore((s) => s.closePanel)

  const activeTerminal = panel.activeTerminalId
    ? panel.terminals.get(panel.activeTerminalId)
    : undefined

  const c = panel.color

  const handleActivate = useCallback(() => {
    activatePanel(panel.panelId)
  }, [activatePanel, panel.panelId])

  const handleClose = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      closePanel(panel.panelId)
    },
    [closePanel, panel.panelId]
  )

  const handlePopOut = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      const engine = activeTerminal?.engine || 'claude'
      api.windowPopOutProject(panel.project.name, engine).then(() => {
        closePanel(panel.panelId)
      })
    },
    [panel.project.name, panel.panelId, activeTerminal?.engine, closePanel]
  )

  return (
    <div
      className="flex shrink-0 flex-col overflow-hidden"
      style={{ width: COMPACT_PANEL_WIDTH }}
    >
      {/* Colored top accent strip */}
      <div className={`h-0.5 shrink-0 ${c.accent}`} />

      {/* Header bar */}
      <div
        onClick={handleActivate}
        className={`flex h-9 shrink-0 items-center justify-between gap-2 border-b px-3 cursor-pointer transition-colors ${c.bg} ${c.border} ${c.bgHover}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            className={`shrink-0 ${c.icon}`}
          >
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          <span className="truncate text-sm font-semibold text-win-text">
            {panel.project.name}
          </span>
          {activeTerminal && (
            <span className={`text-[10px] font-medium shrink-0 px-1.5 py-0.5 rounded-full ${c.badge}`}>
              {ENGINE_NAMES[activeTerminal.engine]}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <span className={`text-[10px] ${c.hint}`}>
            Click to expand
          </span>
          <button
            onClick={handlePopOut}
            className="flex h-5 w-5 items-center justify-center rounded text-win-text-tertiary hover:bg-black/10 hover:text-win-text transition-colors"
            aria-label={`Pop out ${panel.project.name}`}
            title="Open in new window"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </button>
          <button
            onClick={handleClose}
            className="flex h-5 w-5 items-center justify-center rounded text-win-text-tertiary hover:bg-black/10 hover:text-win-text transition-colors"
            aria-label={`Close ${panel.project.name}`}
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="1" y1="1" x2="7" y2="7" />
              <line x1="7" y1="1" x2="1" y2="7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Terminal area */}
      <div className="relative flex-1 overflow-hidden">
        {activeTerminal ? (
          <TerminalInstance
            key={activeTerminal.id}
            terminalId={activeTerminal.id}
            cwd={activeTerminal.cwd}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-win-text-tertiary text-xs bg-neutral-50">
            No terminal
          </div>
        )}
      </div>
    </div>
  )
}

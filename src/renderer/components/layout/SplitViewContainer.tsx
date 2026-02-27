import { useEffect, useRef, useCallback, useState } from 'react'
import { useSplitViewStore, COMPACT_PANEL_WIDTH, MIN_ACTIVE_FULL_WIDTH } from '@/stores/split-view-store'
import { useSettingsStore } from '@/stores/settings-store'
import { useTerminalStore } from '@/stores/terminal-store'
import { useProjectStore } from '@/stores/project-store'
import { SIDEBAR_MIN_WIDTH, SIDEBAR_MAX_WIDTH, ENGINE_NAMES } from '@/lib/constants'
import * as api from '@/lib/api'
import Sidebar from '@/components/layout/Sidebar'
import FileBrowser from '@/components/sidebar/FileBrowser'
import TerminalToolbar from '@/components/terminal/TerminalToolbar'
import TerminalGrid from '@/components/terminal/TerminalGrid'
import RightPanel from '@/components/panel/RightPanel'
import CompactProjectPanel from './CompactProjectPanel'
import PanelDivider from './PanelDivider'

const RIGHT_PANEL_MIN_WIDTH = 200
const RIGHT_PANEL_MAX_WIDTH = 500
const DIVIDER_WIDTH = 6 // matches w-1.5

/**
 * Orchestrates the horizontal split-view layout.
 * Compact panels on the left (fixed mobile width), active panel (full UI) on the right.
 * When the active panel can't fit full UI, everything auto-minifies.
 */
export default function SplitViewContainer() {
  const panels = useSplitViewStore((s) => s.panels)
  const recalcMaxPanels = useSplitViewStore((s) => s.recalcMaxPanels)
  const closePanel = useSplitViewStore((s) => s.closePanel)

  const setSidebarWidth = useSettingsStore((s) => s.setSidebarWidth)
  const sidebarCollapsed = useSettingsStore((s) => s.sidebarCollapsed)
  const minifiedView = useSettingsStore((s) => s.minifiedView)
  const toggleMinifiedView = useSettingsStore((s) => s.toggleMinifiedView)
  const setRightPanelWidth = useSettingsStore((s) => s.setRightPanelWidth)

  const activeTerminalId = useTerminalStore((s) => s.activeTerminalId)
  const terminals = useTerminalStore((s) => s.terminals)
  const activeTerminal = activeTerminalId ? terminals.get(activeTerminalId) : undefined
  const activeProject = useProjectStore((s) => s.activeProject)

  // Compact panels = all except the last (active)
  const compactPanels = panels.slice(0, -1)
  const compactCount = compactPanels.length
  const hasCompactPanels = compactCount > 0

  // Track window width for responsive layout
  const [, setWindowWidth] = useState(window.innerWidth)
  const containerRef = useRef<HTMLDivElement>(null)

  // Calculate the width consumed by compact panels
  const compactTotalWidth = compactCount * COMPACT_PANEL_WIDTH + compactCount * DIVIDER_WIDTH

  // Auto-minify the active panel if remaining space is too narrow for full UI
  const activePanelAutoMinified = hasCompactPanels && (window.innerWidth - compactTotalWidth) < MIN_ACTIVE_FULL_WIDTH
  const effectiveMinified = minifiedView || activePanelAutoMinified

  // Active panel and its assigned color
  const activePanel = panels.length > 0 ? panels[panels.length - 1] : undefined
  const ac = activePanel?.color

  const handlePopOutActive = useCallback(() => {
    if (!activePanel || !activeProject) return
    const engine = activeTerminal?.engine || 'claude'
    api.windowPopOutProject(activeProject.name, engine).then(() => {
      closePanel(activePanel.panelId)
    })
  }, [activePanel, activeProject, activeTerminal?.engine, closePanel])

  // Listen for window resize
  useEffect(() => {
    const handleResize = () => {
      recalcMaxPanels(window.innerWidth)
      setWindowWidth(window.innerWidth)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [recalcMaxPanels])

  // Sidebar resize
  const resizing = useRef(false)
  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      if (sidebarCollapsed) return
      e.preventDefault()
      resizing.current = true

      const onMouseMove = (moveEvent: MouseEvent) => {
        if (!resizing.current) return
        const newWidth = Math.min(
          SIDEBAR_MAX_WIDTH,
          Math.max(SIDEBAR_MIN_WIDTH, moveEvent.clientX - compactTotalWidth)
        )
        setSidebarWidth(newWidth)
      }
      const onMouseUp = () => {
        resizing.current = false
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    },
    [sidebarCollapsed, setSidebarWidth, compactTotalWidth]
  )

  // Right panel resize
  const rightResizing = useRef(false)
  const handleRightResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      rightResizing.current = true
      const onMouseMove = (moveEvent: MouseEvent) => {
        if (!rightResizing.current) return
        const newWidth = Math.min(
          RIGHT_PANEL_MAX_WIDTH,
          Math.max(RIGHT_PANEL_MIN_WIDTH, window.innerWidth - moveEvent.clientX)
        )
        setRightPanelWidth(newWidth)
      }
      const onMouseUp = () => {
        rightResizing.current = false
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    },
    [setRightPanelWidth]
  )

  return (
    <div ref={containerRef} className="flex flex-1 overflow-hidden">
      {/* Compact panels (non-active) — fixed mobile width */}
      {compactPanels.map((panel) => (
        <div key={panel.panelId} className="contents">
          <CompactProjectPanel panel={panel} />
          <PanelDivider />
        </div>
      ))}

      {/* Active panel — takes all remaining width */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Active panel project header — only shown when there are compact panels,
            so it's clear this is a different project */}
        {hasCompactPanels && ac && (
          <>
            <div className={`h-0.5 shrink-0 ${ac.accent}`} />

            <div className={`flex h-9 shrink-0 items-center justify-between border-b px-3 ${ac.bg} ${ac.border}`}>
              <div className="flex items-center gap-2 min-w-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                  className={`shrink-0 ${ac.icon}`}
                >
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
                <span className="text-sm font-semibold text-win-text truncate">
                  {activeProject?.name}
                </span>
                {activeTerminal && (
                  <span className={`text-[10px] font-medium shrink-0 px-1.5 py-0.5 rounded-full ${ac.badge}`}>
                    {ENGINE_NAMES[activeTerminal.engine]}
                  </span>
                )}
              </div>
              <button
                onClick={handlePopOutActive}
                className="flex h-5 w-5 items-center justify-center rounded text-win-text-tertiary hover:bg-black/10 hover:text-win-text transition-colors shrink-0"
                aria-label={`Pop out ${activeProject?.name}`}
                title="Open in new window"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </button>
            </div>
          </>
        )}

        {/* Rest of the active panel UI */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          {!effectiveMinified && (
            <Sidebar>
              <FileBrowser />
            </Sidebar>
          )}

          {/* Resize handle */}
          {!effectiveMinified && !sidebarCollapsed && (
            <div
              className="w-1 shrink-0 cursor-col-resize bg-transparent hover:bg-win-accent/20 active:bg-win-accent/40 transition-colors"
              onMouseDown={handleResizeStart}
            />
          )}

          {/* Main content area */}
          <main className="flex flex-1 flex-col overflow-hidden">
            {effectiveMinified ? (
              <div className="flex h-10 shrink-0 items-center justify-end border-b border-win-border bg-win-surface px-2">
                {minifiedView && (
                  <button
                    onClick={toggleMinifiedView}
                    title="Exit focus mode"
                    className="flex items-center justify-center h-8 w-8 rounded-md border border-win-accent bg-win-accent-subtle text-win-accent"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 3 21 3 21 9" />
                      <polyline points="9 21 3 21 3 15" />
                      <line x1="21" y1="3" x2="14" y2="10" />
                      <line x1="3" y1="21" x2="10" y2="14" />
                    </svg>
                  </button>
                )}
              </div>
            ) : (
              <TerminalToolbar />
            )}
            <TerminalGrid />
          </main>

          {/* Right panel resize handle */}
          {!effectiveMinified && (
            <div
              className="w-1 shrink-0 cursor-col-resize bg-transparent hover:bg-win-accent/20 active:bg-win-accent/40 transition-colors"
              onMouseDown={handleRightResizeStart}
            />
          )}

          {/* Right panel */}
          {!effectiveMinified && <RightPanel />}
        </div>
      </div>
    </div>
  )
}

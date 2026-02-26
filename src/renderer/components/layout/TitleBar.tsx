import { useCallback } from 'react'
import { APP_NAME } from '@/lib/constants'
import * as api from '@/lib/api'
import { useProjectStore } from '@/stores/project-store'
import { useTerminalStore } from '@/stores/terminal-store'

export default function TitleBar() {
  const activeProject = useProjectStore((s) => s.activeProject)
  const clearProject = useProjectStore((s) => s.clearProject)
  const clearTerminals = useTerminalStore((s) => s.clearAll)

  const handleBack = useCallback(() => {
    clearTerminals()
    clearProject()
  }, [clearProject, clearTerminals])

  const handleMinimize = useCallback(() => api.windowMinimize(), [])
  const handleMaximize = useCallback(() => api.windowMaximize(), [])
  const handleClose = useCallback(() => api.windowClose(), [])

  return (
    <header
      className="flex h-10 shrink-0 items-center justify-between border-b border-win-border bg-win-surface px-3 select-none"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Left: back + app name + project */}
      <div className="flex items-center gap-2 text-sm" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        {activeProject && (
          <button
            onClick={handleBack}
            className="flex items-center justify-center h-6 w-6 rounded-md text-win-text-secondary hover:text-win-text hover:bg-win-hover transition-colors"
            title="Back to projects"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}
        {/* App icon */}
        <div className="flex h-5 w-5 items-center justify-center rounded-md bg-win-accent text-white" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <span className="font-semibold text-win-text" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>{APP_NAME}</span>
        {activeProject && (
          <>
            <span className="text-win-text-tertiary">/</span>
            <span className="text-win-text-secondary font-medium">{activeProject.name}</span>
            <span className="text-win-text-tertiary truncate max-w-[300px] text-xs" title={activeProject.path}>
              {activeProject.path}
            </span>
          </>
        )}
      </div>

      {/* Right: window controls - Windows 11 style */}
      <div
        className="flex items-center"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          onClick={handleMinimize}
          className="flex h-8 w-11 items-center justify-center text-win-text-secondary hover:bg-black/5 transition-colors"
          aria-label="Minimize"
        >
          <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor">
            <rect width="10" height="1" />
          </svg>
        </button>
        <button
          onClick={handleMaximize}
          className="flex h-8 w-11 items-center justify-center text-win-text-secondary hover:bg-black/5 transition-colors"
          aria-label="Maximize"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
            <rect x="0.5" y="0.5" width="9" height="9" />
          </svg>
        </button>
        <button
          onClick={handleClose}
          className="flex h-8 w-11 items-center justify-center text-win-text-secondary hover:bg-[#C42B1C] hover:text-white transition-colors"
          aria-label="Close"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2">
            <line x1="0" y1="0" x2="10" y2="10" />
            <line x1="10" y1="0" x2="0" y2="10" />
          </svg>
        </button>
      </div>
    </header>
  )
}

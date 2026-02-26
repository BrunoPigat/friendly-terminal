import { useCallback, useState, useEffect, useRef } from 'react'
import { APP_NAME } from '@/lib/constants'
import * as api from '@/lib/api'
import { useProjectStore } from '@/stores/project-store'
import { useTerminalStore } from '@/stores/terminal-store'
import type { Project } from '@/lib/api'
import logoImg from '../../../../resources/logo.png'

export default function TitleBar() {
  const activeProject = useProjectStore((s) => s.activeProject)
  const clearProject = useProjectStore((s) => s.clearProject)
  const clearTerminals = useTerminalStore((s) => s.clearAll)

  const [showProjectDropdown, setShowProjectDropdown] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleBack = useCallback(() => {
    clearTerminals()
    clearProject()
  }, [clearProject, clearTerminals])

  const handleMinimize = useCallback(() => api.windowMinimize(), [])
  const handleMaximize = useCallback(() => api.windowMaximize(), [])
  const handleClose = useCallback(() => api.windowClose(), [])

  // Fetch projects when dropdown opens
  useEffect(() => {
    if (showProjectDropdown) {
      api.listProjects().then(setProjects).catch(() => setProjects([]))
    }
  }, [showProjectDropdown])

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!showProjectDropdown) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowProjectDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showProjectDropdown])

  const handleOpenProject = useCallback((projectName: string) => {
    setShowProjectDropdown(false)
    api.openProjectWindow(projectName)
  }, [])

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
        <img src={logoImg} alt="" className="h-6 w-6 rounded-md object-contain" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties} />
        <span className="font-semibold text-win-text" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>{APP_NAME}</span>
        {activeProject && (
          <>
            <span className="text-win-text-tertiary">/</span>
            <span className="text-win-text-secondary font-medium">{activeProject.name}</span>
          </>
        )}

        {/* Project switcher dropdown */}
        {activeProject && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowProjectDropdown((v) => !v)}
              className="flex items-center justify-center h-6 w-6 rounded-md text-win-text-tertiary hover:text-win-text hover:bg-win-hover transition-colors"
              title="Switch project in new window"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {showProjectDropdown && (
              <div className="absolute left-0 top-full mt-1 z-50 w-56 rounded-lg border border-win-border bg-win-card shadow-lg py-1">
                <div className="px-3 py-2 text-[11px] font-medium text-win-text-tertiary uppercase tracking-wider">
                  Open in new window
                </div>
                {projects.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-win-text-tertiary">No projects</div>
                ) : (
                  projects
                    .filter((p) => p.name !== activeProject.name)
                    .map((project) => (
                      <button
                        key={project.name}
                        onClick={() => handleOpenProject(project.name)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-win-text-secondary hover:bg-win-hover hover:text-win-text transition-colors text-left"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-win-text-tertiary">
                          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                        </svg>
                        <span className="truncate">{project.name}</span>
                      </button>
                    ))
                )}
                {projects.filter((p) => p.name !== activeProject.name).length === 0 && projects.length > 0 && (
                  <div className="px-3 py-2 text-sm text-win-text-tertiary">No other projects</div>
                )}
              </div>
            )}
          </div>
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

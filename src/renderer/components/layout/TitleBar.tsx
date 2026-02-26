import { useCallback, useState, useEffect, useRef } from 'react'
import { APP_NAME } from '@/lib/constants'
import * as api from '@/lib/api'
import { useProjectStore } from '@/stores/project-store'
import { useSplitViewStore } from '@/stores/split-view-store'
import { useSettingsStore } from '@/stores/settings-store'
import type { Project } from '@/lib/api'
import logoImg from '../../../../resources/logo.png'

export default function TitleBar() {
  const panels = useSplitViewStore((s) => s.panels)
  const activatePanel = useSplitViewStore((s) => s.activatePanel)
  const closePanel = useSplitViewStore((s) => s.closePanel)
  const activeProject = useProjectStore((s) => s.activeProject)
  const clearProject = useProjectStore((s) => s.clearProject)
  const selectProject = useProjectStore((s) => s.selectProject)
  const defaultEngine = useSettingsStore((s) => s.defaultEngine)

  const [showProjectDropdown, setShowProjectDropdown] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleBack = useCallback(() => {
    if (panels.length > 1) {
      // Close active panel, next one becomes active
      const activePanel = panels[panels.length - 1]
      closePanel(activePanel.panelId)
    } else {
      // Last panel — go to welcome screen
      clearProject()
    }
  }, [panels, closePanel, clearProject])

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

  const handleOpenProject = useCallback(
    (project: Project) => {
      setShowProjectDropdown(false)
      selectProject(project, defaultEngine)
    },
    [selectProject, defaultEngine]
  )

  // Get names of projects already open in panels
  const openProjectNames = new Set(panels.map((p) => p.project.name))

  return (
    <header
      className="flex h-10 shrink-0 items-center justify-between border-b border-win-border bg-win-surface px-3 select-none"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Left: back + app name + breadcrumb */}
      <div className="flex items-center gap-2 text-sm" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        {panels.length > 0 && (
          <button
            onClick={handleBack}
            className="flex items-center justify-center h-6 w-6 rounded-md text-win-text-secondary hover:text-win-text hover:bg-win-hover transition-colors"
            title={panels.length > 1 ? 'Close active project' : 'Back to projects'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}
        {/* App icon */}
        <img src={logoImg} alt="" className="h-6 w-6 rounded-md object-contain" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties} />
        <span className="font-semibold text-win-text" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>{APP_NAME}</span>

        {/* Breadcrumb: show all open projects */}
        {panels.map((panel, idx) => {
          const isActive = idx === panels.length - 1
          return (
            <span key={panel.panelId} className="flex items-center gap-2">
              <span className="text-win-text-tertiary">/</span>
              <button
                onClick={() => {
                  if (!isActive) activatePanel(panel.panelId)
                }}
                className={`transition-colors ${
                  isActive
                    ? 'font-semibold text-win-text cursor-default'
                    : 'text-win-text-secondary hover:text-win-text cursor-pointer'
                }`}
              >
                {panel.project.name}
              </button>
            </span>
          )
        })}

        {/* Project switcher dropdown */}
        {panels.length > 0 && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowProjectDropdown((v) => !v)}
              className="flex items-center justify-center h-6 w-6 rounded-md text-win-text-tertiary hover:text-win-text hover:bg-win-hover transition-colors"
              title="Open project"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {showProjectDropdown && (
              <div className="absolute left-0 top-full mt-1 z-50 w-56 rounded-lg border border-win-border bg-win-card shadow-lg py-1">
                <div className="px-3 py-2 text-[11px] font-medium text-win-text-tertiary uppercase tracking-wider">
                  Open project
                </div>
                {projects.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-win-text-tertiary">No projects</div>
                ) : (
                  projects
                    .filter((p) => !openProjectNames.has(p.name))
                    .map((project) => (
                      <button
                        key={project.name}
                        onClick={() => handleOpenProject(project)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-win-text-secondary hover:bg-win-hover hover:text-win-text transition-colors text-left"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-win-text-tertiary">
                          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                        </svg>
                        <span className="truncate">{project.name}</span>
                      </button>
                    ))
                )}
                {projects.filter((p) => !openProjectNames.has(p.name)).length === 0 && projects.length > 0 && (
                  <div className="px-3 py-2 text-sm text-win-text-tertiary">All projects are open</div>
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

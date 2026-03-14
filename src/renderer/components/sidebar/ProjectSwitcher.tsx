import { useState, useCallback, useRef, useEffect } from 'react'
import { useProjectStore } from '@/stores/project-store'
import { useSettingsStore } from '@/stores/settings-store'
import ProjectDialog from '@/components/project/ProjectDialog'
import DeleteProjectDialog from '@/components/project/DeleteProjectDialog'
import { getProjectsDir, shellOpenPath } from '@/lib/api'

/**
 * Dropdown for switching between projects.
 * Windows 11-style dropdown with clean borders and hover states.
 */
export default function ProjectSwitcher() {
  const projects = useProjectStore((s) => s.projects)
  const activeProject = useProjectStore((s) => s.activeProject)
  const selectProject = useProjectStore((s) => s.selectProject)
  const defaultEngine = useSettingsStore((s) => s.defaultEngine)

  const [open, setOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<typeof projects[number] | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleSelect = useCallback(
    (project: typeof projects[number]) => {
      selectProject(project, defaultEngine)
      setOpen(false)
    },
    [selectProject, defaultEngine]
  )

  const handleCreateNew = useCallback(() => {
    setOpen(false)
    setDialogOpen(true)
  }, [])

  const handleDeleteClick = useCallback((e: React.MouseEvent, project: typeof projects[number]) => {
    e.stopPropagation()
    setOpen(false)
    setDeleteTarget(project)
  }, [])

  return (
    <div className="relative px-3 pb-3 border-b border-win-border mb-2" ref={dropdownRef}>
      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-md border border-win-border bg-win-card px-3 py-2 text-sm text-win-text hover:border-win-border-strong transition-colors"
      >
        <span className="truncate">
          {activeProject ? activeProject.name : 'Select project...'}
        </span>
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className={`transition-transform text-win-text-tertiary ${open ? 'rotate-180' : ''}`}
          >
            <polyline points="2,3 5,7 8,3" />
          </svg>
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-3 right-3 top-full z-20 mt-1 rounded-lg border border-win-border bg-win-card  overflow-hidden">
          {/* Project list */}
          <div className="max-h-48 overflow-y-auto">
            {projects.map((project) => (
              <div
                key={project.name}
                className={`flex items-center transition-colors group/item ${
                  activeProject?.name === project.name
                    ? 'bg-win-accent-subtle text-win-accent'
                    : 'text-win-text-secondary hover:bg-win-hover hover:text-win-text'
                }`}
              >
                <button
                  onClick={() => handleSelect(project)}
                  className="flex-1 px-3 py-2 text-sm text-left truncate"
                >
                  {project.name}
                </button>
                <button
                  onClick={(e) => handleDeleteClick(e, project)}
                  className="shrink-0 mr-1.5 flex h-5 w-5 items-center justify-center rounded text-win-text-tertiary opacity-0 group-hover/item:opacity-100 hover:text-red-600 transition-all"
                  title={`Delete ${project.name}`}
                >
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            ))}

            {projects.length === 0 && (
              <div className="px-2.5 py-3 text-xs text-win-text-tertiary text-center">
                No projects yet
              </div>
            )}
          </div>

          {/* Create new + Open folder */}
          <div className="border-t border-win-border flex">
            <button
              onClick={handleCreateNew}
              className="flex flex-1 items-center gap-1.5 px-3 py-2 text-sm text-win-text-secondary hover:bg-win-hover hover:text-win-accent transition-colors"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <line x1="6" y1="2" x2="6" y2="10" />
                <line x1="2" y1="6" x2="10" y2="6" />
              </svg>
              New Project
            </button>
            <button
              onClick={async () => { const dir = await getProjectsDir(); shellOpenPath(dir) }}
              title="Open projects folder"
              className="flex items-center justify-center px-2.5 py-2 text-win-text-tertiary hover:bg-win-hover hover:text-win-accent transition-colors border-l border-win-border"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Create project dialog */}
      {dialogOpen && <ProjectDialog onClose={() => setDialogOpen(false)} />}

      {/* Delete confirmation dialog */}
      {deleteTarget && (
        <DeleteProjectDialog
          projectName={deleteTarget.name}
          imported={deleteTarget.imported}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}

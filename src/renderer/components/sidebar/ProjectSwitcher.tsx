import { useState, useCallback, useRef, useEffect } from 'react'
import { useProjectStore } from '@/stores/project-store'
import { ENGINE_NAMES, type EngineId } from '@/lib/constants'
import ProjectDialog from '@/components/project/ProjectDialog'

/**
 * Dropdown for switching between projects.
 * Shows active project name + engine badge, with options to
 * create new, switch, or manage projects.
 */
export default function ProjectSwitcher() {
  const projects = useProjectStore((s) => s.projects)
  const activeProject = useProjectStore((s) => s.activeProject)
  const selectProject = useProjectStore((s) => s.selectProject)

  const [open, setOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
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
      selectProject(project)
      setOpen(false)
    },
    [selectProject]
  )

  const handleCreateNew = useCallback(() => {
    setOpen(false)
    setDialogOpen(true)
  }, [])

  return (
    <div className="relative px-3 pb-3 border-b border-zinc-800 mb-2" ref={dropdownRef}>
      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-300 hover:border-zinc-700 transition-colors"
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
            className={`transition-transform text-zinc-500 ${open ? 'rotate-180' : ''}`}
          >
            <polyline points="2,3 5,7 8,3" />
          </svg>
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-3 right-3 top-full z-20 mt-1 rounded border border-zinc-800 bg-zinc-900 shadow-xl overflow-hidden">
          {/* Project list */}
          <div className="max-h-48 overflow-y-auto">
            {projects.map((project) => (
              <button
                key={project.name}
                onClick={() => handleSelect(project)}
                className={`flex w-full items-center justify-between px-2.5 py-2 text-xs transition-colors ${
                  activeProject?.name === project.name
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                }`}
              >
                <span className="truncate">{project.name}</span>
              </button>
            ))}

            {projects.length === 0 && (
              <div className="px-2.5 py-3 text-xs text-zinc-500 text-center">
                No projects yet
              </div>
            )}
          </div>

          {/* Create new */}
          <div className="border-t border-zinc-800">
            <button
              onClick={handleCreateNew}
              className="flex w-full items-center gap-1.5 px-2.5 py-2 text-xs text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 transition-colors"
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
          </div>
        </div>
      )}

      {/* Create project dialog */}
      {dialogOpen && <ProjectDialog onClose={() => setDialogOpen(false)} />}
    </div>
  )
}

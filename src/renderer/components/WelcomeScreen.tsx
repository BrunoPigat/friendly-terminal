import { useState, useEffect } from 'react'
import { useProjectStore } from '@/stores/project-store'
import { APP_NAME } from '@/lib/constants'
import DeleteProjectDialog from '@/components/project/DeleteProjectDialog'

export default function WelcomeScreen() {
  const projects = useProjectStore((s) => s.projects)
  const loading = useProjectStore((s) => s.loading)
  const loadProjects = useProjectStore((s) => s.loadProjects)
  const selectProject = useProjectStore((s) => s.selectProject)
  const createProject = useProjectStore((s) => s.createProject)

  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  const handleCreate = async () => {
    const trimmed = newName.trim()
    if (!trimmed) return
    console.log('[WelcomeScreen] Creating project:', trimmed)
    setCreating(true)
    try {
      await createProject(trimmed)
      console.log('[WelcomeScreen] Project created successfully:', trimmed)
    } catch (err) {
      console.error('[WelcomeScreen] Failed to create project:', err)
    }
    setCreating(false)
    setNewName('')
    setShowCreate(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCreate()
    if (e.key === 'Escape') {
      setShowCreate(false)
      setNewName('')
    }
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-zinc-950 text-zinc-100">
      <div className="w-full max-w-md px-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-zinc-100">{APP_NAME}</h1>
          <p className="mt-2 text-sm text-zinc-500">Select a project or create a new one</p>
        </div>

        {/* Project list */}
        <div className="mb-4">
          {loading ? (
            <div className="py-8 text-center text-sm text-zinc-500">Loading projects...</div>
          ) : projects.length === 0 ? (
            <div className="py-8 text-center text-sm text-zinc-500">
              No projects yet. Create one to get started.
            </div>
          ) : (
            <div className="space-y-1">
              {projects.map((project) => (
                <div
                  key={project.name}
                  className="flex items-center rounded-lg transition-colors hover:bg-zinc-800/80 group"
                >
                  <button
                    onClick={() => {
                      console.log('[WelcomeScreen] Project selected:', project)
                      selectProject(project)
                    }}
                    className="flex flex-1 items-center gap-3 px-4 py-3 text-left min-w-0"
                  >
                    {/* Folder icon */}
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="shrink-0 text-zinc-500 group-hover:text-zinc-300"
                    >
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    </svg>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-zinc-200 group-hover:text-zinc-50 truncate">
                        {project.name}
                      </div>
                      <div className="text-[11px] text-zinc-600 truncate">{project.path}</div>
                    </div>
                  </button>

                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteTarget(project.name)
                    }}
                    className="shrink-0 mr-2 flex h-7 w-7 items-center justify-center rounded text-zinc-600 opacity-0 group-hover:opacity-100 hover:bg-zinc-700 hover:text-red-400 transition-all"
                    title={`Delete ${project.name}`}
                  >
                    <svg
                      width="14"
                      height="14"
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

                  {/* Arrow */}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="shrink-0 mr-4 text-zinc-700 group-hover:text-zinc-400"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create new project */}
        {showCreate ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Project name"
              autoFocus
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-zinc-500"
            />
            <button
              onClick={handleCreate}
              disabled={!newName.trim() || creating}
              className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white disabled:opacity-40 transition-colors"
            >
              {creating ? '...' : 'Create'}
            </button>
            <button
              onClick={() => { setShowCreate(false); setNewName('') }}
              className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowCreate(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-700 px-4 py-3 text-sm text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="8" y1="3" x2="8" y2="13" />
              <line x1="3" y1="8" x2="13" y2="8" />
            </svg>
            New Project
          </button>
        )}
      </div>

      {/* Delete confirmation dialog */}
      {deleteTarget && (
        <DeleteProjectDialog
          projectName={deleteTarget}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}

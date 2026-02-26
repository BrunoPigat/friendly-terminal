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
    setCreating(true)
    try {
      await createProject(trimmed)
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
    <div className="flex h-full w-full flex-col items-center justify-center bg-win-bg text-win-text">
      <div className="w-full max-w-2xl px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-win-accent">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <circle cx="9" cy="10" r="1" fill="currentColor" stroke="none" />
              <circle cx="12" cy="10" r="1" fill="currentColor" stroke="none" />
              <circle cx="15" cy="10" r="1" fill="currentColor" stroke="none" />
            </svg>
          </div>
          <h1 className="text-3xl font-semibold text-win-text">{APP_NAME}</h1>
          <p className="mt-3 text-base text-win-text-secondary">
            {projects.length > 0 ? 'Pick a project to start chatting with your AI assistant' : 'Create your first project to get started'}
          </p>
        </div>

        {/* Project list */}
        <div className="mb-6">
          {loading ? (
            <div className="flex flex-col items-center py-14 gap-4">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-win-border border-t-win-accent" />
              <span className="text-base text-win-text-secondary">Loading your projects...</span>
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center py-14 gap-3">
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-win-text-tertiary">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                <line x1="12" y1="11" x2="12" y2="17" />
                <line x1="9" y1="14" x2="15" y2="14" />
              </svg>
              <p className="text-lg text-win-text-secondary">No projects yet</p>
              <p className="text-sm text-win-text-tertiary">Create one below to start working with AI</p>
            </div>
          ) : (
            <div className="space-y-2">
              {projects.map((project) => (
                <div
                  key={project.name}
                  className="group flex items-center rounded-xl border border-win-border bg-win-card transition-all hover:bg-win-hover"
                >
                  <button
                    onClick={() => selectProject(project)}
                    className="flex flex-1 items-center gap-4 px-5 py-5 text-left min-w-0"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-win-accent-subtle text-win-accent group-hover:bg-win-accent group-hover:text-white transition-colors">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-base font-medium text-win-text truncate">
                        {project.name}
                      </div>
                      <div className="text-sm text-win-text-tertiary truncate mt-0.5">{project.path}</div>
                    </div>
                  </button>

                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteTarget(project.name)
                    }}
                    className="shrink-0 mr-3 flex h-9 w-9 items-center justify-center rounded-lg text-win-text-tertiary opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 transition-all"
                    title={`Delete ${project.name}`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>

                  {/* Arrow */}
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="shrink-0 mr-5 text-win-text-tertiary group-hover:text-win-accent transition-colors"
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
          <div className="flex gap-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter project name..."
              autoFocus
              className="flex-1 rounded-xl border border-win-border bg-win-card px-5 py-3.5 text-base text-win-text placeholder-win-text-tertiary outline-none focus:border-win-accent focus:ring-2 focus:ring-win-accent/20 transition-all"
            />
            <button
              onClick={handleCreate}
              disabled={!newName.trim() || creating}
              className="rounded-xl bg-win-accent px-6 py-3.5 text-base font-medium text-white hover:bg-win-accent-dark disabled:opacity-40 transition-colors"
            >
              {creating ? '...' : 'Create'}
            </button>
            <button
              onClick={() => { setShowCreate(false); setNewName('') }}
              className="rounded-xl border border-win-border px-5 py-3.5 text-base text-win-text-secondary hover:bg-win-hover transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowCreate(true)}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl border-2 border-dashed border-win-border-strong px-5 py-5 text-base font-medium text-win-text-secondary hover:border-win-accent hover:text-win-accent hover:bg-win-accent-subtle transition-all"
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
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

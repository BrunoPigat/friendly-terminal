import { useState, useCallback, useEffect, useRef } from 'react'
import { useProjectStore } from '@/stores/project-store'

interface DeleteProjectDialogProps {
  projectName: string
  onClose: () => void
}

export default function DeleteProjectDialog({ projectName, onClose }: DeleteProjectDialogProps) {
  const deleteProject = useProjectStore((s) => s.deleteProject)

  const [confirmation, setConfirmation] = useState('')
  const [deleting, setDeleting] = useState(false)

  const overlayRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isMatch = confirmation === projectName

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current) onClose()
    },
    [onClose]
  )

  const handleDelete = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!isMatch) return
      setDeleting(true)
      try {
        await deleteProject(projectName)
        onClose()
      } catch (err) {
        console.error('Failed to delete project:', err)
      } finally {
        setDeleting(false)
      }
    },
    [isMatch, projectName, deleteProject, onClose]
  )

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
        {/* Warning icon + header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/10">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-red-400"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-zinc-100">
              Delete Project
            </h2>
            <p className="mt-1 text-xs text-zinc-400">
              This action is permanent and cannot be undone.
            </p>
          </div>
        </div>

        {/* Warning message */}
        <div className="mb-5 rounded-md border border-red-500/20 bg-red-500/5 px-3.5 py-3">
          <p className="text-xs leading-relaxed text-zinc-300">
            Deleting <strong className="text-zinc-100">{projectName}</strong> will
            permanently remove <strong className="text-red-400">everything</strong> inside
            it, including:
          </p>
          <ul className="mt-2 space-y-1 text-xs text-zinc-400">
            <li className="flex items-center gap-2">
              <span className="text-red-400/80">&#x2022;</span>
              All agents and their configurations
            </li>
            <li className="flex items-center gap-2">
              <span className="text-red-400/80">&#x2022;</span>
              Memory files and conversation history
            </li>
            <li className="flex items-center gap-2">
              <span className="text-red-400/80">&#x2022;</span>
              MCP server configurations
            </li>
            <li className="flex items-center gap-2">
              <span className="text-red-400/80">&#x2022;</span>
              Skills, tips, and all project files
            </li>
          </ul>
        </div>

        {/* Confirmation form */}
        <form onSubmit={handleDelete} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="delete-confirm" className="text-xs text-zinc-400">
              Type <strong className="text-zinc-200">{projectName}</strong> to confirm
            </label>
            <input
              ref={inputRef}
              id="delete-confirm"
              type="text"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder={projectName}
              autoComplete="off"
              spellCheck={false}
              className="rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-700 outline-none focus:border-zinc-500 transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded px-4 py-2 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isMatch || deleting}
              className="rounded bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {deleting ? 'Deleting...' : 'Delete Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

import { useState, useCallback, useEffect, useRef } from 'react'
import { useProjectStore } from '@/stores/project-store'

interface ProjectDialogProps {
  onClose: () => void
}

/**
 * Windows 11-style modal dialog for creating a new project.
 */
export default function ProjectDialog({ onClose }: ProjectDialogProps) {
  const createProject = useProjectStore((s) => s.createProject)

  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  const overlayRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!name.trim()) return
      setSaving(true)
      try {
        await createProject(name.trim())
        onClose()
      } catch (err) {
        console.error('Failed to create project:', err)
      } finally {
        setSaving(false)
      }
    },
    [name, createProject, onClose]
  )

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-lg border border-win-border bg-win-card p-6">
        {/* Header */}
        <h2 className="mb-4 text-base font-semibold text-win-text">
          New Project
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="project-name" className="text-xs font-medium text-win-text-secondary">
              Name
            </label>
            <input
              ref={inputRef}
              id="project-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Project"
              required
              className="rounded-md border border-win-border bg-win-card px-3 py-2 text-sm text-win-text placeholder-win-text-tertiary outline-none focus:border-win-accent focus:ring-2 focus:ring-win-accent/20 transition-all"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm text-win-text-secondary hover:bg-win-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="rounded-md bg-win-accent px-4 py-2 text-sm font-medium text-white hover:bg-win-accent-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

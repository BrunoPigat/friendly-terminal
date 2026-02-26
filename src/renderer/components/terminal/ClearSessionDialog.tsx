import { useCallback, useEffect, useRef } from 'react'

interface ClearSessionDialogProps {
  engineName: string
  onClose: () => void
  onClear: () => void
  onSaveAndClear: () => void
}

/**
 * Warning dialog shown before clearing an AI session.
 * Offers the user three options: Cancel, Clear (lose data), or Save & Clear
 * (summarize session into ENGINE.md then clear).
 */
export default function ClearSessionDialog({
  engineName,
  onClose,
  onClear,
  onSaveAndClear
}: ClearSessionDialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

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

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
        {/* Warning icon + header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-amber-400"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-zinc-100">
              Clear Session
            </h2>
            <p className="mt-1 text-xs text-zinc-400">
              This will clear the current {engineName} conversation.
            </p>
          </div>
        </div>

        {/* Warning message */}
        <div className="mb-5 rounded-md border border-amber-500/20 bg-amber-500/5 px-3.5 py-3">
          <p className="text-xs leading-relaxed text-zinc-300">
            All session context will be lost. The AI will start fresh with no
            memory of this conversation.
          </p>
          <p className="mt-2 text-xs leading-relaxed text-zinc-400">
            You can save a summary to{' '}
            <strong className="text-zinc-200">
              {engineName === 'Claude Code' ? 'CLAUDE.md' : 'GEMINI.md'}
            </strong>{' '}
            before clearing, so the AI retains key decisions and context.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            className="rounded px-4 py-2 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onClear}
            className="rounded bg-zinc-700 px-4 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-600 transition-colors"
          >
            Clear
          </button>
          <button
            onClick={onSaveAndClear}
            className="rounded bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-500 transition-colors"
          >
            Save & Clear
          </button>
        </div>
      </div>
    </div>
  )
}

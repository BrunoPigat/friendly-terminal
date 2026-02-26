import { useCallback, useEffect, useRef } from 'react'

interface ClearSessionDialogProps {
  engineName: string
  onClose: () => void
  onClear: () => void
  onSaveAndClear: () => void
}

/**
 * Windows 11-style confirmation dialog for resetting a chat session.
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-lg border border-win-border bg-win-card p-6">
        {/* Warning icon + header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-amber-500"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-win-text">
              Reset Chat
            </h2>
            <p className="mt-1 text-sm text-win-text-secondary">
              This will start a fresh conversation with {engineName}.
            </p>
          </div>
        </div>

        {/* Info message */}
        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm leading-relaxed text-win-text-secondary">
            Your AI assistant will forget everything from this conversation and start fresh.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-win-text-tertiary">
            Want to keep a summary? Choose <strong className="text-win-text">Save & Reset</strong> to save key decisions before resetting.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm text-win-text-secondary hover:bg-win-hover transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onClear}
            className="rounded-md border border-win-border bg-win-card px-4 py-2 text-sm font-medium text-win-text hover:bg-win-hover transition-colors"
          >
            Reset
          </button>
          <button
            onClick={onSaveAndClear}
            className="rounded-md bg-win-accent px-4 py-2 text-sm font-medium text-white hover:bg-win-accent-dark transition-colors"
          >
            Save & Reset
          </button>
        </div>
      </div>
    </div>
  )
}

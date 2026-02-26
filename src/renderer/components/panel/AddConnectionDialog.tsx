import { useState, useCallback, useEffect, useRef } from 'react'
import { useProjectStore } from '@/stores/project-store'
import * as api from '@/lib/api'

type ConnectionType = 'sse' | 'stdio'

interface HeaderEntry {
  key: string
  value: string
}

interface AddConnectionDialogProps {
  onClose: () => void
  onAdded: () => void
}

export default function AddConnectionDialog({ onClose, onAdded }: AddConnectionDialogProps) {
  const activeProject = useProjectStore((s) => s.activeProject)

  const [name, setName] = useState('')
  const [type, setType] = useState<ConnectionType>('sse')
  const [url, setUrl] = useState('')
  const [headers, setHeaders] = useState<HeaderEntry[]>([{ key: '', value: '' }])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const overlayRef = useRef<HTMLDivElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    nameRef.current?.focus()
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

  const handleAddHeader = useCallback(() => {
    setHeaders((prev) => [...prev, { key: '', value: '' }])
  }, [])

  const handleRemoveHeader = useCallback((index: number) => {
    setHeaders((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleHeaderChange = useCallback(
    (index: number, field: 'key' | 'value', val: string) => {
      setHeaders((prev) =>
        prev.map((entry, i) => (i === index ? { ...entry, [field]: val } : entry))
      )
    },
    []
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!activeProject || !name.trim() || !url.trim()) return

      setError(null)
      setSaving(true)

      try {
        const env: Record<string, string> = {}

        // Collect non-empty headers into env as MCP_HEADER_<KEY>
        for (const h of headers) {
          const k = h.key.trim()
          if (k) {
            env[`MCP_HEADER_${k.toUpperCase().replace(/[^A-Z0-9_]/g, '_')}`] = h.value
          }
        }

        if (type === 'sse') {
          // SSE connections use npx with @anthropic-ai/mcp-proxy or direct URL
          const server: api.McpServer = {
            command: 'npx',
            args: ['-y', 'mcp-remote', url.trim()],
            env: Object.keys(env).length > 0 ? env : undefined
          }
          await api.addMcpServer(activeProject.name, name.trim(), server)
        } else {
          // stdio: user provides full command in the URL field (reused as command)
          const server: api.McpServer = {
            command: url.trim(),
            args: [],
            env: Object.keys(env).length > 0 ? env : undefined
          }
          await api.addMcpServer(activeProject.name, name.trim(), server)
        }

        onAdded()
        onClose()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add connection')
      } finally {
        setSaving(false)
      }
    },
    [activeProject, name, type, url, headers, onAdded, onClose]
  )

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-lg border border-win-border bg-win-card p-6">
        <h2 className="mb-4 text-base font-semibold text-win-text">New Connection</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="conn-name" className="text-xs font-medium text-win-text-secondary">
              Name
            </label>
            <input
              ref={nameRef}
              id="conn-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="my-connection"
              required
              className="rounded-md border border-win-border bg-win-card px-3 py-2 text-sm text-win-text placeholder-win-text-tertiary outline-none focus:border-win-accent focus:ring-2 focus:ring-win-accent/20 transition-all"
            />
          </div>

          {/* Type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-win-text-secondary">Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType('sse')}
                className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-all ${
                  type === 'sse'
                    ? 'border-win-accent bg-win-accent/10 text-win-accent'
                    : 'border-win-border bg-win-card text-win-text-secondary hover:bg-win-hover'
                }`}
              >
                SSE / Remote
              </button>
              <button
                type="button"
                onClick={() => setType('stdio')}
                className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-all ${
                  type === 'stdio'
                    ? 'border-win-accent bg-win-accent/10 text-win-accent'
                    : 'border-win-border bg-win-card text-win-text-secondary hover:bg-win-hover'
                }`}
              >
                Stdio / Local
              </button>
            </div>
          </div>

          {/* URL / Command */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="conn-url" className="text-xs font-medium text-win-text-secondary">
              {type === 'sse' ? 'URL' : 'Command'}
            </label>
            <input
              id="conn-url"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={
                type === 'sse'
                  ? 'https://api.example.com/mcp/sse'
                  : 'npx -y @modelcontextprotocol/server-filesystem'
              }
              required
              className="rounded-md border border-win-border bg-win-card px-3 py-2 text-sm text-win-text placeholder-win-text-tertiary outline-none focus:border-win-accent focus:ring-2 focus:ring-win-accent/20 transition-all font-mono"
            />
          </div>

          {/* Headers */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-win-text-secondary">
                {type === 'sse' ? 'Headers' : 'Environment Variables'}
              </label>
              <button
                type="button"
                onClick={handleAddHeader}
                className="text-[10px] font-medium text-win-accent hover:text-win-accent-dark transition-colors"
              >
                + Add
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              {headers.map((entry, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={entry.key}
                    onChange={(e) => handleHeaderChange(i, 'key', e.target.value)}
                    placeholder={type === 'sse' ? 'Authorization' : 'KEY'}
                    className="w-2/5 rounded-md border border-win-border bg-win-card px-2 py-1.5 text-xs text-win-text placeholder-win-text-tertiary outline-none focus:border-win-accent font-mono transition-colors"
                  />
                  <span className="text-win-text-tertiary text-xs shrink-0">:</span>
                  <input
                    type="text"
                    value={entry.value}
                    onChange={(e) => handleHeaderChange(i, 'value', e.target.value)}
                    placeholder={type === 'sse' ? 'Bearer token...' : 'value'}
                    className="flex-1 rounded-md border border-win-border bg-win-card px-2 py-1.5 text-xs text-win-text placeholder-win-text-tertiary outline-none focus:border-win-accent font-mono transition-colors"
                  />
                  {headers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveHeader(i)}
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-win-text-tertiary hover:bg-win-hover hover:text-win-text transition-colors"
                      aria-label="Remove"
                    >
                      <svg
                        width="8"
                        height="8"
                        viewBox="0 0 8 8"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <line x1="1" y1="1" x2="7" y2="7" />
                        <line x1="7" y1="1" x2="1" y2="7" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}

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
              disabled={saving || !name.trim() || !url.trim()}
              className="rounded-md bg-win-accent px-4 py-2 text-sm font-medium text-white hover:bg-win-accent-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Adding...' : 'Add Connection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

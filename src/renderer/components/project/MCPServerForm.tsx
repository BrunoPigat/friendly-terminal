import { useState, useCallback } from 'react'
import type { MCPServer } from '@/lib/api'

interface MCPServerFormProps {
  server?: MCPServer | null
  onSave: (server: MCPServer) => void
  onCancel: () => void
}

interface EnvEntry {
  key: string
  value: string
}

/**
 * Windows 11-style form for adding or editing an MCP server configuration.
 */
export default function MCPServerForm({ server, onSave, onCancel }: MCPServerFormProps) {
  const isEditing = Boolean(server)

  const [name, setName] = useState(server?.name ?? '')
  const [command, setCommand] = useState(server?.command ?? '')
  const [argsText, setArgsText] = useState(
    server?.args ? JSON.stringify(server.args, null, 2) : '[]'
  )
  const [envEntries, setEnvEntries] = useState<EnvEntry[]>(() => {
    if (!server?.env) return [{ key: '', value: '' }]
    const entries = Object.entries(server.env).map(([key, value]) => ({ key, value }))
    return entries.length > 0 ? entries : [{ key: '', value: '' }]
  })
  const [argsError, setArgsError] = useState<string | null>(null)

  const handleAddEnv = useCallback(() => {
    setEnvEntries((prev) => [...prev, { key: '', value: '' }])
  }, [])

  const handleRemoveEnv = useCallback((index: number) => {
    setEnvEntries((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleEnvChange = useCallback((index: number, field: 'key' | 'value', val: string) => {
    setEnvEntries((prev) =>
      prev.map((entry, i) => (i === index ? { ...entry, [field]: val } : entry))
    )
  }, [])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()

      let args: string[]
      try {
        args = JSON.parse(argsText)
        if (!Array.isArray(args)) throw new Error('Args must be a JSON array')
        setArgsError(null)
      } catch (err) {
        setArgsError(err instanceof Error ? err.message : 'Invalid JSON')
        return
      }

      const env: Record<string, string> = {}
      for (const entry of envEntries) {
        const key = entry.key.trim()
        if (key) {
          env[key] = entry.value
        }
      }

      const result: MCPServer = {
        id: server?.id ?? `mcp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: name.trim(),
        command: command.trim(),
        args,
        env,
        enabled: server?.enabled ?? true
      }

      onSave(result)
    },
    [name, command, argsText, envEntries, server, onSave]
  )

  return (
    <div className="flex flex-col gap-4 p-4">
      <h3 className="text-sm font-medium text-win-text">
        {isEditing ? 'Edit MCP Server' : 'Add MCP Server'}
      </h3>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {/* Name */}
        <div className="flex flex-col gap-1">
          <label htmlFor="mcp-name" className="text-xs font-medium text-win-text-secondary">
            Name
          </label>
          <input
            id="mcp-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="my-server"
            required
            className="rounded-md border border-win-border bg-win-card px-3 py-1.5 text-xs text-win-text placeholder-win-text-tertiary outline-none focus:border-win-accent focus:ring-2 focus:ring-win-accent/20 transition-all"
          />
        </div>

        {/* Command */}
        <div className="flex flex-col gap-1">
          <label htmlFor="mcp-command" className="text-xs font-medium text-win-text-secondary">
            Command
          </label>
          <input
            id="mcp-command"
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="npx -y @modelcontextprotocol/server-filesystem"
            required
            className="rounded-md border border-win-border bg-win-card px-3 py-1.5 text-xs text-win-text placeholder-win-text-tertiary outline-none focus:border-win-accent focus:ring-2 focus:ring-win-accent/20 transition-all font-mono"
          />
        </div>

        {/* Args (JSON) */}
        <div className="flex flex-col gap-1">
          <label htmlFor="mcp-args" className="text-xs font-medium text-win-text-secondary">
            Args (JSON array)
          </label>
          <textarea
            id="mcp-args"
            value={argsText}
            onChange={(e) => {
              setArgsText(e.target.value)
              setArgsError(null)
            }}
            rows={3}
            className={`rounded-md border bg-win-card px-3 py-1.5 text-xs text-win-text placeholder-win-text-tertiary outline-none font-mono resize-none transition-all ${
              argsError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-win-border focus:border-win-accent focus:ring-win-accent/20'
            } focus:ring-2`}
          />
          {argsError && (
            <span className="text-[10px] text-red-600">{argsError}</span>
          )}
        </div>

        {/* Environment variables */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-win-text-secondary">Environment Variables</span>
            <button
              type="button"
              onClick={handleAddEnv}
              className="text-[10px] text-win-accent hover:text-win-accent-dark transition-colors"
            >
              + Add
            </button>
          </div>
          <div className="flex flex-col gap-1">
            {envEntries.map((entry, i) => (
              <div key={i} className="flex items-center gap-1">
                <input
                  type="text"
                  value={entry.key}
                  onChange={(e) => handleEnvChange(i, 'key', e.target.value)}
                  placeholder="KEY"
                  className="w-1/3 rounded-md border border-win-border bg-win-card px-2 py-1 text-xs text-win-text placeholder-win-text-tertiary outline-none focus:border-win-accent font-mono transition-colors"
                />
                <span className="text-win-text-tertiary text-xs">=</span>
                <input
                  type="text"
                  value={entry.value}
                  onChange={(e) => handleEnvChange(i, 'value', e.target.value)}
                  placeholder="value"
                  className="flex-1 rounded-md border border-win-border bg-win-card px-2 py-1 text-xs text-win-text placeholder-win-text-tertiary outline-none focus:border-win-accent font-mono transition-colors"
                />
                {envEntries.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveEnv(i)}
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-win-text-tertiary hover:bg-win-hover hover:text-win-text transition-colors"
                    aria-label="Remove env var"
                  >
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <line x1="1" y1="1" x2="7" y2="7" />
                      <line x1="7" y1="1" x2="1" y2="7" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md px-4 py-2 text-sm text-win-text-secondary hover:bg-win-hover transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!name.trim() || !command.trim()}
            className="rounded-md bg-win-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-win-accent-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isEditing ? 'Save' : 'Add'}
          </button>
        </div>
      </form>
    </div>
  )
}

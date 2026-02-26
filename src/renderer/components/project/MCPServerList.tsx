import { useState, useCallback } from 'react'
import { useProjectStore } from '@/stores/project-store'
import type { McpServer } from '@/lib/api'
import * as api from '@/lib/api'
import MCPServerForm from '@/components/project/MCPServerForm'

interface MCPServerEntry {
  name: string
  server: McpServer
  enabled: boolean
}

/**
 * Displays the list of configured MCP servers for the active project.
 * Each server shows its name, command, and enabled status.
 * Supports add, edit, and remove operations.
 */
export default function MCPServerList() {
  const activeProject = useProjectStore((s) => s.activeProject)

  const [servers, setServers] = useState<MCPServerEntry[]>([])
  const [editingServer, setEditingServer] = useState<MCPServerEntry | null>(null)
  const [showForm, setShowForm] = useState(false)

  // Load servers from the MCP API when project changes
  const loadServers = useCallback(async () => {
    if (!activeProject) return
    try {
      const result = await api.listMcpServers(activeProject.name)
      // result is expected to be a record of name → McpServer
      const entries: MCPServerEntry[] = Object.entries(result as Record<string, McpServer>).map(
        ([name, server]) => ({
          name,
          server,
          enabled: true
        })
      )
      setServers(entries)
    } catch {
      setServers([])
    }
  }, [activeProject])

  const handleAdd = useCallback(() => {
    setEditingServer(null)
    setShowForm(true)
  }, [])

  const handleEdit = useCallback((entry: MCPServerEntry) => {
    setEditingServer(entry)
    setShowForm(true)
  }, [])

  const handleRemove = useCallback(
    async (name: string) => {
      if (!activeProject) return
      await api.removeMcpServer(activeProject.name, name)
      await loadServers()
    },
    [activeProject, loadServers]
  )

  const handleCancel = useCallback(() => {
    setShowForm(false)
    setEditingServer(null)
  }, [])

  if (!activeProject) {
    return (
      <div className="p-4 text-xs text-zinc-500">
        Select a project to manage MCP servers.
      </div>
    )
  }

  if (showForm) {
    return <MCPServerForm server={editingServer} onSave={async () => { setShowForm(false); await loadServers() }} onCancel={handleCancel} />
  }

  return (
    <div className="flex flex-col gap-2 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-200">MCP Servers</h3>
        <button
          onClick={handleAdd}
          className="rounded bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
        >
          + Add Server
        </button>
      </div>

      {servers.length === 0 && (
        <p className="py-4 text-center text-xs text-zinc-500">
          No MCP servers configured.
        </p>
      )}

      <div className="flex flex-col gap-1">
        {servers.map((entry) => (
          <div
            key={entry.name}
            className="flex items-center justify-between rounded border border-zinc-800 bg-zinc-900 px-3 py-2"
          >
            <div className="flex flex-col gap-0.5 overflow-hidden">
              <div className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    entry.enabled ? 'bg-green-500' : 'bg-zinc-600'
                  }`}
                />
                <span className="text-xs font-medium text-zinc-200 truncate">
                  {entry.name}
                </span>
              </div>
              <span className="pl-4 text-[10px] text-zinc-500 truncate">
                {entry.server.command} {(entry.server.args ?? []).join(' ')}
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0 ml-2">
              <button
                onClick={() => handleEdit(entry)}
                className="rounded px-1.5 py-0.5 text-[10px] text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => handleRemove(entry.name)}
                className="rounded px-1.5 py-0.5 text-[10px] text-red-500 hover:bg-red-900/30 hover:text-red-400 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

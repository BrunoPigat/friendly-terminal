import { useState, useEffect, useCallback } from 'react'
import { useProjectStore } from '@/stores/project-store'
import type { McpServer } from '@/lib/api'
import * as api from '@/lib/api'

interface MCPServerEntry {
  name: string
  server: McpServer
}

export default function MCPPanel() {
  const activeProject = useProjectStore((s) => s.activeProject)
  const [servers, setServers] = useState<MCPServerEntry[]>([])
  const [loading, setLoading] = useState(false)

  const loadServers = useCallback(async () => {
    if (!activeProject) return
    setLoading(true)
    try {
      const result = await api.listMcpServers(activeProject.name)
      const entries: MCPServerEntry[] = Object.entries(result as Record<string, McpServer>).map(
        ([name, server]) => ({ name, server })
      )
      setServers(entries)
    } catch {
      setServers([])
    } finally {
      setLoading(false)
    }
  }, [activeProject])

  useEffect(() => {
    loadServers()
  }, [loadServers])

  if (!activeProject) {
    return (
      <div className="p-4 text-xs text-zinc-500">
        Select a project to view MCP servers.
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-4 text-xs text-zinc-500">Loading MCP servers...</div>
    )
  }

  if (servers.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 p-6 text-center">
        <div className="text-zinc-600">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
            <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
            <line x1="6" y1="6" x2="6.01" y2="6" />
            <line x1="6" y1="18" x2="6.01" y2="18" />
          </svg>
        </div>
        <p className="text-xs text-zinc-500">No MCP servers configured.</p>
        <p className="text-[10px] text-zinc-600">
          Configure servers in <code className="rounded bg-zinc-800 px-1">.mcp.json</code>
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5 p-3">
      {servers.map((entry) => (
        <div
          key={entry.name}
          className="rounded border border-zinc-800 bg-zinc-900/50 px-3 py-2.5"
        >
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 shrink-0 rounded-full bg-green-500" />
            <span className="text-xs font-medium text-zinc-200 truncate">{entry.name}</span>
          </div>
          <p className="mt-1 pl-4 text-[10px] text-zinc-500 truncate">
            {entry.server.command} {(entry.server.args ?? []).join(' ')}
          </p>
        </div>
      ))}
    </div>
  )
}

import { useState, useEffect, useCallback } from 'react'
import { useProjectStore } from '@/stores/project-store'
import type { McpServer } from '@/lib/api'
import * as api from '@/lib/api'
import AddConnectionDialog from './AddConnectionDialog'

interface MCPServerEntry {
  name: string
  server: McpServer
}

export default function MCPPanel() {
  const activeProject = useProjectStore((s) => s.activeProject)
  const [servers, setServers] = useState<MCPServerEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedNames, setExpandedNames] = useState<Set<string>>(new Set())
  const [showAddDialog, setShowAddDialog] = useState(false)

  const toggleExpanded = useCallback((name: string) => {
    setExpandedNames((prev) => {
      const next = new Set(prev)
      if (next.has(name)) {
        next.delete(name)
      } else {
        next.add(name)
      }
      return next
    })
  }, [])

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

  // Refresh when a connection is added via MCP tool
  useEffect(() => {
    const handler = () => loadServers()
    window.addEventListener('mcp-connections-changed', handler)
    return () => window.removeEventListener('mcp-connections-changed', handler)
  }, [loadServers])

  if (!activeProject) {
    return (
      <div className="p-4 text-sm text-win-text-tertiary">
        Select a project to view MCP servers.
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-4 text-sm text-win-text-tertiary">Loading MCP servers...</div>
    )
  }

  const addButton = (
    <div className="flex items-center justify-between px-4 pt-4 pb-1">
      <span className="text-xs font-medium text-win-text-tertiary uppercase tracking-wider">
        Connections
      </span>
      <button
        onClick={() => setShowAddDialog(true)}
        className="flex items-center gap-1 rounded-md border border-win-border bg-win-card px-2.5 py-1 text-xs font-medium text-win-text-secondary hover:bg-win-hover hover:text-win-text transition-colors"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="5" y1="1" x2="5" y2="9" />
          <line x1="1" y1="5" x2="9" y2="5" />
        </svg>
        Add
      </button>
    </div>
  )

  if (servers.length === 0) {
    return (
      <>
        {addButton}
        <div className="flex flex-col items-center gap-2 p-6 text-center">
          <div className="text-win-text-tertiary">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
              <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
              <line x1="6" y1="6" x2="6.01" y2="6" />
              <line x1="6" y1="18" x2="6.01" y2="18" />
            </svg>
          </div>
          <p className="text-sm text-win-text-secondary">No connections configured.</p>
          <p className="text-xs text-win-text-tertiary">
            Add a connection to get started.
          </p>
        </div>
        {showAddDialog && (
          <AddConnectionDialog
            onClose={() => setShowAddDialog(false)}
            onAdded={loadServers}
          />
        )}
      </>
    )
  }

  return (
    <>
      {addButton}
      <div className="flex flex-col gap-2 px-4 pb-4">
      {servers.map((entry) => {
        const isExpanded = expandedNames.has(entry.name)
        const envEntries = entry.server.env ? Object.entries(entry.server.env) : []
        return (
          <button
            key={entry.name}
            onClick={() => toggleExpanded(entry.name)}
            className="rounded-lg border border-win-border bg-win-card px-5 py-4 hover:bg-win-hover transition-colors text-left w-full cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className={`shrink-0 text-win-text-tertiary transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              >
                <polyline points="4,2 8,6 4,10" />
              </svg>
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-green-500" />
              <span className={`text-sm font-medium text-win-text ${isExpanded ? '' : 'truncate'}`}>{entry.name}</span>
            </div>
            <p className={`mt-1.5 pl-[22px] text-sm text-win-text-tertiary ${isExpanded ? 'break-words' : 'truncate'}`}>
              {entry.server.command} {(entry.server.args ?? []).join(' ')}
            </p>
            {isExpanded && (
              <div className="mt-3 pl-[22px] flex flex-col gap-2">
                {(entry.server.args ?? []).length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-win-text-secondary mb-1">Arguments</p>
                    <div className="flex flex-col gap-0.5">
                      {(entry.server.args ?? []).map((arg, i) => (
                        <p key={i} className="text-xs text-win-text-tertiary font-mono break-all">{arg}</p>
                      ))}
                    </div>
                  </div>
                )}
                {envEntries.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-win-text-secondary mb-1">Environment</p>
                    <div className="flex flex-col gap-0.5">
                      {envEntries.map(([key, value]) => (
                        <p key={key} className="text-xs text-win-text-tertiary font-mono break-all">
                          <span className="text-win-text-secondary">{key}</span>={value}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </button>
        )
      })}
      </div>
      {showAddDialog && (
        <AddConnectionDialog
          onClose={() => setShowAddDialog(false)}
          onAdded={loadServers}
        />
      )}
    </>
  )
}

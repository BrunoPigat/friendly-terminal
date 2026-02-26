import { useState, useEffect } from 'react'
import { useProjectStore } from '@/stores/project-store'
import { useSettingsStore } from '@/stores/settings-store'
import * as api from '@/lib/api'
import type { AgentEntry } from '@/lib/api'

export default function AgentList() {
  const activeProject = useProjectStore((s) => s.activeProject)
  const defaultEngine = useSettingsStore((s) => s.defaultEngine)
  const [agents, setAgents] = useState<AgentEntry[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!activeProject) {
      setAgents([])
      return
    }

    let cancelled = false
    setLoading(true)

    api.listAgents(defaultEngine, activeProject.path)
      .then((result) => {
        if (!cancelled) {
          setAgents(result)
          setLoading(false)
        }
      })
      .catch((err) => {
        console.warn('[AgentList] Failed to load agents:', err)
        if (!cancelled) {
          setAgents([])
          setLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [activeProject, defaultEngine])

  if (!activeProject) {
    return (
      <div className="p-4 text-xs text-zinc-500">
        Select a project to view agents.
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-4 text-xs text-zinc-500">Loading agents...</div>
    )
  }

  if (agents.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 p-6 text-center">
        <div className="text-zinc-600">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <p className="text-xs text-zinc-500">No agents found.</p>
        <p className="text-[10px] text-zinc-600">
          Add agents in <code className="rounded bg-zinc-800 px-1">.{defaultEngine}/agents/</code>
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5 p-3">
      {agents.map((agent) => (
        <div
          key={agent.filePath}
          className="rounded border border-zinc-800 bg-zinc-900/50 px-3 py-2.5"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-200 truncate">{agent.name}</span>
            {agent.model && (
              <span className="shrink-0 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">
                {agent.model}
              </span>
            )}
          </div>
          {agent.description && (
            <p className="mt-1 text-[11px] leading-relaxed text-zinc-500 line-clamp-2">
              {agent.description}
            </p>
          )}
          {agent.tools && (
            <p className="mt-1 text-[10px] text-zinc-600 truncate">
              Tools: {agent.tools}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}

import { useState, useEffect, useCallback } from 'react'
import { useProjectStore } from '@/stores/project-store'
import { useSettingsStore } from '@/stores/settings-store'
import { ENGINE_DIRS } from '@/lib/constants'
import * as api from '@/lib/api'
import type { AgentEntry } from '@/lib/api'

export default function AgentList() {
  const activeProject = useProjectStore((s) => s.activeProject)
  const defaultEngine = useSettingsStore((s) => s.defaultEngine)
  const [agents, setAgents] = useState<AgentEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set())

  const toggleExpanded = useCallback((filePath: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev)
      if (next.has(filePath)) {
        next.delete(filePath)
      } else {
        next.add(filePath)
      }
      return next
    })
  }, [])

  const loadAgents = useCallback(
    (projectPath: string) => {
      api.listAgents(defaultEngine, projectPath)
        .then((result) => {
          setAgents(result)
          setLoading(false)
        })
        .catch((err) => {
          console.warn('[AgentList] Failed to load agents:', err)
          setAgents([])
          setLoading(false)
        })
    },
    [defaultEngine]
  )

  useEffect(() => {
    if (!activeProject) {
      setAgents([])
      return
    }

    setLoading(true)
    loadAgents(activeProject.path)

    const engineDir = ENGINE_DIRS[defaultEngine]
    const agentsDirSuffix = `/${engineDir}/agents`

    const unsub = api.onFsChanged((rootPath, changedDir) => {
      if (rootPath !== activeProject.path) return
      const normalized = changedDir.replace(/\\/g, '/')
      if (normalized.includes(agentsDirSuffix)) {
        loadAgents(activeProject.path)
      }
    })

    return () => { unsub() }
  }, [activeProject, defaultEngine, loadAgents])

  if (!activeProject) {
    return (
      <div className="p-4 text-sm text-win-text-tertiary">
        Select a project to view agents.
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-4 text-sm text-win-text-tertiary">Loading agents...</div>
    )
  }

  if (agents.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 p-6 text-center">
        <div className="text-win-text-tertiary">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <p className="text-sm text-win-text-secondary">No agents yet</p>
        <p className="text-xs text-win-text-tertiary">
          Ask your AI assistant on the chat to create a new agent — just describe what you need it to do.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 p-4">
      <p className="text-[11px] leading-relaxed text-win-text-tertiary px-1 pb-1">
        Ask your AI assistant on the chat to create a new agent for you — just describe what you need it to do.
      </p>
      {agents.map((agent) => {
        const isExpanded = expandedPaths.has(agent.filePath)
        return (
          <button
            key={agent.filePath}
            onClick={() => toggleExpanded(agent.filePath)}
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
              <span className={`text-sm font-medium text-win-text ${isExpanded ? '' : 'truncate'}`}>{agent.name}</span>
              {agent.model && (
                <span className="shrink-0 rounded-md bg-win-accent-subtle px-2.5 py-1 text-xs text-win-accent font-medium">
                  {agent.model}
                </span>
              )}
            </div>
            {agent.description && (
              <p className={`mt-1.5 pl-[22px] text-sm leading-relaxed text-win-text-secondary ${isExpanded ? '' : 'line-clamp-2'}`}>
                {agent.description}
              </p>
            )}
            {agent.tools && (
              <p className={`mt-1.5 pl-[22px] text-xs text-win-text-tertiary ${isExpanded ? 'break-words' : 'truncate'}`}>
                Tools: {agent.tools}
              </p>
            )}
            {isExpanded && (
              <p className="mt-2 pl-[22px] text-xs text-win-text-tertiary break-all">
                {agent.filePath}
              </p>
            )}
          </button>
        )
      })}
    </div>
  )
}

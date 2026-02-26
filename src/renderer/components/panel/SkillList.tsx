import { useState, useEffect } from 'react'
import { useProjectStore } from '@/stores/project-store'
import { useSettingsStore } from '@/stores/settings-store'
import * as api from '@/lib/api'
import type { SkillEntry } from '@/lib/api'

export default function SkillList() {
  const activeProject = useProjectStore((s) => s.activeProject)
  const defaultEngine = useSettingsStore((s) => s.defaultEngine)
  const [skills, setSkills] = useState<SkillEntry[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!activeProject) {
      setSkills([])
      return
    }

    let cancelled = false
    setLoading(true)

    api.listSkills(defaultEngine, activeProject.path)
      .then((result) => {
        if (!cancelled) {
          setSkills(result)
          setLoading(false)
        }
      })
      .catch((err) => {
        console.warn('[SkillList] Failed to load skills:', err)
        if (!cancelled) {
          setSkills([])
          setLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [activeProject, defaultEngine])

  if (!activeProject) {
    return (
      <div className="p-4 text-xs text-zinc-500">
        Select a project to view skills.
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-4 text-xs text-zinc-500">Loading skills...</div>
    )
  }

  if (skills.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 p-6 text-center">
        <div className="text-zinc-600">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
        </div>
        <p className="text-xs text-zinc-500">No skills found.</p>
        <p className="text-[10px] text-zinc-600">
          Add skills in <code className="rounded bg-zinc-800 px-1">.{defaultEngine}/skills/</code>
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5 p-3">
      {skills.map((skill) => (
        <div
          key={skill.filePath}
          className="rounded border border-zinc-800 bg-zinc-900/50 px-3 py-2.5"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-200 truncate">{skill.name}</span>
            {skill.userInvocable && (
              <span className="shrink-0 rounded bg-emerald-900/40 px-1.5 py-0.5 text-[10px] text-emerald-400">
                invocable
              </span>
            )}
          </div>
          {skill.description && (
            <p className="mt-1 text-[11px] leading-relaxed text-zinc-500 line-clamp-2">
              {skill.description}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}

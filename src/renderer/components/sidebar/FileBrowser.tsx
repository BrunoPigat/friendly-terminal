import { useState } from 'react'
import FolderTree from '@/components/sidebar/FolderTree'
import { useProjectStore } from '@/stores/project-store'

export default function FileBrowser() {
  const activeProject = useProjectStore((s) => s.activeProject)
  const [filter, setFilter] = useState('')

  if (!activeProject) {
    return (
      <div className="flex-1 flex items-center justify-center text-xs text-win-text-tertiary px-3">
        No project selected
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Project name header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-win-border">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0 text-win-accent"
        >
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
        <span className="text-sm font-medium text-win-text truncate">{activeProject.name}</span>
      </div>

      {/* Filter */}
      <div className="px-2 py-1.5">
        <input
          type="text"
          placeholder="Search files..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full rounded-md border border-win-border bg-win-card px-3 py-1.5 text-sm text-win-text placeholder-win-text-tertiary outline-none focus:border-win-accent transition-colors"
        />
      </div>

      {/* File tree */}
      <FolderTree rootPath={activeProject.path} filter={filter} />
    </div>
  )
}

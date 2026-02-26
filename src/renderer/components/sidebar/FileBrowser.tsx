import { useState } from 'react'
import FolderTree from '@/components/sidebar/FolderTree'
import { useProjectStore } from '@/stores/project-store'

export default function FileBrowser() {
  const activeProject = useProjectStore((s) => s.activeProject)
  const [filter, setFilter] = useState('')

  if (!activeProject) {
    return (
      <div className="flex-1 flex items-center justify-center text-xs text-zinc-500 px-3">
        No project selected
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Project name header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0 text-zinc-500"
        >
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
        <span className="text-xs font-medium text-zinc-300 truncate">{activeProject.name}</span>
      </div>

      {/* Filter */}
      <div className="px-2 py-1.5">
        <input
          type="text"
          placeholder="Filter files..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-300 placeholder-zinc-600 outline-none focus:border-zinc-600"
        />
      </div>

      {/* File tree */}
      <FolderTree rootPath={activeProject.path} filter={filter} />
    </div>
  )
}

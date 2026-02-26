import { useEffect, useCallback, useMemo } from 'react'
import { Tree, type NodeRendererProps } from 'react-arborist'
import { useFileTree, type FileNode } from '@/hooks/useFileTree'
import { useTerminalStore } from '@/stores/terminal-store'
import * as api from '@/lib/api'

interface FolderTreeProps {
  rootPath: string | null
  filter?: string
}

export default function FolderTree({ rootPath, filter }: FolderTreeProps) {
  const { data, loading, loadRoot, loadChildren } = useFileTree(rootPath)

  useEffect(() => {
    loadRoot()
  }, [loadRoot])

  const handleToggle = useCallback(
    async (id: string) => {
      const node = findNode(data, id)
      if (node && node.isDirectory && node.children === null) {
        await loadChildren(node)
      }
    },
    [data, loadChildren]
  )

  // Filter tree data by name
  const filteredData = useMemo(() => {
    if (!filter?.trim()) return data
    const lowerFilter = filter.toLowerCase()
    return data.filter((node) => node.name.toLowerCase().includes(lowerFilter))
  }, [data, filter])

  if (!rootPath) {
    return (
      <div className="flex-1 flex items-center justify-center text-xs text-zinc-500 px-3">
        No folder selected
      </div>
    )
  }

  if (loading) {
    return (
      <div className="px-3 py-2 text-xs text-zinc-500">Loading...</div>
    )
  }

  if (filteredData.length === 0) {
    return (
      <div className="px-3 py-4 text-xs text-zinc-600 text-center">
        {filter ? 'No matches' : 'Empty folder'}
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-hidden">
      <Tree
        data={filteredData}
        idAccessor="id"
        openByDefault={false}
        width="100%"
        indent={16}
        rowHeight={28}
        onToggle={(id) => handleToggle(id as unknown as string)}
        childrenAccessor={(node: FileNode) =>
          node.children === null ? [] : node.children ?? undefined
        }
      >
        {(props: NodeRendererProps<FileNode>) => <FolderNode {...props} rootPath={rootPath} />}
      </Tree>
    </div>
  )
}

function FolderNode({ node, style, rootPath }: NodeRendererProps<FileNode> & { rootPath: string | null }) {
  const activeTerminalId = useTerminalStore((s) => s.activeTerminalId)

  const handleClick = useCallback(() => {
    if (node.data.isDirectory) {
      node.toggle()
    }
  }, [node])

  /** Compute path relative to project root, using forward slashes */
  const getRelativePath = useCallback(
    (absolutePath: string) => {
      if (!rootPath) return absolutePath
      // Normalize separators to forward slashes for comparison
      const normRoot = rootPath.replace(/\\/g, '/').replace(/\/$/, '')
      const normPath = absolutePath.replace(/\\/g, '/')
      if (normPath.startsWith(normRoot + '/')) {
        return normPath.slice(normRoot.length + 1)
      }
      return normPath
    },
    [rootPath]
  )

  const handleAddDirToContext = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (!activeTerminalId) return
      const command = `/add-dir ${node.data.path}\n`
      api.ptyWrite(activeTerminalId, command)
    },
    [activeTerminalId, node.data.path]
  )

  const handleAddFileToContext = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (!activeTerminalId) return
      // Both Claude and Gemini use @filePath to reference files in context
      // Use project-relative path (e.g. @src/index.ts, not @C:\full\path)
      // Don't send newline — let the user continue composing their message
      const relativePath = getRelativePath(node.data.path)
      const ref = `@${relativePath} `
      api.ptyWrite(activeTerminalId, ref)
    },
    [activeTerminalId, node.data.path, getRelativePath]
  )

  const isDir = node.data.isDirectory

  return (
    <div
      className="group flex items-center gap-1.5 px-2 text-xs cursor-pointer hover:bg-zinc-800/60 rounded-sm"
      style={style}
      onClick={handleClick}
    >
      {/* Expand arrow */}
      <span className="flex w-3.5 shrink-0 items-center justify-center text-zinc-500">
        {isDir ? (
          <svg
            width="8"
            height="8"
            viewBox="0 0 8 8"
            fill="currentColor"
            className={`transition-transform ${node.isOpen ? 'rotate-90' : ''}`}
          >
            <polygon points="1,0 7,4 1,8" />
          </svg>
        ) : null}
      </span>

      {/* Icon */}
      <span className="shrink-0 text-zinc-500">
        {isDir ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
            <polyline points="13 2 13 9 20 9" />
          </svg>
        )}
      </span>

      {/* Name */}
      <span className="truncate text-zinc-300">{node.data.name}</span>

      {/* Add to Context (on hover) */}
      {isDir ? (
        <button
          onClick={handleAddDirToContext}
          className="ml-auto hidden shrink-0 rounded px-1.5 py-0.5 text-[10px] text-zinc-500 hover:bg-zinc-700 hover:text-zinc-200 group-hover:flex items-center transition-colors"
          title="Add directory to AI context"
        >
          + ctx
        </button>
      ) : (
        <button
          onClick={handleAddFileToContext}
          className="ml-auto hidden shrink-0 rounded px-1.5 py-0.5 text-[10px] text-zinc-500 hover:bg-zinc-700 hover:text-zinc-200 group-hover:flex items-center transition-colors"
          title="Add file to AI context"
        >
          @
        </button>
      )}
    </div>
  )
}

function findNode(nodes: FileNode[], id: string): FileNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children) {
      const found = findNode(node.children, id)
      if (found) return found
    }
  }
  return undefined
}

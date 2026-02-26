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
      <div className="flex-1 flex items-center justify-center text-sm text-win-text-tertiary px-3">
        No folder selected
      </div>
    )
  }

  if (loading) {
    return (
      <div className="px-3 py-2 text-xs text-win-text-tertiary">Loading...</div>
    )
  }

  if (filteredData.length === 0) {
    return (
      <div className="px-3 py-4 text-xs text-win-text-tertiary text-center">
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
        indent={18}
        rowHeight={36}
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
      const relativePath = getRelativePath(node.data.path)
      const ref = `@${relativePath} `
      api.ptyWrite(activeTerminalId, ref)
    },
    [activeTerminalId, node.data.path, getRelativePath]
  )

  const isDir = node.data.isDirectory

  return (
    <div
      className="group flex items-center gap-2 px-2 text-sm cursor-pointer hover:bg-win-hover rounded-md"
      style={style}
      onClick={handleClick}
    >
      {/* Expand arrow */}
      <span className="flex w-3.5 shrink-0 items-center justify-center text-win-text-tertiary">
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
      <span className="shrink-0 text-win-text-tertiary">
        {isDir ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
            <polyline points="13 2 13 9 20 9" />
          </svg>
        )}
      </span>

      {/* Name */}
      <span className="truncate text-win-text">{node.data.name}</span>

      {/* Add to Context (on hover) */}
      {isDir ? (
        <button
          onClick={handleAddDirToContext}
          className="ml-auto hidden shrink-0 rounded-md px-2 py-1 text-xs text-win-text-tertiary hover:bg-win-pressed hover:text-win-text group-hover:flex items-center transition-colors"
          title="Add folder to chat context"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      ) : (
        <button
          onClick={handleAddFileToContext}
          className="ml-auto hidden shrink-0 rounded-md px-2 py-1 text-xs text-win-text-tertiary hover:bg-win-pressed hover:text-win-text group-hover:flex items-center transition-colors"
          title="Add file to chat"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
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

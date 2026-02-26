import { useState, useCallback, useEffect } from 'react'
import * as api from '@/lib/api'

export interface FileNode {
  id: string
  name: string
  path: string
  isDirectory: boolean
  children?: FileNode[] | null
}

/**
 * Provides tree data for react-arborist backed by the Electron IPC
 * filesystem bridge.  Children are lazily loaded when a folder node
 * is expanded for the first time.
 *
 * Automatically watches the root path for filesystem changes and
 * reloads the tree when files/folders are created, deleted, or modified.
 */
export function useFileTree(rootPath: string | null) {
  const [data, setData] = useState<FileNode[]>([])
  const [loading, setLoading] = useState(false)

  /**
   * Load the top-level contents of `rootPath`.
   */
  const loadRoot = useCallback(async () => {
    if (!rootPath) {
      setData([])
      return
    }
    setLoading(true)
    try {
      const entries = await api.readDir(rootPath)
      const nodes: FileNode[] = entries.map((e) => ({
        id: e.path,
        name: e.name,
        path: e.path,
        isDirectory: e.isDirectory,
        children: e.isDirectory ? null : undefined
      }))
      nodes.sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      })
      setData(nodes)
    } catch (err) {
      console.error('Failed to read directory:', err)
      setData([])
    } finally {
      setLoading(false)
    }
  }, [rootPath])

  /**
   * Called by react-arborist when a directory node is toggled open.
   * Lazily fetches children if they haven't been loaded yet.
   */
  const loadChildren = useCallback(
    async (node: FileNode): Promise<FileNode[]> => {
      if (!node.isDirectory) return []
      try {
        const entries = await api.readDir(node.path)
        const children: FileNode[] = entries.map((e) => ({
          id: e.path,
          name: e.name,
          path: e.path,
          isDirectory: e.isDirectory,
          children: e.isDirectory ? null : undefined
        }))
        children.sort((a, b) => {
          if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
          return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
        })

        setData((prev) => updateNodeChildren(prev, node.id, children))
        return children
      } catch (err) {
        console.error(`Failed to read "${node.path}":`, err)
        return []
      }
    },
    []
  )

  // Start watching rootPath for filesystem changes
  useEffect(() => {
    if (!rootPath) return

    // Start the watcher in the main process
    api.fsWatch(rootPath)

    // Listen for change events and reload the root
    const unsubscribe = api.onFsChanged((changedRoot) => {
      if (changedRoot === rootPath) {
        loadRoot()
      }
    })

    return () => {
      unsubscribe()
      api.fsUnwatch(rootPath)
    }
    // NOTE: loadRoot is intentionally excluded from deps to avoid
    // a rapid watch/unwatch loop (loadRoot changes when rootPath changes,
    // and rootPath is already in the dependency array).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootPath])

  return { data, loading, loadRoot, loadChildren }
}

// ---- Internal helpers -----------------------------------------------------

/**
 * Deep-immutable update: find the node by `id` and set its children.
 */
function updateNodeChildren(
  nodes: FileNode[],
  targetId: string,
  children: FileNode[]
): FileNode[] {
  return nodes.map((node) => {
    if (node.id === targetId) {
      return { ...node, children }
    }
    if (node.children && node.children.length > 0) {
      return { ...node, children: updateNodeChildren(node.children, targetId, children) }
    }
    return node
  })
}

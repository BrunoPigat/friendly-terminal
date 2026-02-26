import { readdir, stat } from 'fs/promises'
import { join } from 'path'

export interface DirectoryEntry {
  name: string
  path: string
  isDirectory: boolean
  size: number
  modified: string
}

/**
 * Reads the contents of a directory (non-recursive / lazy).
 * Returns entries sorted: directories first, then alphabetically within each group.
 * Permission errors on individual entries are silently skipped.
 */
export async function readDirectory(dirPath: string): Promise<DirectoryEntry[]> {
  let entries: string[]
  try {
    entries = await readdir(dirPath)
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code
    if (code === 'EACCES' || code === 'EPERM') {
      return []
    }
    throw err
  }

  const results: DirectoryEntry[] = []

  for (const name of entries) {
    const fullPath = join(dirPath, name)
    try {
      const info = await stat(fullPath)
      results.push({
        name,
        path: fullPath,
        isDirectory: info.isDirectory(),
        size: info.isDirectory() ? 0 : info.size,
        modified: info.mtime.toISOString()
      })
    } catch {
      // Skip entries we cannot stat (permission errors, broken symlinks, etc.)
    }
  }

  results.sort((a, b) => {
    if (a.isDirectory && !b.isDirectory) return -1
    if (!a.isDirectory && b.isDirectory) return 1
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  })

  return results
}

import { app } from 'electron'
import { join, dirname } from 'path'
import { mkdir } from 'fs/promises'

/**
 * Returns the base directory for all projects.
 * In dev: <repo>/projects/
 * In prod: <install-dir>/projects/
 */
export function getProjectsDir(): string {
  if (app.isPackaged) {
    // In production, use the directory where the exe lives
    return join(dirname(app.getPath('exe')), 'projects')
  }
  // In dev, use the repo root
  return join(app.getAppPath(), 'projects')
}

/**
 * Returns the directory for a specific project by slug.
 */
export function getProjectDir(slug: string): string {
  return join(getProjectsDir(), slug)
}

/**
 * Creates a directory (and parents) if it does not exist.
 * Silently succeeds if the directory already exists.
 */
export async function ensureDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true })
}

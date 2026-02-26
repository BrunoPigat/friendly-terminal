import { readdir, cp } from 'fs/promises'
import { join } from 'path'
import { app } from 'electron'
import { ensureDir } from '../util/paths'

/**
 * Returns the path to the bundled default agents in resources.
 * In dev mode: resources/default-projects/agents/
 * In production: process.resourcesPath/default-projects/agents/
 */
function getDefaultAgentsSource(): string {
  if (app.isPackaged) {
    return join(process.resourcesPath, 'default-projects', 'agents')
  }
  return join(app.getAppPath(), 'resources', 'default-projects', 'agents')
}

/**
 * Returns the agents directory for a project and engine.
 */
function getAgentsDir(projectDir: string, engineDir: string = '.claude'): string {
  return join(projectDir, engineDir, 'agents')
}

/**
 * Copies default agent files from the app resources into a project's
 * agent directories. Copies to both .claude/agents/ and .gemini/agents/
 * so agents are available regardless of which engine is used.
 * Existing agents are not overwritten.
 */
export async function copyDefaultAgents(projectDir: string): Promise<void> {
  const source = getDefaultAgentsSource()

  let sourceEntries: string[]
  try {
    sourceEntries = await readdir(source)
  } catch {
    // No default agents bundled — nothing to copy
    return
  }

  const destinations = [
    getAgentsDir(projectDir, '.claude'),
    getAgentsDir(projectDir, '.gemini')
  ]

  for (const dest of destinations) {
    await ensureDir(dest)
    for (const entry of sourceEntries) {
      const srcPath = join(source, entry)
      const destPath = join(dest, entry)
      try {
        await cp(srcPath, destPath, { recursive: true, force: false })
      } catch {
        // Skip files that already exist or cannot be copied
      }
    }
  }
}

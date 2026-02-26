import { readdir, cp, mkdir } from 'fs/promises'
import { join } from 'path'
import { app } from 'electron'
import { ensureDir } from '../util/paths'

/**
 * Returns the path to the bundled default skills in resources.
 * In dev mode: resources/default-projects/skills/
 * In production: process.resourcesPath/default-projects/skills/
 */
function getDefaultSkillsSource(): string {
  if (app.isPackaged) {
    return join(process.resourcesPath, 'default-projects', 'skills')
  }
  return join(app.getAppPath(), 'resources', 'default-projects', 'skills')
}

/**
 * Returns the skills directory for a project.
 * Skills live in .claude/skills/ inside the project directory.
 */
function getSkillsDir(projectDir: string): string {
  return join(projectDir, '.claude', 'skills')
}

/**
 * Copies default skill files from the app resources into a project's
 * skills directories. Copies to both .claude/skills/ and .gemini/skills/
 * so skills are available regardless of which engine is used.
 * Existing skills are not overwritten.
 */
export async function copyDefaultSkills(projectDir: string): Promise<void> {
  const source = getDefaultSkillsSource()

  let sourceEntries: string[]
  try {
    sourceEntries = await readdir(source)
  } catch {
    // No default skills bundled — nothing to copy
    return
  }

  const destinations = [
    getSkillsDir(projectDir),
    join(projectDir, '.gemini', 'skills')
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

export interface SkillFile {
  name: string
  path: string
}

/**
 * Lists all .md skill files in a project's .claude/skills/ directory.
 * Scans recursively through subdirectories.
 */
export async function listSkills(projectDir: string): Promise<SkillFile[]> {
  const skillsDir = getSkillsDir(projectDir)
  const skills: SkillFile[] = []

  try {
    await collectSkillFiles(skillsDir, skills)
  } catch {
    // Skills directory may not exist
  }

  return skills
}

/**
 * Recursively collects .md files from a directory.
 */
async function collectSkillFiles(
  dir: string,
  results: SkillFile[]
): Promise<void> {
  let entries: string[]
  try {
    entries = await readdir(dir)
  } catch {
    return
  }

  const { stat } = await import('fs/promises')

  for (const entry of entries) {
    const fullPath = join(dir, entry)
    try {
      const info = await stat(fullPath)
      if (info.isDirectory()) {
        await collectSkillFiles(fullPath, results)
      } else if (entry.endsWith('.md')) {
        results.push({ name: entry, path: fullPath })
      }
    } catch {
      // Skip inaccessible entries
    }
  }
}

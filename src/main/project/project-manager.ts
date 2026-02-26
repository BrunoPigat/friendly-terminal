import { readdir, stat, mkdir, rm, writeFile } from 'fs/promises'
import { join } from 'path'
import { getProjectsDir, ensureDir } from '../util/paths'
import { copyDefaultSkills } from './skills-manager'
import { copyDefaultAgents } from './agents-manager'
import { createDefaultInstructionFiles } from './engine-instructions'

export interface Project {
  name: string
  path: string
  createdAt: string
}

/**
 * Lists all projects by scanning the projects directory.
 * Every subdirectory = a project.
 */
export async function listProjects(): Promise<Project[]> {
  const projectsDir = getProjectsDir()
  await ensureDir(projectsDir)

  let entries: string[]
  try {
    entries = await readdir(projectsDir)
  } catch {
    return []
  }

  const projects: Project[] = []
  for (const entry of entries) {
    const fullPath = join(projectsDir, entry)
    try {
      const info = await stat(fullPath)
      if (info.isDirectory()) {
        projects.push({
          name: entry,
          path: fullPath,
          createdAt: info.birthtime.toISOString()
        })
      }
    } catch {
      // Skip entries we can't stat
    }
  }

  projects.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
  return projects
}

/**
 * Creates a new project folder.
 */
export async function createProject(name: string): Promise<Project> {
  const projectsDir = getProjectsDir()
  await ensureDir(projectsDir)

  const projectDir = join(projectsDir, name)
  await mkdir(projectDir, { recursive: true })

  // Create empty tips.md — tips will be populated by the tip-creator skill
  const tipsPath = join(projectDir, 'tips.md')
  await writeFile(tipsPath, '', 'utf-8')

  // Copy default skills into .claude/skills/
  await copyDefaultSkills(projectDir)

  // Copy default agents into .claude/agents/ and .gemini/agents/
  await copyDefaultAgents(projectDir)

  // Create default instruction files (CLAUDE.md, GEMINI.md)
  await createDefaultInstructionFiles(projectDir, name)

  const info = await stat(projectDir)
  console.log(`[project-manager] created project "${name}" at ${projectDir}`)

  return {
    name,
    path: projectDir,
    createdAt: info.birthtime.toISOString()
  }
}

/**
 * Deletes a project folder.
 */
export async function deleteProject(name: string): Promise<boolean> {
  const projectDir = join(getProjectsDir(), name)
  try {
    await rm(projectDir, { recursive: true, force: true })
    console.log(`[project-manager] deleted project "${name}"`)
    return true
  } catch {
    return false
  }
}

/**
 * Returns the path for a project by name.
 */
export function getProjectPath(name: string): string {
  return join(getProjectsDir(), name)
}

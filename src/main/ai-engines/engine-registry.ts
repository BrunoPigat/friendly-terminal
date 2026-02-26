import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

export interface AIEngine {
  id: 'claude' | 'gemini'
  name: string
  command: string
  detectCommand: string
  isAvailable: boolean
}

const ENGINE_DEFINITIONS: Omit<AIEngine, 'isAvailable'>[] = [
  {
    id: 'claude',
    name: 'Claude Code',
    command: 'claude',
    detectCommand: 'claude'
  },
  {
    id: 'gemini',
    name: 'Gemini CLI',
    command: 'gemini',
    detectCommand: 'gemini'
  }
]

/**
 * Checks whether a command is available in the system PATH.
 * Uses `where` on Windows and `which` on other platforms.
 */
async function isCommandAvailable(command: string): Promise<boolean> {
  const whichCmd = process.platform === 'win32' ? 'where' : 'which'
  try {
    await execFileAsync(whichCmd, [command], { timeout: 5000 })
    return true
  } catch {
    return false
  }
}

/**
 * Detects which AI engines are installed and available on the system.
 */
export async function detectEngines(): Promise<AIEngine[]> {
  const results = await Promise.all(
    ENGINE_DEFINITIONS.map(async (def) => {
      const available = await isCommandAvailable(def.detectCommand)
      return { ...def, isAvailable: available }
    })
  )
  return results
}

/**
 * Returns only the engines that are currently available.
 */
export async function getAvailableEngines(): Promise<AIEngine[]> {
  const engines = await detectEngines()
  return engines.filter((e) => e.isAvailable)
}

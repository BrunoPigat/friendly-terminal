import { AIEngine } from './engine-registry'

/**
 * Gemini CLI engine definition.
 *
 * Gemini CLI is Google's AI coding assistant for the terminal.
 * It is invoked via the `gemini` command and supports:
 * - Interactive REPL sessions
 * - MCP server integration via .gemini/settings.json
 * - Slash commands for in-session management
 */
export const geminiEngine: Omit<AIEngine, 'isAvailable'> = {
  id: 'gemini',
  name: 'Gemini CLI',
  command: 'gemini',
  detectCommand: 'gemini'
}

/**
 * Environment variables to set when launching Gemini CLI sessions.
 */
export function getGeminiEnv(projectDir: string): Record<string, string> {
  return {
    GEMINI_PROJECT_DIR: projectDir
  }
}

/**
 * Arguments to pass when spawning Gemini CLI.
 */
export function getGeminiSpawnArgs(_options?: {
  sandbox?: boolean
}): string[] {
  const args: string[] = []
  // Gemini CLI does not currently have a skip-permissions equivalent
  return args
}

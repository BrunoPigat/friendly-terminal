import { AIEngine } from './engine-registry'

/**
 * OpenAI Codex CLI engine definition.
 *
 * Codex CLI is OpenAI's AI coding assistant for the terminal.
 * It is invoked via the `codex` command and supports:
 * - Interactive REPL sessions
 * - MCP server integration via config
 * - Slash commands (/compact, /new, /quit)
 * - File context via @filepath syntax
 * - The --full-auto flag for automated workflows
 * - Session resumption via --resume
 */
export const codexEngine: Omit<AIEngine, 'isAvailable'> = {
  id: 'codex',
  name: 'Codex CLI',
  command: 'codex',
  detectCommand: 'codex'
}

/**
 * Environment variables to set when launching Codex CLI sessions.
 * Codex reads codex.md / AGENTS.md from CWD, no special env var needed.
 */
export function getCodexEnv(_projectDir: string): Record<string, string> {
  return {}
}

/**
 * Arguments to pass when spawning Codex CLI.
 */
export function getCodexSpawnArgs(options?: {
  resume?: boolean
  skipPermissions?: boolean
}): string[] {
  const args: string[] = []

  if (options?.skipPermissions) {
    args.push('--full-auto')
  }

  if (options?.resume) {
    args.push('--resume')
  }

  return args
}

import { AIEngine } from './engine-registry'

/**
 * Claude Code engine definition.
 *
 * Claude Code is Anthropic's CLI-based AI coding assistant.
 * It is invoked via the `claude` command and supports:
 * - Interactive REPL sessions
 * - MCP server integration via .mcp.json
 * - Slash commands for in-session management
 * - The --dangerously-skip-permissions flag for automated workflows
 * - Session continuation via --continue
 */
export const claudeEngine: Omit<AIEngine, 'isAvailable'> = {
  id: 'claude',
  name: 'Claude Code',
  command: 'claude',
  detectCommand: 'claude'
}

/**
 * Environment variables to set when launching Claude Code sessions.
 */
export function getClaudeEnv(projectDir: string): Record<string, string> {
  return {
    CLAUDE_PROJECT_DIR: projectDir
  }
}

/**
 * Arguments to pass when spawning Claude Code.
 */
export function getClaudeSpawnArgs(options?: {
  continue?: boolean
  skipPermissions?: boolean
}): string[] {
  const args: string[] = []

  if (options?.skipPermissions) {
    args.push('--dangerously-skip-permissions')
  }

  if (options?.continue) {
    args.push('--continue')
  }

  return args
}

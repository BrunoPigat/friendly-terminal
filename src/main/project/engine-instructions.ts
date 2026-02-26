import { writeFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

/**
 * Maps engine IDs to their instruction file names.
 * Claude Code reads CLAUDE.md, Gemini CLI reads GEMINI.md.
 */
const ENGINE_INSTRUCTION_FILES: Record<string, string> = {
  claude: 'CLAUDE.md',
  gemini: 'GEMINI.md'
}

/**
 * Returns the default instruction content for a given engine.
 * Both engines get the same behavioral rules, just addressed to the right tool.
 */
function getDefaultInstructions(engineId: string, projectName: string): string {
  const autoTipRule =
    'After every response, run the `tip-creator` skill to analyze the conversation and replace `tips.md` with fresh actionable next steps. Always overwrite the entire file — never append. Do this silently at the end — do not mention it to the user.'

  if (engineId === 'gemini') {
    return `# Project: ${projectName}

## Rules

- ${autoTipRule}
`
  }

  // Claude (default)
  return `# Project: ${projectName}

## Rules

- ${autoTipRule}
`
}

/**
 * Creates default instruction files (CLAUDE.md, GEMINI.md) in the project root.
 * Existing files are not overwritten.
 */
export async function createDefaultInstructionFiles(
  projectDir: string,
  projectName: string
): Promise<void> {
  for (const [engineId, filename] of Object.entries(ENGINE_INSTRUCTION_FILES)) {
    const filePath = join(projectDir, filename)
    if (existsSync(filePath)) continue

    try {
      const content = getDefaultInstructions(engineId, projectName)
      await writeFile(filePath, content, 'utf-8')
    } catch {
      // Non-critical — skip if we can't write
    }
  }
}

/**
 * ANSI escape code stripping and terminal output normalization.
 */

// Matches all ANSI escape sequences: CSI, OSC, ESC single-char, etc.
const ANSI_RE =
  // eslint-disable-next-line no-control-regex
  /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><~]/g

/**
 * Remove all ANSI escape sequences from a string.
 */
export function stripAnsi(text: string): string {
  return text.replace(ANSI_RE, '')
}

/**
 * Normalize terminal output:
 * - Strip ANSI codes
 * - Handle carriage returns (spinner overwriting lines)
 * - Collapse excessive blank lines
 */
export function normalizeOutput(raw: string): string {
  let text = stripAnsi(raw)

  // Handle carriage returns — keep only the last write on each line
  text = text
    .split('\n')
    .map((line) => {
      if (line.includes('\r')) {
        const parts = line.split('\r')
        // Last non-empty segment is what's visible
        return parts.filter((p) => p.length > 0).pop() ?? ''
      }
      return line
    })
    .join('\n')

  // Collapse 3+ consecutive blank lines into 2
  text = text.replace(/\n{3,}/g, '\n\n')

  return text.trim()
}

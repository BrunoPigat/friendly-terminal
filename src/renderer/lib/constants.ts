import type { ITerminalOptions } from '@xterm/xterm'

export const APP_NAME = 'Your Friendly Terminal'

/**
 * Supported AI coding engines.
 */
export const ENGINE_NAMES = {
  claude: 'Claude Code',
  gemini: 'Gemini CLI'
} as const

export type EngineId = keyof typeof ENGINE_NAMES

/**
 * Default xterm.js terminal options.
 * JetBrains Mono 14px, dark zinc palette.
 */
export const DEFAULT_TERMINAL_OPTIONS: ITerminalOptions = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 14,
  fontWeight: '400',
  lineHeight: 1.3,
  cursorBlink: true,
  cursorStyle: 'bar',
  scrollback: 10_000,
  allowProposedApi: true,
  theme: {
    background: '#09090b', // zinc-950
    foreground: '#fafafa', // zinc-50
    cursor: '#fafafa',
    cursorAccent: '#09090b',
    selectionBackground: '#3f3f4680', // zinc-700 semi-transparent
    selectionForeground: '#fafafa',
    black: '#09090b',
    red: '#ef4444',
    green: '#22c55e',
    yellow: '#eab308',
    blue: '#3b82f6',
    magenta: '#a855f7',
    cyan: '#06b6d4',
    white: '#fafafa',
    brightBlack: '#52525b',
    brightRed: '#f87171',
    brightGreen: '#4ade80',
    brightYellow: '#facc15',
    brightBlue: '#60a5fa',
    brightMagenta: '#c084fc',
    brightCyan: '#22d3ee',
    brightWhite: '#ffffff'
  }
}

/**
 * Default sidebar width in pixels.
 */
export const DEFAULT_SIDEBAR_WIDTH = 280

/**
 * Min / max sidebar resize bounds.
 */
export const SIDEBAR_MIN_WIDTH = 200
export const SIDEBAR_MAX_WIDTH = 500

import type { ITheme } from '@xterm/xterm'

export interface TerminalThemeDefinition {
  id: string
  name: string
  colors: ITheme
}

export const DEFAULT_THEME_ID = 'vscode-dark'

export const TERMINAL_THEMES: TerminalThemeDefinition[] = [
  {
    id: 'vscode-dark',
    name: 'VS Code Dark',
    colors: {
      background: '#1E1E1E',
      foreground: '#D4D4D4',
      cursor: '#D4D4D4',
      cursorAccent: '#1E1E1E',
      selectionBackground: '#264F7840',
      selectionForeground: '#D4D4D4',
      black: '#1E1E1E',
      red: '#F44747',
      green: '#6A9955',
      yellow: '#D7BA7D',
      blue: '#569CD6',
      magenta: '#C586C0',
      cyan: '#4EC9B0',
      white: '#D4D4D4',
      brightBlack: '#808080',
      brightRed: '#F44747',
      brightGreen: '#6A9955',
      brightYellow: '#D7BA7D',
      brightBlue: '#569CD6',
      brightMagenta: '#C586C0',
      brightCyan: '#4EC9B0',
      brightWhite: '#FFFFFF'
    }
  },
  {
    id: 'dracula',
    name: 'Dracula',
    colors: {
      background: '#282A36',
      foreground: '#F8F8F2',
      cursor: '#F8F8F2',
      cursorAccent: '#282A36',
      selectionBackground: '#44475A80',
      selectionForeground: '#F8F8F2',
      black: '#21222C',
      red: '#FF5555',
      green: '#50FA7B',
      yellow: '#F1FA8C',
      blue: '#BD93F9',
      magenta: '#FF79C6',
      cyan: '#8BE9FD',
      white: '#F8F8F2',
      brightBlack: '#6272A4',
      brightRed: '#FF6E6E',
      brightGreen: '#69FF94',
      brightYellow: '#FFFFA5',
      brightBlue: '#D6ACFF',
      brightMagenta: '#FF92DF',
      brightCyan: '#A4FFFF',
      brightWhite: '#FFFFFF'
    }
  },
  {
    id: 'monokai',
    name: 'Monokai',
    colors: {
      background: '#272822',
      foreground: '#F8F8F2',
      cursor: '#F8F8F0',
      cursorAccent: '#272822',
      selectionBackground: '#49483E80',
      selectionForeground: '#F8F8F2',
      black: '#272822',
      red: '#F92672',
      green: '#A6E22E',
      yellow: '#E6DB74',
      blue: '#66D9EF',
      magenta: '#AE81FF',
      cyan: '#A1EFE4',
      white: '#F8F8F2',
      brightBlack: '#75715E',
      brightRed: '#F92672',
      brightGreen: '#A6E22E',
      brightYellow: '#E6DB74',
      brightBlue: '#66D9EF',
      brightMagenta: '#AE81FF',
      brightCyan: '#A1EFE4',
      brightWhite: '#F9F8F5'
    }
  },
  {
    id: 'solarized-dark',
    name: 'Solarized Dark',
    colors: {
      background: '#002B36',
      foreground: '#839496',
      cursor: '#839496',
      cursorAccent: '#002B36',
      selectionBackground: '#073642',
      selectionForeground: '#93A1A1',
      black: '#073642',
      red: '#DC322F',
      green: '#859900',
      yellow: '#B58900',
      blue: '#268BD2',
      magenta: '#D33682',
      cyan: '#2AA198',
      white: '#EEE8D5',
      brightBlack: '#586E75',
      brightRed: '#CB4B16',
      brightGreen: '#586E75',
      brightYellow: '#657B83',
      brightBlue: '#839496',
      brightMagenta: '#6C71C4',
      brightCyan: '#93A1A1',
      brightWhite: '#FDF6E3'
    }
  },
  {
    id: 'one-dark',
    name: 'One Dark',
    colors: {
      background: '#282C34',
      foreground: '#ABB2BF',
      cursor: '#528BFF',
      cursorAccent: '#282C34',
      selectionBackground: '#3E445180',
      selectionForeground: '#ABB2BF',
      black: '#282C34',
      red: '#E06C75',
      green: '#98C379',
      yellow: '#E5C07B',
      blue: '#61AFEF',
      magenta: '#C678DD',
      cyan: '#56B6C2',
      white: '#ABB2BF',
      brightBlack: '#5C6370',
      brightRed: '#E06C75',
      brightGreen: '#98C379',
      brightYellow: '#E5C07B',
      brightBlue: '#61AFEF',
      brightMagenta: '#C678DD',
      brightCyan: '#56B6C2',
      brightWhite: '#FFFFFF'
    }
  },
  {
    id: 'nord',
    name: 'Nord',
    colors: {
      background: '#2E3440',
      foreground: '#D8DEE9',
      cursor: '#D8DEE9',
      cursorAccent: '#2E3440',
      selectionBackground: '#434C5E80',
      selectionForeground: '#D8DEE9',
      black: '#3B4252',
      red: '#BF616A',
      green: '#A3BE8C',
      yellow: '#EBCB8B',
      blue: '#81A1C1',
      magenta: '#B48EAD',
      cyan: '#88C0D0',
      white: '#E5E9F0',
      brightBlack: '#4C566A',
      brightRed: '#BF616A',
      brightGreen: '#A3BE8C',
      brightYellow: '#EBCB8B',
      brightBlue: '#81A1C1',
      brightMagenta: '#B48EAD',
      brightCyan: '#8FBCBB',
      brightWhite: '#ECEFF4'
    }
  },
  {
    id: 'gruvbox-dark',
    name: 'Gruvbox Dark',
    colors: {
      background: '#282828',
      foreground: '#EBDBB2',
      cursor: '#EBDBB2',
      cursorAccent: '#282828',
      selectionBackground: '#3C383680',
      selectionForeground: '#EBDBB2',
      black: '#282828',
      red: '#CC241D',
      green: '#98971A',
      yellow: '#D79921',
      blue: '#458588',
      magenta: '#B16286',
      cyan: '#689D6A',
      white: '#A89984',
      brightBlack: '#928374',
      brightRed: '#FB4934',
      brightGreen: '#B8BB26',
      brightYellow: '#FABD2F',
      brightBlue: '#83A598',
      brightMagenta: '#D3869B',
      brightCyan: '#8EC07C',
      brightWhite: '#EBDBB2'
    }
  },
  {
    id: 'tokyo-night',
    name: 'Tokyo Night',
    colors: {
      background: '#1A1B26',
      foreground: '#A9B1D6',
      cursor: '#C0CAF5',
      cursorAccent: '#1A1B26',
      selectionBackground: '#33467C80',
      selectionForeground: '#A9B1D6',
      black: '#15161E',
      red: '#F7768E',
      green: '#9ECE6A',
      yellow: '#E0AF68',
      blue: '#7AA2F7',
      magenta: '#BB9AF7',
      cyan: '#7DCFFF',
      white: '#A9B1D6',
      brightBlack: '#414868',
      brightRed: '#F7768E',
      brightGreen: '#9ECE6A',
      brightYellow: '#E0AF68',
      brightBlue: '#7AA2F7',
      brightMagenta: '#BB9AF7',
      brightCyan: '#7DCFFF',
      brightWhite: '#C0CAF5'
    }
  },
  // ── Light themes ──
  {
    id: 'vscode-light',
    name: 'VS Code Light',
    colors: {
      background: '#FFFFFF',
      foreground: '#333333',
      cursor: '#333333',
      cursorAccent: '#FFFFFF',
      selectionBackground: '#ADD6FF80',
      selectionForeground: '#333333',
      black: '#000000',
      red: '#CD3131',
      green: '#00BC00',
      yellow: '#949800',
      blue: '#0451A5',
      magenta: '#BC05BC',
      cyan: '#0598BC',
      white: '#555555',
      brightBlack: '#666666',
      brightRed: '#CD3131',
      brightGreen: '#14CE14',
      brightYellow: '#B5BA00',
      brightBlue: '#0451A5',
      brightMagenta: '#BC05BC',
      brightCyan: '#0598BC',
      brightWhite: '#A5A5A5'
    }
  },
  {
    id: 'github-light',
    name: 'GitHub Light',
    colors: {
      background: '#FFFFFF',
      foreground: '#24292E',
      cursor: '#044289',
      cursorAccent: '#FFFFFF',
      selectionBackground: '#0366D625',
      selectionForeground: '#24292E',
      black: '#24292E',
      red: '#D73A49',
      green: '#22863A',
      yellow: '#B08800',
      blue: '#0366D6',
      magenta: '#6F42C1',
      cyan: '#1B7C83',
      white: '#6A737D',
      brightBlack: '#959DA5',
      brightRed: '#CB2431',
      brightGreen: '#28A745',
      brightYellow: '#DBAB09',
      brightBlue: '#2188FF',
      brightMagenta: '#8A63D2',
      brightCyan: '#3192AA',
      brightWhite: '#D1D5DA'
    }
  },
  {
    id: 'solarized-light',
    name: 'Solarized Light',
    colors: {
      background: '#FDF6E3',
      foreground: '#657B83',
      cursor: '#657B83',
      cursorAccent: '#FDF6E3',
      selectionBackground: '#EEE8D5',
      selectionForeground: '#586E75',
      black: '#073642',
      red: '#DC322F',
      green: '#859900',
      yellow: '#B58900',
      blue: '#268BD2',
      magenta: '#D33682',
      cyan: '#2AA198',
      white: '#EEE8D5',
      brightBlack: '#002B36',
      brightRed: '#CB4B16',
      brightGreen: '#586E75',
      brightYellow: '#657B83',
      brightBlue: '#839496',
      brightMagenta: '#6C71C4',
      brightCyan: '#93A1A1',
      brightWhite: '#FDF6E3'
    }
  },
  {
    id: 'one-light',
    name: 'One Light',
    colors: {
      background: '#FAFAFA',
      foreground: '#383A42',
      cursor: '#526FFF',
      cursorAccent: '#FAFAFA',
      selectionBackground: '#E5E5E6',
      selectionForeground: '#383A42',
      black: '#383A42',
      red: '#E45649',
      green: '#50A14F',
      yellow: '#C18401',
      blue: '#4078F2',
      magenta: '#A626A4',
      cyan: '#0184BC',
      white: '#A0A1A7',
      brightBlack: '#4F525E',
      brightRed: '#E06C75',
      brightGreen: '#98C379',
      brightYellow: '#E5C07B',
      brightBlue: '#61AFEF',
      brightMagenta: '#C678DD',
      brightCyan: '#56B6C2',
      brightWhite: '#FFFFFF'
    }
  }
]

/**
 * Resolves a terminal theme by ID. Returns the preset colors, or the custom
 * theme object when themeId is 'custom'.
 * Falls back to VS Code Dark if the ID is unknown and no custom theme is provided.
 */
export function resolveTerminalTheme(themeId: string, customTheme?: ITheme | null): ITheme {
  if (themeId === 'custom' && customTheme) {
    return customTheme
  }
  const preset = TERMINAL_THEMES.find((t) => t.id === themeId)
  return preset?.colors ?? TERMINAL_THEMES[0].colors
}

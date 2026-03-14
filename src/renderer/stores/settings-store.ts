import { create } from 'zustand'
import type { ITheme } from '@xterm/xterm'
import type { EngineId } from '@/lib/constants'
import { DEFAULT_SIDEBAR_WIDTH } from '@/lib/constants'
import { DEFAULT_THEME_ID, resolveTerminalTheme } from '@/lib/terminal-themes'
import * as api from '@/lib/api'

export type RightPanelTab = 'tips' | 'agents' | 'skills' | 'mcps' | 'git' | 'canvas'
export type CanvasMode = 'panel' | 'full' | 'bottom'

interface SettingsState {
  defaultEngine: EngineId
  sidebarWidth: number
  sidebarCollapsed: boolean
  rightPanelWidth: number
  rightPanelActiveTab: RightPanelTab
  canvasMode: CanvasMode
  canvasFullWidth: number
  canvasBottomHeight: number
  minifiedView: boolean
  showSettingsDialog: boolean
  terminalTheme: string
  terminalThemeCustom: ITheme | null
  loaded: boolean

  loadSettings: () => Promise<void>
  updateSetting: <K extends keyof SettingsData>(key: K, value: SettingsData[K]) => Promise<void>
  setSidebarWidth: (width: number) => void
  toggleSidebar: () => void
  setRightPanelWidth: (width: number) => void
  setRightPanelActiveTab: (tab: RightPanelTab) => void
  setCanvasMode: (mode: CanvasMode) => void
  setCanvasFullWidth: (width: number) => void
  setCanvasBottomHeight: (height: number) => void
  toggleMinifiedView: () => void
  setShowSettingsDialog: (show: boolean) => void
  getResolvedTheme: () => ITheme
}

interface SettingsData {
  defaultEngine: EngineId
  sidebarWidth: number
  sidebarCollapsed: boolean
  rightPanelWidth: number
  terminalTheme: string
  terminalThemeCustom: ITheme | null
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  defaultEngine: 'claude',
  sidebarWidth: DEFAULT_SIDEBAR_WIDTH,
  sidebarCollapsed: false,
  rightPanelWidth: 400,
  rightPanelActiveTab: 'tips',
  canvasMode: 'panel',
  canvasFullWidth: 600,
  canvasBottomHeight: 300,
  minifiedView: false,
  showSettingsDialog: false,
  terminalTheme: DEFAULT_THEME_ID,
  terminalThemeCustom: null,
  loaded: false,

  loadSettings: async () => {
    try {
      const [defaultEngine, sidebarWidth, sidebarCollapsed, rightPanelWidth, terminalTheme, terminalThemeCustom] = await Promise.all([
        api.getSetting('defaultEngine'),
        api.getSetting('sidebarWidth'),
        api.getSetting('sidebarCollapsed'),
        api.getSetting('rightPanelWidth'),
        api.getSetting('terminalTheme'),
        api.getSetting('terminalThemeCustom')
      ])
      set({
        defaultEngine: (defaultEngine as EngineId) ?? 'claude',
        sidebarWidth: (sidebarWidth as number) ?? DEFAULT_SIDEBAR_WIDTH,
        sidebarCollapsed: (sidebarCollapsed as boolean) ?? false,
        rightPanelWidth: (rightPanelWidth as number) ?? 340,
        terminalTheme: (terminalTheme as string) ?? DEFAULT_THEME_ID,
        terminalThemeCustom: (terminalThemeCustom as ITheme | null) ?? null,
        loaded: true
      })
    } catch (err) {
      console.error('Failed to load settings:', err)
      set({ loaded: true })
    }
  },

  updateSetting: async (key, value) => {
    set({ [key]: value } as Partial<SettingsState>)
    try {
      await api.setSetting(key, value)
    } catch (err) {
      console.error(`Failed to persist setting "${key}":`, err)
    }
  },

  setSidebarWidth: (width) => {
    set({ sidebarWidth: width })
  },

  toggleSidebar: () => {
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }))
  },

  setRightPanelWidth: (width) => {
    set({ rightPanelWidth: width })
  },

  setRightPanelActiveTab: (tab) => {
    set({ rightPanelActiveTab: tab })
  },

  setCanvasMode: (mode) => {
    set({ canvasMode: mode })
  },

  setCanvasFullWidth: (width) => {
    set({ canvasFullWidth: width })
  },

  setCanvasBottomHeight: (height) => {
    set({ canvasBottomHeight: height })
  },

  setShowSettingsDialog: (show) => {
    set({ showSettingsDialog: show })
  },

  getResolvedTheme: () => {
    const { terminalTheme, terminalThemeCustom } = get()
    return resolveTerminalTheme(terminalTheme, terminalThemeCustom)
  },

  toggleMinifiedView: () => {
    set((state) => {
      const next = !state.minifiedView
      api.windowSetFocusMode(next)
      return { minifiedView: next }
    })
  }
}))

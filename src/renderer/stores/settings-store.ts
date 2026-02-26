import { create } from 'zustand'
import type { EngineId } from '@/lib/constants'
import { DEFAULT_SIDEBAR_WIDTH } from '@/lib/constants'
import * as api from '@/lib/api'

export type RightPanelTab = 'tips' | 'agents' | 'skills' | 'mcps'

interface SettingsState {
  defaultEngine: EngineId
  sidebarWidth: number
  sidebarCollapsed: boolean
  rightPanelWidth: number
  rightPanelActiveTab: RightPanelTab
  minifiedView: boolean
  loaded: boolean

  loadSettings: () => Promise<void>
  updateSetting: <K extends keyof SettingsData>(key: K, value: SettingsData[K]) => Promise<void>
  setSidebarWidth: (width: number) => void
  toggleSidebar: () => void
  setRightPanelWidth: (width: number) => void
  setRightPanelActiveTab: (tab: RightPanelTab) => void
  toggleMinifiedView: () => void
}

interface SettingsData {
  defaultEngine: EngineId
  sidebarWidth: number
  sidebarCollapsed: boolean
  rightPanelWidth: number
}

export const useSettingsStore = create<SettingsState>((set) => ({
  defaultEngine: 'claude',
  sidebarWidth: DEFAULT_SIDEBAR_WIDTH,
  sidebarCollapsed: false,
  rightPanelWidth: 340,
  rightPanelActiveTab: 'tips',
  minifiedView: false,
  loaded: false,

  loadSettings: async () => {
    try {
      const [defaultEngine, sidebarWidth, sidebarCollapsed, rightPanelWidth] = await Promise.all([
        api.getSetting('defaultEngine'),
        api.getSetting('sidebarWidth'),
        api.getSetting('sidebarCollapsed'),
        api.getSetting('rightPanelWidth')
      ])
      set({
        defaultEngine: (defaultEngine as EngineId) ?? 'claude',
        sidebarWidth: (sidebarWidth as number) ?? DEFAULT_SIDEBAR_WIDTH,
        sidebarCollapsed: (sidebarCollapsed as boolean) ?? false,
        rightPanelWidth: (rightPanelWidth as number) ?? 340,
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

  toggleMinifiedView: () => {
    set((state) => ({ minifiedView: !state.minifiedView }))
  }
}))

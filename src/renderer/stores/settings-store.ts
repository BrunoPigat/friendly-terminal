import { create } from 'zustand'
import type { EngineId } from '@/lib/constants'
import { DEFAULT_SIDEBAR_WIDTH } from '@/lib/constants'
import * as api from '@/lib/api'

interface SettingsState {
  defaultEngine: EngineId
  sidebarWidth: number
  sidebarCollapsed: boolean
  loaded: boolean

  loadSettings: () => Promise<void>
  updateSetting: <K extends keyof SettingsData>(key: K, value: SettingsData[K]) => Promise<void>
  setSidebarWidth: (width: number) => void
  toggleSidebar: () => void
}

interface SettingsData {
  defaultEngine: EngineId
  sidebarWidth: number
  sidebarCollapsed: boolean
}

export const useSettingsStore = create<SettingsState>((set) => ({
  defaultEngine: 'claude',
  sidebarWidth: DEFAULT_SIDEBAR_WIDTH,
  sidebarCollapsed: false,
  loaded: false,

  loadSettings: async () => {
    try {
      const [defaultEngine, sidebarWidth, sidebarCollapsed] = await Promise.all([
        api.getSetting('defaultEngine'),
        api.getSetting('sidebarWidth'),
        api.getSetting('sidebarCollapsed')
      ])
      set({
        defaultEngine: (defaultEngine as EngineId) ?? 'claude',
        sidebarWidth: (sidebarWidth as number) ?? DEFAULT_SIDEBAR_WIDTH,
        sidebarCollapsed: (sidebarCollapsed as boolean) ?? false,
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
  }
}))

import { create } from 'zustand'
import type { Project } from '@/lib/api'
import type { TerminalEntry } from './terminal-types'
import { generateTerminalId } from './terminal-types'
import { ENGINE_NAMES, type EngineId } from '@/lib/constants'
import * as api from '@/lib/api'

export interface PanelColor {
  accent: string   // e.g. 'bg-rose-400'   — top strip
  bg: string       // e.g. 'bg-rose-50'    — header bg
  bgHover: string  // e.g. 'hover:bg-rose-100'
  border: string   // e.g. 'border-rose-200'
  icon: string     // e.g. 'text-rose-500'
  badge: string    // e.g. 'bg-rose-100 text-rose-600'
  hint: string     // e.g. 'text-rose-400'
}

const PANEL_COLORS: PanelColor[] = [
  { accent: 'bg-violet-400', bg: 'bg-violet-50', bgHover: 'hover:bg-violet-100', border: 'border-violet-200', icon: 'text-violet-500', badge: 'bg-violet-100 text-violet-600', hint: 'text-violet-400' },
  { accent: 'bg-sky-400', bg: 'bg-sky-50', bgHover: 'hover:bg-sky-100', border: 'border-sky-200', icon: 'text-sky-500', badge: 'bg-sky-100 text-sky-600', hint: 'text-sky-400' },
  { accent: 'bg-emerald-400', bg: 'bg-emerald-50', bgHover: 'hover:bg-emerald-100', border: 'border-emerald-200', icon: 'text-emerald-500', badge: 'bg-emerald-100 text-emerald-600', hint: 'text-emerald-400' },
  { accent: 'bg-amber-400', bg: 'bg-amber-50', bgHover: 'hover:bg-amber-100', border: 'border-amber-200', icon: 'text-amber-500', badge: 'bg-amber-100 text-amber-600', hint: 'text-amber-400' },
  { accent: 'bg-rose-400', bg: 'bg-rose-50', bgHover: 'hover:bg-rose-100', border: 'border-rose-200', icon: 'text-rose-500', badge: 'bg-rose-100 text-rose-600', hint: 'text-rose-400' },
  { accent: 'bg-teal-400', bg: 'bg-teal-50', bgHover: 'hover:bg-teal-100', border: 'border-teal-200', icon: 'text-teal-500', badge: 'bg-teal-100 text-teal-600', hint: 'text-teal-400' },
  { accent: 'bg-fuchsia-400', bg: 'bg-fuchsia-50', bgHover: 'hover:bg-fuchsia-100', border: 'border-fuchsia-200', icon: 'text-fuchsia-500', badge: 'bg-fuchsia-100 text-fuchsia-600', hint: 'text-fuchsia-400' },
  { accent: 'bg-cyan-400', bg: 'bg-cyan-50', bgHover: 'hover:bg-cyan-100', border: 'border-cyan-200', icon: 'text-cyan-500', badge: 'bg-cyan-100 text-cyan-600', hint: 'text-cyan-400' },
]

let colorIndex = 0
function nextPanelColor(): PanelColor {
  const color = PANEL_COLORS[colorIndex % PANEL_COLORS.length]
  colorIndex++
  return color
}

export interface ProjectPanel {
  panelId: string
  project: Project
  color: PanelColor
  terminals: Map<string, TerminalEntry>
  activeTerminalId: string | null
}

/** Fixed width for compact (mobile-like) panels */
export const COMPACT_PANEL_WIDTH = 420
/** Minimum width needed for the active panel to show full UI (sidebar + main + right panel) */
export const MIN_ACTIVE_FULL_WIDTH = 700

let nextPanelId = 1

function generatePanelId(): string {
  return `panel-${nextPanelId++}`
}

function calcMaxPanels(windowWidth: number): number {
  // Each compact panel takes COMPACT_PANEL_WIDTH + 2px divider.
  // Active panel needs at least MIN_ACTIVE_FULL_WIDTH for full UI,
  // but can go minified (terminal-only) at a smaller width.
  // At minimum, the active panel needs ~400px even when minified.
  const minActiveWidth = 400
  return Math.max(1, Math.floor((windowWidth - minActiveWidth) / (COMPACT_PANEL_WIDTH + 2)) + 1)
}

interface SplitViewState {
  panels: ProjectPanel[]
  maxPanels: number
  focusedTerminalId: string | null

  // Internal lookup map: terminalId -> panelId
  _terminalToPanelMap: Map<string, string>

  openProject: (project: Project, defaultEngine: EngineId) => void
  closePanel: (panelId: string) => void
  activatePanel: (panelId: string) => void
  recalcMaxPanels: (windowWidth: number) => void

  // Per-panel terminal management
  addTerminal: (panelId: string, entry: TerminalEntry) => void
  removeTerminal: (panelId: string, terminalId: string) => void
  setActiveTerminal: (panelId: string, terminalId: string) => void
  updateTerminal: (panelId: string, terminalId: string, patch: Partial<TerminalEntry>) => void
  clearPanelTerminals: (panelId: string) => void

  setFocusedTerminalId: (terminalId: string | null) => void

  // Lookups
  getActivePanel: () => ProjectPanel | undefined
  getPanelByTerminalId: (terminalId: string) => ProjectPanel | undefined
  getPanelById: (panelId: string) => ProjectPanel | undefined
}

export const useSplitViewStore = create<SplitViewState>((set, get) => ({
  panels: [],
  maxPanels: calcMaxPanels(typeof window !== 'undefined' ? window.innerWidth : 1200),
  focusedTerminalId: null,
  _terminalToPanelMap: new Map(),

  openProject: (project, defaultEngine) => {
    const state = get()

    // If project already has a panel, activate it
    const existingIdx = state.panels.findIndex((p) => p.project.name === project.name)
    if (existingIdx !== -1) {
      get().activatePanel(state.panels[existingIdx].panelId)
      return
    }

    const panelId = generatePanelId()
    const termId = generateTerminalId()

    const initialTerminal: TerminalEntry = {
      id: termId,
      ptyId: null,
      name: `${ENGINE_NAMES[defaultEngine]} #1`,
      engine: defaultEngine,
      isActive: true,
      cwd: project.path,
      isLoading: true
    }

    const newPanel: ProjectPanel = {
      panelId,
      project,
      color: nextPanelColor(),
      terminals: new Map([[termId, initialTerminal]]),
      activeTerminalId: termId
    }

    // Collapse sidebar when adding a project alongside existing ones
    if (state.panels.length > 0) {
      import('./settings-store').then(({ useSettingsStore }) => {
        useSettingsStore.setState({ sidebarCollapsed: true })
      })
    }

    set((s) => {
      let panels = [...s.panels, newPanel]
      const newMap = new Map(s._terminalToPanelMap)
      newMap.set(termId, panelId)

      // Enforce maxPanels: remove oldest compact panels (leftmost)
      while (panels.length > s.maxPanels) {
        const removed = panels.shift()!
        // Kill PTYs for removed panel
        for (const tid of removed.terminals.keys()) {
          api.ptyKill(tid)
          newMap.delete(tid)
        }
      }

      return { panels, _terminalToPanelMap: newMap }
    })
  },

  closePanel: (panelId) => {
    set((s) => {
      const panel = s.panels.find((p) => p.panelId === panelId)
      if (!panel) return s

      // Kill all PTYs in this panel
      for (const tid of panel.terminals.keys()) {
        api.ptyKill(tid)
      }

      const newMap = new Map(s._terminalToPanelMap)
      for (const tid of panel.terminals.keys()) {
        newMap.delete(tid)
      }

      const panels = s.panels.filter((p) => p.panelId !== panelId)
      return { panels, _terminalToPanelMap: newMap }
    })
  },

  activatePanel: (panelId) => {
    set((s) => {
      const idx = s.panels.findIndex((p) => p.panelId === panelId)
      if (idx === -1 || idx === s.panels.length - 1) return s

      // Move the panel to the end (rightmost = active)
      const panels = [...s.panels]
      const [panel] = panels.splice(idx, 1)
      panels.push(panel)
      return { panels }
    })
  },

  recalcMaxPanels: (windowWidth) => {
    const newMax = calcMaxPanels(windowWidth)
    set((s) => {
      if (newMax === s.maxPanels) return s

      let panels = [...s.panels]
      const newMap = new Map(s._terminalToPanelMap)

      // Auto-close excess panels from the left
      while (panels.length > newMax) {
        const removed = panels.shift()!
        for (const tid of removed.terminals.keys()) {
          api.ptyKill(tid)
          newMap.delete(tid)
        }
      }

      return { maxPanels: newMax, panels, _terminalToPanelMap: newMap }
    })
  },

  addTerminal: (panelId, entry) => {
    set((s) => {
      const panels = s.panels.map((p) => {
        if (p.panelId !== panelId) return p
        // Enforce max 4 terminals per panel
        if (p.terminals.size >= 4) return p
        const terminals = new Map(p.terminals)
        // Deactivate all others
        for (const [key, t] of terminals) {
          if (t.isActive) terminals.set(key, { ...t, isActive: false })
        }
        terminals.set(entry.id, { ...entry, isActive: true })
        return { ...p, terminals, activeTerminalId: entry.id }
      })
      const newMap = new Map(s._terminalToPanelMap)
      newMap.set(entry.id, panelId)
      return { panels, _terminalToPanelMap: newMap }
    })
  },

  removeTerminal: (panelId, terminalId) => {
    set((s) => {
      const panels = s.panels.map((p) => {
        if (p.panelId !== panelId) return p
        const terminals = new Map(p.terminals)
        terminals.delete(terminalId)
        let activeTerminalId = p.activeTerminalId
        if (activeTerminalId === terminalId) {
          const remaining = Array.from(terminals.keys())
          activeTerminalId = remaining.length > 0 ? remaining[remaining.length - 1] : null
          if (activeTerminalId) {
            const t = terminals.get(activeTerminalId)!
            terminals.set(activeTerminalId, { ...t, isActive: true })
          }
        }
        return { ...p, terminals, activeTerminalId }
      })
      const newMap = new Map(s._terminalToPanelMap)
      newMap.delete(terminalId)
      return { panels, _terminalToPanelMap: newMap }
    })
  },

  setActiveTerminal: (panelId, terminalId) => {
    set((s) => {
      const panels = s.panels.map((p) => {
        if (p.panelId !== panelId) return p
        const terminals = new Map(p.terminals)
        for (const [key, t] of terminals) {
          terminals.set(key, { ...t, isActive: key === terminalId })
        }
        return { ...p, terminals, activeTerminalId: terminalId }
      })
      return { panels }
    })
  },

  updateTerminal: (panelId, terminalId, patch) => {
    set((s) => {
      const panels = s.panels.map((p) => {
        if (p.panelId !== panelId) return p
        const existing = p.terminals.get(terminalId)
        if (!existing) return p
        const terminals = new Map(p.terminals)
        terminals.set(terminalId, { ...existing, ...patch })
        return { ...p, terminals }
      })
      return { panels }
    })
  },

  clearPanelTerminals: (panelId) => {
    set((s) => {
      const newMap = new Map(s._terminalToPanelMap)
      const panels = s.panels.map((p) => {
        if (p.panelId !== panelId) return p
        for (const tid of p.terminals.keys()) {
          newMap.delete(tid)
        }
        return { ...p, terminals: new Map(), activeTerminalId: null }
      })
      return { panels, _terminalToPanelMap: newMap }
    })
  },

  setFocusedTerminalId: (terminalId) => {
    set({ focusedTerminalId: terminalId })
  },

  getActivePanel: () => {
    const { panels } = get()
    return panels.length > 0 ? panels[panels.length - 1] : undefined
  },

  getPanelByTerminalId: (terminalId) => {
    const { _terminalToPanelMap, panels } = get()
    const panelId = _terminalToPanelMap.get(terminalId)
    if (!panelId) return undefined
    return panels.find((p) => p.panelId === panelId)
  },

  getPanelById: (panelId) => {
    return get().panels.find((p) => p.panelId === panelId)
  }
}))

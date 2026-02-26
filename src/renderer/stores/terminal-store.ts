import { create } from 'zustand'
import { useSplitViewStore } from './split-view-store'

// Re-export from shared types so existing imports keep working
export { generateTerminalId } from './terminal-types'
export type { TerminalEntry } from './terminal-types'

import type { TerminalEntry } from './terminal-types'

interface TerminalState {
  terminals: Map<string, TerminalEntry>
  activeTerminalId: string | null

  addTerminal: (entry: TerminalEntry) => void
  removeTerminal: (id: string) => void
  setActive: (id: string) => void
  updateTerminal: (id: string, patch: Partial<TerminalEntry>) => void
  clearAll: () => void
}

/**
 * Terminal store — now a facade over the active panel in split-view-store.
 *
 * All reads return the active panel's terminals.
 * All writes delegate to the split-view store's per-panel methods.
 * Existing consumers (TerminalToolbar, TerminalTabs, TerminalInstance, useTerminal)
 * keep working unchanged.
 */
export const useTerminalStore = create<TerminalState>(() => ({
  // Computed from active panel — kept in sync via subscription below
  terminals: new Map(),
  activeTerminalId: null,

  addTerminal: (entry) => {
    const activePanel = useSplitViewStore.getState().getActivePanel()
    if (!activePanel) {
      console.warn('[TerminalStore] addTerminal: no active panel')
      return
    }
    useSplitViewStore.getState().addTerminal(activePanel.panelId, entry)
  },

  removeTerminal: (id) => {
    const panel = useSplitViewStore.getState().getPanelByTerminalId(id)
    if (!panel) return
    useSplitViewStore.getState().removeTerminal(panel.panelId, id)
  },

  setActive: (id) => {
    const panel = useSplitViewStore.getState().getPanelByTerminalId(id)
    if (!panel) return
    useSplitViewStore.getState().setActiveTerminal(panel.panelId, id)
  },

  updateTerminal: (id, patch) => {
    const panel = useSplitViewStore.getState().getPanelByTerminalId(id)
    if (!panel) return
    useSplitViewStore.getState().updateTerminal(panel.panelId, id, patch)
  },

  clearAll: () => {
    const activePanel = useSplitViewStore.getState().getActivePanel()
    if (!activePanel) return
    useSplitViewStore.getState().clearPanelTerminals(activePanel.panelId)
  }
}))

/**
 * Subscribe to split-view-store changes and sync the active panel's terminals
 * into terminal-store so that selectors like `useTerminalStore(s => s.terminals)` work.
 */
useSplitViewStore.subscribe((state) => {
  const activePanel = state.panels.length > 0 ? state.panels[state.panels.length - 1] : undefined
  const terminals = activePanel?.terminals ?? new Map()
  const activeTerminalId = activePanel?.activeTerminalId ?? null

  const current = useTerminalStore.getState()
  // Only update if the reference actually changed to avoid infinite loops
  if (current.terminals !== terminals || current.activeTerminalId !== activeTerminalId) {
    useTerminalStore.setState({ terminals, activeTerminalId })
  }
})

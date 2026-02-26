import { create } from 'zustand'
import type { EngineId } from '@/lib/constants'

export type ViewMode = 'chat' | 'terminal'

export interface TerminalEntry {
  id: string
  /** PTY id returned from ptyCreate */
  ptyId: string | null
  name: string
  engine: EngineId
  isActive: boolean
  cwd: string
  viewMode: ViewMode
}

interface TerminalState {
  terminals: Map<string, TerminalEntry>
  activeTerminalId: string | null

  addTerminal: (entry: TerminalEntry) => void
  removeTerminal: (id: string) => void
  setActive: (id: string) => void
  updateTerminal: (id: string, patch: Partial<TerminalEntry>) => void
  setViewMode: (id: string, mode: ViewMode) => void
  clearAll: () => void
}

let nextId = 1

export function generateTerminalId(): string {
  return `term-${nextId++}`
}

export const useTerminalStore = create<TerminalState>((set) => ({
  terminals: new Map(),
  activeTerminalId: null,

  addTerminal: (entry) =>
    set((state) => {
      console.log('[TerminalStore] addTerminal called with:', entry)
      const next = new Map(state.terminals)
      // Deactivate all others
      for (const [key, t] of next) {
        if (t.isActive) {
          next.set(key, { ...t, isActive: false })
        }
      }
      next.set(entry.id, { ...entry, isActive: true })
      console.log('[TerminalStore] Terminal added, new size:', next.size, 'activeTerminalId:', entry.id)
      return { terminals: next, activeTerminalId: entry.id }
    }),

  removeTerminal: (id) =>
    set((state) => {
      const next = new Map(state.terminals)
      next.delete(id)

      let activeTerminalId = state.activeTerminalId
      if (activeTerminalId === id) {
        // Activate the last remaining tab, if any
        const remaining = Array.from(next.keys())
        activeTerminalId = remaining.length > 0 ? remaining[remaining.length - 1] : null
        if (activeTerminalId) {
          const t = next.get(activeTerminalId)!
          next.set(activeTerminalId, { ...t, isActive: true })
        }
      }
      return { terminals: next, activeTerminalId }
    }),

  setActive: (id) =>
    set((state) => {
      const next = new Map(state.terminals)
      for (const [key, t] of next) {
        next.set(key, { ...t, isActive: key === id })
      }
      return { terminals: next, activeTerminalId: id }
    }),

  updateTerminal: (id, patch) =>
    set((state) => {
      const existing = state.terminals.get(id)
      if (!existing) return state
      const next = new Map(state.terminals)
      next.set(id, { ...existing, ...patch })
      return { terminals: next }
    }),

  setViewMode: (id, mode) =>
    set((state) => {
      const existing = state.terminals.get(id)
      if (!existing) return state
      const next = new Map(state.terminals)
      next.set(id, { ...existing, viewMode: mode })
      return { terminals: next }
    }),

  clearAll: () =>
    set(() => ({
      terminals: new Map(),
      activeTerminalId: null
    }))
}))

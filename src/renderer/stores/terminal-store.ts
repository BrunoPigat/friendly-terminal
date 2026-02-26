import { create } from 'zustand'
import type { EngineId } from '@/lib/constants'

export interface TerminalEntry {
  id: string
  /** PTY id returned from ptyCreate */
  ptyId: string | null
  name: string
  engine: EngineId
  isActive: boolean
  cwd: string
  /** Whether the terminal is still loading (engine starting) */
  isLoading: boolean
}

interface TerminalState {
  terminals: Map<string, TerminalEntry>
  activeTerminalId: string | null

  addTerminal: (entry: TerminalEntry) => void
  removeTerminal: (id: string) => void
  setActive: (id: string) => void
  updateTerminal: (id: string, patch: Partial<TerminalEntry>) => void
  clearAll: () => void
}

let nextId = 1

export function generateTerminalId(): string {
  return `term-${nextId++}`
}

let storeUpdateCount = 0

export const useTerminalStore = create<TerminalState>((set) => ({
  terminals: new Map(),
  activeTerminalId: null,

  addTerminal: (entry) =>
    set((state) => {
      storeUpdateCount++
      console.log(`[TerminalStore] Update #${storeUpdateCount} - addTerminal called with:`, entry)
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
      storeUpdateCount++
      console.log(`[TerminalStore] Update #${storeUpdateCount} - setActive called with:`, id)
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
      storeUpdateCount++
      console.log(`[TerminalStore] Update #${storeUpdateCount} - updateTerminal called with:`, id, patch)
      const next = new Map(state.terminals)
      next.set(id, { ...existing, ...patch })
      return { terminals: next }
    }),

  clearAll: () =>
    set(() => ({
      terminals: new Map(),
      activeTerminalId: null
    }))
}))

import { create } from 'zustand'
import * as api from '@/lib/api'
import type { GitStatus, GitFileChange } from '@/lib/api'

interface GitState {
  gitAvailable: boolean | null
  status: GitStatus | null
  changedFiles: GitFileChange[]
  loading: boolean
  error: string | null

  checkGitAvailable: () => Promise<void>
  refreshStatus: (cwd: string) => Promise<void>
  refreshChangedFiles: (cwd: string) => Promise<void>
  refreshAll: (cwd: string) => Promise<void>
  stageFiles: (cwd: string, files: string[]) => Promise<void>
  unstageFiles: (cwd: string, files: string[]) => Promise<void>
  commit: (cwd: string, message: string) => Promise<void>
  push: (cwd: string) => Promise<void>
  pull: (cwd: string) => Promise<void>
  initRepo: (cwd: string) => Promise<void>
  reset: () => void
}

export const useGitStore = create<GitState>((set, get) => ({
  gitAvailable: null,
  status: null,
  changedFiles: [],
  loading: false,
  error: null,

  checkGitAvailable: async () => {
    try {
      const available = await api.gitAvailable()
      set({ gitAvailable: available })
    } catch {
      set({ gitAvailable: false })
    }
  },

  refreshStatus: async (cwd) => {
    try {
      const status = await api.gitStatus(cwd)
      set({ status, error: null })
    } catch (err) {
      set({ error: (err as Error).message })
    }
  },

  refreshChangedFiles: async (cwd) => {
    try {
      const changedFiles = await api.gitChangedFiles(cwd)
      set({ changedFiles, error: null })
    } catch (err) {
      set({ error: (err as Error).message })
    }
  },

  refreshAll: async (cwd) => {
    set({ loading: true })
    await Promise.all([
      get().refreshStatus(cwd),
      get().refreshChangedFiles(cwd)
    ])
    set({ loading: false })
  },

  stageFiles: async (cwd, files) => {
    try {
      set({ loading: true, error: null })
      await api.gitAdd(cwd, files)
      await get().refreshAll(cwd)
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  unstageFiles: async (cwd, files) => {
    try {
      set({ loading: true, error: null })
      // git reset HEAD <files> to unstage
      await api.gitAdd(cwd, files) // We'll use restore --staged via the manager
      await get().refreshAll(cwd)
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  commit: async (cwd, message) => {
    try {
      set({ loading: true, error: null })
      await api.gitCommit(cwd, message)
      await get().refreshAll(cwd)
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  push: async (cwd) => {
    try {
      set({ loading: true, error: null })
      await api.gitPush(cwd)
      await get().refreshAll(cwd)
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  pull: async (cwd) => {
    try {
      set({ loading: true, error: null })
      await api.gitPull(cwd)
      await get().refreshAll(cwd)
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  initRepo: async (cwd) => {
    try {
      set({ loading: true, error: null })
      await api.gitInit(cwd)
      await get().refreshAll(cwd)
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  reset: () => {
    set({ status: null, changedFiles: [], loading: false, error: null })
  }
}))

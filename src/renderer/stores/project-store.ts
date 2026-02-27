import { create } from 'zustand'
import type { Project } from '@/lib/api'
import * as api from '@/lib/api'
import { useSplitViewStore } from './split-view-store'
import type { EngineId } from '@/lib/constants'

interface ProjectState {
  projects: Project[]
  activeProject: Project | null
  loading: boolean

  loadProjects: () => Promise<void>
  selectProject: (project: Project, defaultEngine?: EngineId) => void
  clearProject: () => void
  createProject: (name: string, defaultEngine?: EngineId) => Promise<Project>
  importProject: (folderPath: string) => Promise<Project>
  deleteProject: (name: string) => Promise<void>
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  activeProject: null,
  loading: false,

  loadProjects: async () => {
    set({ loading: true })
    try {
      const projects = await api.listProjects()
      set({ projects, loading: false })
    } catch (err) {
      console.error('Failed to load projects:', err)
      set({ loading: false })
    }
  },

  selectProject: (project, defaultEngine = 'claude') => {
    console.log('[ProjectStore] selectProject called with:', project)
    useSplitViewStore.getState().openProject(project, defaultEngine)
    // activeProject is synced from split-view-store subscription below
  },

  clearProject: () => {
    const splitView = useSplitViewStore.getState()
    const activePanel = splitView.getActivePanel()
    if (activePanel) {
      splitView.closePanel(activePanel.panelId)
    }
    // If no panels left, activeProject will be set to null by the subscription
  },

  createProject: async (name) => {
    const project = await api.createProject(name)
    set((state) => ({
      projects: [...state.projects, project]
    }))
    // Don't auto-select here — the caller will call selectProject
    return project
  },

  importProject: async (folderPath) => {
    const project = await api.importProject(folderPath)
    set((state) => ({
      projects: [...state.projects, project]
    }))
    return project
  },

  deleteProject: async (name) => {
    // Close any panel that has this project open
    const splitView = useSplitViewStore.getState()
    const panel = splitView.panels.find((p) => p.project.name === name)
    if (panel) {
      splitView.closePanel(panel.panelId)
    }

    await api.deleteProject(name)
    set((state) => ({
      projects: state.projects.filter((p) => p.name !== name)
    }))
  }
}))

/**
 * Subscribe to split-view-store to keep activeProject in sync with the active panel.
 */
useSplitViewStore.subscribe((state) => {
  const activePanel = state.panels.length > 0 ? state.panels[state.panels.length - 1] : undefined
  const activeProject = activePanel?.project ?? null

  const current = useProjectStore.getState()
  if (current.activeProject !== activeProject) {
    useProjectStore.setState({ activeProject })
  }
})

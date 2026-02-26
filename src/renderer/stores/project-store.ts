import { create } from 'zustand'
import type { Project } from '@/lib/api'
import * as api from '@/lib/api'

interface ProjectState {
  projects: Project[]
  activeProject: Project | null
  loading: boolean

  loadProjects: () => Promise<void>
  selectProject: (project: Project) => void
  clearProject: () => void
  createProject: (name: string) => Promise<Project>
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

  selectProject: (project) => {
    console.log('[ProjectStore] selectProject called with:', project)
    set({ activeProject: project })
    console.log('[ProjectStore] activeProject set to:', project.name)
  },

  clearProject: () => {
    set({ activeProject: null })
  },

  createProject: async (name) => {
    const project = await api.createProject(name)
    set((state) => ({
      projects: [...state.projects, project],
      activeProject: project
    }))
    return project
  },

  deleteProject: async (name) => {
    await api.deleteProject(name)
    set((state) => {
      const projects = state.projects.filter((p) => p.name !== name)
      const activeProject =
        state.activeProject?.name === name ? null : state.activeProject
      return { projects, activeProject }
    })
  }
}))

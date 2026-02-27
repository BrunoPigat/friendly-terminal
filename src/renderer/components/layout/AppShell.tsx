import { useEffect } from 'react'
import { useGuiActions } from '@/hooks/useGuiActions'
import TitleBar from '@/components/layout/TitleBar'
import WelcomeScreen from '@/components/WelcomeScreen'
import SplitViewContainer from '@/components/layout/SplitViewContainer'
import { useProjectStore } from '@/stores/project-store'
import { useSettingsStore } from '@/stores/settings-store'
import type { EngineId } from '@/lib/constants'
import { useSplitViewStore } from '@/stores/split-view-store'

export default function AppShell() {
  const loadSettings = useSettingsStore((s) => s.loadSettings)

  // Mount GUI actions listener (MCP server -> renderer)
  useGuiActions()

  const panels = useSplitViewStore((s) => s.panels)
  const loadProjects = useProjectStore((s) => s.loadProjects)
  const selectProject = useProjectStore((s) => s.selectProject)
  const defaultEngine = useSettingsStore((s) => s.defaultEngine)

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  // Auto-select project from URL query params
  // ?project=name (legacy) or ?popout=name&engine=id (pop-out window)
  useEffect(() => {
    if (panels.length > 0) return
    const params = new URLSearchParams(window.location.search)
    const popoutName = params.get('popout')
    const projectName = popoutName || params.get('project')
    const engine = (params.get('engine') as EngineId) || defaultEngine
    if (!projectName) return
    loadProjects().then(() => {
      const projects = useProjectStore.getState().projects
      const match = projects.find((p) => p.name === projectName)
      if (match) selectProject(match, engine)
    })
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // No panels → show welcome screen
  if (panels.length === 0) {
    return (
      <div className="flex h-full w-full flex-col bg-win-bg text-win-text">
        <TitleBar />
        <WelcomeScreen />
      </div>
    )
  }

  return (
    <div className="flex h-full w-full flex-col bg-win-bg text-win-text">
      <TitleBar />
      <SplitViewContainer />
    </div>
  )
}

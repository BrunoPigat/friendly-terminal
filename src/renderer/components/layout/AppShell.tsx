import { useEffect, useRef, useCallback } from 'react'
import { useGuiActions } from '@/hooks/useGuiActions'
import TitleBar from '@/components/layout/TitleBar'
import Sidebar from '@/components/layout/Sidebar'
import FileBrowser from '@/components/sidebar/FileBrowser'
import TerminalToolbar from '@/components/terminal/TerminalToolbar'
import TerminalTabs from '@/components/terminal/TerminalTabs'
import TerminalInstance from '@/components/terminal/TerminalInstance'
import RightPanel from '@/components/panel/RightPanel'
import WelcomeScreen from '@/components/WelcomeScreen'
import { useTerminalStore, generateTerminalId } from '@/stores/terminal-store'
import { useProjectStore } from '@/stores/project-store'
import { useSettingsStore } from '@/stores/settings-store'
import { SIDEBAR_MIN_WIDTH, SIDEBAR_MAX_WIDTH, ENGINE_NAMES } from '@/lib/constants'

const RIGHT_PANEL_MIN_WIDTH = 200
const RIGHT_PANEL_MAX_WIDTH = 500

export default function AppShell() {
  const loadSettings = useSettingsStore((s) => s.loadSettings)
  const setSidebarWidth = useSettingsStore((s) => s.setSidebarWidth)
  const sidebarCollapsed = useSettingsStore((s) => s.sidebarCollapsed)
  const defaultEngine = useSettingsStore((s) => s.defaultEngine)
  const minifiedView = useSettingsStore((s) => s.minifiedView)
  const toggleMinifiedView = useSettingsStore((s) => s.toggleMinifiedView)

  const setRightPanelWidth = useSettingsStore((s) => s.setRightPanelWidth)

  // Mount GUI actions listener (MCP server → renderer)
  useGuiActions()

  const activeProject = useProjectStore((s) => s.activeProject)
  const selectProject = useProjectStore((s) => s.selectProject)
  const loadProjects = useProjectStore((s) => s.loadProjects)

  const activeTerminalId = useTerminalStore((s) => s.activeTerminalId)
  const terminals = useTerminalStore((s) => s.terminals)
  const addTerminal = useTerminalStore((s) => s.addTerminal)
  const activeTerminal = activeTerminalId ? terminals.get(activeTerminalId) : undefined

  // Track which project we've auto-created a terminal for
  const autoCreatedForProjectRef = useRef<string | null>(null)

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  // Auto-select project from URL query param (?project=name)
  const autoSelectedRef = useRef(false)
  useEffect(() => {
    if (autoSelectedRef.current || activeProject) return
    const params = new URLSearchParams(window.location.search)
    const projectName = params.get('project')
    if (!projectName) return
    autoSelectedRef.current = true
    loadProjects().then(() => {
      const projects = useProjectStore.getState().projects
      const match = projects.find((p) => p.name === projectName)
      if (match) selectProject(match)
    })
  }, [activeProject, loadProjects, selectProject])

  // Track previous dependency values to see what's changing
  const prevDepsRef = useRef<{
    activeProject: typeof activeProject
    terminalsSize: number
    addTerminal: typeof addTerminal
    defaultEngine: string
  }>()

  // Auto-create a terminal when a project is selected and there are none
  useEffect(() => {
    // Log what changed
    const prevDeps = prevDepsRef.current
    const changes: string[] = []
    if (prevDeps) {
      if (prevDeps.activeProject !== activeProject) changes.push('activeProject')
      if (prevDeps.terminalsSize !== terminals.size) changes.push('terminalsSize')
      if (prevDeps.addTerminal !== addTerminal) changes.push('addTerminal')
      if (prevDeps.defaultEngine !== defaultEngine) changes.push('defaultEngine')
    } else {
      changes.push('initial mount')
    }

    console.log('[AppShell] Auto-create terminal effect triggered', {
      activeProject: activeProject?.name,
      activeProjectPath: activeProject?.path,
      terminalsSize: terminals.size,
      defaultEngine,
      autoCreatedFor: autoCreatedForProjectRef.current,
      changedDeps: changes,
      willCreate: activeProject && terminals.size === 0 && autoCreatedForProjectRef.current !== activeProject.path
    })

    // Update prev deps
    prevDepsRef.current = {
      activeProject,
      terminalsSize: terminals.size,
      addTerminal,
      defaultEngine
    }

    // Only auto-create if:
    // 1. We have an active project
    // 2. There are no terminals
    // 3. We haven't already auto-created for this project
    if (activeProject && terminals.size === 0 && autoCreatedForProjectRef.current !== activeProject.path) {
      console.log('[AppShell] Creating auto terminal for project:', activeProject.name)
      const id = generateTerminalId()

      addTerminal({
        id,
        ptyId: null,
        name: `${ENGINE_NAMES[defaultEngine]} #1`,
        engine: defaultEngine,
        isActive: true,
        cwd: activeProject.path,
        isLoading: true
      })
      autoCreatedForProjectRef.current = activeProject.path
    }

    // Reset the ref if project changes or all terminals are closed
    const shouldReset = !activeProject || (activeProject && autoCreatedForProjectRef.current !== activeProject.path && autoCreatedForProjectRef.current !== null)
    if (shouldReset) {
      autoCreatedForProjectRef.current = null
    }
  }, [activeProject, terminals.size, addTerminal, defaultEngine])

  // Sidebar resize
  const resizing = useRef(false)
  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      if (sidebarCollapsed) return
      e.preventDefault()
      resizing.current = true
      const onMouseMove = (moveEvent: MouseEvent) => {
        if (!resizing.current) return
        const newWidth = Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, moveEvent.clientX))
        setSidebarWidth(newWidth)
      }
      const onMouseUp = () => {
        resizing.current = false
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    },
    [sidebarCollapsed, setSidebarWidth]
  )

  // Right panel resize
  const rightResizing = useRef(false)
  const handleRightResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      rightResizing.current = true
      const onMouseMove = (moveEvent: MouseEvent) => {
        if (!rightResizing.current) return
        const newWidth = Math.min(
          RIGHT_PANEL_MAX_WIDTH,
          Math.max(RIGHT_PANEL_MIN_WIDTH, window.innerWidth - moveEvent.clientX)
        )
        setRightPanelWidth(newWidth)
      }
      const onMouseUp = () => {
        rightResizing.current = false
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    },
    [setRightPanelWidth]
  )

  // No project selected → show welcome screen
  if (!activeProject) {
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

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {!minifiedView && (
          <Sidebar>
            <FileBrowser />
          </Sidebar>
        )}

        {/* Resize handle */}
        {!minifiedView && !sidebarCollapsed && (
          <div
            className="w-1 shrink-0 cursor-col-resize bg-transparent hover:bg-win-accent/20 active:bg-win-accent/40 transition-colors"
            onMouseDown={handleResizeStart}
          />
        )}

        {/* Main content area */}
        <main className="flex flex-1 flex-col overflow-hidden">
          {minifiedView ? (
            <div className="flex h-10 shrink-0 items-center justify-end border-b border-win-border bg-win-surface px-2">
              <button
                onClick={toggleMinifiedView}
                title="Exit focus mode"
                className="flex items-center justify-center h-8 w-8 rounded-md border border-win-accent bg-win-accent-subtle text-win-accent"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 3 21 3 21 9" />
                  <polyline points="9 21 3 21 3 15" />
                  <line x1="21" y1="3" x2="14" y2="10" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </svg>
              </button>
            </div>
          ) : (
            <>
              <TerminalToolbar />
              <TerminalTabs />
            </>
          )}
          <div className="relative flex-1 overflow-hidden">
            {activeTerminal ? (
              <TerminalInstance
                key={activeTerminal.id}
                terminalId={activeTerminal.id}
                cwd={activeTerminal.cwd}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-win-text-secondary text-sm">
                No terminal open. Click + to create one.
              </div>
            )}
          </div>
        </main>

        {/* Right panel resize handle */}
        {!minifiedView && (
          <div
            className="w-1 shrink-0 cursor-col-resize bg-transparent hover:bg-win-accent/20 active:bg-win-accent/40 transition-colors"
            onMouseDown={handleRightResizeStart}
          />
        )}

        {/* Right panel */}
        {!minifiedView && <RightPanel />}
      </div>
    </div>
  )
}

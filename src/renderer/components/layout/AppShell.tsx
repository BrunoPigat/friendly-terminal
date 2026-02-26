import { useEffect, useRef, useCallback } from 'react'
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

  const rightPanelCollapsed = useSettingsStore((s) => s.rightPanelCollapsed)
  const setRightPanelWidth = useSettingsStore((s) => s.setRightPanelWidth)

  const activeProject = useProjectStore((s) => s.activeProject)

  const activeTerminalId = useTerminalStore((s) => s.activeTerminalId)
  const terminals = useTerminalStore((s) => s.terminals)
  const addTerminal = useTerminalStore((s) => s.addTerminal)
  const activeTerminal = activeTerminalId ? terminals.get(activeTerminalId) : undefined

  // Track which project we've auto-created a terminal for
  const autoCreatedForProjectRef = useRef<string | null>(null)

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

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
      console.log('[AppShell] ✅ CREATING auto terminal for project:', activeProject.name)
      const id = generateTerminalId()
      console.log('[AppShell] Generated terminal ID:', id)

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
      console.log('[AppShell] ✅ Terminal creation dispatched, ref updated to:', autoCreatedForProjectRef.current)
    } else {
      console.log('[AppShell] ❌ NOT creating terminal because:', {
        hasActiveProject: !!activeProject,
        terminalsSize: terminals.size,
        autoCreatedFor: autoCreatedForProjectRef.current,
        currentProjectPath: activeProject?.path
      })
    }

    // Reset the ref if project changes or all terminals are closed
    const shouldReset = !activeProject || (activeProject && autoCreatedForProjectRef.current !== activeProject.path && autoCreatedForProjectRef.current !== null)
    if (shouldReset) {
      console.log('[AppShell] 🔄 Resetting autoCreatedFor ref from', autoCreatedForProjectRef.current, 'to null')
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
      if (rightPanelCollapsed) return
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
    [rightPanelCollapsed, setRightPanelWidth]
  )

  // No project selected → show welcome screen
  if (!activeProject) {
    console.log('[AppShell] Rendering WelcomeScreen (no active project)')
    return (
      <div className="flex h-full w-full flex-col bg-zinc-950 text-zinc-100">
        <TitleBar />
        <WelcomeScreen />
      </div>
    )
  }

  console.log('[AppShell] Rendering main app shell', {
    activeProject: activeProject.name,
    activeTerminalId,
    terminalsSize: terminals.size,
    activeTerminal: activeTerminal ? {
      id: activeTerminal.id,
      name: activeTerminal.name
    } : null
  })

  return (
    <div className="flex h-full w-full flex-col bg-zinc-950 text-zinc-100">
      <TitleBar />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar>
          <FileBrowser />
        </Sidebar>

        {/* Resize handle */}
        {!sidebarCollapsed && (
          <div
            className="w-1 shrink-0 cursor-col-resize bg-transparent hover:bg-zinc-700 active:bg-zinc-600 transition-colors"
            onMouseDown={handleResizeStart}
          />
        )}

        {/* Main content area */}
        <main className="flex flex-1 flex-col overflow-hidden">
          <TerminalToolbar />
          <TerminalTabs />
          <div className="relative flex-1 overflow-hidden">
            {activeTerminal ? (
              <TerminalInstance
                key={activeTerminal.id}
                terminalId={activeTerminal.id}
                cwd={activeTerminal.cwd}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-zinc-500 text-sm">
                No terminal open. Click + to create one.
              </div>
            )}
          </div>
        </main>

        {/* Right panel resize handle */}
        {!rightPanelCollapsed && (
          <div
            className="w-1 shrink-0 cursor-col-resize bg-transparent hover:bg-zinc-700 active:bg-zinc-600 transition-colors"
            onMouseDown={handleRightResizeStart}
          />
        )}

        {/* Right panel */}
        <RightPanel />
      </div>
    </div>
  )
}

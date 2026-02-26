import { useEffect, useRef, useCallback } from 'react'
import TitleBar from '@/components/layout/TitleBar'
import Sidebar from '@/components/layout/Sidebar'
import FileBrowser from '@/components/sidebar/FileBrowser'
import TerminalToolbar from '@/components/terminal/TerminalToolbar'
import TerminalTabs from '@/components/terminal/TerminalTabs'
import TerminalInstance from '@/components/terminal/TerminalInstance'
import ChatView from '@/components/chat/ChatView'
import ChatSessionManager from '@/components/chat/ChatSessionManager'
import WelcomeScreen from '@/components/WelcomeScreen'
import { useTerminalStore, generateTerminalId } from '@/stores/terminal-store'
import { useProjectStore } from '@/stores/project-store'
import { useSettingsStore } from '@/stores/settings-store'
import { useChatStore } from '@/stores/chat-store'
import { SIDEBAR_MIN_WIDTH, SIDEBAR_MAX_WIDTH, ENGINE_NAMES } from '@/lib/constants'

export default function AppShell() {
  const loadSettings = useSettingsStore((s) => s.loadSettings)
  const setSidebarWidth = useSettingsStore((s) => s.setSidebarWidth)
  const sidebarCollapsed = useSettingsStore((s) => s.sidebarCollapsed)
  const defaultEngine = useSettingsStore((s) => s.defaultEngine)

  const activeProject = useProjectStore((s) => s.activeProject)

  const activeTerminalId = useTerminalStore((s) => s.activeTerminalId)
  const terminals = useTerminalStore((s) => s.terminals)
  const addTerminal = useTerminalStore((s) => s.addTerminal)
  const activeTerminal = activeTerminalId ? terminals.get(activeTerminalId) : undefined

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const initSession = useChatStore((s) => s.initSession)

  // Auto-create a terminal when a project is selected and there are none
  useEffect(() => {
    console.log('[AppShell] Auto-create terminal effect triggered', {
      activeProject: activeProject?.name,
      terminalsSize: terminals.size,
      defaultEngine
    })

    if (activeProject && terminals.size === 0) {
      console.log('[AppShell] Creating auto terminal for project:', activeProject.name)
      const id = generateTerminalId()
      console.log('[AppShell] Generated terminal ID:', id)

      addTerminal({
        id,
        ptyId: null,
        name: `${ENGINE_NAMES[defaultEngine]} #1`,
        engine: defaultEngine,
        isActive: true,
        cwd: activeProject.path,
        viewMode: 'chat'
      })
      console.log('[AppShell] Terminal added, initializing chat session')

      // Initialize chat session for the new terminal
      initSession(id)
      console.log('[AppShell] Chat session initialized')
    }
  }, [activeProject, terminals.size, addTerminal, defaultEngine, initSession])

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
      name: activeTerminal.name,
      viewMode: activeTerminal.viewMode
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
              <>
                {activeTerminal.viewMode === 'chat' ? (
                  <ChatView
                    key={`chat-${activeTerminal.id}`}
                    terminalId={activeTerminal.id}
                  />
                ) : (
                  <TerminalInstance
                    key={activeTerminal.id}
                    terminalId={activeTerminal.id}
                    cwd={activeTerminal.cwd}
                  />
                )}
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-zinc-500 text-sm">
                No terminal open. Click + to create one.
              </div>
            )}
          </div>
        </main>

        {/* Always-mounted bridge: keeps PTY→chat pipeline alive for all terminals */}
        <ChatSessionManager />
      </div>
    </div>
  )
}

import { type ReactNode, useCallback } from 'react'
import { useSettingsStore } from '@/stores/settings-store'

interface SidebarProps {
  children: ReactNode
}

/**
 * Windows 11-style sidebar with collapse toggle.
 * Width is controlled via the settings store.
 */
export default function Sidebar({ children }: SidebarProps) {
  const sidebarWidth = useSettingsStore((s) => s.sidebarWidth)
  const collapsed = useSettingsStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useSettingsStore((s) => s.toggleSidebar)
  const setShowSettings = useSettingsStore((s) => s.setShowSettingsDialog)

  const handleToggle = useCallback(() => {
    toggleSidebar()
  }, [toggleSidebar])

  const handleOpenSettings = useCallback(() => {
    setShowSettings(true)
  }, [setShowSettings])

  return (
    <aside
      className="relative flex shrink-0 flex-col border-r border-win-border bg-win-bg overflow-hidden transition-[width] duration-200"
      style={{ width: collapsed ? 40 : sidebarWidth }}
    >
      {/* Collapse / expand toggle */}
      <button
        onClick={handleToggle}
        className="absolute right-1 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-md text-win-text-tertiary hover:bg-win-hover hover:text-win-text-secondary transition-colors"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform ${collapsed ? 'rotate-180' : ''}`}
        >
          <polyline points="9 3 5 7 9 11" />
        </svg>
      </button>

      {/* Content area - hidden when collapsed */}
      {!collapsed && (
        <div className="flex flex-1 flex-col overflow-hidden pt-2">{children}</div>
      )}

      {/* Settings button - always visible */}
      <button
        onClick={handleOpenSettings}
        className={`flex shrink-0 items-center border-t border-win-border text-win-text-tertiary hover:bg-win-hover hover:text-win-text-secondary transition-colors ${
          collapsed ? 'justify-center h-10' : 'gap-2 px-3 py-2.5'
        }`}
        title="Settings"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
        {!collapsed && <span className="text-xs">Settings</span>}
      </button>
    </aside>
  )
}

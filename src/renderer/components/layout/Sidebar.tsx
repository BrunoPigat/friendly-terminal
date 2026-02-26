import { type ReactNode, useCallback } from 'react'
import { useSettingsStore } from '@/stores/settings-store'

interface SidebarProps {
  children: ReactNode
}

/**
 * Dark sidebar wrapper with collapse toggle.
 * Width is controlled via the settings store.
 */
export default function Sidebar({ children }: SidebarProps) {
  const sidebarWidth = useSettingsStore((s) => s.sidebarWidth)
  const collapsed = useSettingsStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useSettingsStore((s) => s.toggleSidebar)

  const handleToggle = useCallback(() => {
    toggleSidebar()
  }, [toggleSidebar])

  return (
    <aside
      className="relative flex shrink-0 flex-col border-r border-zinc-800 bg-zinc-950 overflow-hidden transition-[width] duration-200"
      style={{ width: collapsed ? 40 : sidebarWidth }}
    >
      {/* Collapse / expand toggle */}
      <button
        onClick={handleToggle}
        className="absolute right-1 top-1 z-10 flex h-6 w-6 items-center justify-center rounded text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
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
    </aside>
  )
}

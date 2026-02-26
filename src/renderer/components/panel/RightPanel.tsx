import { useState, useCallback } from 'react'
import { useSettingsStore } from '@/stores/settings-store'
import TipsPanel from './TipsPanel'
import AgentList from './AgentList'
import SkillList from './SkillList'
import MCPPanel from './MCPPanel'

type Tab = 'tips' | 'agents' | 'skills' | 'mcps'

const TABS: { id: Tab; label: string }[] = [
  { id: 'tips', label: 'Tips' },
  { id: 'agents', label: 'Agents' },
  { id: 'skills', label: 'Skills' },
  { id: 'mcps', label: 'MCPs' }
]

export default function RightPanel() {
  const collapsed = useSettingsStore((s) => s.rightPanelCollapsed)
  const panelWidth = useSettingsStore((s) => s.rightPanelWidth)
  const toggleRightPanel = useSettingsStore((s) => s.toggleRightPanel)
  const [activeTab, setActiveTab] = useState<Tab>('tips')

  const handleToggle = useCallback(() => {
    toggleRightPanel()
  }, [toggleRightPanel])

  return (
    <aside
      className="relative flex shrink-0 flex-col border-l border-zinc-800 bg-zinc-950 overflow-hidden transition-[width] duration-200"
      style={{ width: collapsed ? 40 : panelWidth }}
    >
      {/* Collapse / expand toggle */}
      <button
        onClick={handleToggle}
        className="absolute left-1 top-1 z-10 flex h-6 w-6 items-center justify-center rounded text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
        aria-label={collapsed ? 'Expand panel' : 'Collapse panel'}
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
          className={`transition-transform ${collapsed ? '' : 'rotate-180'}`}
        >
          <polyline points="5 3 9 7 5 11" />
        </svg>
      </button>

      {/* Content area - hidden when collapsed */}
      {!collapsed && (
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Tab bar */}
          <div className="flex shrink-0 border-b border-zinc-800">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-2 py-2 text-[11px] font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-blue-500 text-zinc-200'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'tips' && <TipsPanel />}
            {activeTab === 'agents' && <AgentList />}
            {activeTab === 'skills' && <SkillList />}
            {activeTab === 'mcps' && <MCPPanel />}
          </div>
        </div>
      )}
    </aside>
  )
}

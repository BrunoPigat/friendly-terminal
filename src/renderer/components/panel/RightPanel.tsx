import { useSettingsStore, type RightPanelTab } from '@/stores/settings-store'
import TipsPanel from './TipsPanel'
import AgentList from './AgentList'
import SkillList from './SkillList'
import MCPPanel from './MCPPanel'

const TABS: { id: RightPanelTab; label: string }[] = [
  { id: 'tips', label: 'Suggestions' },
  { id: 'agents', label: 'Agents' },
  { id: 'skills', label: 'Skills' },
  { id: 'mcps', label: 'Integrations' }
]

export default function RightPanel() {
  const panelWidth = useSettingsStore((s) => s.rightPanelWidth)
  const activeTab = useSettingsStore((s) => s.rightPanelActiveTab)
  const setActiveTab = useSettingsStore((s) => s.setRightPanelActiveTab)

  return (
    <aside
      className="relative flex shrink-0 flex-col border-l border-win-border bg-win-bg overflow-hidden"
      style={{ width: panelWidth }}
    >
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Tab bar - Windows 11 style */}
        <div className="flex shrink-0 border-b border-win-border bg-win-surface">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex-1 px-4 py-3.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-win-accent'
                  : 'text-win-text-secondary hover:text-win-text'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-win-accent" />
              )}
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
    </aside>
  )
}

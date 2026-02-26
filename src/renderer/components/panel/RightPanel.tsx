import { useSettingsStore, type RightPanelTab } from '@/stores/settings-store'
import TipsPanel from './TipsPanel'
import AgentList from './AgentList'
import SkillList from './SkillList'
import MCPPanel from './MCPPanel'

const TABS: { id: RightPanelTab; label: string }[] = [
  { id: 'tips', label: 'Tips' },
  { id: 'agents', label: 'Agents' },
  { id: 'skills', label: 'Skills' },
  { id: 'mcps', label: 'MCPs' }
]

export default function RightPanel() {
  const panelWidth = useSettingsStore((s) => s.rightPanelWidth)
  const activeTab = useSettingsStore((s) => s.rightPanelActiveTab)
  const setActiveTab = useSettingsStore((s) => s.setRightPanelActiveTab)

  return (
    <aside
      className="relative flex shrink-0 flex-col border-l border-zinc-800 bg-zinc-950 overflow-hidden"
      style={{ width: panelWidth }}
    >
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
    </aside>
  )
}

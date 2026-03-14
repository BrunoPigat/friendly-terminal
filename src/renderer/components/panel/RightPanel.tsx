import { type ReactNode } from 'react'
import { useSettingsStore, type RightPanelTab } from '@/stores/settings-store'
import TipsPanel from './TipsPanel'
import AgentList from './AgentList'
import SkillList from './SkillList'
import MCPPanel from './MCPPanel'
import GitPanel from '@/components/git/GitPanel'
import CanvasPanel from './CanvasPanel'

const TABS: { id: RightPanelTab; label: string; icon: ReactNode }[] = [
  {
    id: 'tips',
    label: 'Suggestions',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18h6" />
        <path d="M10 22h4" />
        <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5C8.24 12.24 8.71 13 8.91 14" />
      </svg>
    )
  },
  {
    id: 'agents',
    label: 'Agents',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 8V4H8" />
        <rect width="16" height="12" x="4" y="8" rx="2" />
        <path d="M2 14h2" />
        <path d="M20 14h2" />
        <path d="M15 13v2" />
        <path d="M9 13v2" />
      </svg>
    )
  },
  {
    id: 'skills',
    label: 'Skills',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    )
  },
  {
    id: 'mcps',
    label: 'Connections',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    )
  },
  {
    id: 'git',
    label: 'Git',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="18" r="3" />
        <circle cx="6" cy="6" r="3" />
        <path d="M13 6h3a2 2 0 0 1 2 2v7" />
        <path d="M6 9v12" />
      </svg>
    )
  },
  {
    id: 'canvas',
    label: 'Canvas',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18.37 2.63 14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3Z" />
        <path d="M9 8c-2 3-4 3.5-7 4l8 10c2-1 6-5 6-7" />
        <path d="M14.5 17.5 4.5 15" />
      </svg>
    )
  }
]

export default function RightPanel() {
  const panelWidth = useSettingsStore((s) => s.rightPanelWidth)
  const activeTab = useSettingsStore((s) => s.rightPanelActiveTab)
  const setActiveTab = useSettingsStore((s) => s.setRightPanelActiveTab)
  const canvasMode = useSettingsStore((s) => s.canvasMode)
  const setCanvasMode = useSettingsStore((s) => s.setCanvasMode)

  return (
    <aside
      className="relative flex shrink-0 flex-col border-l border-win-border bg-win-bg overflow-hidden"
      style={{ width: panelWidth }}
    >
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Tab bar - Windows 11 style */}
        <div className="flex shrink-0 overflow-x-auto border-b border-win-border bg-win-surface">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative shrink-0 flex items-center gap-1.5 px-3 py-3.5 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'text-win-accent'
                  : 'text-win-text-secondary hover:text-win-text'
              }`}
            >
              {tab.icon}
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-win-accent" />
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
          {activeTab === 'git' && <GitPanel />}
          {activeTab === 'canvas' && canvasMode === 'panel' && <CanvasPanel mode="panel" />}
          {activeTab === 'canvas' && canvasMode !== 'panel' && (
            <div className="flex flex-col items-center gap-3 p-6 text-center">
              <p className="text-sm text-win-text-secondary">
                Canvas is in {canvasMode === 'full' ? 'full window' : 'bottom split'} mode.
              </p>
              <button
                onClick={() => {
                  setCanvasMode('panel')
                  setActiveTab('canvas')
                }}
                className="flex items-center gap-1.5 rounded-md border border-win-border bg-win-card px-3 py-1.5 text-xs font-medium text-win-text-secondary hover:bg-win-accent hover:text-white hover:border-win-accent transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="9" y1="3" x2="9" y2="21" />
                </svg>
                Move to panel
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

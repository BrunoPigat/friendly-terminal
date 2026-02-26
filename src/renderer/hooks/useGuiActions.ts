import { useEffect } from 'react'
import { useSettingsStore } from '@/stores/settings-store'

type RightPanelTab = 'tips' | 'agents' | 'skills' | 'mcps'

interface GuiActionPayload {
  action: 'switch_tab' | 'open_panel' | 'close_panel'
  tab?: RightPanelTab
}

/**
 * Listens for GUI control actions from the main process (forwarded from the MCP server)
 * and dispatches them to the settings store.
 */
export function useGuiActions(): void {
  useEffect(() => {
    const unsub = window.api.onGuiAction((payload: GuiActionPayload) => {
      const store = useSettingsStore.getState()

      switch (payload.action) {
        case 'switch_tab':
          if (payload.tab) {
            store.setRightPanelActiveTab(payload.tab)
          }
          break

        case 'open_panel':
        case 'close_panel':
          // Right panel is always active — no-op
          break
      }
    })

    return unsub
  }, [])
}

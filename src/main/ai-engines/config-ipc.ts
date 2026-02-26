import { ipcMain } from 'electron'
import { readAgents, readSkills } from './config-reader'

/**
 * Registers IPC handlers for reading AI engine agent and skill configurations.
 */
export function registerConfigIpc(): void {
  ipcMain.handle('engines:list-agents', async (_event, engineId: string, projectPath: string) => {
    return readAgents(engineId, projectPath)
  })

  ipcMain.handle('engines:list-skills', async (_event, engineId: string, projectPath: string) => {
    return readSkills(engineId, projectPath)
  })
}

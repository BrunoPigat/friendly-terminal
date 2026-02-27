import { ipcMain, dialog, BrowserWindow } from 'electron'
import {
  listProjects,
  createProject,
  importProject,
  deleteProject,
  getProjectPath
} from './project-manager'
import {
  readMcpConfig,
  addMcpServer,
  removeMcpServer,
  updateMcpServer,
  McpServerEntry
} from './mcp-config'
import { getProjectsDir } from '../util/paths'

/**
 * Registers all project and MCP-related IPC handlers.
 */
export function registerProjectIpc(): void {
  ipcMain.handle('project:list', async () => {
    console.log('[project:list] loading projects')
    return listProjects()
  })

  ipcMain.handle('project:create', async (_event, name: string) => {
    console.log(`[project:create] name="${name}"`)
    return createProject(name)
  })

  ipcMain.handle('project:delete', async (_event, name: string) => {
    console.log(`[project:delete] name="${name}"`)
    return deleteProject(name)
  })

  ipcMain.handle('project:import', async (_event, folderPath: string) => {
    console.log(`[project:import] path="${folderPath}"`)
    return importProject(folderPath)
  })

  ipcMain.handle('dialog:open-directory', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const result = await dialog.showOpenDialog(win!, {
      properties: ['openDirectory']
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })

  ipcMain.handle('project:get-path', async (_event, name: string) => {
    return getProjectPath(name)
  })

  ipcMain.handle('project:get-projects-dir', async () => {
    return getProjectsDir()
  })

  // --- MCP Server Management ---

  ipcMain.handle('mcp:list', async (_event, projectName: string) => {
    const projectDir = getProjectPath(projectName)
    const config = await readMcpConfig(projectDir)
    return config.mcpServers
  })

  ipcMain.handle(
    'mcp:add',
    async (_event, projectName: string, name: string, server: McpServerEntry) => {
      const projectDir = getProjectPath(projectName)
      const config = await addMcpServer(projectDir, name, server)
      return config.mcpServers
    }
  )

  ipcMain.handle(
    'mcp:update',
    async (_event, projectName: string, name: string, server: McpServerEntry) => {
      const projectDir = getProjectPath(projectName)
      const config = await updateMcpServer(projectDir, name, server)
      return config.mcpServers
    }
  )

  ipcMain.handle(
    'mcp:remove',
    async (_event, projectName: string, name: string) => {
      const projectDir = getProjectPath(projectName)
      const config = await removeMcpServer(projectDir, name)
      return config.mcpServers
    }
  )
}

import { contextBridge, ipcRenderer } from 'electron'
import type { IElectronAPI } from './types'

const api: IElectronAPI = {
  // PTY
  ptySpawn: (id, options) => ipcRenderer.invoke('pty:spawn', id, options),
  ptyWrite: (id, data) => ipcRenderer.send('pty:write', id, data),
  ptyResize: (id, cols, rows) => ipcRenderer.send('pty:resize', id, cols, rows),
  ptyKill: (id) => ipcRenderer.invoke('pty:kill', id),
  onPtyData: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, id: string, data: string) => callback(id, data)
    ipcRenderer.on('pty:data', listener)
    return () => ipcRenderer.removeListener('pty:data', listener)
  },
  onPtyExit: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, id: string, code: number) => callback(id, code)
    ipcRenderer.on('pty:exit', listener)
    return () => ipcRenderer.removeListener('pty:exit', listener)
  },

  // Filesystem
  listDisks: () => ipcRenderer.invoke('fs:list-disks'),
  readDir: (dirPath) => ipcRenderer.invoke('fs:read-dir', dirPath),
  readFile: (filePath) => ipcRenderer.invoke('fs:read-file', filePath),
  stat: (filePath) => ipcRenderer.invoke('fs:stat', filePath),
  fsWatch: (dirPath) => ipcRenderer.invoke('fs:watch', dirPath),
  fsUnwatch: (dirPath) => ipcRenderer.invoke('fs:unwatch', dirPath),
  onFsChanged: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, rootPath: string, changedDir: string) => callback(rootPath, changedDir)
    ipcRenderer.on('fs:changed', listener)
    return () => ipcRenderer.removeListener('fs:changed', listener)
  },

  // Projects
  listProjects: () => ipcRenderer.invoke('project:list'),
  createProject: (name) => ipcRenderer.invoke('project:create', name),
  deleteProject: (name) => ipcRenderer.invoke('project:delete', name),
  getProjectsDir: () => ipcRenderer.invoke('project:get-projects-dir'),

  // MCP
  listMcpServers: (projectName) => ipcRenderer.invoke('mcp:list', projectName),
  addMcpServer: (projectName, name, server) => ipcRenderer.invoke('mcp:add', projectName, name, server),
  updateMcpServer: (projectName, name, server) => ipcRenderer.invoke('mcp:update', projectName, name, server),
  removeMcpServer: (projectName, name) => ipcRenderer.invoke('mcp:remove', projectName, name),

  // AI Engines
  listEngines: () => ipcRenderer.invoke('engines:available'),
  detectEngines: () => ipcRenderer.invoke('engines:detect'),
  getCommand: (engineId, intent, params) => ipcRenderer.invoke('engines:command', engineId, intent, params),
  listAgents: (engineId, projectPath) => ipcRenderer.invoke('engines:list-agents', engineId, projectPath),
  listSkills: (engineId, projectPath) => ipcRenderer.invoke('engines:list-skills', engineId, projectPath),

  // Settings
  getSetting: (key) => ipcRenderer.invoke('settings:get', key),
  setSetting: (key, value) => ipcRenderer.invoke('settings:set', key, value),

  // Window controls
  windowMinimize: () => ipcRenderer.send('window:minimize'),
  windowMaximize: () => ipcRenderer.send('window:maximize'),
  windowClose: () => ipcRenderer.send('window:close'),
}

contextBridge.exposeInMainWorld('api', api)

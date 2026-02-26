export interface Project {
  name: string
  path: string
  createdAt: string
}

export interface DirEntry {
  name: string
  path: string
  isDirectory: boolean
  size: number
  modified: number
}

export interface DiskInfo {
  letter: string
  label: string
  free: number
  size: number
}

export interface McpServer {
  command: string
  args?: string[]
  env?: Record<string, string>
}

export interface PtySpawnOptions {
  shell?: string
  cwd?: string
  env?: Record<string, string>
  cols?: number
  rows?: number
}

export interface AgentEntry {
  name: string
  description: string
  model?: string
  tools?: string
  filePath: string
}

export interface SkillEntry {
  name: string
  description: string
  userInvocable?: boolean
  filePath: string
}

interface IElectronAPI {
  ptySpawn: (id: string, options?: PtySpawnOptions) => Promise<void>
  ptyWrite: (id: string, data: string) => void
  ptyResize: (id: string, cols: number, rows: number) => void
  ptyKill: (id: string) => Promise<void>
  onPtyData: (callback: (id: string, data: string) => void) => () => void
  onPtyExit: (callback: (id: string, code: number) => void) => () => void

  listDisks: () => Promise<DiskInfo[]>
  readDir: (dirPath: string) => Promise<DirEntry[]>
  readFile: (filePath: string) => Promise<string | null>
  writeFile: (filePath: string, content: string) => Promise<void>
  stat: (filePath: string) => Promise<DirEntry>
  fsWatch: (dirPath: string) => Promise<void>
  fsUnwatch: (dirPath: string) => Promise<void>
  onFsChanged: (callback: (rootPath: string, changedDir: string) => void) => () => void

  listProjects: () => Promise<Project[]>
  createProject: (name: string) => Promise<Project>
  deleteProject: (name: string) => Promise<void>
  getProjectsDir: () => Promise<string>

  listMcpServers: (projectName: string) => Promise<unknown>
  addMcpServer: (projectName: string, name: string, server: McpServer) => Promise<void>
  updateMcpServer: (projectName: string, name: string, server: McpServer) => Promise<void>
  removeMcpServer: (projectName: string, name: string) => Promise<void>

  listEngines: () => Promise<unknown[]>
  detectEngines: () => Promise<unknown[]>
  getCommand: (engineId: string, intent: string, params?: Record<string, string>) => Promise<string>
  listAgents: (engineId: string, projectPath: string) => Promise<AgentEntry[]>
  listSkills: (engineId: string, projectPath: string) => Promise<SkillEntry[]>

  getSetting: (key: string) => Promise<unknown>
  setSetting: (key: string, value: unknown) => Promise<void>

  onGuiAction: (callback: (payload: unknown) => void) => () => void

  windowMinimize: () => void
  windowMaximize: () => void
  windowClose: () => void
  windowSetFocusMode: (enabled: boolean) => void
  openProjectWindow: (projectName: string) => void
}

function getApi(): IElectronAPI {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).api as IElectronAPI
}

// PTY
export const ptySpawn = (id: string, opts?: PtySpawnOptions) => getApi().ptySpawn(id, opts)
export const ptyWrite = (id: string, data: string) => getApi().ptyWrite(id, data)
export const ptyResize = (id: string, cols: number, rows: number) => getApi().ptyResize(id, cols, rows)
export const ptyKill = (id: string) => getApi().ptyKill(id)
export const onPtyData = (cb: (id: string, data: string) => void) => getApi().onPtyData(cb)
export const onPtyExit = (cb: (id: string, code: number) => void) => getApi().onPtyExit(cb)

// Filesystem
export const listDisks = () => getApi().listDisks()
export const readDir = (p: string) => getApi().readDir(p)
export const readFile = (p: string) => getApi().readFile(p)
export const writeFile = (p: string, content: string) => getApi().writeFile(p, content)
export const fsWatch = (p: string) => getApi().fsWatch(p)
export const fsUnwatch = (p: string) => getApi().fsUnwatch(p)
export const onFsChanged = (cb: (rootPath: string, changedDir: string) => void) => getApi().onFsChanged(cb)

// Projects
export const listProjects = () => getApi().listProjects()
export const createProject = (name: string) => getApi().createProject(name)
export const deleteProject = (name: string) => getApi().deleteProject(name)
export const getProjectsDir = () => getApi().getProjectsDir()

// MCP
export const listMcpServers = (projectName: string) => getApi().listMcpServers(projectName)
export const addMcpServer = (projectName: string, name: string, server: McpServer) =>
  getApi().addMcpServer(projectName, name, server)
export const removeMcpServer = (projectName: string, name: string) =>
  getApi().removeMcpServer(projectName, name)

// AI Engines
export const listEngines = () => getApi().listEngines()
export const detectEngines = () => getApi().detectEngines()
export const getCommand = (engineId: string, intent: string, params?: Record<string, string>) =>
  getApi().getCommand(engineId, intent, params)
export const listAgents = async (engineId: string, projectPath: string) => {
  const fn = getApi().listAgents
  if (typeof fn !== 'function') return []
  return fn(engineId, projectPath)
}
export const listSkills = async (engineId: string, projectPath: string) => {
  const fn = getApi().listSkills
  if (typeof fn !== 'function') return []
  return fn(engineId, projectPath)
}

// Settings
export const getSetting = (key: string) => getApi().getSetting(key)
export const setSetting = (key: string, value: unknown) => getApi().setSetting(key, value)

// Window
export const windowMinimize = () => getApi().windowMinimize()
export const windowMaximize = () => getApi().windowMaximize()
export const windowClose = () => getApi().windowClose()
export const windowSetFocusMode = (enabled: boolean) => getApi().windowSetFocusMode(enabled)
export const openProjectWindow = (projectName: string) => getApi().openProjectWindow(projectName)

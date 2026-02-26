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

export interface Project {
  name: string
  path: string
  createdAt: string
}

export interface McpServer {
  command: string
  args?: string[]
  env?: Record<string, string>
}

export interface McpConfig {
  mcpServers: Record<string, McpServer>
}

export interface AIEngineInfo {
  id: string
  name: string
  command: string
  isAvailable: boolean
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

export interface PtySpawnOptions {
  shell?: string
  cwd?: string
  env?: Record<string, string>
  cols?: number
  rows?: number
}

export interface IElectronAPI {
  // PTY
  ptySpawn: (id: string, options?: PtySpawnOptions) => Promise<void>
  ptyWrite: (id: string, data: string) => void
  ptyResize: (id: string, cols: number, rows: number) => void
  ptyKill: (id: string) => Promise<void>
  onPtyData: (callback: (id: string, data: string) => void) => () => void
  onPtyExit: (callback: (id: string, code: number) => void) => () => void

  // Filesystem
  listDisks: () => Promise<DiskInfo[]>
  readDir: (dirPath: string) => Promise<DirEntry[]>
  readFile: (filePath: string) => Promise<string | null>
  stat: (filePath: string) => Promise<DirEntry>
  fsWatch: (dirPath: string) => Promise<void>
  fsUnwatch: (dirPath: string) => Promise<void>
  onFsChanged: (callback: (rootPath: string, changedDir: string) => void) => () => void

  // Projects
  listProjects: () => Promise<Project[]>
  createProject: (name: string) => Promise<Project>
  deleteProject: (name: string) => Promise<void>
  getProjectsDir: () => Promise<string>

  // MCP
  listMcpServers: (projectName: string) => Promise<McpConfig>
  addMcpServer: (projectName: string, name: string, server: McpServer) => Promise<void>
  updateMcpServer: (projectName: string, name: string, server: McpServer) => Promise<void>
  removeMcpServer: (projectName: string, name: string) => Promise<void>

  // AI Engines
  listEngines: () => Promise<AIEngineInfo[]>
  detectEngines: () => Promise<AIEngineInfo[]>
  getCommand: (engineId: string, intent: string, params?: Record<string, string>) => Promise<string>
  listAgents: (engineId: string, projectPath: string) => Promise<AgentEntry[]>
  listSkills: (engineId: string, projectPath: string) => Promise<SkillEntry[]>

  // Settings
  getSetting: (key: string) => Promise<unknown>
  setSetting: (key: string, value: unknown) => Promise<void>

  // Window controls
  windowMinimize: () => void
  windowMaximize: () => void
  windowClose: () => void
}

import { ipcMain } from 'electron'
import {
  isGitAvailable,
  getGitStatus,
  getChangedFiles,
  gitAdd,
  gitCommit,
  gitPush,
  gitPull,
  gitInit,
  getGitConfig,
  setGitConfig
} from './git-manager'

/**
 * Registers all git-related IPC handlers.
 * Uses a guard to prevent double-registration.
 */
export function registerGitIpc(): void {
  if ((registerGitIpc as { _registered?: boolean })._registered) return
  ;(registerGitIpc as { _registered?: boolean })._registered = true

  ipcMain.handle('git:available', async () => {
    return isGitAvailable()
  })

  ipcMain.handle('git:status', async (_event, cwd: string) => {
    return getGitStatus(cwd)
  })

  ipcMain.handle('git:changed-files', async (_event, cwd: string) => {
    return getChangedFiles(cwd)
  })

  ipcMain.handle('git:add', async (_event, cwd: string, files: string[]) => {
    await gitAdd(cwd, files)
  })

  ipcMain.handle('git:commit', async (_event, cwd: string, message: string) => {
    return gitCommit(cwd, message)
  })

  ipcMain.handle('git:push', async (_event, cwd: string, remote?: string, branch?: string) => {
    return gitPush(cwd, remote, branch)
  })

  ipcMain.handle('git:pull', async (_event, cwd: string) => {
    return gitPull(cwd)
  })

  ipcMain.handle('git:init', async (_event, cwd: string) => {
    return gitInit(cwd)
  })

  ipcMain.handle('git:config-get', async (_event, key: string) => {
    return getGitConfig(key)
  })

  ipcMain.handle('git:config-set', async (_event, key: string, value: string) => {
    await setGitConfig(key, value)
  })
}

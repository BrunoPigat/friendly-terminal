import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)
const GIT_TIMEOUT = 15_000

export interface GitStatus {
  isRepo: boolean
  branch: string
  ahead: number
  behind: number
  staged: number
  modified: number
  untracked: number
  hasRemote: boolean
}

export interface GitFileChange {
  path: string
  status: 'modified' | 'added' | 'deleted' | 'untracked' | 'renamed'
  staged: boolean
}

async function runGit(args: string[], cwd: string): Promise<string> {
  const { stdout } = await execFileAsync('git', args, { cwd, timeout: GIT_TIMEOUT })
  return stdout
}

/**
 * Checks whether git is available in the system PATH.
 */
export async function isGitAvailable(): Promise<boolean> {
  const whichCmd = process.platform === 'win32' ? 'where' : 'which'
  try {
    await execFileAsync(whichCmd, ['git'], { timeout: 5000 })
    return true
  } catch {
    return false
  }
}

/**
 * Checks whether a directory is inside a git repository.
 */
export async function isGitRepo(cwd: string): Promise<boolean> {
  try {
    const out = await runGit(['rev-parse', '--is-inside-work-tree'], cwd)
    return out.trim() === 'true'
  } catch {
    return false
  }
}

/**
 * Returns a summary of the git status for a repository.
 */
export async function getGitStatus(cwd: string): Promise<GitStatus> {
  const notRepo: GitStatus = {
    isRepo: false, branch: '', ahead: 0, behind: 0,
    staged: 0, modified: 0, untracked: 0, hasRemote: false
  }

  if (!(await isGitRepo(cwd))) return notRepo

  try {
    const out = await runGit(['status', '--porcelain=v2', '--branch'], cwd)
    const lines = out.split('\n')

    let branch = ''
    let ahead = 0
    let behind = 0
    let hasRemote = false
    let staged = 0
    let modified = 0
    let untracked = 0

    for (const line of lines) {
      if (line.startsWith('# branch.head ')) {
        branch = line.slice('# branch.head '.length)
      } else if (line.startsWith('# branch.ab ')) {
        const match = line.match(/\+(\d+) -(\d+)/)
        if (match) {
          ahead = parseInt(match[1], 10)
          behind = parseInt(match[2], 10)
        }
        hasRemote = true
      } else if (line.startsWith('1 ') || line.startsWith('2 ')) {
        // Changed entry: "1 XY ..." or "2 XY ..." (renamed)
        const xy = line.split(' ')[1]
        if (xy) {
          const x = xy[0] // index (staged)
          const y = xy[1] // worktree
          if (x !== '.' && x !== '?') staged++
          if (y !== '.' && y !== '?') modified++
        }
      } else if (line.startsWith('? ')) {
        untracked++
      }
    }

    return { isRepo: true, branch, ahead, behind, staged, modified, untracked, hasRemote }
  } catch {
    return notRepo
  }
}

/**
 * Returns a list of changed files with their status.
 */
export async function getChangedFiles(cwd: string): Promise<GitFileChange[]> {
  try {
    const out = await runGit(['status', '--porcelain'], cwd)
    const files: GitFileChange[] = []

    for (const line of out.split('\n')) {
      if (!line || line.length < 4) continue

      const x = line[0] // index status
      const y = line[1] // worktree status
      const filePath = line.slice(3)

      if (x === '?' && y === '?') {
        files.push({ path: filePath, status: 'untracked', staged: false })
        continue
      }

      // Staged changes
      if (x !== ' ' && x !== '?') {
        files.push({
          path: filePath,
          status: charToStatus(x),
          staged: true
        })
      }

      // Unstaged changes
      if (y !== ' ' && y !== '?') {
        files.push({
          path: filePath,
          status: charToStatus(y),
          staged: false
        })
      }
    }

    return files
  } catch {
    return []
  }
}

function charToStatus(c: string): GitFileChange['status'] {
  switch (c) {
    case 'M': return 'modified'
    case 'A': return 'added'
    case 'D': return 'deleted'
    case 'R': return 'renamed'
    default: return 'modified'
  }
}

/**
 * Stage files for commit.
 */
export async function gitAdd(cwd: string, files: string[]): Promise<void> {
  await runGit(['add', ...files], cwd)
}

/**
 * Create a commit with the given message.
 */
export async function gitCommit(cwd: string, message: string): Promise<string> {
  const out = await runGit(['commit', '-m', message], cwd)
  return out.trim()
}

/**
 * Push to remote.
 */
export async function gitPush(cwd: string, remote?: string, branch?: string): Promise<string> {
  const args = ['push']
  if (remote) args.push(remote)
  if (branch) args.push(branch)
  const out = await runGit(args, cwd)
  return out.trim()
}

/**
 * Pull from remote.
 */
export async function gitPull(cwd: string): Promise<string> {
  const out = await runGit(['pull'], cwd)
  return out.trim()
}

/**
 * Initialize a new git repository.
 */
export async function gitInit(cwd: string): Promise<string> {
  const out = await runGit(['init'], cwd)
  return out.trim()
}

/**
 * Read a global git config value.
 */
export async function getGitConfig(key: string): Promise<string | null> {
  try {
    const out = await runGit(['config', '--global', key], process.cwd())
    return out.trim() || null
  } catch {
    return null
  }
}

/**
 * Set a global git config value.
 */
export async function setGitConfig(key: string, value: string): Promise<void> {
  await runGit(['config', '--global', key, value], process.cwd())
}

import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

export interface DiskInfo {
  letter: string
  label: string
  free: number
  size: number
}

/**
 * Lists available filesystem drives on Windows using PowerShell.
 * Returns drive letter, volume label, free space and total size in bytes.
 */
export async function listDisks(): Promise<DiskInfo[]> {
  if (process.platform !== 'win32') {
    return [
      { letter: '/', label: 'Root', free: 0, size: 0 }
    ]
  }

  const psCommand = [
    'Get-PSDrive -PSProvider FileSystem',
    '| Where-Object { $_.Used -ne $null }',
    '| Select-Object Name, @{N="Label";E={(Get-Volume -DriveLetter $_.Name -ErrorAction SilentlyContinue).FileSystemLabel}}, Free, Used',
    '| ConvertTo-Json -Compress'
  ].join(' ')

  try {
    const { stdout } = await execFileAsync('powershell.exe', [
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      psCommand
    ], { timeout: 10000 })

    const trimmed = stdout.trim()
    if (!trimmed) {
      return []
    }

    const parsed = JSON.parse(trimmed)
    // PowerShell returns a single object when there is one drive, array otherwise
    const drives: Array<{
      Name: string
      Label: string | null
      Free: number
      Used: number
    }> = Array.isArray(parsed) ? parsed : [parsed]

    return drives.map((d) => ({
      letter: d.Name,
      label: d.Label || '',
      free: d.Free ?? 0,
      size: (d.Free ?? 0) + (d.Used ?? 0)
    }))
  } catch (err) {
    // Fallback: return common drives without details
    console.error('Failed to list disks via PowerShell:', err)
    return [{ letter: 'C', label: 'Local Disk', free: 0, size: 0 }]
  }
}

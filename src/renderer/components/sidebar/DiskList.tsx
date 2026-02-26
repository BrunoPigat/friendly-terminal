import { useDisks } from '@/hooks/useDisks'

interface DiskListProps {
  selectedDisk: string | null
  onSelectDisk: (mount: string) => void
}

/**
 * Lists available Windows drives (C:\, D:\, etc).
 * Click a drive to set it as the current root for the folder tree.
 */
export default function DiskList({ selectedDisk, onSelectDisk }: DiskListProps) {
  const { disks, loading, error, refresh } = useDisks()

  if (loading) {
    return (
      <div className="px-3 py-2 text-xs text-zinc-500">Loading drives...</div>
    )
  }

  if (error) {
    return (
      <div className="px-3 py-2 text-xs text-red-400">
        {error}{' '}
        <button onClick={refresh} className="underline hover:text-red-300">
          Retry
        </button>
      </div>
    )
  }

  if (disks.length === 0) {
    return (
      <div className="px-3 py-2 text-xs text-zinc-500">No drives found.</div>
    )
  }

  return (
    <div className="flex flex-wrap gap-1 px-3 py-2">
      {disks.map((disk) => {
        const isActive = selectedDisk === disk.mount
        return (
          <button
            key={disk.mount}
            onClick={() => onSelectDisk(disk.mount)}
            className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
              isActive
                ? 'bg-zinc-700 text-zinc-100'
                : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
            }`}
            title={`${disk.name || disk.mount} (${formatSize(disk.size)})`}
          >
            {disk.mount}
          </button>
        )
      })}
    </div>
  )
}

function formatSize(bytes: number): string {
  if (bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const val = bytes / Math.pow(1024, i)
  return `${val.toFixed(1)} ${units[i]}`
}

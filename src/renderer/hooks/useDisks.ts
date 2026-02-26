import { useState, useEffect } from 'react'
import * as api from '@/lib/api'

export interface DiskInfo {
  name: string
  mount: string
  size: number
}

/**
 * Fetches the list of available Windows drives on mount.
 * Returns the disk list, a loading flag, and a refresh function.
 */
export function useDisks() {
  const [disks, setDisks] = useState<DiskInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchDisks() {
    setLoading(true)
    setError(null)
    try {
      const result = await api.listDisks()
      setDisks(result)
    } catch (err) {
      console.error('Failed to list disks:', err)
      setError('Failed to list disks')
      setDisks([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDisks()
  }, [])

  return { disks, loading, error, refresh: fetchDisks }
}

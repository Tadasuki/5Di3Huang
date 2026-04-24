import { useMemo } from 'react'
import { getLeaderMapRaw } from '../data/catalog'

/**
 * Hook to get a single leader by ID
 */
export function useLeader(id) {
  return useMemo(() => ({
    leader: id ? getLeaderMapRaw()[id] ?? null : null,
    loading: false,
  }), [id])
}

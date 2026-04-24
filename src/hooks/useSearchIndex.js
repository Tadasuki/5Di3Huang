import { useMemo } from 'react'
import {
  getDynastyListRaw,
  getHistoricalEventListRaw,
  getLeaderListRaw,
  getRegionalRegimeListRaw,
} from '../data/catalog'

export function useSearchIndex() {
  return useMemo(() => {
    const dynasties = getDynastyListRaw().map(d => ({ ...d, kind: 'dynasty' }))
    const regional = getRegionalRegimeListRaw().map(r => ({ ...r, kind: 'regional' }))
    const leaders = getLeaderListRaw()
    const events = getHistoricalEventListRaw()

    return { dynasties, regional, leaders, events }
  }, [])
}

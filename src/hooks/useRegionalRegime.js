import { useMemo } from 'react'
import { getLeaderMapRaw, getRegionalRegimeListRaw } from '../data/catalog'

let leadersMapCache = null
function getLeadersMap() {
  if (leadersMapCache) return leadersMapCache
  leadersMapCache = getLeaderMapRaw()
  return leadersMapCache
}

let leadersByPolityCache = null
function getLeadersByPolityMap() {
  if (leadersByPolityCache) return leadersByPolityCache
  const leaders = Object.values(getLeadersMap())
  const map = {}
  leaders.forEach(l => {
    const positions = Array.isArray(l.positions) ? l.positions : []
    positions.forEach(p => {
      const polityId = p?.polityId
      if (!polityId) return
      if (!map[polityId]) map[polityId] = []
      map[polityId].push(l.id)
    })
  })
  leadersByPolityCache = map
  return leadersByPolityCache
}

let regimeMapCache = null
let regimeListCache = null
function getRegionalRegimeMap() {
  if (!regimeMapCache) {
    const leaders = getLeadersMap()
    const leadersByPolity = getLeadersByPolityMap()
    const enrichedList = getRegionalRegimeListRaw().map(r => ({
      ...r,
      leaderData: Array.from(
        new Set([...(r.leaders || []), ...((leadersByPolity[r.id] || []))])
      )
        .map(id => leaders[id])
        .filter(Boolean),
    }))
    regimeListCache = enrichedList
    regimeMapCache = Object.fromEntries(enrichedList.map(r => [r.id, r]))
  }
  return regimeMapCache
}

export function useRegionalRegime(id) {
  const regime = useMemo(
    () => (id ? getRegionalRegimeMap()[id] ?? null : null),
    [id]
  )
  return { regime }
}

export function useRegionalRegimes() {
  return useMemo(() => {
    getRegionalRegimeMap()
    return regimeListCache || []
  }, [])
}

export function useRegionalRegimeIdSet() {
  return useMemo(() => new Set(getRegionalRegimeListRaw().map(r => r.id)), [])
}

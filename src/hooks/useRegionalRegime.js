import { useMemo } from 'react'

const regionalModules = import.meta.glob('/data/regional_regimes.json', { eager: true })
const leaderFiles = import.meta.glob('/data/leaders/**/*.json', { eager: true })

function getRegionalList() {
  const path = Object.keys(regionalModules)[0]
  if (!path) return []
  const raw = regionalModules[path]?.default || regionalModules[path]
  return Array.isArray(raw) ? raw : []
}

let leadersMapCache = null
function getLeadersMap() {
  if (leadersMapCache) return leadersMapCache
  leadersMapCache = {}
  Object.values(leaderFiles).forEach(module => {
    const data = module.default || module
    if (data?.id) leadersMapCache[data.id] = data
  })
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
    const enrichedList = getRegionalList().map(r => ({
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
  return useMemo(() => new Set(getRegionalList().map(r => r.id)), [])
}

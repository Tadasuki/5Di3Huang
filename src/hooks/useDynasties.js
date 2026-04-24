import { useMemo } from 'react'
import { getDynastyListRaw, getFamilyListRaw, getLeaderListRaw, getLeaderMapRaw } from '../data/catalog'

let cachedLeadersByPolity = null
function getLeadersByPolityMap() {
  if (cachedLeadersByPolity) return cachedLeadersByPolity
  const leaders = Object.values(getLeaderMapRaw())
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
  cachedLeadersByPolity = map
  return cachedLeadersByPolity
}

function getEnrichedDynasties() {
  const dynasties = getDynastyListRaw()
  const leaders = getLeaderMapRaw()
  const leadersByPolity = getLeadersByPolityMap()

  return dynasties.map(d => ({
    ...d,
    leaderData: Array.from(
      new Set([...(d.leaders || []), ...((leadersByPolity[d.id] || []))])
    )
      .map(id => leaders[id])
      .filter(Boolean),
  }))
}

function getEnrichedFamilies() {
  const families = getFamilyListRaw()
  const leaders = getLeaderListRaw()

  return families.map(f => ({
    ...f,
    leaderData: leaders.filter(l => l.familyId === f.id),
  }))
}

/**
 * Hook to get all dynasties with their leaders populated
 */
export function useDynasties() {
  return useMemo(() => ({
    dynasties: getEnrichedDynasties(),
    loading: false,
  }), [])
}

/**
 * Hook to get all leaders
 */
export function useAllLeaders() {
  return useMemo(() => getLeaderListRaw(), [])
}

/**
 * 按朝代 id 取单条朝代（含 leaderData），用于朝代详情页
 */
export function useDynasty(dynastyId) {
  const { dynasties, loading } = useDynasties()
  const dynasty = useMemo(
    () => dynasties.find(d => d.id === dynastyId) ?? null,
    [dynasties, dynastyId]
  )
  return { dynasty, loading }
}

/**
 * Hook to get all families with their leaders populated
 */
export function useFamilies() {
  return useMemo(() => ({
    families: getEnrichedFamilies(),
    loading: false,
  }), [])
}

/**
 * Hook to get a single family
 */
export function useFamily(familyId) {
  const { families, loading } = useFamilies()
  const family = useMemo(
    () => families.find(f => f.id === familyId) ?? null,
    [families, familyId]
  )
  return { family, loading }
}

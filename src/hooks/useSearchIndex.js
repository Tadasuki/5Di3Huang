import { useMemo } from 'react'

const dynastyModules = import.meta.glob('/data/dynasties.json', { eager: true })
const regionalModules = import.meta.glob('/data/regional_regimes.json', { eager: true })
const leaderFiles = import.meta.glob('/data/leaders/**/*.json', { eager: true })
const eventModules = import.meta.glob('/data/historical_events.json', { eager: true })

function getFirstDefault(mods) {
  const path = Object.keys(mods)[0]
  if (!path) return null
  const raw = mods[path]?.default || mods[path]
  return raw ?? null
}

function getDynastiesRaw() {
  const raw = getFirstDefault(dynastyModules)
  return Array.isArray(raw) ? raw : []
}

function getRegionalRaw() {
  const raw = getFirstDefault(regionalModules)
  return Array.isArray(raw) ? raw : []
}

function getLeadersRaw() {
  return Object.values(leaderFiles)
    .map(m => m.default || m)
    .filter(Boolean)
}

function getEventsRaw() {
  const raw = getFirstDefault(eventModules)
  return Array.isArray(raw) ? raw : []
}

export function useSearchIndex() {
  return useMemo(() => {
    const dynasties = getDynastiesRaw().map(d => ({ ...d, kind: 'dynasty' }))
    const regional = getRegionalRaw().map(r => ({ ...r, kind: 'regional' }))
    const leaders = getLeadersRaw()
    const events = getEventsRaw()

    return { dynasties, regional, leaders, events }
  }, [])
}


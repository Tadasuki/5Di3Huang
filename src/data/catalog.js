import { COUNTRY_KEYS, normalizeCountry, sortByCountry } from './countries'

const dynastyModules = import.meta.glob('/data/countries/*/dynasties.json', { eager: true })
const familyModules = import.meta.glob('/data/countries/*/families.json', { eager: true })
const regionalModules = import.meta.glob('/data/countries/*/regional_regimes.json', { eager: true })
const timelineModules = import.meta.glob('/data/countries/*/timeline.json', { eager: true })
const leaderModules = import.meta.glob('/data/countries/*/leaders/**/*.json', { eager: true })
const eventModules = import.meta.glob('/data/historical_events.json', { eager: true })

function inferCountryFromPath(path) {
  const match = /^\/data\/countries\/([^/]+)\//.exec(path)
  return normalizeCountry(match?.[1])
}

function sortModulePaths(paths) {
  return [...paths].sort((a, b) => {
    const byCountry = sortByCountry(inferCountryFromPath(a), inferCountryFromPath(b))
    return byCountry || a.localeCompare(b)
  })
}

function withCountry(record, country) {
  if (!record || typeof record !== 'object') return record
  return record.country ? record : { ...record, country }
}

function loadArrayCollection(modules) {
  return sortModulePaths(Object.keys(modules)).flatMap(path => {
    const raw = modules[path]?.default || modules[path]
    const country = inferCountryFromPath(path)
    if (!Array.isArray(raw)) return []
    return raw.map(item => withCountry(item, country)).filter(Boolean)
  })
}

function loadLeaderCollection() {
  return sortModulePaths(Object.keys(leaderModules))
    .map(path => {
      const raw = leaderModules[path]?.default || leaderModules[path]
      const country = inferCountryFromPath(path)
      return raw ? withCountry(raw, country) : null
    })
    .filter(Boolean)
}

function getFirstDefault(modules) {
  const path = Object.keys(modules)[0]
  if (!path) return null
  return modules[path]?.default || modules[path] || null
}

let dynastiesCache = null
export function getDynastyListRaw() {
  if (!dynastiesCache) dynastiesCache = loadArrayCollection(dynastyModules)
  return dynastiesCache
}

let familiesCache = null
export function getFamilyListRaw() {
  if (!familiesCache) familiesCache = loadArrayCollection(familyModules)
  return familiesCache
}

let regionalCache = null
export function getRegionalRegimeListRaw() {
  if (!regionalCache) regionalCache = loadArrayCollection(regionalModules)
  return regionalCache
}

let leadersCache = null
export function getLeaderListRaw() {
  if (!leadersCache) leadersCache = loadLeaderCollection()
  return leadersCache
}

let leaderMapCache = null
export function getLeaderMapRaw() {
  if (!leaderMapCache) {
    leaderMapCache = Object.fromEntries(getLeaderListRaw().map(leader => [leader.id, leader]))
  }
  return leaderMapCache
}

let eventsCache = null
export function getHistoricalEventListRaw() {
  if (!eventsCache) {
    const raw = getFirstDefault(eventModules)
    eventsCache = Array.isArray(raw) ? raw : []
  }
  return eventsCache
}

let timelinesCache = null
export function getTimelineMapRaw() {
  if (!timelinesCache) {
    timelinesCache = Object.fromEntries(COUNTRY_KEYS.map(country => [country, []]))
    sortModulePaths(Object.keys(timelineModules)).forEach(path => {
      const raw = timelineModules[path]?.default || timelineModules[path]
      const country = inferCountryFromPath(path)
      if (country) timelinesCache[country] = Array.isArray(raw) ? raw : []
    })
  }
  return timelinesCache
}

let polityCountryMapCache = null
export function getPolityCountryMapRaw() {
  if (!polityCountryMapCache) {
    polityCountryMapCache = new Map()
    getDynastyListRaw().forEach(item => {
      if (item?.id) polityCountryMapCache.set(String(item.id), item.country || '')
    })
    getRegionalRegimeListRaw().forEach(item => {
      if (item?.id && !polityCountryMapCache.has(String(item.id))) {
        polityCountryMapCache.set(String(item.id), item.country || '')
      }
    })
  }
  return polityCountryMapCache
}

export function resolveLeaderCountry(leader) {
  if (!leader) return ''
  if (leader.country) return normalizeCountry(leader.country)

  const polityCountries = getPolityCountryMapRaw()
  if (leader.dynastyId) {
    const viaDynasty = normalizeCountry(polityCountries.get(String(leader.dynastyId)))
    if (viaDynasty) return viaDynasty
  }

  const positions = Array.isArray(leader.positions) ? leader.positions : []
  for (const position of positions) {
    const viaPosition = normalizeCountry(polityCountries.get(String(position?.polityId || '')))
    if (viaPosition) return viaPosition
  }

  return ''
}

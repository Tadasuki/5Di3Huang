import { useMemo } from 'react'

const eventModules = import.meta.glob('/data/historical_events.json', { eager: true })

function getEventList() {
  const path = Object.keys(eventModules)[0]
  if (!path) return []
  const raw = eventModules[path]?.default || eventModules[path]
  return Array.isArray(raw) ? raw : []
}

let cachedMap = null
function getEventMap() {
  if (!cachedMap) {
    cachedMap = Object.fromEntries(getEventList().map(e => [e.id, e]))
  }
  return cachedMap
}

export function useHistoricalEvents() {
  return useMemo(() => getEventList(), [])
}

export function useHistoricalEvent(id) {
  return useMemo(() => (id ? getEventMap()[id] ?? null : null), [id])
}


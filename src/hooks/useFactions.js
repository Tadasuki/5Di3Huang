import { useEffect, useMemo, useState } from 'react'

const factionsData = import.meta.glob('/data/factions.json', { eager: true })

let cachedFactions = null
function getFactions() {
  if (cachedFactions) return cachedFactions
  const path = Object.keys(factionsData)[0]
  const raw = path ? (factionsData[path]?.default || factionsData[path]) : []
  cachedFactions = Array.isArray(raw) ? raw : []
  return cachedFactions
}

export function useFactions() {
  const [factions, setFactions] = useState([])

  useEffect(() => {
    setFactions(getFactions())
  }, [])

  const factionById = useMemo(() => {
    const map = new Map()
    factions.forEach(f => {
      if (f?.id) map.set(String(f.id), f)
    })
    return map
  }, [factions])

  return { factions, factionById }
}


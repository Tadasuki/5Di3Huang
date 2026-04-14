import { useState, useEffect, useMemo } from 'react';

const dynastiesData = import.meta.glob('/data/dynasties.json', { eager: true });
const leaderFiles = import.meta.glob('/data/leaders/**/*.json', { eager: true });
const familiesData = import.meta.glob('/data/families.json', { eager: true });

// Get cached families data
let cachedFamilies = null;
function getFamilies() {
  if (cachedFamilies) return cachedFamilies;
  const path = Object.keys(familiesData)[0];
  cachedFamilies = familiesData[path]?.default || familiesData[path] || [];
  return cachedFamilies;
}

// Get cached dynasties data
let cachedDynasties = null;
function getDynasties() {
  if (cachedDynasties) return cachedDynasties;
  const path = Object.keys(dynastiesData)[0];
  cachedDynasties = dynastiesData[path]?.default || dynastiesData[path];
  return cachedDynasties;
}

// Build a leaders lookup map
let cachedLeaders = null;
function getLeadersMap() {
  if (cachedLeaders) return cachedLeaders;
  cachedLeaders = {};
  Object.entries(leaderFiles).forEach(([path, module]) => {
    const data = module.default || module;
    cachedLeaders[data.id] = data;
  });
  return cachedLeaders;
}

let cachedLeadersByPolity = null;
function getLeadersByPolityMap() {
  if (cachedLeadersByPolity) return cachedLeadersByPolity;
  const leaders = Object.values(getLeadersMap());
  const map = {};
  leaders.forEach(l => {
    const positions = Array.isArray(l.positions) ? l.positions : [];
    positions.forEach(p => {
      const polityId = p?.polityId;
      if (!polityId) return;
      if (!map[polityId]) map[polityId] = [];
      map[polityId].push(l.id);
    });
  });
  cachedLeadersByPolity = map;
  return cachedLeadersByPolity;
}

/**
 * Hook to get all dynasties with their leaders populated
 */
export function useDynasties() {
  const [data, setData] = useState({ dynasties: [], loading: true });

  useEffect(() => {
    const dynasties = getDynasties();
    const leaders = getLeadersMap();
    const leadersByPolity = getLeadersByPolityMap();

    const enriched = dynasties.map(d => ({
      ...d,
      leaderData: Array.from(
        new Set([...(d.leaders || []), ...((leadersByPolity[d.id] || []))])
      )
        .map(id => leaders[id])
        .filter(Boolean)
    }));

    setData({ dynasties: enriched, loading: false });
  }, []);

  return data;
}

/**
 * Hook to get all leaders
 */
export function useAllLeaders() {
  const [leaders, setLeaders] = useState([]);

  useEffect(() => {
    setLeaders(Object.values(getLeadersMap()));
  }, []);

  return leaders;
}

/**
 * 按朝代 id 取单条朝代（含 leaderData），用于朝代详情页
 */
export function useDynasty(dynastyId) {
  const { dynasties, loading } = useDynasties();
  const dynasty = useMemo(
    () => dynasties.find(d => d.id === dynastyId) ?? null,
    [dynasties, dynastyId]
  );
  return { dynasty, loading };
}

/**
 * Hook to get all families with their leaders populated
 */
export function useFamilies() {
  const [data, setData] = useState({ families: [], loading: true });

  useEffect(() => {
    const families = getFamilies();
    const leaders = Object.values(getLeadersMap());

    const enriched = families.map(f => {
      const familyLeaders = leaders.filter(l => l.familyId === f.id);
      return {
        ...f,
        leaderData: familyLeaders
      };
    });

    setData({ families: enriched, loading: false });
  }, []);

  return data;
}

/**
 * Hook to get a single family
 */
export function useFamily(familyId) {
  const { families, loading } = useFamilies();
  const family = useMemo(
    () => families.find(f => f.id === familyId) ?? null,
    [families, familyId]
  );
  return { family, loading };
}

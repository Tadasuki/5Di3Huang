export const RATING_DIMENSIONS = [
  { key: 'military', label: '军事' },
  { key: 'benevolence', label: '仁德', fallbackKey: 'politics' },
  { key: 'economy', label: '经济' },
  { key: 'culture', label: '文化' },
  { key: 'ideology', label: '思想' },
  { key: 'practice', label: '实践' },
  { key: 'diplomacy', label: '外交' },
  { key: 'legacy', label: '后世贡献' },
  { key: 'stability', label: '稳定' },
  { key: 'capability', label: '能力' },
]

export function getRatingValue(ratings, key) {
  const r = ratings || {}
  const dim = RATING_DIMENSIONS.find(d => d.key === key) || null
  const direct = r?.[key]
  if (typeof direct === 'number' && Number.isFinite(direct)) return clampScore(direct)
  if (dim?.fallbackKey) {
    const fb = r?.[dim.fallbackKey]
    if (typeof fb === 'number' && Number.isFinite(fb)) return clampScore(fb)
  }

  // Heuristic fallbacks for newly introduced dimensions to keep old data usable.
  if (key === 'stability') {
    const p = typeof r?.politics === 'number' ? r.politics : null
    const e = typeof r?.economy === 'number' ? r.economy : null
    if (p != null && e != null) return clampScore(Math.round((p + e) / 2))
    return 50
  }
  if (key === 'capability') {
    const m = typeof r?.military === 'number' ? r.military : null
    const c = typeof r?.culture === 'number' ? r.culture : null
    if (m != null && c != null) return clampScore(Math.round((m + c) / 2))
    return 50
  }
  if (key === 'ideology') {
    const c = typeof r?.culture === 'number' ? r.culture : null
    const l = typeof r?.legacy === 'number' ? r.legacy : null
    if (c != null && l != null) return clampScore(Math.round(c * 0.45 + l * 0.55))
    return 50
  }
  if (key === 'practice') {
    const e = typeof r?.economy === 'number' ? r.economy : null
    const s = typeof r?.stability === 'number' ? r.stability : null
    const b = typeof r?.benevolence === 'number' ? r.benevolence : null
    if (e != null && s != null && b != null) return clampScore(Math.round(e * 0.45 + s * 0.35 + b * 0.2))
    return 50
  }

  return 0
}

export function computeTotalScore(ratings) {
  const values = RATING_DIMENSIONS.map(d => getRatingValue(ratings, d.key))
  const sum = values.reduce((a, b) => a + b, 0)
  return Math.round(sum / Math.max(1, values.length))
}

export function getRatingExplain(leader, key) {
  const explain = leader?.ratingsExplain || leader?.ratingExplain || leader?.ratings_explain || null
  const v = explain?.[key]
  if (typeof v === 'string' && v.trim()) return v.trim()
  return '暂无说明。'
}

function clampScore(x) {
  if (x < 0) return 0
  if (x > 100) return 100
  return x
}

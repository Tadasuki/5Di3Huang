export const COUNTRY_KEYS = ['china', 'korea', 'japan']

export const COUNTRY_META = {
  china: { label: '中国' },
  korea: { label: '朝鲜' },
  japan: { label: '日本' },
}

export const ALL_COUNTRY_VALUE = 'all'

export function normalizeCountry(value) {
  const key = typeof value === 'string' ? value.trim().toLowerCase() : ''
  return COUNTRY_KEYS.includes(key) ? key : ''
}

export function getCountryLabel(value) {
  const key = normalizeCountry(value)
  return COUNTRY_META[key]?.label || '未分类'
}

export function getCountryOptions({ includeAll = false } = {}) {
  const options = COUNTRY_KEYS.map(value => ({
    value,
    label: COUNTRY_META[value].label,
  }))
  return includeAll ? [{ value: ALL_COUNTRY_VALUE, label: '全部' }, ...options] : options
}

export function normalizeCountrySelection(values) {
  const list = Array.isArray(values) ? values.map(normalizeCountry).filter(Boolean) : []
  const deduped = COUNTRY_KEYS.filter(country => list.includes(country))
  return deduped.length > 0 ? deduped : [...COUNTRY_KEYS]
}

export function parseCountrySelectionParam(raw) {
  if (typeof raw !== 'string' || !raw.trim()) return [...COUNTRY_KEYS]
  return normalizeCountrySelection(raw.split(','))
}

export function serializeCountrySelectionParam(values) {
  const normalized = normalizeCountrySelection(values)
  return isAllCountriesSelected(normalized) ? '' : normalized.join(',')
}

export function isAllCountriesSelected(values) {
  const list = normalizeCountrySelection(values)
  return COUNTRY_KEYS.every(country => list.includes(country))
}

export function toggleCountrySelection(values, countryValue) {
  if (countryValue === ALL_COUNTRY_VALUE) return [...COUNTRY_KEYS]
  const normalized = normalizeCountrySelection(values)
  const current = isAllCountriesSelected(normalized) ? [] : normalized
  const next = current.includes(countryValue)
    ? current.filter(item => item !== countryValue)
    : COUNTRY_KEYS.filter(item => [...current, countryValue].includes(item))
  return next.length > 0 ? next : [...COUNTRY_KEYS]
}

export function sortByCountry(a, b) {
  const ai = COUNTRY_KEYS.indexOf(normalizeCountry(a))
  const bi = COUNTRY_KEYS.indexOf(normalizeCountry(b))
  return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
}

/**
 * Format a year for display, handling BCE dates
 * @param {number} year - The year (negative for BCE)
 * @returns {string} Formatted year string
 */
export function formatYear(year) {
  if (year === null || year === undefined) return '？';
  if (year < 0) return `公元前${Math.abs(year)}年`;
  return `${year}年`;
}

/**
 * Format a year range (unknown-safe)
 * @param {number} startYear 
 * @param {number} endYear 
 * @returns {string}
 */
export function formatYearRange(startYear, endYear) {
  return `${formatYear(startYear)} — ${formatYear(endYear)}`;
}

/**
 * Format a year range where null/undefined endYear means "至今"
 */
export function formatYearRangeOngoing(startYear, endYear) {
  const endLabel = (endYear === null || endYear === undefined) ? '至今' : formatYear(endYear)
  return `${formatYear(startYear)} — ${endLabel}`
}

/**
 * Format life range for a person.
 * - birthYear unknown -> "—"
 * - deathYear null -> "至今" only when likely alive, otherwise "—"
 */
export function formatLifeYearRange(birthYear, deathYear) {
  const startLabel = formatYear(birthYear)
  if (deathYear !== null && deathYear !== undefined) return `${startLabel} — ${formatYear(deathYear)}`

  const by = (typeof birthYear === 'number' && Number.isFinite(birthYear)) ? birthYear : null
  const currentYear = new Date().getFullYear()
  const likelyAlive = by != null && by > 1850 && (currentYear - by) <= 110
  const endLabel = likelyAlive ? '至今' : '—'
  return `${startLabel} — ${endLabel}`
}

/**
 * Calculate duration between two years
 * @param {number} startYear 
 * @param {number} endYear 
 * @returns {number}
 */
export function calculateDuration(startYear, endYear) {
  const end = endYear || new Date().getFullYear();
  return end - startYear;
}

/**
 * Format a short year (for timeline)
 */
export function formatYearShort(year) {
  if (year === null || year === undefined) return '？';
  if (year < 0) return `前${Math.abs(year)}`;
  return `${year}`;
}

/**
 * Format a short year for timelines where null/undefined indicates "ongoing".
 */
export function formatYearShortOngoing(year) {
  if (year === null || year === undefined) return '今'
  return formatYearShort(year)
}

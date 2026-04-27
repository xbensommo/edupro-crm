/**
 * @file src/apps/finance/services/financeBookRangeService.js
 * @description Helpers for finance book/report period selection and navigation.
 */

/**
 * @param {Date} date
 * @returns {string}
 */
function toDateInputValue(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
    .toISOString()
    .slice(0, 10)
}

/**
 * @param {string|Date|number|null|undefined} value
 * @returns {Date|null}
 */
export function parseRangeDate(value) {
  if (!value) return null
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : new Date(value)
  }
  if (typeof value === 'number') {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }
  if (typeof value !== 'string') return null
  const raw = value.trim()
  if (!raw) return null
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? new Date(`${raw}T00:00:00.000Z`)
    : new Date(raw)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

/**
 * @param {Date} anchor
 * @returns {{ from: string, to: string }}
 */
export function createMonthRange(anchor = new Date()) {
  const date = parseRangeDate(anchor) || new Date()
  const from = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
  const to = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0))

  return {
    from: toDateInputValue(from),
    to: toDateInputValue(to),
  }
}

/**
 * @param {Date|number|string} anchor
 * @returns {{ from: string, to: string }}
 */
export function createYearRange(anchor = new Date()) {
  const date = typeof anchor === 'number'
    ? new Date(Date.UTC(anchor, 0, 1))
    : parseRangeDate(anchor) || new Date()
  const year = date.getUTCFullYear()

  return {
    from: `${year}-01-01`,
    to: `${year}-12-31`,
  }
}

/**
 * @param {{ from?: string, to?: string }} range
 * @returns {{ from: string, to: string }}
 */
export function normalizeBookRange(range = {}) {
  const fromDate = parseRangeDate(range.from) || parseRangeDate(range.to) || new Date()
  const toDate = parseRangeDate(range.to) || fromDate
  const normalizedFrom = fromDate <= toDate ? fromDate : toDate
  const normalizedTo = fromDate <= toDate ? toDate : fromDate

  return {
    from: toDateInputValue(normalizedFrom),
    to: toDateInputValue(normalizedTo),
  }
}

/**
 * @param {{ from: string, to: string }} range
 * @param {'month'|'year'|'custom'} mode
 * @param {number} step
 * @returns {{ from: string, to: string }}
 */
export function shiftBookRange(range, mode = 'custom', step = 1) {
  const normalized = normalizeBookRange(range)
  const fromDate = parseRangeDate(normalized.from) || new Date()

  if (mode === 'month') {
    return createMonthRange(new Date(Date.UTC(fromDate.getUTCFullYear(), fromDate.getUTCMonth() + step, 1)))
  }

  if (mode === 'year') {
    return createYearRange(fromDate.getUTCFullYear() + step)
  }

  const toDate = parseRangeDate(normalized.to) || fromDate
  const diffMs = Math.max(toDate.getTime() - fromDate.getTime(), 0)
  const offsetMs = (diffMs + 24 * 60 * 60 * 1000) * step

  return normalizeBookRange({
    from: new Date(fromDate.getTime() + offsetMs),
    to: new Date(toDate.getTime() + offsetMs),
  })
}

/**
 * @param {{ from: string, to: string }} range
 * @param {'month'|'year'|'custom'} mode
 * @returns {string}
 */
export function formatBookRangeLabel(range, mode = 'custom') {
  const normalized = normalizeBookRange(range)
  const fromDate = parseRangeDate(normalized.from)
  const toDate = parseRangeDate(normalized.to)
  if (!fromDate || !toDate) return 'Unknown period'

  if (mode === 'month') {
    return new Intl.DateTimeFormat('en-NA', {
      year: 'numeric',
      month: 'long',
      timeZone: 'UTC',
    }).format(fromDate)
  }

  if (mode === 'year') {
    return String(fromDate.getUTCFullYear())
  }

  const formatter = new Intl.DateTimeFormat('en-NA', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    timeZone: 'UTC',
  })

  return `${formatter.format(fromDate)} – ${formatter.format(toDate)}`
}

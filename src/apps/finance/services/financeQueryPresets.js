/**
 * @file src/apps/finance/services/financeQueryPresets.js
 * @description Centralized finance query presets so list queries stay explicit,
 * historical reads stay range-aware, and first-page reads always reset state.
 */

/**
 * Create a range for the current UTC calendar year only.
 *
 * @param {Date} [today=new Date()]
 * @returns {{ from: string, to: string }}
 */
export function createCurrentYearRange(today = new Date()) {
  const year = today.getUTCFullYear()

  return {
    from: `${year}-01-01`,
    to: `${year}-12-31`,
  }
}

/**
 * Create an explicit business-history range.
 * Use this for finance dashboards, reports, and other historical reads that
 * must search older shards instead of relying on an implicit recent window.
 *
 * @param {{ startYear?: number, today?: Date }} [options={}]
 * @returns {{ from: string, to: string }}
 */
export function createBusinessHistoryRange(options = {}) {
  const today = options.today instanceof Date ? options.today : new Date()
  const startYear = Number(options.startYear || 2023)
  const endYear = today.getUTCFullYear()

  return {
    from: `${startYear}-01-01`,
    to: `${endYear}-12-31`,
  }
}

/**
 * Create a rolling historical range ending today.
 *
 * @param {{ years?: number, today?: Date }} [options={}]
 * @returns {{ from: string, to: string }}
 */
export function createTrailingYearsRange(options = {}) {
  const years = Number(options.years || 2)
  const today = options.today instanceof Date ? options.today : new Date()
  const to = today.toISOString().slice(0, 10)
  const fromDate = new Date(
    Date.UTC(today.getUTCFullYear() - years, today.getUTCMonth(), today.getUTCDate()),
  )
  const from = fromDate.toISOString().slice(0, 10)

  return { from, to }
}

/**
 * Build a standard list query.
 *
 * @param {string} orderField
 * @param {{ from: string, to: string }|null} [range=null]
 * @param {number} [pageSize=100]
 * @returns {Record<string, any>}
 */
function baseList(orderField, range = null, pageSize = 100) {
  return {
    filters: [],
    orderBy: [{ field: orderField, direction: 'desc' }],
    pageSize,
    append: false,
    includeDeleted: false,
    range: range || undefined,
  }
}

/**
 * List accounts alphabetically.
 *
 * @returns {Record<string, any>}
 */
export function accountListQuery() {
  return {
    filters: [],
    orderBy: [{ field: 'accountCode', direction: 'asc' }],
    pageSize: 200,
    append: false,
    includeDeleted: false,
  }
}

/**
 * List transactions over an explicit historical range.
 *
 * @param {{ from: string, to: string }} range
 * @returns {Record<string, any>}
 */
export function transactionListQuery(range) {
  return baseList('occurredOn', range, 150)
}

/**
 * List posted journal entries over an explicit historical range.
 *
 * @param {{ from: string, to: string }} range
 * @returns {Record<string, any>}
 */
export function journalEntryListQuery(range) {
  return baseList('postedAt', range, 150)
}

/**
 * List accounting periods.
 * Range is passed explicitly so historical pages can remain shard-aware if the
 * collection is configured as sharded.
 *
 * @param {{ from: string, to: string }|null} [range=null]
 * @returns {Record<string, any>}
 */
export function periodListQuery(range = null) {
  return {
    filters: [],
    orderBy: [{ field: 'endsOn', direction: 'desc' }],
    pageSize: 36,
    append: false,
    includeDeleted: false,
    range: range || undefined,
  }
}

/**
 * List payments over an explicit historical range.
 *
 * @param {{ from: string, to: string }} range
 * @returns {Record<string, any>}
 */
export function paymentListQuery(range) {
  return baseList('paymentDate', range, 150)
}

/**
 * List refunds over an explicit historical range.
 *
 * @param {{ from: string, to: string }} range
 * @returns {Record<string, any>}
 */
export function refundListQuery(range) {
  return baseList('refundDate', range, 150)
}

/**
 * List expenses over an explicit historical range.
 *
 * @param {{ from: string, to: string }} range
 * @returns {Record<string, any>}
 */
export function expenseListQuery(range) {
  return baseList('expenseDate', range, 150)
}

/**
 * List consultant payouts over an explicit historical range.
 *
 * @param {{ from: string, to: string }} range
 * @returns {Record<string, any>}
 */
export function payoutListQuery(range) {
  return baseList('payoutDate', range, 150)
}

/**
 * List consultant payouts for one consultant over an explicit historical range.
 *
 * @param {string|null} consultantId
 * @param {{ from: string, to: string }} range
 * @returns {Record<string, any>}
 */
export function consultantPayoutListQuery(consultantId, range) {
  return {
    filters: consultantId ? [{ field: 'consultantId', op: '==', value: consultantId }] : [],
    orderBy: [{ field: 'payoutDate', direction: 'desc' }],
    pageSize: 150,
    append: false,
    includeDeleted: false,
    range: range || undefined,
  }
}
/**
 * List invoices over an explicit historical range.
 *
 * @param {{ from: string, to: string }} range
 * @returns {Record<string, any>}
 */
export function invoiceListQuery(range) {
  return baseList('issueDate', range, 150)
}

/**
 * List payment allocations over an explicit historical range.
 *
 * @param {{ from: string, to: string }} range
 * @returns {Record<string, any>}
 */
export function paymentAllocationListQuery(range) {
  return baseList('allocatedAt', range, 150)
}

/**
 * List finance audit logs over an explicit historical range.
 *
 * @param {{ from: string, to: string }} range
 * @returns {Record<string, any>}
 */
export function financeAuditLogListQuery(range) {
  return baseList('occurredAt', range, 150)
}

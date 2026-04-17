/**
 * @file src/core/services/ids/id.generators.js
 * @description Shared id and sequence generators for service-layer usage.
 */

/**
 * Create a timestamp-based random id.
 *
 * @param {string} prefix
 * @param {object} [options={}]
 * @param {() => Date} [options.now]
 * @returns {string}
 */
export function generateStableId(prefix, options = {}) {
  const now = typeof options.now === 'function' ? options.now : () => new Date()
  const timestamp = now().getTime()
  const random = Math.random().toString(36).slice(2, 10)
  return `${prefix}_${timestamp}_${random}`
}

/**
 * Create a dated sequence such as ACC-20260416-AB12.
 *
 * @param {string} prefix
 * @param {object} [options={}]
 * @param {() => Date} [options.now]
 * @returns {string}
 */
export function createSequence(prefix, options = {}) {
  const now = typeof options.now === 'function' ? options.now : () => new Date()
  const stamp = now().toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `${prefix}-${stamp}-${random}`
}

/**
 * Create a predictable monthly business number such as CLT-202604-12345.
 *
 * @param {string} prefix
 * @param {object} [options={}]
 * @param {() => Date} [options.now]
 * @returns {string}
 */
export function createMonthlyNumber(prefix, options = {}) {
  const now = typeof options.now === 'function' ? options.now : () => new Date()
  const stamp = now()
  const year = stamp.getFullYear()
  const month = String(stamp.getMonth() + 1).padStart(2, '0')
  const suffix = String(stamp.getTime()).slice(-5)
  return `${prefix}-${year}${month}-${suffix}`
}

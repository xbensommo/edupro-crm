/**
 * @file src/apps/finance/services/financeErrors.js
 * @description Finance-specific errors.
 */

export class FinanceError extends Error {
  /**
   * @param {string} message
   * @param {{ code?: string, cause?: unknown, meta?: unknown }} [options]
   */
  constructor(message, options = {}) {
    super(message)
    this.name = 'FinanceError'
    this.code = options.code || 'FINANCE_ERROR'
    this.cause = options.cause
    this.meta = options.meta ?? null
  }
}

/**
 * Throw when a finance invariant fails.
 *
 * @param {boolean} condition
 * @param {string} message
 * @param {{ code?: string, meta?: unknown }} [options]
 */
export function invariant(condition, message, options = {}) {
  if (!condition) {
    throw new FinanceError(message, options)
  }
}

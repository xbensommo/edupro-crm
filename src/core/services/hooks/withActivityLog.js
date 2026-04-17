/**
 * @file src/core/services/hooks/withActivityLog.js
 * @description Small helper to run an activity log after a successful write.
 */

/**
 * Run a write operation and, if it succeeds, log the activity.
 *
 * @template T
 * @param {() => Promise<T>} executor
 * @param {object} options
 * @param {(result: T) => Promise<any>} options.log
 * @returns {Promise<T>}
 */
export async function withActivityLog(executor, { log } = {}) {
  const result = await executor()

  if (typeof log === 'function') {
    await log(result)
  }

  return result
}

export default withActivityLog

/**
 * @file src/apps/finance/services/createFinanceModule.js
 * @description High-level finance module assembly.
 */

import { createFinanceRepositories } from './createFinanceRepositories.js'
import { createFinanceCommandBus } from './createFinanceCommandBus.js'
import * as reportService from './financeReportService.js'

/**
 * Assemble the finance module for Totistack runtime.
 *
 * @param {object} options
 * @param {object} options.shardProvider
 * @param {() => ({ id?: string, roles?: string[] } | null)} options.getCurrentUser
 * @param {(context: { title: string, message: string, confirmText: string, tone?: string }) => Promise<boolean>} options.confirm
 * @returns {{ repositories: object, commands: object, reports: typeof reportService }}
 */
export function createFinanceModule({ shardProvider, getCurrentUser, confirm }) {
  const repositories = createFinanceRepositories({ shardProvider })
  const commands = createFinanceCommandBus({
    repositories,
    getCurrentUser,
    confirm,
  })

  return {
    repositories,
    commands,
    reports: reportService,
  }
}

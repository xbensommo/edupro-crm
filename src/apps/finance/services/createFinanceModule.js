/**
 * @file src/apps/finance/services/createFinanceModule.js
 * @description High-level EduProLIC finance module assembly.
 */

import { createFinanceRepositories } from './createFinanceRepositories.js'
import { createFinanceCommandBus } from './createFinanceCommandBus.js'
import { createFinanceConfirmHandler } from './financeConfirmAdapter.js'
import * as reportService from './financeReportService.js'
import * as queryPresets from './financeQueryPresets.js'
import * as metricService from './financeOperationalMetrics.js'

export function createFinanceModule({ shardProvider = null, hostStore = null, getCurrentUser, confirm }) {
  const repositories = createFinanceRepositories({ shardProvider, hostStore })
  const commands = createFinanceCommandBus({
    repositories,
    getCurrentUser,
    confirm: confirm || createFinanceConfirmHandler(hostStore),
  })

  return {
    repositories,
    commands,
    queries: queryPresets,
    metrics: metricService,
    reports: reportService,
  }
}

/**
 * @file src/apps/finance/services/createFinanceRepositories.js
 * @description Repository adapter using @xbensommo/shard-provider.
 */

import { reactive } from 'vue'
import { createShardedActions } from '@xbensommo/shard-provider'

const COLLECTIONS = Object.freeze({
  accounts: 'finance_accounts',
  transactions: 'finance_transactions',
  journalEntries: 'finance_journal_entries',
  periods: 'finance_periods',
})

/**
 * Create finance repositories backed by the shared shard provider.
 *
 * @param {{ shardProvider: object }} options
 * @returns {{
 *   accounts: object,
 *   transactions: object,
 *   journalEntries: object,
 *   periods: object,
 * }}
 */
export function createFinanceRepositories({ shardProvider }) {
  const createState = () => reactive({
    items: [],
    itemMap: {},
    isLoading: false,
    error: null,
    pagination: null,
  })

  return {
    accounts: createShardedActions(COLLECTIONS.accounts, createState(), shardProvider),
    transactions: createShardedActions(COLLECTIONS.transactions, createState(), shardProvider),
    journalEntries: createShardedActions(COLLECTIONS.journalEntries, createState(), shardProvider),
    periods: createShardedActions(COLLECTIONS.periods, createState(), shardProvider),
  }
}

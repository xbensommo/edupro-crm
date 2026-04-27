/**
 * @file src/apps/finance/services/createFinanceRepositories.js
 * @description Finance repository adapter backed only by root-store generated
 * collection actions. Provider wiring stays centralized in the root store.
 */

import { useAppStore } from '@app/stores/appStore/index.js'

export const COLLECTIONS = Object.freeze({
  accounts: 'finance_accounts',
  transactions: 'finance_transactions',
  journalEntries: 'finance_journal_entries',
  periods: 'finance_periods',
  payments: 'payments',
  refunds: 'refunds',
  expenses: 'expenses',
  consultantPayouts: 'consultant_payouts',
  shareRules: 'share_rules',
  invoices: 'invoices',
  invoiceItems: 'invoice_items',
  paymentAllocations: 'payment_allocations',
  auditLogs: 'finance_audit_logs',
  engagements: 'engagements',
  notifications: 'notifications',
})

function resolveHostActions(hostStore, collectionName) {
  return hostStore?.getCollectionActions?.(collectionName)
    || hostStore?.[`${collectionName}Actions`]
    || null
}

function resolveHostState(hostStore, collectionName) {
  return hostStore?.[collectionName] || null
}

function unwrapRecord(record) {
  if (!record) return null

  if (record?.data && typeof record.data === 'object') {
    return {
      id: record.id || record.docId || record.data.id || null,
      shard: record.shard || null,
      ...record.data,
    }
  }

  return record
}

async function callFirst(actions, methodNames, ...args) {
  for (const methodName of methodNames) {
    const method = actions?.[methodName]
    if (typeof method === 'function') {
      return method(...args)
    }
  }

  return undefined
}

function createRepositoryAdapter(collectionName, hostStore, actions) {
  if (!actions) return null

  return {
    collectionName,

    get actions() {
      return actions
    },

    get state() {
      return resolveHostState(hostStore, collectionName)
    },

    get items() {
      return this.state?.items || []
    },

    fetchInitialPage(query = {}) {
      return callFirst(actions, ['fetchInitialPage'], query)
    },

    fetchByFilters(filters = [], options = {}) {
      return callFirst(actions, ['fetchByFilters'], filters, options)
    },

    fetchByForeignKey(field, value, options = {}) {
      return callFirst(actions, ['fetchByForeignKey'], field, value, options)
    },

    explainQuery(query = {}) {
      return typeof actions?.explainQuery === 'function'
        ? actions.explainQuery(query)
        : null
    },

    async getById(id, options) {
      return unwrapRecord(await callFirst(actions, ['getById'], id, options))
    },

    async getByPrimaryKey(primaryKeyValue, options) {
      return unwrapRecord(await callFirst(actions, ['getByPrimaryKey'], primaryKeyValue, options))
    },

    async add(data, options) {
      return unwrapRecord(await callFirst(actions, ['create', 'add'], data, options))
    },

    async create(data, options) {
      return unwrapRecord(await callFirst(actions, ['create', 'add'], data, options))
    },

    async set(id, data, options) {
      return unwrapRecord(await callFirst(actions, ['set'], id, data, options))
    },

    async update(id, patch, options) {
      return unwrapRecord(await callFirst(actions, ['update'], id, patch, options))
    },

    remove(id, options) {
      return callFirst(actions, ['remove'], id, options)
    },

    restore(id, options) {
      return callFirst(actions, ['restore'], id, options)
    },

    destroy(id, options) {
      return callFirst(actions, ['destroy'], id, options)
    },

    search(term, options) {
      return callFirst(actions, ['search'], term, options)
    },

    bulkSet(payload, options) {
      return callFirst(actions, ['bulkSet'], payload, options)
    },

    bulkUpdateStatus(ids, status, options) {
      return callFirst(actions, ['bulkUpdateStatus'], ids, status, options)
    },

    bulkDelete(ids, options) {
      return callFirst(actions, ['bulkDelete'], ids, options)
    },

    bulkRestore(ids, options) {
      return callFirst(actions, ['bulkRestore'], ids, options)
    },

    bulkDestroy(ids, options) {
      return callFirst(actions, ['bulkDestroy'], ids, options)
    },
  }
}

export function createFinanceRepositories({ hostStore = null } = {}) {
  const resolvedHostStore = hostStore || useAppStore()

  function repo(collectionName) {
    const hostActions = resolveHostActions(resolvedHostStore, collectionName)
    return createRepositoryAdapter(collectionName, resolvedHostStore, hostActions)
  }

  return {
    accounts: repo(COLLECTIONS.accounts),
    transactions: repo(COLLECTIONS.transactions),
    journalEntries: repo(COLLECTIONS.journalEntries),
    periods: repo(COLLECTIONS.periods),
    payments: repo(COLLECTIONS.payments),
    refunds: repo(COLLECTIONS.refunds),
    expenses: repo(COLLECTIONS.expenses),
    consultantPayouts: repo(COLLECTIONS.consultantPayouts),
    shareRules: repo(COLLECTIONS.shareRules),
    invoices: repo(COLLECTIONS.invoices),
    invoiceItems: repo(COLLECTIONS.invoiceItems),
    paymentAllocations: repo(COLLECTIONS.paymentAllocations),
    auditLogs: repo(COLLECTIONS.auditLogs),
    engagements: repo(COLLECTIONS.engagements),
    notifications: repo(COLLECTIONS.notifications),
  }
}

/**
 * @file src/apps/finance/stores/useFinanceAppStore.js
 * @description EduProLIC finance store backed by root-store generated shard
 * actions for reads and the finance command module for writes.
 */

import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useAppStore } from '@app/stores/appStore/index.js'
import { createFinanceModule } from '../services/createFinanceModule.js'
import {
  buildBalanceSheet,
  buildBalanceSnapshot,
  buildExpenseStatement,
  buildIncomeStatement,
  buildTrialBalance,
  buildReceivablesReport,
  filterEntriesByRange,
} from '../services/financeReportService.js'
import { buildWorkFinanceMetrics } from '../services/financeOperationalMetrics.js'
import {
  accountListQuery,
  consultantPayoutListQuery,
  createBusinessHistoryRange,
  createCurrentYearRange,
  journalEntryListQuery,
  invoiceListQuery,
  paymentAllocationListQuery,
  financeAuditLogListQuery,
  paymentListQuery,
  refundListQuery,
  expenseListQuery,
  payoutListQuery,
  periodListQuery,
  transactionListQuery,
} from '../services/financeQueryPresets.js'
import {
  createMonthRange,
  createYearRange,
  formatBookRangeLabel,
  normalizeBookRange,
  shiftBookRange,
} from '../services/financeBookRangeService.js'
import { createPostedJournalEntry } from '../services/financePostingEngine.js'

function sortByDateDesc(items, field) {
  return [...items].sort((a, b) => String(b?.[field] || '').localeCompare(String(a?.[field] || '')))
}

function recordData(record) {
  return record?.data && typeof record.data === 'object' ? record.data : record
}

function recordId(record) {
  return record?.id || record?.docId || record?._id || null
}

function normalizeRows(rows = []) {
  return rows.map((row) => ({ id: recordId(row), ...recordData(row) }))
}

function resolveCollectionActions(rootStore, collectionName) {
  return rootStore?.getCollectionActions?.(collectionName) || rootStore?.[`${collectionName}Actions`] || null
}

function rowsFromStoreBucket(rootStore, collectionName) {
  return normalizeRows(rootStore?.[collectionName]?.items || [])
}

function activeUserId(rootStore) {
  return rootStore?.currentUser?.id || rootStore?.currentUser?.uid || null
}

function toIsoString(value) {
  if (!value) return null
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${value}T00:00:00.000Z`
    return value
  }
  if (typeof value?.toDate === 'function') {
    const date = value.toDate()
    return Number.isNaN(date.getTime()) ? null : date.toISOString()
  }
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function resolveRecordTarget(recordOrId, fields = []) {
  if (recordOrId && typeof recordOrId === 'object') {
    return {
      id: recordOrId.id || recordOrId.docId || recordOrId._id || null,
      shardDate: fields.map((field) => recordOrId?.[field]).find(Boolean) || null,
    }
  }

  return { id: recordOrId, shardDate: null }
}

function buildDerivedJournalEntries(transactions = [], journalEntries = [], accounts = []) {
  const actualEntryIds = new Set((journalEntries || []).map((entry) => entry.id).filter(Boolean))
  const derived = []

  for (const transaction of transactions || []) {
    if (transaction?.status !== 'posted') continue
    if (transaction?.postedJournalEntryId && actualEntryIds.has(transaction.postedJournalEntryId)) continue

    const postedAt = transaction.postedAt || transaction.occurredOn || transaction.updatedAt || transaction.createdAt
    const isoPostedAt = toIsoString(postedAt)
    if (!isoPostedAt) continue

    try {
      const entry = createPostedJournalEntry({
        transaction: { ...transaction, postedAt: isoPostedAt },
        accounts,
        idFactory: () => transaction.postedJournalEntryId || `derived_${transaction.id}`,
        nowFactory: () => isoPostedAt,
      })

      derived.push({
        ...entry,
        id: transaction.postedJournalEntryId || entry.id,
        transactionId: transaction.id,
        _derived: true,
      })
    } catch {
      // Ignore broken derived-entry candidates so one bad transaction does not crash reporting.
    }
  }

  return derived
}

function createQuotationCode() {
  return `EDU-QUO-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${Math.random()
    .toString(36)
    .slice(2, 7)
    .toUpperCase()}`
}

export const useFinanceAppStore = defineStore('finance-app', () => {
  const rootStore = useAppStore()
  const module = createFinanceModule({
    hostStore: rootStore,
    getCurrentUser: () => rootStore?.currentUser || null,
  })

  const initialized = ref(false)
  const isLoading = ref(false)
  const error = ref(null)
  const activeView = ref('dashboard')
  const activeRange = ref(createBusinessHistoryRange())
  const activeBookRange = ref(createCurrentYearRange())
  const bookRangeMode = ref('year')
  const filters = ref({ search: '', status: 'all', type: 'all' })
  const lastQueryExplanations = ref({})

  function rememberExplanation(name, actions, query) {
    try {
      const explanation = actions?.explainQuery?.(query)
      if (explanation) {
        lastQueryExplanations.value = { ...lastQueryExplanations.value, [name]: explanation }
      }
    } catch {
      // Debug helper only. Never break loading because of it.
    }
  }

  async function loadCollection(collectionName, query = {}) {
    const actions = resolveCollectionActions(rootStore, collectionName)
    if (!actions?.fetchInitialPage) {
      throw new Error(`[finance] Missing generated collection actions for "${collectionName}".`)
    }

    const request = { append: false, ...query }
    rememberExplanation(collectionName, actions, request)
    await actions.fetchInitialPage(request)
    return true
  }

  async function loadAccounts() {
    return loadCollection('finance_accounts', accountListQuery())
  }

  async function loadTransactions() {
    return loadCollection('finance_transactions', transactionListQuery(activeRange.value))
  }

  async function loadJournalEntries(range = activeRange.value) {
    return loadCollection('finance_journal_entries', journalEntryListQuery(range))
  }

  async function loadPeriods() {
    return loadCollection('finance_periods', periodListQuery(activeRange.value))
  }

  async function loadPayments() {
    return loadCollection('payments', paymentListQuery(activeRange.value))
  }

  async function loadInvoices() {
    return loadCollection('invoices', invoiceListQuery(activeRange.value))
  }

  async function loadPaymentAllocations() {
    return loadCollection('payment_allocations', paymentAllocationListQuery(activeRange.value))
  }

  async function loadAuditLogs() {
    return loadCollection('finance_audit_logs', financeAuditLogListQuery(activeRange.value))
  }

  async function loadRefunds() {
    return loadCollection('refunds', refundListQuery(activeRange.value))
  }

  async function loadExpenses() {
    return loadCollection('expenses', expenseListQuery(activeRange.value))
  }

  async function loadConsultantPayouts(mode = 'ops') {
    const consultantId = mode === 'consultant' ? activeUserId(rootStore) : null
    return loadCollection(
      'consultant_payouts',
      consultantId ? consultantPayoutListQuery(consultantId, activeRange.value) : payoutListQuery(activeRange.value),
    )
  }

  async function loadBookLedger() {
    const historyRange = { from: createBusinessHistoryRange().from, to: activeBookRange.value.to }
    return loadJournalEntries(historyRange)
  }

  async function loadQuotations() {
    return loadCollection('quotations', {
      limit: 100,
      filters: [
        { field: 'isDeleted', op: '==', value: false },
      ],
      orderBy: [
        { field: 'quoteDate', direction: 'desc' },
      ],
    })
  }

  async function refreshView(view = activeView.value) {
    activeView.value = view
    isLoading.value = true
    error.value = null

    try {
      const tasks = []

      if (view === 'dashboard') {
        tasks.push(loadAccounts(), loadTransactions(), loadJournalEntries(), loadPeriods(), loadInvoices(), loadPaymentAllocations(), loadPayments(), loadRefunds(), loadExpenses(), loadConsultantPayouts('ops'))
      }
      if (view === 'transactions') {
        tasks.push(loadTransactions(), loadJournalEntries())
      }
      if (view === 'accounts') {
        tasks.push(loadAccounts())
      }
      if (view === 'reports') {
        tasks.push(loadAccounts(), loadTransactions(), loadBookLedger(), loadInvoices(), loadPaymentAllocations())
      }
      if (view === 'payments') {
        tasks.push(loadPayments(), loadPaymentAllocations(), loadInvoices())
      }
      if (view === 'invoices') {
        tasks.push(loadInvoices(), loadPaymentAllocations())
      }
      if (view === 'quotations') {
        tasks.push(loadQuotations())
      }
      if (view === 'receivables') {
        tasks.push(loadInvoices(), loadPaymentAllocations(), loadPayments())
      }
      if (view === 'audit') {
        tasks.push(loadAuditLogs())
      }
      if (view === 'refunds') {
        tasks.push(loadRefunds())
      }
      if (view === 'expenses') {
        tasks.push(loadExpenses())
      }
      if (view === 'payouts') {
        tasks.push(loadConsultantPayouts('ops'))
      }
      if (view === 'my-payouts') {
        tasks.push(loadConsultantPayouts('consultant'))
      }

      const results = await Promise.allSettled(tasks)
      const failed = results.filter((item) => item.status === 'rejected').map((item) => item.reason?.message || 'Unknown load error')

      if (failed.length > 0) {
        error.value = failed.join(' | ')
        initialized.value = false
        return
      }

      initialized.value = true
    } catch (err) {
      initialized.value = false
      error.value = err?.message || 'Failed to load finance data.'
    } finally {
      isLoading.value = false
    }
  }

  async function ensureReady(view = activeView.value) {
    if (initialized.value && !error.value && activeView.value === view) return
    await refreshView(view)
  }

  async function runCommand(task) {
    isLoading.value = true
    error.value = null
    try {
      const result = await task()
      await refreshView(activeView.value)
      return result
    } catch (err) {
      error.value = err?.message || 'Finance action failed.'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function reviewTransaction(recordOrId) {
    const target = resolveRecordTarget(recordOrId, ['occurredOn', 'createdAt'])
    return runCommand(() => module.commands.reviewTransaction(target.id, { shardDate: target.shardDate }))
  }

  async function postTransaction(recordOrId) {
    const target = resolveRecordTarget(recordOrId, ['occurredOn', 'createdAt'])
    return runCommand(() => module.commands.postTransaction(target.id, { shardDate: target.shardDate }))
  }

  async function deleteDraftTransaction(recordOrId) {
    const target = resolveRecordTarget(recordOrId, ['occurredOn', 'createdAt'])
    return runCommand(() => module.commands.deleteDraftTransaction(target.id, { shardDate: target.shardDate }))
  }

  async function reverseJournalEntry(recordOrId) {
    const target = resolveRecordTarget(recordOrId, ['postedAt', 'createdAt'])
    return runCommand(() => module.commands.reverseJournalEntry(target.id, { shardDate: target.shardDate, transactionShardDate: target.shardDate }))
  }

  async function closePeriod(recordOrId) {
    const target = resolveRecordTarget(recordOrId, ['startsOn', 'endsOn'])
    return runCommand(() => module.commands.closePeriod(target.id, { shardDate: target.shardDate }))
  }

  async function logClientPayment(payload) {
    return runCommand(() => module.commands.logClientPayment(payload))
  }

  async function createInvoice(payload) {
    return runCommand(() => module.commands.createInvoice(payload))
  }

  async function issueInvoice(recordOrId) {
    const target = resolveRecordTarget(recordOrId, ['issueDate', 'createdAt'])
    return runCommand(() => module.commands.issueInvoice(target.id, { shardDate: target.shardDate }))
  }

  async function cancelInvoice(recordOrId, payload = {}) {
    const target = resolveRecordTarget(recordOrId, ['issueDate', 'createdAt'])
    return runCommand(() => module.commands.cancelInvoice(target.id, { ...payload, shardDate: payload.shardDate || target.shardDate }))
  }

  async function createQuotation(payload) {
  return runCommand(async () => {
    const actions = resolveCollectionActions(rootStore, 'quotations')

    if (!actions?.add) {
      throw new Error('[finance] Missing generated collection actions for "quotations".')
    }

    const now = new Date().toISOString()
    const quoteCode = payload.quoteCode || payload.quotationCode || createQuotationCode()

    return await actions.add({
      ...payload,
      quoteCode,
      quotationCode: quoteCode,
      status: payload.status || 'draft',
      isDeleted: false,
      createdAt: payload.createdAt || now,
      updatedAt: now,
    })
  })
}

async function markQuotationSent(recordOrId) {
  const target = resolveRecordTarget(recordOrId, ['quoteDate', 'createdAt'])

  return runCommand(async () => {
    const actions = resolveCollectionActions(rootStore, 'quotations')

    if (!actions?.update) {
      throw new Error('[finance] Missing generated collection actions for "quotations".')
    }

    return await actions.update(target.id, {
      status: 'sent',
      sentAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  })
}

  async function cancelQuotation(recordOrId, payload = {}) {
    const target = resolveRecordTarget(recordOrId, ['quoteDate', 'createdAt'])

    return runCommand(async () => {
      const actions = resolveCollectionActions(rootStore, 'quotations')

      if (!actions?.update) {
        throw new Error('[finance] Missing generated collection actions for "quotations".')
      }

      return await actions.update(target.id, {
        status: 'cancelled',
        cancellationReason: payload.reason || 'Quotation cancelled.',
        cancelledAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    })
  }

  async function allocatePaymentToInvoice(payload) {
    return runCommand(() => module.commands.allocatePaymentToInvoice(payload))
  }

  async function recordRefund(payload) {
    return runCommand(() => module.commands.recordRefund(payload))
  }

  async function recordExpense(payload) {
    return runCommand(() => module.commands.recordExpense(payload))
  }

  async function recordConsultantPayout(payload) {
    return runCommand(() => module.commands.recordConsultantPayout(payload))
  }

  async function settleConsultantPayout(recordOrId, payload = {}) {
    const target = resolveRecordTarget(recordOrId, ['payoutDate', 'createdAt'])
    return runCommand(() => module.commands.settleConsultantPayout(target.id, {
      ...payload,
      shardDate: payload.shardDate || target.shardDate,
      existingPayoutDate: payload.existingPayoutDate || target.shardDate,
    }))
  }

  function setFilters(nextFilters = {}) {
    filters.value = { ...filters.value, ...nextFilters }
  }

  function setRange(range) {
    activeRange.value = { ...activeRange.value, ...range }
    initialized.value = false
  }

  async function setBookPreset(mode, anchor = new Date()) {
    if (mode === 'month') {
      bookRangeMode.value = 'month'
      activeBookRange.value = createMonthRange(anchor)
    } else {
      bookRangeMode.value = 'year'
      activeBookRange.value = createYearRange(anchor)
    }
    await refreshView('reports')
  }

  async function shiftActiveBookRange(step = 1) {
    activeBookRange.value = shiftBookRange(activeBookRange.value, bookRangeMode.value, step)
    await refreshView('reports')
  }

  async function setCustomBookRange(range) {
    bookRangeMode.value = 'custom'
    activeBookRange.value = normalizeBookRange(range)
    await refreshView('reports')
  }

  const accounts = computed(() => rowsFromStoreBucket(rootStore, 'finance_accounts'))
  const transactions = computed(() => rowsFromStoreBucket(rootStore, 'finance_transactions'))
  const journalEntries = computed(() => rowsFromStoreBucket(rootStore, 'finance_journal_entries'))
  const periods = computed(() => rowsFromStoreBucket(rootStore, 'finance_periods'))
  const payments = computed(() => rowsFromStoreBucket(rootStore, 'payments'))

  const invoices = computed(() => rowsFromStoreBucket(rootStore, 'invoices'))
  const quotations = computed(() => rowsFromStoreBucket(rootStore, 'quotations'))
  const paymentAllocations = computed(() => rowsFromStoreBucket(rootStore, 'payment_allocations'))
  const auditLogs = computed(() => rowsFromStoreBucket(rootStore, 'finance_audit_logs'))
  const refunds = computed(() => rowsFromStoreBucket(rootStore, 'refunds'))
  const expenses = computed(() => rowsFromStoreBucket(rootStore, 'expenses'))
  const consultantPayouts = computed(() => rowsFromStoreBucket(rootStore, 'consultant_payouts'))

  const effectiveJournalEntries = computed(() => {
    const actual = journalEntries.value
    const derived = buildDerivedJournalEntries(transactions.value, actual, accounts.value)
    return sortByDateDesc([...actual, ...derived], 'postedAt')
  })

  /*const filteredTransactions = computed(() => {
    const search = filters.value.search.trim().toLowerCase()
    return sortByDateDesc(transactions.value, 'occurredOn').filter((transaction) => {
      if (filters.value.status !== 'all' && transaction.status !== filters.value.status) return false
      if (filters.value.type !== 'all' && transaction.type !== filters.value.type) return false
      if (!search) return true
      const haystack = [transaction.reference, transaction.memo, transaction.clientLabel, transaction.consultantLabel, transaction.sourceRef, transaction.engagementCode]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(search)
    })
  })*/

  const filteredTransactions = computed(() => {
    const search = filters.value.search.trim().toLowerCase()

    return sortByDateDesc(transactions.value, 'occurredOn').filter((transaction) => {
      if (filters.value.status !== 'all' && transaction.status !== filters.value.status) {
        return false
      }

      if (filters.value.type !== 'all' && transaction.type !== filters.value.type) {
        return false
      }

      if (!search) return true

      const haystack = [
        transaction.reference,
        transaction.memo,
        transaction.clientLabel,
        transaction.clientId,
        transaction.consultantLabel,
        transaction.consultantId,
        transaction.sourceRef,
        transaction.engagementCode,
        transaction.engagementId,
        transaction.type,
        transaction.status,
        transaction.amount,
      ]
        .filter((value) => value !== null && value !== undefined)
        .join(' ')
        .toLowerCase()

      return haystack.includes(search)
    })
  })

  const recentJournalEntries = computed(() => effectiveJournalEntries.value.slice(0, 5))
  const openPeriods = computed(() => periods.value.filter((period) => period.status === 'open'))
  const closedPeriods = computed(() => periods.value.filter((period) => period.status === 'closed'))

  const bookRangeLabel = computed(() => formatBookRangeLabel(activeBookRange.value, bookRangeMode.value))
  const bookPeriodEntries = computed(() => filterEntriesByRange(effectiveJournalEntries.value, activeBookRange.value))
  const bookAsOfEntries = computed(() => filterEntriesByRange(effectiveJournalEntries.value, { from: createBusinessHistoryRange().from, to: activeBookRange.value.to }))

  const trialBalance = computed(() => buildTrialBalance(effectiveJournalEntries.value, accounts.value))
  const incomeStatement = computed(() => buildIncomeStatement(effectiveJournalEntries.value, accounts.value))
  const balanceSheet = computed(() => buildBalanceSheet(effectiveJournalEntries.value, accounts.value))
  const expenseStatement = computed(() => buildExpenseStatement(effectiveJournalEntries.value, accounts.value))
  const balanceSnapshot = computed(() => buildBalanceSnapshot(effectiveJournalEntries.value, accounts.value))

  const bookTrialBalance = computed(() => buildTrialBalance(bookAsOfEntries.value, accounts.value))
  const bookIncomeStatement = computed(() => buildIncomeStatement(bookPeriodEntries.value, accounts.value))
  const bookBalanceSheet = computed(() => buildBalanceSheet(bookAsOfEntries.value, accounts.value))
  const bookExpenseStatement = computed(() => buildExpenseStatement(bookPeriodEntries.value, accounts.value))
  const hasBookData = computed(() => effectiveJournalEntries.value.length > 0)

  const workFinanceMetrics = computed(() => buildWorkFinanceMetrics({
    transactions: transactions.value,
    payments: payments.value,
    invoices: invoices.value,
    paymentAllocations: paymentAllocations.value,
    refunds: refunds.value,
    expenses: expenses.value,
    consultantPayouts: consultantPayouts.value,
  }))

  const receivablesReport = computed(() => buildReceivablesReport(invoices.value, paymentAllocations.value))

  const dashboardMetrics = computed(() => ({
    postedTransactions: transactions.value.filter((transaction) => transaction.status === 'posted').length,
    draftTransactions: transactions.value.filter((transaction) => transaction.status === 'draft').length,
    revenue: incomeStatement.value.revenue,
    expenses: incomeStatement.value.expenses,
    netIncome: incomeStatement.value.netIncome,
    assets: balanceSnapshot.value.assets,
    totalInvoiced: workFinanceMetrics.value.totalInvoiced,
    totalReceived: workFinanceMetrics.value.totalReceived,
    totalRefunds: workFinanceMetrics.value.totalRefunds,
    netCollected: workFinanceMetrics.value.netCollected,
    totalOutstanding: workFinanceMetrics.value.totalOutstanding,
    unappliedCash: workFinanceMetrics.value.unappliedCash,
    unpaidCommission: workFinanceMetrics.value.unpaidCommission,
  }))

  const payoutRowsForCurrentUser = computed(() => {
    const userId = activeUserId(rootStore)
    return consultantPayouts.value.filter((row) => row.consultantId === userId)
  })

  return {
    initialized,
    isLoading,
    error,
    activeView,
    activeRange,
    activeBookRange,
    bookRangeMode,
    bookRangeLabel,
    filters,
    lastQueryExplanations,
    accounts,
    transactions,
    journalEntries,
    effectiveJournalEntries,
    periods,
    payments,
    invoices,
    createQuotation,
    markQuotationSent,
    cancelQuotation,

    paymentAllocations,
    auditLogs,
    refunds,
    expenses,
    consultantPayouts,
    filteredTransactions,
    recentJournalEntries,
    openPeriods,
    closedPeriods,
    trialBalance,
    incomeStatement,
    balanceSheet,
    expenseStatement,
    balanceSnapshot,
    bookTrialBalance,
    bookIncomeStatement,
    bookBalanceSheet,
    bookExpenseStatement,
    hasBookData,
    workFinanceMetrics,
    receivablesReport,
    dashboardMetrics,
    payoutRowsForCurrentUser,
    ensureReady,
    refreshView,
    setFilters,
    setRange,
    setBookPreset,
    shiftActiveBookRange,
    setCustomBookRange,
    reviewTransaction,
    postTransaction,
    deleteDraftTransaction,
    reverseJournalEntry,
    closePeriod,
    logClientPayment,
    createInvoice,
    issueInvoice,
    cancelInvoice,
    allocatePaymentToInvoice,
    recordRefund,
    recordExpense,
    recordConsultantPayout,
    settleConsultantPayout,
  }
})

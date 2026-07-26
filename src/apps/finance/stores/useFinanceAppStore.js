/**
 * @file src/apps/finance/stores/useFinanceAppStore.js
 * @description EduProLIC finance store backed by root-store generated shard
 * actions for reads and the finance command module for writes.
 */

/**
 * File: useFinanceAppStore.js
 * Date: 2026-07-08
 * Changes:
 *   - Added createInvoiceForEngagement(engagement, options) to auto‑generate invoice from engagement.
 *   - Added autoAllocatePayment(paymentId, options) to allocate payment to oldest open invoice.
 *   - Added updateClientBalance(clientId) to recalculate and persist client outstanding balance.
 *   - Modified logClientPayment to support autoAllocate flag and trigger balance update.
 *   - Reason: Automate invoice creation, payment allocation, and client balance updates.
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

//import { createNotificationBridge } from '@app/features/notifications/services/createNotificationBridge.js'

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
  return `ED-QUO-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${Math.random()
    .toString(36)
    .slice(2, 7)
    .toUpperCase()}`
}

function addDays(date, days) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export const useFinanceAppStore = defineStore('finance-app', () => {
  const rootStore = useAppStore()
  const module = createFinanceModule({
    hostStore: rootStore,
    getCurrentUser: () => rootStore?.currentUser || null,
  })

  // const notificationBridge = createNotificationBridge({
  //   store: rootStore,
  //   currentUser: () => rootStore?.currentUser || null,
  // })

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
      //updatedAt: new Date().toISOString(),
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

      console.trace(payload)

      return await actions.update(target.id, {
        status: 'cancelled',
        cancellationReason: payload.reason || 'Quotation cancelled.',
        cancelledAt: new Date().toISOString(),
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


  // Receipts CRUD operations
async function createReceipt(payload) {
  return runCommand(async () => {
    const actions = resolveCollectionActions(rootStore, 'receipts')
    if (!actions?.add) {
      throw new Error('[finance] Missing generated collection actions for "receipts".')
    }
    
    const now = new Date().toISOString()
    let tempCode = `REC-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${Math.random()
    .toString(36)
    .slice(2, 7)
    .toUpperCase()}`
    const receiptCode = payload.receiptCode || tempCode;
    
    // Handle manual client creation
    let clientId = payload.clientId
    let clientLabel = payload.clientLabel
    
    if (!clientId && payload.client && payload.client.name) {
      // Check if client exists or create new one
      // ... client creation logic (same as invoice/quote)
    }
    console.trace(payload)
    return await actions.add({
      ...payload,
      receiptCode,
      status: payload.status || 'draft',
      // isDeleted: false,
      // createdAt: now,
      // updatedAt: now,
    })
  })
}

async function updateReceipt(id, payload) {
  return runCommand(async () => {
    const actions = resolveCollectionActions(rootStore, 'receipts')
    if (!actions?.update) {
      throw new Error('[finance] Missing generated collection actions for "receipts".')
    }
    return await actions.update(id, {
      ...payload,
      updatedAt: new Date().toISOString(),
    })
  })
}

async function issueReceipt(recordOrId) {
  const target = resolveRecordTarget(recordOrId, ['paymentDate', 'createdAt'])
  return runCommand(async () => {
    const actions = resolveCollectionActions(rootStore, 'receipts')
    if (!actions?.update) {
      throw new Error('[finance] Missing generated collection actions for "receipts".')
    }
    return await actions.update(target.id, {
      status: 'issued',
      issuedAt: new Date().toISOString(),
      issuedByUserId: activeUserId(rootStore),
      updatedAt: new Date().toISOString(),
    })
  })
}

async function cancelReceipt(recordOrId, payload = {}) {
  const target = resolveRecordTarget(recordOrId, ['paymentDate', 'createdAt'])
  return runCommand(async () => {
    const actions = resolveCollectionActions(rootStore, 'receipts')
    if (!actions?.update) {
      throw new Error('[finance] Missing generated collection actions for "receipts".')
    }
    return await actions.update(target.id, {
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      cancelledByUserId: activeUserId(rootStore),
      cancellationReason: payload.reason || 'Receipt cancelled.',
      updatedAt: new Date().toISOString(),
    })
  })
}

function createReceiptCode() {
  return `REC-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${Math.random()
    .toString(36)
    .slice(2, 7)
    .toUpperCase()}`
}


/**
   * Create an invoice automatically from an engagement.
   * @param {Object} engagement - Must contain clientId, engagementId, netAmount, title, etc.
   * @param {Object} options - Additional invoice fields (dueDate, currency, etc.)
   * @returns {Promise<Object>} The created invoice document.
   */
  async function createInvoiceForEngagement(engagement, options = {}) {
    if (!engagement.clientId) {
      throw new Error('Engagement must have a clientId to create an invoice.')
    }
    const amount = asMoney(engagement.netAmount || engagement.quotedAmount || 0)
    if (amount <= 0) {
      throw new Error('Engagement has no positive amount to invoice.')
    }
    const payload = {
      clientId: engagement.clientId,
      clientLabel: engagement.clientName || '',
      engagementId: engagement.id || engagement._id,
      engagementCode: engagement.engagementCode || '',
      totalAmount: amount,
      currency: options.currency || engagement.currency || 'NAD',
      dueDate: options.dueDate || addDays(new Date(), 30),
      lineItems: [{
        description: engagement.title || engagement.serviceType || 'Service fee',
        quantity: 1,
        unitPrice: amount,
      }],
      sourceModule: 'engagements',
      sourceId: engagement.id || engagement._id,
      status: 'draft',
      notes: options.notes || `Auto-generated from engagement ${engagement.engagementCode || ''}`,
      ...options,
    }
    return await createInvoice(payload)
  }

  /**
   * Automatically allocate a payment to the oldest open invoice for the client.
   * @param {string} paymentId - ID of the payment record.
   * @param {Object} options - { amount?: number, notes?: string } (amount defaults to full unapplied).
   * @returns {Promise<{ allocatedTotal: number, remaining: number, allocations: Array }>}
   */
  async function autoAllocatePayment(paymentId, options = {}) {
    const payment = await module.repositories.payments.getById(paymentId)
    if (!payment) throw new Error('Payment not found')

    const openInvoices = getOpenInvoicesForClient(payment.clientId)
    if (!openInvoices.length) {
      return { allocatedTotal: 0, remaining: 0, allocations: [], message: 'No open invoices' }
    }

    let remaining = options.amount ?? payment.unappliedAmount ?? payment.amount
    let allocatedTotal = 0
    const allocations = []

    for (const invoice of openInvoices) {
      if (remaining <= 0) break
      const amountToAllocate = Math.min(remaining, invoice.balanceAmount)
      if (amountToAllocate <= 0) continue
      const result = await allocatePaymentToInvoice({
        paymentId: payment.id,
        invoiceId: invoice.id,
        amount: amountToAllocate,
        notes: options.notes || 'Auto-allocation from payment',
      })
      allocations.push(result)
      allocatedTotal += amountToAllocate
      remaining -= amountToAllocate
    }

    // Update client balance after allocation
    if (allocatedTotal > 0) {
      await updateClientBalance(payment.clientId)
    }

    return { allocatedTotal, remaining, allocations }
  }

  /**
   * Recalculate and persist the client's outstanding balance.
   * @param {string} clientId
   * @returns {Promise<number>} The new outstanding balance.
   */
  async function updateClientBalance(clientId) {
    const openInvoices = getOpenInvoicesForClient(clientId)
    const totalOutstanding = openInvoices.reduce((sum, inv) => sum + Number(inv.balanceAmount || 0), 0)
    const clientActions = rootStore.getCollectionActions('clients')
    if (clientActions?.update) {
      // Update both the financeSummary.amountDue and a dedicated outstandingBalance for easier queries
      await clientActions.update(clientId, {
        'financeSummary.amountDue': totalOutstanding,
        'financeSummary.lastUpdatedAt': new Date().toISOString(),
        outstandingBalance: totalOutstanding,
        lastBalanceUpdatedAt: new Date().toISOString(),
      })
    }
    return totalOutstanding
  }

  // Helper: get open (issued or partially paid) invoices for a client, sorted by issueDate oldest first.
  function getOpenInvoicesForClient(clientId) {
    return invoices.value
      .filter(inv => inv.clientId === clientId && ['issued', 'partially_paid'].includes(inv.status))
      .sort((a, b) => new Date(a.issueDate) - new Date(b.issueDate))
  }

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

    createReceipt,
  updateReceipt,
  issueReceipt,
  cancelReceipt,
  receipts: computed(() => rowsFromStoreBucket(rootStore, 'receipts')),

  createInvoiceForEngagement,
    autoAllocatePayment,
    updateClientBalance,
    getOpenInvoicesForClient,
     
  }
})

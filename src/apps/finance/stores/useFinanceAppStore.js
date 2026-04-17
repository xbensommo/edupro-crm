/**
 * @file src/apps/finance/stores/useFinanceAppStore.js
 * @description Local finance workspace store for pages and components.
 */

import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { createPostedJournalEntry, createReversalJournalEntry } from '../services/financePostingEngine.js'
import { buildFinanceDemoState } from '../services/financeSampleData.js'
import {
  buildBalanceSheet,
  buildBalanceSnapshot,
  buildExpenseStatement,
  buildIncomeStatement,
  buildTrialBalance,
} from '../services/financeReportService.js'

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function sortByDateDesc(items, field) {
  return [...items].sort((a, b) => String(b?.[field] || '').localeCompare(String(a?.[field] || '')))
}

export const useFinanceAppStore = defineStore('finance-app', () => {
  const initialized = ref(false)
  const isLoading = ref(false)
  const error = ref(null)
  const accounts = ref([])
  const transactions = ref([])
  const journalEntries = ref([])
  const periods = ref([])
  const filters = ref({
    search: '',
    status: 'all',
    type: 'all',
  })

  function ensureReady() {
    if (initialized.value) return
    seedDemoData()
  }

  function seedDemoData() {
    const seed = buildFinanceDemoState()
    accounts.value = clone(seed.accounts)
    transactions.value = clone(seed.transactions)
    journalEntries.value = clone(seed.journalEntries)
    periods.value = clone(seed.periods)
    initialized.value = true
  }

  function updateTransaction(transactionId, patch) {
    transactions.value = transactions.value.map((transaction) => (
      transaction.id === transactionId
        ? {
            ...transaction,
            ...patch,
            updatedAt: new Date().toISOString(),
          }
        : transaction
    ))
  }

  function updateJournalEntry(entryId, patch) {
    journalEntries.value = journalEntries.value.map((entry) => (
      entry.id === entryId
        ? {
            ...entry,
            ...patch,
            updatedAt: new Date().toISOString(),
          }
        : entry
    ))
  }

  function setFilters(nextFilters = {}) {
    filters.value = {
      ...filters.value,
      ...nextFilters,
    }
  }

  const filteredTransactions = computed(() => {
    const search = filters.value.search.trim().toLowerCase()

    return sortByDateDesc(transactions.value, 'occurredOn').filter((transaction) => {
      if (filters.value.status !== 'all' && transaction.status !== filters.value.status) return false
      if (filters.value.type !== 'all' && transaction.type !== filters.value.type) return false

      if (!search) return true

      const haystack = [
        transaction.reference,
        transaction.memo,
        transaction.clientLabel,
        transaction.consultantLabel,
        transaction.sourceRef,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(search)
    })
  })

  const recentJournalEntries = computed(() => sortByDateDesc(journalEntries.value, 'postedAt').slice(0, 5))
  const openPeriods = computed(() => periods.value.filter((period) => period.status === 'open'))
  const closedPeriods = computed(() => periods.value.filter((period) => period.status === 'closed'))
  const trialBalance = computed(() => buildTrialBalance(journalEntries.value, accounts.value))
  const incomeStatement = computed(() => buildIncomeStatement(journalEntries.value, accounts.value))
  const balanceSheet = computed(() => buildBalanceSheet(journalEntries.value, accounts.value))
  const expenseStatement = computed(() => buildExpenseStatement(journalEntries.value, accounts.value))
  const balanceSnapshot = computed(() => buildBalanceSnapshot(journalEntries.value, accounts.value))

  const dashboardMetrics = computed(() => ({
    postedTransactions: transactions.value.filter((transaction) => transaction.status === 'posted').length,
    draftTransactions: transactions.value.filter((transaction) => transaction.status === 'draft').length,
    reviewedTransactions: transactions.value.filter((transaction) => transaction.status === 'reviewed').length,
    openPeriods: openPeriods.value.length,
    revenue: incomeStatement.value.revenue,
    expenses: incomeStatement.value.expenses,
    netIncome: incomeStatement.value.netIncome,
    assets: balanceSnapshot.value.assets,
  }))

  function reviewTransaction(transactionId) {
    const transaction = transactions.value.find((item) => item.id === transactionId)
    if (!transaction || transaction.status !== 'draft') return false

    updateTransaction(transactionId, {
      status: 'reviewed',
      reviewedAt: new Date().toISOString(),
      reviewedBy: 'accountant_001',
    })

    return true
  }

  function postTransaction(transactionId) {
    const transaction = transactions.value.find((item) => item.id === transactionId)
    if (!transaction || !['draft', 'reviewed'].includes(transaction.status)) return false

    const entryId = `je_${String(journalEntries.value.length + 1).padStart(3, '0')}`
    const entry = createPostedJournalEntry({
      transaction,
      accounts: accounts.value,
      actor: { id: 'accountant_001' },
      idFactory: () => entryId,
      nowFactory: () => `${transaction.occurredOn}T09:00:00.000Z`,
    })

    journalEntries.value = [
      {
        ...entry,
        currency: transaction.currency || 'NAD',
        memo: transaction.memo || null,
        createdAt: entry.postedAt,
        updatedAt: entry.postedAt,
      },
      ...journalEntries.value,
    ]

    updateTransaction(transactionId, {
      status: 'posted',
      postedAt: entry.postedAt,
      postedBy: 'accountant_001',
      postedJournalEntryId: entry.id,
    })

    return true
  }

  function reverseJournalEntry(entryId) {
    const entry = journalEntries.value.find((item) => item.id === entryId)
    if (!entry || entry.status !== 'posted' || entry.reversedEntryId) return false

    const reversalId = `je_${String(journalEntries.value.length + 1).padStart(3, '0')}`
    const reversal = createReversalJournalEntry({
      postedEntry: entry,
      actor: { id: 'accountant_001' },
      reason: 'Finance reversal',
      idFactory: () => reversalId,
      nowFactory: () => new Date().toISOString(),
    })

    journalEntries.value = [
      {
        ...reversal,
        currency: entry.currency || 'NAD',
        memo: `Reversal for ${entry.transactionId}`,
        createdAt: reversal.postedAt,
        updatedAt: reversal.postedAt,
      },
      ...journalEntries.value,
    ]

    updateJournalEntry(entryId, {
      reversedEntryId: reversal.id,
    })

    updateTransaction(entry.transactionId, {
      status: 'reversed',
      reversedAt: reversal.postedAt,
      reversalJournalEntryId: reversal.id,
    })

    return true
  }

  function closePeriod(periodId) {
    const period = periods.value.find((item) => item.id === periodId)
    if (!period || period.status !== 'open') return false

    periods.value = periods.value.map((item) => (
      item.id === periodId
        ? {
            ...item,
            status: 'closed',
            closedAt: new Date().toISOString(),
            closedBy: 'accountant_001',
            updatedAt: new Date().toISOString(),
          }
        : item
    ))

    return true
  }

  return {
    initialized,
    isLoading,
    error,
    accounts,
    transactions,
    journalEntries,
    periods,
    filters,
    filteredTransactions,
    recentJournalEntries,
    openPeriods,
    closedPeriods,
    trialBalance,
    incomeStatement,
    balanceSheet,
    expenseStatement,
    balanceSnapshot,
    dashboardMetrics,
    ensureReady,
    seedDemoData,
    setFilters,
    reviewTransaction,
    postTransaction,
    reverseJournalEntry,
    closePeriod,
  }
})

import test from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_SYSTEM_ACCOUNTS, SYSTEM_ACCOUNT_KEYS } from '../services/financeChartOfAccounts.js'
import {
  buildBalanceSheet,
  buildExpenseStatement,
  buildIncomeStatement,
  buildReceivablesReport,
  buildTrialBalance,
} from '../services/financeReportService.js'

function createFixture() {
  return {
    accounts: DEFAULT_SYSTEM_ACCOUNTS,
    journalEntries: [
      {
        id: 'je_revenue',
        status: 'posted',
        postedAt: '2026-03-01T09:00:00.000Z',
        lines: [
          { accountId: SYSTEM_ACCOUNT_KEYS.ACCOUNTS_RECEIVABLE, side: 'debit', amount: 1200 },
          { accountId: SYSTEM_ACCOUNT_KEYS.SERVICE_REVENUE, side: 'credit', amount: 1200 },
        ],
      },
      {
        id: 'je_payment',
        status: 'posted',
        postedAt: '2026-03-02T09:00:00.000Z',
        lines: [
          { accountId: SYSTEM_ACCOUNT_KEYS.CASH, side: 'debit', amount: 900 },
          { accountId: SYSTEM_ACCOUNT_KEYS.ACCOUNTS_RECEIVABLE, side: 'credit', amount: 900 },
        ],
      },
      {
        id: 'je_expense',
        status: 'posted',
        postedAt: '2026-03-03T09:00:00.000Z',
        lines: [
          { accountId: SYSTEM_ACCOUNT_KEYS.OPERATING_EXPENSE, side: 'debit', amount: 200 },
          { accountId: SYSTEM_ACCOUNT_KEYS.CASH, side: 'credit', amount: 200 },
        ],
      },
    ],
  }
}

test('trial balance stays balanced for finance fixtures', () => {
  const state = createFixture()
  const trialBalance = buildTrialBalance(state.journalEntries, state.accounts)

  assert.equal(trialBalance.totalDebit, trialBalance.totalCredit)
  assert.ok(trialBalance.totalDebit > 0)
})

test('income statement returns positive revenue and expense totals', () => {
  const state = createFixture()
  const incomeStatement = buildIncomeStatement(state.journalEntries, state.accounts)

  assert.ok(incomeStatement.revenue > 0)
  assert.ok(incomeStatement.expenses > 0)
  assert.equal(
    incomeStatement.netIncome,
    Number((incomeStatement.revenue - incomeStatement.expenses).toFixed(2)),
  )
})

test('expense statement groups expense rows', () => {
  const state = createFixture()
  const expenseStatement = buildExpenseStatement(state.journalEntries, state.accounts)

  assert.ok(expenseStatement.rows.length >= 1)
  assert.ok(expenseStatement.totalExpenses > 0)
})

test('balance sheet returns assets and matching liabilities plus equity shape', () => {
  const state = createFixture()
  const balanceSheet = buildBalanceSheet(state.journalEntries, state.accounts)

  assert.ok(balanceSheet.assets.length > 0)
  assert.ok(balanceSheet.totalAssets > 0)
  assert.ok(balanceSheet.liabilitiesAndEquity >= 0)
})

test('receivables report calculates open invoice balances from allocations', () => {
  const result = buildReceivablesReport([
    { id: 'inv_1', invoiceCode: 'INV-1', status: 'issued', clientId: 'client_1', totalAmount: 1000, issueDate: '2026-03-01T00:00:00.000Z' },
    { id: 'inv_2', invoiceCode: 'INV-2', status: 'cancelled', clientId: 'client_1', totalAmount: 500, issueDate: '2026-03-02T00:00:00.000Z' },
  ], [
    { id: 'alloc_1', invoiceId: 'inv_1', amount: 400, status: 'active' },
  ])

  assert.equal(result.totalInvoiced, 1000)
  assert.equal(result.totalAllocated, 400)
  assert.equal(result.totalOutstanding, 600)
  assert.equal(result.openRows.length, 1)
})

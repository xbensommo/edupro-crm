/**
 * @file src/apps/finance/services/financeChartOfAccounts.js
 * @description Default system accounts and lookup helpers.
 */

export const SYSTEM_ACCOUNT_KEYS = Object.freeze({
  CASH: 'cash',
  ACCOUNTS_RECEIVABLE: 'accounts_receivable',
  ACCOUNTS_PAYABLE: 'accounts_payable',
  CONSULTANT_PAYABLE: 'consultant_payable',
  SERVICE_REVENUE: 'service_revenue',
  CONSULTANT_COST: 'consultant_cost',
  OPERATING_EXPENSE: 'operating_expense',
  OWNER_EQUITY: 'owner_equity',
})

export const SYSTEM_ACCOUNT_ALIASES = Object.freeze({
  cash: 'cash_bank',
  cash_bank: 'cash_bank',
  accounts_receivable: 'accounts_receivable',
  accounts_payable: 'accounts_payable',
  consultant_payable: 'consultant_payable',
  service_revenue: 'service_revenue',
  consultant_cost: 'consultant_commission_expense',
  consultant_commission_expense: 'consultant_commission_expense',
  operating_expense: 'operating_expense',
  owner_equity: 'owner_equity',
})

export const DEFAULT_SYSTEM_ACCOUNTS = Object.freeze([
  {
    id: SYSTEM_ACCOUNT_KEYS.CASH,
    systemKey: SYSTEM_ACCOUNT_ALIASES.cash_bank,
    code: '1000',
    accountCode: '1000',
    name: 'Cash / Bank',
    type: 'asset',
    normalSide: 'debit',
    isSystem: true,
  },
  {
    id: SYSTEM_ACCOUNT_KEYS.ACCOUNTS_RECEIVABLE,
    systemKey: SYSTEM_ACCOUNT_KEYS.ACCOUNTS_RECEIVABLE,
    code: '1100',
    accountCode: '1100',
    name: 'Accounts Receivable',
    type: 'asset',
    normalSide: 'debit',
    isSystem: true,
  },
  {
    id: SYSTEM_ACCOUNT_KEYS.ACCOUNTS_PAYABLE,
    systemKey: SYSTEM_ACCOUNT_KEYS.ACCOUNTS_PAYABLE,
    code: '2000',
    accountCode: '2000',
    name: 'Accounts Payable',
    type: 'liability',
    normalSide: 'credit',
    isSystem: true,
  },
  {
    id: SYSTEM_ACCOUNT_KEYS.CONSULTANT_PAYABLE,
    systemKey: SYSTEM_ACCOUNT_KEYS.CONSULTANT_PAYABLE,
    code: '2100',
    accountCode: '2100',
    name: 'Consultant Payable',
    type: 'liability',
    normalSide: 'credit',
    isSystem: true,
  },
  {
    id: SYSTEM_ACCOUNT_KEYS.SERVICE_REVENUE,
    systemKey: SYSTEM_ACCOUNT_KEYS.SERVICE_REVENUE,
    code: '4000',
    accountCode: '4000',
    name: 'Service Revenue',
    type: 'revenue',
    normalSide: 'credit',
    isSystem: true,
  },
  {
    id: SYSTEM_ACCOUNT_KEYS.CONSULTANT_COST,
    systemKey: SYSTEM_ACCOUNT_ALIASES.consultant_cost,
    code: '5000',
    accountCode: '5000',
    name: 'Consultant Cost',
    type: 'expense',
    normalSide: 'debit',
    isSystem: true,
  },
  {
    id: SYSTEM_ACCOUNT_KEYS.OPERATING_EXPENSE,
    systemKey: SYSTEM_ACCOUNT_KEYS.OPERATING_EXPENSE,
    code: '5100',
    accountCode: '5100',
    name: 'Operating Expense',
    type: 'expense',
    normalSide: 'debit',
    isSystem: true,
  },
  {
    id: SYSTEM_ACCOUNT_KEYS.OWNER_EQUITY,
    systemKey: SYSTEM_ACCOUNT_KEYS.OWNER_EQUITY,
    code: '3000',
    accountCode: '3000',
    name: 'Owner Equity',
    type: 'equity',
    normalSide: 'credit',
    isSystem: true,
  },
])

export function normalizeSystemAccountKey(value) {
  const key = String(value || '').trim()
  if (!key) return ''
  return SYSTEM_ACCOUNT_ALIASES[key] || key
}

function accountLookupKeys(account) {
  const keys = new Set()
  const rawValues = [account?.id, account?.systemKey, account?.accountCode, account?.code]

  rawValues
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .forEach((value) => {
      keys.add(value)
      const normalized = normalizeSystemAccountKey(value)
      if (normalized) keys.add(normalized)
    })

  return [...keys]
}

export function mergeAccountCatalog(accounts = []) {
  const merged = new Map()

  for (const account of DEFAULT_SYSTEM_ACCOUNTS) {
    merged.set(account.id, account)
  }

  for (const account of accounts || []) {
    const stableId = account?.id || account?.systemKey || account?.accountCode || account?.code
    if (!stableId) continue
    merged.set(String(stableId), { ...account })
  }

  return [...merged.values()]
}

export function createAccountResolver(accounts = DEFAULT_SYSTEM_ACCOUNTS) {
  const byId = new Map()

  for (const account of mergeAccountCatalog(accounts)) {
    for (const key of accountLookupKeys(account)) {
      byId.set(key, account)
    }
  }

  return function resolveAccount(accountId) {
    const direct = String(accountId || '').trim()
    if (!direct) return undefined
    return byId.get(direct) || byId.get(normalizeSystemAccountKey(direct))
  }
}

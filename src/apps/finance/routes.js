/**
 * @file src/apps/finance/routes.js
 * @description EduProLIC finance route contribution.
 */

const FinanceDashboardPage = () => import('./pages/FinanceDashboardPage.vue')
const FinanceTransactionsPage = () => import('./pages/FinanceTransactionsPage.vue')
const FinancePaymentsPage = () => import('./pages/FinancePaymentsPage.vue')
const FinanceInvoicesPage = () => import('./pages/FinanceInvoicesPage.vue')
const FinanceReceiptsPage = () => import('./pages/FinanceReceiptsPage.vue')
const FinanceQuotationPage = () => import('./pages/FinanceQuotationPage.vue')
const FinanceReceivablesPage = () => import('./pages/FinanceReceivablesPage.vue')
const FinanceAuditPage = () => import('./pages/FinanceAuditPage.vue')
const FinanceRefundsPage = () => import('./pages/FinanceRefundsPage.vue')
const FinanceExpensesPage = () => import('./pages/FinanceExpensesPage.vue')
const FinancePayoutsPage = () => import('./pages/FinancePayoutsPage.vue')
const FinanceMyPayoutsPage = () => import('./pages/FinanceMyPayoutsPage.vue')
const FinanceAccountsPage = () => import('./pages/FinanceAccountsPage.vue')
const FinanceReportsPage = () => import('./pages/FinanceReportsPage.vue')
const FinanceBalanceSheetPage = () => import('./pages/FinanceBalanceSheetPage.vue')
const FinanceIncomeStatementPage = () => import('./pages/FinanceIncomeStatementPage.vue')
const FinanceExpenseStatementPage = () => import('./pages/FinanceExpenseStatementPage.vue')

export default [
  {
    path: '/finance',
    name: 'FinanceDashboard',
    component: FinanceDashboardPage,
    meta: {
      title: 'Finance',
      requiresAuth: true,
      feature: 'finance',
      app: 'finance',
      permission: 'finance.dashboard.read',
      roles: ['admin', 'receptionist'],
    },
  },
  {
    path: '/finance/transactions',
    name: 'FinanceTransactions',
    component: FinanceTransactionsPage,
    meta: {
      title: 'Finance Transactions',
      requiresAuth: true,
      feature: 'finance',
      app: 'finance',
      permission: 'finance.transaction.read',
      roles: ['admin', 'receptionist'],
    },
  },
  {
    path: '/finance/payments',
    name: 'FinancePayments',
    component: FinancePaymentsPage,
    meta: {
      title: 'Finance Payments',
      requiresAuth: true,
      feature: 'finance',
      app: 'finance',
      permission: 'finance.payment.read',
      roles: ['admin', 'receptionist'],
    },
  },
  {
    path: '/finance/invoices',
    name: 'Invoices',
    component: FinanceInvoicesPage,
    meta: {
      title: 'Finance Invoices',
      requiresAuth: true,
      feature: 'Billing',
      app: 'Billing',
      permission: 'finance.invoice.read',
      roles: ['admin', 'receptionist'],
    }
  },
  {
    path: '/quotation',
    name: 'Quotation',
    component: FinanceQuotationPage,
    meta: {
      title: 'Quotation',
      requiresAuth: true,
      feature: 'Billing',
      app: 'Billing',
      permission: 'finance.quotation.read',
      roles: ['admin', 'receptionist'],
    },
  },{
    path: '/a/receipts',
    name: 'Receipts',
    component: FinanceReceiptsPage,
    meta: {
      title: 'Receipts',
      requiresAuth: true,
      feature: 'Billing',
      app: 'Billing',
      permission: 'finance.quotation.read',
      roles: ['admin', 'receptionist'],
    },
  },
  {
    path: '/finance/receivables',
    name: 'FinanceReceivables',
    component: FinanceReceivablesPage,
    meta: {
      title: 'Finance Receivables',
      requiresAuth: true,
      feature: 'finance',
      app: 'finance',
      permission: 'finance.receivables.read',
      roles: ['admin', 'receptionist'],
    },
  },
  {
    path: '/finance/audit',
    name: 'FinanceAudit',
    component: FinanceAuditPage,
    meta: {
      title: 'Finance Audit',
      requiresAuth: true,
      feature: 'finance',
      app: 'finance',
      permission: 'finance.audit.read',
      roles: ['admin', 'receptionist'],
    },
  },
  {
    path: '/finance/refunds',
    name: 'FinanceRefunds',
    component: FinanceRefundsPage,
    meta: {
      title: 'Finance Refunds',
      requiresAuth: true,
      feature: 'finance',
      app: 'finance',
      permission: 'finance.refund.read',
      roles: ['admin', 'receptionist'],
    },
  },
  {
    path: '/finance/expenses',
    name: 'FinanceExpenses',
    component: FinanceExpensesPage,
    meta: {
      title: 'Finance Expenses',
      requiresAuth: true,
      feature: 'finance',
      app: 'finance',
      permission: 'finance.expense.read',
      roles: ['admin', 'receptionist'],
    },
  },
  {
    path: '/finance/payouts',
    name: 'FinancePayouts',
    component: FinancePayoutsPage,
    meta: {
      title: 'Consultant Payouts',
      requiresAuth: true,
      feature: 'finance',
      app: 'finance',
      permission: 'finance.payout.read',
      roles: ['admin', 'receptionist'],
    },
  },
  {
    path: '/finance/my-payouts',
    name: 'FinanceMyPayouts',
    component: FinanceMyPayoutsPage,
    meta: {
      title: 'My Payouts',
      requiresAuth: true,
      feature: 'finance',
      app: 'finance',
      permission: 'finance.own_payout.read',
      roles: ['consultant'],
    },
  },
  {
    path: '/finance/accounts',
    name: 'FinanceAccounts',
    component: FinanceAccountsPage,
    meta: {
      title: 'Finance Accounts',
      requiresAuth: true,
      feature: 'finance',
      hideInNav: true,
      app: 'finance',
      permission: 'finance.account.read',
      roles: ['admin', 'receptionist'],
    },
  },
  {
    path: '/finance/reports',
    name: 'FinanceReports',
    component: FinanceReportsPage,
    meta: {
      title: 'Finance Reports',
      requiresAuth: true, hideInNav: true,
      feature: 'finance',
      app: 'finance',
      permission: 'finance.report.read',
      roles: ['admin', 'receptionist'],
    },
  },
  {
    path: '/finance/reports/balance-sheet',
    name: 'FinanceBalanceSheet',
    component: FinanceBalanceSheetPage,
    meta: {
      title: 'Balance Sheet',
      requiresAuth: true, hideInNav: true,
      feature: 'finance',
      app: 'finance',
      permission: 'finance.report.read',
      roles: ['admin', 'receptionist'],
    },
  },
  {
    path: '/finance/reports/income-statement',
    name: 'FinanceIncomeStatement',
    component: FinanceIncomeStatementPage,
    meta: {
      title: 'Income Statement',
      requiresAuth: true,
      hideInNav: true,
      feature: 'finance',
      app: 'finance',
      permission: 'finance.report.read',
      roles: ['admin', 'receptionist'],
    },
  },
  {
    path: '/finance/reports/expense-statement',
    name: 'FinanceExpenseStatement',
    component: FinanceExpenseStatementPage,
    meta: {
      title: 'Expense Statement',
      requiresAuth: true,
      hideInNav: true,
      feature: 'finance',
      app: 'finance',
      permission: 'finance.report.read',
      roles: ['admin', 'receptionist'],
    },
  },
]

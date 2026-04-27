/**
 * @file src/apps/finance/services/financeSampleData.js
 * @description Seed data so the finance app renders immediately in isolation.
 */

import { DEFAULT_SYSTEM_ACCOUNTS } from './financeChartOfAccounts.js'
import { createPostedJournalEntry } from './financePostingEngine.js'

/**
 * @returns {{
 *   accounts: Array<object>,
 *   transactions: Array<object>,
 *   journalEntries: Array<object>,
 *   periods: Array<object>,
 *   invoices: Array<object>,
 *   paymentAllocations: Array<object>,
 *   auditLogs: Array<object>
 * }}
 */
export function buildFinanceDemoState() {
  const accounts = [
    ...DEFAULT_SYSTEM_ACCOUNTS,
    {
      id: 'marketing_expense',
      code: '5200',
      name: 'Marketing Expense',
      type: 'expense',
      normalSide: 'debit',
      isSystem: false,
      isActive: true,
      description: 'Advertising and campaign costs.',
    },
    {
      id: 'office_expense',
      code: '5300',
      name: 'Office Expense',
      type: 'expense',
      normalSide: 'debit',
      isSystem: false,
      isActive: true,
      description: 'Office supplies, internet, and utility costs.',
    },
    {
      id: 'equipment_asset',
      code: '1200',
      name: 'Computer Equipment',
      type: 'asset',
      normalSide: 'debit',
      isSystem: false,
      isActive: true,
      description: 'Capital equipment used by the business.',
    },
  ]

  const transactions = [
    {
      id: 'txn_001',
      type: 'payment',
      status: 'posted',
      reference: 'INV-2026-001',
      memo: 'Website design milestone payment',
      occurredOn: '2026-01-05',
      amount: 16000,
      currency: 'NAD',
      clientId: 'client_001',
      clientLabel: 'Solveit Insurance Brokers',
      sourceRef: 'quote_001',
      createdBy: 'admin_001',
    },
    {
      id: 'txn_002',
      type: 'expense',
      status: 'posted',
      reference: 'EXP-2026-004',
      memo: 'Performance campaign retainer',
      occurredOn: '2026-01-08',
      amount: 2200,
      currency: 'NAD',
      sourceRef: 'receipt_018',
      accountOverrides: {
        expenseAccountId: 'marketing_expense',
      },
      createdBy: 'accountant_001',
    },
    {
      id: 'txn_003',
      type: 'payment',
      status: 'posted',
      reference: 'INV-2026-014',
      memo: 'Ecommerce rollout stage two',
      occurredOn: '2026-02-12',
      amount: 9000,
      currency: 'NAD',
      clientId: 'client_002',
      clientLabel: 'Kaufi Pro Organics',
      sourceRef: 'invoice_014',
      createdBy: 'admin_001',
    },
    {
      id: 'txn_004',
      type: 'payout',
      status: 'posted',
      reference: 'PAY-2026-002',
      memo: 'Consultant project share payout',
      occurredOn: '2026-02-13',
      amount: 5400,
      currency: 'NAD',
      consultantId: 'consultant_017',
      consultantLabel: 'Senior Consultant',
      sourceRef: 'share_002',
      createdBy: 'accountant_001',
    },
    {
      id: 'txn_005',
      type: 'expense',
      status: 'posted',
      reference: 'EXP-2026-010',
      memo: 'Internet, hosting, and software tools',
      occurredOn: '2026-03-06',
      amount: 3100,
      currency: 'NAD',
      sourceRef: 'receipt_041',
      accountOverrides: {
        expenseAccountId: 'office_expense',
      },
      createdBy: 'accountant_001',
    },
    {
      id: 'txn_006',
      type: 'adjustment',
      status: 'posted',
      reference: 'ADJ-2026-001',
      memo: 'Equipment capitalization',
      occurredOn: '2026-03-10',
      amount: 4000,
      currency: 'NAD',
      lines: [
        {
          accountId: 'equipment_asset',
          side: 'debit',
          amount: 4000,
          memo: 'Equipment capitalization',
        },
        {
          accountId: 'owner_equity',
          side: 'credit',
          amount: 4000,
          memo: 'Owner funded equipment capitalization',
        },
      ],
      createdBy: 'admin_001',
    },
    {
      id: 'txn_007',
      type: 'payment',
      status: 'draft',
      reference: 'INV-2026-021',
      memo: 'Pending booking platform deposit',
      occurredOn: '2026-03-18',
      amount: 6500,
      currency: 'NAD',
      clientId: 'client_003',
      clientLabel: 'Nangura Social Care',
      sourceRef: 'quote_021',
      createdBy: 'receptionist_001',
    },
    {
      id: 'txn_008',
      type: 'expense',
      status: 'reviewed',
      reference: 'EXP-2026-015',
      memo: 'Office printer and stationery',
      occurredOn: '2026-03-19',
      amount: 1800,
      currency: 'NAD',
      sourceRef: 'receipt_051',
      accountOverrides: {
        expenseAccountId: 'office_expense',
      },
      createdBy: 'receptionist_001',
    },
  ]

  const journalEntries = [
    createPostedJournalEntry({
      transaction: transactions[0],
      accounts,
      actor: { id: 'admin_001' },
      idFactory: () => 'je_001',
      nowFactory: () => '2026-01-05T10:00:00.000Z',
    }),
    createPostedJournalEntry({
      transaction: transactions[1],
      accounts,
      actor: { id: 'accountant_001' },
      idFactory: () => 'je_002',
      nowFactory: () => '2026-01-08T12:00:00.000Z',
    }),
    createPostedJournalEntry({
      transaction: transactions[2],
      accounts,
      actor: { id: 'admin_001' },
      idFactory: () => 'je_003',
      nowFactory: () => '2026-02-12T09:00:00.000Z',
    }),
    createPostedJournalEntry({
      transaction: transactions[3],
      accounts,
      actor: { id: 'accountant_001' },
      idFactory: () => 'je_004',
      nowFactory: () => '2026-02-13T14:00:00.000Z',
    }),
    createPostedJournalEntry({
      transaction: transactions[4],
      accounts,
      actor: { id: 'accountant_001' },
      idFactory: () => 'je_005',
      nowFactory: () => '2026-03-06T11:30:00.000Z',
    }),
    createPostedJournalEntry({
      transaction: transactions[5],
      accounts,
      actor: { id: 'admin_001' },
      idFactory: () => 'je_006',
      nowFactory: () => '2026-03-10T16:15:00.000Z',
    }),
  ].map((entry) => ({
    ...entry,
    currency: 'NAD',
    memo: transactions.find((transaction) => transaction.id === entry.transactionId)?.memo || null,
    createdAt: entry.postedAt,
    updatedAt: entry.postedAt,
  }))

  const transactionsWithLinks = transactions.map((transaction) => {
    const matchingEntry = journalEntries.find((entry) => entry.transactionId === transaction.id)
    return matchingEntry
      ? {
          ...transaction,
          postedJournalEntryId: matchingEntry.id,
          postedAt: matchingEntry.postedAt,
          postedBy: matchingEntry.createdBy,
        }
      : transaction
  })

  const periods = [
    {
      id: 'period_2026_01',
      key: '2026-01',
      label: 'January 2026',
      startsOn: '2026-01-01',
      endsOn: '2026-01-31',
      status: 'closed',
      closedAt: '2026-02-02T08:00:00.000Z',
      closedBy: 'accountant_001',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-02-02T08:00:00.000Z',
    },
    {
      id: 'period_2026_02',
      key: '2026-02',
      label: 'February 2026',
      startsOn: '2026-02-01',
      endsOn: '2026-02-28',
      status: 'closed',
      closedAt: '2026-03-01T08:00:00.000Z',
      closedBy: 'accountant_001',
      createdAt: '2026-02-01T00:00:00.000Z',
      updatedAt: '2026-03-01T08:00:00.000Z',
    },
    {
      id: 'period_2026_03',
      key: '2026-03',
      label: 'March 2026',
      startsOn: '2026-03-01',
      endsOn: '2026-03-31',
      status: 'open',
      createdAt: '2026-03-01T00:00:00.000Z',
      updatedAt: '2026-03-01T00:00:00.000Z',
    },
  ]

  const invoices = [
    {
      id: 'inv_001',
      invoiceCode: 'INV-2026-001',
      clientId: 'client_001',
      clientLabel: 'Solveit Insurance Brokers',
      engagementId: 'eng_001',
      engagementCode: 'EDU-2026-001',
      status: 'paid',
      issueDate: '2026-01-03T00:00:00.000Z',
      dueDate: '2026-01-20T00:00:00.000Z',
      currency: 'NAD',
      subtotalAmount: 16000,
      discountAmount: 0,
      taxAmount: 0,
      totalAmount: 16000,
      allocatedAmount: 16000,
      paidAmount: 16000,
      balanceAmount: 0,
      lineItems: [{ description: 'Website design milestone', quantity: 1, unitPrice: 16000, totalAmount: 16000 }],
      financeTransactionId: 'txn_001',
      postedJournalEntryId: 'je_001',
      createdByUserId: 'admin_001',
    },
    {
      id: 'inv_002',
      invoiceCode: 'INV-2026-014',
      clientId: 'client_002',
      clientLabel: 'Kaufi Pro Organics',
      engagementId: 'eng_014',
      engagementCode: 'EDU-2026-014',
      status: 'partially_paid',
      issueDate: '2026-02-08T00:00:00.000Z',
      dueDate: '2026-02-28T00:00:00.000Z',
      currency: 'NAD',
      subtotalAmount: 12000,
      discountAmount: 0,
      taxAmount: 0,
      totalAmount: 12000,
      allocatedAmount: 9000,
      paidAmount: 9000,
      balanceAmount: 3000,
      lineItems: [{ description: 'Ecommerce rollout stage two', quantity: 1, unitPrice: 12000, totalAmount: 12000 }],
      financeTransactionId: 'txn_003',
      postedJournalEntryId: 'je_003',
      createdByUserId: 'admin_001',
    },
  ]

  const paymentAllocations = [
    { id: 'alloc_001', allocationCode: 'ALLOC-2026-001', paymentId: 'pay_001', paymentCode: 'PAY-2026-001', invoiceId: 'inv_001', invoiceCode: 'INV-2026-001', clientId: 'client_001', engagementId: 'eng_001', amount: 16000, currency: 'NAD', allocatedAt: '2026-01-05T10:10:00.000Z', allocatedByUserId: 'admin_001', status: 'active' },
    { id: 'alloc_002', allocationCode: 'ALLOC-2026-002', paymentId: 'pay_002', paymentCode: 'PAY-2026-002', invoiceId: 'inv_002', invoiceCode: 'INV-2026-014', clientId: 'client_002', engagementId: 'eng_014', amount: 9000, currency: 'NAD', allocatedAt: '2026-02-12T09:15:00.000Z', allocatedByUserId: 'admin_001', status: 'active' },
  ]

  const auditLogs = [
    { id: 'aud_001', auditCode: 'AUD-2026-001', action: 'invoice.issue', entityType: 'invoice', entityId: 'inv_001', entityLabel: 'INV-2026-001', outcome: 'success', actorId: 'admin_001', actorName: 'Finance Admin', occurredAt: '2026-01-03T08:00:00.000Z', sourceModule: 'finance' },
    { id: 'aud_002', auditCode: 'AUD-2026-002', action: 'transaction.post', entityType: 'finance_transaction', entityId: 'txn_001', entityLabel: 'INV-2026-001', outcome: 'success', actorId: 'admin_001', actorName: 'Finance Admin', occurredAt: '2026-01-05T10:00:00.000Z', sourceModule: 'finance' },
  ]

  return {
    accounts,
    transactions: transactionsWithLinks,
    journalEntries,
    periods,
    invoices,
    paymentAllocations,
    auditLogs,
  }
}

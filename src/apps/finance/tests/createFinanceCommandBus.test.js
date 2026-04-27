import test from 'node:test'
import assert from 'node:assert/strict'
import { createFinanceCommandBus } from '../services/createFinanceCommandBus.js'

function createMemoryRepository(initialItems = []) {
  const items = new Map(initialItems.map((item) => [item.id, structuredClone(item)]))

  return {
    async getById(id) {
      return items.get(id) ? structuredClone(items.get(id)) : null
    },
    async add(record) {
      const id = record.id || `${items.size + 1}`
      const finalRecord = { ...structuredClone(record), id }
      items.set(id, finalRecord)
      return structuredClone(finalRecord)
    },
    async update(id, patch) {
      const current = items.get(id)
      items.set(id, { ...current, ...structuredClone(patch) })
      return structuredClone(items.get(id))
    },
    async remove(id) {
      items.delete(id)
      return true
    },
    snapshot() {
      return [...items.values()].map((item) => structuredClone(item))
    },
  }
}

function createAdminUser() {
  return { id: 'user_1', role: 'admin', roles: ['admin'] }
}

test('reviewTransaction promotes a draft transaction to reviewed', async () => {
  const transactions = createMemoryRepository([
    { id: 'txn_review', status: 'draft', type: 'payment', amount: 100, occurredOn: '2026-03-01' },
  ])

  const journalEntries = createMemoryRepository()
  const commandBus = createFinanceCommandBus({
    repositories: { transactions, journalEntries },
    confirm: async () => true,
    getCurrentUser: createAdminUser,
  })

  const result = await commandBus.reviewTransaction('txn_review')
  const record = transactions.snapshot()[0]

  assert.equal(result.status, 'reviewed')
  assert.equal(record.status, 'reviewed')
})

test('postTransaction creates journal entry and updates transaction', async () => {
  const transactions = createMemoryRepository([
    { id: 'txn_post', status: 'reviewed', type: 'payment', amount: 500, occurredOn: '2026-03-02', memo: 'Test payment' },
  ])

  const journalEntries = createMemoryRepository()
  const commandBus = createFinanceCommandBus({
    repositories: { transactions, journalEntries },
    confirm: async () => true,
    getCurrentUser: createAdminUser,
  })

  const result = await commandBus.postTransaction('txn_post')
  const transaction = transactions.snapshot()[0]
  const entries = journalEntries.snapshot()

  assert.equal(result.status, 'posted')
  assert.equal(transaction.status, 'posted')
  assert.equal(entries.length, 1)
  assert.equal(entries[0].transactionId, 'txn_post')
  assert.match(entries[0].periodKey, /^\d{4}-\d{2}$/)
})

test('createInvoice stores a balanced draft invoice', async () => {
  const invoices = createMemoryRepository()
  const invoiceItems = createMemoryRepository()
  const commandBus = createFinanceCommandBus({
    repositories: { invoices, invoiceItems },
    confirm: async () => true,
    getCurrentUser: createAdminUser,
  })

  const invoice = await commandBus.createInvoice({
    clientId: 'client_1',
    clientLabel: 'Client One',
    lineItems: [{ description: 'Assignment support', quantity: 2, unitPrice: 750 }],
  })

  assert.equal(invoice.status, 'draft')
  assert.equal(invoice.totalAmount, 1500)
  assert.equal(invoice.balanceAmount, 1500)
  assert.equal(invoiceItems.snapshot().length, 1)
})

test('issueInvoice creates receivable transaction and updates invoice', async () => {
  const invoices = createMemoryRepository([
    { id: 'inv_1', invoiceCode: 'INV-1', status: 'draft', clientId: 'client_1', clientLabel: 'Client One', totalAmount: 1200, balanceAmount: 1200, issueDate: '2026-03-01T00:00:00.000Z' },
  ])
  const transactions = createMemoryRepository()
  const commandBus = createFinanceCommandBus({
    repositories: { invoices, transactions },
    confirm: async () => true,
    getCurrentUser: createAdminUser,
  })

  const result = await commandBus.issueInvoice('inv_1')
  const invoice = invoices.snapshot()[0]
  const transaction = transactions.snapshot()[0]

  assert.equal(result.status, 'issued')
  assert.equal(invoice.status, 'issued')
  assert.equal(transaction.type, 'work_revenue')
  assert.equal(transaction.invoiceId, 'inv_1')
  assert.equal(transaction.amount, 1200)
})

test('allocatePaymentToInvoice updates invoice and payment balances', async () => {
  const invoices = createMemoryRepository([
    { id: 'inv_1', invoiceCode: 'INV-1', status: 'issued', clientId: 'client_1', totalAmount: 1200, allocatedAmount: 0, balanceAmount: 1200, issueDate: '2026-03-01T00:00:00.000Z' },
  ])
  const payments = createMemoryRepository([
    { id: 'pay_1', paymentCode: 'PAY-1', clientId: 'client_1', engagementId: 'eng_1', amount: 800, allocatedAmount: 0, unappliedAmount: 800, paymentDate: '2026-03-02T00:00:00.000Z' },
  ])
  const paymentAllocations = createMemoryRepository()
  const commandBus = createFinanceCommandBus({
    repositories: { invoices, payments, paymentAllocations },
    confirm: async () => true,
    getCurrentUser: createAdminUser,
  })

  const result = await commandBus.allocatePaymentToInvoice({ paymentId: 'pay_1', invoiceId: 'inv_1', amount: 500 })
  const invoice = invoices.snapshot()[0]
  const payment = payments.snapshot()[0]

  assert.equal(result.status, 'allocated')
  assert.equal(paymentAllocations.snapshot().length, 1)
  assert.equal(invoice.allocatedAmount, 500)
  assert.equal(invoice.balanceAmount, 700)
  assert.equal(invoice.status, 'partially_paid')
  assert.equal(payment.allocatedAmount, 500)
  assert.equal(payment.unappliedAmount, 300)
})

test('allocatePaymentToInvoice rejects over-allocation', async () => {
  const invoices = createMemoryRepository([
    { id: 'inv_1', invoiceCode: 'INV-1', status: 'issued', clientId: 'client_1', totalAmount: 300, allocatedAmount: 0, balanceAmount: 300, issueDate: '2026-03-01T00:00:00.000Z' },
  ])
  const payments = createMemoryRepository([
    { id: 'pay_1', paymentCode: 'PAY-1', clientId: 'client_1', engagementId: 'eng_1', amount: 800, allocatedAmount: 0, unappliedAmount: 800, paymentDate: '2026-03-02T00:00:00.000Z' },
  ])
  const paymentAllocations = createMemoryRepository()
  const commandBus = createFinanceCommandBus({
    repositories: { invoices, payments, paymentAllocations },
    confirm: async () => true,
    getCurrentUser: createAdminUser,
  })

  await assert.rejects(
    () => commandBus.allocatePaymentToInvoice({ paymentId: 'pay_1', invoiceId: 'inv_1', amount: 500 }),
    /Allocation amount exceeds invoice balance/,
  )
  assert.equal(paymentAllocations.snapshot().length, 0)
})

test('postTransaction does not post when confirmation is rejected', async () => {
  const transactions = createMemoryRepository([
    { id: 'txn_post', status: 'reviewed', type: 'payment', amount: 500, occurredOn: '2026-03-02', memo: 'Test payment' },
  ])
  const journalEntries = createMemoryRepository()
  const commandBus = createFinanceCommandBus({
    repositories: { transactions, journalEntries },
    confirm: async () => false,
    getCurrentUser: createAdminUser,
  })

  const result = await commandBus.postTransaction('txn_post')
  assert.equal(result.status, 'cancelled')
  assert.equal(transactions.snapshot()[0].status, 'reviewed')
  assert.equal(journalEntries.snapshot().length, 0)
})

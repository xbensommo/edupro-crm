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
      items.set(record.id, structuredClone(record))
      return structuredClone(record)
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

test('reviewTransaction promotes a draft transaction to reviewed', async () => {
  const transactions = createMemoryRepository([
    {
      id: 'txn_review',
      status: 'draft',
      type: 'payment',
      amount: 100,
      occurredOn: '2026-03-01',
    },
  ])

  const journalEntries = createMemoryRepository()
  const commandBus = createFinanceCommandBus({
    repositories: { transactions, journalEntries },
    confirm: async () => true,
    getCurrentUser: () => ({ id: 'user_1', roles: ['accountant'] }),
  })

  const result = await commandBus.reviewTransaction('txn_review')
  const record = transactions.snapshot()[0]

  assert.equal(result.status, 'reviewed')
  assert.equal(record.status, 'reviewed')
})

test('postTransaction creates journal entry and updates transaction', async () => {
  const transactions = createMemoryRepository([
    {
      id: 'txn_post',
      status: 'reviewed',
      type: 'payment',
      amount: 500,
      occurredOn: '2026-03-02',
      memo: 'Test payment',
    },
  ])

  const journalEntries = createMemoryRepository()
  const commandBus = createFinanceCommandBus({
    repositories: { transactions, journalEntries },
    confirm: async () => true,
    getCurrentUser: () => ({ id: 'user_1', roles: ['accountant'] }),
  })

  const result = await commandBus.postTransaction('txn_post')
  const transaction = transactions.snapshot()[0]
  const entries = journalEntries.snapshot()

  assert.equal(result.status, 'posted')
  assert.equal(transaction.status, 'posted')
  assert.equal(entries.length, 1)
  assert.equal(entries[0].transactionId, 'txn_post')
})

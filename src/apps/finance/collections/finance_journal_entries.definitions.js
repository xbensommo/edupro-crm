/**
 * @file src/apps/finance/collections/finance_journal_entries.definitions.js
 * @description Immutable ledger entries created by posting finance transactions.
 */

import { FIELD_TYPES, defineCollection } from '@xbensommo/shard-provider'

export default defineCollection({
  name: 'finance_journal_entries',
  shard: { type: 'none', field: 'postedAt' },
  schema: {
    id: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    transactionId: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    transactionType: { type: FIELD_TYPES.STRING, required: true, filterable: true, sortable: true },
    status: { type: FIELD_TYPES.STRING, required: true, filterable: true, sortable: true, enum: ['posted', 'reversal'] },
    memo: { type: FIELD_TYPES.STRING, required: false, searchable: true },
    reference: { type: FIELD_TYPES.STRING, required: false, searchable: true, filterable: true },
    currency: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    postedAt: { type: FIELD_TYPES.TIMESTAMP, required: true, sortable: true, filterable: true },
    periodKey: { type: FIELD_TYPES.STRING, required: true, filterable: true, sortable: true },
    entityId: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    lines: { type: FIELD_TYPES.ARRAY, required: true },
    totalDebit: { type: FIELD_TYPES.NUMBER, required: true, sortable: true },
    totalCredit: { type: FIELD_TYPES.NUMBER, required: true, sortable: true },
    reversalOfEntryId: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    reversedEntryId: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    createdBy: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    createdAt: { type: FIELD_TYPES.TIMESTAMP, readonly: true, system: true, sortable: true, filterable: true },
    updatedAt: { type: FIELD_TYPES.TIMESTAMP, readonly: true, system: true, sortable: true },
  },
  writableFields: [
    'id',
    'transactionId',
    'transactionType',
    'status',
    'memo',
    'reference',
    'currency',
    'postedAt',
    'periodKey',
    'entityId',
    'lines',
    'totalDebit',
    'totalCredit',
    'reversalOfEntryId',
    'reversedEntryId',
    'createdBy',
  ],
  updateableFields: ['reversedEntryId'],
  indexes: [
    { fields: ['postedAt'], order: 'ASCENDING' },
    { fields: ['transactionId'], order: 'ASCENDING' },
    { fields: ['periodKey', 'postedAt'], order: 'ASCENDING' },
    { fields: ['status', 'postedAt'], order: 'ASCENDING' },
    { fields: ['transactionType', 'postedAt'], order: 'ASCENDING' },
  ],
  search: {
    mode: 'token-array',
    fields: ['memo', 'periodKey', 'transactionId', 'reference'],
  },
  rules: {
    read: 'auth',
    create: 'financeOrAdmin',
    update: 'financeOrAdmin',
    delete: 'adminOnly',
  },
})

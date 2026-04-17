/**
 * @file finance/definitions/journal_lines.definitions.js
 * @description Accounting journal lines linked to journal entries.
 */

import { FIELD_TYPES, defineCollection } from '@xbensommo/shard-provider';

export default defineCollection({
  name: 'journal_lines',
  shard: { type: 'monthly', field: 'createdAt' },
  schema: {
    journalEntryId: { type: FIELD_TYPES.STRING, required: true, filterable: true },
    accountId: { type: FIELD_TYPES.STRING, required: true, filterable: true },
    debit: { type: FIELD_TYPES.NUMBER, required: false, filterable: true, sortable: true },
    credit: { type: FIELD_TYPES.NUMBER, required: false, filterable: true, sortable: true },
    memo: { type: FIELD_TYPES.STRING, required: false, searchable: true },
    relatedClientId: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    relatedEngagementId: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    createdAt: { type: FIELD_TYPES.TIMESTAMP, readonly: true, system: true, sortable: true, filterable: true },
    updatedAt: { type: FIELD_TYPES.TIMESTAMP, readonly: true, system: true, sortable: true },
  },
  writableFields: [
    'journalEntryId',
    'accountId',
    'debit',
    'credit',
    'memo',
    'relatedClientId',
    'relatedEngagementId',
  ],
  updateableFields: ['accountId', 'debit', 'credit', 'memo', 'relatedClientId', 'relatedEngagementId'],
  indexes: [
    { fields: ['journalEntryId'] },
    { fields: ['accountId', 'createdAt'] },
    { fields: ['relatedEngagementId', 'createdAt'] },
  ],
  search: {
    mode: 'token-array',
    fields: ['memo'],
  },
  rules: {
    read: 'auth',
    create: 'financeOrAdmin',
    update: 'financeOrAdmin',
    delete: 'adminOnly',
  },
});

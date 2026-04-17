/**
 * @file finance/definitions/journal_entries.definitions.js
 * @description Accounting journal headers used for posting financial movements.
 */

import { FIELD_TYPES, defineCollection } from '@xbensommo/shard-provider';

export default defineCollection({
  name: 'journal_entries',
  shard: { type: 'monthly', field: 'entryDate' },
  schema: {
    entryCode: { type: FIELD_TYPES.STRING, required: true, searchable: true, sortable: true, filterable: true },
    entryDate: { type: FIELD_TYPES.TIMESTAMP, required: true, filterable: true, sortable: true },
    description: { type: FIELD_TYPES.STRING, required: true, searchable: true },
    sourceType: { type: FIELD_TYPES.STRING, required: false, filterable: true, sortable: true },
    sourceId: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    status: { type: FIELD_TYPES.STRING, required: false, filterable: true, sortable: true },
    periodKey: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    postedByUserId: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    reversedByUserId: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    reversedAt: { type: FIELD_TYPES.TIMESTAMP, required: false, filterable: true, sortable: true },
    createdAt: { type: FIELD_TYPES.TIMESTAMP, readonly: true, system: true, sortable: true, filterable: true },
    updatedAt: { type: FIELD_TYPES.TIMESTAMP, readonly: true, system: true, sortable: true },
  },
  writableFields: [
    'entryCode',
    'entryDate',
    'description',
    'sourceType',
    'sourceId',
    'status',
    'periodKey',
    'postedByUserId',
    'reversedByUserId',
    'reversedAt',
  ],
  updateableFields: [
    'entryDate',
    'description',
    'sourceType',
    'sourceId',
    'status',
    'periodKey',
    'postedByUserId',
    'reversedByUserId',
    'reversedAt',
  ],
  indexes: [
    { fields: ['entryCode'] },
    { fields: ['sourceType', 'entryDate'] },
    { fields: ['status', 'entryDate'] },
    { fields: ['periodKey', 'entryDate'] },
  ],
  search: {
    mode: 'token-array',
    fields: ['entryCode', 'description', 'periodKey'],
  },
  rules: {
    read: 'auth',
    create: 'financeOrAdmin',
    update: 'financeOrAdmin',
    delete: 'adminOnly',
  },
});

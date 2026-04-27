/**
 * @file src/apps/finance/collections/finance_periods.definitions.js
 * @description Accounting periods and close controls.
 */

import { FIELD_TYPES, defineCollection } from '@xbensommo/shard-provider'

export default defineCollection({
  name: 'finance_periods',
  shard: { type: 'none' },
  schema: {
    key: { type: FIELD_TYPES.STRING, required: true, immutable: true, searchable: true, filterable: true, sortable: true },
    label: { type: FIELD_TYPES.STRING, required: true, searchable: true, sortable: true },
    startsOn: { type: FIELD_TYPES.TIMESTAMP, required: true, sortable: true, filterable: true },
    endsOn: { type: FIELD_TYPES.TIMESTAMP, required: true, sortable: true, filterable: true },
    status: { type: FIELD_TYPES.STRING, required: true, filterable: true, sortable: true, enum: ['open', 'closed'] },
    closedAt: { type: FIELD_TYPES.TIMESTAMP, required: false, sortable: true },
    closedBy: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    createdAt: { type: FIELD_TYPES.TIMESTAMP, readonly: true, system: true, sortable: true, filterable: true },
    updatedAt: { type: FIELD_TYPES.TIMESTAMP, readonly: true, system: true, sortable: true },
  },
  writableFields: ['key', 'label', 'startsOn', 'endsOn', 'status', 'closedAt', 'closedBy'],
  updateableFields: ['label', 'startsOn', 'endsOn', 'status', 'closedAt', 'closedBy'],
  primaryKey: { field: 'key', required: true },
  indexes: [
    { fields: ['key'], order: 'ASCENDING' },
    { fields: ['endsOn'], order: 'ASCENDING' },
    { fields: ['status', 'endsOn'], order: 'ASCENDING' },
  ],
  search: {
    mode: 'token-array',
    fields: ['key', 'label'],
  },
  rules: {
    read: 'auth',
    create: 'financeOrAdmin',
    update: 'financeOrAdmin',
    delete: 'adminOnly',
  },
})

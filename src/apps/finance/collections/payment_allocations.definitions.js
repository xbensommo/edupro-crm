/**
 * @file src/apps/finance/collections/payment_allocations.definitions.js
 * @description Links received payments to invoices without mutating payment history.
 */

import { FIELD_TYPES, defineCollection } from '@xbensommo/shard-provider'

export default defineCollection({
  name: 'payment_allocations',
  shard: { type: 'none', field: 'allocatedAt' },
  schema: {
    allocationCode: { type: FIELD_TYPES.STRING, required: true, immutable: true, searchable: true, filterable: true, sortable: true },
    paymentId: { type: FIELD_TYPES.STRING, required: true, filterable: true },
    paymentCode: { type: FIELD_TYPES.STRING, required: false, searchable: true, filterable: true },
    invoiceId: { type: FIELD_TYPES.STRING, required: true, filterable: true },
    invoiceCode: { type: FIELD_TYPES.STRING, required: false, searchable: true, filterable: true },
    clientId: { type: FIELD_TYPES.STRING, required: true, filterable: true },
    engagementId: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    amount: { type: FIELD_TYPES.NUMBER, required: true, filterable: true, sortable: true },
    currency: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    allocatedAt: { type: FIELD_TYPES.TIMESTAMP, required: true, filterable: true, sortable: true },
    allocatedByUserId: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    status: { type: FIELD_TYPES.STRING, required: true, filterable: true, sortable: true, enum: ['active', 'reversed'] },
    notes: { type: FIELD_TYPES.STRING, required: false, searchable: true },
    reversedAt: { type: FIELD_TYPES.TIMESTAMP, required: false, sortable: true },
    reversedByUserId: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    reversalReason: { type: FIELD_TYPES.STRING, required: false, searchable: true },
    isDeleted: { type: FIELD_TYPES.BOOLEAN, readonly: true, system: true, filterable: true, default: false },
    deletedAt: { type: FIELD_TYPES.TIMESTAMP, readonly: true, system: true, sortable: true },
    deletedBy: { type: FIELD_TYPES.STRING, readonly: true, system: true, filterable: true },
    createdAt: { type: FIELD_TYPES.TIMESTAMP, readonly: true, system: true, sortable: true, filterable: true },
    updatedAt: { type: FIELD_TYPES.TIMESTAMP, readonly: true, system: true, sortable: true },
  },
  writableFields: [
    'allocationCode',
    'paymentId',
    'paymentCode',
    'invoiceId',
    'invoiceCode',
    'clientId',
    'engagementId',
    'amount',
    'currency',
    'allocatedAt',
    'allocatedByUserId',
    'status',
    'notes',
    'reversedAt',
    'reversedByUserId',
    'reversalReason',
  ],
  updateableFields: ['status', 'notes', 'reversedAt', 'reversedByUserId', 'reversalReason'],
  primaryKey: { field: 'allocationCode', required: true },
  indexes: [
    { fields: ['allocatedAt'], order: 'DESCENDING' },
    { fields: ['isDeleted', 'allocatedAt'], order: 'DESCENDING' },
    { fields: ['paymentId', 'allocatedAt'], order: 'DESCENDING' },
    { fields: ['invoiceId', 'allocatedAt'], order: 'DESCENDING' },
    { fields: ['clientId', 'allocatedAt'], order: 'DESCENDING' },
    { fields: ['status', 'allocatedAt'], order: 'DESCENDING' },
  ],
  search: {
    mode: 'token-array',
    fields: ['allocationCode', 'paymentCode', 'invoiceCode', 'notes'],
  },
  rules: {
    read: 'auth',
    create: 'financeOrAdmin',
    update: 'financeOrAdmin',
    delete: 'adminOnly',
  },
})

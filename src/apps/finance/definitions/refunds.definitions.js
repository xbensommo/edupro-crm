/**
 * @file finance/definitions/refunds.definitions.js
 * @description Refund requests and processed client refunds.
 */

import { FIELD_TYPES, defineCollection } from '@xbensommo/shard-provider';

export default defineCollection({
  name: 'refunds',
  shard: { type: 'monthly', field: 'refundDate' },
  schema: {
    refundCode: { type: FIELD_TYPES.STRING, required: true, searchable: true, sortable: true, filterable: true },
    clientId: { type: FIELD_TYPES.STRING, required: true, filterable: true },
    engagementId: { type: FIELD_TYPES.STRING, required: true, filterable: true },
    amount: { type: FIELD_TYPES.NUMBER, required: true, filterable: true, sortable: true },
    reason: { type: FIELD_TYPES.STRING, required: false, searchable: true },
    refundMethod: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    refundDate: { type: FIELD_TYPES.TIMESTAMP, required: true, filterable: true, sortable: true },
    approvedByUserId: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    processedByUserId: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    status: { type: FIELD_TYPES.STRING, required: false, filterable: true, sortable: true },
    journalEntryId: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    createdAt: { type: FIELD_TYPES.TIMESTAMP, readonly: true, system: true, sortable: true, filterable: true },
    updatedAt: { type: FIELD_TYPES.TIMESTAMP, readonly: true, system: true, sortable: true },
  },
  writableFields: [
    'refundCode',
    'clientId',
    'engagementId',
    'amount',
    'reason',
    'refundMethod',
    'refundDate',
    'approvedByUserId',
    'processedByUserId',
    'status',
    'journalEntryId',
  ],
  updateableFields: [
    'amount',
    'reason',
    'refundMethod',
    'refundDate',
    'approvedByUserId',
    'processedByUserId',
    'status',
    'journalEntryId',
  ],
  indexes: [
    { fields: ['refundCode'] },
    { fields: ['engagementId', 'refundDate'] },
    { fields: ['clientId', 'refundDate'] },
    { fields: ['status', 'refundDate'] },
  ],
  search: {
    mode: 'token-array',
    fields: ['refundCode', 'reason'],
  },
  rules: {
    read: 'auth',
    create: 'financeOrAdmin',
    update: 'financeOrAdmin',
    delete: 'adminOnly',
  },
});

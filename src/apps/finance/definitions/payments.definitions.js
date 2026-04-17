/**
 * @file finance/definitions/payments.definitions.js
 * @description Client money received against engagements.
 */

import { FIELD_TYPES, defineCollection } from '@xbensommo/shard-provider';

export default defineCollection({
  name: 'payments',
  shard: { type: 'monthly', field: 'paymentDate' },
  schema: {
    paymentCode: { type: FIELD_TYPES.STRING, required: true, searchable: true, sortable: true, filterable: true },
    clientId: { type: FIELD_TYPES.STRING, required: true, filterable: true },
    engagementId: { type: FIELD_TYPES.STRING, required: true, filterable: true },
    paymentType: { type: FIELD_TYPES.STRING, required: true, filterable: true, sortable: true },
    amount: { type: FIELD_TYPES.NUMBER, required: true, filterable: true, sortable: true },
    currency: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    paymentMethod: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    paymentDate: { type: FIELD_TYPES.TIMESTAMP, required: true, filterable: true, sortable: true },
    referenceNumber: { type: FIELD_TYPES.STRING, required: false, searchable: true, filterable: true },
    receivedByUserId: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    status: { type: FIELD_TYPES.STRING, required: false, filterable: true, sortable: true },
    proofFileId: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    notes: { type: FIELD_TYPES.STRING, required: false, searchable: true },
    journalEntryId: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    createdAt: { type: FIELD_TYPES.TIMESTAMP, readonly: true, system: true, sortable: true, filterable: true },
    updatedAt: { type: FIELD_TYPES.TIMESTAMP, readonly: true, system: true, sortable: true },
  },
  writableFields: [
    'paymentCode',
    'clientId',
    'engagementId',
    'paymentType',
    'amount',
    'currency',
    'paymentMethod',
    'paymentDate',
    'referenceNumber',
    'receivedByUserId',
    'status',
    'proofFileId',
    'notes',
    'journalEntryId',
  ],
  updateableFields: [
    'paymentType',
    'amount',
    'currency',
    'paymentMethod',
    'paymentDate',
    'referenceNumber',
    'receivedByUserId',
    'status',
    'proofFileId',
    'notes',
    'journalEntryId',
  ],
  indexes: [
    { fields: ['paymentCode'] },
    { fields: ['engagementId', 'paymentDate'] },
    { fields: ['clientId', 'paymentDate'] },
    { fields: ['status', 'paymentDate'] },
  ],
  search: {
    mode: 'token-array',
    fields: ['paymentCode', 'referenceNumber', 'notes'],
  },
  rules: {
    read: 'auth',
    create: 'financeOrAdmin',
    update: 'financeOrAdmin',
    delete: 'adminOnly',
  },
});

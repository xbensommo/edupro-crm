/**
 * @file collections/receipts.definitions.js
 * @description Collection contract for EduProLIC receipt records.
 */

import { defineCollection, FIELD_TYPES } from '@xbensommo/shard-provider'

export default defineCollection({
  name: 'receipts',
  shard: { type: 'none' },
  schema: {
    receiptCode: { type: FIELD_TYPES.STRING, required: true, sortable: true, filterable: true, searchable: true },
    invoiceId: { type: FIELD_TYPES.STRING, filterable: true },
    invoiceCode: { type: FIELD_TYPES.STRING, filterable: true, searchable: true },
    paymentId: { type: FIELD_TYPES.STRING, filterable: true },
    paymentCode: { type: FIELD_TYPES.STRING, filterable: true, searchable: true },
    clientId: { type: FIELD_TYPES.STRING, required: true, filterable: true },
    client: { type: FIELD_TYPES.ANY, required: true, filterable: true },
    clientLabel: { type: FIELD_TYPES.STRING, searchable: true, sortable: true },
    clientEmail: { type: FIELD_TYPES.STRING, searchable: true },
    clientPhone: { type: FIELD_TYPES.STRING, searchable: true },
    engagementId: { type: FIELD_TYPES.STRING, filterable: true },
    engagementCode: { type: FIELD_TYPES.STRING, filterable: true, searchable: true },
    receiptType: { 
      type: FIELD_TYPES.STRING, 
      required: true, 
      enum: ['payment', 'refund', 'deposit', 'credit_note'], 
      filterable: true, 
      sortable: true 
    },
    amount: { type: FIELD_TYPES.NUMBER, required: true, sortable: true, filterable: true },
    currency: { type: FIELD_TYPES.STRING, required: true, default: 'NAD', filterable: true },
    paymentMethod: { 
      type: FIELD_TYPES.STRING, 
      required: true, 
      enum: ['cash', 'bank_transfer', 'credit_card', 'debit_card', 'mobile_money', 'cheque', 'other'], 
      filterable: true 
    },
    paymentDate: { type: FIELD_TYPES.TIMESTAMP, required: true, sortable: true, filterable: true },
    referenceNumber: { type: FIELD_TYPES.STRING, searchable: true },
    status: { 
      type: FIELD_TYPES.STRING, 
      required: true, 
      enum: ['draft', 'issued', 'cancelled'], 
      filterable: true, 
      sortable: true 
    },
    description: { type: FIELD_TYPES.STRING, searchable: true },
    notes: { type: FIELD_TYPES.STRING, searchable: true },
    issuedAt: { type: FIELD_TYPES.TIMESTAMP, sortable: true, filterable: true },
    issuedByUserId: { type: FIELD_TYPES.STRING, filterable: true },
    cancelledAt: { type: FIELD_TYPES.TIMESTAMP, sortable: true },
    cancelledByUserId: { type: FIELD_TYPES.STRING, filterable: true },
    cancellationReason: { type: FIELD_TYPES.STRING, searchable: true },
    isDeleted: { type: FIELD_TYPES.BOOLEAN, default: false, filterable: true },
    createdAt: { type: FIELD_TYPES.TIMESTAMP, readonly: true, system: true, sortable: true, filterable: true },
    updatedAt: { type: FIELD_TYPES.TIMESTAMP, readonly: true, system: true, sortable: true, filterable: true },
    createdBy: { type: FIELD_TYPES.STRING, readonly: true, system: true, filterable: true },
  },
  writableFields: [
    'receiptCode', 'invoiceId', 'client', 'invoiceCode', 'paymentId', 'paymentCode', 'clientId', 'clientLabel', 
    'clientEmail', 'clientPhone', 'engagementId', 'engagementCode', 'receiptType', 'amount', 'currency', 
    'paymentMethod', 'paymentDate', 'referenceNumber', 'status', 'description', 'notes', 'issuedAt', 
    'issuedByUserId', 'cancelledAt', 'cancelledByUserId', 'cancellationReason', 'isDeleted'
  ],
  updateableFields: [
    'clientLabel', 'clientEmail', 'client', 'clientPhone', 'engagementCode', 'receiptType', 'amount', 'currency', 
    'paymentMethod', 'paymentDate', 'referenceNumber', 'status', 'description', 'notes', 'issuedAt', 
    'issuedByUserId', 'cancelledAt', 'cancelledByUserId', 'cancellationReason', 'isDeleted'
  ],
  indexes: [
    { fields: ['receiptCode', 'createdAt'] },
    { fields: ['clientId', 'paymentDate'] },
    { fields: ['invoiceId', 'paymentDate'] },
    { fields: ['status', 'paymentDate'] },
    { fields: ['paymentMethod', 'paymentDate'] },
  ],
  search: {
    mode: 'token-array',
    fields: ['receiptCode', 'clientLabel', 'clientEmail', 'clientPhone', 'invoiceCode', 'paymentCode', 'referenceNumber', 'description'],
  },
  rules: {
    read: 'auth',
    create: 'auth',
    update: 'auth',
    delete: 'admin',
  },
})
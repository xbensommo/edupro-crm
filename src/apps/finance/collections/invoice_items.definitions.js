/**
 * @file src/apps/finance/collections/invoice_items.definitions.js
 * @description Normalized invoice line items for reporting and export.
 */

import { FIELD_TYPES, defineCollection } from '@xbensommo/shard-provider'

export default defineCollection({
  name: 'invoice_items',
  shard: { type: 'none', field: 'createdAt' },
  schema: {
    invoiceId: { type: FIELD_TYPES.STRING, required: true, filterable: true },
    invoiceCode: { type: FIELD_TYPES.STRING, required: true, searchable: true, filterable: true },
    clientId: { type: FIELD_TYPES.STRING, required: true, filterable: true },
    engagementId: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    description: { type: FIELD_TYPES.STRING, required: true, searchable: true },
    quantity: { type: FIELD_TYPES.NUMBER, required: true, sortable: true },
    unitPrice: { type: FIELD_TYPES.NUMBER, required: true, sortable: true },
    discountAmount: { type: FIELD_TYPES.NUMBER, required: false, sortable: true },
    taxAmount: { type: FIELD_TYPES.NUMBER, required: false, sortable: true },
    totalAmount: { type: FIELD_TYPES.NUMBER, required: true, sortable: true },
    accountId: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    serviceCode: { type: FIELD_TYPES.STRING, required: false, searchable: true, filterable: true },
    sortOrder: { type: FIELD_TYPES.NUMBER, required: false, sortable: true },
    isDeleted: { type: FIELD_TYPES.BOOLEAN, readonly: true, system: true, filterable: true, default: false },
    deletedAt: { type: FIELD_TYPES.TIMESTAMP, readonly: true, system: true, sortable: true },
    deletedBy: { type: FIELD_TYPES.STRING, readonly: true, system: true, filterable: true },
    createdAt: { type: FIELD_TYPES.TIMESTAMP, readonly: true, system: true, sortable: true, filterable: true },
    updatedAt: { type: FIELD_TYPES.TIMESTAMP, readonly: true, system: true, sortable: true },
  },
  writableFields: [
    'invoiceId',
    'invoiceCode',
    'clientId',
    'engagementId',
    'description',
    'quantity',
    'unitPrice',
    'discountAmount',
    'taxAmount',
    'totalAmount',
    'accountId',
    'serviceCode',
    'sortOrder',
  ],
  updateableFields: [
    'description',
    'quantity',
    'unitPrice',
    'discountAmount',
    'taxAmount',
    'totalAmount',
    'accountId',
    'serviceCode',
    'sortOrder',
  ],
  indexes: [
    { fields: ['invoiceId', 'sortOrder'], order: 'ASCENDING' },
    { fields: ['invoiceCode'], order: 'ASCENDING' },
    { fields: ['clientId', 'createdAt'], order: 'DESCENDING' },
    { fields: ['engagementId', 'createdAt'], order: 'DESCENDING' },
    { fields: ['isDeleted', 'createdAt'], order: 'DESCENDING' },
  ],
  search: {
    mode: 'token-array',
    fields: ['invoiceCode', 'description', 'serviceCode'],
  },
  rules: {
    read: 'auth',
    create: 'financeOrAdmin',
    update: 'financeOrAdmin',
    delete: 'financeOrAdmin',
  },
})

/**
 * @file src/apps/finance/collections/quotations.definitions.js
 * @description Client quotations / estimates before invoice conversion.
 */

import { FIELD_TYPES, defineCollection } from '@xbensommo/shard-provider'

export default defineCollection({
  name: 'quotations',
  shard: { type: 'none', field: 'quoteDate' },

  schema: {
    quoteCode: {
      type: FIELD_TYPES.STRING,
      required: true,
      immutable: true,
      searchable: true,
      sortable: true,
      filterable: true,
    },

    quotationCode: {
      type: FIELD_TYPES.STRING,
      required: false,
      immutable: true,
      searchable: true,
      sortable: true,
      filterable: true,
    },

    status: {
      type: FIELD_TYPES.STRING,
      required: true,
      filterable: true,
      sortable: true,
      enum: ['draft', 'sent', 'accepted', 'declined', 'expired', 'cancelled', 'converted'],
    },

    clientId: {
      type: FIELD_TYPES.STRING,
      required: false,
      filterable: true,
    },

    clientNumber: {
      type: FIELD_TYPES.STRING,
      required: false,
      searchable: true,
      filterable: true,
    },

    clientLabel: {
      type: FIELD_TYPES.STRING,
      required: true,
      searchable: true,
      filterable: true,
      sortable: true,
    },

    clientEmail: {
      type: FIELD_TYPES.STRING,
      required: false,
      searchable: true,
      filterable: true,
    },

    clientPhone: {
      type: FIELD_TYPES.STRING,
      required: false,
      searchable: true,
    },

    client: {
      type: FIELD_TYPES.OBJECT,
      required: false,
    },

    engagementId: {
      type: FIELD_TYPES.STRING,
      required: false,
      filterable: true,
    },

    engagementCode: {
      type: FIELD_TYPES.STRING,
      required: false,
      searchable: true,
      filterable: true,
    },

    reference: {
      type: FIELD_TYPES.OBJECT,
      required: false,
    },

    quoteDate: {
      type: FIELD_TYPES.TIMESTAMP,
      required: true,
      filterable: true,
      sortable: true,
    },

    validUntil: {
      type: FIELD_TYPES.TIMESTAMP,
      required: false,
      filterable: true,
      sortable: true,
    },

    expiryDate: {
      type: FIELD_TYPES.TIMESTAMP,
      required: false,
      filterable: true,
      sortable: true,
    },

    currency: {
      type: FIELD_TYPES.STRING,
      required: false,
      filterable: true,
    },

    subtotalAmount: {
      type: FIELD_TYPES.NUMBER,
      required: false,
      filterable: true,
      sortable: true,
    },

    discountAmount: {
      type: FIELD_TYPES.NUMBER,
      required: false,
      filterable: true,
      sortable: true,
    },

    taxAmount: {
      type: FIELD_TYPES.NUMBER,
      required: false,
      filterable: true,
      sortable: true,
    },

    totalAmount: {
      type: FIELD_TYPES.NUMBER,
      required: true,
      filterable: true,
      sortable: true,
    },

    depositAmount: {
      type: FIELD_TYPES.NUMBER,
      required: false,
      filterable: true,
      sortable: true,
    },

    depositRequired: {
      type: FIELD_TYPES.NUMBER,
      required: false,
      filterable: true,
      sortable: true,
    },

    lineItems: {
      type: FIELD_TYPES.ARRAY,
      required: false,
    },

    notes: {
      type: FIELD_TYPES.STRING,
      required: false,
      searchable: true,
    },

    terms: {
      type: FIELD_TYPES.ARRAY,
      required: false,
    },

    validityNote: {
      type: FIELD_TYPES.STRING,
      required: false,
      searchable: true,
    },

    footerNote: {
      type: FIELD_TYPES.STRING,
      required: false,
      searchable: true,
    },

    showAcceptance: {
      type: FIELD_TYPES.BOOLEAN,
      required: false,
      filterable: true,
    },

    sourceModule: {
      type: FIELD_TYPES.STRING,
      required: false,
      filterable: true,
    },

    sourceId: {
      type: FIELD_TYPES.STRING,
      required: false,
      filterable: true,
    },

    convertedInvoiceId: {
      type: FIELD_TYPES.STRING,
      required: false,
      filterable: true,
    },

    convertedAt: {
      type: FIELD_TYPES.TIMESTAMP,
      required: false,
      sortable: true,
      filterable: true,
    },

    sentAt: {
      type: FIELD_TYPES.TIMESTAMP,
      required: false,
      sortable: true,
      filterable: true,
    },

    sentByUserId: {
      type: FIELD_TYPES.STRING,
      required: false,
      filterable: true,
    },

    acceptedAt: {
      type: FIELD_TYPES.TIMESTAMP,
      required: false,
      sortable: true,
      filterable: true,
    },

    acceptedByName: {
      type: FIELD_TYPES.STRING,
      required: false,
      searchable: true,
    },

    declinedAt: {
      type: FIELD_TYPES.TIMESTAMP,
      required: false,
      sortable: true,
      filterable: true,
    },

    declinedReason: {
      type: FIELD_TYPES.STRING,
      required: false,
      searchable: true,
    },

    cancelledAt: {
      type: FIELD_TYPES.TIMESTAMP,
      required: false,
      sortable: true,
      filterable: true,
    },

    cancelledByUserId: {
      type: FIELD_TYPES.STRING,
      required: false,
      filterable: true,
    },

    cancellationReason: {
      type: FIELD_TYPES.STRING,
      required: false,
      searchable: true,
    },

    createdByUserId: {
      type: FIELD_TYPES.STRING,
      required: false,
      filterable: true,
    },

    isDeleted: {
      type: FIELD_TYPES.BOOLEAN,
      readonly: true,
      system: true,
      filterable: true,
      default: false,
    },

    deletedAt: {
      type: FIELD_TYPES.TIMESTAMP,
      readonly: true,
      system: true,
      sortable: true,
    },

    deletedBy: {
      type: FIELD_TYPES.STRING,
      readonly: true,
      system: true,
      filterable: true,
    },

    createdAt: {
      type: FIELD_TYPES.TIMESTAMP,
      readonly: true,
      system: true,
      sortable: true,
      filterable: true,
    },

    updatedAt: {
      type: FIELD_TYPES.TIMESTAMP,
      readonly: true,
      system: true,
      sortable: true,
    },
  },

  writableFields: [
    'quoteCode',
    'quotationCode',
    'status',
    'clientId',
    'clientNumber',
    'clientLabel',
    'clientEmail',
    'clientPhone',
    'client',
    'engagementId',
    'engagementCode',
    'reference',
    'quoteDate',
    'validUntil',
    'expiryDate',
    'currency',
    'subtotalAmount',
    'discountAmount',
    'taxAmount',
    'totalAmount',
    'depositAmount',
    'depositRequired',
    'lineItems',
    'notes',
    'terms',
    'validityNote',
    'footerNote',
    'showAcceptance',
    'sourceModule',
    'sourceId',
    'convertedInvoiceId',
    'convertedAt',
    'sentAt',
    'sentByUserId',
    'acceptedAt',
    'acceptedByName',
    'declinedAt',
    'declinedReason',
    'cancelledAt',
    'cancelledByUserId',
    'cancellationReason',
    'createdByUserId',
  ],

  updateableFields: [
    'quotationCode',
    'status',
    'clientNumber',
    'clientLabel',
    'clientEmail',
    'clientPhone',
    'client',
    'engagementId',
    'engagementCode',
    'reference',
    'quoteDate',
    'validUntil',
    'expiryDate',
    'currency',
    'subtotalAmount',
    'discountAmount',
    'taxAmount',
    'totalAmount',
    'depositAmount',
    'depositRequired',
    'lineItems',
    'notes',
    'terms',
    'validityNote',
    'footerNote',
    'showAcceptance',
    'sourceModule',
    'sourceId',
    'convertedInvoiceId',
    'convertedAt',
    'sentAt',
    'sentByUserId',
    'acceptedAt',
    'acceptedByName',
    'declinedAt',
    'declinedReason',
    'cancelledAt',
    'cancelledByUserId',
    'cancellationReason',
    'updatedAt'
  ],

  primaryKey: {
    field: 'quoteCode',
    required: true,
  },

  indexes: [
    { fields: ['quoteDate'], order: 'DESCENDING' },
    { fields: ['validUntil'], order: 'ASCENDING' },
    { fields: ['quoteCode'], order: 'ASCENDING' },
    { fields: ['quotationCode'], order: 'ASCENDING' },

    { fields: ['isDeleted', 'quoteDate'], order: 'DESCENDING' },
    { fields: ['isDeleted', 'createdAt'], order: 'DESCENDING' },

    { fields: ['clientId', 'quoteDate'], order: 'DESCENDING' },
    { fields: ['clientLabel', 'quoteDate'], order: 'DESCENDING' },
    { fields: ['engagementId', 'quoteDate'], order: 'DESCENDING' },
    { fields: ['engagementCode', 'quoteDate'], order: 'DESCENDING' },

    { fields: ['status', 'quoteDate'], order: 'DESCENDING' },
    { fields: ['status', 'validUntil'], order: 'ASCENDING' },
    { fields: ['status', 'totalAmount'], order: 'DESCENDING' },

    { fields: ['createdByUserId', 'quoteDate'], order: 'DESCENDING' },
    { fields: ['sourceModule', 'quoteDate'], order: 'DESCENDING' },
  ],

  search: {
    mode: 'token-array',
    fields: [
      'quoteCode',
      'quotationCode',
      'clientLabel',
      'clientNumber',
      'clientEmail',
      'clientPhone',
      'engagementCode',
      'notes',
      'validityNote',
      'footerNote',
    ],
  },

  rules: {
    read: 'auth',
    create: 'financeOrAdmin',
    update: 'financeOrAdmin',
    delete: 'financeOrAdmin',
  },
})
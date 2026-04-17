/**
 * @file finance/definitions/consultant_payouts.definitions.js
 * @description Consultant earnings and payout records.
 */

import { FIELD_TYPES, defineCollection } from '@xbensommo/shard-provider';

export default defineCollection({
  name: 'consultant_payouts',
  shard: { type: 'monthly', field: 'payoutDate' },
  schema: {
    payoutCode: { type: FIELD_TYPES.STRING, required: true, searchable: true, sortable: true, filterable: true },
    consultantId: { type: FIELD_TYPES.STRING, required: true, filterable: true },
    clientId: { type: FIELD_TYPES.STRING, required: true, filterable: true },
    engagementId: { type: FIELD_TYPES.STRING, required: true, filterable: true },
    shareRuleId: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    grossServiceAmount: { type: FIELD_TYPES.NUMBER, required: true, filterable: true, sortable: true },
    consultantShareAmount: { type: FIELD_TYPES.NUMBER, required: true, filterable: true, sortable: true },
    companyShareAmount: { type: FIELD_TYPES.NUMBER, required: false, filterable: true, sortable: true },
    paidAmount: { type: FIELD_TYPES.NUMBER, required: false, filterable: true, sortable: true },
    balanceAmount: { type: FIELD_TYPES.NUMBER, required: false, filterable: true, sortable: true },
    payoutDate: { type: FIELD_TYPES.TIMESTAMP, required: true, filterable: true, sortable: true },
    status: { type: FIELD_TYPES.STRING, required: false, filterable: true, sortable: true },
    paymentMethod: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    referenceNumber: { type: FIELD_TYPES.STRING, required: false, searchable: true, filterable: true },
    notes: { type: FIELD_TYPES.STRING, required: false, searchable: true },
    journalEntryId: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    createdAt: { type: FIELD_TYPES.TIMESTAMP, readonly: true, system: true, sortable: true, filterable: true },
    updatedAt: { type: FIELD_TYPES.TIMESTAMP, readonly: true, system: true, sortable: true },
  },
  writableFields: [
    'payoutCode',
    'consultantId',
    'clientId',
    'engagementId',
    'shareRuleId',
    'grossServiceAmount',
    'consultantShareAmount',
    'companyShareAmount',
    'paidAmount',
    'balanceAmount',
    'payoutDate',
    'status',
    'paymentMethod',
    'referenceNumber',
    'notes',
    'journalEntryId',
  ],
  updateableFields: [
    'shareRuleId',
    'grossServiceAmount',
    'consultantShareAmount',
    'companyShareAmount',
    'paidAmount',
    'balanceAmount',
    'payoutDate',
    'status',
    'paymentMethod',
    'referenceNumber',
    'notes',
    'journalEntryId',
  ],
  indexes: [
    { fields: ['payoutCode'] },
    { fields: ['consultantId', 'payoutDate'] },
    { fields: ['engagementId', 'payoutDate'] },
    { fields: ['status', 'payoutDate'] },
  ],
  search: {
    mode: 'token-array',
    fields: ['payoutCode', 'referenceNumber', 'notes'],
  },
  rules: {
    read: 'auth',
    create: 'financeOrAdmin',
    update: 'financeOrAdmin',
    delete: 'adminOnly',
  },
});

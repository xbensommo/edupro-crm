/**
 * @file finance/definitions/accounts.definitions.js
 * @description Chart of accounts for accounting and journal posting.
 */

import { FIELD_TYPES, defineCollection } from '@xbensommo/shard-provider';

export default defineCollection({
  name: 'accounts',
  shard: { type: 'none' },
  schema: {
    accountCode: { type: FIELD_TYPES.STRING, required: true, searchable: true, sortable: true, filterable: true },
    name: { type: FIELD_TYPES.STRING, required: true, searchable: true, sortable: true },
    type: { type: FIELD_TYPES.STRING, required: true, filterable: true, sortable: true },
    subType: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    parentAccountId: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    isActive: { type: FIELD_TYPES.BOOLEAN, required: false, filterable: true },
    createdAt: { type: FIELD_TYPES.TIMESTAMP, readonly: true, system: true, sortable: true, filterable: true },
    updatedAt: { type: FIELD_TYPES.TIMESTAMP, readonly: true, system: true, sortable: true },
  },
  writableFields: ['accountCode', 'name', 'type', 'subType', 'parentAccountId', 'isActive'],
  updateableFields: ['name', 'type', 'subType', 'parentAccountId', 'isActive'],
  indexes: [
    { fields: ['accountCode'] },
    { fields: ['type', 'isActive'] },
    { fields: ['parentAccountId', 'isActive'] },
  ],
  search: {
    mode: 'token-array',
    fields: ['accountCode', 'name', 'subType'],
  },
  rules: {
    read: 'auth',
    create: 'financeOrAdmin',
    update: 'financeOrAdmin',
    delete: 'adminOnly',
  },
});

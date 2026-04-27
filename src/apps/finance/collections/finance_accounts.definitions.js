/**
 * @file src/apps/finance/collections/finance_accounts.definitions.js
 * @description Chart of accounts for EduProLIC finance posting and statements.
 */

import { FIELD_TYPES, defineCollection } from '@xbensommo/shard-provider'

export default defineCollection({
  name: 'finance_accounts',
  shard: { type: 'none' },
  schema: {
    accountCode: { type: FIELD_TYPES.STRING, required: true, immutable: true, searchable: true, sortable: true, filterable: true },
    name: { type: FIELD_TYPES.STRING, required: true, searchable: true, sortable: true },
    type: { type: FIELD_TYPES.STRING, required: true, filterable: true, sortable: true, enum: ['asset', 'liability', 'equity', 'revenue', 'expense'] },
    subType: { type: FIELD_TYPES.STRING, required: false, filterable: true, searchable: true },
    systemKey: { type: FIELD_TYPES.STRING, required: false, immutable: true, searchable: true, filterable: true },
    parentAccountId: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    normalSide: { type: FIELD_TYPES.STRING, required: false, filterable: true, enum: ['debit', 'credit'] },
    isSystem: { type: FIELD_TYPES.BOOLEAN, required: false, filterable: true },
    isActive: { type: FIELD_TYPES.BOOLEAN, required: false, filterable: true },
    createdAt: { type: FIELD_TYPES.TIMESTAMP, readonly: true, system: true, sortable: true, filterable: true },
    updatedAt: { type: FIELD_TYPES.TIMESTAMP, readonly: true, system: true, sortable: true },
  },
  writableFields: ['accountCode', 'name', 'type', 'subType', 'systemKey', 'parentAccountId', 'normalSide', 'isSystem', 'isActive'],
  updateableFields: ['name', 'type', 'subType', 'parentAccountId', 'normalSide', 'isSystem', 'isActive'],
  primaryKey: { field: 'accountCode', required: true },
  indexes: [
    { fields: ['accountCode'], order: 'ASCENDING' },
    { fields: ['type', 'accountCode'], order: 'ASCENDING' },
    { fields: ['systemKey'], order: 'ASCENDING' },
    { fields: ['isActive', 'accountCode'], order: 'ASCENDING' },
    { fields: ['createdAt'], order: 'ASCENDING' },
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
})

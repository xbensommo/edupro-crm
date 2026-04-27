/**
 * @file src/apps/finance/collections/share_rules.definitions.js
 * @description Revenue split rules between EduProLIC and consultants.
 */

import { FIELD_TYPES, defineCollection } from '@xbensommo/shard-provider'

export default defineCollection({
  name: 'share_rules',
  shard: { type: 'none' },
  schema: {
    name: { type: FIELD_TYPES.STRING, required: true, searchable: true, sortable: true },
    serviceType: { type: FIELD_TYPES.STRING, required: false, filterable: true, searchable: true },
    consultantPercent: { type: FIELD_TYPES.NUMBER, required: true, filterable: true, sortable: true },
    companyPercent: { type: FIELD_TYPES.NUMBER, required: true, filterable: true, sortable: true },
    isDefault: { type: FIELD_TYPES.BOOLEAN, required: false, filterable: true },
    activeFrom: { type: FIELD_TYPES.TIMESTAMP, required: false, filterable: true, sortable: true },
    activeTo: { type: FIELD_TYPES.TIMESTAMP, required: false, filterable: true, sortable: true },
    status: { type: FIELD_TYPES.STRING, required: false, filterable: true, sortable: true },
    createdAt: { type: FIELD_TYPES.TIMESTAMP, readonly: true, system: true, sortable: true, filterable: true },
    updatedAt: { type: FIELD_TYPES.TIMESTAMP, readonly: true, system: true, sortable: true },
  },
  writableFields: ['name', 'serviceType', 'consultantPercent', 'companyPercent', 'isDefault', 'activeFrom', 'activeTo', 'status'],
  updateableFields: ['name', 'serviceType', 'consultantPercent', 'companyPercent', 'isDefault', 'activeFrom', 'activeTo', 'status'],
  indexes: [
    { fields: ['serviceType', 'status'], order: 'ASCENDING' },
    { fields: ['isDefault', 'status'], order: 'ASCENDING' },
    { fields: ['createdAt'], order: 'ASCENDING' },
  ],
  search: {
    mode: 'token-array',
    fields: ['name', 'serviceType'],
  },
  rules: {
    read: 'auth',
    create: 'financeOrAdmin',
    update: 'financeOrAdmin',
    delete: 'adminOnly',
  },
})

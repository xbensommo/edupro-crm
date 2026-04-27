/**
 * @file src/apps/finance/collections/finance_audit_logs.definitions.js
 * @description Immutable finance audit trail for dangerous decisions and money movement.
 */

import { FIELD_TYPES, defineCollection } from '@xbensommo/shard-provider'

export default defineCollection({
  name: 'finance_audit_logs',
  shard: { type: 'none', field: 'occurredAt' },
  schema: {
    auditCode: { type: FIELD_TYPES.STRING, required: true, immutable: true, searchable: true, filterable: true, sortable: true },
    action: { type: FIELD_TYPES.STRING, required: true, searchable: true, filterable: true, sortable: true },
    entityType: { type: FIELD_TYPES.STRING, required: true, searchable: true, filterable: true, sortable: true },
    entityId: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    entityLabel: { type: FIELD_TYPES.STRING, required: false, searchable: true },
    outcome: { type: FIELD_TYPES.STRING, required: true, filterable: true, sortable: true, enum: ['success', 'cancelled', 'failed'] },
    actorId: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    actorName: { type: FIELD_TYPES.STRING, required: false, searchable: true },
    reason: { type: FIELD_TYPES.STRING, required: false, searchable: true },
    occurredAt: { type: FIELD_TYPES.TIMESTAMP, required: true, sortable: true, filterable: true },
    before: { type: FIELD_TYPES.OBJECT, required: false },
    after: { type: FIELD_TYPES.OBJECT, required: false },
    meta: { type: FIELD_TYPES.OBJECT, required: false },
    requestId: { type: FIELD_TYPES.STRING, required: false, searchable: true, filterable: true },
    sourceModule: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    createdAt: { type: FIELD_TYPES.TIMESTAMP, readonly: true, system: true, sortable: true, filterable: true },
    updatedAt: { type: FIELD_TYPES.TIMESTAMP, readonly: true, system: true, sortable: true },
  },
  writableFields: [
    'auditCode',
    'action',
    'entityType',
    'entityId',
    'entityLabel',
    'outcome',
    'actorId',
    'actorName',
    'reason',
    'occurredAt',
    'before',
    'after',
    'meta',
    'requestId',
    'sourceModule',
  ],
  updateableFields: [],
  primaryKey: { field: 'auditCode', required: true },
  indexes: [
    { fields: ['occurredAt'], order: 'DESCENDING' },
    { fields: ['action', 'occurredAt'], order: 'DESCENDING' },
    { fields: ['entityType', 'occurredAt'], order: 'DESCENDING' },
    { fields: ['entityType', 'entityId', 'occurredAt'], order: 'DESCENDING' },
    { fields: ['actorId', 'occurredAt'], order: 'DESCENDING' },
    { fields: ['outcome', 'occurredAt'], order: 'DESCENDING' },
    { fields: ['createdAt'], order: 'DESCENDING' },
  ],
  search: {
    mode: 'token-array',
    fields: ['auditCode', 'action', 'entityType', 'entityLabel', 'actorName', 'reason', 'requestId'],
  },
  rules: {
    read: 'financeOrAdmin',
    create: 'financeOrAdmin',
    update: 'adminOnly',
    delete: 'adminOnly',
  },
})

/**
 * @file crm/definitions/crm_notes.definitions.js
 * @description Internal and operational notes attached to clients and engagements.
 */

import { FIELD_TYPES, defineCollection } from '@xbensommo/shard-provider';

export default defineCollection({
  name: 'crm_notes',
  shard: { type: 'monthly', field: 'createdAt' },
  schema: {
    clientId: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    engagementId: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    type: { type: FIELD_TYPES.STRING, required: false, filterable: true, sortable: true },
    visibility: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    content: { type: FIELD_TYPES.STRING, required: true, searchable: true },
    createdBy: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    createdAt: { type: FIELD_TYPES.TIMESTAMP, readonly: true, system: true, sortable: true, filterable: true },
    updatedAt: { type: FIELD_TYPES.TIMESTAMP, readonly: true, system: true, sortable: true },
  },
  writableFields: ['clientId', 'engagementId', 'type', 'visibility', 'content', 'createdBy'],
  updateableFields: ['type', 'visibility', 'content'],
  indexes: [
    { fields: ['clientId', 'createdAt'] },
    { fields: ['engagementId', 'createdAt'] },
    { fields: ['type', 'createdAt'] },
  ],
  search: {
    mode: 'token-array',
    fields: ['content'],
  },
  rules: {
    read: 'auth',
    create: 'auth',
    update: 'auth',
    delete: 'adminOrManager',
  },
});

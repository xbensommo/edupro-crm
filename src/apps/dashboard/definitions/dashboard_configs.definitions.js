/**
 * @file dashboard/definitions/dashboard_configs.definitions.js
 * @description Saved dashboard widget arrangements by role or user scope.
 */

import { FIELD_TYPES, defineCollection } from '@xbensommo/shard-provider';

export default defineCollection({
  name: 'dashboard_configs',
  shard: { type: 'none' },
  schema: {
    name: { type: FIELD_TYPES.STRING, required: true, searchable: true, sortable: true },
    roleScope: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    widgets: { type: FIELD_TYPES.ARRAY, required: false },
    filters: { type: FIELD_TYPES.ARRAY, required: false },
    isDefault: { type: FIELD_TYPES.BOOLEAN, required: false, filterable: true },
    createdBy: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    createdAt: { type: FIELD_TYPES.TIMESTAMP, readonly: true, system: true, sortable: true, filterable: true },
    updatedAt: { type: FIELD_TYPES.TIMESTAMP, readonly: true, system: true, sortable: true },
  },
  writableFields: ['name', 'roleScope', 'widgets', 'filters', 'isDefault', 'createdBy'],
  updateableFields: ['name', 'roleScope', 'widgets', 'filters', 'isDefault'],
  indexes: [
    { fields: ['roleScope', 'isDefault'] },
    { fields: ['createdBy', 'createdAt'] },
  ],
  search: {
    mode: 'token-array',
    fields: ['name', 'roleScope'],
  },
  rules: {
    read: 'auth',
    create: 'auth',
    update: 'auth',
    delete: 'adminOrManager',
  },
});

/**
 * @file crm/definitions/crm_files.definitions.js
 * @description Files linked to client records and engagement delivery.
 */

import { FIELD_TYPES, defineCollection } from '@xbensommo/shard-provider';

export default defineCollection({
  name: 'crm_files',
  shard: { type: 'none', field: 'createdAt' },
  schema: {
    clientId: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    engagementId: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    name: { type: FIELD_TYPES.STRING, required: true, searchable: true, sortable: true },
    originalName: { type: FIELD_TYPES.STRING, required: true, searchable: true, sortable: true },
    storagePath: { type: FIELD_TYPES.STRING, required: true, filterable: true },
    url: { type: FIELD_TYPES.STRING, required: false },
    fileType: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    category: { type: FIELD_TYPES.STRING, required: false, filterable: true, sortable: true },
    uploadedBy: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    uploadedByName: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    visibility: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    createdAt: { type: FIELD_TYPES.TIMESTAMP, readonly: true, system: true, sortable: true, filterable: true },
    updatedAt: { type: FIELD_TYPES.TIMESTAMP, readonly: true, system: true, sortable: true },
  },
  writableFields: ['clientId', 'engagementId', 
    'name', 
    'originalName', 
    'storagePath', 'url', 'fileType', 'category',
     'uploadedBy',
     'uploadedByName',
     'visibility',
  ],
  updateableFields: ['name', 'storagePath', 'url', 'fileType', 'category'],
  indexes: [
    { fields: ['clientId', 'createdAt'] },
    { fields: ['clientId', 'engagementId', 'createdAt'] },
    { fields: ['engagementId', 'createdAt'] },
    { fields: ['category', 'createdAt'] },
  ],
  search: {
    mode: 'token-array',
    fields: ['name', 'storagePath'],
  },
  rules: {
    read: 'auth',
    create: 'auth',
    update: 'auth',
    delete: 'adminOrManager',
  },
});

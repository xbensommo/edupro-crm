/** @file src/features/notifications/collections/notifications.definitions.js */

import { FIELD_TYPES, defineCollection } from '@xbensommo/shard-provider'

const notifications = defineCollection({
  name: 'notifications',
  shard: { type: 'none', field: 'createdAt' },
  schema: {
    user_id: { type: FIELD_TYPES.STRING, required: true, immutable: true, filterable: true },
    title: { type: FIELD_TYPES.STRING, required: true, searchable: true },
    message: { type: FIELD_TYPES.STRING, required: true, searchable: true },
    event: { type: FIELD_TYPES.STRING, required: true, searchable: true, filterable: true, sortable: true },
    type: { type: FIELD_TYPES.STRING, required: true, filterable: true, sortable: true },
    domain: { type: FIELD_TYPES.STRING, required: false, filterable: true, sortable: true },
    sourceModule: { type: FIELD_TYPES.STRING, required: false, filterable: true, sortable: true },
    channel: { type: FIELD_TYPES.STRING, required: true, filterable: true, sortable: true },
    channels: { type: FIELD_TYPES.ARRAY, required: false },
    status: { type: FIELD_TYPES.STRING, required: true, filterable: true, sortable: true },
    priority: { type: FIELD_TYPES.STRING, required: false, filterable: true, sortable: true },
    actionUrl: { type: FIELD_TYPES.STRING, required: false },
    actionLabel: { type: FIELD_TYPES.STRING, required: false },
    isActionRequired: { type: FIELD_TYPES.BOOLEAN, required: false, filterable: true, sortable: true },
    entityType: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    entityId: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    entityLabel: { type: FIELD_TYPES.STRING, required: false, searchable: true },
    roleScope: { type: FIELD_TYPES.ARRAY, required: false, filterable: true },
    actorId: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    actorName: { type: FIELD_TYPES.STRING, required: false, searchable: true },
    dedupeKey: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    readAt: { type: FIELD_TYPES.TIMESTAMP, required: false, sortable: true },
    archivedAt: { type: FIELD_TYPES.TIMESTAMP, required: false, sortable: true },
    sentAt: { type: FIELD_TYPES.TIMESTAMP, required: false, sortable: true },
    meta: { type: FIELD_TYPES.OBJECT, required: false },
    createdAt: { type: FIELD_TYPES.TIMESTAMP, required: true, sortable: true },
    updatedAt: { type: FIELD_TYPES.TIMESTAMP, required: false, sortable: true },
  },
  writableFields: [
    'user_id', 'title', 'message', 'event', 'type', 'domain', 'sourceModule',
    'channel', 'channels', 'status', 'priority', 'actionUrl', 'actionLabel',
    'isActionRequired', 'entityType', 'entityId', 'entityLabel', 'roleScope',
    'actorId', 'actorName', 'dedupeKey', 'readAt', 'archivedAt', 'sentAt',
    'meta', 'createdAt', 'updatedAt',
  ],
  updateableFields: [
    'status', 'readAt', 'archivedAt', 'sentAt', 'updatedAt', 'meta',
  ],
  indexes: [
    { fields: ['user_id', 'createdAt'] },
    { fields: ['user_id', 'status', 'createdAt'] },
    { fields: ['user_id', 'readAt', 'createdAt'] },
    { fields: ['event', 'createdAt'] },
    { fields: ['domain', 'createdAt'] },
    { fields: ['entityType', 'entityId', 'createdAt'] },
    { fields: ['dedupeKey'] },
  ],
  search: {
    mode: 'token-array',
    fields: ['title', 'message', 'event', 'entityLabel', 'actorName'],
  },
})

export default notifications

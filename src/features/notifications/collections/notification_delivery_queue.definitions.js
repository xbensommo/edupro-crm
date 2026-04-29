/** @file src/features/notifications/collections/notification_delivery_queue.definitions.js */

import { FIELD_TYPES, defineCollection } from '@xbensommo/shard-provider'

const notificationDeliveryQueue = defineCollection({
  name: 'notification_delivery_queue',
  shard: { type: 'none', field: 'createdAt' },
  schema: {
    dedupeKey: { type: FIELD_TYPES.STRING, required: true, filterable: true, immutable: true },
    notificationId: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    user_id: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    recipientEmail: { type: FIELD_TYPES.STRING, required: false, filterable: true, searchable: true },
    recipientName: { type: FIELD_TYPES.STRING, required: false, searchable: true },
    event: { type: FIELD_TYPES.STRING, required: true, filterable: true, sortable: true },
    channel: { type: FIELD_TYPES.STRING, required: true, filterable: true, sortable: true },
    status: { type: FIELD_TYPES.STRING, required: true, filterable: true, sortable: true },
    provider: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    priority: { type: FIELD_TYPES.STRING, required: false, filterable: true, sortable: true },
    subject: { type: FIELD_TYPES.STRING, required: false, searchable: true },
    title: { type: FIELD_TYPES.STRING, required: false, searchable: true },
    message: { type: FIELD_TYPES.STRING, required: false, searchable: true },
    templateKey: { type: FIELD_TYPES.STRING, required: true, filterable: true },
    variables: { type: FIELD_TYPES.OBJECT, required: false },
    entityType: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    entityId: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    entityLabel: { type: FIELD_TYPES.STRING, required: false, searchable: true },
    actionUrl: { type: FIELD_TYPES.STRING, required: false },
    actionLabel: { type: FIELD_TYPES.STRING, required: false },
    attempts: { type: FIELD_TYPES.NUMBER, required: false, filterable: true, sortable: true },
    maxAttempts: { type: FIELD_TYPES.NUMBER, required: false },
    lockedAt: { type: FIELD_TYPES.TIMESTAMP, required: false, sortable: true },
    lockedBy: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    lastError: { type: FIELD_TYPES.STRING, required: false, searchable: true },
    processAfter: { type: FIELD_TYPES.TIMESTAMP, required: false, sortable: true },
    sentAt: { type: FIELD_TYPES.TIMESTAMP, required: false, sortable: true },
    createdAt: { type: FIELD_TYPES.TIMESTAMP, required: true, sortable: true },
    updatedAt: { type: FIELD_TYPES.TIMESTAMP, required: false, sortable: true },
  },
  writableFields: [
    'dedupeKey', 'notificationId', 'user_id', 'recipientEmail', 'recipientName',
    'event', 'channel', 'status', 'provider', 'priority', 'subject', 'title',
    'message', 'templateKey', 'variables', 'entityType', 'entityId', 'entityLabel',
    'actionUrl', 'actionLabel', 'attempts', 'maxAttempts', 'lockedAt', 'lockedBy',
    'lastError', 'processAfter', 'sentAt', 'createdAt', 'updatedAt',
  ],
  updateableFields: [
    'status', 'provider', 'attempts', 'lockedAt', 'lockedBy', 'lastError',
    'processAfter', 'sentAt', 'updatedAt',
  ],
  indexes: [
    { fields: ['dedupeKey'] },
    { fields: ['channel', 'status', 'processAfter'] },
    { fields: ['status', 'createdAt'] },
    { fields: ['user_id', 'createdAt'] },
    { fields: ['event', 'createdAt'] },
    { fields: ['entityType', 'entityId', 'createdAt'] },
  ],
  search: {
    mode: 'token-array',
    fields: ['recipientEmail', 'recipientName', 'title', 'message', 'event', 'entityLabel'],
  },
})

export default notificationDeliveryQueue

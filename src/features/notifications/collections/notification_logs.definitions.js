/** @file src/features/notifications/collections/notification_logs.definitions.js */

import { FIELD_TYPES, defineCollection } from '@xbensommo/shard-provider'

const notificationLogsCollection = defineCollection({
  name: 'notification_logs',
  shard: { type: 'none', field: 'createdAt' },
  schema: {
    notificationId: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    queueId: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    dedupeKey: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    user_id: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    recipientEmail: { type: FIELD_TYPES.STRING, required: false, filterable: true, searchable: true },
    event: { type: FIELD_TYPES.STRING, required: false, filterable: true, sortable: true },
    channel: { type: FIELD_TYPES.STRING, required: true, filterable: true, sortable: true },
    provider: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    status: { type: FIELD_TYPES.STRING, required: true, filterable: true, sortable: true },
    domain: { type: FIELD_TYPES.STRING, required: false, filterable: true, sortable: true },
    error: { type: FIELD_TYPES.STRING, required: false, searchable: true },
    payload: { type: FIELD_TYPES.OBJECT, required: false },
    response: { type: FIELD_TYPES.OBJECT, required: false },
    sentAt: { type: FIELD_TYPES.TIMESTAMP, required: false, sortable: true },
    createdAt: { type: FIELD_TYPES.TIMESTAMP, required: true, sortable: true },
  },
  indexes: [
    { fields: ['notificationId', 'createdAt'] },
    { fields: ['queueId', 'createdAt'] },
    { fields: ['dedupeKey'] },
    { fields: ['user_id', 'createdAt'] },
    { fields: ['channel', 'status', 'createdAt'] },
    { fields: ['event', 'createdAt'] },
  ],
  search: {
    mode: 'token-array',
    fields: ['recipientEmail', 'event', 'channel', 'provider', 'status', 'error'],
  },
})

export default notificationLogsCollection

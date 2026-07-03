/** @file src/features/notifications/collections/notification_push_tokens.definitions.js */

import { FIELD_TYPES, defineCollection } from '@xbensommo/shard-provider'

const notificationPushTokens = defineCollection({
  name: 'notification_push_tokens',
  shard: { type: 'none', field: 'createdAt' },
  schema: {
    user_id: { type: FIELD_TYPES.STRING, required: true, filterable: true, immutable: true },
    token: { type: FIELD_TYPES.STRING, required: true, searchable: false },
    tokenHash: { type: FIELD_TYPES.STRING, required: true, filterable: true, immutable: true },
    provider: { type: FIELD_TYPES.STRING, required: true, filterable: true },
    platform: { type: FIELD_TYPES.STRING, required: true, filterable: true },
    permission: { type: FIELD_TYPES.STRING, required: true, filterable: true },
    status: { type: FIELD_TYPES.STRING, required: true, filterable: true, sortable: true },
    browserName: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    userAgent: { type: FIELD_TYPES.STRING, required: false },
    deviceLabel: { type: FIELD_TYPES.STRING, required: false, searchable: true },
    vapidKeyHash: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    lastSeenAt: { type: FIELD_TYPES.TIMESTAMP, required: false, sortable: true },
    createdAt: { type: FIELD_TYPES.TIMESTAMP, required: true, sortable: true },
    updatedAt: { type: FIELD_TYPES.TIMESTAMP, required: false, sortable: true },
  },
  writableFields: [
    'user_id', 'token', 'tokenHash', 'provider', 'platform', 'permission', 'status',
    'browserName', 'userAgent', 'deviceLabel', 'vapidKeyHash', 'lastSeenAt',
    'createdAt', 'updatedAt',
  ],
  updateableFields: [
    'permission', 'status', 'browserName', 'userAgent', 'deviceLabel', 'vapidKeyHash',
    'lastSeenAt', 'updatedAt',
  ],
  indexes: [
    { fields: ['user_id', 'status', 'lastSeenAt'] },
    { fields: ['tokenHash'] },
    { fields: ['provider', 'status', 'updatedAt'] },
  ],
  search: {
    mode: 'token-array',
    fields: ['deviceLabel', 'browserName', 'platform'],
  },
})

export default notificationPushTokens

/** @file src/features/notifications/definitions/notification_logs.definitions.js */

import { FIELD_TYPES, defineCollection } from '@xbensommo/shard-provider';

const notificationLogsCollection = defineCollection({
  name: 'notification_logs',
  shard: { type: 'none', field: 'createdAt' },
  schema: {
    notificationId: { type: FIELD_TYPES.STRING, required: true, filterable: true },
    user_id: { type: FIELD_TYPES.STRING, required: true, filterable: true },
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
}); 

export default notificationLogsCollection;

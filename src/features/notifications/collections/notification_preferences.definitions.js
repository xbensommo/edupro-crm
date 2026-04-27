/** @file src/features/notifications/definitions/notification_preferences.definitions.js */

import { FIELD_TYPES, defineCollection } from '@xbensommo/shard-provider';

export const notificationPreferencesCollection = defineCollection({
  name: 'notification_preferences',
  shard: { type: 'none' },
  schema: {
    user_id: { type: FIELD_TYPES.STRING, required: true, filterable: true },
    enabled: { type: FIELD_TYPES.BOOLEAN, required: true, filterable: true, sortable: true },
    channels: { type: FIELD_TYPES.ARRAY, required: false },
    quietHours: { type: FIELD_TYPES.OBJECT, required: false },
    categorySettings: { type: FIELD_TYPES.OBJECT, required: false },
    role: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    updatedAt: { type: FIELD_TYPES.TIMESTAMP, required: false, sortable: true },
    createdAt: { type: FIELD_TYPES.TIMESTAMP, required: false, sortable: true },
  },
});


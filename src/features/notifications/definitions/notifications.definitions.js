/** @file src/features/notifications/collections.definitions.js */

import { FIELD_TYPES, defineCollection } from '@xbensommo/shard-provider';

/**
 * User notifications.
 */
 const notifications = defineCollection({
  name: 'notifications',
  shard: { type: 'monthly', field: 'createdAt' },
  schema: {
    userId: { type: FIELD_TYPES.STRING, required: true, filterable: true },
    title: { type: FIELD_TYPES.STRING, required: true, searchable: true },
    message: { type: FIELD_TYPES.STRING, required: true, searchable: true },
    event: { type: FIELD_TYPES.STRING, required: true, searchable: true, filterable: true, sortable: true },
    type: { type: FIELD_TYPES.STRING, required: true, filterable: true, sortable: true },
    channel: { type: FIELD_TYPES.STRING, required: true, filterable: true, sortable: true },
    status: { type: FIELD_TYPES.STRING, required: true, filterable: true, sortable: true },
    priority: { type: FIELD_TYPES.STRING, required: false, filterable: true, sortable: true },
    actionUrl: { type: FIELD_TYPES.STRING, required: false },
    entityType: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    entityId: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    actorId: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    actorName: { type: FIELD_TYPES.STRING, required: false, searchable: true },
    readAt: { type: FIELD_TYPES.TIMESTAMP, required: false, sortable: true },
    archivedAt: { type: FIELD_TYPES.TIMESTAMP, required: false, sortable: true },
    meta: { type: FIELD_TYPES.OBJECT, required: false },
    createdAt: { type: FIELD_TYPES.TIMESTAMP, required: true, sortable: true },
    updatedAt: { type: FIELD_TYPES.TIMESTAMP, required: false, sortable: true },
  },
});

export default notifications
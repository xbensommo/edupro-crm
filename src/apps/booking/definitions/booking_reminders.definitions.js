/**
 * @file booking/definitions/booking_reminders.definitions.js
 * @description Outbound reminders linked to bookings.
 */

import { FIELD_TYPES, defineCollection } from '@xbensommo/shard-provider';

export default defineCollection({
  name: 'booking_reminders',
  shard: { type: 'monthly', field: 'scheduledAt' },
  schema: {
    bookingId: { type: FIELD_TYPES.STRING, required: true, filterable: true },
    channel: { type: FIELD_TYPES.STRING, required: true, filterable: true },
    templateKey: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    scheduledAt: { type: FIELD_TYPES.TIMESTAMP, required: true, filterable: true, sortable: true },
    sentAt: { type: FIELD_TYPES.TIMESTAMP, required: false, filterable: true, sortable: true },
    status: { type: FIELD_TYPES.STRING, required: false, filterable: true, sortable: true },
    createdAt: { type: FIELD_TYPES.TIMESTAMP, readonly: true, system: true, sortable: true, filterable: true },
    updatedAt: { type: FIELD_TYPES.TIMESTAMP, readonly: true, system: true, sortable: true },
  },
  writableFields: ['bookingId', 'channel', 'templateKey', 'scheduledAt', 'sentAt', 'status'],
  updateableFields: ['channel', 'templateKey', 'scheduledAt', 'sentAt', 'status'],
  indexes: [
    { fields: ['bookingId', 'scheduledAt'] },
    { fields: ['status', 'scheduledAt'] },
  ],
  rules: {
    read: 'auth',
    create: 'auth',
    update: 'auth',
    delete: 'adminOrManager',
  },
});

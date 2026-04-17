/**
 * @file booking/definitions/availability_profiles.definitions.js
 * @description Working-hour profiles used to generate appointment slots.
 */

import { FIELD_TYPES, defineCollection } from '@xbensommo/shard-provider';

export default defineCollection({
  name: 'availability_profiles',
  shard: { type: 'none' },
  schema: {
    userId: { type: FIELD_TYPES.STRING, required: true, filterable: true },
    daysOfWeek: { type: FIELD_TYPES.ARRAY, required: false },
    startTime: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    endTime: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    slotIntervalMinutes: { type: FIELD_TYPES.NUMBER, required: false, filterable: true, sortable: true },
    breakRules: { type: FIELD_TYPES.ARRAY, required: false },
    timezone: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    isActive: { type: FIELD_TYPES.BOOLEAN, required: false, filterable: true },
    createdAt: { type: FIELD_TYPES.TIMESTAMP, readonly: true, system: true, sortable: true, filterable: true },
    updatedAt: { type: FIELD_TYPES.TIMESTAMP, readonly: true, system: true, sortable: true },
  },
  writableFields: ['userId', 'daysOfWeek', 'startTime', 'endTime', 'slotIntervalMinutes', 'breakRules', 'timezone', 'isActive'],
  updateableFields: ['daysOfWeek', 'startTime', 'endTime', 'slotIntervalMinutes', 'breakRules', 'timezone', 'isActive'],
  indexes: [
    { fields: ['userId'] },
    { fields: ['isActive', 'userId'] },
  ],
  rules: {
    read: 'auth',
    create: 'adminOrManager',
    update: 'adminOrManager',
    delete: 'adminOnly',
  },
});

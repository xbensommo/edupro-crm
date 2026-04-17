/**
 * @file booking/definitions/booking_services.definitions.js
 * @description Services available for appointments and consultations.
 */

import { FIELD_TYPES, defineCollection } from '@xbensommo/shard-provider';

export default defineCollection({
  name: 'booking_services',
  shard: { type: 'none' },
  schema: {
    serviceCode: { type: FIELD_TYPES.STRING, required: true, searchable: true, sortable: true, filterable: true },
    name: { type: FIELD_TYPES.STRING, required: true, searchable: true, sortable: true },
    description: { type: FIELD_TYPES.STRING, required: false, searchable: true },
    durationMinutes: { type: FIELD_TYPES.NUMBER, required: true, filterable: true, sortable: true },
    price: { type: FIELD_TYPES.NUMBER, required: false, filterable: true, sortable: true },
    currency: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    isActive: { type: FIELD_TYPES.BOOLEAN, required: false, filterable: true },
    requiresApproval: { type: FIELD_TYPES.BOOLEAN, required: false, filterable: true },
    allowsGuestBooking: { type: FIELD_TYPES.BOOLEAN, required: false, filterable: true },
    defaultConsultantId: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    bookingBufferMinutes: { type: FIELD_TYPES.NUMBER, required: false, filterable: true, sortable: true },
    colorTag: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    createdAt: { type: FIELD_TYPES.TIMESTAMP, readonly: true, system: true, sortable: true, filterable: true },
    updatedAt: { type: FIELD_TYPES.TIMESTAMP, readonly: true, system: true, sortable: true },
  },
  writableFields: [
    'serviceCode',
    'name',
    'description',
    'durationMinutes',
    'price',
    'currency',
    'isActive',
    'requiresApproval',
    'allowsGuestBooking',
    'defaultConsultantId',
    'bookingBufferMinutes',
    'colorTag',
  ],
  updateableFields: [
    'name',
    'description',
    'durationMinutes',
    'price',
    'currency',
    'isActive',
    'requiresApproval',
    'allowsGuestBooking',
    'defaultConsultantId',
    'bookingBufferMinutes',
    'colorTag',
  ],
  indexes: [
    { fields: ['serviceCode'] },
    { fields: ['isActive', 'createdAt'] },
    { fields: ['defaultConsultantId', 'isActive'] },
  ],
  search: {
    mode: 'token-array',
    fields: ['serviceCode', 'name', 'description'],
  },
  rules: {
    read: 'auth',
    create: 'adminOrManager',
    update: 'adminOrManager',
    delete: 'adminOnly',
  },
});

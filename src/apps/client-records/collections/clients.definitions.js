/**
 * @file collections/clients.definitions.js
 * @description Collection contract for EduProLIC client records.
 */

import { defineCollection, FIELD_TYPES } from '@xbensommo/shard-provider'

export default defineCollection({
  name: 'clients',
  shard: { type: 'none' },
  schema: {
    clientNumber: { type: FIELD_TYPES.STRING, required: true, sortable: true, filterable: true, searchable: true },
    type: { type: FIELD_TYPES.STRING, required: true, enum: ['individual', 'business', 'sponsored'], filterable: true, sortable: true },
    institutionName: { type: FIELD_TYPES.STRING, searchable: true, sortable: true },
    fieldOfStudy: { type: FIELD_TYPES.STRING, searchable: true, sortable: true },
    studyLevel: { type: FIELD_TYPES.STRING, searchable: true, filterable: true, sortable: true },
    city: { type: FIELD_TYPES.STRING, searchable: true, filterable: true },
    firstName: { type: FIELD_TYPES.STRING, searchable: true, sortable: true },
    lastName: { type: FIELD_TYPES.STRING, searchable: true, sortable: true },
    email: { type: FIELD_TYPES.STRING, searchable: true, filterable: true },
    phone: { type: FIELD_TYPES.STRING, filterable: true },
    status: { type: FIELD_TYPES.STRING, required: true, enum: ['lead', 'prospect', 'active', 'inactive', 'blocked'], filterable: true, sortable: true },
    lifecycleStage: { type: FIELD_TYPES.STRING, required: true, enum: ['lead', 'intake', 'active_client', 'awaiting_work', 'work_in_progress', 'completed'], filterable: true, sortable: true },
    leadSource: { type: FIELD_TYPES.STRING, searchable: true, filterable: true },
    leadScore: { type: FIELD_TYPES.NUMBER, sortable: true, filterable: true },
    assignedTo: { type: FIELD_TYPES.STRING, filterable: true },
    primaryContactId: { type: FIELD_TYPES.STRING, filterable: true },
    tags: { type: FIELD_TYPES.ARRAY, required: false },
    communicationPreferences: { type: FIELD_TYPES.MAP, required: false },
    customFields: { type: FIELD_TYPES.MAP, required: false },
    metadata: { type: FIELD_TYPES.MAP, required: false },
    financeSummary: { type: FIELD_TYPES.MAP, required: false },
    workSummary: { type: FIELD_TYPES.MAP, required: false },
    lastActivityAt: { type: FIELD_TYPES.TIMESTAMP, sortable: true, filterable: true },
    createdAt: { type: FIELD_TYPES.TIMESTAMP, readonly: true, system: true, sortable: true, filterable: true },
    updatedAt: { type: FIELD_TYPES.TIMESTAMP, readonly: true, system: true, sortable: true, filterable: true },
    createdBy: { type: FIELD_TYPES.STRING, readonly: true, system: true, filterable: true },
  },
  writableFields: [
    'clientNumber', 'type', 'institutionName', 'fieldOfStudy', 'studyLevel', 'city', 'firstName', 'lastName',
    'email', 'phone', 'status', 'lifecycleStage', 'leadSource', 'leadScore', 'assignedTo', 'primaryContactId',
    'tags', 'communicationPreferences', 'customFields', 'metadata', 'financeSummary', 'workSummary', 'lastActivityAt',
  ],
  updateableFields: [
    'type', 'institutionName', 'fieldOfStudy', 'studyLevel', 'city', 'firstName', 'lastName', 'email', 'phone',
    'status', 'lifecycleStage', 'leadSource', 'leadScore', 'assignedTo', 'primaryContactId', 'tags',
    'communicationPreferences', 'customFields', 'metadata', 'financeSummary', 'workSummary', 'lastActivityAt',
  ],
  indexes: [
    { fields: ['clientNumber', 'createdAt'] },
    { fields: ['status', 'updatedAt'] },
    { fields: ['lifecycleStage', 'updatedAt'] },
    { fields: ['assignedTo', 'updatedAt'] },
  ],
  search: {
    mode: 'token-array',
    fields: ['clientNumber', 'institutionName', 'fieldOfStudy', 'studyLevel', 'city', 'firstName', 'lastName', 'email', 'leadSource'],
  },
  rules: {
    read: 'auth',
    create: 'auth',
    update: 'auth',
    delete: 'admin',
  },
})

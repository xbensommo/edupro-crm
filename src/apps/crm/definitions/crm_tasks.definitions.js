/**
 * @file crm/definitions/crm_tasks.definitions.js
 * @description Follow-ups, reminders, and work tasks linked to clients and engagements.
 */

import { FIELD_TYPES, defineCollection } from '@xbensommo/shard-provider';

export default defineCollection({
  name: 'crm_tasks',
  shard: { type: 'monthly', field: 'createdAt' },
  schema: {
    clientId: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    engagementId: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    title: { type: FIELD_TYPES.STRING, required: true, searchable: true },
    description: { type: FIELD_TYPES.STRING, required: false, searchable: true },
    type: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    status: { type: FIELD_TYPES.STRING, required: false, filterable: true, sortable: true },
    priority: { type: FIELD_TYPES.STRING, required: false, filterable: true, sortable: true },
    dueAt: { type: FIELD_TYPES.TIMESTAMP, required: false, sortable: true, filterable: true },
    reminderAt: { type: FIELD_TYPES.TIMESTAMP, required: false, sortable: true, filterable: true },
    completedAt: { type: FIELD_TYPES.TIMESTAMP, required: false, sortable: true, filterable: true },
    assignedTo: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    team: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    isFollowUp: { type: FIELD_TYPES.BOOLEAN, required: false, filterable: true },
    automationRuleId: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    createdBy: { type: FIELD_TYPES.STRING, required: false, filterable: true },
    createdAt: { type: FIELD_TYPES.TIMESTAMP, readonly: true, system: true, sortable: true, filterable: true },
    updatedAt: { type: FIELD_TYPES.TIMESTAMP, readonly: true, system: true, sortable: true },
  },
  writableFields: [
    'clientId',
    'engagementId',
    'title',
    'description',
    'type',
    'status',
    'priority',
    'dueAt',
    'reminderAt',
    'completedAt',
    'assignedTo',
    'team',
    'isFollowUp',
    'automationRuleId',
    'createdBy',
  ],
  updateableFields: [
    'clientId',
    'engagementId',
    'title',
    'description',
    'type',
    'status',
    'priority',
    'dueAt',
    'reminderAt',
    'completedAt',
    'assignedTo',
    'team',
    'isFollowUp',
    'automationRuleId',
  ],
  indexes: [
    { fields: ['assignedTo', 'status'] },
    { fields: ['dueAt', 'status'] },
    { fields: ['clientId', 'createdAt'] },
    { fields: ['engagementId', 'createdAt'] },
  ],
  search: {
    mode: 'token-array',
    fields: ['title', 'description'],
  },
  rules: {
    read: 'auth',
    create: 'auth',
    update: 'auth',
    delete: 'adminOrManager',
  },
});

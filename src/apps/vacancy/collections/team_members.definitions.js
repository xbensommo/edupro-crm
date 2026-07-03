/**
 * @file collections/team_member.definitions.js
 * @description Collection contract for Eduprolic display the team on the public websit.
 * 
 */

import { defineCollection, FIELD_TYPES } from '@xbensommo/shard-provider'

export default defineCollection({
  name: 'team_members',
  shard: { type: 'none' },
  schema: {
    certifications: { type: FIELD_TYPES.ARRAY, required: false, sortable: true, filterable: true, searchable: true },
    
    image: { type: FIELD_TYPES.STRING, required: false, searchable: true, sortable: true },
    
    initials: { type: FIELD_TYPES.STRING, searchable: true, filterable: true },
    
    names: { type: FIELD_TYPES.STRING, required: true, searchable: true, filterable: true, sortable: true },
    
    qualifications: { type: FIELD_TYPES.ARRAY, searchable: true, filterable: true },

    linkedin: { type: FIELD_TYPES.STRING, required: true, filterable: true, sortable: true },

    role: { type: FIELD_TYPES.STRING, required: true, filterable: true, sortable: true },

    createdAt: { type: FIELD_TYPES.TIMESTAMP, readonly: true, system: true, sortable: true, filterable: true },
    updatedAt: { type: FIELD_TYPES.TIMESTAMP, readonly: true, system: true, sortable: true, filterable: true },
    createdBy: { type: FIELD_TYPES.STRING, readonly: true, system: true, filterable: true },
  },
  writableFields: [
    "certifications",
    "image",
    "initials",
    "linkedin",
    "name",
    "qualification",
    "role", "status"
  ],
  updateableFields: [
    "certifications",
    "image",
    "initials",
    "linkedin",
    "name",
    "qualification",
    "role", "status"
  ],
  indexes: [
    { fields: ['role', 'createdAt'] },
    { fields: ['status', 'createdAt'] },
    { fields: ['qualification', 'createdAt'] },
    { fields: ['name', 'createdAt'] },
    
  ],
  search: {
    mode: 'token-array',
    fields: ['name', 'role', 'qualification'],
  },
  rules: {
    read: 'public',
    create: 'admin',
    update: 'admin',
    delete: 'admin',
  },
})

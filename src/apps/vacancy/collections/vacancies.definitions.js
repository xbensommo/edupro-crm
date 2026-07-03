/**
 * @file collections/vacancies.definitions.js
 * @description Collection contract for Totisoft CC recruitment vacancies.
 *              Mirrors the clients/users collection conventions (shard-provider).
 */

import { defineCollection, FIELD_TYPES } from '@xbensommo/shard-provider'

export default defineCollection({
  name: 'vacancies',
  shard: { type: 'none' },
  schema: {
    vacancyNumber: { type: FIELD_TYPES.STRING, required: true, sortable: true, filterable: true, searchable: true },
    title: { type: FIELD_TYPES.STRING, required: true, searchable: true, sortable: true },
    slug: { type: FIELD_TYPES.STRING, searchable: true, filterable: true },
    department: { type: FIELD_TYPES.STRING, required: true, searchable: true, filterable: true, sortable: true },
    location: { type: FIELD_TYPES.STRING, searchable: true, filterable: true },
    workMode: { type: FIELD_TYPES.STRING, required: true, enum: ['onsite', 'remote', 'hybrid'], filterable: true, sortable: true },
    employmentType: { type: FIELD_TYPES.STRING, required: true, enum: ['full_time', 'part_time', 'contract', 'internship', 'temporary'], filterable: true, sortable: true },
    experienceLevel: { type: FIELD_TYPES.STRING, required: true, enum: ['entry', 'mid', 'senior', 'lead', 'executive'], filterable: true, sortable: true },
    numberOfPositions: { type: FIELD_TYPES.NUMBER, sortable: true },
    status: { type: FIELD_TYPES.STRING, required: true, enum: ['draft', 'open', 'on_hold', 'closed', 'filled'], filterable: true, sortable: true },
    isPublished: { type: FIELD_TYPES.BOOLEAN, filterable: true },
    isFeatured: { type: FIELD_TYPES.BOOLEAN, filterable: true },
    summary: { type: FIELD_TYPES.STRING, searchable: true },
    description: { type: FIELD_TYPES.STRING, searchable: true },
    responsibilities: { type: FIELD_TYPES.ARRAY, required: false },
    requirements: { type: FIELD_TYPES.ARRAY, required: false },
    niceToHave: { type: FIELD_TYPES.ARRAY, required: false },
    benefits: { type: FIELD_TYPES.ARRAY, required: false },
    tags: { type: FIELD_TYPES.ARRAY, required: false },
    salaryMin: { type: FIELD_TYPES.NUMBER, sortable: true, filterable: true },
    salaryMax: { type: FIELD_TYPES.NUMBER, sortable: true, filterable: true },
    salaryCurrency: { type: FIELD_TYPES.STRING },
    salaryPeriod: { type: FIELD_TYPES.STRING, enum: ['monthly', 'annual', 'hourly'] },
    salaryNegotiable: { type: FIELD_TYPES.BOOLEAN },
    hiringManagerId: { type: FIELD_TYPES.STRING, filterable: true },
    hiringManagerName: { type: FIELD_TYPES.STRING, searchable: true },
    contactEmail: { type: FIELD_TYPES.STRING },
    applicationUrl: { type: FIELD_TYPES.STRING },
    applicationInstructions: { type: FIELD_TYPES.STRING },
    postedAt: { type: FIELD_TYPES.TIMESTAMP, sortable: true, filterable: true },
    closingDate: { type: FIELD_TYPES.TIMESTAMP, sortable: true, filterable: true },
    metadata: { type: FIELD_TYPES.MAP, required: false },
    createdAt: { type: FIELD_TYPES.TIMESTAMP, readonly: true, system: true, sortable: true, filterable: true },
    updatedAt: { type: FIELD_TYPES.TIMESTAMP, readonly: true, system: true, sortable: true, filterable: true },
    createdBy: { type: FIELD_TYPES.STRING, readonly: true, system: true, filterable: true },
  },
  writableFields: [
    'vacancyNumber', 'title', 'slug', 'department', 'location', 'workMode', 'employmentType', 'experienceLevel',
    'numberOfPositions', 'status', 'isPublished', 'isFeatured', 'summary', 'description', 'responsibilities',
    'requirements', 'niceToHave', 'benefits', 'tags', 'salaryMin', 'salaryMax', 'salaryCurrency', 'salaryPeriod',
    'salaryNegotiable', 'hiringManagerId', 'hiringManagerName', 'contactEmail', 'applicationUrl',
    'applicationInstructions', 'postedAt', 'closingDate', 'metadata',
  ],
  updateableFields: [
    'title', 'slug', 'department', 'location', 'workMode', 'employmentType', 'experienceLevel', 'numberOfPositions',
    'status', 'isPublished', 'isFeatured', 'summary', 'description', 'responsibilities', 'requirements', 'niceToHave',
    'benefits', 'tags', 'salaryMin', 'salaryMax', 'salaryCurrency', 'salaryPeriod', 'salaryNegotiable',
    'hiringManagerId', 'hiringManagerName', 'contactEmail', 'applicationUrl', 'applicationInstructions', 'postedAt',
    'closingDate', 'metadata',
  ],
  indexes: [
    { fields: ['vacancyNumber', 'createdAt'] },
    { fields: ['status', 'postedAt'] },
    { fields: ['department', 'status'] },
    { fields: ['employmentType', 'status'] },
    { fields: ['isPublished', 'postedAt'] },
    { fields: ['isFeatured', 'postedAt'] },
    { fields: ['closingDate'] },
  ],
  search: {
    mode: 'token-array',
    fields: ['vacancyNumber', 'title', 'department', 'location', 'summary', 'hiringManagerName'],
  },
  rules: {
    // Published vacancies are intended to be readable by an unauthenticated careers page;
    // unpublished/draft records should be filtered out at the query layer for public callers.
    read: 'public',
    create: 'admin',
    update: 'admin',
    delete: 'admin',
  },
})

/**
 * @file dashboard/definitions/kpi_snapshots.definitions.js
 * @description Period snapshots for fast dashboard charts and historical reporting.
 */

import { FIELD_TYPES, defineCollection } from '@xbensommo/shard-provider';

export default defineCollection({
  name: 'kpi_snapshots',
  shard: { type: 'none', field: 'snapshotDate' },
  schema: {
    snapshotDate: { type: FIELD_TYPES.TIMESTAMP, required: true, filterable: true, sortable: true },
    periodType: { type: FIELD_TYPES.STRING, required: true, filterable: true, sortable: true },
    revenueAmount: { type: FIELD_TYPES.NUMBER, required: false, filterable: true, sortable: true },
    expenseAmount: { type: FIELD_TYPES.NUMBER, required: false, filterable: true, sortable: true },
    profitAmount: { type: FIELD_TYPES.NUMBER, required: false, filterable: true, sortable: true },
    activeClientsCount: { type: FIELD_TYPES.NUMBER, required: false, filterable: true, sortable: true },
    activeEngagementsCount: { type: FIELD_TYPES.NUMBER, required: false, filterable: true, sortable: true },
    bookingsCount: { type: FIELD_TYPES.NUMBER, required: false, filterable: true, sortable: true },
    overdueEngagementsCount: { type: FIELD_TYPES.NUMBER, required: false, filterable: true, sortable: true },
    pendingPayoutsAmount: { type: FIELD_TYPES.NUMBER, required: false, filterable: true, sortable: true },
    createdAt: { type: FIELD_TYPES.TIMESTAMP, readonly: true, system: true, sortable: true, filterable: true },
    updatedAt: { type: FIELD_TYPES.TIMESTAMP, readonly: true, system: true, sortable: true },
  },
  writableFields: [
    'snapshotDate',
    'periodType',
    'revenueAmount',
    'expenseAmount',
    'profitAmount',
    'activeClientsCount',
    'activeEngagementsCount',
    'bookingsCount',
    'overdueEngagementsCount',
    'pendingPayoutsAmount',
  ],
  updateableFields: [
    'periodType',
    'revenueAmount',
    'expenseAmount',
    'profitAmount',
    'activeClientsCount',
    'activeEngagementsCount',
    'bookingsCount',
    'overdueEngagementsCount',
    'pendingPayoutsAmount',
  ],
  indexes: [
    { fields: ['periodType', 'snapshotDate'] },
  ],
  rules: {
    read: 'auth',
    create: 'adminOrManager',
    update: 'adminOrManager',
    delete: 'adminOnly',
  },
});

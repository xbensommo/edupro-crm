/**
 * @file apps/dashboard/app.manifest.js
 * @description EduProLIC dashboard manifest aligned with the latest Totistack assembly flow.
 */

export default {
  id: 'dashboard',
  name: 'Dashboard',
  version: '3.1.0',
  description: 'EduProLIC operational dashboard with role-scoped widgets for admin, receptionist, consultant, consultant-editor, and sysadmin.',
  provider: 'firestore',
  usesFirestore: true,
  dependencies: {
    features: ['auth', 'rbac', 'notifications'],
    apps: ['crm', 'finance', 'client-records'],
  },
  navigation: {
    icon: 'LayoutDashboard',
    priority: 1,
    roles: ['admin', 'receptionist', 'consultant', 'consultant_editor', 'sysadmin'],
  },
  collections: ['engagements', 'crm_files', 'clients', 'notifications', 'users', 'finance_transactions', 'consultant_payouts'],
  widgets: [
    { id: 'metrics', component: 'MetricsWidget', grid: { x: 0, y: 0, w: 12, h: 4 } },
    { id: 'recent-activity', component: 'RecentActivityWidget', grid: { x: 0, y: 4, w: 6, h: 8 } },
    { id: 'charts', component: 'ChartsWidget', grid: { x: 6, y: 4, w: 6, h: 8 } },
    { id: 'notifications', component: 'NotificationsWidget', grid: { x: 0, y: 12, w: 4, h: 6 } },
    { id: 'quick-actions', component: 'QuickActionsWidget', grid: { x: 4, y: 12, w: 4, h: 6 } },
    { id: 'system-status', component: 'SystemStatusWidget', grid: { x: 8, y: 12, w: 4, h: 6 } },
  ],
}

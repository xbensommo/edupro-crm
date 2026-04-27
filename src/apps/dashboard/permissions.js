/**
 * @file permissions.js
 * @description Declarative permission registry for the EduProLIC dashboard app.
 */

export default {
  module: 'dashboard',
  permissions: [
    { key: 'dashboard.overview.read', resource: 'overview', action: 'read', description: 'View the role-scoped dashboard overview.' },
    { key: 'dashboard.analytics.read', resource: 'analytics', action: 'read', description: 'View dashboard analytics.' },
    { key: 'dashboard.reports.read', resource: 'reports', action: 'read', description: 'View dashboard reports.' },
    { key: 'dashboard.widgets.configure', resource: 'widgets', action: 'configure', description: 'Configure personal dashboard widgets.' },
    { key: 'dashboard.system.read', resource: 'system', action: 'read', description: 'View system-health and infrastructure status.' },
  ],
  roleTemplates: {
    admin: [
      'dashboard.overview.read',
      'dashboard.analytics.read',
      'dashboard.reports.read',
      'dashboard.widgets.configure',
    ],
    receptionist: [
      'dashboard.overview.read',
      'dashboard.analytics.read',
      'dashboard.reports.read',
      'dashboard.widgets.configure',
    ],
    consultant: [
      'dashboard.overview.read',
      'dashboard.analytics.read',
    ],
    consultant_editor: [
      'dashboard.overview.read',
      'dashboard.analytics.read',
      'dashboard.reports.read',
    ],
    sysadmin: [
      'dashboard.overview.read',
      'dashboard.analytics.read',
      'dashboard.reports.read',
      'dashboard.widgets.configure',
      'dashboard.system.read',
    ],
  },
}

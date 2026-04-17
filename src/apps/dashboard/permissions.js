/**
 * @file permissions.js
 * @description Declarative permission registry for the dashboard app.
 */

export default {
  module: 'dashboard',
  permissions: [
    { key: 'dashboard.widgets.read', resource: 'widgets', action: 'read', description: 'View dashboard widgets.' },
    { key: 'dashboard.widgets.configure', resource: 'widgets', action: 'configure', description: 'Configure dashboard widgets.' },
    { key: 'dashboard.widgets.manage', resource: 'widgets', action: 'manage', description: 'Full control over dashboard widgets.' },

    { key: 'dashboard.analytics.read', resource: 'analytics', action: 'read', description: 'View analytics.' },
    { key: 'dashboard.analytics.export', resource: 'analytics', action: 'export', description: 'Export analytics.' },
    { key: 'dashboard.analytics.manage', resource: 'analytics', action: 'manage', description: 'Full control over analytics.' },

    { key: 'dashboard.views.read', resource: 'views', action: 'read', description: 'View saved dashboard views.' },
    { key: 'dashboard.views.create', resource: 'views', action: 'create', description: 'Create saved dashboard views.' },
    { key: 'dashboard.views.update', resource: 'views', action: 'update', description: 'Update saved dashboard views.' },
    { key: 'dashboard.views.delete', resource: 'views', action: 'delete', description: 'Delete saved dashboard views.' },
    { key: 'dashboard.views.manage', resource: 'views', action: 'manage', description: 'Full control over dashboard views.' },
  ],
  roleTemplates: {
    admin: ['dashboard.widgets.manage', 'dashboard.analytics.manage', 'dashboard.views.manage'],
    receptionist: ['dashboard.widgets.read', 'dashboard.analytics.read', 'dashboard.views.read'],
    consultant: ['dashboard.widgets.read', 'dashboard.analytics.read', 'dashboard.views.read'],
    finance_officer: ['dashboard.widgets.read', 'dashboard.analytics.read', 'dashboard.analytics.export', 'dashboard.views.read'],
    viewer: ['dashboard.widgets.read', 'dashboard.analytics.read', 'dashboard.views.read'],
  },
}
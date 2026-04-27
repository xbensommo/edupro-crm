/** @file src/features/notifications/routes.js */

const routes = [
  {
    path: '/notifications',
    name: 'NotificationsCenter',
    component: () => import('./pages/NotificationCenterPage.vue'),
    meta: {
      title: 'Notifications',
      description: 'Unified EduProLIC notification center for auth, finance, CRM, and client records.',
      requiresAuth: true,
      hideInNav: true,
      layout: 'app',
      featureId: 'notifications',
      navLabel: 'Notifications',
      icon: 'fa-regular fa-bell',
      order: 58, roles: ['sysadmin'],
      permission: 'notifications.notifications.read',
    },
  },
  {
    path: '/notifications/preferences',
    name: 'NotificationsPreferences',
    component: () => import('./pages/NotificationPreferencesPage.vue'),
    meta: {
      title: 'Notification Preferences',
      requiresAuth: true,
      layout: 'app',
      featureId: 'notifications',
      permission: 'notifications.preferences.read',
      //roles: ['admin', 'receptionist', 'consultant', 'consultant_editor'],
      roles: ['sysadmin'],
    },
  },
  {
    path: '/notifications/admin/templates',
    name: 'NotificationsTemplates',
    component: () => import('./pages/NotificationTemplatesPage.vue'),
    meta: {
      title: 'Notification Templates',
      requiresAuth: true,
      layout: 'app',
      featureId: 'notifications',
      permission: 'notifications.templates.manage',
      roles: ['sysadmin'],
    },
  },
  {
    path: '/notifications/admin/logs',
    name: 'NotificationsDeliveryLogs',
    component: () => import('./pages/NotificationDeliveryLogsPage.vue'),
    meta: {
      title: 'Notification Delivery Logs',
      requiresAuth: true,
      layout: 'app',
      featureId: 'notifications',
      permission: 'notifications.logs.read',
      roles: ['sysadmin'],
    },
  },
];

export default routes;

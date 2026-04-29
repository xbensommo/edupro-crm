/** @file src/features/notifications/routes.js */

const notificationUserRoles = ['admin', 'receptionist', 'consultant', 'editor', 'consultant_editor', 'consultant-editor', 'sysadmin', 'sys_admin']
const notificationAdminRoles = ['admin', 'sysadmin', 'sys_admin']

const routes = [
  {
    path: '/notifications',
    name: 'NotificationsCenter',
    component: () => import('./pages/NotificationCenterPage.vue'),
    meta: {
      title: 'Notifications',
      description: 'Unified EduProLIC notification center for auth, finance, CRM, and client records.',
      requiresAuth: true,
      layout: 'app',
      featureId: 'notifications',
      navLabel: 'Notifications',
      icon: 'fa-regular fa-bell',
      order: 58,
      roles: notificationUserRoles,
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
      hideInNav: true,
      featureId: 'notifications',
      roles: notificationUserRoles,
      permission: 'notifications.preferences.read',
    },
  },
  {
    path: '/notifications/admin/templates',
    name: 'NotificationsTemplates',
    component: () => import('./pages/NotificationTemplatesPage.vue'),
    meta: {
      title: 'Notification Templates',
      requiresAuth: true,
      hideInNav: true,
      layout: 'app',
      featureId: 'notifications',
      roles: notificationAdminRoles,
      permission: 'notifications.templates.manage',
    },
  },
  {
    path: '/notifications/admin/logs',
    name: 'NotificationsDeliveryLogs',
    component: () => import('./pages/NotificationDeliveryLogsPage.vue'),
    meta: {
      title: 'Notification Delivery Logs',
      requiresAuth: true,
      hideInNav: true,
      layout: 'app',
      featureId: 'notifications',
      roles: notificationAdminRoles,
      permission: 'notifications.logs.read',
    },
  },
  {
    path: '/notifications/:id',
    name: 'NotificationDetails',
    component: () => import('./pages/NotificationDetailsPage.vue'),
    meta: {
      title: 'Notification Details',
      requiresAuth: true,
      hideInNav: true,
      layout: 'app',
      featureId: 'notifications',
      roles: notificationUserRoles,
      permission: 'notifications.notifications.read',
    },
  },
]

export default routes

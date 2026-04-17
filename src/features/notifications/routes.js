/** @file src/features/notifications/routes.js */

//import { NOTIFICATIONS_PERMISSIONS } from './permissions.js';

/**
 * Create Totistack route contributions for notifications.
 *
 * @param {{ routeBase?: string }} [context={}]
 * @returns {import('vue-router').RouteRecordRaw[]}
 */



const routes =  [
    {
      path: '/notifications',
      name: 'NotificationsCenter',
      component: () => import('./pages/NotificationCenterPage.vue'),
      meta: {
        title: 'Notifications',
        description: 'Unified notification center for all Totistack modules.',
        requiresAuth: true,
        layout: 'app',
        featureId: 'notifications',
        navLabel: 'Notifications',
        icon: 'fa-regular fa-bell',
        order: 58,
        //permission: NOTIFICATIONS_PERMISSIONS.VIEW,
      },
    },
    {
      path: `/notifications/preferences`,
      name: 'NotificationsPreferences',
      component: () => import('./pages/NotificationPreferencesPage.vue'),
      meta: {
        title: 'Notification Preferences',
        requiresAuth: true,
        layout: 'app',
        featureId: 'notifications',
        //permission: NOTIFICATIONS_PERMISSIONS.PREFERENCES_MANAGE,
      },
    },
    {
      path: `/notifications/admin/templates`,
      name: 'NotificationsTemplates',
      component: () => import('./pages/NotificationTemplatesPage.vue'),
      meta: {
        title: 'Notification Templates',
        requiresAuth: true,
        layout: 'app',
        featureId: 'notifications',
        //permission: NOTIFICATIONS_PERMISSIONS.TEMPLATES_MANAGE,
      },
    },
    {
      path: `/notifications/admin/logs`,
      name: 'NotificationsDeliveryLogs',
      component: () => import('./pages/NotificationDeliveryLogsPage.vue'),
      meta: {
        title: 'Notification Delivery Logs',
        requiresAuth: true,
        layout: 'app',
        featureId: 'notifications',
       // permission: NOTIFICATIONS_PERMISSIONS.LOGS_VIEW,
      },
    },
  ];

export default routes;

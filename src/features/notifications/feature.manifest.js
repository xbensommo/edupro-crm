/** @file src/features/notifications/feature.manifest.js */

import notificationsRoutes from './routes.js';

export const NOTIFICATIONS_FEATURE_ID = 'notifications';

export const notificationsFeatureManifest = {
  id: NOTIFICATIONS_FEATURE_ID,
  kind: 'feature',
  version: '1.1.0',
  name: 'Notifications',
  description: 'EduProLIC notification feature for auth, finance, CRM, client-records, and work review workflows.',
  category: 'foundation',
  icon: 'fa-regular fa-bell',
  order: 58,
  routeBase: '/notifications',
  entry: {
    routeName: 'NotificationsCenter',
    view: 'NotificationCenterPage',
  },
  navigation: [
    {
      label: 'Notifications',
      to: '/notifications',
      icon: 'fa-regular fa-bell',
      order: 58,
      permission: 'notifications.notifications.read',
    },
  ],
  shell: {
    topbarActions: [
      {
        id: 'notifications-bell',
        component: 'NotificationBell',
        order: 20,
      },
    ],
    drawers: [
      {
        id: 'notifications-drawer',
        component: 'NotificationDrawer',
        side: 'right',
      },
    ],
  },
  routes: notificationsRoutes,
  collections: [
    'notification_logs',
    'notification_templates',
    'notification_preferences',
    'notifications',
  ],
  capabilities: {
    inApp: true,
    email: true,
    whatsapp: true,
    preferences: true,
    templates: true,
    logs: true,
    retries: true,
    deepLinks: true,
    domains: ['auth', 'finance', 'crm', 'client-records'],
  },
  dependencies: {
    features: ['auth', 'rbac'],
  },
};

export default notificationsFeatureManifest;

/** @file src/features/notifications/feature.manifest.js */

import notificationsRoutes from './routes.js';
// import { NOTIFICATIONS_PERMISSIONS } from './permissions.js';

export const NOTIFICATIONS_FEATURE_ID = 'notifications';

/**
 * Totistack cross-cutting feature contribution.
 */
export const notificationsFeatureManifest = {
  id: NOTIFICATIONS_FEATURE_ID,
  kind: 'feature',
  version: '1.0.0',
  name: 'Notifications',
  description: 'Cross-cutting notifications feature for in-app, email, and WhatsApp delivery across Totistack domains.',
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
     // permission: NOTIFICATIONS_PERMISSIONS.VIEW,
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
 // permissions: Object.values(NOTIFICATIONS_PERMISSIONS),
  routes: notificationsRoutes,
  collections: [
    'notification_logs', 'notification_templates', 'notification_preferences', 'notifications'
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
  },
  dependencies: {
    features: ['auth', 'rbac']
  },
};

export default notificationsFeatureManifest;

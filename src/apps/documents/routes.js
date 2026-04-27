/** @file src/apps/documents/routes.js */

/**
 * Create route contributions for the Totistack documents app.
 *
 * @param {{ routeBase?: string }} [context={}]
 * @returns {import('vue-router').RouteRecordRaw[]}
 */
const routes = [
  {
      path: '/documents',
      name: 'DocumentsStudio',
      component: () => import('./views/DocumentsStudioPage.vue'),
      meta: {
        title: 'Documents Studio',
        description: 'Create branded quotes, invoices, agreements, and PDF exports.',
        requiresAuth: false,
        layout: 'app',
        appId: 'documents',
        navLabel: 'Documents',
        icon: 'fa-regular fa-file-lines',
        order: 70,
        permission: 'documents.view',
        roles: ['sys_admin'],
      },
    }
  ];

export default routes;

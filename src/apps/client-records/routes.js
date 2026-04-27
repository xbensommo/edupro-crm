/**
 * @file routes.js
 * @description Declarative routes for the EduProLIC Client Records app.
 */

export default function createClientRecordRoutes() {
  return [
    {
      path: '/clients',
      name: 'ClientsList',
      component: () => import('./pages/ClientsListPage.vue'),
      meta: {
        requiresAuth: true,
        roles: ['admin', 'receptionist', 'consultant_editor'],
        permissions: ['client_records.clients.read'],
        feature: 'client-records',
        title: 'Client Records',
      },
    },
    {
      path: '/clients/new',
      name: 'ClientCreate',
      component: () => import('./pages/ClientCreatePage.vue'),
      meta: {
        requiresAuth: true,
        roles: ['admin', 'receptionist'],
        permissions: ['client_records.clients.create'],
        feature: 'client-records',
        title: 'Create Client',
      },
    },
    {
      path: '/clients/:id',
      name: 'ClientDetail',
      component: () => import('./pages/ClientDetailPage.vue'),
      meta: {
        requiresAuth: true,
        roles: ['admin', 'receptionist', 'finance_officer'],
        permissions: ['client_records.clients.read'],
        feature: 'client-records',
        title: 'Client Detail',
      },
    },
    {
      path: '/clients/:id/edit',
      name: 'ClientEdit',
      component: () => import('./pages/ClientEditPage.vue'),
      meta: {
        requiresAuth: true,
        roles: ['admin', 'receptionist'],
        permissions: ['client_records.clients.update'],
        feature: 'client-records',
        title: 'Edit Client',
      },
    },
  ]
}

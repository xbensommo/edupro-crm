/**
 * @file routes.js
 * @description Declarative routes for the EduProLIC Client Records app.
 */

export default function createClientRecordRoutes() {
  return [
    {
      path: '/vacancy/new',
      name: 'VacancyList',
      component: () => import('./pages/VacancyCreatePage.vue'),
      meta: {
        requiresAuth: true,
        roles: ['admin', 'receptionist', 'sysadmin'],
        permissions: ['client_records.clients.read'],
        feature: 'Vacancy',
        title: 'Create vacancy',
      },
    },
    {
      path: '/vacancy/',
      name: 'VacancyManage',
      component: () => import('./pages/VacancyManagePage.vue'),
      meta: {
        requiresAuth: true,
        roles: ['admin', 'receptionist', 'sysadmin'],
        permissions: ['client_records.clients.read'],
        feature: 'Vacancy',
        title: 'Manage vacancy',
      },
    },
    {
      path: '/vacancy/m/:edit',
      name: 'VacancyEdit',
      component: () => import('./pages/VacancyEditPage.vue'),
      meta: {
        requiresAuth: true,
        hideInNav: true,
        roles: ['admin', 'receptionist', 'sysadmin'],
        permissions: ['client_records.clients.read'],
        feature: 'Vacancy',
        title: 'Edit vacancy',
      },
    },
   /* {
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
    },*/
  ]
}

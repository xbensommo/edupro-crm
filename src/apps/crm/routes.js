/**
 * @file apps/crm/routes.js
 * @description EduProLIC CRM route contribution.
 */

export default function createCrmRoutes() {
  const localLazy = (view) => () => import(`./pages/${view}.vue`)

  return [
    {
      path: '/crm',
      name: 'crm-dashboard',
      component: localLazy('CrmDashboardPage'),
      meta: { requiresAuth: true, roles: ['admin', 'receptionist', ], permissions: ['crm.dashboard.read'], title: 'CRM Dashboard' },
    },
    {
      path: '/crm/add',
      name: 'crm-work-add',
      component: localLazy('AddEngagementPage'),
      meta: { requiresAuth: true, roles: ['admin', 'receptionist'], permissions: ['crm.work.create'], title: 'Add Work' },
    },
    {
      path: '/crm/work',
      name: 'crm-work-list',
      component: localLazy('ViewWork'),
      meta: { requiresAuth: true, roles: ['admin', 'receptionist', 'consultant', 'consultant_editor'], permissions: ['crm.work.read'], title: 'Work List' },
    },
    {
      path: '/crm/work/v/:id',
      name: 'crm-work-detail',
      component: localLazy('SelectedWorkPage'),
      meta: { requiresAuth: true, roles: ['admin', 'receptionist', 'consultant', 'consultant_editor'], permissions: ['crm.work.read'], title: 'Selected Work' },
    },
    {
      path: '/crm/submit/:work_id/final_d',
      name: 'crm-submit-final-delivery',
      component: localLazy('ConsultantSubmitWorkPage'),
      meta: { requiresAuth: true, roles: ['admin', 'consultant'], permissions: ['crm.work.submit_final'], title: 'Submit Final Delivery', hideInNav: true },
    },
    /*{
      path: '/crm/activities',
      name: 'crm-activities',
      component: localLazy('CrmActivitiesPage'),
      meta: { requiresAuth: true, roles: ['admin', 'receptionist'], permissions: ['crm.activities.read'], title: 'Activities' },
    },*/
  ]
}

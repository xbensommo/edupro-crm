/**
 * @file apps/dashboard/routes.js
 * @description Route contribution for the EduProLIC dashboard app.
 */

export default function createDashboardRoutes() {
  const localLazy = (view) => () => import(`./pages/${view}.vue`)
  const dashboardRoles = ['admin', 'receptionist', 'consultant', 'consultant_editor', 'sysadmin']
  const managementRoles = ['admin', 'receptionist', 'consultant_editor', 'sysadmin']

  return [
    {
      path: '/a',
      name: 'dashboard-home',
      component: localLazy('DashboardPage'),
      meta: {
        requiresAuth: true,
        roles: dashboardRoles,
        permissions: ['dashboard.overview.read'],
        title: 'Dashboard',
        feature: 'dashboard',
      },
    },
    {
      path: '/dashboard/analytics',
      name: 'dashboard-analytics',
      component: localLazy('AnalyticsPage'),
      meta: {
        requiresAuth: true,
        permissions: ['dashboard.analytics.read'],
        title: 'Analytics',
        feature: 'dashboard',
        roles: ['consultant', 'consultant_editor']
      },
    },
    {
      path: '/dashboard/reports',
      name: 'dashboard-reports',
      component: localLazy('ReportsPage'),
      meta: {
        requiresAuth: true,
        roles: managementRoles,
        hideInNav: true,
        permissions: ['dashboard.reports.read'],
        title: 'Reports',
        feature: 'dashboard',
      },
    },
  ]
}

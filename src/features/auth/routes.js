/**
 * @file src/features/auth/routes.js
 * @description Declarative auth route contributions with invite-only onboarding.
 */

export default [
  {
    path: '/auth',
    component: () => import('./pages/AuthLayout.vue'),
    meta: {
      guestOnly: true,
      requiresAuth: false,
      title: 'Authentication',
    },
    children: [
      {
        path: '',
        name: 'auth.login',
        component: () => import('./pages/login.vue'),
        meta: {
          guestOnly: true,
          requiresAuth: false,
          title: 'Sign in',
        },
      },
      {
        path: 'register',
        name: 'auth.register-closed',
        component: () => import('./pages/register.vue'),
        meta: {
          guestOnly: true,
          requiresAuth: false,
          title: 'Invitation required',
        },
      },
      {
        path: 'forgot-password',
        name: 'auth.forgot-password',
        component: () => import('./pages/forgot-password.vue'),
        meta: {
          guestOnly: true,
          requiresAuth: false,
          title: 'Forgot password',
        },
      },
      {
        path: 'reset-password',
        name: 'auth.reset-password',
        component: () => import('./pages/reset-password.vue'),
        meta: {
          guestOnly: true,
          requiresAuth: false,
          title: 'Reset password',
        },
      },
    ],
  },
  {
    path: '/accept-invite',
    name: 'auth.accept-invite',
    component: () => import('./pages/accept-invite.vue'),
    meta: {
      guestOnly: true,
      requiresAuth: false,
      title: 'Accept invitation',
    },
  },
  {
    path: '/admin/team-access',
    name: 'auth.team-access',
    component: () => import('./pages/team-access.vue'),
    meta: {
      requiresAuth: true,
      guestOnly: false,
      title: 'Team access',
      roles: ['admin', 'receptionist'],
      permissions: [
        'auth.invites.create', 
        'auth.invites.update'
      ],
    },
  },
  {
    path: '/account/profile',
    name: 'auth.profile',
    component: () => import('./pages/profile.vue'),
    meta: {
      requiresAuth: true,
      title: 'My profile',
      roles: ['admin', 'receptionist', 'consultant'],
      permissions: ['auth.invites.read']
    },
  },
]

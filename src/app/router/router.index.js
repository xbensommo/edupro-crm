/**
 * @file app/router/router.index.js
 * @description Minimal root router wiring.
 */

import { useAppStore } from '@app/stores/appStore/index.js'
import {
  createEnterpriseRoutes,
  createLazyHelper,
  installEnterpriseRouterGuards,
} from './router-helper.js'

import { createAppRoutes } from '@generated/routes.js'

const lazy = createLazyHelper((view, dir) => {
  return dir
    ? import(`@app/views/${dir}/${view}.vue`)
    : import(`@app/views/${view}.vue`)
})

export const routes = createEnterpriseRoutes({
  routes: [
    {
      path: '/', redirect: '/auth'
    },
    ...createAppRoutes({ lazy }),
    {
      path: '/logout',
      name: 'Logout',
      beforeEnter: async () => {
        const store = useAppStore()

        try {
          await store.logout()
          return {
            name: 'auth.login',
            query: {
              message: 'Successfully logged out',
              type: 'success',
            },
          }
        } catch (error) {
          console.error('Logout failed', error)
          return { name: '500' }
        }
      },
      component: { render: () => null },
    },
  ],
  viewLoader: (name) => lazy(name, 'errors'),
  settings: {
    appName: 'EduPro CRM - Totisoft Cc',
  },
})

export function installRouterGuards(router) {
  installEnterpriseRouterGuards(router, {
    useStore: useAppStore,
    settings: {
      appName: 'EduPro LIC | CRM',
      googleAnalyticsId: import.meta.env.VITE_GA_MEASUREMENT_ID,
      sensitiveRoles: ['admin', 'receptionist', 'consultant'],
    },
    adapters: {
      loading: (store, isLoading) => {
        if (isLoading) store.showLoading()
        else store.hideLoading()
      },
      getAuthInitialized: (store) => store.authInitialized,
      getCurrentUser: (store) => store.currentUser,
      roleKey: 'roles',
      getDefaultDestination: () => '/a',
      checkPermission: (store, requiredRoles, routeName) =>
        store.checkPermission(requiredRoles, routeName),
      checkClaim: (store, claim) => Boolean(store.claims?.[claim]),
      refreshClaims: (store) => store.refreshUserClaims(),
    },
  })
}

/**
 * Shared router scroll behavior.
 * @param {import('vue-router').RouteLocationNormalized} to
 * @param {import('vue-router').RouteLocationNormalized} from
 * @param {import('vue-router').RouterScrollBehavior['savedPosition']} savedPosition
 * @returns {import('vue-router').RouterScrollBehaviorReturn}
 */
export function scrollBehavior(to, from, savedPosition) {
  if (savedPosition) return savedPosition

  if (to.hash) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          el: to.hash,
          behavior: 'smooth',
        })
      }, 300)
    })
  }

  return {
    left: 0,
    top: 0,
    behavior: 'smooth',
  }
}
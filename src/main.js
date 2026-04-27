/**
 * @file main.js
 * @description Application entry point for normal Vite SPA.
 * @date 2026-04-22
 */

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';

import App from './App.vue';
import { routes, installRouterGuards, scrollBehavior } from './app/router/index.js';
import { registerRootProviders } from './app/provider/provider.js';
import { bootstrapApp } from './app/boot/bootstrap.js';
import { installActionPipeline } from '@action_modal/plugins/action-plugin.js';
import { createAuthActionDefinitions } from '@features/auth/auth.actions.js';

import '@fortawesome/fontawesome-free/css/all.min.css';
import 'vue-sonner/style.css';
import '@/assets/css/main.css';

/**
 * Build and mount the SPA.
 */
async function mountApp() {
  const app = createApp(App);
  const pinia = createPinia();

  const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
    scrollBehavior,
  });

  app.use(pinia);
  app.use(router);

  registerRootProviders(app);

  installRouterGuards(router);

  app.config.errorHandler = (error) => {
    console.trace(error);

    router.push({
      name: '500',
      query: {
        message: 'Application Crash',
        reason: 'A critical rendering error occurred.',
      },
    });
  };

  window.addEventListener('unhandledrejection', () => {
    router.push({
      name: '500',
      query: {
        message: 'Server Error',
        reason: 'Our systems are experiencing a technical issue.',
      },
    });
  });

  installActionPipeline(app, {
    actions: [
      ...createAuthActionDefinitions(),
    ],
    normalizeError(error) {
      return error instanceof Error ? error : new Error('Action failed.');
    },
  });

  await bootstrapApp();
  await router.isReady();

  app.mount('#app');
}

mountApp().catch((error) => {
  console.error('[main] Failed to mount application.', error);
});
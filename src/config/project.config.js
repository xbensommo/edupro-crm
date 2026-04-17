/**
 * @file project.config.js
 * @description Main project configuration.
 */

export default {
  name: 'edupro-crm',
  version: '1.0.0',
  description: 'Generated with Totistack v2',

  frontend: 'vue',
  packageManager: 'npm',

  router: {
    mode: 'history',
    base: '/',
  },

  env: {
    development: {
      apiUrl: 'http://localhost:3000',
      debug: true,
    },
    production: {
      apiUrl: 'https://api.edupro-crm.com',
      debug: false,
    },
  },

  providers: {
    firebase: {
      apiKey: 'your-api-key',
      authDomain: 'demo-edupro.firebaseapp.com',
      projectId: 'demo-edupro',
      storageBucket: 'demo-edupro.appspot.com',
      messagingSenderId: 'your-sender-id',
      appId: 'your-app-id',
    },
    firestore: {
      useShardProvider: true,
      shardProviderVersion: '^2.2.3',
    },
  },

  security: {
    authEnabled: true,
    rbacEnabled: false,
  },

  modules: {
    apps: [
  "booking",
  "client-records",
  "crm",
  "dashboard",
  "documents",
  "finance"
],
    features: [
  "auth",
  "forms",
  "integrations",
  "media",
  "workflows"
],
  },
};

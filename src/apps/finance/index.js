/**
 * @file apps/crm/index.js
 * @description Backward-compatible CRM barrel exports.
 *
 * This module is declarative. It does not self-register routes, stores, or providers.
 * The Totistack generated assembly layer discovers these exports at build time.
 */

export { default as manifest } from './app.manifest.js';
export { default as routes } from './routes.js';
/*export {
  createCrmService,
  useCrmService,
  CRM_COLLECTIONS,
  CRM_PIPELINE_STAGES,
  CRM_DOCUMENT_TYPES,
} from './services/crmService.js';*/

export { default as accountsFinance } from './definitions/accounts.definitions.js';
export { default as journalEntries } from './definitions/journal-entries.definitions.js';
export { default as periodsFinance } from './definitions/periods.definitions.js';
export { default as transactionsFinance } from './definitions/transactions.definitions.js';


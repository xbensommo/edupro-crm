/**
 * @file src/apps/finance/app.manifest.js
 * @description Totistack finance app manifest.
 */

//import routes from './routes/index.js'
//import navigation from './navigation.js'
// import definitions from './definitions/index.js'
/*import {
  FINANCE_ACTIONS,
  FINANCE_ROLES,
} from './permissions/finance.permissions.js'*/

export default {
  id: 'finance',
  type: 'app',
  name: 'Finance',
  description: 'Double-entry accounting, finance operations, and ledger-derived reporting for Totistack.',
  version: '2.1.0',
  //routes,
  //navigation,
  navigation: {
    label: 'Finance',
    icon: 'book',
    priority: 20,
    roles: ['admin', 'manager', 'sales'],
  },
  collections: [
    'accounts', 'Journal-entries', 'periods', 'transactions'
  ],
  /*permissions: {
    roles: FINANCE_ROLES,
    actions: FINANCE_ACTIONS,
  },*/
  dependencies: {
    features: ['auth', 'rbac'],
    apps: []
  },  
  capabilities: [
    'double-entry-ledger',
    'balance-sheet',
    'income-statement',
    'expense-statement',
    'draft-review-post-flow',
    'confirm-guarded-actions',
    'period-closing',
    'rbac-finance-operations',
  ],
}

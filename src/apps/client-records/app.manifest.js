/**
 * @file app.manifest.js
 * @description Declarative manifest for the EduProLIC Client Records app.
 */

export default {
  id: 'client-records',
  type: 'app',
  name: 'Client Records',
  version: '4.0.0',
  description:
    'EduProLIC client records for receptionist/admin intake, CRM work handoff, notification events, and client history.',
  dependencies: {
    features: ['auth', 'rbac', 'notifications'],
    apps: ['crm', 'finance'],
  },
  navigation: {
    label: 'Clients',
    icon: 'Users',
    priority: 20,
    requiresAuth: true,
    roles: ['admin', 'receptionist', 'consultant', 'consultant_editor', 'finance_officer'],
  },
  collections: ['clients', 'clientContacts', 'clientActivities', 'clientNotes'],
}

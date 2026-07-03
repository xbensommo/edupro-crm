/**
 * @file app.manifest.js
 * @description Declarative manifest for the EduProLIC vacancy Records app.
 */

export default {
  id: 'vacancy',
  type: 'app',
  name: 'vacancy Records',
  version: '4.0.0',
  description:
    'EduProLIC vacancy records for receptionist/admin intake, CRM work handoff, notification events, and vacancy history.',
  dependencies: {
    features: ['auth', 'rbac', 'notifications'],
    apps: ['vacancy', 'finance'],
  },
  navigation: {
    label: 'vacancys',
    icon: 'Users',
    priority: 20,
    requiresAuth: true,
    roles: ['admin', 'receptionist', 'sysadmin'],
  },
  collections: ['vacancys', 'vacancyContacts', 'vacancyActivities', 'vacancyNotes'],
}

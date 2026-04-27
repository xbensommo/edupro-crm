/**
 * @file apps/crm/app.manifest.js
 * @description EduProLIC CRM manifest aligned with Totistack build-time assembly.
 */

export default {
  id: 'crm',
  name: 'EduProLIC CRM',
  version: '4.0.0',
  description: 'EduProLIC work operations CRM for client-linked work intake, consultant assignment, review, delivery, notifications, and finance handoff.',
  provider: 'firestore',
  usesFirestore: true,
  dependencies: {
    features: ['auth', 'rbac', 'notifications'],
    apps: ['client-records', 'finance'],
  },
  navigation: {
    icon: 'BriefcaseBusiness',
    priority: 1,
    roles: ['admin', 'receptionist', 'consultant', 'consultant_editor'],
  },
  collections: [
    'crm_files',
    'engagements',
    'crm_activities',
    'crm_messages',
  ],
}

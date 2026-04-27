/**
 * @file crm/manifest.js
 * @description EduProLIC CRM app manifest for Totistack generated assembly.
 */

export default {
  id: 'crm',
  type: 'app',
  name: 'EduProLIC CRM',
  version: '4.0.0',
  description: 'Work-driven CRM for EduProLIC client intake, assignment, review, delivery, notifications, and finance handoff.',
  dependencies: {
    features: ['auth', 'rbac', 'notifications'],
    apps: ['client-records', 'finance'],
  },
  navigation: {
    label: 'CRM',
    icon: 'BriefcaseBusiness',
    priority: 20,
  },
  collections: ['crm_files', 'engagements', 'crm_activities', 'crm_messages'],
}

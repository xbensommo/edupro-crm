/**
 * @file permissions.js
 * @description EduProLIC CRM permission registry.
 */

export default {
  module: 'crm',
  permissions: [
    { key: 'crm.dashboard.read', resource: 'dashboard', action: 'read', description: 'View the EduProLIC CRM dashboard.' },
    { key: 'crm.clients.read', resource: 'clients', action: 'read', description: 'View linked client profiles from client records.' },
    { key: 'crm.work.read', resource: 'work', action: 'read', description: 'View EduProLIC work records.' },
    { key: 'crm.work.create', resource: 'work', action: 'create', description: 'Create new work records for clients.' },
    { key: 'crm.work.update', resource: 'work', action: 'update', description: 'Update work records.' },
    { key: 'crm.work.assign', resource: 'work', action: 'assign', description: 'Assign work to consultants or consultant-editors.' },
    { key: 'crm.work.respond', resource: 'work', action: 'respond', description: 'Accept or deny assigned work.' },
    { key: 'crm.work.submit_final', resource: 'work', action: 'submit_final', description: 'Submit final consultant delivery files.' },
    { key: 'crm.work.review', resource: 'work', action: 'review', description: 'Review consultant submissions as consultant-editor or admin.' },
    { key: 'crm.work.deliver', resource: 'work', action: 'deliver', description: 'Release approved work to the client.' },
    { key: 'crm.work.archive', resource: 'work', action: 'archive', description: 'Archive cancelled or completed work.' },
    { key: 'crm.files.read', resource: 'files', action: 'read', description: 'View supporting and final delivery files.' },
    { key: 'crm.files.upload', resource: 'files', action: 'upload', description: 'Upload work files.' },
    { key: 'crm.activities.read', resource: 'activities', action: 'read', description: 'View CRM activity logs.' },
    { key: 'crm.activities.create', resource: 'activities', action: 'create', description: 'Create CRM activity logs.' },
    { key: 'crm.communications.read', resource: 'communications', action: 'read', description: 'View email and WhatsApp communication logs.' },
    { key: 'crm.communications.create', resource: 'communications', action: 'create', description: 'Create communication logs.' },
    { key: 'crm.notifications.emit', resource: 'notifications', action: 'emit', description: 'Emit CRM notifications into the notifications feature.' },
    { key: 'crm.finance.feed', resource: 'finance', action: 'feed', description: 'Create finance feeder records from CRM work.' },
  ],
  roleTemplates: {
    admin: [
      'crm.dashboard.read', 'crm.clients.read', 'crm.work.read', 'crm.work.create', 'crm.work.update', 'crm.work.assign',
      'crm.work.respond', 'crm.work.submit_final', 'crm.work.review', 'crm.work.deliver', 'crm.work.archive',
      'crm.files.read', 'crm.files.upload', 'crm.activities.read', 'crm.activities.create',
      'crm.communications.read', 'crm.communications.create', 'crm.notifications.emit', 'crm.finance.feed',
    ],
    receptionist: [
      'crm.dashboard.read', 'crm.clients.read', 'crm.work.read', 'crm.work.create', 'crm.work.update', 'crm.work.assign',
      'crm.work.deliver', 'crm.files.read', 'crm.files.upload', 'crm.activities.read', 'crm.activities.create',
      'crm.communications.read', 'crm.communications.create', 'crm.notifications.emit', 'crm.finance.feed',
    ],
    consultant: [
      'crm.dashboard.read', 'crm.work.read', 'crm.work.respond', 'crm.work.submit_final', 'crm.files.read', 'crm.files.upload',
      'crm.activities.read', 'crm.notifications.emit',
    ],
    consultant_editor: [
      'crm.dashboard.read', 'crm.work.read', 'crm.work.review', 'crm.files.read', 'crm.activities.read', 'crm.notifications.emit',
    ],
  },
}

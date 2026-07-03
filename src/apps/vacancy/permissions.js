/**
 * @file permissions.js
 * @description Declarative permission registry for the EduProLIC client-records app.
 */

export default {
  module: 'client_records',
  permissions: [
    
    { key: 'client_records.clients.create', resource: 'clients', action: 'create', description: 'Create client records.' },
    { key: 'client_records.clients.update', resource: 'clients', action: 'update', description: 'Update client records.' },
    { key: 'client_records.clients.archive', resource: 'clients', action: 'archive', description: 'Archive client records.' },

    { key: 'client_records.activities.read', resource: 'activities', action: 'read', description: 'View client activities.' },
    { key: 'client_records.activities.create', resource: 'activities', action: 'create', description: 'Log client activities.' },

    { key: 'client_records.notes.read', resource: 'notes', action: 'read', description: 'View client notes.' },
    { key: 'client_records.notes.create', resource: 'notes', action: 'create', description: 'Add client notes.' },

    { key: 'client_records.contacts.read', resource: 'contacts', action: 'read', description: 'View linked client contacts.' },
    { key: 'client_records.contacts.create', resource: 'contacts', action: 'create', description: 'Add linked client contacts.' },
    { key: 'client_records.contacts.update', resource: 'contacts', action: 'update', description: 'Update linked client contacts.' },

    { key: 'client_records.work.read', resource: 'work', action: 'read', description: 'View CRM work linked to a client.' },
    { key: 'client_records.work.create', resource: 'work', action: 'create', description: 'Start a new work item from a client record.' },

    { key: 'client_records.notifications.emit', resource: 'notifications', action: 'emit', description: 'Emit in-app notifications for client events.' },
  ],
  roleTemplates: {
    admin: [
      'client_records.clients.read', 'client_records.clients.create', 'client_records.clients.update', 'client_records.clients.archive',
      'client_records.activities.read', 'client_records.activities.create',
      'client_records.notes.read', 'client_records.notes.create',
      'client_records.contacts.read', 'client_records.contacts.create', 'client_records.contacts.update',
      'client_records.work.read', 'client_records.work.create', 'client_records.notifications.emit',
    ],
    receptionist: [
      'client_records.clients.read', 'client_records.clients.create', 'client_records.clients.update',
      'client_records.activities.read', 'client_records.activities.create',
      'client_records.notes.read', 'client_records.notes.create',
      'client_records.contacts.read', 'client_records.contacts.create', 'client_records.contacts.update',
      'client_records.work.read', 'client_records.work.create', 'client_records.notifications.emit',
    ],
    consultant: [
      'client_records.clients.read', 'client_records.activities.read', 'client_records.notes.read', 'client_records.contacts.read', 'client_records.work.read',
    ],
    consultant_editor: [
      'client_records.clients.read', 'client_records.activities.read', 'client_records.notes.read', 'client_records.contacts.read', 'client_records.work.read',
    ],
    finance_officer: [
      'client_records.clients.read', 'client_records.activities.read', 'client_records.notes.read', 'client_records.work.read',
    ],
  },
}

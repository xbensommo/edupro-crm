/**
 * @file permissions.js
 * @description Declarative permission registry for the client-records app.
 */

export default {
  module: 'client_records',
  permissions: [
    { key: 'client_records.clients.read', resource: 'clients', action: 'read', description: 'View client records.' },
    { key: 'client_records.clients.create', resource: 'clients', action: 'create', description: 'Create client records.' },
    { key: 'client_records.clients.update', resource: 'clients', action: 'update', description: 'Update client records.' },
    { key: 'client_records.clients.delete', resource: 'clients', action: 'delete', description: 'Delete client records.' },
    { key: 'client_records.clients.restore', resource: 'clients', action: 'restore', description: 'Restore client records.' },
    { key: 'client_records.clients.archive', resource: 'clients', action: 'archive', description: 'Archive client records.' },
    { key: 'client_records.clients.export', resource: 'clients', action: 'export', description: 'Export client records.' },
    { key: 'client_records.clients.manage', resource: 'clients', action: 'manage', description: 'Full control over client records.' },

    { key: 'client_records.history.read', resource: 'history', action: 'read', description: 'View client history.' },
    { key: 'client_records.history.create', resource: 'history', action: 'create', description: 'Create history entries.' },
    { key: 'client_records.history.update', resource: 'history', action: 'update', description: 'Update history entries.' },
    { key: 'client_records.history.delete', resource: 'history', action: 'delete', description: 'Delete history entries.' },
    { key: 'client_records.history.audit', resource: 'history', action: 'audit', description: 'Audit client history.' },
    { key: 'client_records.history.manage', resource: 'history', action: 'manage', description: 'Full control over client history.' },

    { key: 'client_records.attachments.read', resource: 'attachments', action: 'read', description: 'View client attachments.' },
    { key: 'client_records.attachments.upload', resource: 'attachments', action: 'upload', description: 'Upload client attachments.' },
    { key: 'client_records.attachments.delete', resource: 'attachments', action: 'delete', description: 'Delete client attachments.' },
    { key: 'client_records.attachments.manage', resource: 'attachments', action: 'manage', description: 'Full control over client attachments.' },
  ],
  roleTemplates: {
    admin: ['client_records.clients.manage', 'client_records.history.manage', 'client_records.attachments.manage'],
    receptionist: ['client_records.clients.read', 'client_records.clients.create', 'client_records.clients.update', 'client_records.history.read', 'client_records.history.create', 'client_records.attachments.read', 'client_records.attachments.upload'],
    consultant: ['client_records.clients.read', 'client_records.clients.update', 'client_records.history.read', 'client_records.history.create', 'client_records.history.update', 'client_records.attachments.read', 'client_records.attachments.upload'],
    finance_officer: ['client_records.clients.read', 'client_records.history.read', 'client_records.attachments.read'],
    viewer: ['client_records.clients.read', 'client_records.history.read', 'client_records.attachments.read'],
  },
}
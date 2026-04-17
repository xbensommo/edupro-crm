/**
 * @file permissions.js
 * @description Declarative permission registry for the crm app.
 */

export default {
  module: 'crm',
  permissions: [
    { key: 'crm.leads.read', resource: 'leads', action: 'read', description: 'View CRM leads.' },
    { key: 'crm.leads.create', resource: 'leads', action: 'create', description: 'Create CRM leads.' },
    { key: 'crm.leads.update', resource: 'leads', action: 'update', description: 'Update CRM leads.' },
    { key: 'crm.leads.delete', resource: 'leads', action: 'delete', description: 'Delete CRM leads.' },
    { key: 'crm.leads.restore', resource: 'leads', action: 'restore', description: 'Restore CRM leads.' },
    { key: 'crm.leads.assign', resource: 'leads', action: 'assign', description: 'Assign CRM leads.' },
    { key: 'crm.leads.convert', resource: 'leads', action: 'convert', description: 'Convert leads to active customers.' },
    { key: 'crm.leads.export', resource: 'leads', action: 'export', description: 'Export lead data.' },
    { key: 'crm.leads.manage', resource: 'leads', action: 'manage', description: 'Full control over leads.' },

    { key: 'crm.contacts.read', resource: 'contacts', action: 'read', description: 'View contacts.' },
    { key: 'crm.contacts.create', resource: 'contacts', action: 'create', description: 'Create contacts.' },
    { key: 'crm.contacts.update', resource: 'contacts', action: 'update', description: 'Update contacts.' },
    { key: 'crm.contacts.delete', resource: 'contacts', action: 'delete', description: 'Delete contacts.' },
    { key: 'crm.contacts.restore', resource: 'contacts', action: 'restore', description: 'Restore contacts.' },
    { key: 'crm.contacts.export', resource: 'contacts', action: 'export', description: 'Export contact data.' },
    { key: 'crm.contacts.manage', resource: 'contacts', action: 'manage', description: 'Full control over contacts.' },

    { key: 'crm.accounts.read', resource: 'accounts', action: 'read', description: 'View accounts.' },
    { key: 'crm.accounts.create', resource: 'accounts', action: 'create', description: 'Create accounts.' },
    { key: 'crm.accounts.update', resource: 'accounts', action: 'update', description: 'Update accounts.' },
    { key: 'crm.accounts.delete', resource: 'accounts', action: 'delete', description: 'Delete accounts.' },
    { key: 'crm.accounts.restore', resource: 'accounts', action: 'restore', description: 'Restore accounts.' },
    { key: 'crm.accounts.assign', resource: 'accounts', action: 'assign', description: 'Assign accounts.' },
    { key: 'crm.accounts.export', resource: 'accounts', action: 'export', description: 'Export account data.' },
    { key: 'crm.accounts.manage', resource: 'accounts', action: 'manage', description: 'Full control over accounts.' },

    { key: 'crm.tasks.read', resource: 'tasks', action: 'read', description: 'View tasks and follow-ups.' },
    { key: 'crm.tasks.create', resource: 'tasks', action: 'create', description: 'Create tasks and follow-ups.' },
    { key: 'crm.tasks.update', resource: 'tasks', action: 'update', description: 'Update tasks and follow-ups.' },
    { key: 'crm.tasks.delete', resource: 'tasks', action: 'delete', description: 'Delete tasks and follow-ups.' },
    { key: 'crm.tasks.assign', resource: 'tasks', action: 'assign', description: 'Assign tasks and follow-ups.' },
    { key: 'crm.tasks.complete', resource: 'tasks', action: 'complete', description: 'Mark tasks as complete.' },
    { key: 'crm.tasks.manage', resource: 'tasks', action: 'manage', description: 'Full control over tasks.' },

    { key: 'crm.notes.read', resource: 'notes', action: 'read', description: 'View notes and timelines.' },
    { key: 'crm.notes.create', resource: 'notes', action: 'create', description: 'Create notes and timelines.' },
    { key: 'crm.notes.update', resource: 'notes', action: 'update', description: 'Update notes and timelines.' },
    { key: 'crm.notes.delete', resource: 'notes', action: 'delete', description: 'Delete notes and timelines.' },
    { key: 'crm.notes.manage', resource: 'notes', action: 'manage', description: 'Full control over notes.' },

    { key: 'crm.documents.read', resource: 'documents', action: 'read', description: 'View CRM documents.' },
    { key: 'crm.documents.create', resource: 'documents', action: 'create', description: 'Create CRM documents.' },
    { key: 'crm.documents.update', resource: 'documents', action: 'update', description: 'Update CRM documents.' },
    { key: 'crm.documents.delete', resource: 'documents', action: 'delete', description: 'Delete CRM documents.' },
    { key: 'crm.documents.approve', resource: 'documents', action: 'approve', description: 'Approve CRM documents.' },
    { key: 'crm.documents.send', resource: 'documents', action: 'send', description: 'Send CRM documents.' },
    { key: 'crm.documents.export', resource: 'documents', action: 'export', description: 'Export CRM documents.' },
    { key: 'crm.documents.manage', resource: 'documents', action: 'manage', description: 'Full control over CRM documents.' },

    { key: 'crm.reports.read', resource: 'reports', action: 'read', description: 'View CRM reports.' },
    { key: 'crm.reports.export', resource: 'reports', action: 'export', description: 'Export CRM reports.' },
    { key: 'crm.reports.manage', resource: 'reports', action: 'manage', description: 'Full control over CRM reports.' },
  ],
  roleTemplates: {
    admin: ['crm.leads.manage', 'crm.contacts.manage', 'crm.accounts.manage', 'crm.tasks.manage', 'crm.notes.manage', 'crm.documents.manage', 'crm.reports.manage'],
    receptionist: ['crm.leads.read', 'crm.leads.create', 'crm.leads.update', 'crm.contacts.read', 'crm.contacts.create', 'crm.contacts.update', 'crm.accounts.read', 'crm.accounts.create', 'crm.accounts.update', 'crm.tasks.read', 'crm.tasks.create', 'crm.tasks.update', 'crm.notes.read', 'crm.notes.create'],
    consultant: ['crm.leads.read', 'crm.leads.update', 'crm.contacts.read', 'crm.contacts.update', 'crm.accounts.read', 'crm.tasks.read', 'crm.tasks.create', 'crm.tasks.update', 'crm.tasks.complete', 'crm.notes.read', 'crm.notes.create', 'crm.notes.update', 'crm.documents.read', 'crm.documents.create', 'crm.documents.update'],
    finance_officer: ['crm.leads.read', 'crm.contacts.read', 'crm.accounts.read', 'crm.documents.read', 'crm.reports.read'],
    viewer: ['crm.leads.read', 'crm.contacts.read', 'crm.accounts.read', 'crm.tasks.read', 'crm.notes.read', 'crm.documents.read', 'crm.reports.read'],
  },
}
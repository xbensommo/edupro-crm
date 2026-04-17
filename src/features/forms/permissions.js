/**
 * @file permissions.js
 * @description Declarative permission registry for the forms feature.
 */

export default {
  module: 'forms',
  permissions: [
    { key: 'forms.forms.read', resource: 'forms', action: 'read', description: 'View forms.' },
    { key: 'forms.forms.create', resource: 'forms', action: 'create', description: 'Create forms.' },
    { key: 'forms.forms.update', resource: 'forms', action: 'update', description: 'Update forms.' },
    { key: 'forms.forms.delete', resource: 'forms', action: 'delete', description: 'Delete forms.' },
    { key: 'forms.forms.publish', resource: 'forms', action: 'publish', description: 'Publish forms.' },
    { key: 'forms.forms.unpublish', resource: 'forms', action: 'unpublish', description: 'Unpublish forms.' },
    { key: 'forms.forms.configure', resource: 'forms', action: 'configure', description: 'Configure form settings.' },
    { key: 'forms.forms.manage', resource: 'forms', action: 'manage', description: 'Full control over forms.' },

    { key: 'forms.responses.read', resource: 'responses', action: 'read', description: 'View form responses.' },
    { key: 'forms.responses.export', resource: 'responses', action: 'export', description: 'Export form responses.' },
    { key: 'forms.responses.delete', resource: 'responses', action: 'delete', description: 'Delete form responses.' },
    { key: 'forms.responses.manage', resource: 'responses', action: 'manage', description: 'Full control over responses.' },

    { key: 'forms.links.create', resource: 'links', action: 'create', description: 'Create public form links.' },
    { key: 'forms.links.revoke', resource: 'links', action: 'revoke', description: 'Revoke public form links.' },
    { key: 'forms.embeds.manage', resource: 'embeds', action: 'manage', description: 'Manage embedded forms.' },
  ],
  roleTemplates: {
    admin: ['forms.forms.manage', 'forms.responses.manage', 'forms.links.create', 'forms.links.revoke', 'forms.embeds.manage'],
    receptionist: ['forms.forms.read', 'forms.responses.read'],
    consultant: ['forms.forms.read', 'forms.responses.read'],
    finance_officer: ['forms.forms.read'],
    viewer: ['forms.forms.read', 'forms.responses.read'],
  },
}
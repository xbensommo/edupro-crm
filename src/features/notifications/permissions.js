/**
 * @file permissions.js
 * @description Declarative permission registry for the notifications feature.
 */

export default {
  module: 'notifications',
  permissions: [
    { key: 'notifications.notifications.read', resource: 'notifications', action: 'read', description: 'View notifications.' },
    { key: 'notifications.notifications.create', resource: 'notifications', action: 'create', description: 'Create notifications.' },
    { key: 'notifications.notifications.send', resource: 'notifications', action: 'send', description: 'Send notifications.' },
    { key: 'notifications.notifications.retry', resource: 'notifications', action: 'retry', description: 'Retry notification delivery.' },
    { key: 'notifications.notifications.cancel', resource: 'notifications', action: 'cancel', description: 'Cancel pending notifications.' },
    { key: 'notifications.notifications.manage', resource: 'notifications', action: 'manage', description: 'Full control over notifications.' },

    { key: 'notifications.templates.read', resource: 'templates', action: 'read', description: 'View notification templates.' },
    { key: 'notifications.templates.create', resource: 'templates', action: 'create', description: 'Create notification templates.' },
    { key: 'notifications.templates.update', resource: 'templates', action: 'update', description: 'Update notification templates.' },
    { key: 'notifications.templates.delete', resource: 'templates', action: 'delete', description: 'Delete notification templates.' },
    { key: 'notifications.templates.manage', resource: 'templates', action: 'manage', description: 'Full control over templates.' },

    { key: 'notifications.channels.configure', resource: 'channels', action: 'configure', description: 'Configure notification channels.' },
  ],
  roleTemplates: {
    admin: ['notifications.notifications.manage', 'notifications.templates.manage', 'notifications.channels.configure'],
    receptionist: ['notifications.notifications.read', 'notifications.notifications.create', 'notifications.notifications.send'],
    consultant: ['notifications.notifications.read'],
    finance_officer: ['notifications.notifications.read'],
    viewer: ['notifications.notifications.read'],
  },
}
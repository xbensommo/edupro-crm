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

    { key: 'notifications.preferences.read', resource: 'preferences', action: 'read', description: 'View own notification preferences.' },
    { key: 'notifications.preferences.update', resource: 'preferences', action: 'update', description: 'Update own notification preferences.' },
    { key: 'notifications.preferences.manage', resource: 'preferences', action: 'manage', description: 'Manage all notification preferences.' },

    { key: 'notifications.templates.read', resource: 'templates', action: 'read', description: 'View notification templates.' },
    { key: 'notifications.templates.create', resource: 'templates', action: 'create', description: 'Create notification templates.' },
    { key: 'notifications.templates.update', resource: 'templates', action: 'update', description: 'Update notification templates.' },
    { key: 'notifications.templates.delete', resource: 'templates', action: 'delete', description: 'Delete notification templates.' },
    { key: 'notifications.templates.manage', resource: 'templates', action: 'manage', description: 'Full control over templates.' },

    { key: 'notifications.logs.read', resource: 'logs', action: 'read', description: 'View notification delivery logs.' },
    { key: 'notifications.channels.configure', resource: 'channels', action: 'configure', description: 'Configure notification channels.' },
  ],
  roleTemplates: {
    admin: [
      'notifications.notifications.manage',
      'notifications.preferences.manage',
      'notifications.templates.manage',
      'notifications.logs.read',
      'notifications.channels.configure',
    ],
    receptionist: [
      'notifications.notifications.read',
      'notifications.notifications.create',
      'notifications.notifications.send',
      'notifications.preferences.read',
      'notifications.preferences.update',
    ],
    consultant: [
      'notifications.notifications.read',
      'notifications.preferences.read',
      'notifications.preferences.update',
    ],
    consultant_editor: [
      'notifications.notifications.read',
      'notifications.preferences.read',
      'notifications.preferences.update',
    ],
  },
};

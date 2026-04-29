/** @file src/features/notifications/permissions.js */

export const notificationPermissions = Object.freeze({
  'notifications.notifications.read': {
    description: 'Read own notification inbox.',
    roles: ['admin', 'receptionist', 'consultant', 'editor', 'consultant_editor', 'consultant-editor', 'sysadmin', 'sys_admin'],
  },
  'notifications.notifications.update': {
    description: 'Mark own notifications as read or archived.',
    roles: ['admin', 'receptionist', 'consultant', 'editor', 'consultant_editor', 'consultant-editor', 'sysadmin', 'sys_admin'],
  },
  'notifications.preferences.read': {
    description: 'Read own notification preferences.',
    roles: ['admin', 'receptionist', 'consultant', 'editor', 'consultant_editor', 'consultant-editor', 'sysadmin', 'sys_admin'],
  },
  'notifications.preferences.update': {
    description: 'Update own notification preferences.',
    roles: ['admin', 'receptionist', 'consultant', 'editor', 'consultant_editor', 'consultant-editor', 'sysadmin', 'sys_admin'],
  },
  'notifications.logs.read': {
    description: 'Read delivery queue and provider logs.',
    roles: ['admin', 'sysadmin', 'sys_admin'],
  },
  'notifications.templates.manage': {
    description: 'Inspect/manage notification template policy.',
    roles: ['admin', 'sysadmin', 'sys_admin'],
  },
})

export default notificationPermissions

/**
 * @file permissions.js
 * @description Declarative permission registry for the booking app.
 */

export default {
  module: 'booking',
  permissions: [
    { key: 'booking.appointments.read', resource: 'appointments', action: 'read', description: 'View bookings and appointments.' },
    { key: 'booking.appointments.create', resource: 'appointments', action: 'create', description: 'Create bookings and appointments.' },
    { key: 'booking.appointments.update', resource: 'appointments', action: 'update', description: 'Update bookings and appointments.' },
    { key: 'booking.appointments.delete', resource: 'appointments', action: 'delete', description: 'Delete bookings and appointments.' },
    { key: 'booking.appointments.restore', resource: 'appointments', action: 'restore', description: 'Restore bookings and appointments.' },
    { key: 'booking.appointments.assign', resource: 'appointments', action: 'assign', description: 'Assign bookings and appointments.' },
    { key: 'booking.appointments.approve', resource: 'appointments', action: 'approve', description: 'Approve bookings and appointments.' },
    { key: 'booking.appointments.cancel', resource: 'appointments', action: 'cancel', description: 'Cancel bookings and appointments.' },
    { key: 'booking.appointments.reschedule', resource: 'appointments', action: 'reschedule', description: 'Reschedule bookings and appointments.' },
    { key: 'booking.appointments.manage', resource: 'appointments', action: 'manage', description: 'Full control over appointments.' },

    { key: 'booking.availability.read', resource: 'availability', action: 'read', description: 'View availability and schedules.' },
    { key: 'booking.availability.update', resource: 'availability', action: 'update', description: 'Update availability and schedules.' },
    { key: 'booking.availability.configure', resource: 'availability', action: 'configure', description: 'Configure booking availability.' },
    { key: 'booking.availability.manage', resource: 'availability', action: 'manage', description: 'Full control over availability.' },

    { key: 'booking.reminders.read', resource: 'reminders', action: 'read', description: 'View booking reminders.' },
    { key: 'booking.reminders.create', resource: 'reminders', action: 'create', description: 'Create booking reminders.' },
    { key: 'booking.reminders.send', resource: 'reminders', action: 'send', description: 'Send booking reminders.' },
    { key: 'booking.reminders.manage', resource: 'reminders', action: 'manage', description: 'Full control over reminders.' },

    { key: 'booking.public.configure', resource: 'public', action: 'configure', description: 'Configure public booking settings.' },
    { key: 'booking.public.manage', resource: 'public', action: 'manage', description: 'Full control over public booking settings.' },
  ],
  roleTemplates: {
    admin: ['booking.appointments.manage', 'booking.availability.manage', 'booking.reminders.manage', 'booking.public.manage'],
    receptionist: ['booking.appointments.read', 'booking.appointments.create', 'booking.appointments.update', 'booking.appointments.cancel', 'booking.appointments.reschedule', 'booking.availability.read', 'booking.reminders.read', 'booking.reminders.create', 'booking.reminders.send'],
    consultant: ['booking.appointments.read', 'booking.appointments.update', 'booking.appointments.reschedule', 'booking.availability.read', 'booking.reminders.read'],
    finance_officer: ['booking.appointments.read'],
    viewer: ['booking.appointments.read', 'booking.availability.read'],
  },
}
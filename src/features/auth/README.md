# EduProLIC Auth feature

This auth feature is configured for EduProLIC and is no longer a generic starter.

## What it now does
- invite-only onboarding
- receptionist, admin, and sysadmin user management
- consultant and consultant-editor support
- suspension and reactivation
- in-app notifications on invite, acceptance, suspension, and reactivation

## Main page
- `/admin/team-access` is the user management page for receptionist, admin, and sysadmin

## Roles supported
- admin
- receptionist
- consultant
- consultant_editor
- sysadmin

## Notifications used
Writes records into the `notifications` collection with the latest notification schema.

## What to remove after merge
- any old role values like `user`, `viewer`, `finance_officer`, or `sys_admin`
- any sidebar entry that treats team access as invite-only instead of full user management

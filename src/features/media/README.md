# EduProLIC Media feature

This media feature is no longer a generic starter. It is positioned as the system file library for EduProLIC.

## What it now does
- file upload metadata for system files
- file download activity recording
- user attribution on upload and download
- in-app notifications for upload and download events
- shared file access routes for admin, receptionist, consultant, consultant_editor, and sysadmin

## Important boundary
This feature stores and audits file records. Binary upload storage still needs your project-level Firebase Storage or equivalent implementation.

## What to remove after merge
- any old `/admin/media` navigation link
- any old text that still calls this a starter workflow shell

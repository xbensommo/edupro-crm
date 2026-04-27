# EduProLIC Dashboard

Role-scoped Totistack dashboard for EduProLIC.

## Roles supported
- admin
- receptionist
- consultant
- consultant_editor
- sysadmin

## Access model
- **admin** and **receptionist** use the same operational dashboard scope.
- **consultant** sees only personal work-facing visibility.
- **consultant_editor** sees editorial workload and reporting.
- **sysadmin** sees system status in addition to operational visibility.

## What changed
- removed generic starter wording
- removed fake manager/user roles
- fixed route permissions to use real dashboard permission keys
- updated widgets and pages to be role-scoped
- updated analytics and reports to respect EduProLIC role boundaries
- updated quick actions so users only see actions relevant to their role

## Remove after merge
- `dashboard-ui-beautified.zip`
- any old navigation config still pointing to `/a`
- any root sidebar entries still exposing reports to consultants

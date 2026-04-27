# EduProLIC Firestore rules notes

This ruleset was derived from the uploaded collection definitions and the current EduProLIC workflow reflected in those files.

## What it enforces

- `admin`, `receptionist`, and `sysadmin` are treated as the operational staff group.
- Finance collections are internal-only to operational staff, except consultants can read only their own `consultant_payouts` rows.
- `engagements` are readable by operations staff plus the assigned consultant/editor.
- Assigned consultants can only update assignment/final-delivery style fields on their own engagements.
- Assigned editors can only update review fields on their own engagements.
- Notifications are private to the owner user, with operations staff able to manage them.
- `user_invites` are open to operations staff because EduProLIC explicitly uses admin/receptionist invite flows.
- Password reset tokens are denied to client apps and should be handled through trusted backend logic.

## Real issues in the current collection bundle

- Several collection definitions contain broken field names with trailing spaces such as `user_id `.
- `notifications.definitions.js` contains copied invalid indexes/search fields that do not match its schema.
- Some collections define broad `read: 'auth'` contracts even though the business model is narrower. The rules file tightens those collections to fit EduProLIC operational reality.
- If your actual shard-provider naming format differs from `<collection>-<shard>`, adjust the sharded `match` blocks.

## Collections intentionally treated as internal-only

- CRM pipeline collections (`crm_leads`, `crm_accounts`, `crm_contacts`, `crm_opportunities`, `crm_documents`, `crm_messages`, `crm_notes`)
- Client record collections (`clients`, `clientContacts`, `clientActivities`, `clientNotes`)
- Finance ledger/config collections (`finance_accounts`, `finance_periods`, `share_rules`, `finance_transactions`, `payments`, `refunds`, `expenses`, `journal_entries`, `journal_lines`)

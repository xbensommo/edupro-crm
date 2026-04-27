# EduProLIC CRM App

This CRM is no longer treated as a generic lead-and-pipeline starter.
It is now positioned as the **EduProLIC operations hub** that sits between:

- client-records
- consultant assignment
- consultant-editor review
- notifications
- finance handoff

## What this CRM now does

## Current packaged cleanup status

This packaged CRM was cleaned up to match the current Totistack direction:

- `index.js` now exports `crm_files` from `collections/` instead of a non-existent `definitions/` path.
- `services.js` now points at `services/crmService.js`, which is the source of truth.
- legacy duplicate service files and duplicate collection-definition copies were removed from this packaged version to reduce assembly confusion.


- creates client-linked work records
- assigns work to consultants
- supports consultant accept or deny flow
- supports final delivery submissions
- exposes review-ready fields for consultant-editor and admin
- emits in-app notifications through the latest notifications feature collections
- feeds finance by creating draft finance feeder records and consultant payout records

## Collections actively used

- `engagements`
- `crm_files`
- `crm_activities`
- `crm_messages`
- linked `clients`
- linked `notifications`
- linked `finance_transactions`
- linked `consultant_payouts`

## EduProLIC-specific workflow

1. receptionist or admin creates client work
2. consultant is assigned
3. consultant accepts or denies
4. consultant submits final delivery
5. consultant-editor or admin reviews
6. receptionist or admin delivers to client and logs payment in finance
7. finance continues from the CRM handoff records

## What should be removed from this module

These files represent the older generic CRM starter surface and should be removed from the final codebase once you finish migration and confirm nothing imports them:

### Generic pages to remove
- `pages/CrmAccountsPage.vue`
- `pages/CrmContactsPage.vue`
- `pages/CrmDocumentsPage.vue`
- `pages/CrmLeadDetailPage.vue`
- `pages/CrmLeadsPage.vue`
- `pages/CrmOpportunitiesPage.vue`
- `pages/CrmPipelinePage.vue`
- `pages/CrmRecordsPage.vue`
- `pages/CrmReportsPage.vue`
- `pages/CrmRulesPage.vue`
- `pages/CrmSearchPage.vue`
- `pages/CrmTasksPage.vue`
- `pages/LeadDetailPage.vue`
- `pages/LeadsListPage.vue`
- `pages/OpportunitiesListPage.vue`

### Generic collections to remove from the final EduProLIC CRM module
- `collections/crm_accounts.definitions.js`
- `collections/crm_assignment_rules.definitions.js`
- `collections/crm_attachments.definitions.js`
- `collections/crm_automation_rules.definitions.js`
- `collections/crm_contacts.definitions.js`
- `collections/crm_documents.definitions.js`
- `collections/crm_leads.definitions.js`
- `collections/crm_notes.definitions.js`
- `collections/crm_opportunities.definitions.js`
- `collections/crm_saved_views.definitions.js`
- `collections/crm_tasks.definitions.js`

### Duplicate or older service files to remove
- `services/_crmService.js`
- `services/crm.service.js`

Keep `services/crmService.js` as the source of truth.

## Integration notes

### Notifications feature
This CRM writes notifications into the latest notifications feature collection shape using:
- `notifications`
- event labels such as `work.assigned`, `work.assignment.accepted`, `work.assignment.denied`, and `work.final.submitted`

### Finance app
This CRM feeds finance using:
- `finance_transactions`
- `consultant_payouts`

That means CRM becomes the operational source and finance remains the accounting/reporting layer.

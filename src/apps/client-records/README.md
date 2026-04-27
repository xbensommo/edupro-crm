# EduProLIC Client Records

Real client intake module for EduProLIC.

This version is **not supposed to post directly into finance**. That would be the wrong boundary.

## Correct integration boundaries

- **Client Records** owns client intake and profile history
- **CRM** owns work / engagements linked to the client
- **Finance** owns receivables, payments, expenses, commissions, and reports
- **Notifications** receives client-record events when a client is created or materially updated

## What this version now does

- stores real EduProLIC client profile fields
- links client detail to CRM work creation using the selected client
- shows CRM-linked work and due balances on the client detail page
- emits in-app notifications on client create/update when the notifications feature is installed
- keeps finance visibility read-only from linked work summaries instead of writing fake finance rows

## What should be removed

Delete these old demo/starter leftovers after merge:

- `services/_clientService.js`
- any old generic docs describing this module as a reusable demo starter
- any route permissions still using short keys like `clients.read` instead of `client_records.clients.read`

## Why client-records should not write finance directly

Client Records knows **who the client is**.
It does **not** own payment truth.
Payments come after work delivery and are logged through CRM/finance flows.

So the right path is:

`client-records -> crm engagements -> finance`

not:

`client-records -> finance`

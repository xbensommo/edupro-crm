# EduProLIC Email Template Patch

## Files

```text
functions/config.js
functions/emailTemplates.js
public/brand/edupro-logo.png
```

## Logo rule

Email clients cannot render a local file path from Firebase Functions. The logo must be a public HTTPS URL.

Recommended setup:

```bash
# Copy public/brand/edupro-logo.png into your Firebase Hosting/public folder.
firebase deploy --only hosting
```

Then set:

```bash
firebase functions:config:set brand.logo_url="https://www.eduprolic.com/brand/edupro-logo.png"
```

If your functions use plain environment variables, set:

```env
BRAND_LOGO_URL=https://www.eduprolic.com/brand/edupro-logo.png
APP_DOMAIN=https://www.eduprolic.com
BRAND_EMAIL=info@eduprolic.com
BRAND_PHONE=+264 81 448 9950
BRAND_ADDRESS=Windhoek, Namibia
```

## Required worker call

Your email worker should call:

```js
const { renderEmailTemplate } = require('./emailTemplates.js')
const rendered = renderEmailTemplate(templateKey, variables)
await sendEmail({ to, subject: rendered.subject, html: rendered.html, text: rendered.text })
```

## Added templates

- crm.work.assigned
- crm.assignment.accepted
- crm.assignment.denied
- crm.work.reassigned
- crm.final_delivery.submitted
- crm.review.approved
- crm.review.denied
- crm.revision.submitted
- crm.engagement.completed
- crm.engagement.cancelled
- finance.quotation.ready
- finance.quotation.accepted
- finance.invoice.issued
- finance.invoice.overdue
- finance.payment.received
- finance.receipt.ready
- finance.commission.deducted
- finance.commission.paid
- documents.generated
- documents.failed
- auth.user.invited
- auth.user.suspended
- auth.role.changed
- client.welcome
- client.followup.required
- system.digest
- system.alert

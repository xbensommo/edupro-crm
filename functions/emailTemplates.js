/**
 * @file functions/emailTemplates.js
 * @description Production EduProLIC email templates for Firebase Functions.
 *
 * Design notes:
 * - Uses inline CSS because email clients strip component CSS.
 * - Uses absolute public logo URL from BRAND.logoUrl.
 * - Escapes all dynamic text values.
 * - Keeps templates event-key based so the notification queue can render emails
 *   without CRM/finance/auth knowing about HTML.
 */

const { BRAND } = require('./config.js')

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function stripHtml(value) {
  return String(value ?? '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function resolveActionUrl(actionUrl) {
  if (!actionUrl) return BRAND.website
  if (/^https?:\/\//i.test(actionUrl)) return actionUrl
  return `${BRAND.website.replace(/\/$/, '')}/${String(actionUrl).replace(/^\//, '')}`
}

function formatCurrency(value, currency = 'NAD') {
  if (value === undefined || value === null || value === '') return ''
  const number = Number(value)
  if (Number.isNaN(number)) return String(value)
  return `${currency} ${number.toLocaleString('en-NA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function asLines(lines = []) {
  return lines.filter(Boolean).join('')
}

function paragraph(text, options = {}) {
  const weight = options.strong ? 'font-weight:700;' : ''
  const color = options.muted ? BRAND.colors.muted : BRAND.colors.text
  return `<p style="margin:0 0 16px;color:${color};font-size:15px;line-height:1.7;${weight}">${escapeHtml(text)}</p>`
}

function mutedText(text) {
  return `<p style="margin:0;color:${BRAND.colors.muted};font-size:12px;line-height:1.6;">${escapeHtml(text)}</p>`
}

function detailsTable(rows = []) {
  const visibleRows = rows.filter((row) => row && row[1] !== undefined && row[1] !== null && String(row[1]).trim() !== '')
  if (!visibleRows.length) return ''

  const body = visibleRows
    .map(([label, value]) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid ${BRAND.colors.border};color:${BRAND.colors.muted};font-size:12px;text-transform:uppercase;letter-spacing:.08em;width:38%;vertical-align:top;">${escapeHtml(label)}</td>
        <td style="padding:10px 0;border-bottom:1px solid ${BRAND.colors.border};color:${BRAND.colors.text};font-size:14px;font-weight:700;vertical-align:top;">${escapeHtml(value)}</td>
      </tr>`)
    .join('')

  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:22px 0 24px;">${body}</table>`
}

function noticeBox(title, message, tone = 'info') {
  const colorMap = {
    info: BRAND.colors.secondary,
    success: BRAND.colors.success,
    warning: BRAND.colors.warning,
    danger: BRAND.colors.danger,
  }
  const color = colorMap[tone] || colorMap.info

  return `
    <div style="margin:24px 0;padding:18px 20px;border-left:4px solid ${color};background:${BRAND.colors.bg};">
      <p style="margin:0 0 6px;color:${color};font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;">${escapeHtml(title)}</p>
      <p style="margin:0;color:${BRAND.colors.text};font-size:14px;line-height:1.65;">${escapeHtml(message)}</p>
    </div>`
}

function actionButton(actionUrl, actionLabel) {
  if (!actionUrl && !actionLabel) return ''
  const href = resolveActionUrl(actionUrl)
  return `
    <div style="margin:32px 0;text-align:center;">
      <a href="${escapeHtml(href)}" style="background:${BRAND.colors.primary};color:${BRAND.colors.white};text-decoration:none;padding:15px 26px;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;display:inline-block;border-radius:0;">${escapeHtml(actionLabel || 'Open EduProLIC')}</a>
    </div>`
}

function logoBlock() {
  return `
    <div style="margin:0 0 22px;text-align:center;">
      <img src="${escapeHtml(BRAND.logoUrl)}" alt="${escapeHtml(BRAND.brandLine)}" width="220" style="display:inline-block;max-width:220px;width:70%;height:auto;border:0;outline:none;text-decoration:none;" />
    </div>`
}

function wrapLayout({ title, eyebrow = 'EduProLIC System Notification', body, actionUrl, actionLabel, previewText, tone = 'default' }) {
  const safeTitle = escapeHtml(title || 'EduProLIC notification')
  const toneColor = {
    default: BRAND.colors.primary,
    info: BRAND.colors.secondary,
    success: BRAND.colors.success,
    warning: BRAND.colors.warning,
    danger: BRAND.colors.danger,
  }[tone] || BRAND.colors.primary

  return `<!doctype html>
<html lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeTitle}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.colors.bg};font-family:Arial,Helvetica,sans-serif;color:${BRAND.colors.text};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(previewText || title || 'EduProLIC notification')}</div>

  <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:${BRAND.colors.bg};padding:34px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:680px;background:${BRAND.colors.surface};border:1px solid ${BRAND.colors.border};border-collapse:separate;box-shadow:0 28px 70px rgba(13,27,42,.10);">
          <tr>
            <td style="background:${BRAND.colors.secondary};padding:34px 36px 28px;border-bottom:5px solid ${BRAND.colors.primary};">
              ${logoBlock()}
              <p style="margin:0 0 10px;color:${BRAND.colors.primaryLight};font-size:11px;font-weight:800;letter-spacing:.22em;text-transform:uppercase;text-align:center;">${escapeHtml(eyebrow)}</p>
              <h1 style="margin:0;color:${BRAND.colors.white};font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:1.18;font-weight:500;text-align:center;">${safeTitle}</h1>
            </td>
          </tr>

          <tr>
            <td style="padding:36px 38px 28px;">
              <div style="height:3px;width:58px;background:${toneColor};margin:0 0 24px;"></div>
              ${body || ''}
              ${actionButton(actionUrl, actionLabel)}
              ${mutedText('This message was generated by the EduProLIC internal system. Do not forward operational records outside authorized EduProLIC channels.')}
            </td>
          </tr>

          <tr>
            <td style="background:${BRAND.colors.secondarySoft};padding:24px 36px;color:${BRAND.colors.white};">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
                <tr>
                  <td style="vertical-align:top;">
                    <p style="margin:0 0 6px;font-size:13px;font-weight:800;color:${BRAND.colors.primaryLight};letter-spacing:.08em;text-transform:uppercase;">${escapeHtml(BRAND.companyName)}</p>
                    <p style="margin:0;color:#E5E1DA;font-size:12px;line-height:1.6;">${escapeHtml(BRAND.brandLine)}<br/>${escapeHtml(BRAND.slogan)}</p>
                  </td>
                  <td style="vertical-align:top;text-align:right;">
                    <p style="margin:0;color:#E5E1DA;font-size:12px;line-height:1.6;">${escapeHtml(BRAND.address)}<br/>${escapeHtml(BRAND.phone)}<br/><a href="mailto:${escapeHtml(BRAND.email)}" style="color:${BRAND.colors.primaryLight};text-decoration:none;">${escapeHtml(BRAND.email)}</a></p>
                  </td>
                </tr>
              </table>
              <p style="margin:22px 0 0;color:#B8B0A7;font-size:10px;letter-spacing:.12em;text-transform:uppercase;text-align:center;">Powered by <a href="${escapeHtml(BRAND.poweredByUrl)}" style="color:#B8B0A7;text-decoration:underline;">${escapeHtml(BRAND.poweredByName)}</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

const templates = {
  'crm.work.assigned': (data) => wrapLayout({
    title: 'New work assigned',
    eyebrow: 'CRM Assignment',
    actionUrl: data.actionUrl,
    actionLabel: 'Review assignment',
    previewText: 'A new EduProLIC work item requires your acceptance or denial.',
    body: asLines([
      paragraph(`You have been assigned ${data.entityLabel || 'a work item'}. Review the brief, then accept or deny the assignment from your dashboard.`, { strong: true }),
      detailsTable([
        ['Client', data.clientName],
        ['Work', data.entityLabel],
        ['Due date', data.dueDate],
        ['Assigned by', data.actorName],
        ['Priority', data.priority],
      ]),
      noticeBox('Required action', 'Accept or deny the assignment before starting work. This keeps workload ownership auditable.', 'info'),
    ]),
  }),

  'crm.assignment.accepted': (data) => wrapLayout({
    title: 'Assignment accepted',
    eyebrow: 'CRM Assignment',
    actionUrl: data.actionUrl,
    actionLabel: 'Open work item',
    previewText: 'The assigned consultant accepted the work item.',
    tone: 'success',
    body: asLines([
      paragraph(`${data.actorName || 'The consultant'} accepted ${data.entityLabel || 'the assigned work item'}.`),
      detailsTable([
        ['Client', data.clientName],
        ['Work', data.entityLabel],
        ['Consultant', data.consultantName || data.actorName],
        ['Accepted at', data.acceptedAt],
      ]),
    ]),
  }),

  'crm.assignment.denied': (data) => wrapLayout({
    title: 'Assignment denied — reassignment required',
    eyebrow: 'CRM Assignment',
    actionUrl: data.actionUrl,
    actionLabel: 'Reassign work',
    previewText: 'A consultant denied an EduProLIC assignment. Reassignment is required.',
    tone: 'warning',
    body: asLines([
      paragraph(`${data.actorName || 'A consultant'} denied ${data.entityLabel || 'an assignment'}. Assign the work to another consultant.`),
      detailsTable([
        ['Client', data.clientName],
        ['Work', data.entityLabel],
        ['Consultant', data.consultantName || data.actorName],
        ['Reason', data.denialReason],
      ]),
      noticeBox('Operational risk', 'Do not leave this work item unassigned. It will stall client delivery.', 'warning'),
    ]),
  }),

  'crm.work.reassigned': (data) => wrapLayout({
    title: 'Work reassigned',
    eyebrow: 'CRM Assignment',
    actionUrl: data.actionUrl,
    actionLabel: 'Review reassignment',
    previewText: 'An EduProLIC work item was reassigned.',
    body: asLines([
      paragraph(`${data.entityLabel || 'A work item'} was reassigned to ${data.consultantName || 'a consultant'}.`),
      detailsTable([
        ['Client', data.clientName],
        ['Work', data.entityLabel],
        ['Previous consultant', data.previousConsultantName],
        ['New consultant', data.consultantName],
        ['Reassigned by', data.actorName],
      ]),
    ]),
  }),

  'crm.final_delivery.submitted': (data) => wrapLayout({
    title: 'Final work submitted for review',
    eyebrow: 'Editorial Review',
    actionUrl: data.actionUrl,
    actionLabel: 'Review final work',
    previewText: 'A final EduProLIC submission is waiting for editorial review.',
    body: asLines([
      paragraph(`${data.actorName || 'A consultant'} submitted final work for ${data.entityLabel || 'a work item'}. Editorial review is now required.`, { strong: true }),
      detailsTable([
        ['Client', data.clientName],
        ['Work', data.entityLabel],
        ['Consultant', data.consultantName || data.actorName],
        ['Submitted at', data.submittedAt],
      ]),
      noticeBox('Review required', 'Approve only if the final work is client-ready. If not, return it with internal notes.', 'info'),
    ]),
  }),

  'crm.review.approved': (data) => wrapLayout({
    title: 'Final work approved',
    eyebrow: 'Editorial Review',
    actionUrl: data.actionUrl,
    actionLabel: 'Open approved work',
    previewText: 'Final work was approved by editorial review.',
    tone: 'success',
    body: asLines([
      paragraph(`${data.entityLabel || 'The submitted work'} was approved by ${data.actorName || 'the editor'}.`),
      detailsTable([
        ['Client', data.clientName],
        ['Work', data.entityLabel],
        ['Editor', data.actorName],
        ['Approved at', data.reviewedAt],
      ]),
    ]),
  }),

  'crm.review.denied': (data) => wrapLayout({
    title: 'Work returned for revision',
    eyebrow: 'Editorial Review',
    actionUrl: data.actionUrl,
    actionLabel: 'Open revision notes',
    previewText: 'Your submitted work was returned for revision.',
    tone: 'danger',
    body: asLines([
      paragraph(`${data.entityLabel || 'Your submitted work'} was returned for revision. Apply the editor notes before resubmitting.`, { strong: true }),
      detailsTable([
        ['Client', data.clientName],
        ['Work', data.entityLabel],
        ['Editor', data.actorName],
        ['Deduction', data.deductionLabel],
        ['Notes', data.editorNotes],
      ]),
    ]),
  }),

  'crm.revision.submitted': (data) => wrapLayout({
    title: 'Revision submitted',
    eyebrow: 'Editorial Review',
    actionUrl: data.actionUrl,
    actionLabel: 'Review revision',
    previewText: 'A revised EduProLIC work item is ready for review.',
    body: asLines([
      paragraph(`${data.actorName || 'A consultant'} submitted a revision for ${data.entityLabel || 'a work item'}.`),
      detailsTable([
        ['Client', data.clientName],
        ['Work', data.entityLabel],
        ['Consultant', data.consultantName || data.actorName],
        ['Submitted at', data.submittedAt],
      ]),
    ]),
  }),

  'crm.engagement.completed': (data) => wrapLayout({
    title: 'Engagement completed',
    eyebrow: 'CRM Engagement',
    actionUrl: data.actionUrl,
    actionLabel: 'Open engagement',
    previewText: 'An EduProLIC engagement has been completed.',
    tone: 'success',
    body: asLines([
      paragraph(`${data.entityLabel || 'An engagement'} was marked as completed.`),
      detailsTable([
        ['Client', data.clientName],
        ['Engagement', data.entityLabel],
        ['Completed by', data.actorName],
        ['Completed at', data.completedAt],
      ]),
    ]),
  }),

  'crm.engagement.cancelled': (data) => wrapLayout({
    title: 'Engagement cancelled',
    eyebrow: 'CRM Engagement',
    actionUrl: data.actionUrl,
    actionLabel: 'Open engagement',
    previewText: 'An EduProLIC engagement was cancelled.',
    tone: 'warning',
    body: asLines([
      paragraph(`${data.entityLabel || 'An engagement'} was cancelled.`),
      detailsTable([
        ['Client', data.clientName],
        ['Engagement', data.entityLabel],
        ['Cancelled by', data.actorName],
        ['Reason', data.reason],
      ]),
    ]),
  }),

  'finance.quotation.ready': (data) => wrapLayout({
    title: 'Quotation ready',
    eyebrow: 'Finance',
    actionUrl: data.actionUrl || data.quotationUrl,
    actionLabel: 'Open quotation',
    previewText: 'An EduProLIC quotation is ready.',
    body: asLines([
      paragraph(`A quotation has been prepared for ${data.clientName || 'the client'}.`),
      detailsTable([
        ['Quotation', data.quotationNumber || data.entityLabel],
        ['Client', data.clientName],
        ['Amount', data.amountLabel || formatCurrency(data.amount, data.currency)],
        ['Valid until', data.validUntil],
      ]),
    ]),
  }),

  'finance.quotation.accepted': (data) => wrapLayout({
    title: 'Quotation accepted',
    eyebrow: 'Finance',
    actionUrl: data.actionUrl,
    actionLabel: 'Open quotation',
    previewText: 'A client accepted an EduProLIC quotation.',
    tone: 'success',
    body: asLines([
      paragraph(`${data.clientName || 'A client'} accepted ${data.quotationNumber || 'a quotation'}.`),
      detailsTable([
        ['Quotation', data.quotationNumber || data.entityLabel],
        ['Client', data.clientName],
        ['Amount', data.amountLabel || formatCurrency(data.amount, data.currency)],
      ]),
    ]),
  }),

  'finance.invoice.issued': (data) => wrapLayout({
    title: 'Invoice issued',
    eyebrow: 'Finance',
    actionUrl: data.actionUrl || data.invoiceUrl,
    actionLabel: 'Open invoice',
    previewText: 'An EduProLIC invoice has been issued.',
    body: asLines([
      paragraph(`Invoice ${data.invoiceNumber || data.entityLabel || ''} has been issued.`),
      detailsTable([
        ['Invoice', data.invoiceNumber || data.entityLabel],
        ['Client', data.clientName],
        ['Amount', data.amountLabel || formatCurrency(data.amount, data.currency)],
        ['Due date', data.dueDate],
      ]),
    ]),
  }),

  'finance.invoice.overdue': (data) => wrapLayout({
    title: 'Invoice overdue',
    eyebrow: 'Finance',
    actionUrl: data.actionUrl,
    actionLabel: 'Open invoice',
    previewText: 'An EduProLIC invoice is overdue.',
    tone: 'warning',
    body: asLines([
      paragraph(`Invoice ${data.invoiceNumber || data.entityLabel || ''} is overdue and requires follow-up.`, { strong: true }),
      detailsTable([
        ['Invoice', data.invoiceNumber || data.entityLabel],
        ['Client', data.clientName],
        ['Amount due', data.amountDueLabel || formatCurrency(data.amountDue ?? data.amount, data.currency)],
        ['Due date', data.dueDate],
      ]),
    ]),
  }),

  'finance.payment.received': (data) => wrapLayout({
    title: 'Payment received',
    eyebrow: 'Finance',
    actionUrl: data.actionUrl,
    actionLabel: 'Open payment',
    previewText: 'A payment was recorded in EduProLIC finance.',
    tone: 'success',
    body: asLines([
      paragraph(`Payment was recorded for ${data.clientName || 'a client'}.`),
      detailsTable([
        ['Client', data.clientName],
        ['Amount', data.amountLabel || formatCurrency(data.amount, data.currency)],
        ['Reference', data.reference],
        ['Received by', data.actorName],
      ]),
    ]),
  }),

  'finance.receipt.ready': (data) => wrapLayout({
    title: 'Receipt ready',
    eyebrow: 'Finance',
    actionUrl: data.actionUrl || data.receiptUrl,
    actionLabel: 'Open receipt',
    previewText: 'An EduProLIC receipt is ready.',
    tone: 'success',
    body: asLines([
      paragraph(`Receipt ${data.receiptNumber || data.entityLabel || ''} is ready.`),
      detailsTable([
        ['Receipt', data.receiptNumber || data.entityLabel],
        ['Client', data.clientName],
        ['Amount', data.amountLabel || formatCurrency(data.amount, data.currency)],
      ]),
    ]),
  }),

  'finance.commission.deducted': (data) => wrapLayout({
    title: 'Commission deduction applied',
    eyebrow: 'Consultant Finance',
    actionUrl: data.actionUrl,
    actionLabel: 'Open finance record',
    previewText: 'A deduction was applied to an EduProLIC commission record.',
    tone: 'warning',
    body: asLines([
      paragraph(`A deduction was applied to ${data.entityLabel || 'your commission record'}.`),
      detailsTable([
        ['Work', data.entityLabel],
        ['Deduction', data.deductionLabel],
        ['Amount due', data.amountDueLabel || formatCurrency(data.amountDue, data.currency)],
        ['Reason', data.reason],
      ]),
    ]),
  }),

  'finance.commission.paid': (data) => wrapLayout({
    title: 'Commission paid',
    eyebrow: 'Consultant Finance',
    actionUrl: data.actionUrl,
    actionLabel: 'Open finance record',
    previewText: 'An EduProLIC consultant commission has been marked as paid.',
    tone: 'success',
    body: asLines([
      paragraph('Your commission has been marked as paid.'),
      detailsTable([
        ['Work', data.entityLabel],
        ['Amount paid', data.amountPaidLabel || formatCurrency(data.amountPaid, data.currency)],
        ['Payment date', data.paymentDate],
      ]),
    ]),
  }),

  'documents.generated': (data) => wrapLayout({
    title: 'Document generated',
    eyebrow: 'Documents',
    actionUrl: data.actionUrl || data.documentUrl,
    actionLabel: 'Open document',
    previewText: 'An EduProLIC document has been generated.',
    tone: 'success',
    body: asLines([
      paragraph(`${data.documentName || data.entityLabel || 'A document'} has been generated and stored.`),
      detailsTable([
        ['Document', data.documentName || data.entityLabel],
        ['Type', data.documentType],
        ['Generated by', data.actorName],
      ]),
    ]),
  }),

  'documents.failed': (data) => wrapLayout({
    title: 'Document generation failed',
    eyebrow: 'Documents',
    actionUrl: data.actionUrl,
    actionLabel: 'Open failed record',
    previewText: 'An EduProLIC document failed to generate.',
    tone: 'danger',
    body: asLines([
      paragraph(`${data.documentName || data.entityLabel || 'A document'} failed to generate. Review the error before retrying.`, { strong: true }),
      detailsTable([
        ['Document', data.documentName || data.entityLabel],
        ['Type', data.documentType],
        ['Error', data.errorMessage],
      ]),
    ]),
  }),

  'auth.user.invited': (data) => wrapLayout({
    title: 'You were invited to EduProLIC',
    eyebrow: 'Account Access',
    actionUrl: data.actionUrl || data.inviteUrl,
    actionLabel: 'Accept invitation',
    previewText: 'You have been invited to access EduProLIC.',
    body: asLines([
      paragraph(`${data.actorName || 'EduProLIC'} invited you to join EduProLIC as ${data.roleName || 'a user'}.`, { strong: true }),
      detailsTable([
        ['Role', data.roleName],
        ['Invited by', data.actorName],
        ['Expires', data.expiresAt],
      ]),
      noticeBox('Security note', 'Use this invitation only if you expected access to the EduProLIC internal system.', 'info'),
    ]),
  }),

  'auth.user.suspended': (data) => wrapLayout({
    title: 'EduProLIC account suspended',
    eyebrow: 'Account Access',
    previewText: 'Your EduProLIC system access has been suspended.',
    tone: 'danger',
    body: asLines([
      paragraph('Your EduProLIC system access has been suspended. Contact administration if this is unexpected.', { strong: true }),
      detailsTable([
        ['Account', data.email],
        ['Suspended by', data.actorName],
        ['Reason', data.reason],
      ]),
    ]),
  }),

  'auth.role.changed': (data) => wrapLayout({
    title: 'System role updated',
    eyebrow: 'Account Access',
    actionUrl: data.actionUrl,
    actionLabel: 'Open account',
    previewText: 'An EduProLIC user role was changed.',
    body: asLines([
      paragraph(`${data.userName || 'A user'} had their system role updated.`),
      detailsTable([
        ['User', data.userName || data.email],
        ['Previous role', data.previousRole],
        ['New role', data.newRole],
        ['Updated by', data.actorName],
      ]),
    ]),
  }),

  'client.welcome': (data) => wrapLayout({
    title: 'Welcome to EduProLIC',
    eyebrow: 'Client Services',
    actionUrl: data.actionUrl,
    actionLabel: data.actionLabel || 'Open EduProLIC',
    previewText: 'Welcome to EduProLIC Tutors & Writers.',
    body: asLines([
      paragraph(`Hello ${data.clientName || data.fullName || 'there'}, welcome to EduProLIC.`, { strong: true }),
      paragraph('Your request or client record has been received. Our team will handle the next step through the official EduProLIC workflow.'),
      detailsTable([
        ['Service', data.serviceName],
        ['Reference', data.reference || data.entityLabel],
      ]),
    ]),
  }),

  'client.followup.required': (data) => wrapLayout({
    title: 'Client follow-up required',
    eyebrow: 'Client Services',
    actionUrl: data.actionUrl,
    actionLabel: 'Open client record',
    previewText: 'A client requires follow-up in EduProLIC.',
    tone: 'warning',
    body: asLines([
      paragraph(`${data.clientName || 'A client'} requires follow-up.`),
      detailsTable([
        ['Client', data.clientName],
        ['Service', data.serviceName],
        ['Reason', data.reason],
        ['Owner', data.ownerName],
      ]),
    ]),
  }),

  'system.digest': (data) => wrapLayout({
    title: data.title || 'EduProLIC daily summary',
    eyebrow: 'System Digest',
    actionUrl: data.actionUrl || '/notifications',
    actionLabel: data.actionLabel || 'Open notification center',
    previewText: 'EduProLIC system summary.',
    body: asLines([
      paragraph(data.message || 'Here is the latest EduProLIC system summary.'),
      detailsTable([
        ['New assignments', data.newAssignments],
        ['Pending reviews', data.pendingReviews],
        ['Overdue invoices', data.overdueInvoices],
        ['Failed emails', data.failedEmails],
      ]),
    ]),
  }),

  'system.alert': (data) => wrapLayout({
    title: data.title || 'EduProLIC notification',
    eyebrow: data.eyebrow || 'System Alert',
    actionUrl: data.actionUrl,
    actionLabel: data.actionLabel,
    previewText: data.message || data.title || 'EduProLIC notification',
    tone: data.tone || 'default',
    body: asLines([
      paragraph(data.message || 'You have a new notification.'),
      detailsTable(data.details || []),
    ]),
  }),
}

const subjectMap = Object.freeze({
  'crm.work.assigned': 'New EduProLIC work assigned',
  'crm.assignment.accepted': 'EduProLIC assignment accepted',
  'crm.assignment.denied': 'EduProLIC assignment denied — reassignment required',
  'crm.work.reassigned': 'EduProLIC work reassigned',
  'crm.final_delivery.submitted': 'EduProLIC final work submitted for review',
  'crm.review.approved': 'EduProLIC work approved',
  'crm.review.denied': 'EduProLIC work returned for revision',
  'crm.revision.submitted': 'EduProLIC revision submitted',
  'crm.engagement.completed': 'EduProLIC engagement completed',
  'crm.engagement.cancelled': 'EduProLIC engagement cancelled',
  'finance.quotation.ready': 'EduProLIC quotation ready',
  'finance.quotation.accepted': 'EduProLIC quotation accepted',
  'finance.invoice.issued': 'EduProLIC invoice issued',
  'finance.invoice.overdue': 'EduProLIC invoice overdue',
  'finance.payment.received': 'EduProLIC payment received',
  'finance.receipt.ready': 'EduProLIC receipt ready',
  'finance.commission.deducted': 'EduProLIC commission deduction applied',
  'finance.commission.paid': 'EduProLIC commission paid',
  'documents.generated': 'EduProLIC document generated',
  'documents.failed': 'EduProLIC document generation failed',
  'auth.user.invited': 'EduProLIC account invitation',
  'auth.user.suspended': 'EduProLIC account suspended',
  'auth.role.changed': 'EduProLIC role updated',
  'client.welcome': 'Welcome to EduProLIC',
  'client.followup.required': 'EduProLIC client follow-up required',
  'system.digest': 'EduProLIC system summary',
  'system.alert': 'EduProLIC notification',
})

function renderEmailTemplate(templateKey, data = {}) {
  const key = templates[templateKey] ? templateKey : 'system.alert'
  const subject = data.subject || subjectMap[key] || 'EduProLIC notification'
  const html = templates[key]({ ...data, title: data.title || subject })

  return {
    subject,
    html,
    text: stripHtml(`${subject}\n${data.message || data.entityLabel || data.clientName || ''}`),
  }
}

/**
 * Compatibility object for old-style imports. Prefer renderEmailTemplate().
 */
const emailTemplates = Object.freeze({
  genericNotice: (title, message, actionUrl) => templates['system.alert']({ title, message, actionUrl }),
  welcomeClient: (user) => templates['client.welcome']({
    clientName: user?.fullName || user?.clientName,
    email: user?.email,
    actionUrl: user?.actionUrl,
  }),
  quoteReady: (data, quoteUrl) => templates['finance.quotation.ready']({
    ...data,
    quotationUrl: quoteUrl,
    actionUrl: quoteUrl,
  }),
})

module.exports = {
  renderEmailTemplate,
  templates,
  subjectMap,
  emailTemplates,
}

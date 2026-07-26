/**
 * @file src/apps/finance/services/createFinanceCommandBus.js
 * @description EduProLIC finance command layer with invoices, allocations, audit, and ledger posting.
 */

import { FINANCE_ACTIONS, canFinance, requireFinance, userIdOf } from '../permissions/finance.permissions.js'
import { createPostedJournalEntry, createReversalJournalEntry } from './financePostingEngine.js'
import { invariant } from './financeErrors.js'

function nowIso() {
  return new Date().toISOString()
}

function createCode(prefix) {
  const stamp = Date.now().toString(36)
  const random = Math.random().toString(36).slice(2, 6)
  return `${prefix}_${stamp}${random}`.toUpperCase()
}

function toAmount(value) {
  return Number(Number(value || 0).toFixed(2))
}

function shardDateOptions(value) {
  return value ? { shardDate: value } : {}
}

function actorNameOf(user) {
  return user?.displayName || user?.fullName || user?.email || ''
}

function requirePositiveAmount(value, code, label) {
  const amount = toAmount(value)
  invariant(amount > 0, `${label} must be greater than zero.`, { code })
  return amount
}

function normalizeLineItem(line = {}, index = 0) {
  const quantity = Number(line.quantity || 1)
  const unitPrice = toAmount(line.unitPrice ?? line.price ?? line.amount)
  const discountAmount = toAmount(line.discountAmount || 0)
  const taxAmount = toAmount(line.taxAmount || 0)
  const totalAmount = toAmount((quantity * unitPrice) - discountAmount + taxAmount)

  invariant(String(line.description || '').trim(), 'Invoice line description is required.', { code: 'FINANCE_INVOICE_LINE_DESCRIPTION_REQUIRED' })
  invariant(quantity > 0, 'Invoice line quantity must be greater than zero.', { code: 'FINANCE_INVOICE_LINE_QUANTITY_REQUIRED' })
  invariant(unitPrice >= 0, 'Invoice line unit price cannot be negative.', { code: 'FINANCE_INVOICE_LINE_PRICE_INVALID' })

  return {
    description: String(line.description).trim(),
    quantity,
    unitPrice,
    discountAmount,
    taxAmount,
    totalAmount,
    accountId: line.accountId || null,
    serviceCode: line.serviceCode || null,
    sortOrder: Number(line.sortOrder ?? index),
  }
}
 
function normalizeInvoicePayload(payload = {}, actor = null) {
  invariant(payload.clientId, 'clientId is required to create an invoice.', { code: 'FINANCE_INVOICE_CLIENT_REQUIRED' })
  const lineItems = Array.isArray(payload.lineItems) && payload.lineItems.length
    ? payload.lineItems.map(normalizeLineItem)
    : [normalizeLineItem({ description: payload.description || payload.memo || 'Service fee', quantity: 1, unitPrice: payload.amount || payload.totalAmount }, 0)]

  const subtotalAmount = toAmount(lineItems.reduce((sum, line) => sum + (line.quantity * line.unitPrice), 0))
  const discountAmount = toAmount(payload.discountAmount ?? lineItems.reduce((sum, line) => sum + line.discountAmount, 0))
  const taxAmount = toAmount(payload.taxAmount ?? lineItems.reduce((sum, line) => sum + line.taxAmount, 0))
  const totalAmount = requirePositiveAmount(payload.totalAmount ?? (subtotalAmount - discountAmount + taxAmount), 'FINANCE_INVOICE_TOTAL_REQUIRED', 'Invoice total')
  const allocatedAmount = toAmount(payload.allocatedAmount || payload.paidAmount || 0)
  const balanceAmount = toAmount(Math.max(totalAmount - allocatedAmount, 0))

  return {
    invoiceCode: payload.invoiceCode || createCode('INV'),
    clientId: payload.clientId,
    clientLabel: payload.clientLabel || null,
    engagementId: payload.engagementId || null,
    engagementCode: payload.engagementCode || null,
    status: payload.status || 'draft',
    issueDate: payload.issueDate || nowIso(),
    dueDate: payload.dueDate || null,
    currency: payload.currency || 'NAD',
    subtotalAmount,
    discountAmount,
    taxAmount,
    totalAmount,
    allocatedAmount,
    paidAmount: allocatedAmount,
    balanceAmount,
    lineItems,
    notes: payload.notes || payload.memo || null,
    terms: payload.terms || null,
    sourceModule: payload.sourceModule || null,
    sourceId: payload.sourceId || null,
    createdByUserId: userIdOf(actor),
  }
}

function defaultTransactionPayload(payload, type, actor) {
  return {
    type,
    status: 'draft',
    reference: payload.reference || null,
    memo: payload.memo || payload.notes || payload.reason || null,
    occurredOn: payload.occurredOn || payload.issueDate || payload.paymentDate || payload.refundDate || payload.expenseDate || payload.payoutDate || nowIso(),
    amount: toAmount(payload.amount || payload.totalAmount || payload.paidAmount || payload.consultantShareAmount || payload.grossServiceAmount || 0),
    currency: payload.currency || 'NAD',
    clientId: payload.clientId || null,
    clientLabel: payload.clientLabel || null,
    consultantId: payload.consultantId || null,
    consultantLabel: payload.consultantLabel || null,
    engagementId: payload.engagementId || null,
    engagementCode: payload.engagementCode || null,
    sourceRef: payload.sourceRef || null,
    invoiceId: payload.invoiceId || null,
    invoiceCode: payload.invoiceCode || null,
    paymentId: payload.paymentId || null,
    refundId: payload.refundId || null,
    expenseId: payload.expenseId || null,
    consultantPayoutId: payload.consultantPayoutId || null,
    consultantShareAmount: toAmount(payload.consultantShareAmount || 0),
    deductionAmount: toAmount(payload.deductionAmount || 0),
    accountOverrides: payload.accountOverrides || null,
    lines: payload.lines || null,
    createdBy: userIdOf(actor),
  }
}

function notificationRecipients(transaction, extra = {}) {
  const recipients = []
  if (Array.isArray(extra.recipients) && extra.recipients.length) return extra.recipients
  ;['admin', 'receptionist'].forEach((role) => recipients.push({ user_id: role }))
  if (transaction?.consultantId && extra.notifyConsultant !== false) recipients.push({ user_id: transaction.consultantId })
  return recipients
}

async function emitNotification(repositories, payload) {
  if (!repositories?.notifications?.add) return null

  const writes = (payload.recipients || []).map((recipient) => repositories.notifications.add({
    user_id: recipient.user_id || recipient.id || recipient.uid,
    title: payload.title,
    message: payload.message,
    event: payload.event,
    type: 'finance',
    domain: 'finance',
    sourceModule: 'finance',
    channel: 'in_app',
    status: 'unread',
    priority: payload.priority || 'high',
    actionUrl: payload.actionUrl || '/finance',
    actionLabel: payload.actionLabel || 'Open finance',
    isActionRequired: Boolean(payload.isActionRequired),
    entityType: payload.entityType || 'finance_transaction',
    entityId: payload.entityId || null,
    entityLabel: payload.entityLabel || '',
    actorId: payload.actorId || null,
    actorName: payload.actorName || '',
    meta: payload.meta || {},
    createdAt: payload.createdAt || nowIso(),
    updatedAt: payload.updatedAt || nowIso(),
  }))

  return Promise.allSettled(writes)
}

export function createFinanceCommandBus({ repositories, confirm, getCurrentUser, postEntry = createPostedJournalEntry, reverseEntry = createReversalJournalEntry }) {
  invariant(typeof confirm === 'function', 'Finance confirm handler is required.', {
    code: 'FINANCE_CONFIRM_HANDLER_REQUIRED',
  })

  function currentUser() {
    return typeof getCurrentUser === 'function' ? getCurrentUser() : null
  }

  async function confirmOrReturn(payload, audit = null) {
    const accepted = await confirm(payload)
    if (accepted) return null
    if (audit) await writeAudit({ ...audit, outcome: 'cancelled' })
    return { status: 'cancelled' }
  }

  async function writeAudit(payload = {}) {
    if (!repositories?.auditLogs?.add) return null
    const actor = payload.actor || currentUser()
    return repositories.auditLogs.add({
      auditCode: payload.auditCode || createCode('AUD'),
      action: payload.action,
      entityType: payload.entityType,
      entityId: payload.entityId || null,
      entityLabel: payload.entityLabel || null,
      outcome: payload.outcome || 'success',
      actorId: payload.actorId || userIdOf(actor),
      actorName: payload.actorName || actorNameOf(actor),
      reason: payload.reason || null,
      occurredAt: payload.occurredAt || nowIso(),
      before: payload.before || null,
      after: payload.after || null,
      meta: payload.meta || {},
      requestId: payload.requestId || null,
      sourceModule: 'finance',
    })
  }

  async function notifyFinanceOps(event, entity, actor, extra = {}) {
    return emitNotification(repositories, {
      event,
      title: extra.title || 'Finance update',
      message: extra.message || entity?.memo || entity?.notes || 'Finance record updated.',
      entityType: extra.entityType || 'finance_transaction',
      entityId: entity?.id || extra.entityId || null,
      entityLabel: entity?.reference || entity?.invoiceCode || entity?.paymentCode || entity?.engagementCode || entity?.memo || '',
      actionUrl: extra.actionUrl || '/finance/transactions',
      actionLabel: extra.actionLabel || 'Open finance',
      actorId: userIdOf(actor),
      actorName: actorNameOf(actor),
      meta: extra.meta || {},
      recipients: notificationRecipients(entity, extra),
      isActionRequired: Boolean(extra.isActionRequired),
    })
  }

  async function createTransaction(type, payload = {}) {
    const user = currentUser()
    requireFinance(user, FINANCE_ACTIONS.TRANSACTION_CREATE)
    invariant(repositories?.transactions?.add, 'Transactions repository is required.', { code: 'FINANCE_TRANSACTIONS_REPOSITORY_REQUIRED' })
    const transaction = await repositories.transactions.add(defaultTransactionPayload(payload, type, user))
    await writeAudit({ action: `transaction.${type}.create`, entityType: 'finance_transaction', entityId: transaction.id, entityLabel: transaction.reference, actor: user, after: transaction })
    return transaction
  }

  return {
    async createWorkRevenueTransaction(payload) {
      return createTransaction('work_revenue', payload)
    },

    async accrueConsultantCommission(payload) {
      return createTransaction('consultant_commission_accrual', payload)
    },

    async recordCommissionDeduction(payload) {
      return createTransaction('commission_deduction', payload)
    },

    async createInvoice(payload = {}) {
      const user = currentUser()
      requireFinance(user, FINANCE_ACTIONS.INVOICE_CREATE)
      invariant(repositories?.invoices?.add, 'Invoices repository is required.', { code: 'FINANCE_INVOICES_REPOSITORY_REQUIRED' })
      const invoicePayload = normalizeInvoicePayload(payload, user)
      const invoice = await repositories.invoices.add(invoicePayload)

      if (repositories?.invoiceItems?.add) {
        await Promise.all(invoicePayload.lineItems.map((line) => repositories.invoiceItems.add({
          invoiceId: invoice.id,
          invoiceCode: invoice.invoiceCode,
          clientId: invoice.clientId,
          engagementId: invoice.engagementId,
          ...line,
        })))
      }

      await writeAudit({ action: 'invoice.create', entityType: 'invoice', entityId: invoice.id, entityLabel: invoice.invoiceCode, actor: user, after: invoice })
      return invoice
    },

    async issueInvoice(invoiceId, options = {}) {
      const user = currentUser()
      requireFinance(user, FINANCE_ACTIONS.INVOICE_ISSUE)
      invariant(repositories?.invoices?.getById, 'Invoices repository is required.', { code: 'FINANCE_INVOICES_REPOSITORY_REQUIRED' })
      invariant(repositories?.transactions?.add, 'Transactions repository is required.', { code: 'FINANCE_TRANSACTIONS_REPOSITORY_REQUIRED' })

      const invoice = await repositories.invoices.getById(invoiceId, shardDateOptions(options.shardDate))
      invariant(invoice, 'Invoice not found.', { code: 'FINANCE_INVOICE_NOT_FOUND', meta: { invoiceId } })
      invariant(invoice.status === 'draft', 'Only draft invoices can be issued.', { code: 'FINANCE_INVALID_INVOICE_STATE', meta: { status: invoice.status } })

      const cancelled = await confirmOrReturn(
        { title: 'Issue invoice', message: 'This creates the receivable transaction for the client invoice.', confirmText: 'Issue invoice', tone: 'danger' },
        { action: 'invoice.issue', entityType: 'invoice', entityId: invoiceId, entityLabel: invoice.invoiceCode, actor: user, before: invoice },
      )
      if (cancelled) return cancelled

      const issuedAt = nowIso()
      const transaction = await repositories.transactions.add(defaultTransactionPayload({
        reference: invoice.invoiceCode,
        memo: options.memo || invoice.notes || `Invoice ${invoice.invoiceCode}`,
        occurredOn: invoice.issueDate || issuedAt,
        sourceRef: invoice.invoiceCode,
        amount: invoice.totalAmount,
        totalAmount: invoice.totalAmount,
        currency: invoice.currency,
        clientId: invoice.clientId,
        clientLabel: invoice.clientLabel,
        engagementId: invoice.engagementId,
        engagementCode: invoice.engagementCode,
        invoiceId: invoice.id,
        invoiceCode: invoice.invoiceCode,
      }, 'work_revenue', user))

      const nextInvoice = await repositories.invoices.update(invoiceId, {
        status: 'issued',
        issuedAt,
        issuedByUserId: userIdOf(user),
        financeTransactionId: transaction.id,
      }, shardDateOptions(invoice.issueDate))

      await writeAudit({ action: 'invoice.issue', entityType: 'invoice', entityId: invoiceId, entityLabel: invoice.invoiceCode, actor: user, before: invoice, after: nextInvoice })
      await notifyFinanceOps('finance.invoice.issued', nextInvoice, user, { entityType: 'invoice', actionUrl: '/finance/invoices', actionLabel: 'Open invoices' })
      return { status: 'issued', invoice: nextInvoice, transaction }
    },

    async cancelInvoice(invoiceId, options = {}) {
      const user = currentUser()
      requireFinance(user, FINANCE_ACTIONS.INVOICE_CANCEL)
      const invoice = await repositories.invoices.getById(invoiceId, shardDateOptions(options.shardDate))
      invariant(invoice, 'Invoice not found.', { code: 'FINANCE_INVOICE_NOT_FOUND', meta: { invoiceId } })
      invariant(['draft', 'issued'].includes(invoice.status), 'Only draft or issued invoices can be cancelled.', { code: 'FINANCE_INVALID_INVOICE_STATE', meta: { status: invoice.status } })
      invariant(toAmount(invoice.allocatedAmount || invoice.paidAmount) === 0, 'Paid or allocated invoices cannot be cancelled. Reverse allocations first.', { code: 'FINANCE_INVOICE_HAS_ALLOCATIONS' })

      if (invoice.financeTransactionId && repositories?.transactions?.getById) {
        const transaction = await repositories.transactions.getById(invoice.financeTransactionId, shardDateOptions(invoice.issueDate))
        invariant(!transaction || ['draft', 'reviewed', 'cancelled'].includes(transaction.status), 'Posted invoice transactions must be reversed before cancelling the invoice.', { code: 'FINANCE_INVOICE_TRANSACTION_POSTED' })
      }

      const cancelled = await confirmOrReturn(
        { title: 'Cancel invoice', message: 'This cancels the invoice before money is allocated to it.', confirmText: 'Cancel invoice', tone: 'danger' },
        { action: 'invoice.cancel', entityType: 'invoice', entityId: invoiceId, entityLabel: invoice.invoiceCode, actor: user, before: invoice, reason: options.reason || null },
      )
      if (cancelled) return cancelled

      const patch = {
        status: 'cancelled',
        cancelledAt: nowIso(),
        cancelledByUserId: userIdOf(user),
        cancellationReason: options.reason || 'Cancelled by finance user',
      }
      const nextInvoice = await repositories.invoices.update(invoiceId, patch, shardDateOptions(invoice.issueDate))
      if (invoice.financeTransactionId && repositories?.transactions?.update) {
        await repositories.transactions.update(invoice.financeTransactionId, { status: 'cancelled' }, shardDateOptions(invoice.issueDate))
      }
      await writeAudit({ action: 'invoice.cancel', entityType: 'invoice', entityId: invoiceId, entityLabel: invoice.invoiceCode, actor: user, before: invoice, after: nextInvoice, reason: patch.cancellationReason })
      await notifyFinanceOps('finance.invoice.cancelled', nextInvoice, user, { entityType: 'invoice', actionUrl: '/finance/invoices', actionLabel: 'Open invoices' })
      return { status: 'cancelled', invoiceId }
    },

    async allocatePaymentToInvoice(payload = {}) {
      const user = currentUser()
      requireFinance(user, FINANCE_ACTIONS.PAYMENT_ALLOCATE)
      invariant(repositories?.paymentAllocations?.add, 'Payment allocations repository is required.', { code: 'FINANCE_ALLOCATIONS_REPOSITORY_REQUIRED' })
      invariant(repositories?.payments?.getById, 'Payments repository is required.', { code: 'FINANCE_PAYMENTS_REPOSITORY_REQUIRED' })
      invariant(repositories?.invoices?.getById, 'Invoices repository is required.', { code: 'FINANCE_INVOICES_REPOSITORY_REQUIRED' })

      const payment = await repositories.payments.getById(payload.paymentId, shardDateOptions(payload.paymentShardDate || payload.paymentDate))
      const invoice = await repositories.invoices.getById(payload.invoiceId, shardDateOptions(payload.invoiceShardDate || payload.issueDate))
      invariant(payment, 'Payment not found.', { code: 'FINANCE_PAYMENT_NOT_FOUND', meta: { paymentId: payload.paymentId } })
      invariant(invoice, 'Invoice not found.', { code: 'FINANCE_INVOICE_NOT_FOUND', meta: { invoiceId: payload.invoiceId } })
      invariant(!['cancelled'].includes(invoice.status), 'Cannot allocate payment to a cancelled invoice.', { code: 'FINANCE_INVOICE_NOT_ALLOCATABLE' })

      const amount = requirePositiveAmount(payload.amount, 'FINANCE_ALLOCATION_AMOUNT_REQUIRED', 'Allocation amount')
      const currentInvoiceAllocated = toAmount(invoice.allocatedAmount || invoice.paidAmount || 0)
      const invoiceBalance = toAmount(invoice.balanceAmount ?? Math.max(toAmount(invoice.totalAmount) - currentInvoiceAllocated, 0))
      invariant(amount <= invoiceBalance, 'Allocation amount exceeds invoice balance.', { code: 'FINANCE_ALLOCATION_EXCEEDS_INVOICE_BALANCE', meta: { amount, invoiceBalance } })

      const currentPaymentAllocated = toAmount(payment.allocatedAmount || 0)
      const paymentUnapplied = toAmount(payment.unappliedAmount ?? Math.max(toAmount(payment.amount) - currentPaymentAllocated, 0))
      invariant(amount <= paymentUnapplied, 'Allocation amount exceeds unapplied payment amount.', { code: 'FINANCE_ALLOCATION_EXCEEDS_PAYMENT_BALANCE', meta: { amount, paymentUnapplied } })

      const cancelled = await confirmOrReturn(
        { title: 'Allocate payment', message: 'This applies received money to an issued invoice and changes the client balance.', confirmText: 'Allocate payment', tone: 'danger' },
        { action: 'payment.allocate', entityType: 'invoice', entityId: invoice.id, entityLabel: invoice.invoiceCode, actor: user, before: { invoice, payment } },
      )
      if (cancelled) return cancelled

      const allocation = await repositories.paymentAllocations.add({
        allocationCode: payload.allocationCode || createCode('ALLOC'),
        paymentId: payment.id,
        paymentCode: payment.paymentCode || null,
        invoiceId: invoice.id,
        invoiceCode: invoice.invoiceCode || null,
        clientId: invoice.clientId,
        engagementId: invoice.engagementId || payment.engagementId || null,
        amount,
        currency: payload.currency || payment.currency || invoice.currency || 'NAD',
        allocatedAt: payload.allocatedAt || nowIso(),
        allocatedByUserId: userIdOf(user),
        status: 'active',
        notes: payload.notes || null,
      })

      const nextInvoiceAllocated = toAmount(currentInvoiceAllocated + amount)
      const nextInvoiceBalance = toAmount(Math.max(toAmount(invoice.totalAmount) - nextInvoiceAllocated, 0))
      const nextInvoiceStatus = nextInvoiceBalance === 0 ? 'paid' : 'partially_paid'
      const nextPaymentAllocated = toAmount(currentPaymentAllocated + amount)
      const nextPaymentUnapplied = toAmount(Math.max(toAmount(payment.amount) - nextPaymentAllocated, 0))

      const nextInvoice = await repositories.invoices.update(invoice.id, {
        allocatedAmount: nextInvoiceAllocated,
        paidAmount: nextInvoiceAllocated,
        balanceAmount: nextInvoiceBalance,
        status: nextInvoiceStatus,
      }, shardDateOptions(invoice.issueDate))

      await repositories.payments.update(payment.id, {
        allocatedAmount: nextPaymentAllocated,
        unappliedAmount: nextPaymentUnapplied,
        status: nextPaymentUnapplied === 0 ? 'allocated' : 'partially_allocated',
      }, shardDateOptions(payment.paymentDate))

      await writeAudit({ action: 'payment.allocate', entityType: 'payment_allocation', entityId: allocation.id, entityLabel: allocation.allocationCode, actor: user, before: { invoice, payment }, after: { allocation, invoice: nextInvoice } })
      await notifyFinanceOps('finance.payment.allocated', nextInvoice, user, { entityType: 'invoice', actionUrl: '/finance/receivables', actionLabel: 'Open receivables' })
      return { status: 'allocated', allocation, invoice: nextInvoice }
    },

    //async logClientPayment(payload) {
    async logClientPayment(payload, options = { autoAllocate: false }) {
      const user = currentUser()
      requireFinance(user, FINANCE_ACTIONS.PAYMENT_LOG)
      invariant(repositories?.payments?.add, 'Payments repository is required.', { code: 'FINANCE_PAYMENTS_REPOSITORY_REQUIRED' })
      invariant(repositories?.transactions?.add, 'Transactions repository is required.', { code: 'FINANCE_TRANSACTIONS_REPOSITORY_REQUIRED' })
      invariant(payload.clientId, 'clientId is required to log a payment.', { code: 'FINANCE_PAYMENT_CLIENT_REQUIRED' })
      invariant(payload.engagementId, 'engagementId is required to log a payment.', { code: 'FINANCE_PAYMENT_ENGAGEMENT_REQUIRED' })

      const amount = requirePositiveAmount(payload.amount, 'FINANCE_PAYMENT_AMOUNT_REQUIRED', 'Payment amount')
      const payment = await repositories.payments.add({
        paymentCode: payload.paymentCode || createCode('PAY'),
        clientId: payload.clientId,
        clientLabel: payload.clientLabel || null,
        engagementId: payload.engagementId,
        engagementCode: payload.engagementCode || null,
        paymentType: payload.paymentType || 'client_payment',
        amount,
        allocatedAmount: toAmount(payload.allocatedAmount || 0),
        unappliedAmount: toAmount(payload.unappliedAmount ?? amount),
        currency: payload.currency || 'NAD',
        paymentMethod: payload.paymentMethod || 'bank_transfer',
        paymentDate: payload.paymentDate || nowIso(),
        referenceNumber: payload.referenceNumber || null,
        receivedByUserId: userIdOf(user),
        status: payload.status || 'received',
        proofFileId: payload.proofFileId || null,
        notes: payload.notes || null,
      })

      const transaction = await repositories.transactions.add(defaultTransactionPayload({
        ...payload,
        reference: payment.paymentCode,
        memo: payload.memo || payload.notes || `Payment ${payment.paymentCode}`,
        occurredOn: payment.paymentDate,
        sourceRef: payment.paymentCode,
        amount: payment.amount,
        paymentId: payment.id,
      }, 'client_payment', user))

      await repositories.payments.update(payment.id, { financeTransactionId: transaction.id }, shardDateOptions(payment.paymentDate))
      await writeAudit({ action: 'payment.log', entityType: 'payment', entityId: payment.id, entityLabel: payment.paymentCode, actor: user, after: { payment, transaction } })
      await notifyFinanceOps('finance.payment.logged', payment, user, { entityType: 'payment', actionUrl: '/finance/payments', actionLabel: 'Open payments' });


      // Auto-allocate if requested
      if (options.autoAllocate && allocatePaymentToInvoice) {
        try {
          await allocatePaymentToInvoice({ paymentId: payment.id, invoiceId: null, amount: payment.amount, notes: 'Auto-allocation on payment log' })
        } catch (allocError) {
          console.warn('Auto-allocation failed:', allocError.message)
        }
      }

      return { payment, transaction }
    },

    async recordRefund(payload) {
      const user = currentUser()
      requireFinance(user, FINANCE_ACTIONS.REFUND_MANAGE)
      invariant(repositories?.refunds?.add, 'Refunds repository is required.', { code: 'FINANCE_REFUNDS_REPOSITORY_REQUIRED' })
      invariant(repositories?.transactions?.add, 'Transactions repository is required.', { code: 'FINANCE_TRANSACTIONS_REPOSITORY_REQUIRED' })
      invariant(payload.clientId, 'clientId is required to record a refund.', { code: 'FINANCE_REFUND_CLIENT_REQUIRED' })
      invariant(payload.engagementId, 'engagementId is required to record a refund.', { code: 'FINANCE_REFUND_ENGAGEMENT_REQUIRED' })

      const amount = requirePositiveAmount(payload.amount, 'FINANCE_REFUND_AMOUNT_REQUIRED', 'Refund amount')
      const refund = await repositories.refunds.add({
        refundCode: payload.refundCode || createCode('REF'),
        clientId: payload.clientId,
        clientLabel: payload.clientLabel || null,
        engagementId: payload.engagementId,
        engagementCode: payload.engagementCode || null,
        paymentId: payload.paymentId || null,
        paymentCode: payload.paymentCode || null,
        amount,
        currency: payload.currency || 'NAD',
        reason: payload.reason || payload.notes || null,
        refundMethod: payload.refundMethod || 'bank_transfer',
        referenceNumber: payload.referenceNumber || null,
        refundDate: payload.refundDate || nowIso(),
        approvedByUserId: payload.approvedByUserId || userIdOf(user),
        processedByUserId: payload.processedByUserId || userIdOf(user),
        status: payload.status || 'processed',
      })

      const transaction = await repositories.transactions.add(defaultTransactionPayload({
        ...payload,
        reference: refund.refundCode,
        memo: payload.memo || payload.reason || `Refund ${refund.refundCode}`,
        occurredOn: refund.refundDate,
        sourceRef: refund.refundCode,
        amount: refund.amount,
        refundId: refund.id,
      }, 'refund', user))

      await repositories.refunds.update(refund.id, { financeTransactionId: transaction.id }, shardDateOptions(refund.refundDate))
      await writeAudit({ action: 'refund.record', entityType: 'refund', entityId: refund.id, entityLabel: refund.refundCode, actor: user, after: { refund, transaction } })
      await notifyFinanceOps('finance.refund.recorded', refund, user, { entityType: 'refund', actionUrl: '/finance/refunds', actionLabel: 'Open refunds' })
      return { refund, transaction }
    },

    async recordExpense(payload) {
      const user = currentUser()
      requireFinance(user, FINANCE_ACTIONS.EXPENSE_MANAGE)
      invariant(repositories?.expenses?.add, 'Expenses repository is required.', { code: 'FINANCE_EXPENSES_REPOSITORY_REQUIRED' })
      invariant(repositories?.transactions?.add, 'Transactions repository is required.', { code: 'FINANCE_TRANSACTIONS_REPOSITORY_REQUIRED' })

      const amount = requirePositiveAmount(payload.amount, 'FINANCE_EXPENSE_AMOUNT_REQUIRED', 'Expense amount')
      const expense = await repositories.expenses.add({
        expenseCode: payload.expenseCode || createCode('EXP'),
        expenseDate: payload.expenseDate || nowIso(),
        category: payload.category,
        description: payload.description,
        vendorName: payload.vendorName || null,
        amount,
        currency: payload.currency || 'NAD',
        paymentMethod: payload.paymentMethod || 'bank_transfer',
        referenceNumber: payload.referenceNumber || null,
        relatedUserId: payload.relatedUserId || null,
        relatedEngagementId: payload.relatedEngagementId || payload.engagementId || null,
        approvedByUserId: payload.approvedByUserId || userIdOf(user),
        recordedByUserId: userIdOf(user),
        status: payload.status || 'recorded',
        receiptFileId: payload.receiptFileId || null,
      })

      const transaction = await repositories.transactions.add(defaultTransactionPayload({
        ...payload,
        reference: expense.expenseCode,
        memo: payload.memo || payload.description,
        occurredOn: expense.expenseDate,
        sourceRef: expense.expenseCode,
        amount: expense.amount,
        expenseId: expense.id,
        accountOverrides: payload.accountOverrides || null,
      }, 'expense', user))

      await repositories.expenses.update(expense.id, { financeTransactionId: transaction.id }, shardDateOptions(expense.expenseDate))
      await writeAudit({ action: 'expense.record', entityType: 'expense', entityId: expense.id, entityLabel: expense.expenseCode, actor: user, after: { expense, transaction } })
      await notifyFinanceOps('finance.expense.recorded', expense, user, { entityType: 'expense', actionUrl: '/finance/expenses', actionLabel: 'Open expenses' })
      return { expense, transaction }
    },

    async recordConsultantPayout(payload) {
      const user = currentUser()
      requireFinance(user, FINANCE_ACTIONS.PAYOUT_MANAGE)
      invariant(repositories?.consultantPayouts?.add, 'Consultant payouts repository is required.', { code: 'FINANCE_PAYOUTS_REPOSITORY_REQUIRED' })
      invariant(repositories?.transactions?.add, 'Transactions repository is required.', { code: 'FINANCE_TRANSACTIONS_REPOSITORY_REQUIRED' })

      const consultantShareAmount = requirePositiveAmount(payload.consultantShareAmount || payload.paidAmount, 'FINANCE_PAYOUT_AMOUNT_REQUIRED', 'Payout amount')
      const paidAmount = toAmount(payload.paidAmount || consultantShareAmount)
      const grossServiceAmount = toAmount(payload.grossServiceAmount || consultantShareAmount)
      const companyShareAmount = toAmount(payload.companyShareAmount || Math.max(grossServiceAmount - consultantShareAmount, 0))
      const balanceAmount = toAmount(payload.balanceAmount || Math.max(consultantShareAmount - paidAmount, 0))

      const payout = await repositories.consultantPayouts.add({
        payoutCode: payload.payoutCode || createCode('PAYOUT'),
        consultantId: payload.consultantId,
        consultantLabel: payload.consultantLabel || null,
        clientId: payload.clientId,
        clientLabel: payload.clientLabel || null,
        engagementId: payload.engagementId,
        engagementCode: payload.engagementCode || null,
        shareRuleId: payload.shareRuleId || null,
        grossServiceAmount,
        consultantShareAmount,
        companyShareAmount,
        paidAmount,
        balanceAmount,
        payoutDate: payload.payoutDate || nowIso(),
        status: payload.status || (balanceAmount > 0 ? 'partially_paid' : 'paid'),
        paymentMethod: payload.paymentMethod || 'bank_transfer',
        referenceNumber: payload.referenceNumber || null,
        notes: payload.notes || null,
      })

      const transaction = await repositories.transactions.add(defaultTransactionPayload({
        ...payload,
        reference: payout.payoutCode,
        memo: payload.memo || payload.notes || `Consultant payout ${payout.payoutCode}`,
        occurredOn: payout.payoutDate,
        sourceRef: payout.payoutCode,
        amount: paidAmount,
        consultantPayoutId: payout.id,
        consultantShareAmount,
      }, 'consultant_payout', user))

      await repositories.consultantPayouts.update(payout.id, { financeTransactionId: transaction.id }, shardDateOptions(payout.payoutDate))
      await writeAudit({ action: 'payout.record', entityType: 'consultant_payout', entityId: payout.id, entityLabel: payout.payoutCode, actor: user, after: { payout, transaction } })
      await notifyFinanceOps('finance.payout.recorded', payout, user, { entityType: 'consultant_payout', actionUrl: '/finance/payouts', actionLabel: 'Open payouts' })
      return { payout, transaction }
    },

    async settleConsultantPayout(payoutId, payload = {}) {
      const user = currentUser()
      requireFinance(user, FINANCE_ACTIONS.PAYOUT_MANAGE)
      invariant(repositories?.consultantPayouts?.getById, 'Consultant payouts repository is required.', { code: 'FINANCE_PAYOUTS_REPOSITORY_REQUIRED' })
      invariant(repositories?.transactions?.add, 'Transactions repository is required.', { code: 'FINANCE_TRANSACTIONS_REPOSITORY_REQUIRED' })

      const payout = await repositories.consultantPayouts.getById(payoutId, shardDateOptions(payload.shardDate || payload.payoutDate || payload.existingPayoutDate))
      invariant(payout, 'Consultant payout not found.', { code: 'FINANCE_PAYOUT_NOT_FOUND', meta: { payoutId } })

      const settlementAmount = requirePositiveAmount(payload.amount || payload.paidAmount || payout.balanceAmount, 'FINANCE_PAYOUT_SETTLEMENT_AMOUNT_REQUIRED', 'Settlement amount')
      const currentPaid = toAmount(payout.paidAmount || 0)
      const consultantShareAmount = toAmount(payout.consultantShareAmount || payout.grossServiceAmount || 0)
      const nextPaid = toAmount(currentPaid + settlementAmount)
      invariant(nextPaid <= consultantShareAmount, 'Settlement amount exceeds payout balance.', { code: 'FINANCE_PAYOUT_SETTLEMENT_EXCEEDS_BALANCE', meta: { payoutId, settlementAmount, consultantShareAmount } })

      const cancelled = await confirmOrReturn(
        { title: 'Settle consultant payout', message: 'This records money paid to a consultant and affects finance reports.', confirmText: 'Settle payout', tone: 'danger' },
        { action: 'payout.settle', entityType: 'consultant_payout', entityId: payoutId, entityLabel: payout.payoutCode, actor: user, before: payout },
      )
      if (cancelled) return cancelled

      const nextBalance = toAmount(Math.max(consultantShareAmount - nextPaid, 0))
      const nextStatus = payload.status || (nextBalance > 0 ? 'partially_paid' : 'paid')
      const payoutDate = payload.payoutDate || payout.payoutDate || nowIso()

      const transaction = await repositories.transactions.add(defaultTransactionPayload({
        reference: payout.payoutCode,
        memo: payload.memo || payload.notes || `Consultant payout settlement ${payout.payoutCode}`,
        occurredOn: payoutDate,
        amount: settlementAmount,
        currency: payload.currency || payout.currency || 'NAD',
        clientId: payout.clientId,
        clientLabel: payout.clientLabel,
        consultantId: payout.consultantId,
        consultantLabel: payout.consultantLabel,
        engagementId: payout.engagementId,
        engagementCode: payout.engagementCode,
        sourceRef: payout.payoutCode,
        consultantPayoutId: payoutId,
        consultantShareAmount,
      }, 'consultant_payout', user))

      const nextPayout = await repositories.consultantPayouts.update(payoutId, {
        payoutDate,
        paidAmount: nextPaid,
        balanceAmount: nextBalance,
        status: nextStatus,
        paymentMethod: payload.paymentMethod || payout.paymentMethod || 'bank_transfer',
        referenceNumber: payload.referenceNumber || payout.referenceNumber || null,
        notes: payload.notes || payout.notes || null,
        financeTransactionId: transaction.id,
      }, shardDateOptions(payout.payoutDate || payoutDate))

      await writeAudit({ action: 'payout.settle', entityType: 'consultant_payout', entityId: payoutId, entityLabel: payout.payoutCode, actor: user, before: payout, after: nextPayout })
      await notifyFinanceOps('finance.payout.settled', nextPayout, user, { entityType: 'consultant_payout', actionUrl: '/finance/payouts', actionLabel: 'Open payouts' })
      return { status: nextStatus, payoutId, transaction }
    },

    async reviewTransaction(transactionId, options = {}) {
      const user = currentUser()
      requireFinance(user, FINANCE_ACTIONS.TRANSACTION_REVIEW)
      const transaction = await repositories.transactions.getById(transactionId, shardDateOptions(options.shardDate))
      invariant(transaction, 'Transaction not found.', { code: 'FINANCE_TRANSACTION_NOT_FOUND', meta: { transactionId } })
      invariant(transaction.status === 'draft', 'Only draft transactions can be reviewed.', { code: 'FINANCE_INVALID_TRANSACTION_STATE', meta: { status: transaction.status } })
      const next = await repositories.transactions.update(transactionId, { status: 'reviewed', reviewedAt: nowIso(), reviewedBy: userIdOf(user) }, shardDateOptions(options.shardDate || transaction.occurredOn))
      await writeAudit({ action: 'transaction.review', entityType: 'finance_transaction', entityId: transactionId, entityLabel: transaction.reference, actor: user, before: transaction, after: next })
      return { status: 'reviewed', transactionId }
    },

    async postTransaction(transactionId, options = {}) {
      const user = currentUser()
      requireFinance(user, FINANCE_ACTIONS.TRANSACTION_POST)
      const transaction = await repositories.transactions.getById(transactionId, shardDateOptions(options.shardDate))
      invariant(transaction, 'Transaction not found.', { code: 'FINANCE_TRANSACTION_NOT_FOUND', meta: { transactionId } })
      invariant(['draft', 'reviewed'].includes(transaction.status), 'Only draft or reviewed transactions can be posted.', { code: 'FINANCE_INVALID_TRANSACTION_STATE', meta: { status: transaction.status } })

      const cancelled = await confirmOrReturn(
        { title: 'Post transaction', message: 'This will create a ledger entry and affect reports and balances.', confirmText: 'Post transaction', tone: 'danger' },
        { action: 'transaction.post', entityType: 'finance_transaction', entityId: transactionId, entityLabel: transaction.reference, actor: user, before: transaction },
      )
      if (cancelled) return cancelled

      const entry = postEntry({ transaction, actor: user })
      await repositories.journalEntries.add(entry)
      const nextTransaction = await repositories.transactions.update(transactionId, { status: 'posted', postedAt: entry.postedAt, postedBy: userIdOf(user), postedJournalEntryId: entry.id }, shardDateOptions(transaction.occurredOn))

      if (transaction.invoiceId && repositories?.invoices?.update) {
        await repositories.invoices.update(transaction.invoiceId, { postedJournalEntryId: entry.id }, shardDateOptions(transaction.occurredOn))
      }
      if (transaction.paymentId && repositories?.payments?.update) {
        await repositories.payments.update(transaction.paymentId, { journalEntryId: entry.id, status: 'posted' }, shardDateOptions(transaction.occurredOn))
      }
      if (transaction.refundId && repositories?.refunds?.update) {
        await repositories.refunds.update(transaction.refundId, { journalEntryId: entry.id, status: 'processed', financeTransactionId: transactionId }, shardDateOptions(transaction.occurredOn))
      }
      if (transaction.expenseId && repositories?.expenses?.update) {
        await repositories.expenses.update(transaction.expenseId, { journalEntryId: entry.id, status: 'posted' }, shardDateOptions(transaction.occurredOn))
      }
      if (transaction.consultantPayoutId && repositories?.consultantPayouts?.update) {
        const payout = await repositories.consultantPayouts.getById(transaction.consultantPayoutId, shardDateOptions(transaction.occurredOn))
        const nextStatus = Number(payout?.balanceAmount || 0) > 0 ? 'partially_paid' : 'paid'
        await repositories.consultantPayouts.update(transaction.consultantPayoutId, { journalEntryId: entry.id, status: nextStatus }, shardDateOptions(payout?.payoutDate || transaction.occurredOn))
      }

      await writeAudit({ action: 'transaction.post', entityType: 'finance_transaction', entityId: transactionId, entityLabel: transaction.reference, actor: user, before: transaction, after: { transaction: nextTransaction, journalEntry: entry } })
      await notifyFinanceOps('finance.transaction.posted', nextTransaction, user)
      return { status: 'posted', transactionId, journalEntryId: entry.id }
    },

    async reverseJournalEntry(entryId, options = {}) {
      const user = currentUser()
      requireFinance(user, FINANCE_ACTIONS.JOURNAL_REVERSE)
      const postedEntry = await repositories.journalEntries.getById(entryId, shardDateOptions(options.shardDate))
      invariant(postedEntry, 'Journal entry not found.', { code: 'FINANCE_JOURNAL_ENTRY_NOT_FOUND', meta: { entryId } })
      invariant(postedEntry.status === 'posted', 'Only posted entries can be reversed.', { code: 'FINANCE_INVALID_JOURNAL_STATE', meta: { status: postedEntry.status } })

      const cancelled = await confirmOrReturn(
        { title: 'Reverse journal entry', message: 'This creates a reversal entry and keeps the audit trail intact.', confirmText: 'Reverse entry', tone: 'danger' },
        { action: 'journal.reverse', entityType: 'finance_journal_entry', entityId: entryId, entityLabel: postedEntry.reference, actor: user, before: postedEntry, reason: options.reason || 'Manual reversal' },
      )
      if (cancelled) return cancelled

      const reversal = reverseEntry({ postedEntry, actor: user, reason: options.reason || 'Manual reversal' })
      await repositories.journalEntries.add(reversal)
      await repositories.journalEntries.update(entryId, { reversedEntryId: reversal.id }, shardDateOptions(postedEntry.postedAt))
      if (postedEntry.transactionId) {
        await repositories.transactions.update(postedEntry.transactionId, { status: 'reversed', reversedAt: reversal.postedAt, reversalJournalEntryId: reversal.id }, shardDateOptions(options.transactionShardDate || postedEntry.postedAt))
      }

      await writeAudit({ action: 'journal.reverse', entityType: 'finance_journal_entry', entityId: entryId, entityLabel: postedEntry.reference, actor: user, before: postedEntry, after: reversal, reason: options.reason || 'Manual reversal' })
      await notifyFinanceOps('finance.journal.reversed', postedEntry, user, { entityType: 'finance_journal_entry', actionUrl: '/finance/transactions', actionLabel: 'Open transactions' })
      return { status: 'reversed', entryId, reversalEntryId: reversal.id }
    },

    async deleteDraftTransaction(transactionId, options = {}) {
      const user = currentUser()
      requireFinance(user, FINANCE_ACTIONS.TRANSACTION_DELETE_DRAFT)
      const transaction = await repositories.transactions.getById(transactionId, shardDateOptions(options.shardDate))
      invariant(transaction, 'Transaction not found.', { code: 'FINANCE_TRANSACTION_NOT_FOUND', meta: { transactionId } })
      invariant(transaction.status === 'draft', 'Only draft transactions can be deleted.', { code: 'FINANCE_INVALID_TRANSACTION_STATE', meta: { status: transaction.status } })
      invariant(typeof repositories.transactions.remove === 'function', 'Draft delete repository method is missing.', { code: 'FINANCE_DELETE_METHOD_REQUIRED' })
      const cancelled = await confirmOrReturn(
        { title: 'Delete draft transaction', message: 'This removes the draft before it reaches the ledger.', confirmText: 'Delete draft', tone: 'danger' },
        { action: 'transaction.delete_draft', entityType: 'finance_transaction', entityId: transactionId, entityLabel: transaction.reference, actor: user, before: transaction },
      )
      if (cancelled) return cancelled
      await repositories.transactions.remove(transactionId, shardDateOptions(transaction.occurredOn))
      await writeAudit({ action: 'transaction.delete_draft', entityType: 'finance_transaction', entityId: transactionId, entityLabel: transaction.reference, actor: user, before: transaction })
      return { status: 'deleted', transactionId }
    },

    async closePeriod(periodId) {
      const user = currentUser()
      requireFinance(user, FINANCE_ACTIONS.PERIOD_CLOSE)
      invariant(repositories.periods, 'Periods repository is required to close a period.', { code: 'FINANCE_PERIODS_REPOSITORY_REQUIRED' })
      const period = await repositories.periods.getById(periodId)
      invariant(period, 'Period not found.', { code: 'FINANCE_PERIOD_NOT_FOUND', meta: { periodId } })
      invariant(period.status === 'open', 'Only open periods can be closed.', { code: 'FINANCE_INVALID_PERIOD_STATE', meta: { status: period.status } })
      const cancelled = await confirmOrReturn(
        { title: 'Close accounting period', message: 'Closing a period locks operational posting for that range.', confirmText: 'Close period', tone: 'danger' },
        { action: 'period.close', entityType: 'finance_period', entityId: periodId, entityLabel: period.periodKey, actor: user, before: period },
      )
      if (cancelled) return cancelled
      const next = await repositories.periods.update(periodId, { status: 'closed', closedAt: nowIso(), closedBy: userIdOf(user) })
      await writeAudit({ action: 'period.close', entityType: 'finance_period', entityId: periodId, entityLabel: period.periodKey, actor: user, before: period, after: next })
      return { status: 'closed', periodId }
    },

    canReadPayoutRecord(record) {
      const user = currentUser()
      return canFinance(user, FINANCE_ACTIONS.PAYOUT_READ) || canFinance(user, FINANCE_ACTIONS.OWN_PAYOUT_READ, record)
    },
  }
}

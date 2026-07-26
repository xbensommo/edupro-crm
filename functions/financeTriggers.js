/**
 * @file functions/financeTriggers.js
 * @description Finance automation triggers for EduProLIC:
 *   - Auto-create invoice on engagement creation.
 *   - Auto-allocate payment to open invoices.
 *   - Daily overdue invoice update.
 */

const admin = require('firebase-admin')
const { FieldValue } = require('firebase-admin/firestore')
const { onDocumentCreated } = require('firebase-functions/v2/firestore')
const { onSchedule } = require('firebase-functions/v2/scheduler')
const { FUNCTION_CONFIG } = require('./config.js')

const db = admin.firestore()

// --- Helpers ---

function toMoney(value) {
  return Number(Number(value || 0).toFixed(2))
}

function addDays(date, days) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Get all open (issued or partially paid) invoices for a client, oldest first.
 */
async function getOpenInvoicesForClient(clientId) {
  const snapshot = await db.collection('invoices')
    .where('clientId', '==', clientId)
    .where('status', 'in', ['issued', 'partially_paid'])
    .orderBy('issueDate', 'asc')
    .get()
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

/**
 * Update client's outstanding balance.
 */
async function updateClientBalance(clientId) {
  const openInvoices = await getOpenInvoicesForClient(clientId)
  const totalOutstanding = openInvoices.reduce((sum, inv) => sum + toMoney(inv.balanceAmount || 0), 0)

  await db.collection('clients').doc(clientId).update({
    outstandingBalance: totalOutstanding,
    'financeSummary.amountDue': totalOutstanding,
    'financeSummary.lastUpdatedAt': FieldValue.serverTimestamp(),
    lastBalanceUpdatedAt: FieldValue.serverTimestamp(),
    isDeleted: false,
  })
  return totalOutstanding
}

/**
 * Allocate a payment to open invoices (oldest first).
 */
async function allocatePaymentToInvoices(paymentId, clientId, amount, notes = 'Auto-allocation') {
  const openInvoices = await getOpenInvoicesForClient(clientId)
  if (!openInvoices.length) return { allocated: 0, remaining: amount }

  let remaining = toMoney(amount)
  let allocatedTotal = 0
  const allocations = []

  for (const invoice of openInvoices) {
    if (remaining <= 0) break
    const balance = toMoney(invoice.balanceAmount || 0)
    if (balance <= 0) continue
    const amountToAllocate = Math.min(remaining, balance)

    // Create allocation document
    const allocationRef = db.collection('payment_allocations').doc()
    await allocationRef.set({
      allocationCode: `ALLOC-${Date.now()}`,
      paymentId,
      invoiceId: invoice.id,
      amount: amountToAllocate,
      currency: invoice.currency || 'NAD',
      allocatedAt: FieldValue.serverTimestamp(),
      status: 'active',
      isDeleted: false,
      notes,
    })

    // Update invoice
    const newAllocated = toMoney((invoice.allocatedAmount || 0) + amountToAllocate)
    const newBalance = toMoney((invoice.totalAmount || 0) - newAllocated)
    const newStatus = newBalance === 0 ? 'paid' : 'partially_paid'
    await db.collection('invoices').doc(invoice.id).update({
      allocatedAmount: newAllocated,
      paidAmount: newAllocated,
      balanceAmount: newBalance,
      status: newStatus,
      isDeleted: false,
      updatedAt: FieldValue.serverTimestamp(),
    })

    allocatedTotal += amountToAllocate
    remaining -= amountToAllocate
    allocations.push({ invoiceId: invoice.id, amount: amountToAllocate, newStatus })
  }

  // Update payment record
  const paymentRef = db.collection('payments').doc(paymentId)
  await paymentRef.update({
    allocatedAmount: FieldValue.increment(allocatedTotal),
    unappliedAmount: remaining,
    status: remaining === 0 ? 'allocated' : 'partially_allocated',
    updatedAt: FieldValue.serverTimestamp(),
    isDeleted: false,
  })

  // Update client balance after allocation
  await updateClientBalance(clientId)

  return { allocated: allocatedTotal, remaining, allocations }
}

// --- Functions ---

/**
 * Trigger: When a new engagement is created, automatically create a draft invoice.
 */
exports.onEngagementCreate = onDocumentCreated(
  {
    region: FUNCTION_CONFIG.region,
    memory: FUNCTION_CONFIG.memory,
    concurrency: FUNCTION_CONFIG.concurrency,
    document: 'engagements/{engagementId}',
    retry: false,
  },
  async (event) => {
    const engagementId = event.params.engagementId
    const data = event.data?.data()
    if (!data) return

    // Avoid duplicate runs (if already has an invoice)
    if (data.invoiceId) return

    const clientId = data.clientId
    if (!clientId) return

    const amount = toMoney(data.netAmount || data.quotedAmount || 0)
    if (amount <= 0) return

    // Create invoice
    const invoiceData = {
      invoiceCode: `INV-${Date.now()}`,
      clientId,
      clientLabel: data.clientName || '',
      engagementId,
      engagementCode: data.engagementCode || '',
      status: 'draft',
      issueDate: FieldValue.serverTimestamp(),
      dueDate: addDays(new Date(), 30),
      currency: data.currency || 'NAD',
      subtotalAmount: amount,
      discountAmount: 0,
      taxAmount: 0,
      totalAmount: amount,
      allocatedAmount: 0,
      paidAmount: 0,
      balanceAmount: amount,
      lineItems: [{
        description: data.title || data.serviceType || 'Service fee',
        quantity: 1,
        unitPrice: amount,
      }],
      sourceModule: 'engagements',
      sourceId: engagementId,
      notes: `Auto-generated from engagement ${data.engagementCode || ''}`,
      createdByUserId: data.createdBy || null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      isDeleted: false,
    }

    const invoiceRef = await db.collection('invoices').add(invoiceData)

    // Link invoice back to engagement
    await db.collection('engagements').doc(engagementId).update({
      invoiceId: invoiceRef.id,
      invoiceCode: invoiceData.invoiceCode,
      updatedAt: FieldValue.serverTimestamp(),
    })

    // Update client balance
    await updateClientBalance(clientId)

    // Queue notification (optional)
    await db.collection('notification_delivery_queue').add({
      user_id: data.assignedConsultantId || data.createdBy || 'admin',
      event: 'finance.invoice.issued',
      channel: 'email',
      status: 'pending',
      templateKey: 'finance.invoice.issued',
      variables: {
        clientName: data.clientName,
        invoiceNumber: invoiceData.invoiceCode,
        amount: amount,
        currency: invoiceData.currency,
        dueDate: invoiceData.dueDate,
      },
      title: 'Invoice issued',
      message: `An invoice has been generated for ${data.clientName}`,
      actionUrl: `/finance/invoices/${invoiceRef.id}`,
      actionLabel: 'View invoice',
      recipientEmail: data.clientEmail || null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      isDeleted: false,
    })

    console.log(`[finance] Invoice ${invoiceData.invoiceCode} created for engagement ${engagementId}`)
  }
)

/**
 * Trigger: When a new payment is created, auto-allocate to open invoices.
 */
exports.onPaymentCreate = onDocumentCreated(
  {
    region: FUNCTION_CONFIG.region,
    memory: FUNCTION_CONFIG.memory,
    concurrency: FUNCTION_CONFIG.concurrency,
    document: 'payments/{paymentId}',
    retry: false,
  },
  async (event) => {
    const paymentId = event.params.paymentId
    const data = event.data?.data()
    if (!data) return

    // Skip if payment is already allocated or not a client payment
    if (data.autoAllocated || data.allocatedAmount > 0) return
    if (data.paymentType !== 'client_payment') return

    const clientId = data.clientId
    if (!clientId) return

    const amount = toMoney(data.amount || 0)
    if (amount <= 0) return

    // Allocate to open invoices
    const result = await allocatePaymentToInvoices(
      paymentId,
      clientId,
      amount,
      'Auto-allocated on payment creation'
    )

    if (result.allocated > 0) {
      console.log(`[finance] Auto-allocated ${result.allocated} for payment ${paymentId}`)
    }
  }
)

/**
 * Scheduled: Daily check for overdue invoices.
 */
exports.scheduleUpdateOverdueInvoices = onSchedule(
  {
    region: FUNCTION_CONFIG.region,
    memory: FUNCTION_CONFIG.memory,
    schedule: '0 0 * * *',
    timeZone: 'Africa/Windhoek',
    retryCount: 3,
  },
  async (context) => {
    const now = new Date()
    const dateString = now.toISOString().slice(0, 10) // YYYY-MM-DD

    const snapshot = await db.collection('invoices')
      .where('status', 'in', ['issued', 'partially_paid'])
      .where('dueDate', '<=', dateString)
      .get()

    if (snapshot.empty) {
      console.log('[finance] No invoices to update as overdue.', context)
      return
    }

    const batch = db.batch()
    snapshot.forEach(doc => {
      const data = doc.data()
      if (toMoney(data.balanceAmount || 0) > 0) {
        batch.update(doc.ref, {
          status: 'overdue',
          updatedAt: FieldValue.serverTimestamp(),
        })
      }
    })
    await batch.commit()

    console.log(`[finance] Updated ${snapshot.size} invoices to overdue.`)

    // Optionally queue overdue notifications
    const notifications = []
    snapshot.forEach(doc => {
      const data = doc.data()
      if (toMoney(data.balanceAmount || 0) > 0) {
        notifications.push({
          user_id: data.createdByUserId || 'admin',
          event: 'finance.invoice.overdue',
          channel: 'email',
          status: 'pending',
          templateKey: 'finance.invoice.overdue',
          variables: {
            clientName: data.clientLabel,
            invoiceNumber: data.invoiceCode,
            amountDue: data.balanceAmount,
            currency: data.currency || 'NAD',
            dueDate: data.dueDate,
          },
          title: 'Invoice overdue',
          message: `Invoice ${data.invoiceCode} is overdue.`,
          actionUrl: `/finance/invoices/${doc.id}`,
          actionLabel: 'View invoice',
          recipientEmail: data.clientEmail || null,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          isDeleted: false,
        })
      }
    })

    if (notifications.length) {
      const batchNotifications = db.batch()
      notifications.forEach(notif => {
        const ref = db.collection('notification_delivery_queue').doc()
        batchNotifications.set(ref, notif)
      })
      await batchNotifications.commit()
      console.log(`[finance] Queued ${notifications.length} overdue notifications.`)
    }
  }
)
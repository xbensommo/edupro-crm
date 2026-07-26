/** @file functions/notificationEmailWorker.js */

const admin = require('firebase-admin')
const { FieldValue } = require('firebase-admin/firestore')
const { onDocumentCreated } = require('firebase-functions/v2/firestore')
const { sendEmail } = require('./emailSender.js')
const { renderEmailTemplate } = require('./emailTemplates.js')
const { FUNCTION_CONFIG } = require('./config.js')

const EMAIL_EVENTS = new Set([
  'crm.work.assigned',
  'crm.assignment.denied',
  'crm.final_delivery.submitted',
  'crm.review.denied',
  'finance.commission.deducted',
  'finance.commission.paid',
  'auth.user.invited',
  'auth.user.suspended',

  'finance.quotation.ready',
  'finance.quotation.accepted',
  'finance.invoice.issued',
  'finance.invoice.overdue',
  'finance.payment.received',
  'finance.receipt.ready',
  'finance.commission.deducted',
  'finance.commission.paid',

    'crm.review.approved',
  'crm.assignment.accepted',
   // Finance events
  'finance.invoice.overdue',
  'finance.payment.received',
  'finance.receipt.ready',
  'finance.commission.ready',
  'finance.payment.logged', // alias for backward compatibility
  'auth.role.changed',
])

function lockKey(value) {
  return String(value || '')
    .replace(/[^a-zA-Z0-9_.:-]/g, '_')
    .slice(0, 900)
}

function getDb() {
  if (!admin.apps.length) admin.initializeApp()
  return admin.firestore()
}

async function resolveRecipientEmail(db, queue) {
  if (queue.recipientEmail) return queue.recipientEmail
  const uid = queue.user_id || queue.recipientId
  if (!uid) return null
  const snap = await db.collection('users').doc(uid).get()
  if (!snap.exists) return null
  return snap.data()?.email || snap.data()?.emailAddress || null
}

async function writeLog(db, payload) {
  await db.collection('notification_logs').add({
    notificationId: payload.notificationId || null,
    queueId: payload.queueId || null,
    dedupeKey: payload.dedupeKey || null,
    user_id: payload.user_id || null,
    recipientEmail: payload.recipientEmail || null,
    event: payload.event || null,
    channel: payload.channel || 'email',
    provider: payload.provider || 'zoho_smtp',
    status: payload.status || 'pending',
    domain: payload.domain || null,
    error: payload.error || null,
    payload: payload.payload || null,
    response: payload.response || null,
    sentAt: payload.sentAt || null,
    createdAt: FieldValue.serverTimestamp(),
  })
}

exports.onNotificationDeliveryQueued = onDocumentCreated(
  {
    region: FUNCTION_CONFIG.region,
    memory: FUNCTION_CONFIG.memory,
    concurrency: FUNCTION_CONFIG.concurrency,
    document: 'notification_delivery_queue/{queueId}',
    retry: false,
  },
  async (event) => {
    const db = getDb()
    const queueRef = event.data?.ref
    const queueId = event.params.queueId
    const initial = event.data?.data()
    if (!queueRef || !initial) return

    if (initial.channel !== 'email') return
    if (initial.status !== 'pending') return

    const eventName = String(initial.event || '')
    if (!EMAIL_EVENTS.has(eventName)) {
      await queueRef.update({
        status: 'skipped',
        lastError: 'EMAIL_NOT_ALLOWED_FOR_EVENT',
        updatedAt: FieldValue.serverTimestamp(),
      })
      await writeLog(db, {
        ...initial,
        queueId,
        status: 'skipped',
        provider: 'policy',
        error: 'EMAIL_NOT_ALLOWED_FOR_EVENT',
      })
      return
    }

    const dedupeKey = initial.dedupeKey || `${eventName}:${initial.user_id || initial.recipientEmail || queueId}:email`
    const lockRef = db.collection('_notification_delivery_locks').doc(lockKey(dedupeKey))
    let queue

    const lockResult = await db.runTransaction(async (tx) => {
      const freshQueueSnap = await tx.get(queueRef)
      const lockSnap = await tx.get(lockRef)
      if (!freshQueueSnap.exists) return { skip: true, reason: 'QUEUE_DELETED' }
      queue = freshQueueSnap.data()

      if (queue.status !== 'pending') return { skip: true, reason: `QUEUE_${queue.status}` }
      if (lockSnap.exists && lockSnap.data()?.status === 'sent') return { skip: true, reason: 'DUPLICATE_ALREADY_SENT' }
      if (Number(queue.attempts || 0) >= Number(queue.maxAttempts || FUNCTION_CONFIG.maxAttempts)) {
        tx.update(queueRef, {
          status: 'failed',
          lastError: 'MAX_ATTEMPTS_REACHED',
          updatedAt: FieldValue.serverTimestamp(),
        })
        return { skip: true, reason: 'MAX_ATTEMPTS_REACHED' }
      }

      tx.set(lockRef, {
        dedupeKey,
        queueId,
        event: eventName,
        status: 'processing',
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true })

      tx.update(queueRef, {
        status: 'processing',
        attempts: FieldValue.increment(1),
        lockedAt: FieldValue.serverTimestamp(),
        lockedBy: event.id || 'onNotificationDeliveryQueued',
        updatedAt: FieldValue.serverTimestamp(),
      })

      return { skip: false }
    })

    if (lockResult.skip) {
      if (lockResult.reason === 'DUPLICATE_ALREADY_SENT') {
        await queueRef.update({ status: 'skipped', lastError: lockResult.reason, updatedAt: FieldValue.serverTimestamp() })
      }
      return
    }

    try {
      const recipientEmail = await resolveRecipientEmail(db, queue)
      if (!recipientEmail) throw new Error('Missing recipient email.')

      const variables = {
        ...(queue.variables || {}),
        title: queue.title,
        message: queue.message,
        actionUrl: queue.actionUrl,
        actionLabel: queue.actionLabel,
        entityLabel: queue.entityLabel,
        recipientEmail,
      }
      const rendered = renderEmailTemplate(queue.templateKey || queue.event, variables)
      const result = await sendEmail({
        to: recipientEmail,
        subject: queue.subject || rendered.subject,
        html: rendered.html,
        text: rendered.text,
      })

      await db.runTransaction(async (tx) => {
        tx.update(queueRef, {
          status: 'sent',
          provider: 'zoho_smtp',
          recipientEmail,
          sentAt: FieldValue.serverTimestamp(),
          lastError: null,
          lockedAt: null,
          lockedBy: null,
          updatedAt: FieldValue.serverTimestamp(),
        })
        tx.set(lockRef, {
          dedupeKey,
          queueId,
          event: eventName,
          status: 'sent',
          provider: 'zoho_smtp',
          messageId: result.messageId || null,
          sentAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true })
      })

      await writeLog(db, {
        ...queue,
        queueId,
        recipientEmail,
        status: 'sent',
        provider: 'zoho_smtp',
        response: { messageId: result.messageId },
        sentAt: FieldValue.serverTimestamp(),
      })
    } catch (error) {
      const message = error?.message || 'Email delivery failed.'
      const fresh = await queueRef.get()
      const attempts = Number(fresh.data()?.attempts || 1)
      const maxAttempts = Number(fresh.data()?.maxAttempts || FUNCTION_CONFIG.maxAttempts)
      const failedHard = attempts >= maxAttempts

      await queueRef.update({
        status: failedHard ? 'failed' : 'pending',
        lastError: message,
        lockedAt: null,
        lockedBy: null,
        processAfter: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })

      await lockRef.set({
        dedupeKey,
        queueId,
        event: eventName,
        status: failedHard ? 'failed' : 'pending',
        lastError: message,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true })

      await writeLog(db, {
        ...queue,
        queueId,
        status: failedHard ? 'failed' : 'pending',
        provider: 'zoho_smtp',
        error: message,
      })
    }
  },
)

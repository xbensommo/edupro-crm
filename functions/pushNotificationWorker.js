/** @file functions/pushNotificationWorker.js */

const admin = require('firebase-admin')
const { FieldValue } = require('firebase-admin/firestore')
const { onDocumentCreated } = require('firebase-functions/v2/firestore')
const { FUNCTION_CONFIG = {}, BRAND = {} } = require('./config.js')

if (!admin.apps.length) admin.initializeApp()

const PUSH_WORKER_OPTIONS = {
  region: FUNCTION_CONFIG.region || process.env.FUNCTION_REGION || 'us-central1',
  memory: FUNCTION_CONFIG.memory || '256MiB',
  timeoutSeconds: FUNCTION_CONFIG.timeoutSeconds || 60,
  concurrency: FUNCTION_CONFIG.concurrency || 20,
  document: 'notification_delivery_queue/{queueId}',
  retry: false,
}

function lockKey(value) {
  return String(value || '')
    .replace(/[^a-zA-Z0-9_.:-]/g, '_')
    .slice(0, 900)
}

function asData(value) {
  const out = {}
  for (const [key, item] of Object.entries(value || {})) {
    if (item === undefined || item === null) continue
    out[key] = String(item)
  }
  return out
}

async function writeLog(db, payload) {
  await db.collection('notification_logs').add({
    notificationId: payload.notificationId || null,
    queueId: payload.queueId || null,
    dedupeKey: payload.dedupeKey || null,
    user_id: payload.user_id || null,
    recipientEmail: payload.recipientEmail || null,
    event: payload.event || null,
    channel: 'push',
    provider: 'fcm',
    status: payload.status || 'pending',
    domain: payload.domain || null,
    error: payload.error || null,
    payload: payload.payload || null,
    response: payload.response || null,
    sentAt: payload.sentAt || null,
    createdAt: FieldValue.serverTimestamp(),
  })
}

async function fetchActiveTokens(db, userId) {
  if (!userId) return []

  const snapshot = await db.collection('notification_push_tokens')
    .where('user_id', '==', userId)
    .where('status', '==', 'active')
    .get()

  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((row) => row.token)
}

async function markInvalidTokens(db, tokenRows, response) {
  const batch = db.batch()
  response.responses.forEach((item, index) => {
    if (item.success) return
    const tokenRow = tokenRows[index]
    if (!tokenRow?.id) return

    const code = item.error?.code || ''
    const shouldDisable = [
      'messaging/invalid-registration-token',
      'messaging/registration-token-not-registered',
      'messaging/invalid-argument',
    ].includes(code)

    if (!shouldDisable) return

    batch.update(db.collection('notification_push_tokens').doc(tokenRow.id), {
      status: 'invalid',
      lastError: code,
      updatedAt: FieldValue.serverTimestamp(),
    })
  })
  await batch.commit()
}

exports.onNotificationPushQueued = onDocumentCreated(
  PUSH_WORKER_OPTIONS,
  async (event) => {
    const db = admin.firestore()
    const queueRef = event.data?.ref
    const queueId = event.params.queueId
    const initial = event.data?.data()

    if (!queueRef || !initial) return
    if (initial.channel !== 'push') return
    if (initial.status !== 'pending') return

    const dedupeKey = initial.dedupeKey || `${initial.event}:${initial.user_id || queueId}:push`
    const lockRef = db.collection('_notification_delivery_locks').doc(lockKey(dedupeKey))
    let queue

    const lockResult = await db.runTransaction(async (tx) => {
      const freshQueueSnap = await tx.get(queueRef)
      const lockSnap = await tx.get(lockRef)
      if (!freshQueueSnap.exists) return { skip: true, reason: 'QUEUE_DELETED' }
      queue = freshQueueSnap.data()

      if (queue.status !== 'pending') return { skip: true, reason: `QUEUE_${queue.status}` }
      if (lockSnap.exists && lockSnap.data()?.status === 'sent') return { skip: true, reason: 'DUPLICATE_ALREADY_SENT' }

      tx.set(lockRef, {
        dedupeKey,
        queueId,
        event: queue.event || null,
        channel: 'push',
        status: 'processing',
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true })

      tx.update(queueRef, {
        status: 'processing',
        attempts: FieldValue.increment(1),
        lockedAt: FieldValue.serverTimestamp(),
        lockedBy: event.id || 'onNotificationPushQueued',
        updatedAt: FieldValue.serverTimestamp(),
      })

      return { skip: false }
    })

    if (lockResult.skip) {
      if (lockResult.reason === 'DUPLICATE_ALREADY_SENT') {
        await queueRef.update({
          status: 'skipped',
          lastError: lockResult.reason,
          updatedAt: FieldValue.serverTimestamp(),
        })
      }
      return
    }

    try {
      const tokenRows = await fetchActiveTokens(db, queue.user_id || queue.recipientId)
      const tokens = [...new Set(tokenRows.map((row) => row.token).filter(Boolean))]

      if (!tokens.length) {
        await queueRef.update({
          status: 'skipped',
          lastError: 'NO_ACTIVE_FCM_TOKENS',
          lockedAt: null,
          lockedBy: null,
          updatedAt: FieldValue.serverTimestamp(),
        })
        await writeLog(db, { ...queue, queueId, status: 'skipped', error: 'NO_ACTIVE_FCM_TOKENS' })
        return
      }

      const title = queue.title || queue.variables?.title || 'EduProLIC notification'
      const body = queue.message || queue.variables?.message || queue.entityLabel || 'You have a new update.'
      const actionUrl = queue.actionUrl || '/notifications'

      const response = await admin.messaging().sendEachForMulticast({
        tokens,
        notification: {
          title,
          body,
        },
        data: asData({
          notificationId: queue.notificationId,
          queueId,
          event: queue.event,
          entityType: queue.entityType,
          entityId: queue.entityId,
          actionUrl,
          title,
          body,
        }),
        webpush: {
          notification: {
            icon: BRAND.logoUrl || '/android-chrome-512x512.png',
            badge: BRAND.logoUrl || '/android-chrome-512x512.png',
          },
          fcmOptions: {
            link: actionUrl,
          },
        },
      })

      await markInvalidTokens(db, tokenRows, response)

      const status = response.successCount > 0
        ? (response.failureCount > 0 ? 'partial_sent' : 'sent')
        : 'failed'

      await db.runTransaction(async (tx) => {
        tx.update(queueRef, {
          status,
          provider: 'fcm',
          sentAt: response.successCount > 0 ? FieldValue.serverTimestamp() : null,
          lastError: response.successCount > 0 ? null : 'FCM_SEND_FAILED',
          lockedAt: null,
          lockedBy: null,
          updatedAt: FieldValue.serverTimestamp(),
        })
        tx.set(lockRef, {
          dedupeKey,
          queueId,
          event: queue.event || null,
          channel: 'push',
          status,
          successCount: response.successCount,
          failureCount: response.failureCount,
          sentAt: response.successCount > 0 ? FieldValue.serverTimestamp() : null,
          updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true })
      })

      await writeLog(db, {
        ...queue,
        queueId,
        status,
        response: {
          successCount: response.successCount,
          failureCount: response.failureCount,
        },
        sentAt: response.successCount > 0 ? FieldValue.serverTimestamp() : null,
      })
    } catch (error) {
      const message = error?.message || 'FCM push delivery failed.'
      await queueRef.update({
        status: 'failed',
        lastError: message,
        lockedAt: null,
        lockedBy: null,
        updatedAt: FieldValue.serverTimestamp(),
      })
      await lockRef.set({
        dedupeKey,
        queueId,
        channel: 'push',
        status: 'failed',
        lastError: message,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true })
      await writeLog(db, { ...queue, queueId, status: 'failed', error: message })
    }
  },
)

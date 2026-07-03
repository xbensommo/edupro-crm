/** @file src/features/notifications/services/createBrowserPushService.js */

import { getApp } from 'firebase/app'
import { deleteToken, getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging'
import { createNotificationRepository } from './createNotificationRepository.js'

function getBrowserName() {
  const ua = navigator.userAgent || ''
  if (ua.includes('Edg/')) return 'Edge'
  if (ua.includes('Chrome/')) return 'Chrome'
  if (ua.includes('Firefox/')) return 'Firefox'
  if (ua.includes('Safari/') && !ua.includes('Chrome/')) return 'Safari'
  return 'Browser'
}

async function sha256(value) {
  const input = new TextEncoder().encode(String(value || ''))
  const hash = await crypto.subtle.digest('SHA-256', input)
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function requireBrowserSupport() {
  if (typeof window === 'undefined') throw new Error('Browser push can only run in the browser.')
  if (!('Notification' in window)) throw new Error('This browser does not support Notification API.')
  if (!('serviceWorker' in navigator)) throw new Error('This browser does not support service workers.')
  if (!window.isSecureContext && window.location.hostname !== 'localhost') {
    throw new Error('Browser push requires HTTPS or localhost.')
  }
}

/**
 * Creates the EduProLIC browser push adapter.
 *
 * @param {{ store?: any, firebaseApp?: any, currentUser?: () => any, vapidKey?: string, serviceWorkerPath?: string }} options
 */
export function createBrowserPushService(options = {}) {
  const repository = createNotificationRepository({ store: options.store, recipientField: 'user_id' })
  const currentUser = typeof options.currentUser === 'function' ? options.currentUser : () => null
  const vapidKey = options.vapidKey || import.meta.env.VITE_FIREBASE_MESSAGING_VAPID_KEY
  const serviceWorkerPath = options.serviceWorkerPath || '/firebase-messaging-sw.js'

  function getUserId() {
    const user = currentUser() || {}
    return user.uid || user.id || user.user_id || user.userId || null
  }

  async function getMessagingInstance() {
    requireBrowserSupport()

    const supported = await isSupported()
    if (!supported) throw new Error('Firebase Messaging is not supported in this browser.')

    const app = options.firebaseApp || getApp()
    return getMessaging(app)
  }

  async function requestPermission() {
    requireBrowserSupport()
    if (Notification.permission === 'granted') return 'granted'
    if (Notification.permission === 'denied') return 'denied'
    return Notification.requestPermission()
  }

  async function registerServiceWorker() {
    requireBrowserSupport()
    const registration = await navigator.serviceWorker.register(serviceWorkerPath)
    await navigator.serviceWorker.ready
    return registration
  }

  /**
   * Requests notification permission, gets an FCM token, and stores it once.
   * This should be called from a user gesture such as a button click.
   */
  async function enable() {
    const userId = getUserId()
    if (!userId) throw new Error('Cannot enable browser notifications without a signed-in user.')
    if (!vapidKey) throw new Error('Missing VITE_FIREBASE_MESSAGING_VAPID_KEY.')

    const permission = await requestPermission()
    if (permission !== 'granted') {
      throw new Error(`Notification permission is ${permission}.`)
    }

    const messaging = await getMessagingInstance()
    const serviceWorkerRegistration = await registerServiceWorker()
    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration })

    if (!token) throw new Error('Firebase Messaging did not return a registration token.')

    const tokenHash = await sha256(token)
    const vapidKeyHash = await sha256(vapidKey)

    return repository.savePushToken(userId, {
      token,
      tokenHash,
      vapidKeyHash,
      provider: 'fcm',
      platform: 'web',
      permission,
      status: 'active',
      browserName: getBrowserName(),
      userAgent: navigator.userAgent || '',
      deviceLabel: `${getBrowserName()} on web`,
      lastSeenAt: new Date().toISOString(),
    })
  }

  async function disable() {
    const messaging = await getMessagingInstance()
    await deleteToken(messaging)
    return true
  }

  /**
   * Handles foreground FCM messages while the web app tab is open.
   * Background messages are handled by public/firebase-messaging-sw.js.
   */
  async function onForegroundMessage(callback) {
    const messaging = await getMessagingInstance()
    return onMessage(messaging, (payload) => {
      if (typeof callback === 'function') callback(payload)
    })
  }

  return {
    enable,
    disable,
    requestPermission,
    registerServiceWorker,
    onForegroundMessage,
  }
}

export default createBrowserPushService

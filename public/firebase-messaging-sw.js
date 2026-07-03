/* public/firebase-messaging-sw.js */

/* eslint-disable no-undef */

importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js')
importScripts('/firebase-messaging-sw-config.js')

const firebaseConfig = self.__FIREBASE_SW_CONFIG__

if (!firebaseConfig || !firebaseConfig.projectId || !firebaseConfig.messagingSenderId) {
  console.warn('[FCM SW] Missing Firebase service worker config.')
} else {
  firebase.initializeApp(firebaseConfig)

  const messaging = firebase.messaging()

  messaging.onBackgroundMessage((payload) => {
    const notification = payload.notification || {}
    const data = payload.data || {}

    const title =
      notification.title ||
      data.title ||
      'EduProLIC notification'

    const options = {
      body: notification.body || data.body || data.message || '',
      icon: data.icon || '/android-chrome-512x512.png',
      badge: data.badge || '/android-chrome-512x512.png',
      data: {
        actionUrl: data.actionUrl || '/notifications',
        notificationId: data.notificationId || '',
      },
    }

    self.registration.showNotification(title, options)
  })
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const actionUrl =
    event.notification?.data?.actionUrl ||
    '/notifications'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client && client.url.includes(self.location.origin)) {
          client.navigate(actionUrl)
          return client.focus()
        }
      }

      return clients.openWindow(actionUrl)
    }),
  )
})
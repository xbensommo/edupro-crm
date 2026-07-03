import { initializeApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getStorage, connectStorageEmulator } from 'firebase/storage'
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'
import { getMessaging, isSupported } from 'firebase/messaging'

const isClient = typeof window !== 'undefined'
const isProd = true; //import.meta.env.PROD
const vars = import.meta.env

const isLocalhost =
  isClient &&
  ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)

function requireEnv(key) {
  const value = vars[key]
  if (!value) throw new Error(`SECURITY ERROR: Missing ${key}`)
  return value
}

function buildConfig() {
  if (isProd) {
    return {
      apiKey: requireEnv('VITE_FIREBASE_API_KEY'),
      authDomain: requireEnv('VITE_FIREBASE_AUTH_DOMAIN'),
      projectId: requireEnv('VITE_FIREBASE_PROJECT_ID'),
      storageBucket: requireEnv('VITE_FIREBASE_STORAGE_BUCKET'),
      messagingSenderId: requireEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
      appId: requireEnv('VITE_FIREBASE_APP_ID'),
    }
  }

  return {
    apiKey: vars.VITE_FIREBASE_API_KEY || 'demo-key',
    authDomain: vars.VITE_FIREBASE_AUTH_DOMAIN || 'localhost',
    projectId: vars.VITE_FIREBASE_PROJECT_ID || 'demo-project',
    storageBucket: vars.VITE_FIREBASE_STORAGE_BUCKET || 'demo-project.appspot.com',
    messagingSenderId: vars.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: vars.VITE_FIREBASE_APP_ID || 'demo-app-id',
  }
}

const app = initializeApp(buildConfig())
const db = getFirestore(app)
const auth = getAuth(app)
const storage = getStorage(app)
const functions = getFunctions(app)

/**
 * FCM has no normal emulator equivalent for browser push.
 * Keep messaging separate and only initialize it in supported browsers.
 */
const messagingPromise = isClient
  ? isSupported()
      .then((supported) => {
        if (!supported) return null
        if (!vars.VITE_FIREBASE_MESSAGING_SENDER_ID) return null
        return getMessaging(app)
      })
      .catch(() => null)
  : Promise.resolve(null)

if (!isProd && isLocalhost && vars.VITE_FIREBASE_USE_EMULATORS !== 'false') {
  const host = vars.VITE_FIREBASE_EMULATOR_HOST || 'localhost'

  /**
   * Prevent duplicate emulator connection during Vite HMR.
   */
  if (!window.__FIREBASE_EMULATORS_CONNECTED__) {
    connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true })
    connectFirestoreEmulator(db, host, 8080)
    connectStorageEmulator(storage, host, 9199)
    connectFunctionsEmulator(functions, host, 5001)

    window.__FIREBASE_EMULATORS_CONNECTED__ = true
    console.log('🔥 Firebase Emulators connected')
  }
}

export { app, db, auth, storage, functions, messagingPromise }
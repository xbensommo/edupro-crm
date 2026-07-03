import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import dotenv from 'dotenv'

dotenv.config()

const publicDir = path.resolve(process.cwd(), 'public')
const outputPath = path.join(publicDir, 'firebase-messaging-sw-config.js')
 
const config = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || '',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.VITE_FIREBASE_APP_ID || '',
  messagingVapidKey: process.env.VITE_FIREBASE_MESSAGING_VAPID_KEY || '',
}

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true })
}

const content = `/* Auto-generated. Do not edit manually. */
self.__FIREBASE_SW_CONFIG__ = ${JSON.stringify(config, null, 2)}
`

fs.writeFileSync(outputPath, content, 'utf8')

console.log(`[firebase-sw] wrote ${outputPath}`)
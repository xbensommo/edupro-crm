/** @file functions/index.js */

const admin = require('firebase-admin')
if (!admin.apps.length) admin.initializeApp()

Object.assign(exports, require('./notificationEmailWorker.js'))

Object.assign(exports, require('./pushNotificationWorker.js'))

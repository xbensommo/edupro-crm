/**
 * @file functions/emailSender.js
 * @description Secure SMTP bridge for Zoho Mail. No credentials are hardcoded.
 */

const nodemailer = require('nodemailer')
const { BRAND } = require('./config.js')

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.zoho.com'
const SMTP_PORT = Number(process.env.SMTP_PORT || 465)
const SMTP_SECURE = String(process.env.SMTP_SECURE || 'true') === 'true'
const SMTP_USER = process.env.EMAIL_USER || process.env.SMTP_USER || BRAND.email
const SMTP_PASS = process.env.EMAIL_PASS || process.env.SMTP_PASS
const SMTP_FROM = process.env.EMAIL_FROM || SMTP_USER || BRAND.email

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
  pool: true,
  maxConnections: Number(process.env.SMTP_MAX_CONNECTIONS || 3),
  maxMessages: Number(process.env.SMTP_MAX_MESSAGES || 50),
})

function assertSmtpReady() {
  if (!SMTP_PASS) {
    throw new Error('Missing SMTP password. Set EMAIL_PASS or SMTP_PASS as a Firebase secret/environment variable.')
  }
  if (!SMTP_USER) {
    throw new Error('Missing SMTP user. Set EMAIL_USER or SMTP_USER.')
  }
}

/**
 * @param {{ to: string, subject: string, html: string, text?: string }} options
 * @returns {Promise<{ success: boolean, messageId: string }>}
 */
async function sendEmail({ to, subject, html, text }) {
  assertSmtpReady()
  if (!to) throw new Error('Cannot send email without a recipient.')
  if (!html && !text) throw new Error('Cannot send email without body content.')

  const info = await transporter.sendMail({
    from: `"${BRAND.companyName}" <${SMTP_FROM}>`,
    to,
    subject: subject || `${BRAND.companyName} notification`,
    html,
    text,
  })

  return { success: true, messageId: info.messageId }
}

module.exports = { sendEmail }

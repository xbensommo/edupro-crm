/**
 * @file functions/config.js
 * @description EduProLIC brand configuration for Firebase Functions email templates.
 *
 * Keep this file boring and explicit. Email rendering runs server-side, so every
 * value used in email HTML must be deterministic and safe for production.
 */

const APP_DOMAIN = process.env.APP_DOMAIN || process.env.BRAND_WEBSITE || 'https://www.eduprolic.com';

const FUNCTION_CONFIG = Object.freeze({
  region: process.env.FUNCTION_REGION || 'us-central1',
  memory: '256MiB',
  concurrency: 40,
  maxAttempts: 3,
})

const BRAND = Object.freeze({
  companyName: process.env.BRAND_COMPANY_NAME || 'EduPro LIC',
  brandLine: process.env.BRAND_LINE || 'EduPro Learning & Innovation',
  slogan: process.env.BRAND_SLOGAN || 'Quality academic services',
  website: APP_DOMAIN.replace(/\/$/, ''),
  email: process.env.BRAND_EMAIL || 'info@eduprolic.com',
  phone: process.env.BRAND_PHONE || '+264 81 448 9950',
  address: process.env.BRAND_ADDRESS || 'Windhoek, Namibia',
  poweredByName: process.env.POWERED_BY_NAME || 'Totisoft Cc',
  poweredByUrl: process.env.POWERED_BY_URL || 'https://www.totisoft.com',

  /**
   * Must be a public HTTPS URL for real emails. Local files do not render inside
   * email clients. Recommended: upload public/brand/edupro-logo.png to Hosting
   * and set BRAND_LOGO_URL=https://www.eduprolic.com/brand/edupro-logo.png
   */
  logoUrl:
    process.env.BRAND_LOGO_URL ||
    `${APP_DOMAIN.replace(/\/$/, '')}/logo.png`,

  colors: Object.freeze({
    primary: '#8E6E4E',
    primaryLight: '#C5A059',
    primaryDark: '#6B5239',
    secondary: '#0D1B2A',
    secondarySoft: '#1B263B',
    accent: '#C5A059',
    accentPale: '#E5E1DA',
    bg: '#FCFAF7',
    surface: '#FFFFFF',
    text: '#1A1A1A',
    muted: '#575757',
    border: 'rgba(13, 27, 42, 0.12)',
    danger: '#B42318',
    warning: '#B7791F',
    success: '#166534',
    info: '#164E63',
    white: '#FFFFFF',
  }),
})

module.exports = { BRAND, FUNCTION_CONFIG, APP_DOMAIN }

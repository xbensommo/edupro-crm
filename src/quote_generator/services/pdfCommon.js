/**
 * @file src/services/pdfCommon.js
 * @description Shared utilities, constants, and styles for all PDF generators.
 */

import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'

pdfMake.vfs = pdfFonts?.pdfMake?.vfs || pdfFonts?.vfs

// --- Strict 8pt Spacing System ---
export const S = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  page: 60,
}

// --- Utility Helpers ---
export function safeText(value, fallback = '—') {
  const text = String(value ?? '').trim()
  return text || fallback
}

export function safeNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

export function money(value, currency = 'NAD') {
  return new Intl.NumberFormat('en-NA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(safeNumber(value))
}

export function dateText(value) {
  if (!value) return '—'
  let date
  if (value?.toDate && typeof value.toDate === 'function') {
    date = value.toDate()
  } else if (value?.seconds !== undefined) {
    date = new Date(value.seconds * 1000)
  } else {
    date = new Date(value)
  }
  if (isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-NA', {
    year: 'numeric',
    month: 'long',
    day: '2-digit',
  }).format(date)
}

export function fileSafe(value) {
  return String(value || 'document')
    .trim()
    .replace(/[^a-z0-9-_]+/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}

export async function imageUrlToDataUrl(url) {
  if (!url) return null
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const blob = await response.blob()
    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

// --- Common Brand Styles (matching main.css) ---
export const commonStyles = {
  // HEADER
  companyName: { fontSize: 18, bold: true, color: '#1A1A1A', margin: [0, 2, 0, 2] },
  companyTagline: { fontSize: 9, color: '#575757', margin: [0, 0, 0, 8] },
  companyContact: { fontSize: 8, color: '#8B99A8', margin: [0, 1, 0, 1] },
  
  documentTitle: { fontSize: 24, bold: true, color: '#1A1A1A', letterSpacing: 1, margin: [0, 0, 0, 4] },
  documentCode: { fontSize: 14, bold: true, color: '#C5A059', margin: [0, 0, 0, 16] },
  metaText: { fontSize: 8, color: '#575757', margin: [0, 1, 0, 1] },

  // SECTIONS
  sectionHeader: { fontSize: 9, bold: true, color: '#575757', letterSpacing: 0.5, margin: [0, 0, 0, 6] },
  clientName: { fontSize: 14, bold: true, color: '#1A1A1A', margin: [0, 0, 0, 4] },
  clientDetail: { fontSize: 9, color: '#575757', margin: [0, 1, 0, 1] },
  detailText: { fontSize: 9, color: '#1A1A1A', margin: [0, 1, 0, 1] },

  // STATUSES
  status_draft: { fontSize: 8, color: '#C5A059', bold: true },
  status_issued: { fontSize: 8, color: '#8E6E4E', bold: true },
  status_paid: { fontSize: 8, color: '#2e7d32', bold: true },
  status_partially_paid: { fontSize: 8, color: '#C5A059', bold: true },
  status_cancelled: { fontSize: 8, color: '#d32f2f', bold: true },

  // TABLE
  tableHeader: { 
    fontSize: 9, bold: true, color: '#1A1A1A', 
    fillColor: '#F4F0E8',
    margin: [0, 4, 0, 4] 
  },
  cellText: { fontSize: 9, color: '#1A1A1A', margin: [0, 2, 0, 2] },

  // SUMMARY
  summaryLabel: { fontSize: 9, color: '#575757', margin: [0, 2, 0, 2] },
  summaryValue: { fontSize: 9, color: '#1A1A1A', alignment: 'right', margin: [0, 2, 0, 2] },
  summaryDiscount: { fontSize: 9, bold: true, color: '#d32f2f', alignment: 'right', margin: [0, 2, 0, 2] },
  summaryPaid: { fontSize: 9, bold: true, color: '#2e7d32', alignment: 'right', margin: [0, 2, 0, 2] },
  
  totalLabel: { fontSize: 12, bold: true, color: '#1A1A1A', margin: [0, 6, 0, 3] },
  totalValue: { fontSize: 12, bold: true, color: '#1A1A1A', alignment: 'right', margin: [0, 6, 0, 3] },
  balanceLabel: { fontSize: 14, bold: true, color: '#1A1A1A', margin: [0, 8, 0, 4] },
  balanceValue: { fontSize: 14, bold: true, color: '#1A1A1A', alignment: 'right', margin: [0, 8, 0, 4] },

  // BANKING
  bankLabel: { fontSize: 8, bold: true, color: '#575757', margin: [0, 2, 0, 2] },
  bankValue: { fontSize: 8, color: '#1A1A1A', margin: [0, 2, 0, 2] },

  // BODY / MISC
  bodyText: { fontSize: 9, color: '#1A1A1A', lineHeight: 1.5 },
  acceptanceLine: { fontSize: 10, color: '#1A1A1A', margin: [0, 8, 0, 0] },
  acceptanceLabel: { fontSize: 8, color: '#8B99A8' },
  footerNote: { fontSize: 9, color: '#575757', italic: true },
  footerText: { fontSize: 8, color: '#8B99A8' },
}

// Common table layout (used in all three)
export const tableLayout = {
  fillColor: (rowIndex) => rowIndex === 0 ? '#F8FAFC' : (rowIndex % 2 === 0 ? '#FFFFFF' : '#FAFBFC'),
  hLineColor: () => 'rgba(13, 27, 42, 0.08)',
  vLineColor: () => 'rgba(13, 27, 42, 0.08)',
  paddingLeft: () => 8,
  paddingRight: () => 8,
  paddingTop: () => 8,
  paddingBottom: () => 8,
}

// Common footer function
export function buildFooter(company) {
  return (currentPage, pageCount) => ({
    margin: [S.page, 0, S.page, S.sm],
    columns: [
      { text: company?.legalName || company?.name || '', style: 'footerText' },
      { text: `Page ${currentPage} of ${pageCount}`, alignment: 'right', style: 'footerText' },
    ],
  })
}
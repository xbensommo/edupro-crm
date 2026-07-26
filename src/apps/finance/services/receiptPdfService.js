/**
 * @file src/apps/finance/services/receiptPdfService.js
 * @description Financial-grade receipt PDF generator.
 * Refactored for strict visual hierarchy, 8pt grid, and enterprise accounting standards.
 */

import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
import logoUrl from '@/assets/images/logo.png'
import { financeCompanyProfile } from '../config/financeCompanyProfile.js'

pdfMake.vfs = pdfFonts?.pdfMake?.vfs || pdfFonts?.vfs

// --- Strict 8pt Spacing System ---
const S = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  page: 60,
}

// --- Utility Helpers ---
function safeText(value, fallback = '—') {
  const text = String(value ?? '').trim()
  return text || fallback
}

function safeNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function money(value, currency = 'NAD') {
  return new Intl.NumberFormat('en-NA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(safeNumber(value))
}

function dateText(value) {
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

function fileSafe(value) {
  return String(value || 'receipt')
    .trim()
    .replace(/[^a-z0-9-_]+/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}

async function imageUrlToDataUrl(url) {
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

// --- Core Document Builder ---
function buildDocDefinition({ receipt, company, logoDataUrl }) {
  const currency = receipt.currency || 'NAD'

  const receiptCode = safeText(receipt.receiptCode || receipt.id, 'REC-0001')
  const receiptTypeMap = {
    payment: 'Payment Receipt',
    refund: 'Refund Receipt',
    deposit: 'Deposit Receipt',
    credit_note: 'Credit Note',
  }
  const receiptTypeLabel = receiptTypeMap[receipt.receiptType] || 'Payment Receipt'
  const issueDate = dateText(receipt.paymentDate || receipt.createdAt)

  // --- 1. HEADER ---
  const headerLeft = [
    logoDataUrl ? { image: logoDataUrl, width: 60, height: 60, fit: [60, 60], margin: [0, 0, 0, S.xs] } : null,
    { text: safeText(company?.name, 'Company'), style: 'companyName' },
    company?.tagline ? { text: company.tagline, style: 'companyTagline' } : null,
    { text: [company?.phone, company?.email].filter(Boolean).join(' | '), style: 'companyContact' },
    { text: (Array.isArray(company?.addressLines) ? company.addressLines.join(', ') : ''), style: 'companyContact' },
  ].filter(Boolean)

  const headerRight = [
    { text: receiptTypeLabel.toUpperCase(), style: 'documentTitle' },
    { text: `# ${receiptCode}`, style: 'documentCode' },
    { text: `Date: ${issueDate}`, style: 'metaText' },
    { text: `Status: ${(receipt.status || 'draft').toUpperCase()}`, style: `status_${receipt.status || 'draft'}` },
    { text: `Currency: ${currency}`, style: 'metaText' },
  ].filter(Boolean)

  // --- 2. CLIENT & PAYMENT DETAILS ---
  const clientStack = [
    { text: 'Received From', style: 'sectionHeader' },
    { text: safeText(receipt.clientLabel || receipt.clientName || 'Unnamed Client'), style: 'clientName' },
    receipt.clientEmail ? { text: receipt.clientEmail, style: 'clientDetail' } : null,
    receipt.clientPhone ? { text: receipt.clientPhone, style: 'clientDetail' } : null,
    receipt.engagementCode ? { text: `Engagement: ${receipt.engagementCode}`, style: 'clientDetail' } : null,
  ].filter(Boolean)

  const paymentStack = [
    { text: 'Payment Details', style: 'sectionHeader' },
    { text: `Amount: ${money(receipt.amount, currency)}`, style: 'detailText' },
    { text: `Method: ${(receipt.paymentMethod || 'bank_transfer').replace('_', ' ').toUpperCase()}`, style: 'detailText' },
    receipt.referenceNumber ? { text: `Reference: ${receipt.referenceNumber}`, style: 'detailText' } : null,
    receipt.invoiceCode ? { text: `Invoice: ${receipt.invoiceCode}`, style: 'detailText' } : null,
  ].filter(Boolean)

  // --- 3. PAYMENT SUMMARY BOX (Distinct boxed layout for receipts) ---
  const summaryRows = [
    [
      { text: 'PAYMENT SUMMARY', style: 'summaryHeader', colSpan: 2, alignment: 'center', margin: [0, S.sm, 0, S.sm] },
      {},
    ],
    [
      { text: 'Amount Received', style: 'summaryLabel', alignment: 'right', margin: [0, S.xs, S.md, S.xs] },
      { text: money(receipt.amount, currency), style: 'summaryValue', alignment: 'right', margin: [0, S.xs, 0, S.xs] },
    ],
    [
      { text: 'Payment Date', style: 'summaryLabel', alignment: 'right', margin: [0, S.xs, S.md, S.xs] },
      { text: issueDate, style: 'summaryValue', alignment: 'right', margin: [0, S.xs, 0, S.xs] },
    ],
    [
      { text: 'Payment Method', style: 'summaryLabel', alignment: 'right', margin: [0, S.xs, S.md, S.xs] },
      { text: (receipt.paymentMethod || 'bank_transfer').replace('_', ' ').toUpperCase(), style: 'summaryValue', alignment: 'right', margin: [0, S.xs, 0, S.xs] },
    ],
    [
      { text: 'Status', style: 'summaryLabel', alignment: 'right', margin: [0, S.xs, S.md, S.xs] },
      { text: (receipt.status || 'draft').toUpperCase(), style: `status_${receipt.status || 'draft'}`, alignment: 'right', margin: [0, S.xs, 0, S.xs] },
    ],
  ]

  // --- 4. TERMS & BANKING ---
  const terms = Array.isArray(receipt?.terms) ? receipt.terms : []
  const termsStack = []
  if (terms.length) {
    termsStack.push(
      { text: 'Terms & Conditions', style: 'sectionHeader', margin: [0, S.lg, 0, S.sm] },
      {
        ul: terms.map(term => ({ text: term, style: 'bodyText', margin: [0, 2, 0, 2] })),
        margin: [0, 0, 0, 0],
      }
    )
  }

  const banking = company?.bankingDetails
  const bankingStack = []
  if (banking && (receipt.receiptType === 'payment' || receipt.receiptType === 'deposit')) {
    bankingStack.push(
      { text: 'Banking Details', style: 'sectionHeader', margin: [0, S.lg, 0, S.sm] },
      {
        table: {
          widths: ['30%', '70%'],
          body: [
            ['Bank', safeText(banking.bankName)],
            ['Account Name', safeText(banking.accountName)],
            ['Account Number', safeText(banking.accountNumber)],
            ['Branch Code', safeText(banking.branchCode)],
            ['Reference', safeText(banking.referenceNote || 'Receipt number')],
          ].map(([label, value]) => [
            { text: label, style: 'bankLabel' },
            { text: value, style: 'bankValue' },
          ]),
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 0],
      }
    )
  }

  // Notes
  const notesStack = []
  if (receipt.notes) {
    notesStack.push(
      { text: 'Notes', style: 'sectionHeader', margin: [0, S.lg, 0, S.sm] },
      { text: receipt.notes, style: 'bodyText', margin: [0, 0, 0, 0] }
    )
  }

  // --- FINAL DOCUMENT ---
  return {
    pageSize: 'A4',
    pageMargins: [S.page, S.page, S.page, S.page],

    content: [
      // Header
      {
        columns: [
          { width: '50%', stack: headerLeft, margin: [0, 0, S.md, 0] },
          { width: '50%', stack: headerRight, alignment: 'right' },
        ],
        columnGap: S.md,
        margin: [0, 0, 0, S.md],
      },
      // Divider
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1.5, lineColor: '#8E6E4E', }], margin: [0, 0, 0, S.lg] },

      // Client & Payment Details
      {
        columns: [
          { width: '50%', stack: clientStack, margin: [0, 0, S.md, 0] },
          { width: '50%', stack: paymentStack },
        ],
        columnGap: S.md,
        margin: [0, 0, 0, S.xl],
      },

      // Payment Summary Box
      {
        table: {
          widths: ['*', 150],
          body: summaryRows,
        },
        layout: {
          fillColor: (rowIndex) => rowIndex === 0 ? '#8E6E4E' : (rowIndex % 2 === 0 ? '#F4F0E8' : '#FFFFFF'),
          hLineColor: () => 'rgba(13, 27, 42, 0.08)',
          vLineColor: () => 'rgba(13, 27, 42, 0.08)',
          paddingLeft: () => 12,
          paddingRight: () => 12,
          paddingTop: () => 4,
          paddingBottom: () => 4,
        },
        margin: [0, 0, 0, S.lg],
      },

      // Terms
      ...termsStack,

      // Banking
      ...bankingStack,

      // Notes
      ...notesStack,

      // Footer Note
      {
        text: company?.footerNote || 'Thank you for your payment. This is an official receipt.',
        style: 'footerNote',
        margin: [0, S.xxl, 0, 0],
        alignment: 'center',
      },
    ],

    footer: (currentPage, pageCount) => ({
      margin: [S.page, 0, S.page, S.sm],
      columns: [
        { text: company?.legalName || company?.name || '', style: 'footerText' },
        { text: `Page ${currentPage} of ${pageCount}`, alignment: 'right', style: 'footerText' },
      ],
    }),

    // styles: {
    //   companyName: { fontSize: 18, bold: true, color: '#0F172A', margin: [0, 2, 0, 2] },
    //   companyTagline: { fontSize: 9, color: '#475569', margin: [0, 0, 0, S.sm] },
    //   companyContact: { fontSize: 8, color: '#64748B', margin: [0, 1, 0, 1] },
    //   documentTitle: { fontSize: 24, bold: true, color: '#0F172A', letterSpacing: 1, margin: [0, 0, 0, 4] },
    //   documentCode: { fontSize: 14, bold: true, color: '#1860A8', margin: [0, 0, 0, S.md] },
    //   metaText: { fontSize: 8, color: '#64748B', margin: [0, 1, 0, 1] },

    //   sectionHeader: { fontSize: 9, bold: true, color: '#475569', letterSpacing: 0.5, margin: [0, 0, 0, S.xs] },
    //   clientName: { fontSize: 14, bold: true, color: '#0F172A', margin: [0, 0, 0, S.xs] },
    //   clientDetail: { fontSize: 9, color: '#475569', margin: [0, 1, 0, 1] },
    //   detailText: { fontSize: 9, color: '#0F172A', margin: [0, 1, 0, 1] },

    //   status_draft: { fontSize: 8, color: '#F59E0B', bold: true },
    //   status_issued: { fontSize: 8, color: '#10B981', bold: true },
    //   status_cancelled: { fontSize: 8, color: '#EF4444', bold: true },

    //   summaryHeader: { fontSize: 11, bold: true, color: '#FFFFFF' },
    //   summaryLabel: { fontSize: 9, color: '#475569' },
    //   summaryValue: { fontSize: 9, bold: true, color: '#0F172A' },

    //   bankLabel: { fontSize: 8, bold: true, color: '#475569', margin: [0, 2, 0, 2] },
    //   bankValue: { fontSize: 8, color: '#0F172A', margin: [0, 2, 0, 2] },

    //   bodyText: { fontSize: 9, color: '#0F172A', lineHeight: 1.5 },
    //   footerNote: { fontSize: 9, color: '#64748B', italic: true },
    //   footerText: { fontSize: 8, color: '#94A3B8' },
    // },

    styles: {
      // --- HEADER ---
      companyName: { fontSize: 18, bold: true, color: '#1A1A1A', margin: [0, 2, 0, 2] },
      companyTagline: { fontSize: 9, color: '#575757', margin: [0, 0, 0, 8] },
      companyContact: { fontSize: 8, color: '#8B99A8', margin: [0, 1, 0, 1] },
      
      documentTitle: { fontSize: 24, bold: true, color: '#1A1A1A', letterSpacing: 1, margin: [0, 0, 0, 4] },
      documentCode: { fontSize: 14, bold: true, color: '#C5A059', margin: [0, 0, 0, 16] }, // Accent color
      metaText: { fontSize: 8, color: '#575757', margin: [0, 1, 0, 1] },

      // --- SECTIONS ---
      sectionHeader: { fontSize: 9, bold: true, color: '#575757', letterSpacing: 0.5, margin: [0, 0, 0, 6] },
      clientName: { fontSize: 14, bold: true, color: '#1A1A1A', margin: [0, 0, 0, 4] },
      clientDetail: { fontSize: 9, color: '#575757', margin: [0, 1, 0, 1] },
      detailText: { fontSize: 9, color: '#1A1A1A', margin: [0, 1, 0, 1] },

      // --- STATUSES ---
      status_draft: { fontSize: 8, color: '#C5A059', bold: true },
      status_issued: { fontSize: 8, color: '#8E6E4E', bold: true },
      status_paid: { fontSize: 8, color: '#2e7d32', bold: true },
      status_partially_paid: { fontSize: 8, color: '#C5A059', bold: true },
      status_cancelled: { fontSize: 8, color: '#d32f2f', bold: true },

      // --- TABLE ---
      tableHeader: { 
        fontSize: 9, bold: true, color: '#1A1A1A', 
        fillColor: '#F4F0E8', // Your --color-surface-2
        margin: [0, 4, 0, 4] 
      },
      cellText: { fontSize: 9, color: '#1A1A1A', margin: [0, 2, 0, 2] },

      // --- SUMMARY ---
      summaryLabel: { fontSize: 9, color: '#575757', margin: [0, 2, 0, 2] },
      summaryValue: { fontSize: 9, color: '#1A1A1A', alignment: 'right', margin: [0, 2, 0, 2] },
      summaryDiscount: { fontSize: 9, bold: true, color: '#d32f2f', alignment: 'right', margin: [0, 2, 0, 2] },
      summaryPaid: { fontSize: 9, bold: true, color: '#2e7d32', alignment: 'right', margin: [0, 2, 0, 2] },
      
      totalLabel: { fontSize: 12, bold: true, color: '#1A1A1A', margin: [0, 6, 0, 3] },
      totalValue: { fontSize: 12, bold: true, color: '#1A1A1A', alignment: 'right', margin: [0, 6, 0, 3] },
      balanceLabel: { fontSize: 14, bold: true, color: '#1A1A1A', margin: [0, 8, 0, 4] },
      balanceValue: { fontSize: 14, bold: true, color: '#1A1A1A', alignment: 'right', margin: [0, 8, 0, 4] },

      // --- BANKING ---
      bankLabel: { fontSize: 8, bold: true, color: '#575757', margin: [0, 2, 0, 2] },
      bankValue: { fontSize: 8, color: '#1A1A1A', margin: [0, 2, 0, 2] },

      // --- BODY / MISC ---
      bodyText: { fontSize: 9, color: '#1A1A1A', lineHeight: 1.5 },
      acceptanceLine: { fontSize: 10, color: '#1A1A1A', margin: [0, 8, 0, 0] },
      acceptanceLabel: { fontSize: 8, color: '#8B99A8' },
      footerNote: { fontSize: 9, color: '#575757', italic: true },
      footerText: { fontSize: 8, color: '#8B99A8' },
    }
  }
}

// --- EXPORTED FUNCTIONS ---
export async function downloadReceiptPdf(receipt, options = {}) {
  if (!receipt) throw new Error('[receipt-pdf] Missing receipt.')

  const company = { ...financeCompanyProfile, ...(options.company || {}) }
  const logoDataUrl = await imageUrlToDataUrl(options?.logoUrl || logoUrl)
  const receiptCode = safeText(receipt.receiptCode || receipt.id, 'REC-0001')
  const filename = options?.filename || `${fileSafe(receiptCode)}.pdf`

  const docDefinition = buildDocDefinition({ receipt, company, logoDataUrl })
  pdfMake.createPdf(docDefinition).download(filename)
}
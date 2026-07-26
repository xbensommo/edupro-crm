/**
 * @file src/apps/finance/services/receiptPdfService.js
 * @description Financial-grade receipt PDF generator.
 */

import { financeCompanyProfile } from '../config/financeCompanyProfile.js'
import logoUrl from '@/assets/images/logo.png'
import {
  S,
  safeText,
  safeNumber,
  money,
  dateText,
  fileSafe,
  imageUrlToDataUrl,
  commonStyles,
  buildFooter,
} from '../../../services/pdfCommon.js'
import pdfMake from 'pdfmake/build/pdfmake'

// --- Core Builder ---
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

  // Header
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

  // Client & Payment Details
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

  // Payment Summary Box
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

  // Terms & Banking
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
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1.5, lineColor: '#8E6E4E' }], margin: [0, 0, 0, S.lg] },

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

      ...termsStack,
      ...bankingStack,
      ...notesStack,

      // Footer Note
      {
        text: company?.footerNote || 'Thank you for your payment. This is an official receipt.',
        style: 'footerNote',
        margin: [0, S.xxl, 0, 0],
        alignment: 'center',
      },
    ],

    footer: buildFooter(company),

    styles: commonStyles,
  }
}

// --- Export functions ---
export async function downloadReceiptPdf(receipt, options = {}) {
  if (!receipt) throw new Error('[receipt-pdf] Missing receipt.')

  const company = { ...financeCompanyProfile, ...(options.company || {}) }
  const logoDataUrl = await imageUrlToDataUrl(options?.logoUrl || logoUrl)
  const receiptCode = safeText(receipt.receiptCode || receipt.id, 'REC-0001')
  const filename = options?.filename || `${fileSafe(receiptCode)}.pdf`

  const docDefinition = buildDocDefinition({ receipt, company, logoDataUrl })
  pdfMake.createPdf(docDefinition).download(filename)
}
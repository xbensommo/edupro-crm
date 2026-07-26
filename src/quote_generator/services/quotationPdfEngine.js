/**
 * @file src/services/quotationPdfEngine.js
 * @description Financial-grade quotation PDF generator.
 */

import { quotationCompanyProfile } from '../config/quotationCompanyProfile.js'
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
  tableLayout,
  buildFooter,
} from './pdfCommon.js'
import pdfMake from 'pdfmake/build/pdfmake'

// --- Local helpers specific to quotation ---
function normalizeLineItems(quotation) {
  const rawItems = Array.isArray(quotation?.data?.lineItems) ? quotation.data.lineItems : []
  if (!rawItems.length) {
    const total = safeNumber(quotation?.data?.totalAmount ?? quotation?.data?.amount)
    return [{
      number: 1,
      description: safeText(quotation?.data?.description || quotation?.data?.reference?.value || 'Professional service'),
      quantity: 1,
      unitPrice: total,
      total,
    }]
  }
  return rawItems.map((item, index) => {
    const quantity = safeNumber(item?.quantity, 1)
    const unitPrice = safeNumber(item?.unitPrice ?? item?.price ?? item?.amount)
    const total = safeNumber(item?.totalAmount ?? item?.total ?? quantity * unitPrice)
    return {
      number: index + 1,
      description: safeText(item?.description || item?.label || item?.name, 'Quotation item'),
      quantity,
      unitPrice,
      total,
    }
  })
}

// --- Core Builder ---
function buildDocDefinition({ quotation, company, logoDataUrl, title = 'QUOTATION' }) {
  const data = quotation?.data || {}
  const currency = data?.currency || 'NAD'
  const lineItems = normalizeLineItems(quotation)

  const subtotal = lineItems.reduce((sum, item) => sum + safeNumber(item.total), 0)
  const discount = safeNumber(data?.discountAmount)
  const tax = safeNumber(data?.taxAmount)
  const total = safeNumber(data?.totalAmount ?? subtotal - discount + tax)
  const deposit = safeNumber(data?.depositAmount ?? data?.depositRequired)

  

  const quoteCode = safeText(data?.quoteCode || data?.quotationCode || data?.number || quotation?.id, 'Quotation')
  const quoteDate = dateText(data?.quoteDate || data?.issueDate || data?.createdAt)
  const validUntil = dateText(data?.validUntil || data?.expiryDate)

  // --- Header ---
  const headerLeft = [
    logoDataUrl ? { image: logoDataUrl, width: 60, height: 60, fit: [60, 60], margin: [0, 0, 0, S.xs] } : null,
    { text: safeText(company?.name, 'Company'), style: 'companyName' },
    company?.tagline ? { text: company.tagline, style: 'companyTagline' } : null,
    { text: [company?.phone, company?.email].filter(Boolean).join(' | '), style: 'companyContact' },
    { text: (Array.isArray(company?.addressLines) ? company.addressLines.join(', ') : ''), style: 'companyContact' },
  ].filter(Boolean)

  const headerRight = [
    { text: title, style: 'documentTitle' },
    { text: `# ${quoteCode}`, style: 'documentCode' },
    { text: `Issue Date: ${quoteDate}`, style: 'metaText' },
    { text: `Expiry Date: ${validUntil}`, style: 'metaText' },
    { text: `Currency: ${currency}`, style: 'metaText' },
    //data?.status ? { text: `Status: ${data.status.toUpperCase()}`, style: 'metaText' } : null,
  ].filter(Boolean)

  // --- Client & Details ---
  const client = data?.client || {}
  const clientStack = [
    { text: 'Prepared For', style: 'sectionHeader' },
    { text: safeText(client?.name), style: 'clientName' },
    client?.email ? { text: client.email, style: 'clientDetail' } : null,
    client?.phone ? { text: client.phone, style: 'clientDetail' } : null,
    client?.number ? { text: `Client #: ${client.number}`, style: 'clientDetail' } : null,
  ].filter(Boolean)

  const detailsStack = [
    { text: 'Quotation Details', style: 'sectionHeader' },
    { text: `Date: ${quoteDate}`, style: 'detailText' },
    { text: `Valid Until: ${validUntil}`, style: 'detailText' },
    data?.reference?.value ? { text: `${safeText(data.reference.label, 'Reference')}: ${data.reference.value}`, style: 'detailText' } : null,
  ].filter(Boolean)

  // --- Line Items Table ---
  const tableHeaders = ['#', 'Description', 'Qty', 'Unit Price', 'Total']
  const tableWidths = [28, '*', 45, 80, 80]
  const tableBody = [
    tableHeaders.map(text => ({ text, style: 'tableHeader' })),
    ...lineItems.map((item) => [
      { text: String(item.number), style: 'cellText' },
      { text: item.description, style: 'cellText' },
      { text: String(item.quantity), style: 'cellText', alignment: 'right' },
      { text: money(item.unitPrice, currency), style: 'cellText', alignment: 'right' },
      { text: money(item.total, currency), style: 'cellText', alignment: 'right' },
    ]),
  ]

  // --- Summary ---
  const summaryRows = []
  summaryRows.push([
    { text: 'Subtotal', style: 'summaryLabel' },
    { text: money(subtotal, currency), style: 'summaryValue' },
  ])
  if (discount > 0) {
    summaryRows.push([
      { text: 'Discount', style: 'summaryLabel' },
      { text: `- ${money(discount, currency)}`, style: 'summaryDiscount' },
    ])
  }
  if (tax > 0) {
    summaryRows.push([
      { text: 'Tax', style: 'summaryLabel' },
      { text: money(tax, currency), style: 'summaryValue' },
    ])
  }
  summaryRows.push([
    { text: 'Grand Total', style: 'totalLabel' },
    { text: money(total, currency), style: 'totalValue' },
  ])
  if (deposit > 0) {
    summaryRows.push([
      { text: 'Deposit Required', style: 'summaryLabel' },
      { text: money(deposit, currency), style: 'summaryValue' },
    ])
  }

  // --- Terms & Banking ---
  const terms = Array.isArray(data?.terms) ? data.terms : []
  const termsStack = []
  if (data?.notes || terms.length) {
    termsStack.push({ text: 'Terms & Notes', style: 'sectionHeader', margin: [0, S.lg, 0, S.sm] })
    if (data?.notes) {
      termsStack.push({ text: data.notes, style: 'bodyText', margin: [0, 0, 0, S.sm] })
    }
    if (terms.length) {
      termsStack.push({
        ul: terms.map(term => ({ text: term, style: 'bodyText', margin: [0, 2, 0, 2] })),
        margin: [0, 0, 0, 0],
      })
    }
  }

  const banking = company?.bankingDetails
  const bankingStack = []
  if (banking) {
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
            ['Reference', safeText(banking.referenceNote)],
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

  // Acceptance
  const acceptanceBlock = data?.showAcceptance === false ? null : {
    margin: [0, S.xl, 0, 0],
    columns: [
      { width: '50%', stack: [{ text: 'Accepted By', style: 'sectionHeader' }, { text: '\n\n_________________________\n', style: 'acceptanceLine' }, { text: 'Signature / Name', style: 'acceptanceLabel' }] },
      { width: '50%', stack: [{ text: 'Date', style: 'sectionHeader' }, { text: '\n\n_________________________\n', style: 'acceptanceLine' }, { text: 'Date', style: 'acceptanceLabel' }] },
    ],
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
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1.5, lineColor: '#8E6E4E' }], margin: [0, 0, 0, S.lg] },

      // Client & Details
      {
        columns: [
          { width: '100%', stack: clientStack, margin: [0, 0, S.md, 0] },
          // { width: '50%', stack: detailsStack },
        ],
        columnGap: S.md,
        margin: [0, 0, 0, S.xl],
      },

      // Line Items
      {
        table: {
          headerRows: 1,
          widths: tableWidths,
          body: tableBody,
        },
        layout: tableLayout,
        margin: [0, 0, 0, S.lg],
      },

      // Summary
      {
        columns: [
          { width: '*', text: '' },
          {
            width: '40%',
            table: {
              widths: ['*', 'auto'],
              body: summaryRows.map((row, index) => {
                const isTotal = row[0].text === 'Grand Total'
                return row.map((cell, colIndex) => ({
                  ...cell,
                  margin: [0, (isTotal && colIndex === 0) ? S.sm : S.xs, 0, (isTotal && colIndex === 0) ? S.sm : S.xs],
                }))
              }),
            },
            layout: {
              hLineWidth: (i) => {
                if (i === summaryRows.length - 1) return 2.5
                if (i === summaryRows.length - 2) return 0.5
                return 0
              },
              hLineColor: (i) => i === summaryRows.length - 1 ? '#0F172A' : '#E2E8F0',
              vLineWidth: () => 0,
              paddingTop: () => 4,
              paddingBottom: () => 4,
            },
            margin: [0, 0, 0, 0],
          },
        ],
        margin: [0, 0, 0, S.lg],
      },

      ...termsStack,
      ...bankingStack,
      //acceptanceBlock,

      // Footer Note
      {
        text: quotation?.footerNote || 'This quotation is an offer and becomes binding only upon 50% deposit payment.',
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
export async function downloadQuotationPdf(quotation, options = {}) {
  if (!quotation || typeof quotation !== 'object') {
    throw new Error('[quotation-pdf] Missing quotation payload.')
  }
  const company = { ...quotationCompanyProfile, ...(options.company || {}) }
  const logoDataUrl = await imageUrlToDataUrl(options?.logoUrl || logoUrl)
  const data = quotation?.data || {}
  const quoteCode = safeText(data?.quoteCode || data?.quotationCode || data?.number || quotation?.id, 'quotation')
  const filename = options?.filename || `${fileSafe(quoteCode)}.pdf`

  const docDefinition = buildDocDefinition({ quotation, company, logoDataUrl, title: options?.title || 'QUOTATION' })
  pdfMake.createPdf(docDefinition).download(filename)
}

export async function openQuotationPdf(quotation, options = {}) {
  if (!quotation || typeof quotation !== 'object') {
    throw new Error('[quotation-pdf] Missing quotation payload.')
  }
  const company = { ...quotationCompanyProfile, ...(options.company || {}) }
  const logoDataUrl = await imageUrlToDataUrl(options?.logoUrl || logoUrl)
  const docDefinition = buildDocDefinition({ quotation, company, logoDataUrl, title: options?.title || 'QUOTATION' })
  pdfMake.createPdf(docDefinition).open()
}
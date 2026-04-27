/**
 * @file src/services/quotationPdfEngine.js
 * @description Reusable browser-side quotation PDF generator using structured quotation data.
 *
 * Install:
 * npm i pdfmake
 */

import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
import { quotationCompanyProfile } from '../config/quotationCompanyProfile.js'

pdfMake.vfs = pdfFonts?.pdfMake?.vfs || pdfFonts?.vfs

const DEFAULT_CURRENCY = 'NAD'

import logoUrl from '@/assets/images/logo.png'
  

function safeText(value, fallback = '—') {
  const text = String(value ?? '').trim()
  return text || fallback
}

function safeNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function money(value, currency = DEFAULT_CURRENCY) {
  return new Intl.NumberFormat('en-NA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(safeNumber(value))
}

function dateText(value) {
  if (!value) return '—'

  const date = typeof value?.toDate === 'function'
    ? value.toDate()
    : value?.seconds
      ? new Date(value.seconds * 1000)
      : new Date(value)

  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('en-NA', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(date)
}

function fileSafe(value) {
  return String(value || 'quotation')
    .trim()
    .replace(/[^a-z0-9-_]+/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}

async function imageUrlToDataUrl(url) {
  if (!url) return null

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('[quotation-pdf] Failed to load logo image.')
  }

  const blob = await response.blob()

  return await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function normalizeLineItems(quotation) {
  const rawItems = Array.isArray(quotation?.lineItems) ? quotation.data.lineItems : []

  if (!rawItems.length) {
    const total = safeNumber(quotation?.data.totalAmount ?? quotation?.data.amount)

    return [
      {
        number: 1,
        description: safeText(quotation?.description || quotation?.reference?.value, 'Professional service'),
        quantity: 1,
        unitPrice: total,
        total,
      },
    ]
  }

  return rawItems.map((item, index) => {
    const quantity = safeNumber(item.quantity, 1)
    const unitPrice = safeNumber(item.unitPrice ?? item.price ?? item.amount)
    const total = safeNumber(item.totalAmount ?? item.total ?? quantity * unitPrice)

    return {
      number: index + 1,
      description: safeText(item.description || item.label || item.name, 'Quotation item'),
      quantity,
      unitPrice,
      total,
    }
  })
}

function buildBankingDetailsTable(company) {
  const banking = company?.bankingDetails

  if (!banking) return null

  return {
    margin: [0, 28, 0, 0],
    stack: [
      {
        text: 'Banking Details',
        style: 'sectionTitle',
        margin: [0, 0, 0, 8],
      },
      {
        table: {
          widths: ['35%', '65%'],
          body: [
            ['Bank', safeText(banking.bankName)],
            ['Account Name', safeText(banking.accountName)],
            ['Account Number', safeText(banking.accountNumber)],
            ['Branch Code', safeText(banking.branchCode)],
            ['Account Type', safeText(banking.accountType)],
            ['Payment Reference', safeText(banking.referenceNote)],
          ].map(([label, value]) => [
            {
              text: label,
              bold: true,
              fillColor: '#F8FAFC',
              margin: [8, 6, 8, 6],
            },
            {
              text: value,
              margin: [8, 6, 8, 6],
            },
          ]),
        },
        layout: {
          hLineColor() {
            return '#E2E8F0'
          },
          vLineColor() {
            return '#E2E8F0'
          },
        },
      },
    ],
  }
}

function buildLineItemTable(lineItems, currency) {
  return [
    [
      { text: '#', style: 'tableHead' },
      { text: 'Description', style: 'tableHead' },
      { text: 'Qty', style: 'tableHead', alignment: 'right' },
      { text: 'Unit Price', style: 'tableHead', alignment: 'right' },
      { text: 'Total', style: 'tableHead', alignment: 'right' },
    ],
    ...lineItems.map((item) => [
      { text: String(item.number), margin: [0, 4, 0, 4] },
      { text: item.description, margin: [0, 4, 0, 4] },
      { text: String(item.quantity), alignment: 'right', margin: [0, 4, 0, 4] },
      { text: money(item.unitPrice, currency), alignment: 'right', margin: [0, 4, 0, 4] },
      { text: money(item.total, currency), alignment: 'right', margin: [0, 4, 0, 4] },
    ]),
  ]
}

function companyStack(company) {
  return [
    { text: safeText(company.name, 'Company'), style: 'companyName' },
    company.tagline ? { text: company.tagline, style: 'muted' } : null,
    company.email ? { text: company.email, style: 'muted' } : null,
    company.phone ? { text: company.phone, style: 'muted' } : null,
    company.website ? { text: company.website, style: 'muted' } : null,
    ...(Array.isArray(company.addressLines) ? company.addressLines.map((line) => ({ text: line, style: 'muted' })) : []),
    company.registrationNumber ? { text: `Reg: ${company.registrationNumber}`, style: 'muted' } : null,
    company.taxNumber ? { text: `Tax: ${company.taxNumber}`, style: 'muted' } : null,
  ].filter(Boolean)
}

function clientStack(client = {}) {
  return [
    { text: 'Prepared For', style: 'sectionTitle' },
    { text: safeText(client.name), style: 'strongText' },
    client.number ? { text: `Client No: ${client.number}`, style: 'muted' } : null,
    client.email ? { text: client.email, style: 'muted' } : null,
    client.phone ? { text: client.phone, style: 'muted' } : null,
    ...(Array.isArray(client.addressLines) ? client.addressLines.map((line) => ({ text: line, style: 'muted' })) : []),
  ].filter(Boolean)
}

function referenceStack(reference = {}, quotation = {}) {
  return [
    { text: 'Reference', style: 'sectionTitle' },
    reference.label || reference.value
      ? { text: `${safeText(reference.label, 'Reference')}: ${safeText(reference.value)}`, style: 'muted' }
      : null,
    quotation.data.status ? { text: `Status: ${quotation.data.status}`, style: 'muted' } : null,
    quotation.data.currency ? { text: `Currency: ${quotation.data.currency}`, style: 'muted' } : null,
    quotation.data.validityNote ? { text: quotation.data.validityNote, style: 'muted' } : null,
  ].filter(Boolean)
}

function termsStack(quotation = {}) {
  const terms = Array.isArray(quotation.data.terms) ? quotation.data.terms : []

  if (!terms.length && !quotation.data.notes) return []

  return [
    { text: 'Terms & Notes', style: 'sectionTitle', margin: [0, 28, 0, 6] },
    quotation.data.notes ? { text: quotation.data.notes, style: 'bodyText', margin: [0, 0, 0, 6] } : null,
    ...terms.map((term) => ({ text: `• ${term}`, style: 'bodyText', margin: [0, 2, 0, 2] })),
  ].filter(Boolean)
}

function acceptanceBlock(quotation = {}) {
  if (quotation.data.showAcceptance === false) return null

  return {
    margin: [0, 34, 0, 0],
    table: {
      widths: ['*', '*'],
      body: [
        [
          { text: 'Accepted By', style: 'sectionTitle' },
          { text: 'Date', style: 'sectionTitle' },
        ],
        [
          { text: '\n\n______________________________', style: 'bodyText' },
          { text: '\n\n______________________________', style: 'bodyText' },
        ],
      ],
    },
    layout: 'noBorders',
  }
}

function buildDocDefinition({ quotation, company, logoDataUrl, title = 'QUOTATION' }) {
  const currency = quotation.data.currency || DEFAULT_CURRENCY
  const lineItems = normalizeLineItems(quotation)
  const subtotal = lineItems.reduce((sum, item) => sum + safeNumber(item.total), 0)
  const discount = safeNumber(quotation.data.discountAmount)
  const total = safeNumber(quotation.data.totalAmount ?? subtotal - discount)
  const deposit = safeNumber(quotation.data.depositAmount ?? quotation.data.depositRequired)
  const quoteCode = safeText(quotation.data.quoteCode || quotation.data.quotationCode || quotation.data.number || quotation.id, 'Quotation')

  const summaryBody = [
    [{ text: 'Subtotal', style: 'summaryLabel' }, { text: money(subtotal, currency), style: 'summaryValue' }],
  ]

  if (discount > 0) {
    summaryBody.push([{ text: 'Discount', style: 'summaryLabel' }, { text: money(discount, currency), style: 'summaryValue' }])
  }

  summaryBody.push([{ text: 'Total', style: 'totalLabel' }, { text: money(total, currency), style: 'totalValue' }])

  if (deposit > 0) {
    summaryBody.push([{ text: 'Deposit Required', style: 'summaryLabel' }, { text: money(deposit, currency), style: 'summaryValue' }])
  }

  const content = [
    {
      columns: [
        logoUrl
          ? {
              width: 90,
              image: logoDataUrl,
              fit: [80, 80],
            }
          : { width: 0, text: '' },
        {
          width: '*',
          stack: companyStack(company),
        },
        {
          width: 165,
          stack: [
            { text: title, style: 'documentTitle', alignment: 'right' },
            { text: quoteCode, style: 'documentCode', alignment: 'right' },
            { text: `Quote date: ${dateText(quotation.data.quoteDate || quotation.data.issueDate || quotation.data.createdAt)}`, style: 'rightMeta' },
            { text: `Valid until: ${dateText(quotation.data.validUntil || quotation.data.expiryDate)}`, style: 'rightMeta' },
          ],
        },
      ],
      columnGap: 12,
    },

    {
      canvas: [
        {
          type: 'line',
          x1: 0,
          y1: 18,
          x2: 515,
          y2: 18,
          lineWidth: 1,
          lineColor: '#E2E8F0',
        },
      ],
      margin: [0, 4, 0, 24],
    },

    {
      columns: [
        { width: '*', stack: clientStack(quotation.data.client) },
        { width: '*', stack: referenceStack(quotation.data.reference, quotation) },
      ],
      columnGap: 24,
      margin: [0, 0, 0, 24],
    },

    {
      table: {
        headerRows: 1,
        widths: [28, '*', 45, 85, 85],
        body: buildLineItemTable(lineItems, currency),
      },
      layout: {
        fillColor(rowIndex) {
          return rowIndex === 0 ? '#F8FAFC' : null
        },
        hLineColor() {
          return '#E2E8F0'
        },
        vLineColor() {
          return '#E2E8F0'
        },
      },
    },

    {
      columns: [
        { width: '*', text: '' },
        {
          width: 230,
          table: {
            widths: ['*', 95],
            body: summaryBody,
          },
          layout: 'noBorders',
          margin: [0, 24, 0, 0],
        },
      ],
    },

    ...termsStack(quotation),

    buildBankingDetailsTable(company),
  ]

  const acceptance = acceptanceBlock(quotation)
  if (acceptance) content.push(acceptance)

  content.push(
    quotation.footerNote
      ? { text: quotation.footerNote, style: 'footerNote', margin: [0, 30, 0, 0] }
      : { text: 'This quotation becomes binding only after acceptance and payment terms are confirmed.', style: 'footerNote', margin: [0, 30, 0, 0] },
  )

  return {
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 50],
    content,

    footer(currentPage, pageCount) {
      return {
        margin: [40, 0, 40, 20],
        columns: [
          { text: company.legalName || company.name || '', style: 'footerText' },
          { text: `Page ${currentPage} of ${pageCount}`, alignment: 'right', style: 'footerText' },
        ],
      }
    },

    styles: {
      companyName: { fontSize: 18, bold: true, color: '#0F172A' },
      documentTitle: { fontSize: 24, bold: true, color: '#0F172A' },
      documentCode: { fontSize: 10, bold: true, color: '#1860A8', margin: [0, 4, 0, 8] },
      sectionTitle: { fontSize: 9, bold: true, color: '#64748B', characterSpacing: 1.2, margin: [0, 0, 0, 6] },
      tableHead: { fontSize: 9, bold: true, color: '#0F172A', margin: [0, 5, 0, 5] },
      strongText: { fontSize: 11, bold: true, color: '#0F172A', margin: [0, 0, 0, 4] },
      bodyText: { fontSize: 9, color: '#0F172A' },
      muted: { fontSize: 9, color: '#64748B', margin: [0, 1, 0, 1] },
      rightMeta: { fontSize: 9, color: '#64748B', alignment: 'right', margin: [0, 1, 0, 1] },
      summaryLabel: { fontSize: 10, color: '#64748B', margin: [0, 3, 0, 3] },
      summaryValue: { fontSize: 10, bold: true, color: '#0F172A', alignment: 'right', margin: [0, 3, 0, 3] },
      totalLabel: { fontSize: 11, bold: true, color: '#0F172A', margin: [0, 8, 0, 0] },
      totalValue: { fontSize: 11, bold: true, color: '#0F172A', alignment: 'right', margin: [0, 8, 0, 0] },
      footerNote: { fontSize: 9, color: '#64748B' },
      footerText: { fontSize: 8, color: '#94A3B8' },
    },

    defaultStyle: {
      fontSize: 10,
      color: '#0F172A',
    },
  }
}

/**
 * Downloads a structured quotation as PDF.
 *
 * @param {object} quotation Generic quotation payload.
 * @param {object} options Optional PDF settings.
 * @param {object} options.company Override company profile.
 * @param {string} options.logoUrl Override logo URL.
 * @param {string} options.title PDF title. Defaults to QUOTATION.
 * @param {string} options.filename Override output filename.
 * @returns {Promise<void>}
 */
export async function downloadQuotationPdf(quotation, options = {}) {
  if (!quotation || typeof quotation !== 'object') {
    throw new Error('[quotation-pdf] Missing quotation payload.')
  }

  const company = {
    ...quotationCompanyProfile,
    ...(options.company || {}),
  }

  const logoDataUrl = await imageUrlToDataUrl(logoUrl)
  const quoteCode = safeText(quotation.data.quoteCode || quotation.data.quotationCode || quotation.data.number || quotation.id, 'quotation')
  const filename = options.filename || `${fileSafe(quoteCode)}.pdf`

  const docDefinition = buildDocDefinition({
    quotation,
    company,
    logoDataUrl,
    title: options.title || 'QUOTATION',
  })

  pdfMake.createPdf(docDefinition).download(filename)
}

/**
 * Opens a structured quotation as PDF in a new browser tab.
 *
 * @param {object} quotation Generic quotation payload.
 * @param {object} options Optional PDF settings.
 * @returns {Promise<void>}
 */
export async function openQuotationPdf(quotation, options = {}) {
  if (!quotation || typeof quotation !== 'object') {
    throw new Error('[quotation-pdf] Missing quotation payload.')
  }

  const company = {
    ...quotationCompanyProfile,
    ...(options.company || {}),
  }

  const logoDataUrl = await imageUrlToDataUrl(logoUrl)
  const docDefinition = buildDocDefinition({
    quotation,
    company,
    logoDataUrl,
    title: options.title || 'QUOTATION',
  })

  pdfMake.createPdf(docDefinition).open()
}

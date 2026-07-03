/**
 * @file src/services/quotationPdfEngine.js
 * @description Reusable browser-side quotation PDF generator using structured quotation data.
 *
 * Install:
 * npm i pdfmake
 * npm i @fortawesome/fontawesome-free
 */

import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
import { quotationCompanyProfile } from '../config/quotationCompanyProfile.js'

// Import Font Awesome for icons
import '@fortawesome/fontawesome-free/css/all.min.css'

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

  if (value?.toDate && typeof value.toDate === 'function') {
    const date = value.toDate()
    if (!isNaN(date.getTime())) {
      return new Intl.DateTimeFormat('en-NA', {
        year: 'numeric',
        month: 'long',
        day: '2-digit',
      }).format(date)
    }
  }

  let date
  if (value?.seconds !== undefined) {
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
  return String(value || 'quotation')
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

    if (!response.ok) {
      console.warn('[quotation-pdf] Failed to load logo image:', response.status)
      return null
    }

    const blob = await response.blob()

    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.warn('[quotation-pdf] Error loading logo image:', error)
    return null
  }
}

function normalizeLineItems(quotation) {
  const rawItems = Array.isArray(quotation?.data?.lineItems) ? quotation.data.lineItems : []

  if (!rawItems.length) {
    console.debug('[normalizeLineItems] No line items found, using fallback')
  }

  if (!rawItems.length) {
    const total = safeNumber(quotation?.data?.totalAmount ?? quotation?.data?.amount)
    
    return [
      {
        number: 1,
        description: safeText(
          quotation?.data?.description || 
          quotation?.data?.reference?.value || 
          'Professional service'
        ),
        quantity: 1,
        unitPrice: total,
        total,
      },
    ]
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

function buildBankingDetailsTable(company) {
  const banking = company?.bankingDetails

  if (!banking) return null

  return {
    margin: [0, 30, 0, 0],
    stack: [
      {
        text: 'Banking Details',
        style: 'sectionHeader',
        margin: [0, 0, 0, 12],
      },
      {
        table: {
          widths: ['30%', '70%'],
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
              fontSize: 9,
              color: '#475569',
              margin: [0, 4, 0, 4],
            },
            {
              text: value,
              fontSize: 9,
              color: '#0F172A',
              margin: [0, 4, 0, 4],
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
          paddingLeft: function(i, node) { return 6; },
          paddingRight: function(i, node) { return 6; },
          paddingTop: function(i, node) { return 2; },
          paddingBottom: function(i, node) { return 2; },
        },
      },
    ],
  }
}

function buildLineItemTable(lineItems, currency) {
  return [
    [
      { text: '#', style: 'tableHeader' },
      { text: 'Description', style: 'tableHeader' },
      { text: 'Qty', style: 'tableHeader', alignment: 'right' },
      { text: 'Unit Price', style: 'tableHeader', alignment: 'right' },
      { text: 'Total', style: 'tableHeader', alignment: 'right' },
    ],
    ...lineItems.map((item) => [
      { text: String(item.number), margin: [0, 6, 0, 6], fontSize: 9 },
      { text: item.description, margin: [0, 6, 0, 6], fontSize: 9 },
      { text: String(item.quantity), alignment: 'right', margin: [0, 6, 0, 6], fontSize: 9 },
      { text: money(item.unitPrice, currency), alignment: 'right', margin: [0, 6, 0, 6], fontSize: 9 },
      { text: money(item.total, currency), alignment: 'right', margin: [0, 6, 0, 6], fontSize: 9 },
    ]),
  ]
}

function companyStack(company) {
  return [
    { text: safeText(company?.name, 'Company'), style: 'companyName' },
    company?.tagline ? { text: company.tagline, style: 'companyTagline' } : null,
    company?.email ? { text: `${company.email}`, style: 'companyDetail' } : null,
    company?.phone ? { text: `${company.phone}`, style: 'companyDetail' } : null,
    company?.website ? { text: `${company.website}`, style: 'companyDetail' } : null,
    ...(Array.isArray(company?.addressLines) ? company.addressLines.map((line) => ({ text: `${line}`, style: 'companyDetail' })) : []),
    company?.registrationNumber ? { text: `Reg: ${company.registrationNumber}`, style: 'companyDetail' } : null,
    company?.taxNumber ? { text: `Tax: ${company.taxNumber}`, style: 'companyDetail' } : null,
  ].filter(Boolean)
}

function clientStack(client = {}) {
  return [
    { text: 'Prepared For', style: 'sectionHeader' },
    { text: safeText(client?.name), style: 'clientName' },
    client?.number ? { text: `Client No: ${client.number}`, style: 'clientDetail' } : null,
    client?.email ? { text: `${client.email}`, style: 'clientDetail' } : null,
    client?.phone ? { text: `${client.phone}`, style: 'clientDetail' } : null,
    ...(Array.isArray(client?.addressLines) ? client.addressLines.map((line) => ({ text: `${line}`, style: 'clientDetail' })) : []),
  ].filter(Boolean)
}

function referenceStack(reference = {}, quotation = {}) {
  const data = quotation?.data || {}
  
  return [
    { text: '📋 Reference', style: 'sectionHeader' },
    reference?.label || reference?.value
      ? { text: `${safeText(reference?.label, 'Reference')}: ${safeText(reference?.value)}`, style: 'referenceText' }
      : null,
    data?.status ? { text: `Status: ${data.status.toUpperCase()}`, style: 'referenceText' } : null,
    data?.currency ? { text: `Currency: ${data.currency}`, style: 'referenceText' } : null,
    data?.validityNote ? { text: data.validityNote, style: 'referenceText' } : null,
  ].filter(Boolean)
}

function termsStack(quotation = {}) {
  const data = quotation?.data || {}
  const terms = Array.isArray(data?.terms) ? data.terms : []

  if (!terms.length && !data?.notes) return []

  const items = [
    { text: 'Terms & Notes', style: 'sectionHeader', margin: [0, 30, 0, 12] },
  ]

  if (data?.notes) {
    items.push({ 
      text: data.notes, 
      style: 'bodyText', 
      margin: [0, 0, 0, 8] 
    })
  }

  if (terms.length) {
    items.push({
      ul: terms.map(term => ({
        text: term,
        style: 'bodyText',
        margin: [0, 2, 0, 2],
      })),
      margin: [0, 4, 0, 0],
    })
  }

  return items
}

function acceptanceBlock(quotation = {}) {
  const data = quotation?.data || {}
  if (data?.showAcceptance === false) return null

  return {
    margin: [0, 40, 0, 0],
    table: {
      widths: ['*', '*'],
      body: [
        [
          { 
            text: 'Accepted By', 
            style: 'sectionHeader', 
            alignment: 'left',
            margin: [0, 0, 0, 8],
          },
          { 
            text: 'Date', 
            style: 'sectionHeader', 
            alignment: 'left',
            margin: [0, 0, 0, 8],
          },
        ],
        [
          { 
            text: '\n\n______________________________\n\n',
            style: 'acceptanceLine',
            alignment: 'left',
          },
          { 
            text: '\n\n______________________________\n\n',
            style: 'acceptanceLine',
            alignment: 'left',
          },
        ],
        [
          {
            text: 'Signature / Name',
            style: 'acceptanceLabel',
            alignment: 'left',
          },
          {
            text: 'Date',
            style: 'acceptanceLabel',
            alignment: 'left',
          },
        ],
      ],
    },
    layout: 'noBorders',
  }
}

function buildDocDefinition({ quotation, company, logoDataUrl, title = 'QUOTATION' }) {
  const data = quotation?.data || {}
  const currency = data?.currency || DEFAULT_CURRENCY
  const lineItems = normalizeLineItems(quotation)
  
  const subtotal = lineItems.reduce((sum, item) => sum + safeNumber(item.total), 0)
  const discount = safeNumber(data?.discountAmount)
  const total = safeNumber(data?.totalAmount ?? subtotal - discount)
  const deposit = safeNumber(data?.depositAmount ?? data?.depositRequired)
  
  const quoteCode = safeText(
    data?.quoteCode || 
    data?.quotationCode || 
    data?.number || 
    quotation?.id, 
    'Quotation'
  )

  // Build summary rows - only include if values exist and are > 0
  const summaryRows = [
    [
      { text: 'Subtotal', style: 'summaryLabel' }, 
      { text: money(subtotal, currency), style: 'summaryValue' }
    ],
  ]

  // Only add discount row if discount exists and is > 0
  if (discount > 0) {
    summaryRows.push([
      { text: 'Discount', style: 'summaryLabel' }, 
      { text: `- ${money(discount, currency)}`, style: 'summaryDiscount' }
    ])
  }

  summaryRows.push([
    { text: 'Total', style: 'totalLabel' }, 
    { text: money(total, currency), style: 'totalValue' }
  ])

  // Only add deposit row if deposit exists and is > 0
  if (deposit > 0) {
    summaryRows.push([
      { text: 'Deposit Required', style: 'summaryLabel' }, 
      { text: money(deposit, currency), style: 'summaryValue' }
    ])
  }

  const quoteDate = dateText(data?.quoteDate || data?.issueDate || data?.createdAt)
  const validUntil = dateText(data?.validUntil || data?.expiryDate)

  const headerContent = [
    {
      columns: [
        {
          width: 'auto',
          stack: [
            logoDataUrl
              ? {
                  image: logoDataUrl,
                  width: 70,
                  height: 70,
                  margin: [0, 0, 0, 8],
                  fit: [70, 70], // Prevents stretching
                }
              : null,
            ...companyStack(company).slice(0, 1),
          ].filter(Boolean),
        },
        {
          width: '*',
          stack: [
            { 
              text: title, 
              style: 'documentTitle', 
              alignment: 'right',
              margin: [0, 0, 0, 4],
            },
            { 
              text: quoteCode, 
              style: 'documentCode', 
              alignment: 'right',
              margin: [0, 0, 0, 16],
            },
            {
              columns: [
                { width: '*', text: '' },
                {
                  width: 'auto',
                  stack: [
                    { 
                      text: `Quote Date: ${quoteDate}`,
                      style: 'metaText',
                      alignment: 'right',
                    },
                    { 
                      text: `Valid Until: ${validUntil}`,
                      style: 'metaText',
                      alignment: 'right',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      columnGap: 20,
    },
  ]

  headerContent.push({
    canvas: [
      {
        type: 'line',
        x1: 0,
        y1: 20,
        x2: 515,
        y2: 20,
        lineWidth: 2,
        lineColor: '#1860A8',
      },
    ],
    margin: [0, 16, 0, 24],
  })

  const content = [
    ...headerContent,

    {
      columns: [
        { 
          width: '*', 
          stack: clientStack(data?.client),
          margin: [0, 0, 20, 0],
        },
        { 
          width: '*', 
          stack: referenceStack(data?.reference, quotation),
          margin: [20, 0, 0, 0],
        },
      ],
      columnGap: 0,
      margin: [0, 0, 0, 28],
    },

    {
      table: {
        headerRows: 1,
        widths: [28, '*', 45, 85, 85],
        body: buildLineItemTable(lineItems, currency),
      },
      layout: {
        fillColor(rowIndex) {
          return rowIndex === 0 ? '#F8FAFC' : (rowIndex % 2 === 0 ? '#FFFFFF' : '#FAFBFC')
        },
        hLineColor() {
          return '#E2E8F0'
        },
        vLineColor() {
          return '#E2E8F0'
        },
        paddingLeft: function(i, node) { return 8; },
        paddingRight: function(i, node) { return 8; },
        paddingTop: function(i, node) { return 4; },
        paddingBottom: function(i, node) { return 4; },
      },
      margin: [0, 0, 0, 24],
    },

    {
      columns: [
        { width: '*', text: '' },
        {
          width: 230,
          table: {
            widths: ['*', 95],
            body: summaryRows,
          },
          layout: {
            hLineWidth: function(i, node) { return 0; },
            vLineWidth: function(i, node) { return 0; },
            paddingLeft: function(i, node) { return 0; },
            paddingRight: function(i, node) { return 0; },
            paddingTop: function(i, node) { return 4; },
            paddingBottom: function(i, node) { return 4; },
          },
          margin: [0, 0, 0, 0],
        },
      ],
    },

    ...termsStack(quotation),

    buildBankingDetailsTable(company),

    acceptanceBlock(quotation),
  ]

  content.push({
    text: quotation?.footerNote || 'This quotation becomes binding only after acceptance and payment terms are confirmed.',
    style: 'footerNote',
    margin: [0, 30, 0, 0],
    alignment: 'center',
  })

  return {
    pageSize: 'A4',
    pageMargins: [50, 50, 50, 60],
    content,

    footer(currentPage, pageCount) {
      return {
        margin: [50, 0, 50, 20],
        columns: [
          { 
            text: company?.legalName || company?.name || '', 
            style: 'footerText',
            fontSize: 7,
          },
          { 
            text: `Page ${currentPage} of ${pageCount}`, 
            alignment: 'right', 
            style: 'footerText',
            fontSize: 7,
          },
        ],
      }
    },

    styles: {
      companyName: { 
        fontSize: 22, 
        bold: true, 
        color: '#0F172A',
        margin: [0, 0, 0, 2],
      },
      companyTagline: {
        fontSize: 10,
        color: '#475569',
        margin: [0, 0, 0, 8],
      },
      companyDetail: {
        fontSize: 8,
        color: '#64748B',
        margin: [0, 1, 0, 1],
      },
      documentTitle: { 
        fontSize: 28, 
        bold: true, 
        color: '#0F172A',
        letterSpacing: 1,
      },
      documentCode: { 
        fontSize: 12, 
        bold: true, 
        color: '#1860A8',
        margin: [0, 2, 0, 16],
        letterSpacing: 0.5,
      },
      metaText: {
        fontSize: 8,
        color: '#64748B',
        margin: [0, 1, 0, 1],
      },
      sectionHeader: { 
        fontSize: 10, 
        bold: true, 
        color: '#475569',
        letterSpacing: 0.5,
        margin: [0, 0, 0, 6],
      },
      clientName: { 
        fontSize: 14, 
        bold: true, 
        color: '#0F172A',
        margin: [0, 0, 0, 4],
      },
      clientDetail: {
        fontSize: 9,
        color: '#475569',
        margin: [0, 1, 0, 1],
      },
      referenceText: {
        fontSize: 9,
        color: '#0F172A',
        margin: [0, 2, 0, 2],
      },
      tableHeader: { 
        fontSize: 9, 
        bold: true, 
        color: '#0F172A',
        margin: [0, 6, 0, 6],
        fillColor: '#F8FAFC',
      },
      summaryLabel: { 
        fontSize: 9, 
        color: '#64748B', 
        margin: [0, 3, 0, 3],
      },
      summaryValue: { 
        fontSize: 9, 
        bold: true, 
        color: '#0F172A', 
        alignment: 'right', 
        margin: [0, 3, 0, 3],
      },
      summaryDiscount: {
        fontSize: 9,
        bold: true,
        color: '#EF4444',
        alignment: 'right',
        margin: [0, 3, 0, 3],
      },
      totalLabel: { 
        fontSize: 12, 
        bold: true, 
        color: '#0F172A', 
        margin: [0, 6, 0, 3],
      },
      totalValue: { 
        fontSize: 12, 
        bold: true, 
        color: '#0F172A', 
        alignment: 'right', 
        margin: [0, 6, 0, 3],
      },
      bodyText: { 
        fontSize: 9, 
        color: '#0F172A',
        lineHeight: 1.5,
      },
      acceptanceLine: {
        fontSize: 10,
        color: '#0F172A',
      },
      acceptanceLabel: {
        fontSize: 8,
        color: '#94A3B8',
        margin: [0, 4, 0, 0],
      },
      footerNote: { 
        fontSize: 9, 
        color: '#64748B',
        italic: true,
        margin: [0, 30, 0, 0],
      },
      footerText: { 
        fontSize: 8, 
        color: '#94A3B8',
      },
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

  const logoDataUrl = await imageUrlToDataUrl(options?.logoUrl || logoUrl)
  
  const data = quotation?.data || {}
  const quoteCode = safeText(
    data?.quoteCode || 
    data?.quotationCode || 
    data?.number || 
    quotation?.id, 
    'quotation'
  )
  
  const filename = options?.filename || `${fileSafe(quoteCode)}.pdf`

  const docDefinition = buildDocDefinition({
    quotation,
    company,
    logoDataUrl,
    title: options?.title || 'QUOTATION',
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

  const logoDataUrl = await imageUrlToDataUrl(options?.logoUrl || logoUrl)
  
  const docDefinition = buildDocDefinition({
    quotation,
    company,
    logoDataUrl,
    title: options?.title || 'QUOTATION',
  })

  pdfMake.createPdf(docDefinition).open()
}
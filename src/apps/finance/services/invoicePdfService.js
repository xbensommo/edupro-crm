/**
 * @file src/apps/finance/services/invoicePdfService.js
 * @description Client-side invoice PDF generation following financial document standards.
 */

import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
import logoUrl from '@/assets/images/logo.png'
import { financeCompanyProfile } from '../config/financeCompanyProfile.js'

pdfMake.vfs = pdfFonts?.pdfMake?.vfs || pdfFonts?.vfs

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
  return String(value || 'invoice')
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
      console.warn('[invoice-pdf] Failed to load logo image:', response.status)
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
    console.warn('[invoice-pdf] Error loading logo image:', error)
    return null
  }
}

function normalizeLineItems(invoice) {
  const items = Array.isArray(invoice?.lineItems)
    ? invoice.lineItems
    : Array.isArray(invoice?.items)
      ? invoice.items
      : []

  if (items.length) {
    return items.map((item, index) => {
      const quantity = safeNumber(item.quantity, 1)
      const unitPrice = safeNumber(item.unitPrice ?? item.price ?? item.amount)
      const total = safeNumber(item.totalAmount ?? item.total ?? quantity * unitPrice)

      return {
        number: index + 1,
        description: safeText(item.description || item.label || item.name, 'Service'),
        quantity,
        unitPrice,
        total,
      }
    })
  }

  const fallbackAmount = safeNumber(invoice?.totalAmount ?? invoice?.amount ?? 0)

  return [
    {
      number: 1,
      description: safeText(
        invoice?.description || invoice?.engagementCode || invoice?.engagementId,
        'Professional Service',
      ),
      quantity: 1,
      unitPrice: fallbackAmount,
      total: fallbackAmount,
    },
  ]
}

function buildInvoiceRows(lineItems, currency) {
  return [
    [
      { text: 'Item', style: 'tableHeader' },
      { text: 'Description', style: 'tableHeader' },
      { text: 'Quantity', style: 'tableHeader', alignment: 'right' },
      { text: 'Unit Price', style: 'tableHeader', alignment: 'right' },
      { text: 'Total', style: 'tableHeader', alignment: 'right' },
    ],
    ...lineItems.map((item) => [
      { text: `#${String(item.number)}`, margin: [0, 6, 0, 6], fontSize: 9 },
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
    company?.email ? { text: `✉ ${company.email}`, style: 'companyDetail' } : null,
    company?.phone ? { text: `📞 ${company.phone}`, style: 'companyDetail' } : null,
    company?.website ? { text: `🌐 ${company.website}`, style: 'companyDetail' } : null,
    ...(Array.isArray(company?.addressLines) ? company.addressLines.map((line) => ({ text: `📍 ${line}`, style: 'companyDetail' })) : []),
    company?.registrationNumber ? { text: `Reg: ${company.registrationNumber}`, style: 'companyDetail' } : null,
    company?.taxNumber ? { text: `Tax: ${company.taxNumber}`, style: 'companyDetail' } : null,
  ].filter(Boolean)
}

function clientBlock(invoice) {
  const clientName = invoice?.clientLabel || invoice?.clientName || 'Unnamed Client'
  const clientNumber = invoice?.clientNumber || invoice?.clientId || null
  const clientEmail = invoice?.clientEmail || null
  const clientPhone = invoice?.clientPhone || null

  const items = [
    { text: 'Bill To:', style: 'sectionLabel' },
    { text: safeText(clientName), style: 'clientName' },
  ]

  if (clientNumber) {
    items.push({ text: `Client ID: ${clientNumber}`, style: 'clientDetail' })
  }
  if (clientEmail) {
    items.push({ text: clientEmail, style: 'clientDetail' })
  }
  if (clientPhone) {
    items.push({ text: clientPhone, style: 'clientDetail' })
  }

  return items
}

function invoiceDetails(invoice) {
  const currency = invoice?.currency || 'NAD'
  const status = invoice?.status || 'draft'
  const engagementCode = invoice?.engagementCode || invoice?.engagementId || null

  const items = [
    { text: 'Invoice Details:', style: 'sectionLabel' },
    { 
      text: [
        { text: 'Status: ', style: 'detailLabel' },
        { text: status.toUpperCase(), style: `status_${status}` }
      ],
      style: 'detailRow'
    },
    { 
      text: [
        { text: 'Currency: ', style: 'detailLabel' },
        { text: currency, style: 'detailValue' }
      ],
      style: 'detailRow'
    },
  ]

  if (engagementCode) {
    items.push({ 
      text: [
        { text: 'Engagement: ', style: 'detailLabel' },
        { text: engagementCode, style: 'detailValue' }
      ],
      style: 'detailRow'
    })
  }

  if (invoice?.notes) {
    items.push({ 
      text: [
        { text: 'Notes: ', style: 'detailLabel' },
        { text: invoice.notes, style: 'detailValue' }
      ],
      style: 'detailRow',
      margin: [0, 4, 0, 0],
    })
  }

  return items
}

function paymentTerms(invoice) {
  const items = []

  if (invoice?.dueDate) {
    items.push({
      stack: [
        { text: 'Payment Terms', style: 'termsHeader' },
        { 
          text: `Please pay by ${dateText(invoice.dueDate)}`,
          style: 'termsText'
        },
        {
          text: 'Payment may be made via bank transfer. Please reference the invoice number.',
          style: 'termsText',
          margin: [0, 4, 0, 0],
        }
      ],
      margin: [0, 30, 0, 0],
    })
  }

  return items
}

function bankingDetails(company) {
  const banking = company?.bankingDetails
  if (!banking) return null

  return {
    margin: [0, 30, 0, 0],
    stack: [
      { text: 'Banking Details', style: 'termsHeader' },
      {
        table: {
          widths: ['35%', '65%'],
          body: [
            ['Bank', safeText(banking.bankName)],
            ['Account Name', safeText(banking.accountName)],
            ['Account Number', safeText(banking.accountNumber)],
            ['Branch Code', safeText(banking.branchCode)],
            ['Account Type', safeText(banking.accountType || 'Current')],
            ['Payment Reference', safeText(banking.referenceNote || 'Invoice number')],
          ].map(([label, value]) => [
            {
              text: label,
              bold: true,
              fontSize: 8,
              color: '#475569',
              margin: [0, 3, 0, 3],
            },
            {
              text: value,
              fontSize: 8,
              color: '#0F172A',
              margin: [0, 3, 0, 3],
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
          paddingLeft: function(i, node) { return 4; },
          paddingRight: function(i, node) { return 4; },
          paddingTop: function(i, node) { return 2; },
          paddingBottom: function(i, node) { return 2; },
        },
      },
    ],
  }
}

export async function downloadInvoicePdf(invoice, options = {}) {
  if (!invoice) {
    throw new Error('[invoice-pdf] Missing invoice.')
  }

  const company = {
    ...financeCompanyProfile,
    ...(options.company || {}),
  }

  const currency = invoice.currency || 'NAD'
  const logoDataUrl = await imageUrlToDataUrl(options?.logoUrl || logoUrl)
  const lineItems = normalizeLineItems(invoice)

  const subtotal = lineItems.reduce((sum, item) => sum + safeNumber(item.total), 0)
  const discount = safeNumber(invoice.discountAmount || 0)
  const tax = safeNumber(invoice.taxAmount || 0)
  const total = safeNumber(invoice.totalAmount ?? subtotal - discount + tax)
  const paid = safeNumber(invoice.allocatedAmount ?? invoice.paidAmount ?? 0)
  const balance = safeNumber(invoice.balanceAmount ?? total - paid)

  const invoiceCode = safeText(invoice.invoiceCode || invoice.id, 'INV-0001')
  const filename = options?.filename || `${fileSafe(invoiceCode)}.pdf`
  const issueDate = dateText(invoice.issueDate || invoice.createdAt)

  // Build summary rows
  const summaryRows = []

  // Subtotal
  summaryRows.push([
    { text: 'Subtotal', style: 'summaryLabel' },
    { text: money(subtotal, currency), style: 'summaryValue' },
  ])

  // Discount (only if > 0)
  if (discount > 0) {
    summaryRows.push([
      { text: 'Discount', style: 'summaryLabel' },
      { text: `(${money(discount, currency)})`, style: 'summaryDiscount' },
    ])
  }

  // Tax (only if > 0)
  if (tax > 0) {
    summaryRows.push([
      { text: 'Tax', style: 'summaryLabel' },
      { text: money(tax, currency), style: 'summaryValue' },
    ])
  }

  // Total
  summaryRows.push([
    { text: 'Total', style: 'totalLabel' },
    { text: money(total, currency), style: 'totalValue' },
  ])

  // Paid (only if > 0)
  if (paid > 0) {
    summaryRows.push([
      { text: 'Amount Paid', style: 'summaryLabel' },
      { text: `(${money(paid, currency)})`, style: 'summaryPaid' },
    ])
  }

  // Balance Due
  summaryRows.push([
    { text: 'Balance Due', style: 'balanceLabel' },
    { text: money(balance, currency), style: 'balanceValue' },
  ])

  const content = [
    // Header Section - Company Info + Invoice Title
    {
      columns: [
        // LEFT: Logo + Full Company Info
        {
          width: 'auto',
          stack: [
            logoDataUrl
              ? {
                  image: logoDataUrl,
                  width: 60,
                  height: 60,
                  margin: [0, 0, 0, 8],
                  fit: [60, 60],
                }
              : null,
            ...companyStack(company),
          ].filter(Boolean),
        },
        // RIGHT: Invoice Title & Code
        {
          width: '*',
          stack: [
            {
              text: 'INVOICE',
              style: 'documentTitle',
              alignment: 'right',
              margin: [0, 0, 0, 4],
            },
            {
              text: invoiceCode,
              style: 'documentCode',
              alignment: 'right',
              margin: [0, 2, 0, 16],
            },
            {
              columns: [
                { width: '*', text: '' },
                {
                  width: 'auto',
                  stack: [
                    {
                      text: `Date: ${issueDate}`,
                      style: 'metaText',
                      alignment: 'right',
                    },
                    {
                      text: `Due: ${dateText(invoice.dueDate)}`,
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

    // Divider
    {
      canvas: [
        {
          type: 'line',
          x1: 0,
          y1: 20,
          x2: 515,
          y2: 20,
          lineWidth: 1,
          lineColor: '#CBD5E1',
        },
      ],
      margin: [0, 12, 0, 24],
    },

    // Client & Details Section
    {
      columns: [
        {
          width: '*',
          stack: clientBlock(invoice),
          margin: [0, 0, 20, 0],
        },
        {
          width: '*',
          stack: invoiceDetails(invoice),
          margin: [20, 0, 0, 0],
        },
      ],
      columnGap: 0,
      margin: [0, 0, 0, 28],
    },

    // Line Items Table
    {
      table: {
        headerRows: 1,
        widths: [40, '*', 50, 70, 80],
        body: buildInvoiceRows(lineItems, currency),
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
        paddingTop: function(i, node) { return 6; },
        paddingBottom: function(i, node) { return 6; },
      },
      margin: [0, 0, 0, 24],
    },

    // Summary Section
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
            hLineWidth: function(i, node) { 
              if (i === 2 && node.table.body.length > 3) return 0.5
              if (i === 3 && node.table.body.length > 4) return 0.5
              return 0 
            },
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

    // Payment Terms
    ...paymentTerms(invoice),

    // Banking Details
    bankingDetails(company),

    // Footer Note
    {
      text: company?.footerNote || 'Thank you for your business. Payment is due by the date shown above.',
      style: 'footerNote',
      margin: [0, 30, 0, 0],
      alignment: 'center',
    },
  ]

  const docDefinition = {
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
      // Company Styles
      companyName: {
        fontSize: 18,
        bold: true,
        color: '#0F172A',
        margin: [0, 0, 0, 2],
      },
      companyTagline: {
        fontSize: 9,
        color: '#475569',
        margin: [0, 0, 0, 4],
      },
      companyDetail: {
        fontSize: 8,
        color: '#64748B',
        margin: [0, 1, 0, 1],
      },

      // Document Styles
      documentTitle: {
        fontSize: 28,
        bold: true,
        color: '#0F172A',
        letterSpacing: 2,
      },
      documentCode: {
        fontSize: 11,
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

      // Section Labels
      sectionLabel: {
        fontSize: 9,
        bold: true,
        color: '#475569',
        margin: [0, 0, 0, 6],
        letterSpacing: 0.5,
      },

      // Client Styles
      clientName: {
        fontSize: 13,
        bold: true,
        color: '#0F172A',
        margin: [0, 0, 0, 4],
      },
      clientDetail: {
        fontSize: 9,
        color: '#475569',
        margin: [0, 1, 0, 1],
      },

      // Detail Rows
      detailRow: {
        fontSize: 9,
        margin: [0, 1, 0, 1],
      },
      detailLabel: {
        fontSize: 9,
        color: '#64748B',
      },
      detailValue: {
        fontSize: 9,
        color: '#0F172A',
        bold: true,
      },

      // Status Styles
      status_draft: {
        fontSize: 9,
        color: '#F59E0B',
        bold: true,
      },
      status_issued: {
        fontSize: 9,
        color: '#3B82F6',
        bold: true,
      },
      status_paid: {
        fontSize: 9,
        color: '#10B981',
        bold: true,
      },
      status_partially_paid: {
        fontSize: 9,
        color: '#8B5CF6',
        bold: true,
      },
      status_cancelled: {
        fontSize: 9,
        color: '#EF4444',
        bold: true,
      },

      // Table Styles
      tableHeader: {
        fontSize: 9,
        bold: true,
        color: '#0F172A',
        margin: [0, 6, 0, 6],
        fillColor: '#F8FAFC',
      },

      // Summary Styles
      summaryLabel: {
        fontSize: 9,
        color: '#64748B',
        margin: [0, 3, 0, 3],
      },
      summaryValue: {
        fontSize: 9,
        color: '#0F172A',
        alignment: 'right',
        margin: [0, 3, 0, 3],
      },
      summaryDiscount: {
        fontSize: 9,
        color: '#EF4444',
        alignment: 'right',
        margin: [0, 3, 0, 3],
      },
      summaryPaid: {
        fontSize: 9,
        color: '#10B981',
        alignment: 'right',
        margin: [0, 3, 0, 3],
      },
      totalLabel: {
        fontSize: 11,
        bold: true,
        color: '#0F172A',
        margin: [0, 6, 0, 3],
      },
      totalValue: {
        fontSize: 11,
        bold: true,
        color: '#0F172A',
        alignment: 'right',
        margin: [0, 6, 0, 3],
      },
      balanceLabel: {
        fontSize: 12,
        bold: true,
        color: '#0F172A',
        margin: [0, 8, 0, 3],
      },
      balanceValue: {
        fontSize: 12,
        bold: true,
        color: '#0F172A',
        alignment: 'right',
        margin: [0, 8, 0, 3],
      },

      // Terms Styles
      termsHeader: {
        fontSize: 10,
        bold: true,
        color: '#0F172A',
        margin: [0, 0, 0, 6],
      },
      termsText: {
        fontSize: 9,
        color: '#475569',
        lineHeight: 1.5,
      },

      // Footer
      footerNote: {
        fontSize: 9,
        color: '#64748B',
        italic: true,
        margin: [0, 30, 0, 0],
      },
      footerText: {
        fontSize: 7,
        color: '#94A3B8',
      },
    },

    defaultStyle: {
      fontSize: 10,
      color: '#0F172A',
    },
  }

  pdfMake.createPdf(docDefinition).download(filename)
}
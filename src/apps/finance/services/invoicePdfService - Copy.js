/**
 * @file src/apps/finance/services/invoicePdfService.js
 * @description Client-side invoice PDF generation from structured invoice data.
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

function money(value, currency = 'NAD') {
  const amount = Number(value || 0)

  return new Intl.NumberFormat('en-NA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

function dateText(value) {
  if (!value) return '—'

  const date = typeof value?.toDate === 'function'
    ? value.toDate()
    : new Date(value)

  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('en-NA', {
    year: 'numeric',
    month: 'short',
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
  const response = await fetch(url)
  const blob = await response.blob()

  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onloadend = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function normalizeLineItems(invoice) {
  const items = Array.isArray(invoice?.lineItems)
    ? invoice.lineItems
    : Array.isArray(invoice?.items)
      ? invoice.items
      : []

  if (items.length) {
    return items.map((item, index) => {
      const quantity = Number(item.quantity || 1)
      const unitPrice = Number(item.unitPrice || item.amount || 0)

      return {
        number: index + 1,
        description: safeText(item.description || item.label || item.name, 'Invoice item'),
        quantity,
        unitPrice,
        total: quantity * unitPrice,
      }
    })
  }

  const fallbackAmount = Number(invoice?.totalAmount || invoice?.amount || 0)

  return [
    {
      number: 1,
      description: safeText(
        invoice?.description || invoice?.engagementCode || invoice?.engagementId,
        'Professional service',
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

export async function downloadInvoicePdf(invoice, options = {}) {
  if (!invoice) {
    throw new Error('[invoice-pdf] Missing invoice.')
  }
  console.clear(); console.trace(invoice)
  const company = {
    ...financeCompanyProfile,
    ...(options.company || {}),
  }

  const currency = invoice.currency || 'NAD'
  const logoDataUrl = await imageUrlToDataUrl(logoUrl)
  const lineItems = normalizeLineItems(invoice)

  const subtotal = lineItems.reduce((sum, item) => sum + Number(item.total || 0), 0)
  const total = Number(invoice.totalAmount ?? subtotal)
  const paid = Number(invoice.allocatedAmount ?? invoice.paidAmount ?? 0)
  const balance = Number(invoice.balanceAmount ?? total - paid)

  const invoiceCode = safeText(invoice.invoiceCode || invoice.id, 'Invoice')
  const filename = `${fileSafe(invoiceCode)}.pdf`

  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 50],

    content: [
      {
        columns: [
          {
            width: 90,
            image: logoDataUrl,
            fit: [80, 80],
          },
          {
            width: '*',
            stack: [
              { text: company.name, style: 'companyName' },
              { text: company.tagline, style: 'muted' },
              { text: company.email, style: 'muted' },
              { text: company.phone, style: 'muted' },
              { text: company.website, style: 'muted' },
              ...company.addressLines.map((line) => ({ text: line, style: 'muted' })),
            ],
          },
          {
            width: 160,
            stack: [
              { text: 'INVOICE', style: 'invoiceTitle', alignment: 'right' },
              { text: invoiceCode, style: 'invoiceCode', alignment: 'right' },
              { text: `Issue date: ${dateText(invoice.issueDate || invoice.createdAt)}`, style: 'rightMeta' },
              { text: `Due date: ${dateText(invoice.dueDate)}`, style: 'rightMeta' },
              { text: `Status: ${safeText(invoice.status || 'draft')}`, style: 'rightMeta' },
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
          {
            width: '*',
            stack: [
              { text: 'Billed To', style: 'sectionTitle' },
              { text: safeText(invoice.clientLabel || invoice.clientName), style: 'strongText' },
              { text: `Client No: ${safeText(invoice.clientNumber || invoice.clientId)}`, style: 'muted' },
              invoice.clientEmail ? { text: invoice.clientEmail, style: 'muted' } : null,
              invoice.clientPhone ? { text: invoice.clientPhone, style: 'muted' } : null,
            ].filter(Boolean),
          },
          {
            width: '*',
            stack: [
              { text: 'Reference', style: 'sectionTitle' },
              { text: `Engagement: ${safeText(invoice.engagementCode || invoice.engagementId)}`, style: 'muted' },
              { text: `Currency: ${currency}`, style: 'muted' },
              invoice.notes ? { text: `Notes: ${invoice.notes}`, style: 'muted' } : null,
            ].filter(Boolean),
          },
        ],
        columnGap: 24,
        margin: [0, 0, 0, 24],
      },

      {
        table: {
          headerRows: 1,
          widths: [28, '*', 45, 85, 85],
          body: buildInvoiceRows(lineItems, currency),
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
            width: 220,
            table: {
              widths: ['*', 90],
              body: [
                [
                  { text: 'Subtotal', style: 'summaryLabel' },
                  { text: money(subtotal, currency), style: 'summaryValue' },
                ],
                [
                  { text: 'Total', style: 'summaryLabel' },
                  { text: money(total, currency), style: 'summaryValue' },
                ],
                [
                  { text: 'Paid', style: 'summaryLabel' },
                  { text: money(paid, currency), style: 'summaryValue' },
                ],
                [
                  { text: 'Balance Due', style: 'balanceLabel' },
                  { text: money(balance, currency), style: 'balanceValue' },
                ],
              ],
            },
            layout: 'noBorders',
            margin: [0, 24, 0, 0],
          },
        ],
      },

      {
        text: 'Thank you for your business.',
        style: 'footerNote',
        margin: [0, 40, 0, 0],
      },
    ],

    footer(currentPage, pageCount) {
      return {
        margin: [40, 0, 40, 20],
        columns: [
          {
            text: `${company.legalName || company.name}`,
            style: 'footerText',
          },
          {
            text: `Page ${currentPage} of ${pageCount}`,
            alignment: 'right',
            style: 'footerText',
          },
        ],
      }
    },

    styles: {
      companyName: {
        fontSize: 18,
        bold: true,
        color: '#0F172A',
      },
      invoiceTitle: {
        fontSize: 24,
        bold: true,
        color: '#0F172A',
      },
      invoiceCode: {
        fontSize: 10,
        bold: true,
        color: '#1860A8',
        margin: [0, 4, 0, 8],
      },
      sectionTitle: {
        fontSize: 9,
        bold: true,
        color: '#64748B',
        characterSpacing: 1.2,
        margin: [0, 0, 0, 6],
      },
      tableHead: {
        fontSize: 9,
        bold: true,
        color: '#0F172A',
        margin: [0, 5, 0, 5],
      },
      strongText: {
        fontSize: 11,
        bold: true,
        color: '#0F172A',
        margin: [0, 0, 0, 4],
      },
      muted: {
        fontSize: 9,
        color: '#64748B',
        margin: [0, 1, 0, 1],
      },
      rightMeta: {
        fontSize: 9,
        color: '#64748B',
        alignment: 'right',
        margin: [0, 1, 0, 1],
      },
      summaryLabel: {
        fontSize: 10,
        color: '#64748B',
        margin: [0, 3, 0, 3],
      },
      summaryValue: {
        fontSize: 10,
        bold: true,
        color: '#0F172A',
        alignment: 'right',
        margin: [0, 3, 0, 3],
      },
      balanceLabel: {
        fontSize: 11,
        bold: true,
        color: '#0F172A',
        margin: [0, 8, 0, 0],
      },
      balanceValue: {
        fontSize: 11,
        bold: true,
        color: '#0F172A',
        alignment: 'right',
        margin: [0, 8, 0, 0],
      },
      footerNote: {
        fontSize: 10,
        color: '#64748B',
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

  pdfMake.createPdf(docDefinition).download(filename)
}
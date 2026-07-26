/**
 * @file src/apps/finance/services/invoicePdfService.js
 * @description Financial-grade invoice PDF generator.
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
  tableLayout,
  buildFooter,
} from '../../../services/pdfCommon.js'
import pdfMake from 'pdfmake/build/pdfmake'

// --- Local helpers ---
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
  return [{
    number: 1,
    description: safeText(invoice?.description || invoice?.engagementCode || 'Professional Service'),
    quantity: 1,
    unitPrice: fallbackAmount,
    total: fallbackAmount,
  }]
}

// --- Core Builder ---
function buildDocDefinition({ invoice, company, logoDataUrl }) {
  const currency = invoice.currency || 'NAD'
  const lineItems = normalizeLineItems(invoice)

  const subtotal = lineItems.reduce((sum, item) => sum + safeNumber(item.total), 0)
  const discount = safeNumber(invoice.discountAmount || 0)
  const tax = safeNumber(invoice.taxAmount || 0)
  const total = safeNumber(invoice.totalAmount ?? subtotal - discount + tax)
  const paid = safeNumber(invoice.allocatedAmount ?? invoice.paidAmount ?? 0)
  const balance = safeNumber(invoice.balanceAmount ?? total - paid)

  const invoiceCode = safeText(invoice.invoiceCode || invoice.id, 'INV-0001')
  const issueDate = dateText(invoice.issueDate || invoice.createdAt)
  const dueDate = dateText(invoice.dueDate)

  // Header
  const headerLeft = [
    logoDataUrl ? { image: logoDataUrl, width: 60, height: 60, fit: [60, 60], margin: [0, 0, 0, S.xs] } : null,
    { text: safeText(company?.name, 'Company'), style: 'companyName' },
    company?.tagline ? { text: company.tagline, style: 'companyTagline' } : null,
    { text: [company?.phone, company?.email].filter(Boolean).join(' | '), style: 'companyContact' },
    { text: (Array.isArray(company?.addressLines) ? company.addressLines.join(', ') : ''), style: 'companyContact' },
  ].filter(Boolean)

  const headerRight = [
    { text: 'INVOICE', style: 'documentTitle' },
    { text: `# ${invoiceCode}`, style: 'documentCode' },
    { text: `Issue Date: ${issueDate}`, style: 'metaText' },
    { text: `Due Date: ${dueDate}`, style: 'metaText' },
    { text: `Currency: ${currency}`, style: 'metaText' },
    //invoice?.status ? { text: `Status: ${invoice.status.toUpperCase()}`, style: `status_${invoice.status}` } : null,
  ].filter(Boolean)

  // Client & Details
  const clientStack = [
    { text: 'Bill To', style: 'sectionHeader' },
    { text: safeText(invoice?.clientLabel || invoice?.clientName || 'Unnamed Client'), style: 'clientName' },
    invoice?.clientEmail ? { text: invoice.clientEmail, style: 'clientDetail' } : null,
    invoice?.clientPhone ? { text: invoice.clientPhone, style: 'clientDetail' } : null,
    invoice?.clientNumber ? { text: `Client #: ${invoice.clientNumber}`, style: 'clientDetail' } : null,
  ].filter(Boolean)

  const detailsStack = [
    { text: 'Invoice Details', style: 'sectionHeader' },
    invoice?.engagementCode ? { text: `Work Reference: ${invoice.engagementCode}`, style: 'detailText' } : null,
    //invoice?.notes ? { text: `Note: ${invoice.notes}`, style: 'detailText' } : null,
  ].filter(Boolean)

  // Line Items Table
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

  // Summary
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
    { text: 'Total', style: 'totalLabel' },
    { text: money(total, currency), style: 'totalValue' },
  ])
  if (paid > 0) {
    summaryRows.push([
      { text: 'Amount Paid', style: 'summaryLabel' },
      { text: `- ${money(paid, currency)}`, style: 'summaryPaid' },
    ])
  }
  summaryRows.push([
    { text: 'Balance Due', style: 'balanceLabel' },
    { text: money(balance, currency), style: 'balanceValue' },
  ])

  // Terms & Banking
  const terms = Array.isArray(invoice?.terms) ? invoice.terms : []
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
            ['Reference', safeText(banking.referenceNote || 'Invoice number')],
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

      // Client & Details
      {
        columns: [
          { width: '50%', stack: clientStack, margin: [0, 0, S.md, 0] },
          //{ width: '50%', stack: detailsStack },
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
                const isBalance = row[0].text === 'Balance Due'
                return row.map((cell) => ({
                  ...cell,
                  margin: [0, (isBalance && cell.alignment === 'right') ? S.sm : S.xs, 0, (isBalance && cell.alignment === 'right') ? S.sm : S.xs],
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

      // Footer Note
      {
        text: company?.footerNote || 'Thank you for your business. Payment is due by the date shown above.',
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
export async function downloadInvoicePdf(invoice, options = {}) {
  if (!invoice) throw new Error('[invoice-pdf] Missing invoice.')

  const company = { ...financeCompanyProfile, ...(options.company || {}) }
  const logoDataUrl = await imageUrlToDataUrl(options?.logoUrl || logoUrl)
  const invoiceCode = safeText(invoice.invoiceCode || invoice.id, 'INV-0001')
  const filename = options?.filename || `${fileSafe(invoiceCode)}.pdf`

  const docDefinition = buildDocDefinition({ invoice, company, logoDataUrl })
  pdfMake.createPdf(docDefinition).download(filename)
}
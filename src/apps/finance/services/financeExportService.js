/**
 * @file src/apps/finance/services/financeExportService.js
 * @description Shared CSV export and print/PDF helpers for finance statements.
 */

import { formatMoney } from './financeFormatters.js'

/**
 * @param {string} value
 * @returns {string}
 */
function sanitizeFilePart(value) {
  return String(value || 'report')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'report'
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function toCsvCell(value) {
  const text = String(value ?? '')
  return /[",]/.test(text) ? `"${text.replace(/"\n/g, '""')}"` : text
}

/**
 * @param {{ key: string, label: string, format?: string }[]} columns
 * @param {Record<string, any>[]} rows
 * @param {string} currency
 * @returns {string[]}
 */
function buildCsvLines(columns, rows, currency = 'NAD') {
  const lines = [columns.map((column) => toCsvCell(column.label)).join(',')]

  for (const row of rows) {
    lines.push(columns.map((column) => {
      const value = row?.[column.key]
      if (column.format === 'currency') {
        return toCsvCell(Number(value || 0).toFixed(2))
      }
      return toCsvCell(value)
    }).join(','))
  }

  return lines
}

/**
 * @param {string} filename
 * @param {string} content
 * @param {string} [mimeType='text/csv;charset=utf-8']
 * @returns {void}
 */
function downloadTextFile(filename, content, mimeType = 'text/csv;charset=utf-8') {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('Finance export is only available in the browser.')
  }

  const blob = new Blob([content], { type: mimeType })
  const url = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  window.URL.revokeObjectURL(url)
}

/**
 * @param {string} filePrefix
 * @param {{ from?: string, to?: string }} [range]
 * @returns {string}
 */
export function buildFinanceExportFilename(filePrefix, range = {}) {
  const safePrefix = sanitizeFilePart(filePrefix)
  const from = range?.from ? sanitizeFilePart(range.from) : 'all'
  const to = range?.to ? sanitizeFilePart(range.to) : 'all'
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  return `${safePrefix}_${from}_to_${to}_${stamp}`
}

/**
 * @param {{
 *   filePrefix: string,
 *   title: string,
 *   range?: { from?: string, to?: string },
 *   rangeLabel?: string,
 *   sections: Array<{
 *     title: string,
 *     columns: Array<{ key: string, label: string, format?: string }>,
 *     rows: Array<Record<string, any>>,
 *     totalLabel?: string,
 *     totalValue?: number
 *   }>,
 *   currency?: string
 * }} options
 * @returns {void}
 */
export function exportFinanceSectionsCsv(options) {
  const sections = Array.isArray(options?.sections) ? options.sections : []
  const currency = options?.currency || 'NAD'
  const lines = [options?.title || 'Finance export']

  if (options?.rangeLabel) {
    lines.push(`Reporting period,${toCsvCell(options.rangeLabel)}`)
  }

  lines.push(`Generated at,${toCsvCell(new Date().toISOString())}`)
  lines.push('')

  for (const section of sections) {
    lines.push(section.title || 'Section')
    lines.push(...buildCsvLines(section.columns || [], section.rows || [], currency))
    if (typeof section.totalValue === 'number') {
      lines.push(`${toCsvCell(section.totalLabel || 'Total')},${toCsvCell(Number(section.totalValue || 0).toFixed(2))}`)
    }
    lines.push('')
  }

  downloadTextFile(`${buildFinanceExportFilename(options.filePrefix, options.range)}.csv`, lines.join(''))
}

/**
 * @param {{ key: string, label: string, format?: string }[]} columns
 * @param {Record<string, any>[]} rows
 * @param {string} currency
 * @returns {string}
 */
function renderTable(columns, rows, currency = 'NAD') {
  const header = columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join('')
  const bodyRows = rows.length
    ? rows.map((row) => `<tr>${columns.map((column) => {
        const rawValue = row?.[column.key]
        const displayValue = column.format === 'currency'
          ? formatMoney(rawValue, currency)
          : rawValue ?? '—'
        return `<td>${escapeHtml(displayValue)}</td>`
      }).join('')}</tr>`).join('')
    : `<tr><td colspan="${columns.length}">No rows available.</td></tr>`

  return `
    <table>
      <thead><tr>${header}</tr></thead>
      <tbody>${bodyRows}</tbody>
    </table>
  `
}

/**
 * @param {{
 *   title: string,
 *   subtitle?: string,
 *   rangeLabel?: string,
 *   sections: Array<{
 *     title: string,
 *     description?: string,
 *     columns: Array<{ key: string, label: string, format?: string }>,
 *     rows: Array<Record<string, any>>,
 *     totalLabel?: string,
 *     totalValue?: number
 *   }>,
 *   summaryCards?: Array<{ label: string, value: string }>,
 *   currency?: string
 * }} options
 * @returns {void}
 */
export function printFinanceSections(options) {
  if (typeof window === 'undefined') {
    throw new Error('Finance print export is only available in the browser.')
  }

  const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=1200,height=900')
  if (!printWindow) {
    throw new Error('Popup blocked. Allow popups to print the finance report.')
  }

  const sections = Array.isArray(options?.sections) ? options.sections : []
  const currency = options?.currency || 'NAD'
  const summaryCards = Array.isArray(options?.summaryCards) ? options.summaryCards : []

  const html = `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(options?.title || 'Finance Report')}</title>
      <style>
        body { font-family: Arial, Helvetica, sans-serif; margin: 32px; color: #0f172a; }
        h1 { margin: 0 0 8px; font-size: 28px; }
        h2 { margin: 0 0 8px; font-size: 18px; }
        p { margin: 0 0 8px; color: #475569; }
        .meta { margin-bottom: 24px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin: 20px 0 28px; }
        .card { border: 1px solid #cbd5e1; border-radius: 14px; padding: 14px; }
        .card-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.18em; color: #64748b; margin-bottom: 8px; }
        .card-value { font-size: 20px; font-weight: 700; color: #0f172a; }
        .section { margin-top: 28px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-size: 13px; }
        th { background: #f8fafc; text-transform: uppercase; letter-spacing: 0.08em; font-size: 11px; color: #475569; }
        .total { margin-top: 10px; font-weight: 700; }
        .footer { margin-top: 36px; font-size: 12px; color: #64748b; }
        @media print { body { margin: 16px; } }
      </style>
    </head>
    <body>
      <header>
        <h1>${escapeHtml(options?.title || 'Finance Report')}</h1>
        <div class="meta">
          ${options?.subtitle ? `<p>${escapeHtml(options.subtitle)}</p>` : ''}
          ${options?.rangeLabel ? `<p><strong>Reporting period:</strong> ${escapeHtml(options.rangeLabel)}</p>` : ''}
          <p><strong>Generated at:</strong> ${escapeHtml(new Date().toLocaleString())}</p>
        </div>
      </header>
      ${summaryCards.length ? `<section class="summary">${summaryCards.map((card) => `
        <div class="card">
          <div class="card-label">${escapeHtml(card.label)}</div>
          <div class="card-value">${escapeHtml(card.value)}</div>
        </div>
      `).join('')}</section>` : ''}
      ${sections.map((section) => `
        <section class="section">
          <h2>${escapeHtml(section.title || 'Section')}</h2>
          ${section.description ? `<p>${escapeHtml(section.description)}</p>` : ''}
          ${renderTable(section.columns || [], section.rows || [], currency)}
          ${typeof section.totalValue === 'number' ? `<p class="total">${escapeHtml(section.totalLabel || 'Total')}: ${escapeHtml(formatMoney(section.totalValue, currency))}</p>` : ''}
        </section>
      `).join('')}
      <p class="footer">Generated from Totistack Finance. Use the browser print dialog to save as PDF.</p>
      <script>
        window.onload = function () {
          window.print();
        };
      </script>
    </body>
  </html>`

  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()
}

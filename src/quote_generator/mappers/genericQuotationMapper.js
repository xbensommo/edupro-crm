/**
 * @file src/mappers/genericQuotationMapper.js
 * @description Converts common project records into the generic quotation payload expected by quotationPdfEngine.
 */

function pick(...values) {
  return values.find((value) => value !== undefined && value !== null && String(value).trim() !== '')
}

function normalizeClient(source = {}) {
  return {
    name: pick(source.client?.name, source.clientName, source.clientLabel, source.customerName),
    number: pick(source.client?.number, source.clientNumber, source.clientId, source.customerNumber),
    email: pick(source.client?.email, source.clientEmail, source.customerEmail),
    phone: pick(source.client?.phone, source.clientPhone, source.customerPhone),
    addressLines: source.client?.addressLines || source.clientAddressLines || [],
  }
}

function normalizeReference(source = {}) {
  return {
    label: pick(source.reference?.label, source.referenceLabel, 'Project'),
    value: pick(
      source.reference?.value,
      source.referenceValue,
      source.projectTitle,
      source.serviceName,
      source.engagementCode,
      source.orderCode,
      source.bookingCode,
    ),
  }
}

function normalizeLineItems(source = {}) {
  const items = source.lineItems || source.items || []

  if (Array.isArray(items) && items.length) {
    return items.map((item) => ({
      description: pick(item.description, item.label, item.name, 'Quotation item'),
      quantity: Number(pick(item.quantity, item.qty, 1)),
      unitPrice: Number(pick(item.unitPrice, item.price, item.amount, 0)),
      totalAmount: item.totalAmount ?? item.total,
    }))
  }

  return [
    {
      description: pick(source.description, source.serviceDescription, source.projectTitle, 'Professional service'),
      quantity: 1,
      unitPrice: Number(pick(source.totalAmount, source.amount, source.price, 0)),
    },
  ]
}

/**
 * Maps a generic app record into the quotation generator's canonical shape.
 *
 * @param {object} source Project-specific quotation/proposal/order record.
 * @returns {object} Generic quotation payload.
 */
export function mapGenericRecordToQuotation(source = {}) {
  return {
    id: source.id || source.quoteId || source.quotationId || source.docId,
    quoteCode: pick(source.quoteCode, source.quotationCode, source.quoteNumber, source.number, source.code),
    status: pick(source.status, 'draft'),
    quoteDate: pick(source.quoteDate, source.issueDate, source.createdAt, new Date().toISOString()),
    validUntil: pick(source.validUntil, source.expiryDate, source.validUntilDate, source.dueDate),
    client: normalizeClient(source),
    reference: normalizeReference(source),
    lineItems: normalizeLineItems(source),
    currency: pick(source.currency, 'NAD'),
    discountAmount: Number(pick(source.discountAmount, source.discount, 0)),
    depositAmount: Number(pick(source.depositAmount, source.depositRequired, 0)),
    totalAmount: source.totalAmount,
    notes: source.notes || '',
    terms: source.terms || [],
    footerNote: source.footerNote || '',
    showAcceptance: source.showAcceptance !== false,
  }
}

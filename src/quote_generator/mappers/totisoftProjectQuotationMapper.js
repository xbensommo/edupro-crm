/**
 * @file src/mappers/totisoftProjectQuotationMapper.js
 * @description Example mapper for Totisoft-style project/service quotations.
 */

export function mapTotisoftProjectToQuotation(project = {}) {
  const totalAmount = Number(project.totalAmount || project.amount || project.developmentFee || 0)

  return {
    id: project.id,
    quoteCode: project.quoteCode || project.quotationCode || project.projectCode,
    status: project.status || 'draft',
    quoteDate: project.quoteDate || project.createdAt || new Date().toISOString(),
    validUntil: project.validUntil || project.expiryDate || null,

    client: {
      name: project.clientName,
      number: project.clientNumber || project.clientId,
      email: project.clientEmail,
      phone: project.clientPhone,
      addressLines: project.clientAddressLines || [],
    },

    reference: {
      label: 'Project',
      value: project.projectTitle || project.serviceName || project.description,
    },

    lineItems: Array.isArray(project.lineItems) && project.lineItems.length
      ? project.lineItems
      : [
          {
            description: project.serviceName || project.description || 'Academic Writing Services',
            quantity: 1,
            unitPrice: totalAmount,
          },
        ],

    currency: project.currency || 'NAD',
    discountAmount: Number(project.discountAmount || 0),
    depositAmount: Number(project.depositAmount || project.depositRequired || 0),
    totalAmount: project.totalAmount,
    notes: project.notes || 'This quotation covers only the scope listed above. Out-of-scope work is quoted separately.',
    terms: project.terms || [
      'Quotation is valid until the validity date shown above.',
      'Work starts after written approval and agreed payment confirmation.',
    ],
    footerNote: project.footerNote || 'Prepared by Totisoft CC.',
    showAcceptance: project.showAcceptance !== false,
  }
}

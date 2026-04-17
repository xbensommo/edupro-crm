/**
 * @file apps/crm/services/crmService.js
 * @description Shared CRM service built on the Totistack shared service core.
 */

import { computed } from 'vue'
import { useAppStore } from '@app/stores/appStore/index.js'
import {
  createActivityLogger,
  createCollectionAdapter, 
  createSequence,
  createServiceContext,
  generateStableId,
  getRecordId,
  asStringArray,
  normalizeDate,
   asNumber,
   asText,
  asMoney,
  withActivityLog,
} from '@core_services/index.js'

/**
 * Stable collection names owned by the CRM app.
 */
export const CRM_COLLECTIONS = Object.freeze({
  leads: 'crm_leads',
  contacts: 'crm_contacts',
  accounts: 'crm_accounts',
  opportunities: 'crm_opportunities',
  tasks: 'crm_tasks',
  activities: 'crm_activities',
  notes: 'crm_notes',
  documents: 'crm_documents',
  messages: 'crm_messages',
  attachments: 'crm_attachments',
  savedViews: 'crm_saved_views',
  automationRules: 'crm_automation_rules',
  assignmentRules: 'crm_assignment_rules',
  crmFiles: 'crm_files',
  clients: 'clients',
  engagements: 'engagements',
})

/**
 * Default pipeline stages used by the starter CRM UI and services.
 */
export const CRM_PIPELINE_STAGES = Object.freeze([
  'prospecting',
  'qualification',
  'proposal',
  'negotiation',
  'closed_won',
  'closed_lost',
])

/**
 * Document types supported by the CRM starter app.
 */
export const CRM_DOCUMENT_TYPES = Object.freeze(['quote', 'invoice', 'receipt'])

export const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'image/png',
  'image/jpeg',
])

export const ALLOWED_EXTENSIONS = new Set([
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'txt',
  'png',
  'jpg',
  'jpeg',
])

/**
 * @param {unknown} error
 * @param {string} fallbackMessage
 * @param {ReturnType<typeof createServiceContext>} context
 * @returns {Error}
 */
function normalizeCrmError(error, fallbackMessage, context) {
  return context.normalizeError(error, fallbackMessage, {
    code: error?.code || 'CRM_SERVICE_ERROR',
    domain: 'crm',
  })
}

/**
 * @param {string} firstName
 * @param {string} lastName
 * @returns {string}
 */
function buildFullName(firstName = '', lastName = '') {
  return [firstName, lastName].filter(Boolean).join(' ').trim()
}

/**
 * @param {Record<string, any>} record
 * @param {string} query
 * @param {string[]} fields
 * @returns {boolean}
 */
function matchesQuery(record, query, fields) {
  const normalizedQuery = asText(query).toLowerCase()
  if (!normalizedQuery) return true
  return fields.some((field) => String(record?.[field] || '').toLowerCase().includes(normalizedQuery))
}

/**
 * @param {Date|null} value
 * @returns {number}
 */
function toSortableDate(value) {
  return normalizeDate(value)?.getTime() || 0
}

/**
 * @param {string} label
 * @param {Record<string, any>} item
 * @returns {Record<string, any>}
 */
function timelineEvent(label, item) {
  return {
    id: `${label}-${getRecordId(item, generateStableId(label))}`,
    entity: label,
    title:
      item?.title ||
      item?.subject ||
      item?.name ||
      item?.fileName ||
      item?.documentNumber ||
      item?.body ||
      'Untitled',
    description:
      item?.description ||
      item?.body ||
      item?.subject ||
      item?.status ||
      item?.channel ||
      '',
    status: item?.status || item?.outcome || item?.type || item?.channel || 'logged',
    owner: item?.owner || item?.assignedTo || item?.createdBy || item?.uploadedBy || null,
    relatedLeadId: item?.leadId || null,
    relatedContactId: item?.contactId || null,
    relatedAccountId: item?.accountId || null,
    relatedOpportunityId: item?.opportunityId || null,
    relatedTaskId: item?.taskId || null,
    createdAt:
      item?.createdAt ||
      item?.loggedAt ||
      item?.issuedAt ||
      item?.dueAt ||
      item?.completedAt ||
      null,
  }
}

/**
 * @param {string|null|undefined} value
 * @returns {string}
 */
function clientPrimaryLabel(value) {
  return asText(value) || 'Unknown client'
}

/**
 * @param {Record<string, any>} client
 * @returns {string}
 */
function clientSecondaryLabel(client = {}) {
  return [client?.institutionName, client?.email, client?.phone].filter(Boolean).join(' • ')
}

/**
 * @param {number} value
 * @returns {string}
 */
function money(value) {
  return new Intl.NumberFormat('en-NA', {
    style: 'currency',
    currency: 'NAD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(asMoney(value))
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function formatDate(value) {
  const date = normalizeDate(value)
  if (!date) return ''
  return date.toISOString().slice(0, 10)
}

/**
 * @param {number} bytes
 * @returns {string}
 */
function formatFileSize(bytes) {
  const value = Number(bytes || 0)
  if (!Number.isFinite(value) || value <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = value
  let index = 0
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024
    index += 1
  }
  return `${size.toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}

/**
 * @returns {string}
 */
function createEngagementCode() {
  return createSequence('ENG')
}

/**
 * @param {Record<string, any>} payload
 * @param {ReturnType<typeof createServiceContext>} context
 * @returns {Record<string, any>}
 */
function buildLeadPayload(payload = {}, context) {
  const now = context.getNow()
  const firstName = asText(payload.firstName)
  const lastName = asText(payload.lastName)

  if (!firstName || !lastName) {
    throw context.createError('Lead first name and last name are required.', {
      code: 'LEAD_NAME_REQUIRED',
    })
  }

  return {
    firstName,
    lastName,
    fullName: asText(payload.fullName) || buildFullName(firstName, lastName),
    email: asText(payload.email) || null,
    phone: asText(payload.phone) || null,
    institutionName: asText(payload.institutionName) || null,
    title: asText(payload.title) || null,
    source: asText(payload.source) || 'manual',
    status: asText(payload.status) || 'new',
    score:  asNumber(payload.score),
    tags: asStringArray(payload.tags),
    assignedTo: payload.assignedTo || context.getCurrentUserId() || null,
    team: payload.team || null,
    nextFollowUp: normalizeDate(payload.nextFollowUp),
    notes: asText(payload.notes) || null,
    convertedOpportunityId: payload.convertedOpportunityId || null,
    lastActivityAt: normalizeDate(payload.lastActivityAt) || now,
    createdBy: payload.createdBy || context.getCurrentUserId() || null,
    createdAt: payload.createdAt || now,
    updatedAt: now,
  }
}

/**
 * @param {Record<string, any>} payload
 * @param {ReturnType<typeof createServiceContext>} context
 * @returns {Record<string, any>}
 */
function buildContactPayload(payload = {}, context) {
  const now = context.getNow()
  const firstName = asText(payload.firstName)
  const lastName = asText(payload.lastName)

  if (!firstName || !lastName) {
    throw context.createError('Contact first name and last name are required.', {
      code: 'CONTACT_NAME_REQUIRED',
    })
  }

  return {
    firstName,
    lastName,
    fullName: asText(payload.fullName) || buildFullName(firstName, lastName),
    leadId: payload.leadId || null,
    accountId: payload.accountId || null,
    email: asText(payload.email) || null,
    phone: asText(payload.phone) || null,
    mobile: asText(payload.mobile) || null,
    role: asText(payload.role) || null,
    lifecycleStage: asText(payload.lifecycleStage) || 'prospect',
    status: asText(payload.status) || 'active',
    owner: payload.owner || context.getCurrentUserId() || null,
    team: payload.team || null,
    tags: asStringArray(payload.tags),
    lastInteractionAt: normalizeDate(payload.lastInteractionAt) || now,
    createdBy: payload.createdBy || context.getCurrentUserId() || null,
    createdAt: payload.createdAt || now,
    updatedAt: now,
  }
}

/**
 * @param {Record<string, any>} payload
 * @param {ReturnType<typeof createServiceContext>} context
 * @returns {Record<string, any>}
 */
function buildAccountPayload(payload = {}, context) {
  const now = context.getNow()
  const name = asText(payload.name)
  if (!name) {
    throw context.createError('Account name is required.', {
      code: 'ACCOUNT_NAME_REQUIRED',
    })
  }

  return {
    name,
    accountNumber: payload.accountNumber || createSequence('ACC'),
    industry: asText(payload.industry) || null,
    website: asText(payload.website) || null,
    email: asText(payload.email) || null,
    phone: asText(payload.phone) || null,
    source: asText(payload.source) || 'manual',
    status: asText(payload.status) || 'active',
    owner: payload.owner || context.getCurrentUserId() || null,
    team: payload.team || null,
    billingAddress: asText(payload.billingAddress) || null,
    shippingAddress: asText(payload.shippingAddress) || null,
    tags: asStringArray(payload.tags),
    lastInteractionAt: normalizeDate(payload.lastInteractionAt) || now,
    createdBy: payload.createdBy || context.getCurrentUserId() || null,
    createdAt: payload.createdAt || now,
    updatedAt: now,
  }
}

/**
 * @param {Record<string, any>} payload
 * @param {ReturnType<typeof createServiceContext>} context
 * @returns {Record<string, any>}
 */
function buildOpportunityPayload(payload = {}, context) {
  const now = context.getNow()
  const name = asText(payload.name)
  if (!name) {
    throw context.createError('Opportunity name is required.', {
      code: 'OPPORTUNITY_NAME_REQUIRED',
    })
  }

  const stage = asText(payload.stage) || 'prospecting'
  if (!CRM_PIPELINE_STAGES.includes(stage)) {
    throw context.createError(`Unsupported opportunity stage: ${stage}`, {
      code: 'OPPORTUNITY_STAGE_INVALID',
      meta: { stage },
    })
  }

  const amount = asMoney(payload.amount)
  const probability = Math.min(100, Math.max(0,  asNumber(payload.probability, 10)))

  return {
    name,
    opportunityNumber: payload.opportunityNumber || createSequence('OPP'),
    leadId: payload.leadId || null,
    contactId: payload.contactId || null,
    accountId: payload.accountId || null,
    amount,
    currency: asText(payload.currency) || 'NAD',
    probability,
    expectedCloseDate: normalizeDate(payload.expectedCloseDate),
    actualCloseDate: normalizeDate(payload.actualCloseDate),
    stage,
    stageHistory: Array.isArray(payload.stageHistory)
      ? payload.stageHistory
      : [{ stage, changedAt: now, changedBy: context.getCurrentUserId() || null }],
    forecastCategory: asText(payload.forecastCategory) || 'pipeline',
    weightedAmount: asMoney(amount * (probability / 100)),
    description: asText(payload.description) || null,
    nextSteps: asText(payload.nextSteps) || null,
    owner: payload.owner || context.getCurrentUserId() || null,
    team: payload.team || null,
    lastActivityAt: normalizeDate(payload.lastActivityAt) || now,
    createdAt: payload.createdAt || now,
    updatedAt: now,
    closedAt: normalizeDate(payload.closedAt),
  }
}

/**
 * @param {Record<string, any>} payload
 * @param {ReturnType<typeof createServiceContext>} context
 * @returns {Record<string, any>}
 */
function buildTaskPayload(payload = {}, context) {
  const now = context.getNow()
  const title = asText(payload.title)
  if (!title) {
    throw context.createError('Task title is required.', {
      code: 'TASK_TITLE_REQUIRED',
    })
  }

  return {
    leadId: payload.leadId || null,
    contactId: payload.contactId || null,
    accountId: payload.accountId || null,
    opportunityId: payload.opportunityId || null,
    title,
    description: asText(payload.description) || null,
    type: asText(payload.type) || 'follow_up',
    status: asText(payload.status) || 'open',
    priority: asText(payload.priority) || 'medium',
    dueAt: normalizeDate(payload.dueAt),
    reminderAt: normalizeDate(payload.reminderAt),
    completedAt: normalizeDate(payload.completedAt),
    assignedTo: payload.assignedTo || context.getCurrentUserId() || null,
    team: payload.team || null,
    isFollowUp: payload.isFollowUp !== false,
    automationRuleId: payload.automationRuleId || null,
    createdBy: payload.createdBy || context.getCurrentUserId() || null,
    createdAt: payload.createdAt || now,
    updatedAt: now,
  }
}

/**
 * @param {Record<string, any>} payload
 * @param {ReturnType<typeof createServiceContext>} context
 * @returns {Record<string, any>}
 */
function buildActivityPayload(payload = {}, context) {
  const now = context.getNow()
  const subject = asText(payload.subject)
  if (!subject) {
    throw context.createError('Activity subject is required.', {
      code: 'ACTIVITY_SUBJECT_REQUIRED',
    })
  }

  return {
    leadId: payload.leadId || null,
    opportunityId: payload.opportunityId || null,
    contactId: payload.contactId || null,
    accountId: payload.accountId || null,
    type: asText(payload.type) || 'note',
    subtype: asText(payload.subtype) || null,
    subject,
    description: asText(payload.description) || null,
    duration:  asNumber(payload.duration) || null,
    outcome: asText(payload.outcome) || 'completed',
    scheduledAt: normalizeDate(payload.scheduledAt),
    completedAt: normalizeDate(payload.completedAt) || now,
    assignedTo: payload.assignedTo || context.getCurrentUserId() || null,
    createdBy: payload.createdBy || context.getCurrentUserId() || null,
    isPrivate: Boolean(payload.isPrivate),
    createdAt: payload.createdAt || now,
    updatedAt: now,
  }
}

/**
 * @param {Record<string, any>} payload
 * @param {ReturnType<typeof createServiceContext>} context
 * @returns {Record<string, any>}
 */
function buildNotePayload(payload = {}, context) {
  const now = context.getNow()
  const body = asText(payload.body)
  if (!body) {
    throw context.createError('Note body is required.', {
      code: 'NOTE_BODY_REQUIRED',
    })
  }

  return {
    leadId: payload.leadId || null,
    contactId: payload.contactId || null,
    accountId: payload.accountId || null,
    opportunityId: payload.opportunityId || null,
    taskId: payload.taskId || null,
    title: asText(payload.title) || null,
    body,
    visibility: asText(payload.visibility) || 'internal',
    pinned: Boolean(payload.pinned),
    createdBy: payload.createdBy || context.getCurrentUserId() || null,
    assignedTo: payload.assignedTo || context.getCurrentUserId() || null,
    team: payload.team || null,
    createdAt: payload.createdAt || now,
    updatedAt: now,
  }
}

/**
 * @param {Record<string, any>} payload
 * @param {ReturnType<typeof createServiceContext>} context
 * @returns {Record<string, any>}
 */
function buildDocumentPayload(payload = {}, context) {
  const now = context.getNow()
  const documentType = asText(payload.documentType) || 'quote'
  if (!CRM_DOCUMENT_TYPES.includes(documentType)) {
    throw context.createError(`Unsupported document type: ${documentType}`, {
      code: 'DOCUMENT_TYPE_INVALID',
      meta: { documentType },
    })
  }

  const title = asText(payload.title) || `${documentType.toUpperCase()} for customer`
  const subtotal = asMoney(payload.subtotal ?? payload.totalAmount)
  const taxAmount = asMoney(payload.taxAmount)
  const totalAmount = asMoney(payload.totalAmount ?? subtotal + taxAmount)
  const lineItems = Array.isArray(payload.lineItems) && payload.lineItems.length > 0
    ? payload.lineItems
    : [{ name: 'Starter service package', quantity: 1, unitPrice: totalAmount, total: totalAmount }]

  const customerName =
    asText(payload.customerName) ||
    asText(payload.accountName) ||
    asText(payload.contactName) ||
    'Customer Name'

  return {
    documentType,
    documentNumber: payload.documentNumber || createSequence(documentType.slice(0, 3).toUpperCase()),
    title,
    leadId: payload.leadId || null,
    contactId: payload.contactId || null,
    accountId: payload.accountId || null,
    opportunityId: payload.opportunityId || null,
    status: asText(payload.status) || (documentType === 'receipt' ? 'issued' : 'draft'),
    currency: asText(payload.currency) || 'NAD',
    subtotal,
    taxAmount,
    totalAmount,
    issuedAt: normalizeDate(payload.issuedAt) || now,
    dueAt: normalizeDate(payload.dueAt),
    paidAt: normalizeDate(payload.paidAt),
    templateKey: asText(payload.templateKey) || `${documentType}-default`,
    lineItems,
    generatedByPackage: asText(payload.generatedByPackage) || '@xbensommo/doc-generator',
    owner: payload.owner || context.getCurrentUserId() || null,
    team: payload.team || null,
    createdBy: payload.createdBy || context.getCurrentUserId() || null,
    placeholderPayload: payload.placeholderPayload || {
      issuer: {
        businessName: 'Your Business Name',
        email: 'billing@example.com',
        phone: '+264 81 000 0000',
      },
      customer: {
        name: customerName,
        email: asText(payload.customerEmail) || 'customer@example.com',
        phone: asText(payload.customerPhone) || '+264 81 000 0001',
      },
      summary: {
        title,
        note: 'Placeholder payload ready for the real document generator package.',
        totalAmount,
        currency: asText(payload.currency) || 'NAD',
      },
      lineItems,
    },
    createdAt: payload.createdAt || now,
    updatedAt: now,
  }
}

/**
 * @param {Record<string, any>} payload
 * @param {ReturnType<typeof createServiceContext>} context
 * @returns {Record<string, any>}
 */
function buildMessagePayload(payload = {}, context) {
  const now = context.getNow()
  const body = asText(payload.body)
  if (!body) {
    throw context.createError('Message body is required.', {
      code: 'MESSAGE_BODY_REQUIRED',
    })
  }

  return {
    leadId: payload.leadId || null,
    contactId: payload.contactId || null,
    accountId: payload.accountId || null,
    opportunityId: payload.opportunityId || null,
    channel: asText(payload.channel) || 'whatsapp',
    direction: asText(payload.direction) || 'outbound',
    subject: asText(payload.subject) || null,
    body,
    to: asText(payload.to) || null,
    from: asText(payload.from) || null,
    status: asText(payload.status) || 'logged',
    providerMessageId: asText(payload.providerMessageId) || null,
    loggedAt: normalizeDate(payload.loggedAt) || now,
    owner: payload.owner || context.getCurrentUserId() || null,
    team: payload.team || null,
    createdBy: payload.createdBy || context.getCurrentUserId() || null,
    createdAt: payload.createdAt || now,
    updatedAt: now,
  }
}

/**
 * @param {Record<string, any>} payload
 * @param {ReturnType<typeof createServiceContext>} context
 * @returns {Record<string, any>}
 */
function buildAttachmentPayload(payload = {}, context) {
  const now = context.getNow()
  const fileName = asText(payload.fileName)
  if (!fileName) {
    throw context.createError('Attachment file name is required.', {
      code: 'ATTACHMENT_FILE_NAME_REQUIRED',
    })
  }

  return {
    leadId: payload.leadId || null,
    contactId: payload.contactId || null,
    accountId: payload.accountId || null,
    opportunityId: payload.opportunityId || null,
    taskId: payload.taskId || null,
    documentId: payload.documentId || null,
    fileName,
    fileType: asText(payload.fileType) || 'application/pdf',
    fileSize:  asNumber(payload.fileSize),
    storagePath: asText(payload.storagePath) || `/crm/attachments/${fileName}`,
    downloadUrl: asText(payload.downloadUrl) || null,
    visibility: asText(payload.visibility) || 'internal',
    uploadedBy: payload.uploadedBy || context.getCurrentUserId() || null,
    createdAt: payload.createdAt || now,
    updatedAt: now,
  }
}

/**
 * @param {Record<string, any>} payload
 * @param {ReturnType<typeof createServiceContext>} context
 * @returns {Record<string, any>}
 */
function buildSavedViewPayload(payload = {}, context) {
  const now = context.getNow()
  const name = asText(payload.name)
  const module = asText(payload.module)
  if (!name || !module) {
    throw context.createError('Saved view name and module are required.', {
      code: 'SAVED_VIEW_REQUIRED',
    })
  }

  return {
    module,
    name,
    query: asText(payload.query) || null,
    filters: payload.filters || {},
    sort: payload.sort || { field: 'createdAt', direction: 'desc' },
    visibility: asText(payload.visibility) || 'private',
    isDefault: Boolean(payload.isDefault),
    owner: payload.owner || context.getCurrentUserId() || null,
    createdBy: payload.createdBy || context.getCurrentUserId() || null,
    createdAt: payload.createdAt || now,
    updatedAt: now,
  }
}

/**
 * @param {Record<string, any>} payload
 * @param {ReturnType<typeof createServiceContext>} context
 * @returns {Record<string, any>}
 */
function buildAutomationRulePayload(payload = {}, context) {
  const now = context.getNow()
  const name = asText(payload.name)
  const targetModule = asText(payload.targetModule)
  const triggerEvent = asText(payload.triggerEvent)
  if (!name || !targetModule || !triggerEvent) {
    throw context.createError('Automation rule name, target module, and trigger event are required.', {
      code: 'AUTOMATION_RULE_REQUIRED',
    })
  }

  return {
    name,
    targetModule,
    triggerEvent,
    enabled: payload.enabled !== false,
    conditions: Array.isArray(payload.conditions) ? payload.conditions : [],
    actions: Array.isArray(payload.actions) ? payload.actions : [],
    owner: payload.owner || context.getCurrentUserId() || null,
    team: payload.team || null,
    runCount:  asNumber(payload.runCount),
    lastRunAt: normalizeDate(payload.lastRunAt),
    createdBy: payload.createdBy || context.getCurrentUserId() || null,
    createdAt: payload.createdAt || now,
    updatedAt: now,
  }
}

/**
 * @param {Record<string, any>} payload
 * @param {ReturnType<typeof createServiceContext>} context
 * @returns {Record<string, any>}
 */
function buildAssignmentRulePayload(payload = {}, context) {
  const now = context.getNow()
  const name = asText(payload.name)
  const targetModule = asText(payload.targetModule)
  if (!name || !targetModule) {
    throw context.createError('Assignment rule name and target module are required.', {
      code: 'ASSIGNMENT_RULE_REQUIRED',
    })
  }

  return {
    name,
    targetModule,
    enabled: payload.enabled !== false,
    ownershipMode: asText(payload.ownershipMode) || 'direct',
    assignTo: payload.assignTo || context.getCurrentUserId() || null,
    assignTeam: payload.assignTeam || null,
    roundRobinKey: payload.roundRobinKey || null,
    conditions: Array.isArray(payload.conditions) ? payload.conditions : [],
    createdBy: payload.createdBy || context.getCurrentUserId() || null,
    createdAt: payload.createdAt || now,
    updatedAt: now,
  }
}

/**
 * @param {Record<string, any>} payload
 * @param {ReturnType<typeof createServiceContext>} context
 * @returns {Record<string, any>}
 */
function buildEngagemnetPayload(payload = {}, context) {
  return {
    engagementCode: asText(payload.engagementCode) || createEngagementCode(),
    clientId: asText(payload.clientId),
    title: asText(payload.title),
    serviceType: asText(payload.serviceType),
    description: asText(payload.description) || null,
    studyLevel: asText(payload.studyLevel) || null,
    institutionName: asText(payload.institutionName) || null,
    assignedConsultantId: asText(payload.assignedConsultantId) || null,
    assignedTeam: asText(payload.assignedTeam) || null,
    priority: asText(payload.priority) || 'medium',
    status: asText(payload.status) || 'draft',
    deliveryStatus: asText(payload.deliveryStatus) || 'pending',
    satisfactionStatus: asText(payload.satisfactionStatus) || 'pending',
    quotedAmount: asMoney(payload.quotedAmount),
    discountAmount: asMoney(payload.discountAmountValue),
    netAmount: asMoney(payload.netAmount),
    currency: asText(payload.currency) || 'NAD',
    shareRuleId: asText(payload.shareRuleId) || null,
    amountPaidCached: asMoney(payload.amountPaidValue),
    amountRefundedCached: asMoney(payload.amountRefundedValue),
    amountDueCached: asMoney(payload.amountDue),
    consultantShareAmountCached: asMoney(payload.consultantShare),
    companyShareAmountCached: asMoney(payload.companyShare),
    startDate: normalizeDate(payload.startDate),
    dueDate: normalizeDate(payload.dueDate),
    remarks: asText(payload.remarks) || null,
    createdBy: payload.currentUserId || context.getCurrentUserId() || null,
    createdAt: context.getNow(),
    updatedAt: context.getNow(),
  }
}

/**
 * Create the CRM service bound to the root store.
 *
 * @param {ReturnType<typeof useAppStore>} [store]
 * @returns {object}
 */
export function createCrmService(store = useAppStore()) {
  const context = createServiceContext({
    store,
    domain: 'crm',
  })

  const adapters = Object.freeze(
    Object.fromEntries(
      Object.values(CRM_COLLECTIONS).map((collectionName) => [
        collectionName,
        createCollectionAdapter({
          context,
          collectionName,
          stateKey: collectionName,
        }),
      ]),
    ),
  )

  const createActivityEntry = createActivityLogger({
    context,
    collectionName: CRM_COLLECTIONS.activities,
    idPrefix: 'crm_activity',
    buildRecord: (payload) => buildActivityPayload(payload, context),
  })

  /** @param {string} permission */
  function assertWrite(permission = 'crm:write') {
    context.assertPermission(permission, {
      message: `Missing permission: ${permission}`,
      code: 'crm/forbidden',
    })
  }

  /**
   * @param {string} collectionName
   * @param {Record<string, any>} [params={}]
   * @returns {Promise<any[]>}
   */
  async function fetchCollection(collectionName, params = {}) {
    return adapters[collectionName].list(params)
  }

  /**
   * @param {string} collectionName
   * @param {string} id
   * @returns {Promise<any>}
   */
  async function getById(collectionName, id) {
    return adapters[collectionName].getById(id)
  }

  /**
   * @param {string} collectionName
   * @param {Record<string, any>} payload
   * @returns {Promise<any>}
   */
  async function add(collectionName, payload) {
    return adapters[collectionName].create(payload)
  }

  /**
   * @param {string} collectionName
   * @param {string} id
   * @param {Record<string, any>} payload
   * @returns {Promise<any>}
   */
  async function update(collectionName, id, payload) {
    return adapters[collectionName].update(id, payload)
  }

  async function fetchLeads(params = {}) {
    try { return await fetchCollection(CRM_COLLECTIONS.leads, params) } catch (error) { throw normalizeCrmError(error, 'Failed to load leads.', context) }
  }
  async function fetchLeadById(id) {
    try { return await getById(CRM_COLLECTIONS.leads, id) } catch (error) { throw normalizeCrmError(error, 'Failed to load the lead.', context) }
  }
  async function createLead(payload) {
    assertWrite('crm:write')
    try {
      return await withActivityLog(
        () => add(CRM_COLLECTIONS.leads, buildLeadPayload(payload, context)),
        {
          log: async (lead) => {
            await createActivity({
              leadId: lead?.id || null,
              type: 'lead_assign',
              subject: 'Lead created',
              description: `Lead ${buildFullName(payload?.firstName, payload?.lastName)} was created.`,
            })
          },
        },
      )
    } catch (error) { throw normalizeCrmError(error, 'Failed to create the lead.', context) }
  }
  async function updateLead(id, payload = {}) {
    assertWrite('crm:write')
    try { return await update(CRM_COLLECTIONS.leads, id, { ...payload, updatedAt: context.getNow() }) } catch (error) { throw normalizeCrmError(error, 'Failed to update the lead.', context) }
  }

  async function fetchContacts(params = {}) {
    try { return await fetchCollection(CRM_COLLECTIONS.contacts, params) } catch (error) { throw normalizeCrmError(error, 'Failed to load contacts.', context) }
  }
  async function createContact(payload) {
    assertWrite('crm:write')
    try {
      return await withActivityLog(
        () => add(CRM_COLLECTIONS.contacts, buildContactPayload(payload, context)),
        {
          log: async (contact) => {
            await createActivity({
              contactId: contact?.id || null,
              accountId: payload?.accountId || null,
              leadId: payload?.leadId || null,
              type: 'contact_created',
              subject: 'Contact created',
              description: `Contact ${buildFullName(payload?.firstName, payload?.lastName)} was added.`,
            })
          },
        },
      )
    } catch (error) { throw normalizeCrmError(error, 'Failed to create the contact.', context) }
  }
  async function updateContact(id, payload = {}) {
    assertWrite('crm:write')
    try { return await update(CRM_COLLECTIONS.contacts, id, { ...payload, updatedAt: context.getNow() }) } catch (error) { throw normalizeCrmError(error, 'Failed to update the contact.', context) }
  }

  async function fetchAccounts(params = {}) {
    try { return await fetchCollection(CRM_COLLECTIONS.accounts, params) } catch (error) { throw normalizeCrmError(error, 'Failed to load accounts.', context) }
  }
  async function createAccount(payload) {
    assertWrite('crm:write')
    try {
      return await withActivityLog(
        () => add(CRM_COLLECTIONS.accounts, buildAccountPayload(payload, context)),
        {
          log: async (account) => {
            await createActivity({
              accountId: account?.id || null,
              type: 'account_created',
              subject: 'Account created',
              description: `Account ${payload?.name || account?.name || ''} was created.`,
            })
          },
        },
      )
    } catch (error) { throw normalizeCrmError(error, 'Failed to create the account.', context) }
  }
  async function updateAccount(id, payload = {}) {
    assertWrite('crm:write')
    try { return await update(CRM_COLLECTIONS.accounts, id, { ...payload, updatedAt: context.getNow() }) } catch (error) { throw normalizeCrmError(error, 'Failed to update the account.', context) }
  }

  async function fetchOpportunities(params = {}) {
    try { return await fetchCollection(CRM_COLLECTIONS.opportunities, params) } catch (error) { throw normalizeCrmError(error, 'Failed to load opportunities.', context) }
  }
  async function createOpportunity(payload) {
    assertWrite('crm:write')
    try {
      return await withActivityLog(
        () => add(CRM_COLLECTIONS.opportunities, buildOpportunityPayload(payload, context)),
        {
          log: async (opportunity) => {
            await createActivity({
              leadId: payload?.leadId || null,
              contactId: payload?.contactId || null,
              accountId: payload?.accountId || null,
              opportunityId: opportunity?.id || null,
              type: 'stage_change',
              subject: 'Opportunity created',
              description: `Opportunity ${opportunity?.name || payload?.name || ''} was created.`,
            })
          },
        },
      )
    } catch (error) { throw normalizeCrmError(error, 'Failed to create the opportunity.', context) }
  }
  async function moveOpportunityStage(id, stage) {
    assertWrite('crm:write')
    if (!CRM_PIPELINE_STAGES.includes(stage)) {
      throw context.createError(`Unsupported opportunity stage: ${stage}`, {
        code: 'OPPORTUNITY_STAGE_INVALID',
        meta: { stage },
      })
    }

    try {
      const current = await getById(CRM_COLLECTIONS.opportunities, id)
      const stageHistory = Array.isArray(current?.stageHistory) ? [...current.stageHistory] : []
      stageHistory.push({ stage, changedAt: context.getNow(), changedBy: context.getCurrentUserId() || null })

      const updated = await update(CRM_COLLECTIONS.opportunities, id, {
        stage,
        probability: stage === 'closed_won' ? 100 : stage === 'closed_lost' ? 0 : current?.probability,
        actualCloseDate: stage === 'closed_won' || stage === 'closed_lost' ? context.getNow() : current?.actualCloseDate || null,
        closedAt: stage === 'closed_won' || stage === 'closed_lost' ? context.getNow() : null,
        stageHistory,
        updatedAt: context.getNow(),
      })

      await createActivity({
        opportunityId: id,
        type: 'stage_change',
        subject: 'Pipeline stage updated',
        description: `Opportunity moved to ${stage}.`,
      })

      return updated
    } catch (error) { throw normalizeCrmError(error, 'Failed to move the opportunity stage.', context) }
  }

  async function fetchTasks(params = {}) {
    try { return await fetchCollection(CRM_COLLECTIONS.tasks, params) } catch (error) { throw normalizeCrmError(error, 'Failed to load tasks.', context) }
  }
  async function createTask(payload) {
    assertWrite('crm:write')
    try {
      return await withActivityLog(
        () => add(CRM_COLLECTIONS.tasks, buildTaskPayload(payload, context)),
        {
          log: async () => {
            await createActivity({
              leadId: payload?.leadId || null,
              contactId: payload?.contactId || null,
              accountId: payload?.accountId || null,
              opportunityId: payload?.opportunityId || null,
              type: 'task_created',
              subject: 'Task created',
              description: payload?.title || 'Task created.',
            })
          },
        },
      )
    } catch (error) { throw normalizeCrmError(error, 'Failed to create the task.', context) }
  }
  async function updateTask(id, payload = {}) {
    assertWrite('crm:write')
    try { return await update(CRM_COLLECTIONS.tasks, id, { ...payload, updatedAt: context.getNow() }) } catch (error) { throw normalizeCrmError(error, 'Failed to update the task.', context) }
  }
  async function completeTask(id) {
    assertWrite('crm:write')
    try {
      const task = await getById(CRM_COLLECTIONS.tasks, id)
      const updated = await updateTask(id, { status: 'completed', completedAt: context.getNow() })
      await createActivity({
        leadId: task?.leadId || null,
        contactId: task?.contactId || null,
        accountId: task?.accountId || null,
        opportunityId: task?.opportunityId || null,
        type: 'task_completed',
        subject: 'Task completed',
        description: task?.title || 'Task completed.',
      })
      return updated
    } catch (error) { throw normalizeCrmError(error, 'Failed to complete the task.', context) }
  }

  async function fetchActivities(params = {}) {
    try { return await fetchCollection(CRM_COLLECTIONS.activities, params) } catch (error) { throw normalizeCrmError(error, 'Failed to load activities.', context) }
  }
  async function createActivity(payload) {
    assertWrite('crm:write')
    try { return await createActivityEntry(payload) } catch (error) { throw normalizeCrmError(error, 'Failed to create the activity.', context) }
  }

  async function fetchNotes(params = {}) {
    try { return await fetchCollection(CRM_COLLECTIONS.notes, params) } catch (error) { throw normalizeCrmError(error, 'Failed to load notes.', context) }
  }
  async function createNote(payload) {
    assertWrite('crm:write')
    try { return await add(CRM_COLLECTIONS.notes, buildNotePayload(payload, context)) } catch (error) { throw normalizeCrmError(error, 'Failed to create the note.', context) }
  }

  async function fetchDocuments(params = {}) {
    try { return await fetchCollection(CRM_COLLECTIONS.documents, params) } catch (error) { throw normalizeCrmError(error, 'Failed to load documents.', context) }
  }
  async function createDocument(payload) {
    assertWrite('crm:write')
    try {
      return await withActivityLog(
        () => add(CRM_COLLECTIONS.documents, buildDocumentPayload(payload, context)),
        {
          log: async (document) => {
            await createActivity({
              leadId: payload?.leadId || null,
              contactId: payload?.contactId || null,
              accountId: payload?.accountId || null,
              opportunityId: payload?.opportunityId || null,
              type: 'document_created',
              subject: `${document?.documentType || payload?.documentType || 'Document'} created`,
              description: document?.documentNumber || document?.title || 'Document created.',
            })
          },
        },
      )
    } catch (error) { throw normalizeCrmError(error, 'Failed to create the document.', context) }
  }

  async function fetchMessages(params = {}) {
    try { return await fetchCollection(CRM_COLLECTIONS.messages, params) } catch (error) { throw normalizeCrmError(error, 'Failed to load messages.', context) }
  }
  async function logMessage(payload) {
    assertWrite('crm:write')
    try {
      return await withActivityLog(
        () => add(CRM_COLLECTIONS.messages, buildMessagePayload(payload, context)),
        {
          log: async () => {
            await createActivity({
              leadId: payload?.leadId || null,
              contactId: payload?.contactId || null,
              accountId: payload?.accountId || null,
              opportunityId: payload?.opportunityId || null,
              type: 'communication_logged',
              subject: `${payload?.channel || 'Message'} logged`,
              description: asText(payload?.subject) || asText(payload?.body) || 'Communication logged.',
            })
          },
        },
      )
    } catch (error) { throw normalizeCrmError(error, 'Failed to log the message.', context) }
  }

  async function fetchAttachments(params = {}) {
    try { return await fetchCollection(CRM_COLLECTIONS.attachments, params) } catch (error) { throw normalizeCrmError(error, 'Failed to load attachments.', context) }
  }
  async function createAttachment(payload) {
    assertWrite('crm:write')
    try { return await add(CRM_COLLECTIONS.attachments, buildAttachmentPayload(payload, context)) } catch (error) { throw normalizeCrmError(error, 'Failed to create the attachment metadata.', context) }
  }

  async function fetchSavedViews(params = {}) {
    try { return await fetchCollection(CRM_COLLECTIONS.savedViews, params) } catch (error) { throw normalizeCrmError(error, 'Failed to load saved views.', context) }
  }
  async function createSavedView(payload) {
    assertWrite('crm:write')
    try { return await add(CRM_COLLECTIONS.savedViews, buildSavedViewPayload(payload, context)) } catch (error) { throw normalizeCrmError(error, 'Failed to create the saved view.', context) }
  }

  async function fetchAutomationRules(params = {}) {
    try { return await fetchCollection(CRM_COLLECTIONS.automationRules, params) } catch (error) { throw normalizeCrmError(error, 'Failed to load automation rules.', context) }
  }
  async function createAutomationRule(payload) {
    assertWrite('crm:write')
    try { return await add(CRM_COLLECTIONS.automationRules, buildAutomationRulePayload(payload, context)) } catch (error) { throw normalizeCrmError(error, 'Failed to create the automation rule.', context) }
  }

  async function fetchAssignmentRules(params = {}) {
    try { return await fetchCollection(CRM_COLLECTIONS.assignmentRules, params) } catch (error) { throw normalizeCrmError(error, 'Failed to load assignment rules.', context) }
  }
  async function createAssignmentRule(payload) {
    assertWrite('crm:write')
    try { return await add(CRM_COLLECTIONS.assignmentRules, buildAssignmentRulePayload(payload, context)) } catch (error) { throw normalizeCrmError(error, 'Failed to create the assignment rule.', context) }
  }

  async function convertLeadToOpportunity(leadId, opportunityPayload = {}) {
    assertWrite('crm:write')
    try {
      const lead = await fetchLeadById(leadId)
      if (!lead) {
        throw context.createError('Lead not found.', { code: 'LEAD_NOT_FOUND', meta: { leadId } })
      }

      const opportunity = await createOpportunity({
        name: opportunityPayload.name || `${lead.institutionName || lead.fullName || 'Lead'} Opportunity`,
        leadId,
        amount: opportunityPayload.amount || 0,
        expectedCloseDate: opportunityPayload.expectedCloseDate || null,
        owner: opportunityPayload.owner || lead.assignedTo || context.getCurrentUserId() || null,
        description: opportunityPayload.description || `Converted from lead ${lead.fullName || ''}.`,
        ...opportunityPayload,
      })

      await updateLead(leadId, {
        status: 'converted',
        convertedOpportunityId: opportunity?.id || null,
      })

      return opportunity
    } catch (error) { throw normalizeCrmError(error, 'Failed to convert the lead.', context) }
  }

  async function fetchRecordTimeline(filters = {}) {
    try {
      const [activities, notes, messages, documents, tasks, attachments] = await Promise.all([
        fetchActivities(filters),
        fetchNotes(filters),
        fetchMessages(filters),
        fetchDocuments(filters),
        fetchTasks(filters),
        fetchAttachments(filters),
      ])

      const filtered = [
        ...activities.map((item) => timelineEvent('activity', item)),
        ...notes.map((item) => timelineEvent('note', item)),
        ...messages.map((item) => timelineEvent('message', item)),
        ...documents.map((item) => timelineEvent('document', item)),
        ...tasks.map((item) => timelineEvent('task', item)),
        ...attachments.map((item) => timelineEvent('attachment', item)),
      ].filter((event) => {
        if (filters.leadId && event.relatedLeadId !== filters.leadId) return false
        if (filters.contactId && event.relatedContactId !== filters.contactId) return false
        if (filters.accountId && event.relatedAccountId !== filters.accountId) return false
        if (filters.opportunityId && event.relatedOpportunityId !== filters.opportunityId) return false
        return true
      })

      return filtered.sort((a, b) => toSortableDate(b.createdAt) - toSortableDate(a.createdAt))
    } catch (error) { throw normalizeCrmError(error, 'Failed to load the CRM timeline.', context) }
  }

  async function fetchLeadWorkspace(leadId) {
    try {
      const [lead, timeline, tasks, documents, messages] = await Promise.all([
        fetchLeadById(leadId),
        fetchRecordTimeline({ leadId }),
        fetchTasks({}),
        fetchDocuments({}),
        fetchMessages({}),
      ])

      return {
        lead,
        timeline,
        tasks: tasks.filter((item) => item?.leadId === leadId),
        documents: documents.filter((item) => item?.leadId === leadId),
        messages: messages.filter((item) => item?.leadId === leadId),
      }
    } catch (error) { throw normalizeCrmError(error, 'Failed to load the lead workspace.', context) }
  }

  async function searchEverything(query, options = {}) {
    try {
      const [leads, contacts, accounts, opportunities, tasks, documents, messages] = await Promise.all([
        fetchLeads(options),
        fetchContacts(options),
        fetchAccounts(options),
        fetchOpportunities(options),
        fetchTasks(options),
        fetchDocuments(options),
        fetchMessages(options),
      ])

      const results = [
        ...leads
          .filter((item) => matchesQuery(item, query, ['firstName', 'lastName', 'fullName', 'email', 'institutionName']))
          .map((item) => ({ id: getRecordId(item), module: 'lead', title: item.fullName, subtitle: item.institutionName || item.email || '', status: item.status || 'new' })),
        ...contacts
          .filter((item) => matchesQuery(item, query, ['firstName', 'lastName', 'fullName', 'email', 'role']))
          .map((item) => ({ id: getRecordId(item), module: 'contact', title: item.fullName, subtitle: item.role || item.email || '', status: item.status || 'active' })),
        ...accounts
          .filter((item) => matchesQuery(item, query, ['name', 'accountNumber', 'industry', 'email']))
          .map((item) => ({ id: getRecordId(item), module: 'account', title: item.name, subtitle: item.industry || item.email || '', status: item.status || 'active' })),
        ...opportunities
          .filter((item) => matchesQuery(item, query, ['name', 'opportunityNumber', 'description', 'nextSteps']))
          .map((item) => ({ id: getRecordId(item), module: 'opportunity', title: item.name, subtitle: item.opportunityNumber || '', status: item.stage || 'prospecting' })),
        ...tasks
          .filter((item) => matchesQuery(item, query, ['title', 'description']))
          .map((item) => ({ id: getRecordId(item), module: 'task', title: item.title, subtitle: item.description || '', status: item.status || 'open' })),
        ...documents
          .filter((item) => matchesQuery(item, query, ['title', 'documentNumber']))
          .map((item) => ({ id: getRecordId(item), module: 'document', title: item.title, subtitle: item.documentNumber || '', status: item.status || 'draft' })),
        ...messages
          .filter((item) => matchesQuery(item, query, ['subject', 'body', 'to', 'from']))
          .map((item) => ({ id: getRecordId(item), module: 'message', title: item.subject || item.channel || 'Message', subtitle: item.to || item.from || '', status: item.status || 'logged' })),
      ]

      return results.sort((a, b) => a.module.localeCompare(b.module))
    } catch (error) { throw normalizeCrmError(error, 'Failed to search CRM records.', context) }
  }

  async function fetchCustomerRecordsSnapshot() {
    try {
      const [leads, contacts, accounts, opportunities, timeline] = await Promise.all([
        fetchLeads(),
        fetchContacts(),
        fetchAccounts(),
        fetchOpportunities(),
        fetchRecordTimeline(),
      ])

      return {
        leads,
        contacts,
        accounts,
        opportunities,
        timeline: timeline.slice(0, 25),
      }
    } catch (error) { throw normalizeCrmError(error, 'Failed to load the customer records snapshot.', context) }
  }

  async function fetchDashboardSnapshot() {
    try {
      const [leads, contacts, accounts, opportunities, tasks, activities] = await Promise.all([
        fetchLeads(),
        fetchContacts(),
        fetchAccounts(),
        fetchOpportunities(),
        fetchTasks(),
        fetchActivities(),
      ])

      const openPipelineAmount = opportunities
        .filter((item) => !['closed_won', 'closed_lost'].includes(item?.stage))
        .reduce((total, item) => total + Number(item?.weightedAmount || item?.amount || 0), 0)

      return {
        totals: {
          leads: leads.length,
          contacts: contacts.length,
          accounts: accounts.length,
          opportunities: opportunities.length,
          tasks: tasks.length,
          activities: activities.length,
          openPipelineAmount,
        },
        recentLeads: [...leads].sort((a, b) => toSortableDate(b?.createdAt) - toSortableDate(a?.createdAt)).slice(0, 5),
        recentActivities: [...activities].sort((a, b) => toSortableDate(b?.createdAt) - toSortableDate(a?.createdAt)).slice(0, 8),
        opportunitiesByStage: CRM_PIPELINE_STAGES.map((stage) => ({ stage, items: opportunities.filter((item) => item?.stage === stage) })),
      }
    } catch (error) { throw normalizeCrmError(error, 'Failed to load the CRM dashboard snapshot.', context) }
  }

  async function fetchReportsSnapshot() {
    try {
      const [leads, contacts, accounts, opportunities, tasks, documents, messages, automationRules, assignmentRules] = await Promise.all([
        fetchLeads(),
        fetchContacts(),
        fetchAccounts(),
        fetchOpportunities(),
        fetchTasks(),
        fetchDocuments(),
        fetchMessages(),
        fetchAutomationRules(),
        fetchAssignmentRules(),
      ])

      const wonDeals = opportunities.filter((item) => item?.stage === 'closed_won')
      const lostDeals = opportunities.filter((item) => item?.stage === 'closed_lost')
      const totalWonAmount = wonDeals.reduce((total, item) => total + asMoney(item?.amount), 0)
      const openTasks = tasks.filter((item) => item?.status !== 'completed').length
      const overdueTasks = tasks.filter((item) => item?.status !== 'completed' && toSortableDate(item?.dueAt) < Date.now()).length
      const documentsByType = CRM_DOCUMENT_TYPES.map((type) => ({ type, count: documents.filter((item) => item?.documentType === type).length }))
      const communicationsByChannel = ['whatsapp', 'email', 'call'].map((channel) => ({ channel, count: messages.filter((item) => item?.channel === channel).length }))

      const ownerCounts = {}
      ;[...leads, ...contacts, ...accounts, ...opportunities, ...tasks].forEach((item) => {
        const owner = item?.owner || item?.assignedTo || 'unassigned'
        ownerCounts[owner] = (ownerCounts[owner] || 0) + 1
      })

      return {
        totals: {
          leads: leads.length,
          contacts: contacts.length,
          accounts: accounts.length,
          opportunities: opportunities.length,
          wonDeals: wonDeals.length,
          lostDeals: lostDeals.length,
          openTasks,
          overdueTasks,
          totalWonAmount,
          documents: documents.length,
          messages: messages.length,
          automationRules: automationRules.length,
          assignmentRules: assignmentRules.length,
        },
        documentsByType,
        communicationsByChannel,
        ownerWorkload: Object.entries(ownerCounts)
          .map(([owner, count]) => ({ owner, count }))
          .sort((a, b) => b.count - a.count),
      }
    } catch (error) { throw normalizeCrmError(error, 'Failed to load the CRM reports snapshot.', context) }
  }

  async function fetchClients(params = { pageSize: 100, sortBy: 'updatedAt', sortDirection: 'desc' }) {
    try { return await fetchCollection(CRM_COLLECTIONS.clients, params) } catch (error) { throw normalizeCrmError(error, 'Failed to load clients.', context) }
  }
  async function fetchRecentEngagements(params = {}) {
    try { return await fetchCollection(CRM_COLLECTIONS.engagements, params) } catch (error) { throw normalizeCrmError(error, 'Failed to load engagements.', context) }
  }
  async function createEngagements(payload) {
    assertWrite('crm:write')
    try {
      return await withActivityLog(
        () => add(CRM_COLLECTIONS.engagements, buildEngagemnetPayload(payload, context)),
        {
          log: async (engagement) => {
            await createActivity({
              contactId: engagement?.id || null,
              accountId: payload?.accountId || null,
              leadId: payload?.clientId || null,
              type: 'engagement_created',
              subject: 'Engagement created',
              description: `New engagement ${payload?.title || ''} was added.`.trim(),
            })
          },
        },
      )
    } catch (error) { throw normalizeCrmError(error, 'Failed to create the engagement.', context) }
  }
  async function fetchRecentFiles(params = {}) {
    try { return await fetchCollection(CRM_COLLECTIONS.crmFiles, params) } catch (error) { throw normalizeCrmError(error, 'Failed to load recent files.', context) }
  }

  return {
    collections: CRM_COLLECTIONS,
    pipelineStages: CRM_PIPELINE_STAGES,
    documentTypes: CRM_DOCUMENT_TYPES,
    fetchLeads,
    fetchLeadById,
    createLead,
    updateLead,
    fetchContacts,
    createContact,
    updateContact,
    fetchAccounts,
    createAccount,
    updateAccount,
    fetchOpportunities,
    createOpportunity,
    moveOpportunityStage,
    fetchTasks,
    createTask,
    updateTask,
    completeTask,
    fetchActivities,
    createActivity,
    fetchNotes,
    createNote,
    fetchDocuments,
    createDocument,
    fetchMessages,
    logMessage,
    fetchAttachments,
    createAttachment,
    fetchSavedViews,
    createSavedView,
    fetchAutomationRules,
    createAutomationRule,
    fetchAssignmentRules,
    createAssignmentRule,
    convertLeadToOpportunity,
    fetchRecordTimeline,
    fetchLeadWorkspace,
    fetchCustomerRecordsSnapshot,
    searchEverything,
    fetchDashboardSnapshot,
    fetchReportsSnapshot,
    createEngagementCode,
    clientPrimaryLabel,
    money,
    asMoney,
    asMoney,
    clientSecondaryLabel,
    formatDate,
    formatFileSize,
    buildEngagemnetPayload: (payload) => buildEngagemnetPayload(payload, context),
    fetchRecentEngagements,
    fetchRecentFiles,
    fetchClients,
    createEngagements,
  }
}

/**
 * Small composition helper for Vue components.
 *
 * @returns {{ store: ReturnType<typeof useAppStore>, service: ReturnType<typeof createCrmService>, currentUser: import('vue').ComputedRef<any> }}
 */
export function useCrmService() {
  const store = useAppStore()
  const service = createCrmService(store)

  return {
    store,
    service,
    currentUser: computed(() => store.currentUser?.value || null),
  }
}

export default createCrmService

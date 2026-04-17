/**
 * @file crm/services/crm.service.js
 * @description Production-oriented CRM domain service that uses the shared Totistack shard provider.
 *
 * This legacy-compatible service is kept aligned with the newer crmService.js API so older
 * Totistack assembly flows can still consume the expanded CRM surface without changing structure.
 */

const DEFAULT_LOGGER = console;

/**
 * @param {unknown} value
 * @returns {string|null}
 */
function normalizeDate(value) {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value?.toDate === 'function') return value.toDate().toISOString();
  return String(value);
}

/**
 * @param {string} prefix
 * @returns {string}
 */
function createSequence(prefix) {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${stamp}-${random}`;
}

/**
 * @param {object} access
 * @param {string} permission
 * @returns {boolean}
 */
function canAccess(access, permission) {
  if (!access || typeof access.can !== 'function') return true;
  return access.can(permission);
}

/**
 * @param {object} access
 * @param {string} permission
 */
function assertAccess(access, permission) {
  if (!canAccess(access, permission)) {
    const error = new Error(`Forbidden: missing permission "${permission}".`);
    error.code = 'CRM_FORBIDDEN';
    throw error;
  }
}

/**
 * @param {object|null|undefined} user
 * @returns {string}
 */
function requireUserId(user) {
  const uid = user?.uid || user?.id;
  if (!uid) {
    const error = new Error('Authentication required.');
    error.code = 'CRM_AUTH_REQUIRED';
    throw error;
  }
  return uid;
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function asText(value) {
  return String(value || '').trim();
}

/**
 * @param {number|string|null|undefined} value
 * @returns {number}
 */
function asMoney(value) {
  const amount = Number(value || 0);
  return Number.isFinite(amount) ? amount : 0;
}

/**
 * Create a CRM service bound to the root shard provider.
 *
 * @param {{ provider: object, access?: object, logger?: Console }} context
 * @returns {object}
 */
export function createCrmService({ provider, access, logger = DEFAULT_LOGGER }) {
  if (!provider) {
    throw new Error('[crm] provider is required to create the CRM service.');
  }

  const raw = {
    leads: provider.collection('crm_leads'),
    contacts: provider.collection('crm_contacts'),
    accounts: provider.collection('crm_accounts'),
    opportunities: provider.collection('crm_opportunities'),
    tasks: provider.collection('crm_tasks'),
    activities: provider.collection('crm_activities'),
    notes: provider.collection('crm_notes'),
    documents: provider.collection('crm_documents'),
    messages: provider.collection('crm_messages'),
    attachments: provider.collection('crm_attachments'),
    savedViews: provider.collection('crm_saved_views'),
    automationRules: provider.collection('crm_automation_rules'),
    assignmentRules: provider.collection('crm_assignment_rules'),
  };

  /**
   * @param {any} collection
   * @param {object} filters
   * @returns {Promise<any>}
   */
  function list(collection, filters = {}) {
    return collection.fetchInitialPage({
      filters,
      sort: { field: 'createdAt', direction: 'desc' },
    });
  }

  /**
   * @param {string} type
   * @param {any} payload
   * @param {object} [currentUser]
   * @returns {Promise<any>}
   */
  async function logCreateActivity(type, payload, currentUser = access?.currentUser) {
    const createdBy = requireUserId(currentUser);
    return raw.activities.add({
      leadId: payload.leadId || null,
      contactId: payload.contactId || null,
      accountId: payload.accountId || null,
      opportunityId: payload.opportunityId || null,
      type,
      subject: payload.subject || `${type} logged`,
      description: payload.description || null,
      outcome: payload.outcome || 'completed',
      assignedTo: payload.assignedTo || null,
      createdBy,
      completedAt: new Date().toISOString(),
    });
  }

  return {
    async createLead(payload, currentUser = access?.currentUser) {
      assertAccess(access, 'crm.leads.create');
      const createdBy = requireUserId(currentUser);
      const lead = {
        leadNumber: payload.leadNumber || createSequence('LEAD'),
        firstName: asText(payload.firstName),
        lastName: asText(payload.lastName),
        fullName: asText(payload.fullName) || `${asText(payload.firstName)} ${asText(payload.lastName)}`.trim(),
        email: asText(payload.email) || '',
        phone: asText(payload.phone) || '',
        company: asText(payload.company) || '',
        title: asText(payload.title) || '',
        source: payload.source || 'manual',
        status: payload.status || 'new',
        score: Number(payload.score || 0),
        tags: Array.isArray(payload.tags) ? payload.tags : [],
        assignedTo: payload.assignedTo || null,
        team: payload.team || null,
        nextFollowUp: normalizeDate(payload.nextFollowUp),
        notes: asText(payload.notes) || '',
        lastActivityAt: normalizeDate(payload.lastActivityAt) || new Date().toISOString(),
        createdBy,
      };

      if (!lead.firstName || !lead.lastName) {
        throw new Error('Lead firstName and lastName are required.');
      }

      const created = await raw.leads.add(lead);
      await logCreateActivity('lead_created', {
        leadId: created?.id || null,
        subject: 'Lead created',
        description: `Lead ${lead.fullName} was created.`,
      }, currentUser);
      logger.info?.('[crm] lead created', { id: created?.id || created?.docId, leadNumber: lead.leadNumber });
      return created;
    },

    async updateLead(id, payload) {
      assertAccess(access, 'crm.leads.update');
      if (!id) throw new Error('Lead id is required.');
      return raw.leads.update(id, payload);
    },

    async getLeadById(id) {
      assertAccess(access, 'crm.leads.read');
      if (!id) throw new Error('Lead id is required.');
      return raw.leads.getById(id);
    },

    async listLeads(filters = {}) {
      assertAccess(access, 'crm.leads.read');
      return list(raw.leads, filters);
    },

    async createContact(payload, currentUser = access?.currentUser) {
      assertAccess(access, 'crm.contacts.create');
      const createdBy = requireUserId(currentUser);
      const firstName = asText(payload.firstName);
      const lastName = asText(payload.lastName);
      if (!firstName || !lastName) throw new Error('Contact firstName and lastName are required.');

      return raw.contacts.add({
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`.trim(),
        leadId: payload.leadId || null,
        accountId: payload.accountId || null,
        email: asText(payload.email) || '',
        phone: asText(payload.phone) || '',
        mobile: asText(payload.mobile) || '',
        role: asText(payload.role) || '',
        lifecycleStage: payload.lifecycleStage || 'prospect',
        status: payload.status || 'active',
        owner: payload.owner || createdBy,
        team: payload.team || null,
        tags: Array.isArray(payload.tags) ? payload.tags : [],
        lastInteractionAt: normalizeDate(payload.lastInteractionAt) || new Date().toISOString(),
        createdBy,
      });
    },

    async listContacts(filters = {}) {
      assertAccess(access, 'crm.contacts.read');
      return list(raw.contacts, filters);
    },

    async createAccount(payload, currentUser = access?.currentUser) {
      assertAccess(access, 'crm.accounts.create');
      const createdBy = requireUserId(currentUser);
      const name = asText(payload.name);
      if (!name) throw new Error('Account name is required.');

      return raw.accounts.add({
        name,
        accountNumber: payload.accountNumber || createSequence('ACC'),
        industry: asText(payload.industry) || '',
        website: asText(payload.website) || '',
        email: asText(payload.email) || '',
        phone: asText(payload.phone) || '',
        source: payload.source || 'manual',
        status: payload.status || 'active',
        owner: payload.owner || createdBy,
        team: payload.team || null,
        billingAddress: asText(payload.billingAddress) || '',
        shippingAddress: asText(payload.shippingAddress) || '',
        tags: Array.isArray(payload.tags) ? payload.tags : [],
        lastInteractionAt: normalizeDate(payload.lastInteractionAt) || new Date().toISOString(),
        createdBy,
      });
    },

    async listAccounts(filters = {}) {
      assertAccess(access, 'crm.accounts.read');
      return list(raw.accounts, filters);
    },

    async createOpportunity(payload, currentUser = access?.currentUser) {
      assertAccess(access, 'crm.opportunities.create');
      const owner = payload.owner || requireUserId(currentUser);
      const probability = Number(payload.probability ?? 10);
      const amount = asMoney(payload.amount);
      const opportunity = {
        name: asText(payload.name),
        opportunityNumber: payload.opportunityNumber || createSequence('OPP'),
        leadId: payload.leadId || null,
        contactId: payload.contactId || null,
        accountId: payload.accountId || null,
        amount,
        currency: payload.currency || 'NAD',
        probability,
        expectedCloseDate: normalizeDate(payload.expectedCloseDate) || new Date().toISOString(),
        actualCloseDate: normalizeDate(payload.actualCloseDate),
        stage: payload.stage || 'prospecting',
        stageHistory: Array.isArray(payload.stageHistory) ? payload.stageHistory : [],
        forecastCategory: payload.forecastCategory || 'pipeline',
        weightedAmount: amount * (probability / 100),
        lineItems: Array.isArray(payload.lineItems) ? payload.lineItems : [],
        decisionCriteria: asText(payload.decisionCriteria) || '',
        nextSteps: asText(payload.nextSteps) || '',
        winLossReason: asText(payload.winLossReason) || '',
        owner,
        team: payload.team || null,
        lastActivityAt: payload.lastActivityAt || new Date().toISOString(),
        lastContactAt: normalizeDate(payload.lastContactAt),
        closedAt: normalizeDate(payload.closedAt),
      };

      if (!opportunity.name) throw new Error('Opportunity name is required.');
      const created = await raw.opportunities.add(opportunity);
      logger.info?.('[crm] opportunity created', { id: created?.id || created?.docId, opportunityNumber: opportunity.opportunityNumber });
      return created;
    },

    async listOpportunities(filters = {}) {
      assertAccess(access, 'crm.opportunities.read');
      return list(raw.opportunities, filters);
    },

    async createTask(payload, currentUser = access?.currentUser) {
      assertAccess(access, 'crm.tasks.create');
      const createdBy = requireUserId(currentUser);
      const title = asText(payload.title);
      if (!title) throw new Error('Task title is required.');

      return raw.tasks.add({
        leadId: payload.leadId || null,
        contactId: payload.contactId || null,
        accountId: payload.accountId || null,
        opportunityId: payload.opportunityId || null,
        title,
        description: asText(payload.description) || '',
        type: payload.type || 'follow_up',
        status: payload.status || 'open',
        priority: payload.priority || 'medium',
        dueAt: normalizeDate(payload.dueAt),
        reminderAt: normalizeDate(payload.reminderAt),
        completedAt: normalizeDate(payload.completedAt),
        assignedTo: payload.assignedTo || createdBy,
        team: payload.team || null,
        isFollowUp: payload.isFollowUp !== false,
        automationRuleId: payload.automationRuleId || null,
        createdBy,
      });
    },

    async listTasks(filters = {}) {
      assertAccess(access, 'crm.tasks.read');
      return list(raw.tasks, filters);
    },

    async createActivity(payload, currentUser = access?.currentUser) {
      assertAccess(access, 'crm.activities.create');
      const createdBy = requireUserId(currentUser);
      const subject = asText(payload.subject);
      if (!subject) throw new Error('Activity subject is required.');
      return raw.activities.add({
        leadId: payload.leadId || null,
        contactId: payload.contactId || null,
        accountId: payload.accountId || null,
        opportunityId: payload.opportunityId || null,
        type: payload.type || 'note',
        subtype: payload.subtype || '',
        subject,
        description: asText(payload.description) || '',
        duration: Number.isFinite(Number(payload.duration)) ? Number(payload.duration) : null,
        outcome: payload.outcome || 'completed',
        scheduledAt: normalizeDate(payload.scheduledAt),
        completedAt: normalizeDate(payload.completedAt) || new Date().toISOString(),
        assignedTo: payload.assignedTo || null,
        isPrivate: Boolean(payload.isPrivate),
        createdBy,
      });
    },

    async listActivities(filters = {}) {
      assertAccess(access, 'crm.activities.read');
      return list(raw.activities, filters);
    },

    async createNote(payload, currentUser = access?.currentUser) {
      assertAccess(access, 'crm.notes.create');
      const createdBy = requireUserId(currentUser);
      const body = asText(payload.body);
      if (!body) throw new Error('Note body is required.');
      return raw.notes.add({
        leadId: payload.leadId || null,
        contactId: payload.contactId || null,
        accountId: payload.accountId || null,
        opportunityId: payload.opportunityId || null,
        taskId: payload.taskId || null,
        title: asText(payload.title) || '',
        body,
        visibility: payload.visibility || 'internal',
        pinned: Boolean(payload.pinned),
        createdBy,
        assignedTo: payload.assignedTo || createdBy,
        team: payload.team || null,
      });
    },

    async listNotes(filters = {}) {
      assertAccess(access, 'crm.notes.read');
      return list(raw.notes, filters);
    },

    async createDocument(payload, currentUser = access?.currentUser) {
      assertAccess(access, 'crm.documents.create');
      const createdBy = requireUserId(currentUser);
      const documentType = payload.documentType || 'quote';
      const title = asText(payload.title) || `${documentType.toUpperCase()} for customer`;
      const subtotal = asMoney(payload.subtotal || payload.totalAmount);
      const taxAmount = asMoney(payload.taxAmount);
      const totalAmount = asMoney(payload.totalAmount || subtotal + taxAmount);
      return raw.documents.add({
        documentType,
        documentNumber: payload.documentNumber || createSequence(documentType.slice(0, 3).toUpperCase()),
        title,
        leadId: payload.leadId || null,
        contactId: payload.contactId || null,
        accountId: payload.accountId || null,
        opportunityId: payload.opportunityId || null,
        status: payload.status || (documentType === 'receipt' ? 'issued' : 'draft'),
        currency: payload.currency || 'NAD',
        subtotal,
        taxAmount,
        totalAmount,
        issuedAt: normalizeDate(payload.issuedAt) || new Date().toISOString(),
        dueAt: normalizeDate(payload.dueAt),
        paidAt: normalizeDate(payload.paidAt),
        templateKey: payload.templateKey || `${documentType}-default`,
        lineItems: Array.isArray(payload.lineItems) ? payload.lineItems : [],
        generatedByPackage: payload.generatedByPackage || '@xbensommo/doc-generator',
        owner: payload.owner || createdBy,
        team: payload.team || null,
        createdBy,
        placeholderPayload: payload.placeholderPayload || {
          issuer: { businessName: 'Your Business Name' },
          customer: { name: asText(payload.customerName) || 'Customer Name' },
          summary: { title, totalAmount, currency: payload.currency || 'NAD' },
        },
      });
    },

    async listDocuments(filters = {}) {
      assertAccess(access, 'crm.documents.read');
      return list(raw.documents, filters);
    },

    async logMessage(payload, currentUser = access?.currentUser) {
      assertAccess(access, 'crm.messages.create');
      const createdBy = requireUserId(currentUser);
      const body = asText(payload.body);
      if (!body) throw new Error('Message body is required.');
      return raw.messages.add({
        leadId: payload.leadId || null,
        contactId: payload.contactId || null,
        accountId: payload.accountId || null,
        opportunityId: payload.opportunityId || null,
        channel: payload.channel || 'whatsapp',
        direction: payload.direction || 'outbound',
        subject: asText(payload.subject) || '',
        body,
        to: asText(payload.to) || '',
        from: asText(payload.from) || '',
        status: payload.status || 'logged',
        providerMessageId: asText(payload.providerMessageId) || '',
        loggedAt: normalizeDate(payload.loggedAt) || new Date().toISOString(),
        owner: payload.owner || createdBy,
        team: payload.team || null,
        createdBy,
      });
    },

    async listMessages(filters = {}) {
      assertAccess(access, 'crm.messages.read');
      return list(raw.messages, filters);
    },

    async createAttachment(payload, currentUser = access?.currentUser) {
      assertAccess(access, 'crm.attachments.create');
      const uploadedBy = requireUserId(currentUser);
      const fileName = asText(payload.fileName);
      if (!fileName) throw new Error('Attachment fileName is required.');
      return raw.attachments.add({
        leadId: payload.leadId || null,
        contactId: payload.contactId || null,
        accountId: payload.accountId || null,
        opportunityId: payload.opportunityId || null,
        taskId: payload.taskId || null,
        documentId: payload.documentId || null,
        fileName,
        fileType: payload.fileType || 'application/pdf',
        fileSize: Number(payload.fileSize || 0),
        storagePath: asText(payload.storagePath) || `/crm/attachments/${fileName}`,
        downloadUrl: asText(payload.downloadUrl) || '',
        visibility: payload.visibility || 'internal',
        uploadedBy,
      });
    },

    async listAttachments(filters = {}) {
      assertAccess(access, 'crm.attachments.read');
      return list(raw.attachments, filters);
    },

    async createSavedView(payload, currentUser = access?.currentUser) {
      assertAccess(access, 'crm.views.create');
      const createdBy = requireUserId(currentUser);
      const name = asText(payload.name);
      const module = asText(payload.module);
      if (!name || !module) throw new Error('Saved view name and module are required.');
      return raw.savedViews.add({
        module,
        name,
        query: asText(payload.query) || '',
        filters: payload.filters || {},
        sort: payload.sort || { field: 'createdAt', direction: 'desc' },
        visibility: payload.visibility || 'private',
        isDefault: Boolean(payload.isDefault),
        owner: payload.owner || createdBy,
        createdBy,
      });
    },

    async listSavedViews(filters = {}) {
      assertAccess(access, 'crm.views.read');
      return list(raw.savedViews, filters);
    },

    async createAutomationRule(payload, currentUser = access?.currentUser) {
      assertAccess(access, 'crm.automation.create');
      const createdBy = requireUserId(currentUser);
      const name = asText(payload.name);
      const targetModule = asText(payload.targetModule);
      const triggerEvent = asText(payload.triggerEvent);
      if (!name || !targetModule || !triggerEvent) throw new Error('Automation rule fields are required.');
      return raw.automationRules.add({
        name,
        targetModule,
        triggerEvent,
        enabled: payload.enabled !== false,
        conditions: Array.isArray(payload.conditions) ? payload.conditions : [],
        actions: Array.isArray(payload.actions) ? payload.actions : [],
        owner: payload.owner || createdBy,
        team: payload.team || null,
        runCount: Number(payload.runCount || 0),
        lastRunAt: normalizeDate(payload.lastRunAt),
        createdBy,
      });
    },

    async listAutomationRules(filters = {}) {
      assertAccess(access, 'crm.automation.read');
      return list(raw.automationRules, filters);
    },

    async createAssignmentRule(payload, currentUser = access?.currentUser) {
      assertAccess(access, 'crm.assignment.create');
      const createdBy = requireUserId(currentUser);
      const name = asText(payload.name);
      const targetModule = asText(payload.targetModule);
      if (!name || !targetModule) throw new Error('Assignment rule fields are required.');
      return raw.assignmentRules.add({
        name,
        targetModule,
        enabled: payload.enabled !== false,
        ownershipMode: payload.ownershipMode || 'direct',
        assignTo: payload.assignTo || createdBy,
        assignTeam: payload.assignTeam || null,
        roundRobinKey: payload.roundRobinKey || null,
        conditions: Array.isArray(payload.conditions) ? payload.conditions : [],
        createdBy,
      });
    },

    async listAssignmentRules(filters = {}) {
      assertAccess(access, 'crm.assignment.read');
      return list(raw.assignmentRules, filters);
    },

    async convertLead(leadId, payload = {}, currentUser = access?.currentUser) {
      assertAccess(access, 'crm.leads.convert');
      const lead = await raw.leads.getById(leadId);
      if (!lead) {
        const error = new Error('Lead not found.');
        error.code = 'CRM_LEAD_NOT_FOUND';
        throw error;
      }

      const convertedOpportunity = await this.createOpportunity({
        name: payload.opportunityName || `Opportunity - ${lead.fullName || `${lead.firstName} ${lead.lastName}`.trim()}`,
        leadId,
        contactId: payload.contactId || null,
        accountId: payload.accountId || null,
        amount: payload.amount || 0,
        probability: payload.probability || 10,
        expectedCloseDate: payload.expectedCloseDate || new Date().toISOString(),
        owner: payload.owner || currentUser?.uid,
        ...payload,
      }, currentUser);

      await raw.leads.update(leadId, {
        status: 'converted',
        convertedOpportunityId: convertedOpportunity?.id || convertedOpportunity?.docId || null,
      });

      await this.createActivity({
        leadId,
        opportunityId: convertedOpportunity?.id || convertedOpportunity?.docId || null,
        type: 'stage_change',
        subject: 'Lead converted',
        description: 'Lead converted into an opportunity.',
      }, currentUser);

      return {
        leadId,
        opportunity: convertedOpportunity,
      };
    },

    raw,
  };
}

export default createCrmService;

/**
 * @file src/apps/recruitment/services/vacancyService.js
 * @description Service layer for the recruitment module. Mirrors the client-records
 *              service pattern (collection adapters, activity logging, role notifications)
 *              so the two domains stay consistent for future maintainers.
 *
 * NOTE: import paths for `@core_services/index.js` and `@app/stores/appStore` assume the
 * same aliases used by clientService.js. Adjust if your recruitment app lives elsewhere.
 */

import {
  createActivityLogger,
  createCollectionAdapter,
  createMonthlyNumber,
  createServiceContext,
  asStringArray,
  asNumber,
  asText,
  getRecordId,
  withActivityLog,
} from '@core_services/index.js'

import { useAppStore } from '@app/stores/appStore'

const DEFAULT_LIST_OPTIONS = Object.freeze({
  pageSize: 50,
  sortBy: 'updatedAt',
  sortDirection: 'desc',
})

function asBoolean(value) {
  return value === true || value === 'true'
}

function normalizeVacancyError(error, fallbackMessage, context) {
  return context.normalizeError(error, fallbackMessage, {
    code: error?.code || 'VACANCY_SERVICE_ERROR',
    domain: 'recruitment',
  })
}

function normalizeRecord(entry) {
  if (!entry || typeof entry !== 'object') return null
  const data = entry.data && typeof entry.data === 'object' ? entry.data : entry
  return { id: getRecordId(entry), ...data }
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function buildVacancyRecord(payload = {}, context) {
  const title = asText(payload.title)
  const isPublished = asBoolean(payload.isPublished)

  return {
    vacancyNumber: asText(payload.vacancyNumber) || createMonthlyNumber('VAC', { now: context.now }),
    title,
    slug: asText(payload.slug) || slugify(title),
    department: asText(payload.department),
    location: asText(payload.location),
    workMode: asText(payload.workMode) || 'onsite',
    employmentType: asText(payload.employmentType) || 'full_time',
    experienceLevel: asText(payload.experienceLevel) || 'mid',
    numberOfPositions: asNumber(payload.numberOfPositions) || 1,
    status: asText(payload.status) || (isPublished ? 'open' : 'draft'),
    isPublished,
    isFeatured: asBoolean(payload.isFeatured),
    summary: asText(payload.summary),
    description: asText(payload.description),
    responsibilities: asStringArray(payload.responsibilities),
    requirements: asStringArray(payload.requirements),
    niceToHave: asStringArray(payload.niceToHave),
    benefits: asStringArray(payload.benefits),
    tags: asStringArray(payload.tags),
    salaryMin: payload.salaryMin === '' || payload.salaryMin == null ? null : asNumber(payload.salaryMin),
    salaryMax: payload.salaryMax === '' || payload.salaryMax == null ? null : asNumber(payload.salaryMax),
    salaryCurrency: asText(payload.salaryCurrency) || 'NAD',
    salaryPeriod: asText(payload.salaryPeriod) || 'monthly',
    salaryNegotiable: asBoolean(payload.salaryNegotiable),
    hiringManagerId: asText(payload.hiringManagerId) || context.getCurrentUserId() || null,
    hiringManagerName: asText(payload.hiringManagerName),
    contactEmail: asText(payload.contactEmail),
    applicationUrl: asText(payload.applicationUrl),
    applicationInstructions: asText(payload.applicationInstructions),
    postedAt: payload.postedAt || (isPublished ? context.getNow() : null),
    closingDate: payload.closingDate || null,
    metadata: {
      version: 1,
      source: 'recruitment',
      app: 'totisoft-hr',
      ...(payload.metadata || {}),
    },
    ...context.buildCreatedAudit(),
  }
}

export function createVacancyService({
  store = useAppStore(),
  access = null,
  now = () => new Date(),
  notificationService = null,
} = {}) {
  const context = createServiceContext({ store, access, now, domain: 'recruitment' })

  const vacancies = createCollectionAdapter({ context, collectionName: 'vacancies', stateKey: 'vacancies', defaultListParams: DEFAULT_LIST_OPTIONS })
  const vacancyActivities = createCollectionAdapter({ context, collectionName: 'vacancyActivities', stateKey: 'vacancyActivities' })

  const logActivityRecord = createActivityLogger({
    context,
    collectionName: 'vacancyActivities',
    idPrefix: 'activity',
    buildRecord(payload, runtime) {
      return {
        vacancyId: payload.vacancyId,
        userId: runtime.currentUser?.uid || context.getCurrentUserId() || null,
        type: asText(payload.type) || 'note',
        action: asText(payload.action) || 'updated',
        description: asText(payload.description),
        metadata: payload.metadata || {},
        outcome: asText(payload.outcome) || 'completed',
        priority: asText(payload.priority) || 'medium',
      }
    },
  })

  async function safeListUsersByRoles(roles = []) {
    const users = Array.isArray(store?.users?.items) ? store.users.items : []
    return users
      .map(normalizeRecord)
      .filter((user) => roles.some((role) => user?.role === role || (Array.isArray(user?.roles) && user.roles.includes(role))))
  }

  async function notifyRoles(roles = [], buildPayload) {
    if (!notificationService?.send) return []

    const recipients = await safeListUsersByRoles(roles)
    const unique = new Map()
    for (const user of recipients) {
      const recipientId = user?.id || user?.uid || null
      if (recipientId) unique.set(recipientId, user)
    }

    const created = []
    for (const user of unique.values()) {
      const payload = buildPayload(user)
      if (!payload) continue
      const result = await notificationService.send({ recipientId: user.id || user.uid, ...payload })
      if (result) created.push(result)
    }
    return created
  }

  async function logActivity(vacancyId, payload = {}) {
    try {
      context.assertPermission('recruitment.vacancies.activities.create')
      context.requireAuthenticated()
      if (!vacancyId) throw context.createError('A vacancy id is required.', { code: 'VACANCY_ID_REQUIRED' })
      return await logActivityRecord({ ...payload, vacancyId })
    } catch (error) {
      throw normalizeVacancyError(error, 'Failed to log the vacancy activity.', context)
    }
  }

  async function getVacancy(vacancyId) {
    const vacancy = normalizeRecord(await vacancies.getById(vacancyId))
    if (!vacancy) return null

    await vacancyActivities.list({ pageSize: 25, sortBy: 'createdAt', sortDirection: 'desc', filters: { vacancyId } })
    const activities = vacancyActivities.readState().items.map(normalizeRecord).filter((entry) => entry?.vacancyId === vacancyId)

    return { ...vacancy, activities }
  }

  async function createVacancy(payload = {}) {
    try {
      context.assertPermission('recruitment.vacancies.create')
      context.requireAuthenticated()

      if (!asText(payload.title)) {
        throw context.createError('A job title is required.', { code: 'VACANCY_TITLE_REQUIRED' })
      }

      const vacancy = buildVacancyRecord(payload, context)

      return await withActivityLog(
        async () => {
          const created = await vacancies.create(vacancy)
          const createdId = getRecordId(created)
          return getVacancy(createdId)
        },
        {
          log: async (result) => {
            await logActivity(result?.id, {
              type: 'note',
              action: result?.isPublished ? 'vacancy_published' : 'vacancy_created',
              description: `Vacancy "${result?.title || ''}" ${result?.isPublished ? 'published' : 'saved as draft'}.`,
              priority: 'medium',
            })

            await notifyRoles(['admin', 'hr_manager'], () => ({
              title: result?.isPublished ? 'Vacancy published' : 'New vacancy drafted',
              message: `${result?.title || 'A vacancy'} (${result?.department || 'General'}) ${result?.isPublished ? 'is now live on the careers page' : 'was saved as a draft'}.`,
              event: 'vacancy.created',
              type: 'recruitment',
              priority: 'normal',
              actionUrl: result?.id ? `/vacancies/${result.id}` : '/vacancies',
              entityType: 'vacancy',
              entityId: result?.id || null,
              actorId: context.getCurrentUserId() || null,
              actorName: context.getCurrentUser()?.displayName || 'System',
              meta: { vacancyNumber: result?.vacancyNumber || null },
            }))
          },
        },
      )
    } catch (error) {
      throw normalizeVacancyError(error, 'Failed to create the vacancy.', context)
    }
  }

  async function publishVacancy(vacancyId) {
    try {
      context.assertPermission('recruitment.vacancies.update')
      context.requireAuthenticated()
      if (!vacancyId) throw context.createError('A vacancy id is required.', { code: 'VACANCY_ID_REQUIRED' })

      await vacancies.update(vacancyId, {
        status: 'open',
        isPublished: true,
        postedAt: context.getNow(),
      })

      await logActivity(vacancyId, {
        type: 'note',
        action: 'vacancy_published',
        description: 'Vacancy published to the careers page.',
        priority: 'medium',
      })

      return getVacancy(vacancyId)
    } catch (error) {
      throw normalizeVacancyError(error, 'Failed to publish the vacancy.', context)
    }
  }

  return {
    createVacancy,
    getVacancy,
    publishVacancy,
    logActivity,
    generateVacancyNumber: () => createMonthlyNumber('VAC', { now: context.now }),
  }
}

export default createVacancyService

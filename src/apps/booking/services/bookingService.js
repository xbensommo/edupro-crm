/**
 * @file booking/services/bookingService.js
 * @description Booking service adapter refactored to use the shared Totistack service core.
 */

import { useAppStore } from '@app/stores/appStore'
import {
  createCollectionAdapter,
  createServiceContext,
  createServiceError,
  createMonthlyNumber,
  normalizeCollectionItems,
  normalizeDate,
  asNumber,
  asText,
  asStringArray,
} from '@core_services/index.js'

/**
 * Stable booking-domain error.
 */
export class BookingError extends Error {
  /**
   * @param {string} message
   * @param {string} [code='BOOKING_ERROR']
   * @param {unknown} [cause=null]
   * @param {Record<string, any>|null} [meta=null]
   */
  constructor(message, code = 'BOOKING_ERROR', cause = null, meta = null) {
    super(message)
    this.name = 'BookingError'
    this.code = code
    this.cause = cause
    this.meta = meta
  }
}

/**
 * @param {unknown} error
 * @param {string} fallbackMessage
 * @param {object} [options={}]
 * @returns {BookingError}
 */
function normalizeBookingError(error, fallbackMessage, options = {}) {
  if (error instanceof BookingError) return error

  return new BookingError(
    error?.message || fallbackMessage || 'Booking request failed.',
    error?.code || options.code || 'BOOKING_ERROR',
    error,
    options.meta || null,
  )
}

/**
 * Resolve the booking action set from the existing root store shapes.
 *
 * Supports:
 * - bookingsActions
 * - bookingActions
 * - collectionsActions.bookings
 * - getCollectionActions('bookings')
 * - getCollectionActions('booking')
 *
 * @param {Record<string, any>} store
 * @param {string} [collectionName='bookings']
 * @returns {Record<string, Function>|null}
 */
function resolveBookingActions(store, collectionName = 'bookings') {
  if (!store) return null

  return (
    store.getCollectionActions?.(collectionName) ||
    store.getCollectionActions?.('booking') ||
    store?.[`${collectionName}Actions`] ||
    store?.bookingActions ||
    store?.collectionsActions?.[collectionName] ||
    store?.collectionsActions?.booking ||
    null
  )
}

/**
 * @param {unknown} value
 * @returns {Date}
 */
function requireBookingDate(value) {
  const parsed = normalizeDate(value)
  if (!parsed) {
    throw new BookingError('Invalid booking date supplied.', 'INVALID_DATE')
  }
  return parsed
}

/**
 * @param {Date} startTime
 * @param {Date} endTime
 * @returns {number}
 */
function validateSchedule(startTime, endTime) {
  if (!(startTime instanceof Date) || !(endTime instanceof Date)) {
    throw new BookingError('Booking start and end time are required.', 'INVALID_DATE')
  }

  if (endTime <= startTime) {
    throw new BookingError('End time must be after start time.', 'INVALID_TIME_RANGE')
  }

  const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000)

  if (durationMinutes < 15) {
    throw new BookingError('Booking duration must be at least 15 minutes.', 'BOOKING_TOO_SHORT')
  }

  if (durationMinutes > 8 * 60) {
    throw new BookingError('Booking duration cannot exceed 8 hours.', 'BOOKING_TOO_LONG')
  }

  return durationMinutes
}

/**
 * @param {unknown} value
 * @returns {string[]}
 */
function normalizeReminderChannels(value) {
  if (Array.isArray(value)) {
    return asStringArray(value.map((item) => String(item || '').toLowerCase()))
  }

  if (value && typeof value === 'object') {
    return Object.entries(value)
      .filter(([, enabled]) => Boolean(enabled))
      .map(([channel]) => String(channel).trim().toLowerCase())
      .filter(Boolean)
  }

  return []
}

/**
 * @param {Date} startTime
 * @param {string[]} [channels=['email']]
 * @param {Date} [currentTime=new Date()]
 * @returns {Array<Record<string, any>>}
 */
function buildReminders(startTime, channels = ['email'], currentTime = new Date()) {
  const reminders = []
  const offsets = [
    { key: 'day_before', hours: 24 },
    { key: 'hour_before', hours: 1 },
  ]

  for (const channel of channels) {
    for (const offset of offsets) {
      const when = new Date(startTime)
      when.setHours(when.getHours() - offset.hours)

      if (when > currentTime) {
        reminders.push({
          channel,
          type: offset.key,
          time: when,
          sent: false,
          status: 'scheduled',
        })
      }
    }
  }

  return reminders
}

/**
 * @param {string[]} channels
 * @param {Array<Record<string, any>>} reminders
 * @returns {string}
 */
function buildReminderSummary(channels, reminders) {
  if (!channels.length || !reminders.length) {
    return 'No reminders scheduled.'
  }

  const count = reminders.length
  return `${count} reminder${count === 1 ? '' : 's'} scheduled via ${channels.join(', ')}.`
}

/**
 * @param {Record<string, any>|null|undefined} booking
 * @returns {Record<string, any>|null}
 */
function normalizeBooking(booking) {
  if (!booking) return null

  return {
    ...booking,
    id: booking.id || booking.bookingId || null,
  }
}

/**
 * @returns {string}
 */
function createAccessCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

/**
 * @param {object} [payload={}]
 * @param {object} runtime
 * @param {ReturnType<typeof createServiceContext>} runtime.context
 * @param {Date} runtime.now
 * @returns {Record<string, any>}
 */
function buildBookingRecord(payload = {}, { context, now }) {
  const startTime = requireBookingDate(payload.startTime)
  const endTime = requireBookingDate(payload.endTime)
  const durationMinutes = validateSchedule(startTime, endTime)
  const isAuthenticated = context.isAuthenticated()
  const userId = context.getCurrentUserId()
  const userEmail = context.getCurrentUserEmail()

  const customerName = asText(payload.customerName)
  if (!customerName) {
    throw new BookingError('Customer name is required.', 'CUSTOMER_NAME_REQUIRED')
  }

  const customerEmail = asText(payload.customerEmail || userEmail)
  const customerPhone = asText(payload.customerPhone)

  if (!isAuthenticated && !customerEmail && !customerPhone) {
    throw new BookingError(
      'Guest bookings require at least an email or phone number.',
      'GUEST_CONTACT_REQUIRED',
    )
  }

  const reminderChannels = normalizeReminderChannels(payload.reminderChannels || ['email'])
  const reminders = buildReminders(startTime, reminderChannels, now)
  const attendees = Array.isArray(payload.attendees)
    ? payload.attendees
    : asNumber(payload.attendeeCount) > 1
      ? Array.from({ length: asNumber(payload.attendeeCount, 1) }, (_, index) => ({
          label: `Guest ${index + 1}`,
        }))
      : []

  return {
    bookingNumber:
      asText(payload.bookingNumber) || createMonthlyNumber('BKG', { now: context.now }),
    clientId: asText(payload.clientId) || userId || 'guest',
    customerType: isAuthenticated ? 'authenticated' : 'guest',
    ownerUserId: asText(payload.ownerUserId) || userId || '',
    ownerEmail: asText(payload.ownerEmail) || userEmail || customerEmail || '',
    accessCode: asText(payload.accessCode) || createAccessCode(),
    bookingChannel: asText(payload.bookingChannel) || (isAuthenticated ? 'authenticated' : 'public'),
    bookingSource: asText(payload.bookingSource) || 'booking_form',
    customerName,
    customerEmail,
    customerPhone,
    serviceId: asText(payload.serviceId),
    serviceName: asText(payload.serviceName || payload.title),
    locationId: asText(payload.locationId),
    locationName: asText(payload.locationName),
    resourceId: asText(payload.resourceId),
    resourceType: asText(payload.resourceType),
    assignedTo: asText(payload.assignedTo),
    assignedToName: asText(payload.assignedToName),
    title: asText(payload.title || payload.serviceName) || 'New Booking',
    description: asText(payload.description),
    notes: asText(payload.notes),
    specialRequests: asText(payload.specialRequests),
    timezone:
      asText(payload.timezone) ||
      Intl.DateTimeFormat().resolvedOptions().timeZone ||
      'UTC',
    startTime,
    endTime,
    durationMinutes,
    attendeeCount: asNumber(payload.attendeeCount, attendees.length || 1),
    status: asText(payload.status) || 'pending',
    amount: asNumber(payload.amount),
    currency: asText(payload.currency) || 'USD',
    paymentStatus: asText(payload.paymentStatus) || 'pending',
    attendees,
    reminderChannels,
    reminders,
    reminderStatus: reminders.length ? 'scheduled' : 'disabled',
    reminderSummary: buildReminderSummary(reminderChannels, reminders),
    reminderLastScheduledAt: reminders.length ? now : null,
    reminderLastSentAt: null,
    createdBy: userId || 'public',
    ...context.buildCreatedAudit(),
  }
}

/**
 * Create the booking service bound to the Totistack root store.
 *
 * @param {object} [options={}]
 * @param {ReturnType<typeof useAppStore>} [options.store]
 * @param {string} [options.collectionName='bookings']
 * @param {string} [options.stateKey='bookings']
 * @returns {object}
 */
export function createBookingServices({
  store = useAppStore(),
  collectionName = 'bookings',
  stateKey = 'bookings',
} = {}) {
  const context = createServiceContext({
    store,
    domain: 'booking',
  })

  const bookingContext = {
    ...context,
    getCollectionActions(name) {
      const actions = resolveBookingActions(store, name)
      if (!actions || typeof actions !== 'object') {
        throw createServiceError('Booking actions are not available on the root store.', {
          code: 'BOOKING_ACTIONS_UNAVAILABLE',
          domain: 'booking',
          meta: { collectionName: name },
        })
      }
      return actions
    },
  }

  const bookings = createCollectionAdapter({
    context: bookingContext,
    collectionName,
    stateKey,
  })

  /**
   * @param {Record<string, any>} [params={}]
   * @returns {Promise<any[]>}
   */
  async function list(params = {}) {
    try {
      const items = await bookings.list(params)
      return items.map(normalizeBooking)
    } catch (error) {
      throw normalizeBookingError(error, 'Failed to list bookings.', {
        code: error?.code || 'LIST_FAILED',
      })
    }
  }

  /**
   * @param {string} bookingId
   * @returns {Promise<Record<string, any>|null>}
   */
  async function getById(bookingId) {
    try {
      return normalizeBooking(await bookings.getById(bookingId))
    } catch (error) {
      throw normalizeBookingError(error, 'Failed to load the booking.', {
        code: error?.code || 'GET_BY_ID_FAILED',
      })
    }
  }

  /**
   * @param {string} reference
   * @param {string} contact
   * @returns {Promise<Record<string, any>|null>}
   */
  async function getByReference(reference, contact) {
    const normalizedReference = asText(reference).toLowerCase()
    const normalizedContact = asText(contact).toLowerCase()

    if (!normalizedReference || !normalizedContact) {
      throw new BookingError(
        'Booking reference and customer contact are required.',
        'PUBLIC_LOOKUP_INVALID',
      )
    }

    try {
      const actions = bookingContext.getCollectionActions(collectionName)
      const items = typeof actions.search === 'function'
        ? await bookings.search(normalizedReference, { limit: 25 })
        : await list({ orderBy: 'createdAt', orderDirection: 'desc', limit: 100 })

      const match = normalizeCollectionItems(items).find((item) => {
        const referenceMatch = [item?.bookingNumber, item?.accessCode]
          .filter(Boolean)
          .map((value) => String(value).toLowerCase())
          .includes(normalizedReference)

        const contactMatch = [item?.customerEmail, item?.customerPhone]
          .filter(Boolean)
          .map((value) => String(value).toLowerCase())
          .includes(normalizedContact)

        return referenceMatch && contactMatch
      })

      return normalizeBooking(match || null)
    } catch (error) {
      throw normalizeBookingError(error, 'Failed to look up the booking reference.', {
        code: error?.code || 'PUBLIC_LOOKUP_FAILED',
      })
    }
  }

  /**
   * @param {Record<string, any>} payload
   * @returns {Promise<Record<string, any>|null>}
   */
  async function create(payload) {
    try {
      const now = context.getNow()
      const record = buildBookingRecord(payload, { context, now })
      const created = await bookings.create(record, {
        id: payload?.id,
        generateId: () => `booking_${Date.now()}`,
      })
      return normalizeBooking(created)
    } catch (error) {
      throw normalizeBookingError(error, 'Failed to create the booking.', {
        code: error?.code || 'CREATE_FAILED',
      })
    }
  }

  /**
   * @param {string} bookingId
   * @param {Record<string, any>} updates
   * @returns {Promise<Record<string, any>|null>}
   */
  async function update(bookingId, updates = {}) {
    try {
      const patch = { ...updates }

      if (patch.startTime || patch.endTime) {
        const current = await getById(bookingId)
        const startTime = requireBookingDate(patch.startTime || current?.startTime)
        const endTime = requireBookingDate(patch.endTime || current?.endTime)
        patch.durationMinutes = validateSchedule(startTime, endTime)
        patch.startTime = startTime
        patch.endTime = endTime
      }

      await bookings.update(bookingId, {
        ...patch,
        ...context.buildUpdatedAudit(),
      })

      return getById(bookingId)
    } catch (error) {
      throw normalizeBookingError(error, 'Failed to update the booking.', {
        code: error?.code || 'UPDATE_FAILED',
      })
    }
  }

  /**
   * @param {string} bookingId
   * @param {Record<string, any>} payload
   * @returns {Promise<Record<string, any>|null>}
   */
  async function reschedule(bookingId, payload = {}) {
    const startTime = requireBookingDate(payload.startTime)
    const endTime = requireBookingDate(payload.endTime)
    validateSchedule(startTime, endTime)

    const reminderChannels = normalizeReminderChannels(payload.reminderChannels || ['email'])
    const reminders = buildReminders(startTime, reminderChannels, context.getNow())

    return update(bookingId, {
      startTime,
      endTime,
      status: 'rescheduled',
      reminderChannels,
      reminders,
      reminderStatus: reminders.length ? 'scheduled' : 'disabled',
      reminderSummary: buildReminderSummary(reminderChannels, reminders),
      reminderLastScheduledAt: reminders.length ? context.getNow() : null,
    })
  }

  /**
   * @param {string} bookingId
   * @param {string[]|Record<string, boolean>} channels
   * @returns {Promise<Record<string, any>|null>}
   */
  async function updateReminderPreferences(bookingId, channels) {
    const booking = await getById(bookingId)
    const reminderChannels = normalizeReminderChannels(channels)
    const reminders = buildReminders(requireBookingDate(booking?.startTime), reminderChannels, context.getNow())

    return update(bookingId, {
      reminderChannels,
      reminders,
      reminderStatus: reminders.length ? 'scheduled' : 'disabled',
      reminderSummary: buildReminderSummary(reminderChannels, reminders),
      reminderLastScheduledAt: reminders.length ? context.getNow() : null,
    })
  }

  /**
   * @param {string} bookingId
   * @param {string} [channel='email']
   * @returns {Promise<Record<string, any>|null>}
   */
  async function queueReminder(bookingId, channel = 'email') {
    const booking = await getById(bookingId)
    const reminders = Array.isArray(booking?.reminders) ? [...booking.reminders] : []

    reminders.push({
      channel,
      type: 'manual',
      time: context.getNow(),
      sent: false,
      status: 'queued',
    })

    return update(bookingId, {
      reminders,
      reminderStatus: 'queued',
      reminderSummary: buildReminderSummary(
        normalizeReminderChannels(booking?.reminderChannels || [channel]),
        reminders,
      ),
      reminderLastScheduledAt: context.getNow(),
    })
  }

  /**
   * @param {string} bookingId
   * @param {string} [reason='']
   * @returns {Promise<Record<string, any>|null>}
   */
  async function cancel(bookingId, reason = '') {
    return update(bookingId, {
      status: 'cancelled',
      cancelledAt: context.getNow(),
      cancelledBy: context.getCurrentUserId() || 'public',
      cancellationReason: asText(reason),
    })
  }

  /**
   * @param {string} bookingId
   * @returns {Promise<Record<string, any>|null>}
   */
  async function confirm(bookingId) {
    return update(bookingId, {
      status: 'confirmed',
      confirmedAt: context.getNow(),
      confirmedBy: context.getCurrentUserId() || 'system',
    })
  }

  /**
   * @param {string} bookingId
   * @returns {Promise<Record<string, any>|null>}
   */
  async function checkIn(bookingId) {
    return update(bookingId, {
      status: 'checked_in',
      checkedInAt: context.getNow(),
    })
  }

  /**
   * @param {string} bookingId
   * @param {Record<string, any>} [payload={}]
   * @returns {Promise<Record<string, any>|null>}
   */
  async function complete(bookingId, payload = {}) {
    return update(bookingId, {
      status: 'completed',
      checkedOutAt: context.getNow(),
      rating: payload.rating,
      feedback: payload.feedback,
      reminderStatus: 'completed',
    })
  }

  return {
    list,
    getById,
    getByReference,
    create,
    update,
    reschedule,
    updateReminderPreferences,
    queueReminder,
    cancel,
    confirm,
    checkIn,
    complete,
  }
}

export default createBookingServices

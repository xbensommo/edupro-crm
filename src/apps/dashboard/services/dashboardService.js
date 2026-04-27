/**
 * @file apps/dashboard/services/dashboardService.js
 * @description EduProLIC dashboard service with strict role-scoped widgets and metrics.
 */

import { computed } from 'vue'
import { useAppStore } from '@app/stores/appStore/index.js'

export const DASHBOARD_WIDGETS = Object.freeze([
  'metrics',
  'recent-activity',
  'charts',
  'notifications',
  'quick-actions',
  'system-status',
])

function normalizeDate(value) {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value?.toDate === 'function') return value.toDate()
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function getRecordId(record) {
  return record?.id || record?.docId || record?._id || ''
}

function getCollectionItems(store, name) {
  const direct = store?.[name]?.items
  if (Array.isArray(direct)) return direct

  const actionsState = store?.[`${name}Actions`]?.state?.items
  if (Array.isArray(actionsState)) return actionsState

  const collectionState = store?.collections?.[name]?.items
  if (Array.isArray(collectionState)) return collectionState

  const directValue = store?.[name]?.value?.items
  if (Array.isArray(directValue)) return directValue

  return []
}

function recordData(record) {
  if (!record || typeof record !== 'object') return {}
  return record.data && typeof record.data === 'object' ? record.data : record
}

function asNumber(value) {
  const numeric = Number(value || 0)
  return Number.isFinite(numeric) ? numeric : 0
}

function toCurrency(value) {
  return new Intl.NumberFormat('en-NA', {
    style: 'currency',
    currency: 'NAD',
    maximumFractionDigits: 0,
  }).format(asNumber(value))
}

function sumBy(items, mapper) {
  return items.reduce((total, item) => total + asNumber(mapper(item)), 0)
}

function formatRole(value = '') {
  return String(value)
    .replace(/_/g, ' ')
    .replace(/\w/g, (char) => char.toUpperCase())
}

function buildDailySeries(items = [], periodDays = 30, dateGetter) {
  const labels = []
  const values = []
  const now = new Date()
  const buckets = new Map()

  for (let index = periodDays - 1; index >= 0; index -= 1) {
    const date = new Date(now)
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - index)
    const key = date.toISOString().slice(0, 10)
    labels.push(key)
    buckets.set(key, 0)
  }

  items.forEach((item) => {
    const date = normalizeDate(dateGetter(item))
    if (!date) return
    const key = new Date(date).toISOString().slice(0, 10)
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) || 0) + 1)
    }
  })

  labels.forEach((label) => values.push(buckets.get(label) || 0))
  return { labels, values }
}

export function createDashboardService(store = useAppStore()) {
  const currentUser = computed(() => store.currentUser?.value || store.currentUser || null)

  function hasRole(role) {
    return typeof store.hasRole === 'function' ? store.hasRole(role) : currentUser.value?.role === role
  }

  function hasPermission(permission) {
    return typeof store.hasPermission === 'function' ? store.hasPermission(permission) : true
  }

  function assertPermission(permission) {
    if (!hasPermission(permission)) {
      const error = new Error(`Missing permission: ${permission}`)
      error.code = 'dashboard/forbidden'
      throw error
    }
  }

  function getRoleContext() {
    if (hasRole('sysadmin')) return 'sysadmin'
    if (hasRole('admin')) return 'admin'
    if (hasRole('receptionist')) return 'receptionist'
    if (hasRole('consultant_editor')) return 'consultant_editor'
    return 'consultant'
  }

  function getDataSets() {
    const engagements = getCollectionItems(store, 'engagements').map((item) => ({ id: getRecordId(item), ...recordData(item) }))
    const clients = getCollectionItems(store, 'clients').map((item) => ({ id: getRecordId(item), ...recordData(item) }))
    const notifications = getCollectionItems(store, 'notifications').map((item) => ({ id: getRecordId(item), ...recordData(item) }))
    const financeTransactions = getCollectionItems(store, 'finance_transactions').map((item) => ({ id: getRecordId(item), ...recordData(item) }))
    const consultantPayouts = getCollectionItems(store, 'consultant_payouts').map((item) => ({ id: getRecordId(item), ...recordData(item) }))
    const users = getCollectionItems(store, 'users').map((item) => ({ id: getRecordId(item), ...recordData(item) }))
    const currentUserId = currentUser.value?.uid || currentUser.value?.id || null

    return {
      currentUserId,
      engagements,
      clients,
      notifications,
      financeTransactions,
      consultantPayouts,
      users,
    }
  }

  function scopeEngagementsByRole(allItems, role) {
    const currentUserId = currentUser.value?.uid || currentUser.value?.id || null
    if (!currentUserId) return []
    if (role === 'consultant') {
      return allItems.filter((item) => item.assignedConsultantId === currentUserId || item.assignmentRespondedBy === currentUserId)
    }
    if (role === 'consultant_editor') {
      return allItems.filter((item) => item.assignedEditorId === currentUserId || item.reviewedBy === currentUserId)
    }
    return allItems
  }

  function buildMetricCards(role, data) {
    const scopedEngagements = scopeEngagementsByRole(data.engagements, role)
    const openEngagements = scopedEngagements.filter((item) => !['completed', 'cancelled'].includes(String(item.status || '').toLowerCase()))
    const dueSoon = scopedEngagements.filter((item) => {
      const due = normalizeDate(item.dueDate)
      if (!due) return false
      const diff = due.getTime() - Date.now()
      return diff >= 0 && diff <= 1000 * 60 * 60 * 24 * 3
    })

    if (role === 'consultant') {
      const accepted = scopedEngagements.filter((item) => String(item.assignmentStatus || '').toLowerCase() === 'accepted')
      const pending = scopedEngagements.filter((item) => String(item.assignmentStatus || 'pending').toLowerCase() === 'pending')
      const submitted = scopedEngagements.filter((item) => String(item.deliveryStatus || '').toLowerCase() === 'submitted')
      const reward = sumBy(scopedEngagements, (item) => item.consultantShareAmountCached || item.consultantShareCached)
      return [
        { id: 'consultant-open', label: 'My Active Work', value: openEngagements.length.toLocaleString(), description: 'Assignments currently on your desk.' },
        { id: 'consultant-pending', label: 'Awaiting Response', value: pending.length.toLocaleString(), description: 'Assignments waiting for accept or deny.' },
        { id: 'consultant-submitted', label: 'Submitted', value: submitted.length.toLocaleString(), description: 'Final deliveries already submitted.' },
        { id: 'consultant-reward', label: 'Potential Commission', value: toCurrency(reward), description: 'Cached commission across your scoped work.' },
      ]
    }

    if (role === 'consultant_editor') {
      const awaitingReview = scopedEngagements.filter((item) => ['submitted', 'review_pending'].includes(String(item.reviewStatus || item.deliveryStatus || '').toLowerCase()))
      const revisions = scopedEngagements.filter((item) => String(item.reviewStatus || '').toLowerCase() === 'revision_requested')
      const approved = scopedEngagements.filter((item) => String(item.reviewStatus || '').toLowerCase() === 'approved')
      return [
        { id: 'editor-queue', label: 'Review Queue', value: awaitingReview.length.toLocaleString(), description: 'Submitted work waiting for editorial review.' },
        { id: 'editor-revisions', label: 'Revisions Requested', value: revisions.length.toLocaleString(), description: 'Items sent back to consultants.' },
        { id: 'editor-approved', label: 'Approved', value: approved.length.toLocaleString(), description: 'Reviewed work cleared for client delivery.' },
        { id: 'editor-due', label: 'Due Soon', value: dueSoon.length.toLocaleString(), description: 'Work approaching deadline in your scope.' },
      ]
    }

    if (role === 'sysadmin') {
      return [
        { id: 'sys-users', label: 'Active Users', value: data.users.length.toLocaleString(), description: 'Users loaded into the root registry.' },
        { id: 'sys-notifications', label: 'Notifications', value: data.notifications.length.toLocaleString(), description: 'Current in-app notification records.' },
        { id: 'sys-work', label: 'Total Work Records', value: data.engagements.length.toLocaleString(), description: 'Operational records available to the app.' },
        { id: 'sys-clients', label: 'Client Records', value: data.clients.length.toLocaleString(), description: 'Loaded client profiles.' },
      ]
    }

    const cashReceived = sumBy(data.financeTransactions.filter((item) => ['payment_received', 'client_payment'].includes(String(item.type || item.transactionType || '').toLowerCase())), (item) => item.amount || item.totalAmount)
    const outstanding = sumBy(data.engagements, (item) => item.amountDueCached)
    const unpaidCommission = sumBy(data.engagements, (item) => item.consultantShareAmountCached || item.consultantShareCached) - sumBy(data.consultantPayouts, (item) => item.amountPaid || item.totalPaid)

    return [
      { id: 'mgmt-clients', label: 'Clients', value: data.clients.length.toLocaleString(), description: 'Client records managed in the system.' },
      { id: 'mgmt-open-work', label: 'Open Work', value: openEngagements.length.toLocaleString(), description: 'Active assignments not yet completed.' },
      { id: 'mgmt-cash', label: 'Cash Received', value: toCurrency(cashReceived), description: 'Payments captured from finance transactions.' },
      { id: 'mgmt-commission', label: 'Unpaid Commission', value: toCurrency(unpaidCommission), description: 'Estimated consultant commission still unpaid.' },
      { id: 'mgmt-outstanding', label: 'Outstanding Due', value: toCurrency(outstanding), description: 'Open client balances from linked work.' },
      { id: 'mgmt-due-soon', label: 'Due Soon', value: dueSoon.length.toLocaleString(), description: 'Assignments due within the next 3 days.' },
    ]
  }

  function buildRecentActivity(role, data, limit = 8) {
    const scopedEngagements = scopeEngagementsByRole(data.engagements, role)
    const workEvents = scopedEngagements.map((item) => ({
      id: `engagement-${item.id}`,
      title: item.title || item.engagementCode || 'Work item',
      description: `${formatRole(item.assignmentStatus || item.status || 'active')} · ${item.clientName || 'Client not set'}`,
      type: item.serviceType || 'work',
      timestamp: normalizeDate(item.updatedAt || item.finalSubmittedAt || item.createdAt || item.dueDate),
    }))

    const notificationEvents = data.notifications
      .filter((item) => {
        if (role === 'consultant') return (item.user_id  || item.recipientId) === data.currentUserId
        if (role === 'consultant_editor') return (item.user_id  || item.recipientId) === data.currentUserId || String(item.roleScope || '').includes('consultant_editor')
        return true
      })
      .map((item) => ({
        id: `notification-${item.id}`,
        title: item.title || item.subject || 'Notification',
        description: item.message || item.description || 'Operational update.',
        type: item.domain || 'notification',
        timestamp: normalizeDate(item.createdAt || item.timestamp || item.updatedAt),
      }))

    return [...workEvents, ...notificationEvents]
      .sort((a, b) => (b.timestamp?.getTime?.() || 0) - (a.timestamp?.getTime?.() || 0))
      .slice(0, limit)
  }

  function buildChartData(role, data) {
    const scopedEngagements = scopeEngagementsByRole(data.engagements, role)
    const scopedNotifications = role === 'consultant' || role === 'consultant_editor'
      ? data.notifications.filter((item) => (item.user_id  || item.recipientId) === data.currentUserId)
      : data.notifications

    const engagementDate = (item) => item.createdAt || item.updatedAt || item.dueDate
    const submissionDate = (item) => item.finalSubmittedAt || item.updatedAt || item.createdAt
    const notificationDate = (item) => item.createdAt || item.updatedAt

    return {
      assignments: buildDailySeries(scopedEngagements, 30, engagementDate),
      submissions: buildDailySeries(scopedEngagements.filter((item) => item.finalSubmittedAt || String(item.deliveryStatus || '').toLowerCase() === 'submitted'), 30, submissionDate),
      notifications: buildDailySeries(scopedNotifications, 30, notificationDate),
    }
  }

  function buildNotifications(role, data, limit = 6) {
    const items = data.notifications
      .filter((item) => {
        const recipientId = item.user_id  || item.recipientId || null
        const roleScope = Array.isArray(item.roleScope) ? item.roleScope : [item.roleScope].filter(Boolean)
        if (role === 'consultant' || role === 'consultant_editor') {
          return recipientId === data.currentUserId || roleScope.includes(role)
        }
        if (role === 'sysadmin') return true
        return recipientId == null || roleScope.length === 0 || roleScope.includes(role) || roleScope.includes('admin') || roleScope.includes('receptionist')
      })
      .sort((a, b) => (normalizeDate(b.createdAt || b.updatedAt)?.getTime() || 0) - (normalizeDate(a.createdAt || a.updatedAt)?.getTime() || 0))
      .slice(0, limit)
      .map((item) => ({
        id: item.id,
        title: item.title || item.subject || 'Notification',
        description: item.message || item.description || 'Operational update.',
        level: item.level || item.priority || 'info',
      }))

    return items
  }

  function buildQuickActions(role) {
    if (role === 'consultant') {
      return [
        { id: 'my-work', label: 'My Work', to: '/crm/work', description: 'View assignments and respond to ownership requests.' },
        { id: 'dashboard-analytics', label: 'My Analytics', to: '/dashboard/analytics', description: 'Track your work flow and submission volume.' },
      ]
    }

    if (role === 'consultant_editor') {
      return [
        { id: 'review-queue', label: 'Review Queue', to: '/crm/work', description: 'Open work that needs editorial review.' },
        { id: 'dashboard-reports', label: 'Review Reports', to: '/dashboard/reports', description: 'See editorial throughput and revision pressure.' },
      ]
    }

    if (role === 'sysadmin') {
      return [
        { id: 'dashboard-home', label: 'Operations Dashboard', to: '/dashboard', description: 'Open the full role-scoped dashboard.' },
        { id: 'dashboard-analytics', label: 'Analytics', to: '/dashboard/analytics', description: 'Inspect app-level metrics and trends.' },
        { id: 'dashboard-reports', label: 'Reports', to: '/dashboard/reports', description: 'Review management and system summaries.' },
      ]
    }

    return [
      { id: 'clients', label: 'Client Records', to: '/clients', description: 'Manage client profiles and intake context.' },
      { id: 'add-work', label: 'Add Work', to: '/crm/add-work', description: 'Create a new work item and assign it correctly.' },
      { id: 'finance', label: 'Finance', to: '/finance', description: 'Open payments, balances, and commission visibility.' },
      { id: 'dashboard-reports', label: 'Reports', to: '/dashboard/reports', description: 'Open management summaries and reporting.' },
    ]
  }

  function buildSystemStatus(role, data) {
    const base = [
      {
        id: 'auth',
        label: 'Authentication',
        status: store.authInitialized?.value === false ? 'starting' : 'healthy',
        detail: currentUser.value ? 'Authenticated session ready.' : 'Waiting for user session.',
      },
      {
        id: 'rbac',
        label: 'Access Control',
        status: typeof store.hasRole === 'function' ? 'healthy' : 'warning',
        detail: typeof store.hasRole === 'function' ? 'Role checks are available.' : 'Role helper not detected on root store.',
      },
      {
        id: 'data',
        label: 'Operational Data',
        status: data.engagements.length || data.clients.length ? 'healthy' : 'warning',
        detail: data.engagements.length || data.clients.length ? 'Dashboard is reading live module collections.' : 'No operational records are loaded yet.',
      },
    ]

    if (role === 'sysadmin') {
      base.push({
        id: 'network',
        label: 'Browser Network',
        status: typeof navigator !== 'undefined' && navigator.onLine === false ? 'warning' : 'healthy',
        detail: typeof navigator !== 'undefined' && navigator.onLine === false ? 'Browser reports offline mode.' : 'Browser reports online mode.',
      })
    }

    return base
  }

  async function getOverviewMetrics() {
    assertPermission('dashboard.overview.read')
    const role = getRoleContext()
    const data = getDataSets()
    return {
      raw: { role, engagements: data.engagements.length, clients: data.clients.length, notifications: data.notifications.length },
      cards: buildMetricCards(role, data),
    }
  }

  async function getRecentActivity(options = {}) {
    assertPermission('dashboard.overview.read')
    const role = getRoleContext()
    return buildRecentActivity(role, getDataSets(), Number(options.limit || 8))
  }

  async function getChartData() {
    assertPermission('dashboard.analytics.read')
    const role = getRoleContext()
    return buildChartData(role, getDataSets())
  }

  async function getNotifications(options = {}) {
    assertPermission('dashboard.overview.read')
    const role = getRoleContext()
    return buildNotifications(role, getDataSets(), Number(options.limit || 6))
  }

  async function getSystemStatus() {
    const role = getRoleContext()
    if (role === 'sysadmin') {
      assertPermission('dashboard.system.read')
    } else {
      assertPermission('dashboard.overview.read')
    }
    return buildSystemStatus(role, getDataSets())
  }

  async function getQuickActions() {
    assertPermission('dashboard.overview.read')
    return buildQuickActions(getRoleContext())
  }

  async function getDashboardSnapshot() {
    const [metrics, recentActivity, charts, notifications, systemStatus, quickActions] = await Promise.all([
      getOverviewMetrics(),
      getRecentActivity(),
      getChartData(),
      getNotifications(),
      getSystemStatus(),
      getQuickActions(),
    ])

    return {
      metrics,
      recentActivity,
      charts,
      notifications,
      systemStatus,
      quickActions,
      widgets: [...DASHBOARD_WIDGETS],
      generatedAt: new Date(),
      role: getRoleContext(),
    }
  }

  return {
    getOverviewMetrics,
    getRecentActivity,
    getChartData,
    getNotifications,
    getSystemStatus,
    getQuickActions,
    getDashboardSnapshot,
    currentUser,
    isLoading: computed(() => Boolean(store.isLoading?.value)),
    roleContext: computed(() => getRoleContext()),
  }
}

export function useDashboardService() {
  return createDashboardService()
}

export default {
  createDashboardService,
  useDashboardService,
}

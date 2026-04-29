<script setup>
import { storeToRefs } from 'pinia'
import { computed, onMounted, reactive } from 'vue'
import { formatDateTime, humanizeToken } from '../utils/notification.filters.js'
import { useNotificationsStore } from '../stores/useNotificationsStore.js'

const store = useNotificationsStore()
const { deliveryQueue, logs, loading, error, failedDeliveries, pendingDeliveries } = storeToRefs(store)

const filters = reactive({ status: '', channel: '', event: '' })

const filteredQueue = computed(() => filterRows(deliveryQueue.value))
const filteredLogs = computed(() => filterRows(logs.value))

function filterRows(rows) {
  return rows.filter((row) => {
    if (filters.status && row.status !== filters.status) return false
    if (filters.channel && row.channel !== filters.channel) return false
    if (filters.event && row.event !== filters.event) return false
    return true
  })
}

onMounted(() => {
  store.fetchDeliveryLogs().catch(() => null)
})

function refresh() {
  store.fetchDeliveryLogs({ ...filters }).catch(() => null)
}
</script>

<template>
  <section class="space-y-6">
    <header class="page-card rounded-[2rem] border p-6 sm:p-8">
      <p class="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-muted,#6b7280)]">
        Admin / sysadmin
      </p>
      <div class="mt-3 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 class="text-2xl font-semibold sm:text-3xl">Notification Delivery Logs</h1>
          <p class="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--color-muted,#6b7280)]">
            Inspect email queue state, Zoho delivery failures, dedupe keys, retry attempts, and provider outcomes.
          </p>
        </div>

        <div class="grid grid-cols-3 gap-3">
          <div class="stat-card rounded-2xl border p-4">
            <p class="text-xs uppercase tracking-[0.18em] text-[color:var(--color-muted,#6b7280)]">Queue</p>
            <p class="mt-2 text-xl font-semibold">{{ deliveryQueue.length }}</p>
          </div>
          <div class="stat-card rounded-2xl border p-4">
            <p class="text-xs uppercase tracking-[0.18em] text-[color:var(--color-muted,#6b7280)]">Pending</p>
            <p class="mt-2 text-xl font-semibold">{{ pendingDeliveries.length }}</p>
          </div>
          <div class="stat-card rounded-2xl border p-4">
            <p class="text-xs uppercase tracking-[0.18em] text-[color:var(--color-muted,#6b7280)]">Failed</p>
            <p class="mt-2 text-xl font-semibold">{{ failedDeliveries.length }}</p>
          </div>
        </div>
      </div>
    </header>

    <div v-if="!store.canReadAdminLogs" class="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      You do not have admin/sysadmin access to delivery logs.
    </div>

    <div v-if="error" class="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      {{ error }}
    </div>

    <section class="page-card grid gap-3 rounded-2xl border p-4 md:grid-cols-4">
      <select v-model="filters.status" class="input-base">
        <option value="">All statuses</option>
        <option value="pending">Pending</option>
        <option value="processing">Processing</option>
        <option value="sent">Sent</option>
        <option value="failed">Failed</option>
        <option value="skipped">Skipped</option>
      </select>
      <select v-model="filters.channel" class="input-base">
        <option value="">All channels</option>
        <option value="email">Email</option>
        <option value="push">Push / FCM</option>
        <option value="in_app">In-app</option>
      </select>
      <input v-model="filters.event" class="input-base" placeholder="Event name" type="search" />
      <button class="action-primary rounded-xl px-3 py-2 text-sm font-semibold" type="button" @click="refresh">
        Refresh logs
      </button>
    </section>

    <section class="page-card rounded-[2rem] border p-4 sm:p-6">
      <div class="flex items-center justify-between gap-4">
        <div>
          <h2 class="text-base font-semibold">Delivery Queue</h2>
          <p class="mt-1 text-sm text-[color:var(--color-muted,#6b7280)]">
            Server-side queue processed by Firebase Functions. Retry only failed/pending-safe records.
          </p>
        </div>
      </div>

      <div class="mt-5 overflow-x-auto">
        <table class="min-w-full text-left text-sm">
          <thead>
            <tr class="text-[color:var(--color-muted,#6b7280)]">
              <th class="px-4 py-3 font-medium">Status</th>
              <th class="px-4 py-3 font-medium">Recipient</th>
              <th class="px-4 py-3 font-medium">Event</th>
              <th class="px-4 py-3 font-medium">Attempts</th>
              <th class="px-4 py-3 font-medium">Error</th>
              <th class="px-4 py-3 font-medium">Created</th>
              <th class="px-4 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td class="px-4 py-4" colspan="7">Loading…</td>
            </tr>
            <tr v-else-if="!filteredQueue.length">
              <td class="px-4 py-4 text-[color:var(--color-muted,#6b7280)]" colspan="7">No delivery queue records found.</td>
            </tr>
            <tr v-for="item in filteredQueue" v-else :key="item.id" class="border-t">
              <td class="px-4 py-3"><span class="status-chip">{{ humanizeToken(item.status) }}</span></td>
              <td class="px-4 py-3">{{ item.recipientEmail || item.user_id || '—' }}</td>
              <td class="px-4 py-3">{{ item.event || '—' }}</td>
              <td class="px-4 py-3">{{ item.attempts || 0 }} / {{ item.maxAttempts || 3 }}</td>
              <td class="max-w-sm truncate px-4 py-3" :title="item.lastError">{{ item.lastError || '—' }}</td>
              <td class="px-4 py-3">{{ formatDateTime(item.createdAt) }}</td>
              <td class="px-4 py-3">
                <button
                  class="retry-btn rounded-full px-3 py-2 text-xs font-semibold"
                  :disabled="item.status !== 'failed'"
                  type="button"
                  @click="store.retryQueueItem(item)"
                >
                  Retry
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="page-card rounded-[2rem] border p-4 sm:p-6">
      <h2 class="text-base font-semibold">Provider Logs</h2>
      <div class="mt-5 overflow-x-auto">
        <table class="min-w-full text-left text-sm">
          <thead>
            <tr class="text-[color:var(--color-muted,#6b7280)]">
              <th class="px-4 py-3 font-medium">Status</th>
              <th class="px-4 py-3 font-medium">Channel</th>
              <th class="px-4 py-3 font-medium">Provider</th>
              <th class="px-4 py-3 font-medium">Recipient</th>
              <th class="px-4 py-3 font-medium">Event</th>
              <th class="px-4 py-3 font-medium">Created</th>
              <th class="px-4 py-3 font-medium">Error</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!filteredLogs.length">
              <td class="px-4 py-4 text-[color:var(--color-muted,#6b7280)]" colspan="7">No provider logs found.</td>
            </tr>
            <tr v-for="log in filteredLogs" v-else :key="log.id" class="border-t">
              <td class="px-4 py-3"><span class="status-chip">{{ humanizeToken(log.status) }}</span></td>
              <td class="px-4 py-3">{{ humanizeToken(log.channel) }}</td>
              <td class="px-4 py-3">{{ log.provider || '—' }}</td>
              <td class="px-4 py-3">{{ log.recipientEmail || log.user_id || '—' }}</td>
              <td class="px-4 py-3">{{ log.event || '—' }}</td>
              <td class="px-4 py-3">{{ formatDateTime(log.createdAt) }}</td>
              <td class="max-w-sm truncate px-4 py-3" :title="log.error">{{ log.error || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </section>
</template>

<style scoped>
.page-card,
.stat-card {
  background: var(--color-surface, #ffffff);
  border-color: var(--color-border, #e5e7eb);
}

.input-base {
  min-height: 2.75rem;
  width: 100%;
  border-radius: 0.9rem;
  border: 1px solid var(--color-border, #e5e7eb);
  background: var(--color-surface-muted, #f8fafc);
  padding: 0.7rem 0.85rem;
  color: var(--color-text, #111827);
}

.action-primary,
.retry-btn {
  color: #ffffff;
  background: var(--color-primary, #1860a8);
}

.retry-btn:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.status-chip {
  display: inline-flex;
  border-radius: 999px;
  padding: 0.25rem 0.65rem;
  color: #ffffff;
  background: var(--color-secondary, #4a90e2);
}

tr.border-t {
  border-color: var(--color-border, #e5e7eb);
}
</style>

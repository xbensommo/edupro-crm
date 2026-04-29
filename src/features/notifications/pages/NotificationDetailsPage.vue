<script setup>
import { storeToRefs } from 'pinia'
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { formatDateTime, humanizeToken, isUnread } from '../utils/notification.filters.js'
import { useNotificationsStore } from '../stores/useNotificationsStore.js'

const route = useRoute()
const router = useRouter()
const store = useNotificationsStore()
const { loading, error } = storeToRefs(store)

const notificationId = computed(() => String(route.params.id || ''))
const item = computed(() => store.findNotification(notificationId.value))

const metaRows = computed(() => {
  const target = item.value || {}
  return [
    ['Event', target.event],
    ['Type', humanizeToken(target.type || target.domain)],
    ['Channel', humanizeToken(target.channel || (target.channels || [])[0])],
    ['Status', humanizeToken(target.status)],
    ['Priority', humanizeToken(target.priority)],
    ['Entity', target.entityLabel || target.entityId],
    ['Entity type', humanizeToken(target.entityType)],
    ['Actor', target.actorName || target.actorId],
    ['Created', formatDateTime(target.createdAt)],
    ['Read', formatDateTime(target.readAt)],
    ['Archived', formatDateTime(target.archivedAt)],
  ].filter(([, value]) => value && value !== '—')
})

onMounted(async () => {
  if (!store.items.length) await store.fetchNotifications().catch(() => null)
  if (item.value && isUnread(item.value)) store.markRead(item.value.id).catch(() => null)
})

function openAction() {
  if (!item.value?.actionUrl) return
  router.push(item.value.actionUrl).catch(() => {
    window.location.href = item.value.actionUrl
  })
}
</script>

<template>
  <section class="space-y-6">
    <header class="page-card rounded-[2rem] border p-6 sm:p-8">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-muted,#6b7280)]">
            Notification details
          </p>
          <h1 class="mt-3 text-2xl font-semibold sm:text-3xl">
            {{ item?.title || 'Notification not found' }}
          </h1>
          <p class="mt-2 max-w-3xl text-sm leading-6 text-[color:var(--color-muted,#6b7280)]">
            {{ item?.message || 'This notification is not currently loaded, archived, or unavailable to your account.' }}
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <button class="action-secondary rounded-full border px-4 py-2 text-sm font-semibold" type="button" @click="router.back()">
            Back
          </button>
          <button
            v-if="item?.actionUrl"
            class="action-primary rounded-full px-4 py-2 text-sm font-semibold"
            type="button"
            @click="openAction"
          >
            {{ item.actionLabel || 'Open linked record' }}
          </button>
        </div>
      </div>
    </header>

    <div v-if="error" class="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      {{ error }}
    </div>

    <div v-if="loading" class="page-card rounded-2xl border p-5 text-sm text-[color:var(--color-muted,#6b7280)]">
      Loading notification…
    </div>

    <div v-else-if="item" class="grid gap-6 lg:grid-cols-[1fr_0.72fr]">
      <article class="page-card rounded-[2rem] border p-6">
        <h2 class="text-base font-semibold">Message</h2>
        <p class="mt-4 whitespace-pre-line text-sm leading-7 text-[color:var(--color-muted,#6b7280)]">
          {{ item.message }}
        </p>

        <div v-if="item.meta" class="mt-6 rounded-2xl border p-4">
          <h3 class="text-sm font-semibold">Metadata</h3>
          <pre class="mt-3 overflow-auto text-xs leading-5">{{ JSON.stringify(item.meta, null, 2) }}</pre>
        </div>
      </article>

      <aside class="page-card rounded-[2rem] border p-6">
        <h2 class="text-base font-semibold">Operational data</h2>
        <dl class="mt-4 divide-y divide-[color:var(--color-border,#e5e7eb)]">
          <div v-for="row in metaRows" :key="row[0]" class="grid gap-1 py-3">
            <dt class="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted,#6b7280)]">
              {{ row[0] }}
            </dt>
            <dd class="break-words text-sm font-medium">{{ row[1] }}</dd>
          </div>
        </dl>

        <button class="mt-6 action-secondary w-full rounded-full border px-4 py-2 text-sm font-semibold" type="button" @click="store.archive(item.id)">
          Archive notification
        </button>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.page-card {
  background: var(--color-surface, #ffffff);
  border-color: var(--color-border, #e5e7eb);
}

.action-primary {
  color: #ffffff;
  background: var(--color-primary, #1860a8);
}

.action-secondary {
  color: var(--color-text, #111827);
  background: var(--color-surface, #ffffff);
  border-color: var(--color-border, #e5e7eb);
}
</style>

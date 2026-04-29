<script setup>
import { storeToRefs } from 'pinia'
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import NotificationFilters from '../components/NotificationFilters.vue'
import NotificationList from '../components/NotificationList.vue'
import { useNotificationsStore } from '../stores/useNotificationsStore.js'

const router = useRouter()
const store = useNotificationsStore()
/*const { filters, visibleItems, unreadCount, loading, error, items, pendingDeliveries, failedDeliveries } = storeToRefs(store)*/

const { filters, visibleItems, unreadCount, loading, error, scopedItems, pendingDeliveries, failedDeliveries } = storeToRefs(store)

/*const totalCount = computed(() => items.value.length)
const actionRequiredCount = computed(() => items.value.filter((item) => item.isActionRequired && item.status !== 'archived').length)*/

const totalCount = computed(() => scopedItems.value.length)

const actionRequiredCount = computed(() =>
  scopedItems.value.filter((item) => item.isActionRequired && item.status !== 'archived').length,
)
onMounted(() => {
  store.ensureReady().catch(() => null)
})

function openItem(item) {
  store.markRead(item.id).catch(() => null)
  if (item.actionUrl) {
    router.push(item.actionUrl).catch(() => {
      window.location.href = item.actionUrl
    })
    return
  }
  router.push(`/notifications/${item.id}`)
}

function archiveItem(item) {
  store.archive(item.id).catch(() => null)
}
</script>

<template>
  <section class="page-shell space-y-6">
    <header class="page-hero rounded-[2rem] border p-6 sm:p-8">
      <p class="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-muted,#6b7280)]">
        EduProLIC operations
      </p>
      <div class="mt-3 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 class="text-2xl font-semibold sm:text-3xl">Notification Center</h1>
          <p class="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--color-muted,#6b7280)]">
            One controlled inbox for CRM assignments, consultant work decisions, editor review, finance alerts, auth events, and client-record changes.
          </p>
        </div>

        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div class="stat-card rounded-2xl border p-4">
            <p class="text-xs uppercase tracking-[0.18em] text-[color:var(--color-muted,#6b7280)]">Unread</p>
            <p class="mt-2 text-xl font-semibold">{{ unreadCount }}</p>
          </div>
          <div class="stat-card rounded-2xl border p-4">
            <p class="text-xs uppercase tracking-[0.18em] text-[color:var(--color-muted,#6b7280)]">Total</p>
            <p class="mt-2 text-xl font-semibold">{{ totalCount }}</p>
          </div>
          <div class="stat-card rounded-2xl border p-4">
            <p class="text-xs uppercase tracking-[0.18em] text-[color:var(--color-muted,#6b7280)]">Action</p>
            <p class="mt-2 text-xl font-semibold">{{ actionRequiredCount }}</p>
          </div>
          <div class="stat-card rounded-2xl border p-4">
            <p class="text-xs uppercase tracking-[0.18em] text-[color:var(--color-muted,#6b7280)]">Failed email</p>
            <p class="mt-2 text-xl font-semibold">{{ failedDeliveries.length }}</p>
          </div>
        </div>
      </div>

      <div class="mt-6 flex flex-wrap gap-3">
        <button class="action-primary rounded-full px-4 py-3 text-sm font-semibold" type="button" @click="store.markAllRead()">
          Mark all read
        </button>
        <button class="action-secondary rounded-full border px-4 py-3 text-sm font-semibold" type="button" @click="store.fetchNotifications()">
          Refresh
        </button>
        <RouterLink
          v-if="store.canReadAdminLogs"
          class="action-secondary rounded-full border px-4 py-3 text-sm font-semibold"
          to="/notifications/admin/logs"
        >
          Delivery logs
          <span v-if="pendingDeliveries.length">({{ pendingDeliveries.length }})</span>
        </RouterLink>
      </div>
    </header>

    <div v-if="error" class="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      {{ error }}
    </div>

    <NotificationFilters
      :model-value="filters"
      @refresh="store.fetchNotifications()"
      @update:model-value="store.setFilters($event)"
    />

    <NotificationList
      :items="visibleItems"
      :loading="loading"
      @archive="archiveItem"
      @mark-read="store.markRead($event.id)"
      @open="openItem"
    />
  </section>
</template>

<style scoped>
.page-hero,
.stat-card {
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

<script setup>
import { storeToRefs } from 'pinia'
import { onMounted } from 'vue'
import NotificationFilters from '../components/NotificationFilters.vue'
import NotificationList from '../components/NotificationList.vue'
import { useNotificationsStore } from '../stores/useNotificationsStore.js'

const store = useNotificationsStore()
const { filters, visibleItems, unreadCount } = storeToRefs(store)

onMounted(() => {
  if (!store.items.length) {
    store.hydrate({
      items: [
        {
          id: 'ntf_demo_1',
          title: 'Booking confirmed',
          message: 'Booking #BK-1004 has been confirmed for Nangura Social Care.',
          event: 'booking.confirmed',
          type: 'booking',
          channel: 'in_app',
          priority: 'high',
          actionUrl: '/bookings/BK-1004',
          entityId: 'BK-1004',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'ntf_demo_2',
          title: 'Invoice overdue',
          message: 'Invoice #INV-2201 is overdue and needs follow-up.',
          event: 'invoice.overdue',
          type: 'finance',
          channel: 'email',
          priority: 'critical',
          actionUrl: '/finance/invoices/INV-2201',
          entityId: 'INV-2201',
          createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        },
      ],
    })
  }
})

function openItem(item) {
  if (item.actionUrl) {
    window.location.href = item.actionUrl
  }
}

function archiveItem(item) {
  store.archive(item.id)
}
</script>

<template>
  <section class="page-shell space-y-6">
    <header class="page-hero rounded-[2rem] border p-6 sm:p-8">
      <p class="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-muted,#6b7280)]">
        Cross-cutting feature
      </p>
      <div class="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 class="text-2xl font-semibold sm:text-3xl">Notification Center</h1>
          <p class="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--color-muted,#6b7280)]">
            One place for CRM, booking, forms, auth, documents, and finance events.
          </p>
        </div>

        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div class="stat-card rounded-2xl border p-4">
            <p class="text-xs uppercase tracking-[0.18em] text-[color:var(--color-muted,#6b7280)]">Unread</p>
            <p class="mt-2 text-xl font-semibold">{{ unreadCount }}</p>
          </div>
          <div class="stat-card rounded-2xl border p-4">
            <p class="text-xs uppercase tracking-[0.18em] text-[color:var(--color-muted,#6b7280)]">Channels</p>
            <p class="mt-2 text-xl font-semibold">3</p>
          </div>
          <div class="stat-card rounded-2xl border p-4 sm:col-span-1 col-span-2">
            <button class="action-primary w-full rounded-full px-4 py-3 text-sm font-semibold" @click="store.markAllRead()">
              Mark all read
            </button>
          </div>
        </div>
      </div>
    </header>

    <NotificationFilters
      :model-value="filters"
      @update:model-value="store.setFilters($event)"
    />

    <NotificationList
      :items="visibleItems"
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
  color: white;
  background: var(--color-primary, #1860a8);
}
</style>

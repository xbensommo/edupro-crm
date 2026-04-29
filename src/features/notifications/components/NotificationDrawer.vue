<script setup>
import { storeToRefs } from 'pinia'
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import NotificationList from './NotificationList.vue'
import { useNotificationsStore } from '../stores/useNotificationsStore.js'

const router = useRouter()
const store = useNotificationsStore()
const { drawerOpen, recentItems, loading } = storeToRefs(store)

onMounted(() => {
  if (!store.items.length) store.fetchNotifications().catch(() => null)
})

function closeDrawer() {
  store.setDrawerOpen(false)
}

function openItem(item) {
  store.markRead(item.id).catch(() => null)
  closeDrawer()

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
  <Teleport to="body">
    <div v-if="drawerOpen" class="fixed inset-0 z-50">
      <button class="overlay absolute inset-0" type="button" aria-label="Close notification drawer" @click="closeDrawer" />
      <aside class="drawer absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto p-4 sm:p-6">
        <div class="drawer-panel rounded-[1.75rem] border p-5">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-muted,#6b7280)]">
                EduProLIC updates
              </p>
              <h2 class="mt-2 text-lg font-semibold">Notifications</h2>
            </div>

            <div class="flex items-center gap-2">
              <RouterLink class="inline-flex rounded-full border px-3 py-2 text-sm font-semibold" to="/notifications" @click="closeDrawer">
                Open center
              </RouterLink>
              <button class="inline-flex rounded-full border px-3 py-2 text-sm font-semibold" type="button" @click="closeDrawer">
                Close
              </button>
            </div>
          </div>

          <div class="mt-5">
            <NotificationList
              :items="recentItems"
              :loading="loading"
              empty-title="No recent notifications"
              empty-text="CRM assignments, reviews, finance alerts, and account events will appear here."
              @archive="archiveItem"
              @mark-read="store.markRead($event.id)"
              @open="openItem"
            />
          </div>
        </div>
      </aside>
    </div>
  </Teleport>
</template>

<style scoped>
.overlay {
  background: rgba(15, 23, 42, 0.4);
}

.drawer {
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(10px);
}

.drawer-panel {
  min-height: 100%;
  background: var(--color-surface, #ffffff);
  border-color: var(--color-border, #e5e7eb);
  box-shadow: 0 30px 80px rgba(15, 23, 42, 0.15);
}
</style>

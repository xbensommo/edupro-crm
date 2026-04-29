<script setup>
import { storeToRefs } from 'pinia'
import { computed, onMounted } from 'vue'
import notificationEventRegistry from '../constants/notification.events.js'
import { humanizeToken } from '../utils/notification.filters.js'
import { useNotificationsStore } from '../stores/useNotificationsStore.js'

const store = useNotificationsStore()
const { templates, loading, error } = storeToRefs(store)

const registryRows = computed(() => Object.entries(notificationEventRegistry).map(([event, definition]) => ({
  id: event,
  key: definition.templateKey || event,
  event,
  type: definition.type || 'system',
  channels: definition.channels || ['in_app'],
  priority: definition.priority || 'normal',
  active: true,
  source: 'registry',
})))

const rows = computed(() => {
  if (templates.value.length) return templates.value.map((template) => ({ ...template, source: 'database' }))
  return registryRows.value
})

onMounted(() => {
  store.fetchTemplates().catch(() => null)
})
</script>

<template>
  <section class="space-y-6">
    <header class="page-card rounded-[2rem] border p-6 sm:p-8">
      <p class="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-muted,#6b7280)]">
        Admin / sysadmin
      </p>
      <div class="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 class="text-2xl font-semibold sm:text-3xl">Notification Templates</h1>
          <p class="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--color-muted,#6b7280)]">
            Inspect the active event/template policy. If no database templates exist, the page shows the code registry fallback used by the notification orchestrator.
          </p>
        </div>
        <button class="action-secondary rounded-full border px-4 py-2 text-sm font-semibold" type="button" @click="store.fetchTemplates()">
          Refresh
        </button>
      </div>
    </header>

    <div v-if="error" class="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      {{ error }}
    </div>

    <section class="page-card rounded-[2rem] border p-4 sm:p-6">
      <div class="overflow-x-auto">
        <table class="min-w-full text-left text-sm">
          <thead>
            <tr class="text-[color:var(--color-muted,#6b7280)]">
              <th class="px-4 py-3 font-medium">Key</th>
              <th class="px-4 py-3 font-medium">Event</th>
              <th class="px-4 py-3 font-medium">Type</th>
              <th class="px-4 py-3 font-medium">Channels</th>
              <th class="px-4 py-3 font-medium">Priority</th>
              <th class="px-4 py-3 font-medium">Source</th>
              <th class="px-4 py-3 font-medium">Active</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td class="px-4 py-4" colspan="7">Loading templates…</td>
            </tr>
            <tr v-for="template in rows" v-else :key="template.id || template.key" class="border-t">
              <td class="px-4 py-3 font-medium">{{ template.key || template.templateKey || '—' }}</td>
              <td class="px-4 py-3">{{ template.event || '—' }}</td>
              <td class="px-4 py-3">{{ humanizeToken(template.type) }}</td>
              <td class="px-4 py-3">{{ (template.channels || []).join(', ') || '—' }}</td>
              <td class="px-4 py-3">{{ humanizeToken(template.priority) }}</td>
              <td class="px-4 py-3">{{ template.source }}</td>
              <td class="px-4 py-3">{{ template.active === false ? 'No' : 'Yes' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </section>
</template>

<style scoped>
.page-card {
  background: var(--color-surface, #ffffff);
  border-color: var(--color-border, #e5e7eb);
}

.action-secondary {
  color: var(--color-text, #111827);
  background: var(--color-surface, #ffffff);
  border-color: var(--color-border, #e5e7eb);
}

tr.border-t {
  border-color: var(--color-border, #e5e7eb);
}
</style>

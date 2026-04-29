<script setup>
import { storeToRefs } from 'pinia'
import { onMounted, ref } from 'vue'
import NotificationPreferencesForm from '../components/NotificationPreferencesForm.vue'
import { useNotificationsStore } from '../stores/useNotificationsStore.js'

const store = useNotificationsStore()
const { preferences, saving, error } = storeToRefs(store)
const savedMessage = ref('')

onMounted(() => {
  store.fetchPreferences().catch(() => null)
})

async function savePreferences(payload) {
  savedMessage.value = ''
  await store.savePreferences(payload)
  savedMessage.value = 'Preferences saved.'
}
</script>

<template>
  <section class="space-y-6">
    <header class="page-card rounded-[2rem] border p-6 sm:p-8">
      <p class="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-muted,#6b7280)]">
        User settings
      </p>
      <h1 class="mt-3 text-2xl font-semibold sm:text-3xl">Notification Preferences</h1>
      <p class="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--color-muted,#6b7280)]">
        Configure normal notification channels. Critical operational, legal, finance, and assignment events remain enforced by policy.
      </p>
    </header>

    <div v-if="error" class="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      {{ error }}
    </div>

    <div v-if="savedMessage" class="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
      {{ savedMessage }}
    </div>

    <NotificationPreferencesForm
      :model-value="preferences"
      :saving="saving"
      @submit="savePreferences"
      @update:model-value="store.setPreferences($event)"
    />
  </section>
</template>

<style scoped>
.page-card {
  background: var(--color-surface, #ffffff);
  border-color: var(--color-border, #e5e7eb);
}
</style>

<template>
  <EntityPageShell eyebrow="Client Records" :title="headline" description="Review profile details, linked work, due balances, notes, and activity for this client.">
    <template #actions v-if="canCreateWork">
      <div class="flex gap-2">
        <!-- <RouterLink :to="`/clients/${client?.id}/edit`" class="btn-outline">Edit Client</RouterLink> -->
        <RouterLink :to="`/crm/add?clientId=${client?.id}`" class="btn-primary">Add Assignment / Work</RouterLink>
      </div>
    </template>

    <div v-if="client && !isLoading" class="grid gap-6 xl:grid-cols-[320px,1fr]">
      <ClientSummaryPanel :client="client" />
      <div class="space-y-6">
        <EntitySectionCard title="Contact Info" description="Main contact and intake details.">
          <div class="grid gap-4 md:grid-cols-2">
            <div class="card-soft space-y-2 text-sm text-soft">
              <p><strong>Email:</strong> {{ client.email || 'No email' }}</p>
              <p><strong>Phone:</strong> {{ client.phone || 'No phone' }}</p>
              <p><strong>City:</strong> {{ client.city || 'No city' }}</p>
            </div>
            <div class="card-soft space-y-2 text-sm text-soft">
              <p><strong>Institution:</strong> {{ client.institutionName || '—' }}</p>
              <p><strong>Field of Study:</strong> {{ client.fieldOfStudy || '—' }}</p>
              <p><strong>Study Level:</strong> {{ client.studyLevel || '—' }}</p>
            </div>
          </div>
        </EntitySectionCard>

        <EntitySectionCard title="Work & Finance Snapshot" description="This is read-only visibility from CRM-linked work. Finance remains owned by the finance app.">
          <div class="grid gap-4 md:grid-cols-4">
            <div class="card-soft"><p class="text-caption">Total work</p><p class="text-xl font-semibold">{{ client.workSummary?.total || 0 }}</p></div>
            <div class="card-soft"><p class="text-caption">Completed</p><p class="text-xl font-semibold">{{ client.workSummary?.completed || 0 }}</p></div>
            <div class="card-soft"><p class="text-caption">Quoted</p><p class="text-xl font-semibold">{{ money(client.financeSummary?.quotedAmount || 0) }}</p></div>
            <div class="card-soft"><p class="text-caption">Outstanding</p><p class="text-xl font-semibold">{{ money(client.financeSummary?.amountDue || 0) }}</p></div>
          </div>

          <div v-if="client.workItems?.length" class="mt-4 space-y-3">
            <article v-for="work in client.workItems" :key="work.id" class="card-soft flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p class="font-semibold text-[var(--color-text)]">{{ work.title || 'Untitled work' }}</p>
                <p class="text-caption">{{ work.serviceType || 'service' }} · {{ work.status || 'draft' }} · Due {{ formatDate(work.dueDate) }}</p>
              </div>
              <div class="text-sm text-soft">Paid {{ money(work.amountPaidCached || 0) }} · Due {{ money(work.amountDueCached || 0) }}</div>
            </article>
          </div>
        </EntitySectionCard>

        <EntitySectionCard title="Notes" description="Recent internal notes.">
          <ul v-if="(client.notes || []).length" class="space-y-3">
            <li v-for="note in client.notes" :key="note.id" class="card-soft rounded-[1.25rem] p-4">
              <p class="text-sm text-soft">{{ note.content }}</p>
              <p class="mt-3 text-caption">{{ note.type || 'general' }}</p>
            </li>
          </ul>
          <EmptyState v-else title="No notes yet" description="Use notes for onboarding context, delivery notes, and relationship history." />
        </EntitySectionCard>

        <EntitySectionCard title="Activity Timeline" description="Recent interactions and system updates for this client.">
          <ActivityTimeline :items="client.activities || []" />
        </EntitySectionCard>
      </div>
    </div>

    <div v-else-if="isLoading" class="grid gap-6 xl:grid-cols-[320px,1fr]"><Loader :loading="isLoading" /></div>

    <EmptyState v-else title="Client not found" description="This client could not be loaded."><RouterLink to="/clients" class="btn-primary">Back to Clients</RouterLink></EmptyState>
  </EntityPageShell>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useAppStore } from '@app/stores/appStore'
import ActivityTimeline from '../components/ActivityTimeline.vue'
import ClientSummaryPanel from '../components/ClientSummaryPanel.vue'
import EmptyState from '../components/EmptyState.vue'
import EntityPageShell from '../components/EntityPageShell.vue'
import EntitySectionCard from '../components/EntitySectionCard.vue'
import Loader from '@app/components/SkeletonLoader.vue'
import { createClientService } from '../services/clientService.js'

const route = useRoute()
const store = useAppStore()
const clientService = createClientService({ store })
const client = ref(null)
const isLoading = ref(false)
const canCreateWork = computed(() => store.hasRole?.('admin') || store.hasRole?.('receptionist'))

const headline = computed(() => {
  if (!client.value) return 'Client Detail'
  return client.value.institutionName || [client.value.firstName, client.value.lastName].filter(Boolean).join(' ') || 'Client Detail'
})

function money(value) {
  return new Intl.NumberFormat('en-NA', { style: 'currency', currency: 'NAD' }).format(Number(value || 0))
}
function formatDate(value) {
  if (!value) return '—'
  const date = typeof value === 'string' ? new Date(value) : value?.seconds ? new Date(value.seconds * 1000) : new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toISOString().slice(0, 10)
}

onMounted(async () => {
  isLoading.value = true
  try {
    client.value = await clientService.getClient(String(route.params.id || ''))
  } finally {
    isLoading.value = false
  }
})
</script>

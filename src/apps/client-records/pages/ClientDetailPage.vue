<template>
  <EntityPageShell
    eyebrow="Client Records"
    :title="headline"
    description="Review profile details, contacts, notes, and the recent timeline for this client."
  >
    <template #actions>
      <RouterLink
        :to="`/clients/${route.params.id}/edit`"
        class="btn-secondary"
      >
        Edit Client
      </RouterLink>
      
      <RouterLink
        :to="`/clients/${route.params.id}/add/activity`"
        class="btn-primary"
      >
        Add Activity
      </RouterLink>
    </template>

    <div v-if="client && !isLoading" class="grid gap-6 xl:grid-cols-[320px,1fr]">
      <ClientSummaryPanel :client="client" />

      <div class="space-y-6">
       <EntitySectionCard title="Contact Info" description="Main contact details">
          <div  class="grid gap-4 md:grid-cols-2">
            <div class="card-soft space-y-2 text-sm text-soft">
              <p>{{ client.data.email || 'No email' }}</p>
              <p>{{ client.data.phone || 'No phone' }}</p>
              <p>{{ client.data.city || 'No Address' }}</p>
            </div>
          </div>
          
        </EntitySectionCard>

        <!-- <EntitySectionCard title="Contacts" description="Other people associated with this client account.">
          <EntityTable :columns="contactColumns" :rows="client.contacts || []" empty-text="No contacts linked yet." />
        </EntitySectionCard> -->

        <!-- <EntitySectionCard title="Notes" description="Recent notes and relationship context.">
          <ul v-if="(client.notes || []).length" class="space-y-3">
            <li
              v-for="note in client.notes"
              :key="note.id"
              class="card-soft rounded-[1.25rem] p-4"
            >
              <p class="text-sm text-soft">{{ note.content }}</p>
              <p class="mt-3 text-caption">
                {{ note.type || 'general' }}
              </p>
            </li>
          </ul>
          <EmptyState
            v-else
            title="No notes yet"
            description="Use notes for onboarding context, delivery notes, and relationship history."
          />
        </EntitySectionCard> -->

        <EntitySectionCard title="Activity Timeline" description="Recent interactions and system updates for this client.">
          <ActivityTimeline :items="client.activities || []" />
        </EntitySectionCard>
      </div>
    </div>

    <div v-else-if="!client && isLoading" class="grid gap-6 xl:grid-cols-[320px,1fr]">
      <Loader loading="isLoading" />
    </div>

    <EmptyState
      v-else
      title="Client not found"
      description="This client could not be loaded."
    >
      <RouterLink
        to="/clients"
        class="btn-primary"
      >
        Back to Clients
      </RouterLink>
    </EmptyState>
  </EntityPageShell>
</template>

<script setup>
/**
 * @file ClientDetailPage.vue
 * @description Starter detail page for client records.
 */

import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useAppStore } from '@app/stores/appStore'
import ActivityTimeline from '../components/ActivityTimeline.vue'
import ClientSummaryPanel from '../components/ClientSummaryPanel.vue'
import EmptyState from '../components/EmptyState.vue'
import EntityPageShell from '../components/EntityPageShell.vue'
import EntitySectionCard from '../components/EntitySectionCard.vue'
import Loader from '@app/components/SkeletonLoader.vue'
import EntityTable from '../components/EntityTable.vue'
import { createClientService } from '../services/clientService.js'

const route = useRoute()
const store = useAppStore()
const clientService = createClientService({ store })
const client = ref(null)

const isLoading = computed( () => store.isLoading)

const contactColumns = [
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' },
]

const headline = computed(() => {
  if (!client.value) return 'Client Detail'
  return (
    client.value.companyName ||
    [client.value.firstName, client.value.lastName].filter(Boolean).join(' ') ||
    'Client Detail'
  )
})

onMounted(async () => {
  client.value = await clientService.getClient(String(route.params.id || ''))
})
</script>

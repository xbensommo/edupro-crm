<template>
  <EntityPageShell
    eyebrow="Client Records"
    title="Clients"
    description="Real EduProLIC client intake records linked to CRM work and payment visibility."
  >
    <template #actions>
      <RouterLink v-if="canCreate" to="/clients/new" class="btn-primary">New Client</RouterLink>
    </template>

    <template #filters>
      <div class="grid gap-4 md:grid-cols-3">
        <label class="space-y-2 text-sm text-soft">
          <span class="field-label mb-0">Search</span>
          <input v-model="filters.search" type="text" placeholder="Name, email, client number, institution" class="input-field" />
        </label>
        <label class="space-y-2 text-sm text-soft">
          <span class="field-label mb-0">Status</span>
          <select v-model="filters.status" class="select-field">
            <option value="">All statuses</option>
            <option value="lead">Lead</option>
            <option value="prospect">Prospect</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        <label class="space-y-2 text-sm text-soft">
          <span class="field-label mb-0">Lifecycle</span>
          <select v-model="filters.lifecycleStage" class="select-field">
            <option value="">All stages</option>
            <option value="intake">Intake</option>
            <option value="awaiting_work">Awaiting work</option>
            <option value="work_in_progress">Work in progress</option>
            <option value="completed">Completed</option>
          </select>
        </label>
      </div>
    </template>

    <EntityStatsGrid :items="stats" />

    <div v-if="showLoading" class="py-6">
      <Loader />
    </div>

    <EntityTable
      v-else
      :columns="columns"
      :rows="filteredRows"
      empty-text="No clients found."
    >
      <template #cell:name="{ row }">
        <div class="space-y-1">
          <RouterLink :to="`/clients/${row.id}`" class="font-semibold text-[var(--color-text)] hover:text-primary transition-theme">
            {{ displayName(row) }}
          </RouterLink>
          <p class="text-caption">{{ row.clientNumber || 'No number' }}</p>
        </div>
      </template>

      <template #cell:status="{ value }">
        <span class="badge badge-primary">{{ value || 'unknown' }}</span>
      </template>

      <template #cell:workSummary="{ row }">
        <div class="text-sm text-soft">
          {{ row.workSummary?.total || 0 }} work · Due {{ money(row.financeSummary?.amountDue || 0) }}
        </div>
      </template>

      <template #actions="{ row }">
        <div class="flex items-center justify-end gap-2">
          <RouterLink :to="`/clients/${row.id}`" class="btn-ghost btn-sm">View</RouterLink>
          <RouterLink v-if="canCreateWork" :to="`/crm/add?clientId=${row.id}`" class="btn-primary btn-sm">Add Work</RouterLink>
        </div>
      </template>
    </EntityTable>
  </EntityPageShell>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useAppStore } from '@app/stores/appStore'
import EntityPageShell from '../components/EntityPageShell.vue'
import EntityStatsGrid from '../components/EntityStatsGrid.vue'
import EntityTable from '../components/EntityTable.vue'
import Loader from '@app/components/SkeletonLoader.vue'

const store = useAppStore()

const isLoading = computed(() => store.isLoading)
const hasLoaded = ref(false)

const filters = reactive({ search: '', status: '', lifecycleStage: '' })

const columns = [
   { key: 'firstName', label: 'Firstname' }, 
   { key: 'lasstName', label: 'Surname' }, 
  { key: 'studyLevel', label: 'study level' },
  { key: 'email', label: 'Email' },
  { key: 'workSummary', label: 'Work / Due' },
]

const rawRows = computed(() => Array.isArray(store.clients?.items) ? store.clients.items : [])
const rows = computed(() => rawRows.value.map(normalizeRow))

const showLoading = computed(() => !hasLoaded.value)

const canCreate = computed(() => store.hasRole?.('admin') || store.hasRole?.('receptionist'))
const canCreateWork = canCreate

function normalizeRow(row) {
  const data = row?.data && typeof row.data === 'object' ? row.data : row
  return {
    id: row?.id || row?.docId || row?._id || data?.id || '',
    ...data,
  }
}

const filteredRows = computed(() =>
  rows.value.filter((row) => {
    const haystack = `${row.clientNumber || ''} ${row.institutionName || ''} ${row.firstName || ''} ${row.lastName || ''} ${row.email || ''}`.toLowerCase()

    return (!filters.search || haystack.includes(filters.search.toLowerCase()))
      && (!filters.status || row.status === filters.status)
      && (!filters.lifecycleStage || row.lifecycleStage === filters.lifecycleStage)
  }),
)

const stats = computed(() => {
  const items = rows.value
  return [
    { label: 'Total Clients', value: items.length },
    { label: 'Active', value: items.filter((item) => item.status === 'active').length },
    { label: 'In Progress', value: items.filter((item) => item.workSummary?.total > 0).length },
    { label: 'Outstanding Due', value: money(items.reduce((sum, item) => sum + Number(item.financeSummary?.amountDue || 0), 0)) },
  ]
})

function displayName(row) {
  return row.institutionName || [row.firstName, row.lastName].filter(Boolean).join(' ') || 'Unnamed client'
}

function money(value) {
  return new Intl.NumberFormat('en-NA', { style: 'currency', currency: 'NAD' }).format(Number(value || 0))
}

onMounted(async () => {
  try {
    await store.clientsActions.fetchInitialPage()
  } finally {
    hasLoaded.value = true
  }
})
</script>
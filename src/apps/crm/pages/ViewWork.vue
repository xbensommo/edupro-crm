<template>
  <CrmPageShell
    title="Work Queue"
    description="EduProLIC work operations across intake, assignment, review, and delivery."
  >
    <section class="card p-0 overflow-hidden">
      <CrmDataTable
        :columns="columns"
        :rows="rows"
        :isLoading="isLoading"
        empty-text="No work available yet."
      >
        <template #actions="{ row }">
          <div class="flex items-center justify-end gap-2">
            <RouterLink :to="`/crm/work/v/${row.id}`" class="btn-primary btn-sm">
              View
            </RouterLink>
          </div>
        </template>
      </CrmDataTable>
    </section>
  </CrmPageShell>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import CrmDataTable from '../components/CrmDataTable.vue'
import CrmPageShell from '../components/CrmPageShell.vue'
import { useAppStore } from '@app/stores/appStore'

const store = useAppStore()

const columns = [
  { key: 'engagementCode', label: 'Code' },
  { key: 'clientName', label: 'Client' },
  { key: 'title', label: 'Title' },
  { key: 'deliveryStatus', label: 'Delivery' },
  { key: 'reviewStatus', label: 'Review' },
  { key: 'amountDueCached', label: 'Amount Due' },
  { key: 'consultantName', label: 'Consultant' },
]

const currentUser = computed(() => store.currentUser || {})
const currentRole = computed(() => currentUser.value.role || '')
const currentUserId = computed(() => currentUser.value.uid || '')
const engagementsState = computed(() => store.engagementsActions?.state || {})

const isLoading = computed(() =>
  Boolean(store.isLoading || engagementsState.value.isLoading),
)

const rawRows = computed(() => {
  const items = store.engagements?.items ?? engagementsState.value.items
  return Array.isArray(items) ? items : []
})

const rows = computed(() => rawRows.value.map(normalizeEngagement))

function normalizeEngagement(entry) {
  const data = entry?.data && typeof entry.data === 'object' ? entry.data : entry

  return {
    id: entry?.id || entry?.docId || entry?._id || data?.id || '',
    engagementCode: data?.engagementCode || '—',
    clientName: data?.clientName || '—',
    title: data?.title || '—',
    deliveryStatus: data?.deliveryStatus || 'pending',
    reviewStatus: data?.reviewStatus || 'pending',
    amountDueCached: data?.amountDueCached ?? 0,
    consultantName: data?.consultantName || '—',
    ...data,
  }
}

async function fetchWorkQueue() {
  if (!store.engagementsActions) return

  const roleFilters = {
    consultant: {
      field: 'assignedConsultantId',
      op: '==',
      value: currentUserId.value,
    },
    consultant_editor: {
      field: 'assignedEditorId',
      op: '==',
      value: currentUserId.value,
    },
  }

  const filter = roleFilters[currentRole.value]

  if (filter?.value) {
    await store.engagementsActions.fetchByFilters([filter])
    return
  }

  await store.engagementsActions.fetchInitialPage()
}

onMounted(fetchWorkQueue)
</script>
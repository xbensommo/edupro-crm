<template>
  <section class="min-h-full space-y-6 bg-[var(--color-neutral,#F8FAFC)] p-4 md:p-6">
    <FinancePageHeader
      eyebrow="Operational Finance"
      title="Payments"
      description="Payments logged against EduProLIC work. These records create draft finance transactions before posting reaches the ledger."
    >
      <template #actions>
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-2xl bg-[var(--color-accent,#000000)] px-5 py-3 text-sm font-semibold text-white"
          @click="openPaymentForm"
        >
          {{ showForm ? 'Close form' : 'Log payment' }}
        </button>
      </template>
    </FinancePageHeader>

    <FinancePaymentForm
      v-if="showForm"
      :is-submitting="store.isLoading"
      :clients="clientOptions"
      :engagements="engagementOptions"
      :is-loading-clients="isLoadingClients"
      :is-loading-engagements="isLoadingEngagements"
      :can-load-more-clients="canLoadMoreClients"
      @load-more-clients="loadMoreClients"
      @select-client="loadEngagementsForClient"
      @submit="submitPayment"
      @cancel="showForm = false"
    />

    <p
      v-if="store.error"
      class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
    >
      {{ store.error }}
    </p>

    <FinanceStatePanel
      v-if="showLoadingState"
      tone="loading"
      eyebrow="Loading payments"
      title="Loading payments"
      message="Fetching payment rows for the active range."
    />

    <template v-else>
      <div class="grid gap-4 md:grid-cols-3">
        <FinanceKpiCard
          label="Payments in Range"
          :value="String(store.payments.length)"
          badge="volume"
          hint="Records loaded for the active range."
        />

        <FinanceKpiCard
          label="Cash Received"
          :value="formatMoney(store.workFinanceMetrics.totalReceived)"
          badge="received"
          hint="Gross money received from clients."
        />

        <FinanceKpiCard
          label="Net Collected"
          :value="formatMoney(store.workFinanceMetrics.netCollected)"
          badge="net"
          hint="Payments less refunds in the active range."
        />
      </div>

      <FinanceStatePanel
        v-if="showEmptyState"
        eyebrow="Payments"
        title="No payments found"
        message="No payment rows were found for the active range."
      />

      <div v-else class="grid gap-5">
        <article
          v-for="payment in sortedPayments"
          :key="payment.id"
          class="rounded-[28px] border border-[var(--color-neutral-dark,#E2E8F0)] bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.05)]"
        >
          <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div class="flex flex-wrap items-center gap-3">
                <p class="text-xl font-semibold text-[var(--color-text,#0F172A)]">
                  {{ payment.paymentCode }}
                </p>

                <FinanceStatusBadge :status="payment.status || 'received'" />
              </div>

              <p class="mt-2 text-sm text-[var(--color-text-light,#64748B)]">
                {{ payment.clientLabel || payment.clientId }} · {{ payment.engagementCode || payment.engagementId }}
              </p>
            </div>

            <div class="grid gap-2 text-right text-sm text-[var(--color-text-light,#64748B)]">
              <p>
                <span class="font-semibold text-[var(--color-text,#0F172A)]">
                  {{ formatMoney(payment.amount, payment.currency || 'NAD') }}
                </span>
              </p>

              <p>{{ formatDate(payment.paymentDate) }}</p>
              <p>{{ payment.paymentMethod || '—' }}</p>
              <p>{{ payment.referenceNumber || 'No reference' }}</p>
            </div>
          </div>
        </article>
      </div>
    </template>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import FinanceKpiCard from '../components/FinanceKpiCard.vue'
import FinancePageHeader from '../components/FinancePageHeader.vue'
import FinancePaymentForm from '../components/FinancePaymentForm.vue'
import FinanceStatePanel from '../components/FinanceStatePanel.vue'
import FinanceStatusBadge from '../components/FinanceStatusBadge.vue'
import { formatDate, formatMoney } from '../services/financeFormatters.js'
import { useFinanceAppStore } from '../stores/useFinanceAppStore.js'
import { useAppStore } from '@app/stores/appStore'

const store = useFinanceAppStore()
const st = useAppStore()

const showForm = ref(false)
const isLoadingClients = ref(false)
const isLoadingEngagements = ref(false)

store.ensureReady('payments')

const CLIENT_PAGE_SIZE = 150


const clientOptions = computed(() => normalizeRows(st.clients?.items || []))
const engagementOptions = computed(() => normalizeRows(st.engagements?.items || []))

const canLoadMoreClients = computed(() => {
  const bucket = st.clients || {}

  return Boolean(
    bucket.hasNextPage ||
    bucket.hasMore ||
    bucket.nextCursor ||
    bucket.cursor ||
    bucket.lastVisible ||
    bucket.pageInfo?.hasNextPage ||
    bucket.pagination?.hasNextPage,
  )
})

function normalizeRows(rows = []) {
  return rows.map((row) => {
    const data = row?.data && typeof row.data === 'object' ? row.data : row

    return {
      id: row?.id || data?.id || row?.docId || row?._id,
      ...data,
    }
  })
}

function clientListQuery() {
  return {
    append: false,
    limit: CLIENT_PAGE_SIZE,

    orderBy: [
      { field: 'createdAt', direction: 'desc' },
    ],
  }
}

function clientNextPageQuery() {
  return {
    append: true,
    limit: CLIENT_PAGE_SIZE,
    
    orderBy: [
      { field: 'createdAt', direction: 'desc' },
    ],
  }
}

async function openPaymentForm() {
  showForm.value = !showForm.value

  if (showForm.value && !clientOptions.value.length) {
    await loadInitialClients()
  }
}

async function loadInitialClients() {
  if (!st.clientsActions?.fetchInitialPage) {
    throw new Error('[payments] Missing clientsActions.fetchInitialPage().')
  }

  isLoadingClients.value = true

  try {
    await st.clientsActions.fetchInitialPage(clientListQuery())
  } finally {
    isLoadingClients.value = false
  }
}

async function loadMoreClients() {
  if (!st.clientsActions?.fetchNextPage) {
    throw new Error('[payments] Missing clientsActions.fetchNextPage().')
  }

  isLoadingClients.value = true

  try {
    await st.clientsActions.fetchNextPage(clientNextPageQuery())
  } finally {
    isLoadingClients.value = false
  }
}

async function loadEngagementsForClient(clientId) {
  if (!clientId) return

  if (!st.engagementsActions?.fetchInitialPage) {
    throw new Error('[payments] Missing engagementsActions.fetchInitialPage().')
  }

  isLoadingEngagements.value = true

  try {
    await st.engagementsActions.fetchInitialPage({
      append: false,
      limit: 50,
      filters: [
        { field: 'clientId', op: '==', value: clientId },
      ],
      orderBy: [
        { field: 'createdAt', direction: 'desc' },
      ],
    })
  } finally {
    isLoadingEngagements.value = false
  }
}

onMounted(async () => {
  await loadInitialClients()
})
</script>
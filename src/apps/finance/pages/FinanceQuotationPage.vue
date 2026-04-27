<template>
  <section class="min-h-full space-y-6 bg-[var(--color-neutral,#F8FAFC)] p-4 md:p-6">
    <FinancePageHeader
      eyebrow="Client Estimates"
      title="Quotations"
      description="Create, send, cancel, and download client quotations before converting them into invoices."
    >
      <template #actions>
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-2xl bg-[var(--color-accent,#000000)] px-5 py-3 text-sm font-semibold text-white"
          @click="openQuotationForm"
        >
          {{ showForm ? 'Close form' : 'Create quotation' }}
        </button>
      </template>
    </FinancePageHeader>

    <FinanceQuotationForm
      v-if="showForm"
      :is-submitting="store.isLoading"
      :clients="clientOptions"
      :engagements="engagementOptions"
      :is-loading-clients="isLoadingClients"
      :is-loading-engagements="isLoadingEngagements"
      :can-load-more-clients="canLoadMoreClients"
      @load-more-clients="loadMoreClients"
      @select-client="loadEngagementsForClient"
      @submit="submitQuotation"
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
      eyebrow="Loading quotations"
      title="Loading quotations"
      message="Fetching quotation rows for the active range."
    />

    <FinanceStatePanel
      v-else-if="showEmptyState"
      eyebrow="Quotations"
      title="No quotations found"
      message="Create a quotation from CRM or directly from finance."
    />

    <div v-else class="grid gap-5">
      <article
        v-for="quotation in sortedQuotations"
        :key="quotation.id"
        class="rounded-[28px] border border-[var(--color-neutral-dark,#E2E8F0)] bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.05)]"
      >
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>

            <div class="flex flex-wrap items-center gap-3">
              <p class="text-xl font-semibold text-[var(--color-text,#0F172A)]">
                {{ quotation.data.quoteCode || quotation.data.quotationCode || quotation.data.number}}
              </p>

              <FinanceStatusBadge :status="quotation.data.status || 'draft'" />
            </div>

            <p class="mt-2 text-sm text-[var(--color-text-light,#64748B)]">
              {{ quotation.data.clientLabel || quotation.data.client?.name || quotation.data.clientId }}
              ·
              {{ quotation.data.engagementCode || quotation.data.engagementId || quotation.data.reference?.value || 'No engagement' }}
            </p>

            <p class="mt-2 text-xs uppercase tracking-[0.22em] text-[var(--color-text-light,#64748B)]">
              Valid until {{ formatDate(quotation.data.validUntil || quotation.data.expiryDate) }}
            </p>
          </div>

          <div class="grid gap-2 text-right text-sm text-[var(--color-text-light,#64748B)]">
            <p>
              <span class="font-semibold text-[var(--color-text,#0F172A)]">
                {{ formatMoney(quotation.data.totalAmount, quotation.data.currency || 'NAD') }}
              </span>
            </p>

            <p>
              Deposit {{ formatMoney(quotation.data.depositAmount || quotation.data.depositRequired || 0, quotation.data.currency || 'NAD') }}
            </p>

            <p>
              Status {{ quotation.data.status || 'draft' }}
            </p>
          </div>
        </div>

        <div class="mt-5 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            class="rounded-2xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-2 text-xs font-semibold text-[var(--color-text,#0F172A)] disabled:opacity-60"
            :disabled="store.isLoading"
            @click="handleDownloadQuotation(quotation)"
          >
            Download PDF
          </button>

          <button
            v-if="quotation.data.status === 'draft'"
            type="button"
            class="rounded-2xl bg-[var(--color-primary,#1860A8)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
            :disabled="store.isLoading"
            @click="markQuotationSent(quotation)"
          >
            Mark sent
          </button>

          <button
            v-if="['draft', 'sent'].includes(quotation.status)"
            type="button"
            class="rounded-2xl border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-700 disabled:opacity-60"
            :disabled="store.isLoading"
            @click="cancelQuotation(quotation)"
          >
            Cancel
          </button>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import FinanceQuotationForm from '../components/FinanceQuotationForm.vue'
import FinancePageHeader from '../components/FinancePageHeader.vue'
import FinanceStatePanel from '../components/FinanceStatePanel.vue'
import FinanceStatusBadge from '../components/FinanceStatusBadge.vue'
import { formatDate, formatMoney } from '../services/financeFormatters.js'
import { useFinanceAppStore } from '../stores/useFinanceAppStore.js'
import { downloadQuotationPdf } from '@/quote_generator/services/quotationPdfEngine.js'
import { useAppStore } from '@app/stores/appStore'

const store = useFinanceAppStore()
const st = useAppStore()

store.ensureReady('quotations')

const CLIENT_PAGE_SIZE = 150

const showForm = ref(false)
const isLoadingClients = ref(false)
const isLoadingEngagements = ref(false)

const quotationRows = computed(() => st.quotations.items || [])

const showLoadingState = computed(() => store.isLoading && !quotationRows.value.length)
const showEmptyState = computed(() => !store.isLoading && !store.error && !quotationRows.value.length)

const sortedQuotations = computed(() => {
  return [...quotationRows.value].sort((a, b) => {
    return String(b.data.quoteDate || b.data.issueDate || b.data.createdAt || '').localeCompare(
      String(a.data.quoteDate || a.data.issueDate || a.data.createdAt || ''),
    )
  })
})

const clientOptions = computed(() => normalizeRows(st.clients?.items || []))
const engagementOptions = computed(() => normalizeRows(st.engagements?.items || []))

const canLoadMoreClients = computed(() => {
  const bucket = st.clients || {}

  if (bucket.hasNextPage === false || bucket.hasMore === false) return false
  if (bucket.pageInfo?.hasNextPage === false) return false
  if (bucket.pagination?.hasNextPage === false) return false

  return Boolean(
    bucket.hasNextPage ||
      bucket.hasMore ||
      bucket.nextCursor ||
      bucket.cursor ||
      bucket.lastVisible ||
      bucket.pageInfo?.hasNextPage ||
      bucket.pagination?.hasNextPage ||
      clientOptions.value.length >= CLIENT_PAGE_SIZE,
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

function clientListQuery(append = false) {
  return {
    append,
    limit: CLIENT_PAGE_SIZE,
    filters: [],
    orderBy: [
      { field: 'createdAt', direction: 'desc' },
    ],
  }
}

async function openQuotationForm() {
  showForm.value = !showForm.value

  if (showForm.value && !clientOptions.value.length) {
    await loadInitialClients()
  }
}

async function loadInitialClients() {
  if (!st.clientsActions?.fetchInitialPage) {
    throw new Error('[quotations] Missing clientsActions.fetchInitialPage().')
  }

  isLoadingClients.value = true

  try {
    await st.clientsActions.fetchInitialPage(clientListQuery(false))
  } finally {
    isLoadingClients.value = false
  }
}

async function loadMoreClients() {
  if (!st.clientsActions?.fetchNextPage) {
    throw new Error('[quotations] Missing clientsActions.fetchNextPage().')
  }

  isLoadingClients.value = true

  try {
    await st.clientsActions.fetchNextPage(clientListQuery(true))
  } finally {
    isLoadingClients.value = false
  }
}

async function loadEngagementsForClient(clientId) {
  if (!clientId) return

  if (!st.engagementsActions?.fetchInitialPage) {
    throw new Error('[quotations] Missing engagementsActions.fetchInitialPage().')
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

async function submitQuotation(payload) {
  if (!store.createQuotation) {
    throw new Error('[quotations] Missing store.createQuotation(payload).')
  }

  try {
    await store.createQuotation(payload)
    showForm.value = false
  } catch {
    // Store error already set.
  }
}

async function markQuotationSent(quotation) {
  if (!store.markQuotationSent) {
    throw new Error('[quotations] Missing store.markQuotationSent(quotation).')
  }

  await store.markQuotationSent(quotation)
}

async function cancelQuotation(quotation) {
  if (!store.cancelQuotation) {
    throw new Error('[quotations] Missing store.cancelQuotation(quotation, payload).')
  }

  await store.cancelQuotation(quotation, {
    reason: 'Cancelled from finance quotations page',
  })
}

async function handleDownloadQuotation(quotation) {
  try {
    await downloadQuotationPdf(quotation)
  } catch (error) {
    console.error('[finance] Failed to download quotation PDF:', error)
  }
}

onMounted(async () => {
  await loadInitialClients()
})
</script>
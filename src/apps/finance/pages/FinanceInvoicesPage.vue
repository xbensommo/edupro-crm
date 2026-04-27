<template>
  <section class="min-h-full space-y-6 bg-[var(--color-neutral,#F8FAFC)] p-4 md:p-6">
    <FinancePageHeader eyebrow="Client Billing" title="Invoices" description="Draft, issue, cancel, and track client invoices before payments are allocated.">
      <template #actions>
        <button type="button" class="inline-flex items-center justify-center rounded-2xl bg-[var(--color-accent,#000000)] px-5 py-3 text-sm font-semibold text-white" @click="showForm = !showForm">{{ showForm ? 'Close form' : 'Create invoice' }}</button>
      </template>
    </FinancePageHeader>

    <FinanceInvoiceForm
      v-if="showForm"
      :is-submitting="store.isLoading"
      :clients="clientOptions"
      :engagements="engagementOptions"
      :is-loading-clients="isLoadingClients"
      :is-loading-engagements="isLoadingEngagements"
      :can-load-more-clients="canLoadMoreClients"
      @load-more-clients="loadMoreClients"
      @select-client="loadEngagementsForClient"
      @submit="submitInvoice"
      @cancel="showForm = false"
    />
    <p v-if="store.error" class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{{ store.error }}</p>
    <FinanceStatePanel v-if="showLoadingState" tone="loading" eyebrow="Loading invoices" title="Loading invoices" message="Fetching invoice rows for the active range." />
    <FinanceStatePanel v-else-if="showEmptyState" eyebrow="Invoices" title="No invoices found" message="Create an invoice from CRM or directly from finance." />

    <div v-else class="grid gap-5">
      <article v-for="invoice in sortedInvoices" :key="invoice.id" class="rounded-[28px] border border-[var(--color-neutral-dark,#E2E8F0)] bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.05)]">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div class="flex flex-wrap items-center gap-3">
              <p class="text-xl font-semibold text-[var(--color-text,#0F172A)]">{{ invoice.invoiceCode }}</p>
              <FinanceStatusBadge :status="invoice.status || 'draft'" />
            </div>
            <p class="mt-2 text-sm text-[var(--color-text-light,#64748B)]">{{ invoice.clientLabel || invoice.clientId }} · {{ invoice.engagementCode || invoice.engagementId || 'No engagement' }}</p>
            <p class="mt-2 text-xs uppercase tracking-[0.22em] text-[var(--color-text-light,#64748B)]">Due {{ formatDate(invoice.dueDate) }}</p>
          </div>
          <div class="grid gap-2 text-right text-sm text-[var(--color-text-light,#64748B)]">
            <p><span class="font-semibold text-[var(--color-text,#0F172A)]">{{ formatMoney(invoice.totalAmount, invoice.currency || 'NAD') }}</span></p>
            <p>Paid {{ formatMoney(invoice.allocatedAmount || invoice.paidAmount, invoice.currency || 'NAD') }}</p>
            <p>Balance {{ formatMoney(invoice.balanceAmount, invoice.currency || 'NAD') }}</p>
          </div>
        </div>
        <div class="mt-5 flex flex-wrap justify-end gap-3">
          
          <button v-if="['draft', 'issued'].includes(invoice.status) && Number(invoice.allocatedAmount || 0) === 0" type="button" class="rounded-2xl border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-700 disabled:opacity-60" :disabled="store.isLoading" @click="store.cancelInvoice(invoice, { reason: 'Cancelled from finance invoices page' })">Cancel</button>
        </div>

        <div class="mt-5 flex flex-wrap justify-end gap-3">
  <button
    type="button"
    class="rounded-2xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-2 text-xs font-semibold text-[var(--color-text,#0F172A)] disabled:opacity-60"
    :disabled="store.isLoading"
    @click="handleDownloadInvoice(invoice)"
  >
    Download PDF
  </button>

  <button
    v-if="invoice.status === 'draft'"
    type="button"
    class="rounded-2xl bg-[var(--color-primary,#1860A8)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
    :disabled="store.isLoading"
    @click="store.issueInvoice(invoice)"
  >
    Issue
  </button>

  <button
    v-if="['draft', 'issued'].includes(invoice.status) && Number(invoice.allocatedAmount || 0) === 0"
    type="button"
    class="rounded-2xl border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-700 disabled:opacity-60"
    :disabled="store.isLoading"
    @click="store.cancelInvoice(invoice, { reason: 'Cancelled from finance invoices page' })"
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
import FinanceInvoiceForm from '../components/FinanceInvoiceForm.vue'
import FinancePageHeader from '../components/FinancePageHeader.vue'
import FinanceStatePanel from '../components/FinanceStatePanel.vue'
import FinanceStatusBadge from '../components/FinanceStatusBadge.vue'
import { formatDate, formatMoney } from '../services/financeFormatters.js'
import { useFinanceAppStore } from '../stores/useFinanceAppStore.js'
import { downloadInvoicePdf } from '../services/invoicePdfService.js'
import { useAppStore } from '@app/stores/appStore'

const store = useFinanceAppStore()
store.ensureReady('invoices')

const showForm = ref(false)
const showLoadingState = computed(() => store.isLoading && !store.invoices.length)
const showEmptyState = computed(() => !store.isLoading && !store.error && !store.invoices.length)
const sortedInvoices = computed(() => [...store.invoices].sort((a, b) => String(b.issueDate || '').localeCompare(String(a.issueDate || ''))))

const st = useAppStore()

const CLIENT_PAGE_SIZE = 150

const isLoadingClients = ref(false)
const isLoadingEngagements = ref(false)

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
    filters: [
     
    ],
    orderBy: [
      { field: 'createdAt', direction: 'desc' },
    ],
  }
}

async function openInvoiceForm() {
  showForm.value = !showForm.value

  if (showForm.value && !clientOptions.value.length) {
    await loadInitialClients()
  }
}

async function loadInitialClients() {
  if (!st.clientsActions?.fetchInitialPage) {
    throw new Error('[invoices] Missing clientsActions.fetchInitialPage().')
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
    throw new Error('[invoices] Missing clientsActions.fetchNextPage().')
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
    throw new Error('[invoices] Missing engagementsActions.fetchInitialPage().')
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

async function submitInvoice(payload) {
  try {
    await store.createInvoice(payload)
    showForm.value = false
  } catch {
    // Store error already set.
  }
}

async function handleDownloadInvoice(invoice) {
  try {
    await downloadInvoicePdf(invoice)
  } catch (error) {
    console.error('[finance] Failed to download invoice PDF:', error)
  }
}

onMounted(async () => {
  await loadInitialClients()
})
</script>

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
          class="inline-flex items-center justify-center rounded-2xl bg-[var(--color-accent,#000000)] px-5 py-3 text-sm font-semibold text-white touch-manipulation"
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
    class="group relative rounded-[28px] border border-[var(--color-neutral-dark,#E2E8F0)] bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.05)] transition-all duration-200 hover:shadow-[0_20px_56px_rgba(15,23,42,0.08)]"
  >
    <!-- Status indicator bar - visual priority marker -->
    <div 
      class="absolute top-0 left-0 right-0 h-1 rounded-full"
      :class="{
        'bg-[#10B981]': quotation.data.status === 'sent',
        'bg-[#F59E0B]': quotation.data.status === 'draft',
        'bg-[#EF4444]': quotation.data.status === 'cancelled' || quotation.data.status === 'expired',
        'bg-[#8B5CF6]': quotation.data.status === 'accepted'
      }"
    />

    <!-- Primary Information Row - Most important data first -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <!-- Left: Client & Reference Info -->
      <div class="flex-1 min-w-0">
        <!-- Client Name - Primary -->
        <div class="flex items-start gap-2">
          <h3 class="text-lg font-semibold text-[var(--color-text,#0F172A)] truncate">
            {{ quotation.data.clientLabel || quotation.data.client?.name || quotation.data.clientId || 'Unnamed Client' }}
          </h3>
          <FinanceStatusBadge 
            :status="quotation.data.status || 'draft'" 
            class="flex-shrink-0 mt-0.5"
          />
        </div>

        <!-- Reference & Engagement - Secondary -->
        <div class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span class="font-mono text-[var(--color-text-light,#64748B)]">
            {{ quotation.data.quoteCode || quotation.data.quotationCode || quotation.data.number }}
          </span>
          <span class="text-[var(--color-neutral-dark,#CBD5E1)]">·</span>
          <span class="text-[var(--color-text-light,#64748B)]">
            {{ quotation.data.reference?.value || quotation.data.engagementCode || quotation.data.engagementId || 'No reference' }}
          </span>
        </div>

        <!-- Validity & Meta - Tertiary -->
        <div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <span class="flex items-center gap-1.5 text-[var(--color-text-light,#64748B)]">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Valid until {{ formatDate(quotation.data.validUntil || quotation.data.expiryDate) }}</span>
          </span>
          <span class="text-[var(--color-neutral-dark,#CBD5E1)]">|</span>
          <span class="flex items-center gap-1.5 text-[var(--color-text-light,#64748B)]">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Created {{ formatDate(quotation.data.createdAt) }}</span>
          </span>
        </div>
      </div>

      <!-- Right: Financial Summary -->
      <div class="flex-shrink-0">
        <div class="text-right">
          <!-- Total Amount - Primary Financial Metric -->
          <p class="text-2xl font-bold text-[var(--color-text,#0F172A)]">
            {{ formatMoney(quotation.data.totalAmount, quotation.data.currency || 'NAD') }}
          </p>
          
          <!-- Deposit & Currency - Secondary Financial Metrics -->
          <div class="mt-1 flex items-center justify-end gap-3 text-sm text-[var(--color-text-light,#64748B)]">
            <span class="flex items-center gap-1">
              <span class="text-xs">Deposit</span>
              <span class="font-medium text-[var(--color-text,#0F172A)]">
                {{ formatMoney(quotation.data.depositAmount || quotation.data.depositRequired || 0, quotation.data.currency || 'NAD') }}
              </span>
            </span>
            <span class="text-[var(--color-neutral-dark,#CBD5E1)]">|</span>
            <span class="font-mono text-xs uppercase">{{ quotation.data.currency || 'NAD' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Line Items Preview -->
    <div v-if="quotation.data.lineItems && quotation.data.lineItems.length" class="mt-4 border-t border-[var(--color-neutral,#F1F5F9)] pt-3">
      <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--color-text-light,#64748B)]">
        <span class="font-medium text-[var(--color-text,#0F172A)]">Items:</span>
        <span>{{ quotation.data.lineItems.length }} item{{ quotation.data.lineItems.length > 1 ? 's' : '' }}</span>
        <span class="text-[var(--color-neutral-dark,#CBD5E1)]">·</span>
        <span class="truncate max-w-[200px] sm:max-w-[300px] md:max-w-[400px]">
          {{ quotation.data.lineItems.map(item => item.description || item.name).join(' • ') }}
        </span>
      </div>
    </div>

    <!-- Action Buttons - Progressive disclosure -->
    <div class="mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-[var(--color-neutral,#F1F5F9)] pt-4">
      <!-- Download Button - Primary Action -->
      <button
        type="button"
        class="download-btn inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl bg-[var(--color-accent,#000000)] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200  active:scale-95 disabled:opacity-60 disabled:active:scale-100 touch-manipulation select-none"
        :disabled="store.isLoading || isDownloading[quotation.id]"
        @click="handleDownloadQuotation(quotation)"
        @touchend.prevent="handleDownloadQuotation(quotation)"
      >
        <span class="flex items-center gap-2">
          <svg 
            v-if="!isDownloading[quotation.id]" 
            class="w-4 h-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <svg 
            v-else 
            class="w-4 h-4 animate-spin" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>{{ isDownloading[quotation.id] ? 'Downloading...' : 'Download PDF' }}</span>
        </span>
      </button>

      <!-- Mark Sent Button - Secondary Action -->
      <button
        v-if="quotation.data.status === 'draft'"
        type="button"
        class="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl border border-[var(--color-primary,#1860A8)] px-4 py-2.5 text-sm font-medium text-[var(--color-primary,#1860A8)] transition-all duration-200 hover:bg-[var(--color-primary,#1860A8)] hover:text-white active:scale-95 disabled:opacity-60 disabled:active:scale-100 touch-manipulation select-none"
        :disabled="store.isLoading"
        @click="markQuotationSent(quotation)"
      >
        <span class="flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span>Mark Sent</span>
        </span>
      </button>

      <!-- Cancel Button - Destructive Action -->
      <button
        v-if="['draft', 'sent'].includes(quotation.data.status)"
        type="button"
        class="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-medium text-rose-600 transition-all duration-200 hover:bg-rose-50 active:scale-95 disabled:opacity-60 disabled:active:scale-100 touch-manipulation select-none"
        :disabled="store.isLoading"
        @click="cancelQuotation(quotation)"
      >
        <span class="flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span>Cancel</span>
        </span>
      </button>
    </div>
  </article>
</div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, reactive } from 'vue'
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
const isDownloading = reactive({})

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

// UPDATED: Enhanced download handler with better error handling and feedback
async function handleDownloadQuotation(quotation) {
  // Prevent multiple simultaneous downloads
  if (isDownloading[quotation.id]) return

  // Set loading state for this specific quotation
  isDownloading[quotation.id] = true

  try {
    // Add a small delay to ensure the loading state is rendered
    await new Promise(resolve => setTimeout(resolve, 100))
    
    await downloadQuotationPdf(quotation)
    
    // Optional: Show success feedback (can be enhanced with a toast notification)
    console.log('[finance] Quotation PDF downloaded successfully:', quotation.id)
  } catch (error) {
    console.error('[finance] Failed to download quotation PDF:', error)
    
    // Optional: Show error feedback to user
    // You could integrate with a toast notification system here
    alert('Failed to download PDF. Please try again.')
  } finally {
    // Clear loading state
    isDownloading[quotation.id] = false
  }
}

onMounted(async () => {
  await loadInitialClients()
})
</script>

<style scoped>
/* UPDATED: Mobile-first touch improvements */
.touch-manipulation {
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

/* Improved touch targets for mobile */
@media (max-width: 640px) {
  .download-btn,
  button {
    min-height: 48px !important;
    padding-left: 16px !important;
    padding-right: 16px !important;
    font-size: 14px !important;
  }

  /* Ensure buttons are spaced properly for fat fingers */
  .flex-wrap {
    gap: 0.75rem !important;
  }

  /* Make the entire card clickable area for the download button larger */
  article {
    position: relative;
  }

  /* Improve touch feedback */
  button:active {
    transform: scale(0.97);
    transition: transform 0.1s ease;
  }
}

/* Desktop hover states */
@media (min-width: 641px) {
  .download-btn:hover {
    background-color: var(--color-secondary, #F8FAFC);
    border-color: var(--color-text-light, #64748B);
  }
}

/* Animation for the loading spinner */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 0.8s linear infinite;
}

/* Improved focus states for accessibility */
button:focus-visible {
  outline: 2px solid var(--color-primary, #1860A8);
  outline-offset: 2px;
}

/* Prevent text selection during rapid taps */
.select-none {
  -webkit-user-select: none;
  user-select: none;
}
</style>
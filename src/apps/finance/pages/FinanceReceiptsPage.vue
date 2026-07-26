<template>
  <section class="min-h-full space-y-6 bg-[var(--color-neutral,#F8FAFC)] p-4 md:p-6">
    <FinancePageHeader 
      eyebrow="Client Receipts" 
      title="Receipts" 
      description="Create, view, download, and manage payment receipts for client transactions."
    >
      <template #actions>
        <button 
          type="button" 
          class="inline-flex items-center justify-center rounded-2xl bg-[var(--color-accent,#000000)] px-5 py-3 text-sm font-semibold text-white touch-manipulation transition-all duration-200 hover:bg-[var(--color-text,#1E293B)] active:scale-95"
          @click="openReceiptForm"
        >
          {{ showForm ? 'Close form' : 'Create Receipt' }}
        </button>
      </template>
    </FinancePageHeader>

    <!-- Receipt Form -->
    <FinanceReceiptForm
      v-if="showForm"
      :is-submitting="store.isLoading"
      :is-editing="isEditing"
      :edit-data="editData"
      :clients="clientOptions"
      :engagements="engagementOptions"
      :is-loading-clients="isLoadingClients"
      :is-loading-engagements="isLoadingEngagements"
      :can-load-more-clients="canLoadMoreClients"
      @load-more-clients="loadMoreClients"
      @select-client="loadEngagementsForClient"
      @submit="submitReceipt"
      @cancel="closeForm"
    />
    
    <!-- Error Display -->
    <p 
      v-if="store.error" 
      class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
    >
      {{ store.error }}
    </p>
    
    <!-- Loading State -->
    <FinanceStatePanel 
      v-if="showLoadingState" 
      tone="loading" 
      eyebrow="Loading receipts" 
      title="Loading receipts" 
      message="Fetching receipt rows for the active range." 
    />
    
    <!-- Empty State -->
    <FinanceStatePanel 
      v-else-if="showEmptyState" 
      eyebrow="Receipts" 
      title="No receipts found" 
      message="Create a receipt for client payments or refunds." 
    />

    <!-- Receipts List -->
    <div v-else class="grid gap-5">
      <article 
        v-for="receipt in sortedReceipts" 
        :key="receipt.id" 
        class="group relative rounded-[28px] border border-[var(--color-neutral-dark,#E2E8F0)] bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.05)] transition-all duration-200 hover:shadow-[0_20px_56px_rgba(15,23,42,0.08)]"
      >
        <!-- Status indicator bar -->
        <div 
          class="absolute top-0 left-0 right-0 h-1 rounded-t-[28px]"
          :class="{
            'bg-[#10B981]': receipt.status === 'issued',
            'bg-[#F59E0B]': receipt.status === 'draft',
            'bg-[#EF4444]': receipt.status === 'cancelled'
          }"
        />

        <!-- Primary Information -->
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <!-- Left: Client Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-start gap-2">
              <h3 class="text-lg font-semibold text-[var(--color-text,#0F172A)] truncate">
                {{ receipt.clientLabel || receipt.clientName || 'Unnamed Client' }}
              </h3>
              <span class="flex-shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium" :class="{
                'bg-emerald-100 text-emerald-800': receipt.receiptType === 'payment',
                'bg-blue-100 text-blue-800': receipt.receiptType === 'deposit',
                'bg-amber-100 text-amber-800': receipt.receiptType === 'refund',
                'bg-purple-100 text-purple-800': receipt.receiptType === 'credit_note'
              }">
                {{ formatReceiptType(receipt.receiptType) }}
              </span>
            </div>

            <div class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span class="font-mono text-[var(--color-text-light,#64748B)]">
                {{ receipt.receiptCode }}
              </span>
              <span class="text-[var(--color-neutral-dark,#CBD5E1)]">·</span>
              <span class="text-[var(--color-text-light,#64748B)]">
                {{ receipt.engagementCode || 'No engagement' }}
              </span>
            </div>

            <div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              <span class="flex items-center gap-1.5 text-[var(--color-text-light,#64748B)]">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{{ formatDate(receipt.paymentDate || receipt.createdAt) }}</span>
              </span>
              <span class="text-[var(--color-neutral-dark,#CBD5E1)]">|</span>
              <span class="flex items-center gap-1.5 text-[var(--color-text-light,#64748B)]">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>{{ formatPaymentMethod(receipt.paymentMethod) }}</span>
              </span>
            </div>
          </div>

          <!-- Right: Amount -->
          <div class="flex-shrink-0">
            <div class="text-right">
              <p class="text-2xl font-bold text-[var(--color-text,#0F172A)]">
                {{ formatMoney(receipt.amount, receipt.currency || 'NAD') }}
              </p>
              <p class="mt-1 text-xs text-[var(--color-text-light,#64748B)]">
                {{ receipt.referenceNumber || 'No reference' }}
              </p>
            </div>
          </div>
        </div>

        <!-- Description Preview -->
        <div v-if="receipt.description" class="mt-4 border-t border-[var(--color-neutral,#F1F5F9)] pt-3">
          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--color-text-light,#64748B)]">
            <span class="font-medium text-[var(--color-text,#0F172A)]">Description:</span>
            <span class="truncate max-w-[200px] sm:max-w-[300px] md:max-w-[400px]">
              {{ receipt.description }}
            </span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-[var(--color-neutral,#F1F5F9)] pt-4">
          <!-- Edit Button -->
          <button
            v-if="receipt.status === 'draft'"
            type="button"
            class="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-2.5 text-sm font-medium text-[var(--color-text,#0F172A)] transition-all duration-200 hover:bg-[var(--color-neutral,#F8FAFC)] active:scale-95 touch-manipulation select-none"
            :disabled="store.isLoading"
            @click="editReceipt(receipt)"
          >
            <span class="flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Edit</span>
            </span>
          </button>

          <!-- Download Button -->
          <button
            type="button"
            class="download-btn inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl bg-[var(--color-text,#0F172A)] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-[var(--color-text,#1E293B)] hover:shadow-md active:scale-95 disabled:opacity-60 disabled:active:scale-100 touch-manipulation select-none"
            :disabled="store.isLoading || isDownloading[receipt.id]"
            @click="handleDownloadReceipt(receipt)"
            @touchend.prevent="handleDownloadReceipt(receipt)"
          >
            <span class="flex items-center gap-2">
              <svg v-if="!isDownloading[receipt.id]" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <svg v-else class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>{{ isDownloading[receipt.id] ? 'Downloading...' : 'Download PDF' }}</span>
            </span>
          </button>

          <!-- Issue Button -->
          <button
            v-if="receipt.status === 'draft'"
            type="button"
            class="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl border border-[var(--color-primary,#1860A8)] px-4 py-2.5 text-sm font-medium text-[var(--color-primary,#1860A8)] transition-all duration-200 hover:bg-[var(--color-primary,#1860A8)] hover:text-white active:scale-95 disabled:opacity-60 disabled:active:scale-100 touch-manipulation select-none"
            :disabled="store.isLoading"
            @click="issueReceipt(receipt)"
          >
            <span class="flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>Issue</span>
            </span>
          </button>

          <!-- Cancel Button -->
          <button
            v-if="['draft', 'issued'].includes(receipt.status)"
            type="button"
            class="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-medium text-rose-600 transition-all duration-200 hover:bg-rose-50 active:scale-95 disabled:opacity-60 disabled:active:scale-100 touch-manipulation select-none"
            :disabled="store.isLoading"
            @click="cancelReceipt(receipt)"
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
import FinanceReceiptForm from '../components/FinanceReceiptForm.vue'
import FinancePageHeader from '../components/FinancePageHeader.vue'
import FinanceStatePanel from '../components/FinanceStatePanel.vue'
import { formatDate, formatMoney } from '../services/financeFormatters.js'
import { useFinanceAppStore } from '../stores/useFinanceAppStore.js'
import { useAppStore } from '@app/stores/appStore'
import { downloadReceiptPdf } from '../services/receiptPdfService.js'

const store = useFinanceAppStore()
const st = useAppStore()

store.ensureReady('receipts')

const CLIENT_PAGE_SIZE = 150

const showForm = ref(false)
const isEditing = ref(false)
const editData = ref(null)
const isLoadingClients = ref(false)
const isLoadingEngagements = ref(false)
const isDownloading = reactive({})

const showLoadingState = computed(() => store.isLoading && !store.receipts?.length)
const showEmptyState = computed(() => !store.isLoading && !store.error && !store.receipts?.length)

const sortedReceipts = computed(() => {
  return [...(store.receipts || [])].sort((a, b) => {
    return String(b.paymentDate || b.createdAt || '').localeCompare(
      String(a.paymentDate || a.createdAt || ''),
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
    bucket.hasNextPage || bucket.hasMore || bucket.nextCursor ||
    bucket.cursor || bucket.lastVisible || bucket.pageInfo?.hasNextPage ||
    bucket.pagination?.hasNextPage || clientOptions.value.length >= CLIENT_PAGE_SIZE,
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
    orderBy: [{ field: 'createdAt', direction: 'desc' }],
  }
}

function formatReceiptType(type) {
  const map = {
    payment: 'Payment',
    refund: 'Refund',
    deposit: 'Deposit',
    credit_note: 'Credit Note'
  }
  return map[type] || type
}

function formatPaymentMethod(method) {
  const map = {
    bank_transfer: 'Bank Transfer',
    cash: 'Cash',
    credit_card: 'Credit Card',
    debit_card: 'Debit Card',
    mobile_money: 'Mobile Money',
    cheque: 'Cheque',
    other: 'Other'
  }
  return map[method] || method
}

async function openReceiptForm() {
  if (isEditing.value) {
    isEditing.value = false
    editData.value = null
  }
  showForm.value = !showForm.value
  if (showForm.value && !clientOptions.value.length) {
    await loadInitialClients()
  }
}

function closeForm() {
  showForm.value = false
  isEditing.value = false
  editData.value = null
}

function editReceipt(receipt) {
  editData.value = receipt
  isEditing.value = true
  showForm.value = true
  if (!clientOptions.value.length) {
    loadInitialClients()
  }
}

async function loadInitialClients() {
  if (!st.clientsActions?.fetchInitialPage) {
    throw new Error('[receipts] Missing clientsActions.fetchInitialPage().')
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
    throw new Error('[receipts] Missing clientsActions.fetchNextPage().')
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
    throw new Error('[receipts] Missing engagementsActions.fetchInitialPage().')
  }
  isLoadingEngagements.value = true
  try {
    await st.engagementsActions.fetchInitialPage({
      append: false,
      limit: 50,
      filters: [{ field: 'clientId', op: '==', value: clientId }],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
    })
  } finally {
    isLoadingEngagements.value = false
  }
}

async function submitReceipt(payload) {
  try {
    if (isEditing.value && editData.value) {
      await store.updateReceipt(editData.value.id, payload)
    } else {
      await store.createReceipt(payload)
    }
    closeForm()
  } catch {
    // Store error already set.
  }
}

async function issueReceipt(receipt) {
  try {
    await store.issueReceipt(receipt)
  } catch {
    // Store error already set.
  }
}

async function cancelReceipt(receipt) {
  try {
    await store.cancelReceipt(receipt, {
      reason: 'Cancelled from finance receipts page'
    })
  } catch {
    // Store error already set.
  }
}

async function handleDownloadReceipt(receipt) {
  if (isDownloading[receipt.id]) return
  isDownloading[receipt.id] = true
  try {
    await new Promise(resolve => setTimeout(resolve, 100))
    await downloadReceiptPdf(receipt)
    console.log('[finance] Receipt PDF downloaded successfully:', receipt.id)
  } catch (error) {
    console.error('[finance] Failed to download receipt PDF:', error)
    alert('Failed to download PDF. Please try again.')
  } finally {
    isDownloading[receipt.id] = false
  }
}

onMounted(async () => {
  await loadInitialClients()
})
</script>

<style scoped>
.touch-manipulation {
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

@media (max-width: 640px) {
  .download-btn, button {
    min-height: 48px !important;
    padding-left: 16px !important;
    padding-right: 16px !important;
    font-size: 14px !important;
  }
  .flex-wrap {
    gap: 0.75rem !important;
  }
  button:active {
    transform: scale(0.97);
    transition: transform 0.1s ease;
  }
}

@media (min-width: 641px) {
  .download-btn:hover {
    background-color: var(--color-neutral, #F8FAFC);
    border-color: var(--color-text-light, #64748B);
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.animate-spin { animation: spin 0.8s linear infinite; }

button:focus-visible {
  outline: 2px solid var(--color-primary, #1860A8);
  outline-offset: 2px;
}
.select-none {
  -webkit-user-select: none;
  user-select: none;
}
</style>
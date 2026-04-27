<template>
  <section class="min-h-full space-y-6 bg-[var(--color-neutral,#F8FAFC)] p-4 md:p-6">
    <FinancePageHeader eyebrow="Client Finance" title="Refunds" description="Client refunds remain explicit. Each refund record creates a draft finance transaction and keeps the audit trail visible.">
      <template #actions><button type="button" class="inline-flex items-center justify-center rounded-2xl bg-[var(--color-accent,#000000)] px-5 py-3 text-sm font-semibold text-white" @click="showForm = !showForm">{{ showForm ? 'Close form' : 'Record refund' }}</button></template>
    </FinancePageHeader>

    <FinanceRefundForm v-if="showForm" :is-submitting="store.isLoading" @submit="submitRefund" @cancel="showForm = false" />
    <p v-if="store.error" class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{{ store.error }}</p>
    <FinanceStatePanel v-if="showLoadingState" tone="loading" eyebrow="Loading refunds" title="Loading refunds" message="Fetching refund rows for the active range." />
    <template v-else>
      <div class="grid gap-4 md:grid-cols-3">
        <FinanceKpiCard label="Refund rows" :value="String(store.refunds.length)" badge="refunds" hint="Refund rows loaded for the active range." />
        <FinanceKpiCard label="Total Refunded" :value="formatMoney(store.workFinanceMetrics.totalRefunds)" badge="outflow" tone="attention" hint="Cash returned to clients in the active range." />
        <FinanceKpiCard label="Net Collected" :value="formatMoney(store.workFinanceMetrics.netCollected)" badge="net" hint="Gross client collections less refunds." />
      </div>

      <FinanceStatePanel v-if="showEmptyState" eyebrow="Refunds" title="No refunds found" message="No refund rows were found for the active range." />
      <div v-else class="grid gap-5">
        <article v-for="refund in sortedRefunds" :key="refund.id" class="rounded-[28px] border border-[var(--color-neutral-dark,#E2E8F0)] bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.05)]">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div><div class="flex flex-wrap items-center gap-3"><p class="text-xl font-semibold text-[var(--color-text,#0F172A)]">{{ refund.refundCode }}</p><FinanceStatusBadge :status="refund.status || 'processed'" /></div><p class="mt-2 text-sm text-[var(--color-text-light,#64748B)]">{{ refund.clientLabel || refund.clientId }} · {{ refund.engagementCode || refund.engagementId }}</p><p class="mt-1 text-sm text-[var(--color-text-light,#64748B)]">{{ refund.reason || 'No refund reason recorded.' }}</p></div>
            <div class="grid gap-2 text-right text-sm text-[var(--color-text-light,#64748B)]"><p><span class="font-semibold text-[var(--color-text,#0F172A)]">{{ formatMoney(refund.amount, refund.currency || 'NAD') }}</span></p><p>{{ formatDate(refund.refundDate) }}</p><p>{{ refund.refundMethod || '—' }}</p><p>{{ refund.referenceNumber || 'No reference' }}</p></div>
          </div>
        </article>
      </div>
    </template>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import FinanceKpiCard from '../components/FinanceKpiCard.vue'
import FinancePageHeader from '../components/FinancePageHeader.vue'
import FinanceRefundForm from '../components/FinanceRefundForm.vue'
import FinanceStatePanel from '../components/FinanceStatePanel.vue'
import FinanceStatusBadge from '../components/FinanceStatusBadge.vue'
import { formatDate, formatMoney } from '../services/financeFormatters.js'
import { useFinanceAppStore } from '../stores/useFinanceAppStore.js'

const store = useFinanceAppStore()
store.ensureReady('refunds')
const showForm = ref(false)
const showLoadingState = computed(() => store.isLoading && !store.refunds.length)
const showEmptyState = computed(() => !store.isLoading && !store.error && !store.refunds.length)
const sortedRefunds = computed(() => [...store.refunds].sort((a, b) => String(b.refundDate || '').localeCompare(String(a.refundDate || ''))))

async function submitRefund(payload) {
  try {
    await store.recordRefund(payload)
    showForm.value = false
  } catch {
    // Store error already set.
  }
}
</script>

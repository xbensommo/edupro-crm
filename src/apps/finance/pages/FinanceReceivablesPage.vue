<template>
  <section class="min-h-full space-y-6 bg-[var(--color-neutral,#F8FAFC)] p-4 md:p-6">
    <FinancePageHeader eyebrow="Client Balances" title="Receivables" description="Open invoice balances and payment allocation control. This is the source for who owes what.">
      <template #actions>
        <button type="button" class="inline-flex items-center justify-center rounded-2xl bg-[var(--color-accent,#000000)] px-5 py-3 text-sm font-semibold text-white" @click="showAllocationForm = !showAllocationForm">{{ showAllocationForm ? 'Close allocation' : 'Allocate payment' }}</button>
      </template>
    </FinancePageHeader>

    <FinanceAllocationForm v-if="showAllocationForm" :payments="store.payments" :invoices="store.invoices" :is-submitting="store.isLoading" @submit="submitAllocation" @cancel="showAllocationForm = false" />
    <p v-if="store.error" class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{{ store.error }}</p>

    <div class="grid gap-4 md:grid-cols-4">
      <FinanceKpiCard label="Total invoiced" :value="formatMoney(report.totalInvoiced)" badge="invoice" hint="All active invoices in range." />
      <FinanceKpiCard label="Allocated" :value="formatMoney(report.totalAllocated)" badge="paid" hint="Payments applied to invoices." />
      <FinanceKpiCard label="Outstanding" :value="formatMoney(report.totalOutstanding)" badge="balance" hint="Open client balance." />
      <FinanceKpiCard label="Overdue invoices" :value="String(report.overdueCount)" badge="risk" hint="Due date before today with balance." />
    </div>

    <FinanceStatePanel v-if="showLoadingState" tone="loading" eyebrow="Loading receivables" title="Loading receivables" message="Fetching invoices, payments, and allocations." />
    <FinanceStatePanel v-else-if="!report.openRows.length" eyebrow="Receivables" title="No outstanding balances" message="There are no open invoice balances in the active range." />

    <div v-else class="grid gap-5">
      <article v-for="row in report.openRows" :key="row.invoiceId" class="rounded-[28px] border border-[var(--color-neutral-dark,#E2E8F0)] bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.05)]">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div class="flex flex-wrap items-center gap-3">
              <p class="text-xl font-semibold text-[var(--color-text,#0F172A)]">{{ row.invoiceCode }}</p>
              <FinanceStatusBadge :status="row.status" />
            </div>
            <p class="mt-2 text-sm text-[var(--color-text-light,#64748B)]">{{ row.clientLabel }} · {{ row.engagementCode || 'No engagement' }}</p>
          </div>
          <div class="grid gap-2 text-right text-sm text-[var(--color-text-light,#64748B)]">
            <p>Total <span class="font-semibold text-[var(--color-text,#0F172A)]">{{ formatMoney(row.totalAmount, row.currency) }}</span></p>
            <p>Allocated {{ formatMoney(row.allocatedAmount, row.currency) }}</p>
            <p>Balance {{ formatMoney(row.balanceAmount, row.currency) }}</p>
            <p>Due {{ formatDate(row.dueDate) }}</p>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import FinanceAllocationForm from '../components/FinanceAllocationForm.vue'
import FinanceKpiCard from '../components/FinanceKpiCard.vue'
import FinancePageHeader from '../components/FinancePageHeader.vue'
import FinanceStatePanel from '../components/FinanceStatePanel.vue'
import FinanceStatusBadge from '../components/FinanceStatusBadge.vue'
import { formatDate, formatMoney } from '../services/financeFormatters.js'
import { useFinanceAppStore } from '../stores/useFinanceAppStore.js'

const store = useFinanceAppStore()
store.ensureReady('receivables')

const showAllocationForm = ref(false)
const report = computed(() => store.receivablesReport)
const showLoadingState = computed(() => store.isLoading && !store.invoices.length)

async function submitAllocation(payload) {
  try {
    await store.allocatePaymentToInvoice(payload)
    showAllocationForm.value = false
  } catch {
    // Store error already set.
  }
}
</script>

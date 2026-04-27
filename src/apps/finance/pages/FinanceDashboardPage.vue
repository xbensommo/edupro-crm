<template>
  <section class="min-h-full space-y-6 bg-[var(--color-neutral,#F8FAFC)] p-4 md:p-6">
    <FinancePageHeader eyebrow="EduProLIC Finance" title="Finance dashboard" description="Real finance control for EduProLIC. Payments, refunds, commission accrual, consultant payouts, and expenses all feed the ledger.">
      <template #actions>
        <RouterLink to="/finance/reports" class="inline-flex items-center justify-center rounded-2xl bg-[var(--color-accent,#000000)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90">Open reports</RouterLink>
      </template>
    </FinancePageHeader>

    <p v-if="store.error" class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{{ store.error }}</p>
    <FinanceStatePanel v-if="showLoadingState" tone="loading" eyebrow="Loading" title="Loading finance dashboard" message="Fetching finance records and book summaries for the active range." />

    <template v-else>
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <FinanceKpiCard label="Cash Received" :value="formatMoney(store.dashboardMetrics.totalReceived)" badge="payments" hint="Payments already logged in finance." />
        <FinanceKpiCard label="Refunds" :value="formatMoney(store.dashboardMetrics.totalRefunds)" badge="refunds" tone="attention" hint="Money returned to clients." />
        <FinanceKpiCard label="Outstanding Client Balance" :value="formatMoney(store.dashboardMetrics.totalOutstanding)" badge="receivables" tone="attention" hint="Work revenue less net cash collected." />
        <FinanceKpiCard label="Net Income" :value="formatMoney(store.dashboardMetrics.netIncome)" badge="current" :tone="store.dashboardMetrics.netIncome >= 0 ? 'positive' : 'attention'" hint="Posted revenue minus posted expense and refund impact." />
      </div>

      <div class="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <section class="space-y-6">
          <div class="rounded-[28px] border border-[var(--color-neutral-dark,#E2E8F0)] bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.05)]">
            <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"><div><p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-primary,#1860A8)]">EduProLIC operational finance</p><h2 class="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-text,#0F172A)]">Work and payment control</h2><p class="mt-2 max-w-2xl text-sm leading-7 text-[var(--color-text-light,#64748B)]">This dashboard stays real by reading only explicit queries.</p></div></div>
            <div class="mt-6 grid gap-4 md:grid-cols-4">
              <RouterLink to="/finance/payments" class="rounded-[24px] border border-[var(--color-neutral-dark,#E2E8F0)] bg-[var(--color-background,#FFFFFF)] p-5 transition hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(15,23,42,0.08)]"><p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-text-light,#64748B)]">Payments</p><p class="mt-4 text-lg font-semibold text-[var(--color-text,#0F172A)]">{{ formatMoney(store.workFinanceMetrics.totalReceived) }}</p><p class="mt-2 text-sm text-[var(--color-text-light,#64748B)]">Log client collections.</p></RouterLink>
              <RouterLink to="/finance/refunds" class="rounded-[24px] border border-[var(--color-neutral-dark,#E2E8F0)] bg-[var(--color-background,#FFFFFF)] p-5 transition hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(15,23,42,0.08)]"><p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-text-light,#64748B)]">Refunds</p><p class="mt-4 text-lg font-semibold text-[var(--color-text,#0F172A)]">{{ formatMoney(store.workFinanceMetrics.totalRefunds) }}</p><p class="mt-2 text-sm text-[var(--color-text-light,#64748B)]">Track returned client funds.</p></RouterLink>
              <RouterLink to="/finance/payouts" class="rounded-[24px] border border-[var(--color-neutral-dark,#E2E8F0)] bg-[var(--color-background,#FFFFFF)] p-5 transition hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(15,23,42,0.08)]"><p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-text-light,#64748B)]">Payouts</p><p class="mt-4 text-lg font-semibold text-[var(--color-text,#0F172A)]">{{ formatMoney(store.workFinanceMetrics.unpaidCommission) }}</p><p class="mt-2 text-sm text-[var(--color-text-light,#64748B)]">Clear consultant balances.</p></RouterLink>
              <RouterLink to="/finance/reports" class="rounded-[24px] border border-[var(--color-neutral-dark,#E2E8F0)] bg-[var(--color-background,#FFFFFF)] p-5 transition hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(15,23,42,0.08)]"><p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-text-light,#64748B)]">Reports</p><p class="mt-4 text-lg font-semibold text-[var(--color-text,#0F172A)]">{{ formatMoney(store.dashboardMetrics.netIncome) }}</p><p class="mt-2 text-sm text-[var(--color-text-light,#64748B)]">Open accounting statements.</p></RouterLink>
            </div>
          </div>

          <FinanceStatementTable title="Recent ledger entries" description="Latest posted or derived ledger entries affecting reports." :rows="ledgerRows" :columns="ledgerColumns" />
        </section>

        <section class="space-y-6">
          <div class="rounded-[28px] border border-[var(--color-neutral-dark,#E2E8F0)] bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.05)]">
            <p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-primary,#1860A8)]">Operational totals</p>
            <h2 class="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-text,#0F172A)]">EduProLIC snapshot</h2>
            <div class="mt-6 space-y-4">
              <div class="rounded-[22px] bg-[var(--color-neutral,#F8FAFC)] p-5"><p class="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-text-light,#64748B)]">Quoted Work</p><p class="mt-2 text-2xl font-semibold text-[var(--color-text,#0F172A)]">{{ formatMoney(store.workFinanceMetrics.totalQuoted) }}</p></div>
              <div class="rounded-[22px] bg-[var(--color-neutral,#F8FAFC)] p-5"><p class="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-text-light,#64748B)]">Net Collected</p><p class="mt-2 text-2xl font-semibold text-[var(--color-text,#0F172A)]">{{ formatMoney(store.workFinanceMetrics.netCollected) }}</p></div>
              <div class="rounded-[22px] bg-[var(--color-neutral,#F8FAFC)] p-5"><p class="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-text-light,#64748B)]">Consultant Payouts</p><p class="mt-2 text-2xl font-semibold text-[var(--color-text,#0F172A)]">{{ formatMoney(store.workFinanceMetrics.totalPayouts) }}</p></div>
            </div>
          </div>

          <div class="rounded-[28px] border border-[var(--color-neutral-dark,#E2E8F0)] bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.05)]">
            <p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-primary,#1860A8)]">Period controls</p>
            <h2 class="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-text,#0F172A)]">Accounting periods</h2>
            <FinanceStatePanel v-if="!store.periods.length && !store.isLoading" eyebrow="Periods" title="No accounting periods loaded" message="Load or seed finance periods so operational month closing can be controlled." />
            <div v-else class="mt-5 space-y-3">
              <div v-for="period in store.periods" :key="period.id" class="flex flex-col gap-4 rounded-[20px] border border-[var(--color-neutral-dark,#E2E8F0)] bg-[var(--color-background,#FFFFFF)] px-4 py-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p class="font-semibold text-[var(--color-text,#0F172A)]">{{ period.label }}</p>
                  <p class="mt-1 text-sm text-[var(--color-text-light,#64748B)]">{{ formatDate(period.startsOn) }} — {{ formatDate(period.endsOn) }}</p>
                </div>
                <div class="flex items-center gap-3">
                  <FinanceStatusBadge :status="period.status" />
                  <button v-if="period.status === 'open'" type="button" class="inline-flex items-center justify-center rounded-2xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-2 text-sm font-semibold text-[var(--color-text,#0F172A)] transition hover:bg-[var(--color-neutral,#F8FAFC)]" @click="promptClosePeriod(period)">Close period</button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </template>

    <FinanceConfirmDialog :open="Boolean(pendingPeriod)" title="Close accounting period" message="Closing a period locks operational posting for that range. Only close the period when all relevant transactions are reviewed and posted." confirm-text="Close period" :loading="isClosingPeriod" @cancel="cancelClosePeriod" @confirm="confirmClosePeriod" />
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import FinanceConfirmDialog from '../components/FinanceConfirmDialog.vue'
import FinanceKpiCard from '../components/FinanceKpiCard.vue'
import FinancePageHeader from '../components/FinancePageHeader.vue'
import FinanceStatePanel from '../components/FinanceStatePanel.vue'
import FinanceStatementTable from '../components/FinanceStatementTable.vue'
import FinanceStatusBadge from '../components/FinanceStatusBadge.vue'
import { formatDate, formatMoney } from '../services/financeFormatters.js'
import { useFinanceAppStore } from '../stores/useFinanceAppStore.js'

const store = useFinanceAppStore()
const pendingPeriod = ref(null)
const isClosingPeriod = ref(false)

store.ensureReady('dashboard')

const showLoadingState = computed(() => store.isLoading && !store.transactions.length && !store.periods.length)

const ledgerColumns = [
  { key: 'postedAt', label: 'Posted' },
  { key: 'reference', label: 'Reference' },
  { key: 'memo', label: 'Memo' },
  { key: 'totalDebit', label: 'Debit', format: 'currency' },
  { key: 'totalCredit', label: 'Credit', format: 'currency' },
]

const ledgerRows = computed(() => store.recentJournalEntries.map((entry) => ({
  id: entry.id,
  postedAt: formatDate(entry.postedAt),
  reference: entry.reference || entry.transactionId,
  memo: entry.memo || entry.transactionType,
  totalDebit: entry.totalDebit,
  totalCredit: entry.totalCredit,
})))

function promptClosePeriod(period) {
  pendingPeriod.value = period
}

function cancelClosePeriod() {
  if (isClosingPeriod.value) return
  pendingPeriod.value = null
}

async function confirmClosePeriod() {
  if (!pendingPeriod.value) return
  isClosingPeriod.value = true
  try {
    await store.closePeriod(pendingPeriod.value)
    pendingPeriod.value = null
  } catch {
    // Store error already set.
  } finally {
    isClosingPeriod.value = false
  }
}
</script>

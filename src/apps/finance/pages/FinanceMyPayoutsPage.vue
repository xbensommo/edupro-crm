<template>
  <section class="min-h-full space-y-6 bg-[var(--color-neutral,#F8FAFC)] p-4 md:p-6">
    <FinancePageHeader eyebrow="Consultant Finance" title="My payouts" description="Consultant self-service payout visibility. This route shows only the current consultant's payout records." />

    <p v-if="store.error" class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{{ store.error }}</p>
    <FinanceStatePanel v-if="showLoadingState" tone="loading" eyebrow="Loading payouts" title="Loading my payouts" message="Fetching your payout records for the active range." />

    <template v-else>
      <div class="grid gap-4 md:grid-cols-3">
        <FinanceKpiCard label="My Payout Rows" :value="String(rows.length)" badge="rows" hint="Only your payout records are shown here." />
        <FinanceKpiCard label="Paid To Me" :value="formatMoney(totalPaid)" badge="paid" hint="Payout value already settled to you." />
        <FinanceKpiCard label="Still Outstanding" :value="formatMoney(totalBalance)" badge="balance" tone="attention" hint="Balance still not paid to you." />
      </div>

      <FinanceStatePanel v-if="showEmptyState" eyebrow="My payouts" title="No payout records found" message="No payout rows were found for your account in the active range." />
      <div v-else class="grid gap-5">
        <article v-for="payout in rows" :key="payout.id" class="rounded-[28px] border border-[var(--color-neutral-dark,#E2E8F0)] bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.05)]">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div class="flex flex-wrap items-center gap-3">
                <p class="text-xl font-semibold text-[var(--color-text,#0F172A)]">{{ payout.payoutCode }}</p>
                <FinanceStatusBadge :status="payout.status || 'pending'" />
              </div>
              <p class="mt-2 text-sm text-[var(--color-text-light,#64748B)]">{{ payout.engagementCode || payout.engagementId }} · {{ payout.clientLabel || payout.clientId }}</p>
            </div>
            <div class="grid gap-2 text-right text-sm text-[var(--color-text-light,#64748B)]">
              <p>Share: <span class="font-semibold text-[var(--color-text,#0F172A)]">{{ formatMoney(payout.consultantShareAmount) }}</span></p>
              <p>Paid: <span class="font-semibold text-[var(--color-text,#0F172A)]">{{ formatMoney(payout.paidAmount || 0) }}</span></p>
              <p>Balance: <span class="font-semibold text-[var(--color-text,#0F172A)]">{{ formatMoney(payout.balanceAmount || 0) }}</span></p>
              <p>{{ formatDate(payout.payoutDate) }}</p>
            </div>
          </div>
        </article>
      </div>
    </template>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import FinanceKpiCard from '../components/FinanceKpiCard.vue'
import FinancePageHeader from '../components/FinancePageHeader.vue'
import FinanceStatePanel from '../components/FinanceStatePanel.vue'
import FinanceStatusBadge from '../components/FinanceStatusBadge.vue'
import { formatDate, formatMoney } from '../services/financeFormatters.js'
import { useFinanceAppStore } from '../stores/useFinanceAppStore.js'

const store = useFinanceAppStore()
store.ensureReady('my-payouts')

const rows = computed(() => [...store.payoutRowsForCurrentUser].sort((a, b) => String(b.payoutDate || '').localeCompare(String(a.payoutDate || ''))))
const totalPaid = computed(() => rows.value.reduce((sum, row) => sum + Number(row.paidAmount || 0), 0))
const totalBalance = computed(() => rows.value.reduce((sum, row) => sum + Number(row.balanceAmount || 0), 0))
const showLoadingState = computed(() => store.isLoading && !rows.value.length)
const showEmptyState = computed(() => !store.isLoading && !store.error && !rows.value.length)
</script>

<template>
  <section class="min-h-full space-y-6 bg-[var(--color-neutral,#F8FAFC)] p-4 md:p-6">
    <FinancePageHeader eyebrow="Consultant Finance" title="Consultant payouts" description="Payout control for EduProLIC. This view tracks what is owed, what was paid, and the remaining payout balance." />

    <FinancePayoutSettlementForm v-if="selectedPayout" :payout="selectedPayout" :is-submitting="store.isLoading" @submit="submitSettlement" @cancel="selectedPayout = null" />
    <p v-if="store.error" class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{{ store.error }}</p>
    <FinanceStatePanel v-if="showLoadingState" tone="loading" eyebrow="Loading payouts" title="Loading consultant payouts" message="Fetching payout rows for the active range." />

    <template v-else>
      <div class="rounded-[28px] border border-[var(--color-neutral-dark,#E2E8F0)] bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.05)]">
        <div class="grid gap-4 md:grid-cols-[minmax(0,1fr),220px] md:items-end">
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-primary,#1860A8)]">Consultant filter</p>
            <p class="mt-2 text-sm text-[var(--color-text-light,#64748B)]">Focus the payout page on one consultant without changing the underlying finance data.</p>
          </div>
          <label class="space-y-2">
            <span class="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-text-light,#64748B)]">Consultant</span>
            <select v-model="selectedConsultantId" class="w-full rounded-2xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-3 text-sm">
              <option value="all">All consultants</option>
              <option v-for="option in consultantOptions" :key="option.id" :value="option.id">{{ option.label }}</option>
            </select>
          </label>
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-3">
        <FinanceKpiCard label="Payout Records" :value="String(filteredPayouts.length)" badge="volume" hint="Payout rows matching the current consultant filter." />
        <FinanceKpiCard label="Paid Out" :value="formatMoney(filteredPaidOut)" badge="paid" hint="Consultant money already paid." />
        <FinanceKpiCard label="Unpaid Commission" :value="formatMoney(filteredUnpaid)" badge="unpaid" tone="attention" hint="Commission accrued but not fully paid yet." />
      </div>

      <FinanceStatePanel v-if="showEmptyState" eyebrow="Payouts" title="No payout rows found" message="No payout rows match the current consultant filter and active range." />
      <div v-else class="grid gap-5">
        <article v-for="payout in filteredPayouts" :key="payout.id" class="rounded-[28px] border border-[var(--color-neutral-dark,#E2E8F0)] bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.05)]">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div><div class="flex flex-wrap items-center gap-3"><p class="text-xl font-semibold text-[var(--color-text,#0F172A)]">{{ payout.payoutCode }}</p><FinanceStatusBadge :status="payout.status || 'pending'" /></div><p class="mt-2 text-sm text-[var(--color-text-light,#64748B)]">{{ payout.consultantLabel || payout.consultantId }} · {{ payout.engagementCode || payout.engagementId }}</p><p class="mt-1 text-sm text-[var(--color-text-light,#64748B)]">{{ payout.clientLabel || payout.clientId }}</p></div>
            <div class="grid gap-3 text-right text-sm text-[var(--color-text-light,#64748B)]"><p>Share: <span class="font-semibold text-[var(--color-text,#0F172A)]">{{ formatMoney(payout.consultantShareAmount) }}</span></p><p>Paid: <span class="font-semibold text-[var(--color-text,#0F172A)]">{{ formatMoney(payout.paidAmount || 0) }}</span></p><p>Balance: <span class="font-semibold text-[var(--color-text,#0F172A)]">{{ formatMoney(payout.balanceAmount || 0) }}</span></p><p>{{ formatDate(payout.payoutDate) }}</p><div class="pt-2"><button v-if="Number(payout.balanceAmount || 0) > 0" type="button" class="inline-flex items-center justify-center rounded-2xl bg-[var(--color-accent,#000000)] px-4 py-2 text-sm font-semibold text-white" @click="selectedPayout = payout">Mark paid</button></div></div>
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
import FinancePayoutSettlementForm from '../components/FinancePayoutSettlementForm.vue'
import FinanceStatePanel from '../components/FinanceStatePanel.vue'
import FinanceStatusBadge from '../components/FinanceStatusBadge.vue'
import { formatDate, formatMoney } from '../services/financeFormatters.js'
import { useFinanceAppStore } from '../stores/useFinanceAppStore.js'

const store = useFinanceAppStore()
store.ensureReady('payouts')
const selectedPayout = ref(null)
const selectedConsultantId = ref('all')

const showLoadingState = computed(() => store.isLoading && !store.consultantPayouts.length)
const consultantOptions = computed(() => {
  const seen = new Map()
  for (const payout of store.consultantPayouts) {
    const id = payout.consultantId
    if (!id || seen.has(id)) continue
    seen.set(id, { id, label: payout.consultantLabel || payout.consultantId })
  }
  return [...seen.values()].sort((a, b) => a.label.localeCompare(b.label))
})

const filteredPayouts = computed(() => {
  const consultantId = selectedConsultantId.value
  const rows = consultantId === 'all' ? store.consultantPayouts : store.consultantPayouts.filter((row) => row.consultantId === consultantId)
  return [...rows].sort((a, b) => String(b.payoutDate || '').localeCompare(String(a.payoutDate || '')))
})
const filteredPaidOut = computed(() => filteredPayouts.value.reduce((sum, row) => sum + Number(row.paidAmount || 0), 0))
const filteredUnpaid = computed(() => filteredPayouts.value.reduce((sum, row) => sum + Number(row.balanceAmount || 0), 0))
const showEmptyState = computed(() => !store.isLoading && !store.error && !filteredPayouts.value.length)

async function submitSettlement(payload) {
  if (!selectedPayout.value?.id) return
  try {
    await store.settleConsultantPayout(selectedPayout.value, {
      ...payload,
      shardDate: selectedPayout.value.payoutDate,
      existingPayoutDate: selectedPayout.value.payoutDate,
    })
    selectedPayout.value = null
  } catch {
    // Store error already set.
  }
}
</script>

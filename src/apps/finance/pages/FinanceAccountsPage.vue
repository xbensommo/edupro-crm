<template>
  <section class="min-h-full space-y-6 bg-[var(--color-neutral,#F8FAFC)] p-4 md:p-6">
    <FinancePageHeader eyebrow="Finance Setup" title="Chart of accounts" description="Finance accounts are structured for balance sheet, income statement, expense statement, and controlled posting rules." />

    <p v-if="store.error" class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{{ store.error }}</p>
    <FinanceStatePanel v-if="showLoadingState" tone="loading" eyebrow="Loading accounts" title="Loading chart of accounts" message="Fetching finance accounts used by posting and reporting." />
    <FinanceStatePanel v-else-if="showEmptyState" eyebrow="Accounts" title="No finance accounts found" message="Seed or create finance accounts before using books and posting." />

    <div v-else class="grid gap-6 xl:grid-cols-2">
      <section v-for="group in accountGroups" :key="group.key" class="rounded-[28px] border border-[var(--color-neutral-dark,#E2E8F0)] bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.05)]">
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-primary,#1860A8)]">{{ group.label }}</p>
            <h2 class="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-text,#0F172A)]">{{ group.rows.length }} accounts</h2>
          </div>
        </div>

        <div class="mt-6 space-y-3">
          <div v-for="account in group.rows" :key="account.id" class="flex items-center justify-between rounded-[20px] border border-[var(--color-neutral-dark,#E2E8F0)] bg-[var(--color-background,#FFFFFF)] px-4 py-4">
            <div>
              <p class="font-semibold text-[var(--color-text,#0F172A)]">{{ account.accountCode }}</p>
              <p class="mt-1 text-sm text-[var(--color-text-light,#64748B)]">{{ account.name }}</p>
            </div>
            <div class="text-right">
              <p class="text-xs uppercase tracking-[0.24em] text-[var(--color-text-light,#64748B)]">{{ account.subType || account.type }}</p>
              <p class="mt-2 text-sm font-medium text-[var(--color-text,#0F172A)]">{{ account.normalSide || '—' }}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import FinancePageHeader from '../components/FinancePageHeader.vue'
import FinanceStatePanel from '../components/FinanceStatePanel.vue'
import { useFinanceAppStore } from '../stores/useFinanceAppStore.js'

const store = useFinanceAppStore()
store.ensureReady('accounts')

const showLoadingState = computed(() => store.isLoading && !store.accounts.length)
const showEmptyState = computed(() => !store.isLoading && !store.error && !store.accounts.length)

const labels = { asset: 'Assets', liability: 'Liabilities', equity: 'Equity', revenue: 'Revenue', expense: 'Expenses' }

const accountGroups = computed(() => Object.entries(labels).map(([key, label]) => ({
  key,
  label,
  rows: store.accounts.filter((account) => account.type === key).sort((a, b) => String(a.accountCode || '').localeCompare(String(b.accountCode || ''))),
})).filter((group) => group.rows.length > 0))
</script>

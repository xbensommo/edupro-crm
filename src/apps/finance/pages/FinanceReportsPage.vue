<template>
  <section class="min-h-full space-y-6 bg-[var(--color-neutral,#F8FAFC)] p-4 md:p-6">
    <FinancePageHeader eyebrow="EduProLIC Finance Reports" title="Statements and summaries" description="Every report below reads from posted or derived ledger entries. Operational totals help management, but financial statements remain accounting-first.">
      <template #actions>
        <FinanceExportButtons :disabled="store.isLoading || !store.hasBookData" @csv="exportCsv" @pdf="exportPdf" />
      </template>
    </FinancePageHeader>

    <FinanceBookRangeBar :range="store.activeBookRange" :mode="store.bookRangeMode" :label="store.bookRangeLabel" :loading="store.isLoading" @prev="store.shiftActiveBookRange(-1)" @next="store.shiftActiveBookRange(1)" @preset="applyPreset" @custom="store.setCustomBookRange($event)" />

    <p v-if="store.error" class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{{ store.error }}</p>
    <FinanceStatePanel v-if="showLoadingState" tone="loading" eyebrow="Loading books" title="Building statements" message="Loading accounts, transactions, and ledger history for the selected reporting period." />
    <FinanceStatePanel v-else-if="showEmptyState" eyebrow="Books" title="No book data for this period" message="No posted or derived ledger entries were found for the selected date range. Seed or post finance transactions first." />

    <template v-else>
      <div class="grid gap-5 xl:grid-cols-3">
        <RouterLink to="/finance/reports/balance-sheet" class="rounded-[28px] border border-[var(--color-neutral-dark,#E2E8F0)] bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.05)] transition hover:-translate-y-1 hover:shadow-[0_24px_56px_rgba(15,23,42,0.08)]"><p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-primary,#1860A8)]">Balance Sheet</p><h2 class="mt-3 text-2xl font-semibold tracking-tight text-[var(--color-text,#0F172A)]">{{ formatMoney(store.bookBalanceSheet.totalAssets) }}</h2><p class="mt-3 text-sm leading-7 text-[var(--color-text-light,#64748B)]">View assets, liabilities, and equity in one structured statement.</p></RouterLink>
        <RouterLink to="/finance/reports/income-statement" class="rounded-[28px] border border-[var(--color-neutral-dark,#E2E8F0)] bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.05)] transition hover:-translate-y-1 hover:shadow-[0_24px_56px_rgba(15,23,42,0.08)]"><p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-primary,#1860A8)]">Income Statement</p><h2 class="mt-3 text-2xl font-semibold tracking-tight text-[var(--color-text,#0F172A)]">{{ formatMoney(store.bookIncomeStatement.netIncome) }}</h2><p class="mt-3 text-sm leading-7 text-[var(--color-text-light,#64748B)]">Track revenue, consultant cost, refunds, and operating expense.</p></RouterLink>
        <RouterLink to="/finance/reports/expense-statement" class="rounded-[28px] border border-[var(--color-neutral-dark,#E2E8F0)] bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.05)] transition hover:-translate-y-1 hover:shadow-[0_24px_56px_rgba(15,23,42,0.08)]"><p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-primary,#1860A8)]">Expense Statement</p><h2 class="mt-3 text-2xl font-semibold tracking-tight text-[var(--color-text,#0F172A)]">{{ formatMoney(store.bookExpenseStatement.totalExpenses) }}</h2><p class="mt-3 text-sm leading-7 text-[var(--color-text-light,#64748B)]">Review operating and payout-related spend.</p></RouterLink>
      </div>

      <div class="grid gap-5 xl:grid-cols-4">
        <div class="rounded-[28px] border border-[var(--color-neutral-dark,#E2E8F0)] bg-white p-6"><p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-primary,#1860A8)]">Operational Total Received</p><h2 class="mt-3 text-2xl font-semibold tracking-tight text-[var(--color-text,#0F172A)]">{{ formatMoney(store.workFinanceMetrics.totalReceived) }}</h2></div>
        <div class="rounded-[28px] border border-[var(--color-neutral-dark,#E2E8F0)] bg-white p-6"><p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-primary,#1860A8)]">Refunds</p><h2 class="mt-3 text-2xl font-semibold tracking-tight text-[var(--color-text,#0F172A)]">{{ formatMoney(store.workFinanceMetrics.totalRefunds) }}</h2></div>
        <div class="rounded-[28px] border border-[var(--color-neutral-dark,#E2E8F0)] bg-white p-6"><p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-primary,#1860A8)]">Outstanding Client Balance</p><h2 class="mt-3 text-2xl font-semibold tracking-tight text-[var(--color-text,#0F172A)]">{{ formatMoney(store.workFinanceMetrics.totalOutstanding) }}</h2></div>
        <div class="rounded-[28px] border border-[var(--color-neutral-dark,#E2E8F0)] bg-white p-6"><p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-primary,#1860A8)]">Unpaid Consultant Commission</p><h2 class="mt-3 text-2xl font-semibold tracking-tight text-[var(--color-text,#0F172A)]">{{ formatMoney(store.workFinanceMetrics.unpaidCommission) }}</h2></div>
      </div>

      <FinanceStatementTable title="Trial balance" description="A quick control report to verify debit and credit totals remain aligned." :rows="store.bookTrialBalance.rows" :columns="trialBalanceColumns" total-label="Total debit" :total-value="store.bookTrialBalance.totalDebit" />
    </template>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import FinanceBookRangeBar from '../components/FinanceBookRangeBar.vue'
import FinanceExportButtons from '../components/FinanceExportButtons.vue'
import FinancePageHeader from '../components/FinancePageHeader.vue'
import FinanceStatePanel from '../components/FinanceStatePanel.vue'
import FinanceStatementTable from '../components/FinanceStatementTable.vue'
import { exportFinanceSectionsCsv, printFinanceSections } from '../services/financeExportService.js'
import { formatMoney } from '../services/financeFormatters.js'
import { useFinanceAppStore } from '../stores/useFinanceAppStore.js'

const store = useFinanceAppStore()
store.ensureReady('reports')

const showLoadingState = computed(() => store.isLoading && !store.hasBookData)
const showEmptyState = computed(() => !store.isLoading && !store.error && !store.hasBookData)

const trialBalanceColumns = [
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Account' },
  { key: 'debit', label: 'Debit', format: 'currency' },
  { key: 'credit', label: 'Credit', format: 'currency' },
]

function applyPreset(payload) {
  store.setBookPreset(payload.mode, payload.anchor)
}

function exportCsv() {
  exportFinanceSectionsCsv({
    filePrefix: 'trial-balance',
    title: 'Trial Balance',
    range: store.activeBookRange,
    rangeLabel: store.bookRangeLabel,
    sections: [
      { title: 'Trial Balance', columns: trialBalanceColumns, rows: store.bookTrialBalance.rows, totalLabel: 'Total debit', totalValue: store.bookTrialBalance.totalDebit },
    ],
  })
}

function exportPdf() {
  printFinanceSections({
    title: 'Trial Balance',
    subtitle: 'Debit and credit control report derived from posted or derived ledger entries.',
    rangeLabel: store.bookRangeLabel,
    summaryCards: [
      { label: 'Total debit', value: formatMoney(store.bookTrialBalance.totalDebit) },
      { label: 'Total credit', value: formatMoney(store.bookTrialBalance.totalCredit) },
    ],
    sections: [
      { title: 'Trial Balance', description: 'All balances shown as of the selected reporting end date.', columns: trialBalanceColumns, rows: store.bookTrialBalance.rows, totalLabel: 'Total debit', totalValue: store.bookTrialBalance.totalDebit },
    ],
  })
}
</script>

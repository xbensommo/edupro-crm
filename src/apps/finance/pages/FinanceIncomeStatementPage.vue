<template>
  <section class="min-h-full space-y-6 bg-[var(--color-neutral,#F8FAFC)] p-4 md:p-6">
    <FinancePageHeader eyebrow="Statement" title="Income statement" description="Revenue and expense performance for the selected reporting period.">
      <template #actions>
        <RouterLink to="/finance/reports" class="inline-flex items-center justify-center rounded-2xl border border-[var(--color-neutral-dark,#E2E8F0)] px-5 py-3 text-sm font-semibold text-[var(--color-text,#0F172A)] transition hover:bg-white">Back to reports</RouterLink>
        <FinanceExportButtons :disabled="store.isLoading || !store.hasBookData" @csv="exportCsv" @pdf="exportPdf" />
      </template>
    </FinancePageHeader>

    <FinanceBookRangeBar :range="store.activeBookRange" :mode="store.bookRangeMode" :label="store.bookRangeLabel" :loading="store.isLoading" @prev="store.shiftActiveBookRange(-1)" @next="store.shiftActiveBookRange(1)" @preset="applyPreset" @custom="store.setCustomBookRange($event)" />

    <p v-if="store.error" class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{{ store.error }}</p>
    <FinanceStatePanel v-if="showLoadingState" tone="loading" eyebrow="Loading books" title="Loading income statement" message="Calculating revenue and expense movement for the selected reporting period." />
    <FinanceStatePanel v-else-if="showEmptyState" eyebrow="Income statement" title="No ledger data for this period" message="No posted or derived ledger entries were found for the selected reporting period." />

    <template v-else>
      <div class="grid gap-6 xl:grid-cols-2">
        <FinanceStatementTable title="Revenue" description="Revenue accounts contributing to the current reporting position." :rows="store.bookIncomeStatement.revenueRows" :columns="columns" total-label="Total revenue" :total-value="store.bookIncomeStatement.revenue" />
        <FinanceStatementTable title="Expenses" description="Expense accounts recognized against revenue." :rows="store.bookIncomeStatement.expenseRows" :columns="columns" total-label="Total expenses" :total-value="store.bookIncomeStatement.expenses" />
      </div>

      <div class="rounded-[28px] border border-[var(--color-neutral-dark,#E2E8F0)] bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.05)]">
        <p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-primary,#1860A8)]">Net result</p>
        <h2 class="mt-2 text-3xl font-semibold tracking-tight text-[var(--color-text,#0F172A)]">{{ formatMoney(store.bookIncomeStatement.netIncome) }}</h2>
      </div>
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

const columns = [
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Account' },
  { key: 'amount', label: 'Amount', format: 'currency' },
]

function applyPreset(payload) {
  store.setBookPreset(payload.mode, payload.anchor)
}

function exportCsv() {
  exportFinanceSectionsCsv({
    filePrefix: 'income-statement',
    title: 'Income Statement',
    range: store.activeBookRange,
    rangeLabel: store.bookRangeLabel,
    sections: [
      { title: 'Revenue', columns, rows: store.bookIncomeStatement.revenueRows, totalLabel: 'Total revenue', totalValue: store.bookIncomeStatement.revenue },
      { title: 'Expenses', columns, rows: store.bookIncomeStatement.expenseRows, totalLabel: 'Total expenses', totalValue: store.bookIncomeStatement.expenses },
    ],
  })
}

function exportPdf() {
  printFinanceSections({
    title: 'Income Statement',
    subtitle: 'Revenue and expense performance for the selected reporting period.',
    rangeLabel: store.bookRangeLabel,
    summaryCards: [
      { label: 'Revenue', value: formatMoney(store.bookIncomeStatement.revenue) },
      { label: 'Expenses', value: formatMoney(store.bookIncomeStatement.expenses) },
      { label: 'Net income', value: formatMoney(store.bookIncomeStatement.netIncome) },
    ],
    sections: [
      { title: 'Revenue', description: 'Revenue accounts contributing to the reporting period.', columns, rows: store.bookIncomeStatement.revenueRows, totalLabel: 'Total revenue', totalValue: store.bookIncomeStatement.revenue },
      { title: 'Expenses', description: 'Expense accounts recognized against revenue.', columns, rows: store.bookIncomeStatement.expenseRows, totalLabel: 'Total expenses', totalValue: store.bookIncomeStatement.expenses },
    ],
  })
}
</script>

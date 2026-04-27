<template>
  <section class="min-h-full space-y-6 bg-[var(--color-neutral,#F8FAFC)] p-4 md:p-6">
    <FinancePageHeader eyebrow="Statement" title="Expense statement" description="Expense accounts grouped for cleaner operational cost analysis.">
      <template #actions>
        <RouterLink to="/finance/reports" class="inline-flex items-center justify-center rounded-2xl border border-[var(--color-neutral-dark,#E2E8F0)] px-5 py-3 text-sm font-semibold text-[var(--color-text,#0F172A)] transition hover:bg-white">Back to reports</RouterLink>
        <FinanceExportButtons :disabled="store.isLoading || !store.hasBookData" @csv="exportCsv" @pdf="exportPdf" />
      </template>
    </FinancePageHeader>

    <FinanceBookRangeBar :range="store.activeBookRange" :mode="store.bookRangeMode" :label="store.bookRangeLabel" :loading="store.isLoading" @prev="store.shiftActiveBookRange(-1)" @next="store.shiftActiveBookRange(1)" @preset="applyPreset" @custom="store.setCustomBookRange($event)" />

    <p v-if="store.error" class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{{ store.error }}</p>
    <FinanceStatePanel v-if="showLoadingState" tone="loading" eyebrow="Loading books" title="Loading expense statement" message="Calculating expense movement for the selected reporting period." />
    <FinanceStatePanel v-else-if="showEmptyState" eyebrow="Expense statement" title="No expense data for this period" message="No posted or derived ledger entries were found for the selected reporting period." />

    <template v-else>
      <FinanceStatementTable title="Expense accounts" description="Cost movement by expense account, derived from posted or derived ledger entries only." :rows="store.bookExpenseStatement.rows" :columns="columns" total-label="Total expenses" :total-value="store.bookExpenseStatement.totalExpenses" />
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
  { key: 'name', label: 'Expense Account' },
  { key: 'amount', label: 'Amount', format: 'currency' },
]

function applyPreset(payload) {
  store.setBookPreset(payload.mode, payload.anchor)
}

function exportCsv() {
  exportFinanceSectionsCsv({
    filePrefix: 'expense-statement',
    title: 'Expense Statement',
    range: store.activeBookRange,
    rangeLabel: store.bookRangeLabel,
    sections: [
      { title: 'Expense accounts', columns, rows: store.bookExpenseStatement.rows, totalLabel: 'Total expenses', totalValue: store.bookExpenseStatement.totalExpenses },
    ],
  })
}

function exportPdf() {
  printFinanceSections({
    title: 'Expense Statement',
    subtitle: 'Expense movement for the selected reporting period.',
    rangeLabel: store.bookRangeLabel,
    summaryCards: [{ label: 'Total expenses', value: formatMoney(store.bookExpenseStatement.totalExpenses) }],
    sections: [
      { title: 'Expense accounts', description: 'Cost movement by expense account, derived from posted or derived ledger entries only.', columns, rows: store.bookExpenseStatement.rows, totalLabel: 'Total expenses', totalValue: store.bookExpenseStatement.totalExpenses },
    ],
  })
}
</script>

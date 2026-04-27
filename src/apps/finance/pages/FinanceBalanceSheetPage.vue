<template>
  <section class="min-h-full space-y-6 bg-[var(--color-neutral,#F8FAFC)] p-4 md:p-6">
    <FinancePageHeader eyebrow="Statement" title="Balance sheet" description="Assets, liabilities, and equity generated from posted or derived finance entries.">
      <template #actions>
        <RouterLink to="/finance/reports" class="inline-flex items-center justify-center rounded-2xl border border-[var(--color-neutral-dark,#E2E8F0)] px-5 py-3 text-sm font-semibold text-[var(--color-text,#0F172A)] transition hover:bg-white">Back to reports</RouterLink>
        <FinanceExportButtons :disabled="store.isLoading || !store.hasBookData" @csv="exportCsv" @pdf="exportPdf" />
      </template>
    </FinancePageHeader>

    <FinanceBookRangeBar :range="store.activeBookRange" :mode="store.bookRangeMode" :label="store.bookRangeLabel" :loading="store.isLoading" @prev="store.shiftActiveBookRange(-1)" @next="store.shiftActiveBookRange(1)" @preset="applyPreset" @custom="store.setCustomBookRange($event)" />

    <p v-if="store.error" class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{{ store.error }}</p>
    <FinanceStatePanel v-if="showLoadingState" tone="loading" eyebrow="Loading books" title="Loading balance sheet" message="Calculating assets, liabilities, and equity as of the selected end date." />
    <FinanceStatePanel v-else-if="showEmptyState" eyebrow="Balance sheet" title="No balance data available" message="No posted or derived ledger entries were found for the selected end date." />

    <template v-else>
      <div class="grid gap-6 xl:grid-cols-2">
        <FinanceStatementTable title="Assets" description="Current and non-current assets recognized by the ledger." :rows="store.bookBalanceSheet.assets" :columns="columns" total-label="Total assets" :total-value="store.bookBalanceSheet.totalAssets" />
        <div class="space-y-6">
          <FinanceStatementTable title="Liabilities" description="Amounts owed or payable from posted finance events." :rows="store.bookBalanceSheet.liabilities" :columns="columns" total-label="Total liabilities" :total-value="store.bookBalanceSheet.totalLiabilities" />
          <FinanceStatementTable title="Equity" description="Owner and retained finance position recognized in the ledger." :rows="store.bookBalanceSheet.equity" :columns="columns" total-label="Total equity" :total-value="store.bookBalanceSheet.totalEquity" />
        </div>
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
    filePrefix: 'balance-sheet',
    title: 'Balance Sheet',
    range: store.activeBookRange,
    rangeLabel: `${store.bookRangeLabel} (as of ${store.activeBookRange.to})`,
    sections: [
      { title: 'Assets', columns, rows: store.bookBalanceSheet.assets, totalLabel: 'Total assets', totalValue: store.bookBalanceSheet.totalAssets },
      { title: 'Liabilities', columns, rows: store.bookBalanceSheet.liabilities, totalLabel: 'Total liabilities', totalValue: store.bookBalanceSheet.totalLiabilities },
      { title: 'Equity', columns, rows: store.bookBalanceSheet.equity, totalLabel: 'Total equity', totalValue: store.bookBalanceSheet.totalEquity },
    ],
  })
}

function exportPdf() {
  printFinanceSections({
    title: 'Balance Sheet',
    subtitle: 'Position statement shown as of the selected reporting end date.',
    rangeLabel: `${store.bookRangeLabel} (as of ${store.activeBookRange.to})`,
    summaryCards: [
      { label: 'Total assets', value: formatMoney(store.bookBalanceSheet.totalAssets) },
      { label: 'Total liabilities', value: formatMoney(store.bookBalanceSheet.totalLiabilities) },
      { label: 'Total equity', value: formatMoney(store.bookBalanceSheet.totalEquity) },
    ],
    sections: [
      { title: 'Assets', description: 'Current and non-current assets recognized by the ledger.', columns, rows: store.bookBalanceSheet.assets, totalLabel: 'Total assets', totalValue: store.bookBalanceSheet.totalAssets },
      { title: 'Liabilities', description: 'Amounts owed or payable from posted finance events.', columns, rows: store.bookBalanceSheet.liabilities, totalLabel: 'Total liabilities', totalValue: store.bookBalanceSheet.totalLiabilities },
      { title: 'Equity', description: 'Owner and retained position recognized in the ledger.', columns, rows: store.bookBalanceSheet.equity, totalLabel: 'Total equity', totalValue: store.bookBalanceSheet.totalEquity },
    ],
  })
}
</script>

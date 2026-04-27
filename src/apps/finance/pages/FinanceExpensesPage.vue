<template>
  <section class="min-h-full space-y-6 bg-[var(--color-neutral,#F8FAFC)] p-4 md:p-6">
    <FinancePageHeader eyebrow="Operational Finance" title="Expenses" description="Expenses captured for EduProLIC operations. These records create draft finance transactions before they are posted to the ledger.">
      <template #actions><button type="button" class="inline-flex items-center justify-center rounded-2xl bg-[var(--color-accent,#000000)] px-5 py-3 text-sm font-semibold text-white" @click="showForm = !showForm">{{ showForm ? 'Close form' : 'Record expense' }}</button></template>
    </FinancePageHeader>

    <FinanceExpenseForm v-if="showForm" :is-submitting="store.isLoading" @submit="submitExpense" @cancel="showForm = false" />
    <p v-if="store.error" class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{{ store.error }}</p>
    <FinanceStatePanel v-if="showLoadingState" tone="loading" eyebrow="Loading expenses" title="Loading expenses" message="Fetching expense rows for the active range." />
    <template v-else>
      <div class="grid gap-4 md:grid-cols-3">
        <FinanceKpiCard label="Expenses in Range" :value="String(store.expenses.length)" badge="volume" hint="Records loaded for the active range." />
        <FinanceKpiCard label="Total Expenses" :value="formatMoney(store.workFinanceMetrics.totalExpenses)" badge="expense" hint="Operational spend recorded in range." />
        <FinanceKpiCard label="Posted Expense Statement" :value="formatMoney(store.expenseStatement.totalExpenses)" badge="statement" hint="Expense value already reflected in the ledger." />
      </div>

      <FinanceStatePanel v-if="showEmptyState" eyebrow="Expenses" title="No expenses found" message="No expense rows were found for the active range." />
      <div v-else class="grid gap-5">
        <article v-for="expense in sortedExpenses" :key="expense.id" class="rounded-[28px] border border-[var(--color-neutral-dark,#E2E8F0)] bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.05)]">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div><div class="flex flex-wrap items-center gap-3"><p class="text-xl font-semibold text-[var(--color-text,#0F172A)]">{{ expense.expenseCode }}</p><FinanceStatusBadge :status="expense.status || 'recorded'" /></div><p class="mt-2 text-sm text-[var(--color-text-light,#64748B)]">{{ expense.description }}</p><p class="mt-1 text-sm text-[var(--color-text-light,#64748B)]">{{ expense.vendorName || 'No vendor' }} · {{ expense.category }}</p></div>
            <div class="grid gap-2 text-right text-sm text-[var(--color-text-light,#64748B)]"><p><span class="font-semibold text-[var(--color-text,#0F172A)]">{{ formatMoney(expense.amount, expense.currency || 'NAD') }}</span></p><p>{{ formatDate(expense.expenseDate) }}</p><p>{{ expense.paymentMethod || '—' }}</p><p>{{ expense.referenceNumber || 'No reference' }}</p></div>
          </div>
        </article>
      </div>
    </template>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import FinanceExpenseForm from '../components/FinanceExpenseForm.vue'
import FinanceKpiCard from '../components/FinanceKpiCard.vue'
import FinancePageHeader from '../components/FinancePageHeader.vue'
import FinanceStatePanel from '../components/FinanceStatePanel.vue'
import FinanceStatusBadge from '../components/FinanceStatusBadge.vue'
import { formatDate, formatMoney } from '../services/financeFormatters.js'
import { useFinanceAppStore } from '../stores/useFinanceAppStore.js'

const store = useFinanceAppStore()
store.ensureReady('expenses')
const showForm = ref(false)
const showLoadingState = computed(() => store.isLoading && !store.expenses.length)
const showEmptyState = computed(() => !store.isLoading && !store.error && !store.expenses.length)
const sortedExpenses = computed(() => [...store.expenses].sort((a, b) => String(b.expenseDate || '').localeCompare(String(a.expenseDate || ''))))

async function submitExpense(payload) {
  try {
    await store.recordExpense(payload)
    showForm.value = false
  } catch {
    // Store error already set.
  }
}
</script>

<template>
  <section class="min-h-full space-y-6 bg-[var(--color-neutral,#F8FAFC)] p-4 md:p-6">
    <FinancePageHeader
      eyebrow="Finance Workflow"
      title="Transactions"
      description="Move finance records through draft, review, post, and reversal states without breaking the ledger source of truth."
    />

    <FinanceFilterBar
      :search="store.filters.search"
      :status="store.filters.status"
      :type="store.filters.type"
      :status-options="statusOptions"
      :type-options="typeOptions"
      @update:search="store.setFilters({ search: $event })"
      @update:status="store.setFilters({ status: $event })"
      @update:type="store.setFilters({ type: $event })"
    />

    <div class="grid gap-5">
      <article
        v-for="transaction in store.filteredTransactions"
        :key="transaction.id"
        class="rounded-[28px] border border-[var(--color-neutral-dark,#E2E8F0)] bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.05)]"
      >
        <div class="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div class="space-y-4">
            <div class="flex flex-wrap items-center gap-3">
              <p class="text-xl font-semibold text-[var(--color-text,#0F172A)]">
                {{ transaction.reference || transaction.id }}
              </p>
              <FinanceStatusBadge :status="transaction.status" />
              <span class="inline-flex rounded-full bg-[var(--color-neutral,#F8FAFC)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-text-light,#64748B)]">
                {{ transaction.type }}
              </span>
            </div>

            <p class="max-w-3xl text-sm leading-7 text-[var(--color-text-light,#64748B)]">
              {{ transaction.memo || 'No memo provided.' }}
            </p>

            <dl class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div>
                <dt class="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-light,#64748B)]">
                  Occurred On
                </dt>
                <dd class="mt-2 text-sm font-medium text-[var(--color-text,#0F172A)]">
                  {{ formatDate(transaction.occurredOn) }}
                </dd>
              </div>
              <div>
                <dt class="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-light,#64748B)]">
                  Amount
                </dt>
                <dd class="mt-2 text-sm font-medium text-[var(--color-text,#0F172A)]">
                  {{ formatMoney(transaction.amount, transaction.currency || 'NAD') }}
                </dd>
              </div>
              <div>
                <dt class="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-light,#64748B)]">
                  Client / Consultant
                </dt>
                <dd class="mt-2 text-sm font-medium text-[var(--color-text,#0F172A)]">
                  {{ transaction.clientLabel || transaction.consultantLabel || '—' }}
                </dd>
              </div>
              <div>
                <dt class="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-light,#64748B)]">
                  Ledger Link
                </dt>
                <dd class="mt-2 text-sm font-medium text-[var(--color-text,#0F172A)]">
                  {{ transaction.postedJournalEntryId || transaction.reversalJournalEntryId || 'Not yet posted' }}
                </dd>
              </div>
            </dl>
          </div>

          <div class="w-full max-w-md">
            <FinanceActionPanel
              :title="actionTitle(transaction)"
              :description="actionDescription(transaction)"
              :show-review="transaction.status === 'draft'"
              :show-post="['draft', 'reviewed'].includes(transaction.status)"
              :confirm-action="null"
              @review="store.reviewTransaction(transaction.id)"
              @post="store.postTransaction(transaction.id)"
            />
          </div>
        </div>
      </article>
    </div>

    <div class="rounded-[28px] border border-[var(--color-neutral-dark,#E2E8F0)] bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.05)]">
      <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-primary,#1860A8)]">
            Ledger reversals
          </p>
          <h2 class="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-text,#0F172A)]">
            Posted entries
          </h2>
        </div>
      </div>

      <div class="mt-5 grid gap-4">
        <article
          v-for="entry in reversibleEntries"
          :key="entry.id"
          class="rounded-[22px] border border-[var(--color-neutral-dark,#E2E8F0)] bg-[var(--color-background,#FFFFFF)] p-5"
        >
          <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div class="flex flex-wrap items-center gap-3">
                <p class="font-semibold text-[var(--color-text,#0F172A)]">{{ entry.id }}</p>
                <FinanceStatusBadge :status="entry.status" />
              </div>
              <p class="mt-2 text-sm text-[var(--color-text-light,#64748B)]">
                {{ entry.memo || entry.transactionType }} · {{ formatDate(entry.postedAt) }}
              </p>
            </div>

            <div class="w-full max-w-md">
              <FinanceActionPanel
                title="Reverse entry"
                description="Use reversal instead of delete so the audit trail remains intact."
                :show-reverse="entry.status === 'posted' && !entry.reversedEntryId"
                @reverse="store.reverseJournalEntry(entry.id)"
              />
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup>
/**
 * @file src/apps/finance/pages/FinanceTransactionsPage.vue
 * @description Finance transactions and action flow.
 */

import { computed } from 'vue'
import { useHead } from '@unhead/vue'
import FinanceActionPanel from '../components/FinanceActionPanel.vue'
import FinanceFilterBar from '../components/FinanceFilterBar.vue'
import FinancePageHeader from '../components/FinancePageHeader.vue'
import FinanceStatusBadge from '../components/FinanceStatusBadge.vue'
import { formatDate, formatMoney } from '../services/financeFormatters.js'
import { useFinanceAppStore } from '../stores/useFinanceAppStore.js'

const store = useFinanceAppStore()
store.ensureReady()

useHead({
  title: 'Finance Transactions',
  meta: [
    {
      name: 'description',
      content: 'Review, post, and reverse finance transactions with a confirm-first workflow.',
    },
  ],
})

const statusOptions = ['draft', 'reviewed', 'posted', 'reversed', 'cancelled']
const typeOptions = ['payment', 'expense', 'payout', 'adjustment']

const reversibleEntries = computed(() => store.journalEntries.filter((entry) => entry.status === 'posted'))

function actionTitle(transaction) {
  if (transaction.status === 'draft') return 'Review or post draft'
  if (transaction.status === 'reviewed') return 'Post reviewed transaction'
  return 'No open action'
}

function actionDescription(transaction) {
  if (transaction.status === 'draft') {
    return 'Drafts can be reviewed first or posted directly by authorized finance staff.'
  }

  if (transaction.status === 'reviewed') {
    return 'This record is reviewed and ready to affect the ledger.'
  }

  return 'This record already reached a final finance state.'
}
</script>

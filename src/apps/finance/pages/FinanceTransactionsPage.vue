<template>
  <section class="min-h-full space-y-6 bg-[var(--color-neutral,#F8FAFC)] p-4 md:p-6">
    <FinancePageHeader eyebrow="Finance Controls" title="Transactions and posting" description="Review, post, reverse, or delete finance records from one operational queue." />

    <p v-if="store.error" class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{{ store.error }}</p>
    <FinanceStatePanel v-if="showLoadingState" tone="loading" eyebrow="Loading transactions" title="Loading transaction queue" message="Fetching finance transactions and ledger entries for review controls." />

    <template v-else>
      <!-- <FinanceFilterBar :filters="store.filters" :status-options="statusOptions" :type-options="typeOptions" @update="store.setFilters($event)" /> -->

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

      <FinanceStatePanel v-if="showEmptyState" eyebrow="Transactions" title="No transactions found" message="No finance transactions matched the current filters and active range." />
      <div v-else class="grid gap-5">
        <article v-for="transaction in store.filteredTransactions" :key="transaction.id" class="rounded-[28px] border border-[var(--color-neutral-dark,#E2E8F0)] bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.05)]">
          <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div class="space-y-3">
              <div class="flex flex-wrap items-center gap-3">
                <p class="text-xl font-semibold text-[var(--color-text,#0F172A)]">{{ transaction.reference || transaction.id }}</p>
                <FinanceStatusBadge :status="transaction.status" />
              </div>
              <p class="text-sm text-[var(--color-text-light,#64748B)]">{{ transaction.memo || 'No memo recorded' }}</p>
              <div class="grid gap-2 text-sm text-[var(--color-text-light,#64748B)] md:grid-cols-2 xl:grid-cols-3">
                <p>Type: <span class="font-medium text-[var(--color-text,#0F172A)]">{{ transaction.type }}</span></p>
                <p>Occurred: <span class="font-medium text-[var(--color-text,#0F172A)]">{{ formatDate(transaction.occurredOn) }}</span></p>
                <p>Amount: <span class="font-medium text-[var(--color-text,#0F172A)]">{{ formatMoney(transaction.amount, transaction.currency || 'NAD') }}</span></p>
                <p>Client: <span class="font-medium text-[var(--color-text,#0F172A)]">{{ transaction.clientLabel || transaction.clientId || '—' }}</span></p>
                <p>Consultant: <span class="font-medium text-[var(--color-text,#0F172A)]">{{ transaction.consultantLabel || transaction.consultantId || '—' }}</span></p>
                <p>Engagement: <span class="font-medium text-[var(--color-text,#0F172A)]">{{ transaction.engagementCode || transaction.engagementId || '—' }}</span></p>
              </div>
            </div>

            <div class="w-full max-w-md">
              <FinanceActionPanel :title="actionTitle(transaction)" :description="actionDescription(transaction)" :show-review="transaction.status === 'draft'" :show-post="transaction.status === 'draft' || transaction.status === 'reviewed'" :show-delete="transaction.status === 'draft'" @review="handleReview(transaction)" @post="handlePost(transaction)" @delete="handleDelete(transaction)" />
            </div>
          </div>
        </article>
      </div>

      <div class="rounded-[28px] border border-[var(--color-neutral-dark,#E2E8F0)] bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.05)]">
        <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-primary,#1860A8)]">Ledger reversals</p><h2 class="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-text,#0F172A)]">Posted entries</h2></div></div>
        <FinanceStatePanel v-if="!reversibleEntries.length && !store.isLoading" eyebrow="Ledger" title="No reversible entries found" message="No posted ledger entries are currently available for reversal." />
        <div v-else class="mt-5 grid gap-4">
          <article v-for="entry in reversibleEntries" :key="entry.id" class="rounded-[22px] border border-[var(--color-neutral-dark,#E2E8F0)] bg-[var(--color-background,#FFFFFF)] p-5">
            <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div><div class="flex flex-wrap items-center gap-3"><p class="font-semibold text-[var(--color-text,#0F172A)]">{{ entry.id }}</p><FinanceStatusBadge :status="entry.status" /></div><p class="mt-2 text-sm text-[var(--color-text-light,#64748B)]">{{ entry.memo || entry.transactionType }} · {{ formatDate(entry.postedAt) }}</p></div>
              <div class="w-full max-w-md"><FinanceActionPanel title="Reverse entry" description="Use reversal instead of delete so the audit trail remains intact." :show-reverse="entry.status === 'posted' && !entry.reversedEntryId" @reverse="handleReverse(entry)" /></div>
            </div>
          </article>
        </div>
      </div>
    </template>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import FinanceActionPanel from '../components/FinanceActionPanel.vue'
import FinanceFilterBar from '../components/FinanceFilterBar.vue'
import FinancePageHeader from '../components/FinancePageHeader.vue'
import FinanceStatePanel from '../components/FinanceStatePanel.vue'
import FinanceStatusBadge from '../components/FinanceStatusBadge.vue'
import { formatDate, formatMoney } from '../services/financeFormatters.js'
import { useFinanceAppStore } from '../stores/useFinanceAppStore.js'

const store = useFinanceAppStore()
store.ensureReady('transactions')

const showLoadingState = computed(() => store.isLoading && !store.transactions.length && !store.effectiveJournalEntries.length)
const showEmptyState = computed(() => !store.isLoading && !store.error && !store.filteredTransactions.length)

const statusOptions = ['draft', 'reviewed', 'posted', 'reversed', 'cancelled']
const typeOptions = ['work_revenue', 'client_payment', 'refund', 'consultant_commission_accrual', 'consultant_payout', 'commission_deduction', 'expense', 'adjustment']
const reversibleEntries = computed(() => store.effectiveJournalEntries.filter((entry) => entry.status === 'posted'))

function actionTitle(transaction) { if (transaction.status === 'draft') return 'Draft controls'; if (transaction.status === 'reviewed') return 'Post reviewed transaction'; return 'No open action' }
function actionDescription(transaction) { if (transaction.status === 'draft') return 'Drafts can be reviewed, posted, or removed before they reach the ledger.'; if (transaction.status === 'reviewed') return 'This record is reviewed and ready to affect the ledger.'; return 'This record already reached a final finance state.' }

async function handleReview(transaction) { try { await store.reviewTransaction(transaction) } catch {} }
async function handlePost(transaction) { try { await store.postTransaction(transaction) } catch {} }
async function handleDelete(transaction) { try { await store.deleteDraftTransaction(transaction) } catch {} }
async function handleReverse(entry) { try { await store.reverseJournalEntry(entry) } catch {} }
</script>

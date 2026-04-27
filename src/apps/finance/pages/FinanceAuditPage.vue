<template>
  <section class="min-h-full space-y-6 bg-[var(--color-neutral,#F8FAFC)] p-4 md:p-6">
    <FinancePageHeader eyebrow="Governance" title="Finance audit" description="Immutable audit trail for invoice, posting, reversal, allocation, payout, expense, and period-close actions." />
    <p v-if="store.error" class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{{ store.error }}</p>
    <FinanceStatePanel v-if="showLoadingState" tone="loading" eyebrow="Loading audit" title="Loading audit logs" message="Fetching finance audit logs for the active range." />
    <FinanceStatePanel v-else-if="!store.auditLogs.length" eyebrow="Audit" title="No audit logs found" message="Audit logs will appear after guarded finance commands are executed." />

    <div v-else class="grid gap-4">
      <article v-for="item in sortedAuditLogs" :key="item.id || item.auditCode" class="rounded-[24px] border border-[var(--color-neutral-dark,#E2E8F0)] bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.04)]">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p class="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-primary,#1860A8)]">{{ item.action }}</p>
            <h3 class="mt-2 text-lg font-semibold text-[var(--color-text,#0F172A)]">{{ item.entityLabel || item.entityId || item.entityType }}</h3>
            <p class="mt-2 text-sm text-[var(--color-text-light,#64748B)]">{{ item.actorName || item.actorId || 'System' }} · {{ item.reason || 'No reason recorded' }}</p>
          </div>
          <div class="text-right text-sm text-[var(--color-text-light,#64748B)]">
            <FinanceStatusBadge :status="item.outcome || 'success'" />
            <p class="mt-2">{{ formatDate(item.occurredAt) }}</p>
            <p>{{ item.entityType }}</p>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import FinancePageHeader from '../components/FinancePageHeader.vue'
import FinanceStatePanel from '../components/FinanceStatePanel.vue'
import FinanceStatusBadge from '../components/FinanceStatusBadge.vue'
import { formatDate } from '../services/financeFormatters.js'
import { useFinanceAppStore } from '../stores/useFinanceAppStore.js'

const store = useFinanceAppStore()
store.ensureReady('audit')

const showLoadingState = computed(() => store.isLoading && !store.auditLogs.length)
const sortedAuditLogs = computed(() => [...store.auditLogs].sort((a, b) => String(b.occurredAt || '').localeCompare(String(a.occurredAt || ''))))
</script>

<template>
  <aside class="card overflow-hidden">
    <div class="absolute inset-x-6 top-0 h-px bg-brand-gradient opacity-70"></div>

    <div class="space-y-3">
      <p class="section-label">Client Summary</p>
      <div class="space-y-1">
        <h2 class="section-title">{{ headline }}</h2>
        <p class="text-sm text-muted"><b>Client Ref Number:</b> {{ client.clientNumber || 'No client number' }}</p>
        <p class="text-sm text-muted">{{ client.fieldOfStudy || 'No Field Of Study' }}</p>
      </div>
    </div>

    <dl class="mt-6 space-y-4 text-sm">
      <div class="status-strip">
        <dt class="text-muted">Status</dt>
        <dd><span class="badge badge-primary">{{ client.status || '—' }}</span></dd>
      </div>
      <div class="status-strip">
        <dt class="text-muted">Assigned To</dt>
        <dd class="font-medium text-[var(--color-text)]">{{ client.assignedTo || 'Unassigned' }}</dd>
      </div>
      <div class="status-strip">
        <dt class="text-muted">Work Count</dt>
        <dd class="font-medium text-[var(--color-text)]">{{ client.workSummary?.total || 0 }}</dd>
      </div>
      <div class="status-strip">
        <dt class="text-muted">Outstanding</dt>
        <dd class="font-medium text-[var(--color-text)]">{{ money(client.financeSummary?.amountDue || 0) }}</dd>
      </div>
    </dl>
  </aside>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  client: { type: Object, default: () => ({}) },
})

const headline = computed(() => {
  return props.client.institutionName || [props.client.firstName, props.client.lastName].filter(Boolean).join(' ') || 'Unnamed client'
})

function money(value) {
  return new Intl.NumberFormat('en-NA', { style: 'currency', currency: 'NAD' }).format(Number(value || 0))
}
</script>

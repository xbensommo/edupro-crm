<template>
  <CrmPageShell
    title="EduProLIC CRM"
    description="Operational dashboard for work intake, assignment, review, delivery, and finance handoff."
  >
    <div class="kpi-grid">
      <CrmStatCard label="Clients" :value="snapshot.totals.clients" hint="Linked client records" />
      <CrmStatCard label="Work Items" :value="snapshot.totals.totalWork" hint="All active work" />
      <CrmStatCard label="Accepted" :value="snapshot.totals.accepted" hint="Consultant accepted" />
      <CrmStatCard label="Awaiting Review" :value="snapshot.totals.awaitingReview" hint="Final submissions pending review" />
      <CrmStatCard label="Delivered" :value="snapshot.totals.delivered" hint="Sent to clients" />
      <CrmStatCard label="Revision Queue" :value="snapshot.totals.revisionQueue" hint="Returned for correction" />

      <article class="metric-card">
        <div class="flex items-start justify-between gap-4">
          <div class="space-y-3">
            <p class="stat-title">Collected</p>
            <p class="stat-value text-primary">{{ currency(snapshot.totals.amountPaid) }}</p>
            <p class="text-sm text-muted">Logged client money</p>
          </div>
        </div>
      </article>

      <article class="metric-card">
        <div class="flex items-start justify-between gap-4">
          <div class="space-y-3">
            <p class="stat-title">Outstanding</p>
            <p class="stat-value text-primary">{{ currency(snapshot.totals.amountDue) }}</p>
            <p class="text-sm text-muted">Still due from clients</p>
          </div>
        </div>
      </article>
    </div>

    <div class="grid gap-8 xl:grid-cols-[1.5fr_1fr]">
      <section class="card p-0 overflow-hidden">
        <div class="flex items-center justify-between gap-3 px-6 py-5 border-b border-theme">
          <div>
            <h2 class="section-title">Recent work</h2>
            <p class="mt-1 text-sm text-muted">Newest EduProLIC work records linked to clients.</p>
          </div>
        </div>

        <CrmDataTable :columns="workColumns" :rows="snapshot.recentWork" empty-text="No work yet." />
      </section>

      <section class="card p-0 overflow-hidden">
        <div class="px-6 py-5 border-b border-theme">
          <h2 class="section-title">Recent activity</h2>
          <p class="mt-1 text-sm text-muted">Assignment, delivery, and operational logs.</p>
        </div>

        <ul class="divide-y border-theme">
          <li v-for="activity in snapshot.recentActivities" :key="activity.id" class="flex gap-4 px-6 py-5 transition-theme hover:bg-[rgba(109,94,252,0.04)]">
            <div class="mt-1 h-2.5 w-2.5 rounded-full bg-brand-gradient shrink-0"></div>
            <div class="min-w-0">
              <p class="font-semibold text-[var(--color-text)]">{{ activity.subject }}</p>
              <p class="mt-1 text-sm text-muted leading-6">{{ activity.description || 'No description provided.' }}</p>
            </div>
          </li>
          <li v-if="snapshot.recentActivities.length === 0" class="px-6 py-10 text-center text-sm text-muted">
            No CRM activity has been recorded yet.
          </li>
        </ul>
      </section>
    </div>
  </CrmPageShell>
</template>

<script setup>
import { onMounted, reactive } from 'vue'
import CrmDataTable from '../components/CrmDataTable.vue'
import CrmPageShell from '../components/CrmPageShell.vue'
import CrmStatCard from '../components/CrmStatCard.vue'
import { useCrmService } from '../services/crmService.js'

const { service } = useCrmService()

const snapshot = reactive({
  totals: { clients: 0, totalWork: 0, accepted: 0, awaitingReview: 0, delivered: 0, revisionQueue: 0, amountPaid: 0, amountDue: 0 },
  recentWork: [],
  recentActivities: [],
})

const workColumns = [
  { key: 'engagementCode', label: 'Code' },
  { key: 'clientName', label: 'Client' },
  { key: 'title', label: 'Work' },
  { key: 'deliveryStatus', label: 'Delivery' },
  { key: 'amountDueCached', label: 'Amount Due' },
]

function currency(value) {
  return new Intl.NumberFormat('en-NA', { style: 'currency', currency: 'NAD', maximumFractionDigits: 0 }).format(Number(value || 0))
}

onMounted(async () => {
  const result = await service.fetchDashboardSnapshot()
  Object.assign(snapshot, result)
})
</script>

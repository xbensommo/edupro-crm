<template>
  <DashboardPageShell
    eyebrow="Reporting"
    title="Operational Reports"
    description="Role-safe reporting for EduProLIC management and editorial workflows."
  >
    <div class="kpi-grid xl:grid-cols-3">
      <DashboardStatCard
        v-for="item in reportCards"
        :key="item.id"
        :label="item.label"
        :value="item.value"
        :description="item.description"
      />
    </div>

    <DashboardWidgetCard title="Report Notes" description="Only the roles that should see reports can access this page.">
      <ul class="space-y-3 text-sm leading-6 text-soft">
        <li class="list-row items-start bg-surface-2">Admin and receptionist share the same operational visibility.</li>
        <li class="list-row items-start bg-surface-2">Consultants do not get reports because they should only see their own work dashboard.</li>
        <li class="list-row items-start bg-surface-2">Consultant-editors can review editorial workload without opening full finance control screens.</li>
        <li class="list-row items-start bg-surface-2">Sysadmin gets system-level visibility in addition to management reporting.</li>
      </ul>
    </DashboardWidgetCard>
  </DashboardPageShell>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import DashboardPageShell from '../components/DashboardPageShell.vue'
import DashboardStatCard from '../components/DashboardStatCard.vue'
import DashboardWidgetCard from '../components/DashboardWidgetCard.vue'
import { useDashboardService } from '../services/dashboardService.js'

const dashboardService = useDashboardService()
const metrics = ref({ raw: {} })

const reportCards = computed(() => {
  const raw = metrics.value.raw || {}

  return [
    {
      id: 'role',
      label: 'Role Context',
      value: String(raw.role || 'unknown').replace(/_/g, ' '),
      description: 'Current role scope used to build this report page.',
    },
    {
      id: 'engagements',
      label: 'Work Records In Scope',
      value: raw.engagements?.toLocaleString?.() || raw.engagements || 0,
      description: 'Work items currently visible to this reporting role.',
    },
    {
      id: 'clients',
      label: 'Clients In Scope',
      value: raw.clients?.toLocaleString?.() || raw.clients || 0,
      description: 'Client profiles currently visible through the dashboard service.',
    },
    {
      id: 'notifications',
      label: 'Notifications In Scope',
      value: raw.notifications?.toLocaleString?.() || raw.notifications || 0,
      description: 'Notifications available to the current role context.',
    },
  ]
})

onMounted(() => {
  dashboardService.getOverviewMetrics()
    .then((value) => {
      metrics.value = value
    })
    .catch(console.error)
})
</script>

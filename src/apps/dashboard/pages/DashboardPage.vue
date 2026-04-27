<template>
  <DashboardPageShell
    eyebrow="Operational Overview"
    :title="pageTitle"
    :description="pageDescription"
  >
    <template #actions>
      <RouterLink
        v-for="action in topActions"
        :key="action.id"
        :to="action.to"
        :class="action.variant === 'secondary' ? 'btn-secondary' : 'btn-primary'"
      >
        {{ action.label }}
      </RouterLink>
    </template>

    <MetricsWidget :cards="snapshot.metrics.cards" />

    <div class="grid gap-6 xl:grid-cols-3">
      <div class="space-y-6 xl:col-span-2">
        <RecentActivityWidget :items="snapshot.recentActivity" />
  
      </div>
      <div class="space-y-6">
        <!-- <NotificationsWidget :items="snapshot.notifications" /> -->
      </div>
    </div>
  </DashboardPageShell>
</template>

<script setup>
import { computed, onMounted, reactive } from 'vue'
import { RouterLink } from 'vue-router'
import DashboardPageShell from '../components/DashboardPageShell.vue'
import MetricsWidget from '../components/MetricsWidget.vue'
import RecentActivityWidget from '../components/RecentActivityWidget.vue'
import NotificationsWidget from '../components/NotificationsWidget.vue'
import { useDashboardService } from '../services/dashboardService.js'

const dashboardService = useDashboardService()

const snapshot = reactive({
  metrics: { cards: [] },
  recentActivity: [],
  charts: {},
  notifications: [],
  quickActions: [],
  systemStatus: [],
  role: 'consultant',
})

const pageTitle = computed(() => {
  switch (snapshot.role) {
    case 'sysadmin':
      return 'System & Operations Dashboard'
    case 'consultant_editor':
      return 'Editorial Dashboard'
    case 'consultant':
      return 'My Work Dashboard'
    default:
      return 'Operations Dashboard'
  }
})

const pageDescription = computed(() => {
  switch (snapshot.role) {
    case 'sysadmin':
      return 'Infrastructure visibility, app state, and cross-module operational health.'
    case 'consultant_editor':
      return 'Review queue, revision pressure, and submitted work waiting for editorial action.'
    case 'consultant':
      return 'Your assignments, submissions, notifications, and upcoming deadlines.'
    default:
      return 'Role-scoped EduProLIC operations across clients, work, payments, and notifications.'
  }
})

const topActions = computed(() => {
  if (snapshot.role === 'consultant') {
    return [{ id: 'open-work', label: 'Open My Work', to: '/crm/work', variant: 'primary' }]
  }

  if (snapshot.role === 'consultant_editor') {
    return [
      { id: 'review-queue', label: 'Open Review Queue', to: '/crm/work', variant: 'primary' },
      { id: 'reports', label: 'Open Reports', to: '/dashboard/reports', variant: 'secondary' },
    ]
  }

  return [
    { id: 'reports', label: 'Open Reports', to: '/dashboard/reports', variant: 'secondary' },
    { id: 'analytics', label: 'View Analytics', to: '/dashboard/analytics', variant: 'primary' },
  ]
})

async function loadDashboard() {
  const data = await dashboardService.getDashboardSnapshot()
  Object.assign(snapshot, data)
}

onMounted(() => {
  loadDashboard().catch(console.error)
})
</script>

<template>
  <DashboardPageShell
    eyebrow="Insights"
    :title="title"
    :description="description"
  >
    <MetricsWidget :cards="metrics.cards" />
  </DashboardPageShell>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import DashboardPageShell from '../components/DashboardPageShell.vue'
import MetricsWidget from '../components/MetricsWidget.vue'
import { useDashboardService } from '../services/dashboardService.js'

const dashboardService = useDashboardService()
const roleContext = dashboardService.roleContext
const metrics = reactive({ cards: [] })
const charts = reactive({})

const title = computed(() => roleContext.value === 'consultant' ? 'My Analytics' : roleContext.value === 'consultant_editor' ? 'Editorial Analytics' : 'Operational Analytics')
const description = computed(() => roleContext.value === 'consultant'
  ? 'Personal assignment and submission trends only.'
  : roleContext.value === 'consultant_editor'
    ? 'Editorial throughput and review-related trends.'
    : 'Cross-module work, notification, and operations trends.')

async function loadAnalytics() {
  const [metricData, chartData] = await Promise.all([
    dashboardService.getOverviewMetrics(),
    dashboardService.getChartData(),
  ])

  Object.assign(metrics, metricData)
  Object.assign(charts, chartData)
}

onMounted(() => {
  loadAnalytics().catch(console.error)
})
</script>

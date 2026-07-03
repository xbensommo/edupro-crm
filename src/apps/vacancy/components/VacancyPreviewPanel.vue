<template>
  <aside class="card relative overflow-hidden xl:sticky xl:top-24">
    <div class="absolute inset-x-6 top-0 h-px bg-brand-gradient opacity-70"></div>

    <div class="space-y-3">
      <p class="section-label">Live Preview</p>
      <div class="space-y-1.5">
        <h2 class="section-title leading-snug">{{ vacancy.title || 'Untitled role' }}</h2>
        <p class="text-sm text-muted">
          {{ vacancy.department || 'Department TBD' }}<span v-if="vacancy.location"> · {{ vacancy.location }}</span>
        </p>
      </div>

      <div class="flex flex-wrap gap-2 pt-1">
        <span class="badge badge-primary">{{ employmentTypeLabel }}</span>
        <span class="badge">{{ workModeLabel }}</span>
        <span class="badge">{{ experienceLevelLabel }}</span>
        <span v-if="vacancy.isFeatured" class="badge badge-warning">Featured</span>
      </div>
    </div>

    <p v-if="vacancy.summary" class="mt-5 text-sm leading-6 text-soft">{{ vacancy.summary }}</p>
    <p v-else class="mt-5 text-sm leading-6 text-muted italic">Add a short summary to see it appear here.</p>

    <dl class="mt-6 space-y-3 text-sm">
      <div class="status-strip">
        <dt class="text-muted">Status</dt>
        <dd><span :class="['badge', statusBadgeClass]">{{ statusLabel }}</span></dd>
      </div>
      <div class="status-strip">
        <dt class="text-muted">Compensation</dt>
        <dd class="font-medium text-[var(--color-text)]">{{ salaryLabel }}</dd>
      </div>
      <div class="status-strip">
        <dt class="text-muted">Open Positions</dt>
        <dd class="font-medium text-[var(--color-text)]">{{ vacancy.numberOfPositions || 1 }}</dd>
      </div>
      <div class="status-strip">
        <dt class="text-muted">Closing Date</dt>
        <dd class="font-medium text-[var(--color-text)]">{{ closingDateLabel }}</dd>
      </div>
    </dl>

    <div v-if="vacancy.responsibilities?.length" class="mt-6 space-y-2">
      <p class="text-caption">Key Responsibilities</p>
      <ul class="space-y-1.5 text-sm text-soft">
        <li v-for="(item, i) in vacancy.responsibilities.slice(0, 4)" :key="i" class="flex items-start gap-2">
          <span class="mt-1.5 h-1 w-1 shrink-0 rounded-full" style="background: var(--color-primary)"></span>
          <span>{{ item }}</span>
        </li>
      </ul>
      <p v-if="vacancy.responsibilities.length > 4" class="text-xs text-muted">
        +{{ vacancy.responsibilities.length - 4 }} more
      </p>
    </div>

    <div v-if="vacancy.tags?.length" class="mt-6 flex flex-wrap gap-2">
      <span v-for="(tag, i) in vacancy.tags" :key="i" class="chip">{{ tag }}</span>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  vacancy: { type: Object, default: () => ({}) },
})
 
const EMPLOYMENT_TYPE_LABELS = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
  temporary: 'Temporary',
}

const WORK_MODE_LABELS = { onsite: 'On-site', remote: 'Remote', hybrid: 'Hybrid' }

const EXPERIENCE_LABELS = {
  entry: 'Entry level',
  mid: 'Mid level',
  senior: 'Senior',
  lead: 'Lead',
  executive: 'Executive',
}

const STATUS_LABELS = { draft: 'Draft', open: 'Open', on_hold: 'On hold', closed: 'Closed', filled: 'Filled' }

const STATUS_BADGE_CLASS = {
  draft: 'badge',
  open: 'badge-success',
  on_hold: 'badge-warning',
  closed: 'badge-danger',
  filled: 'badge-primary',
}

const employmentTypeLabel = computed(() => EMPLOYMENT_TYPE_LABELS[props.vacancy.employmentType] || 'Employment type')
const workModeLabel = computed(() => WORK_MODE_LABELS[props.vacancy.workMode] || 'Work mode')
const experienceLevelLabel = computed(() => EXPERIENCE_LABELS[props.vacancy.experienceLevel] || 'Experience level')
const statusLabel = computed(() => STATUS_LABELS[props.vacancy.status] || 'Draft')
const statusBadgeClass = computed(() => STATUS_BADGE_CLASS[props.vacancy.status] || 'badge')

const closingDateLabel = computed(() => {
  if (!props.vacancy.closingDate) return 'Open until filled'
  const date = new Date(props.vacancy.closingDate)
  if (Number.isNaN(date.getTime())) return 'Open until filled'
  return date.toLocaleDateString('en-NA', { day: 'numeric', month: 'short', year: 'numeric' })
})

const salaryLabel = computed(() => {
  const { salaryMin, salaryMax, salaryCurrency, salaryNegotiable, salaryPeriod } = props.vacancy
  if (!salaryMin && !salaryMax) return salaryNegotiable ? 'Negotiable' : 'Not disclosed'

  const currency = salaryCurrency || 'NAD'
  const formatAmount = (value) =>
    new Intl.NumberFormat('en-NA', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(value || 0))
  const period = salaryPeriod === 'hourly' ? '/hr' : salaryPeriod === 'annual' ? '/yr' : '/mo'

  if (salaryMin && salaryMax) return `${formatAmount(salaryMin)} – ${formatAmount(salaryMax)}${period}`
  return `${formatAmount(salaryMin || salaryMax)}${period}`
})
</script>

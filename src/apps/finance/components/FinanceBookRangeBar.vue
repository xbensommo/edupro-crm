<template>
  <section class="rounded-[28px] border border-[var(--color-neutral-dark,#E2E8F0)] bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.05)]">
    <div class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div class="space-y-2">
        <p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-primary,#1860A8)]">Book period</p>
        <h2 class="text-2xl font-semibold tracking-tight text-[var(--color-text,#0F172A)]">{{ label }}</h2>
        <p class="text-sm leading-7 text-[var(--color-text-light,#64748B)]">Move between month, year, or a custom finance reporting window.</p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <button type="button" class="inline-flex items-center justify-center rounded-2xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-2 text-sm font-semibold text-[var(--color-text,#0F172A)] transition hover:bg-[var(--color-neutral,#F8FAFC)] disabled:cursor-not-allowed disabled:opacity-60" :disabled="loading" @click="$emit('prev')">Previous</button>
        <button type="button" class="inline-flex items-center justify-center rounded-2xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-2 text-sm font-semibold text-[var(--color-text,#0F172A)] transition hover:bg-[var(--color-neutral,#F8FAFC)] disabled:cursor-not-allowed disabled:opacity-60" :disabled="loading" @click="$emit('next')">Next</button>
      </div>
    </div>

    <div class="mt-6 grid gap-4 xl:grid-cols-[auto,auto,auto,1fr]">
      <div class="flex flex-wrap gap-2">
        <button type="button" class="rounded-2xl px-4 py-2 text-sm font-semibold transition" :class="mode === 'month' ? activeButtonClass : idleButtonClass" :disabled="loading" @click="applyThisMonth">This month</button>
        <button type="button" class="rounded-2xl px-4 py-2 text-sm font-semibold transition" :class="mode === 'year' ? activeButtonClass : idleButtonClass" :disabled="loading" @click="applyThisYear">This year</button>
        <button type="button" class="rounded-2xl px-4 py-2 text-sm font-semibold transition" :class="mode === 'custom' ? activeButtonClass : idleButtonClass" :disabled="loading" @click="applyCustom">Custom</button>
      </div>

      <label class="grid gap-2">
        <span class="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-light,#64748B)]">Month</span>
        <div class="flex items-center gap-2">
          <input v-model="monthValue" type="month" class="rounded-2xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-2 text-sm text-[var(--color-text,#0F172A)] outline-none" :disabled="loading" />
          <button type="button" class="rounded-2xl bg-[var(--color-accent,#000000)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60" :disabled="loading" @click="applyMonth">Use</button>
        </div>
      </label>

      <label class="grid gap-2">
        <span class="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-light,#64748B)]">Year</span>
        <div class="flex items-center gap-2">
          <input v-model="yearValue" type="number" min="2000" step="1" class="w-32 rounded-2xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-2 text-sm text-[var(--color-text,#0F172A)] outline-none" :disabled="loading" />
          <button type="button" class="rounded-2xl bg-[var(--color-accent,#000000)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60" :disabled="loading" @click="applyYear">Use</button>
        </div>
      </label>

      <div class="grid gap-2 md:grid-cols-[1fr,1fr,auto]">
        <label class="grid gap-2">
          <span class="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-light,#64748B)]">From</span>
          <input v-model="fromValue" type="date" class="rounded-2xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-2 text-sm text-[var(--color-text,#0F172A)] outline-none" :disabled="loading" />
        </label>
        <label class="grid gap-2">
          <span class="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-light,#64748B)]">To</span>
          <input v-model="toValue" type="date" class="rounded-2xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-2 text-sm text-[var(--color-text,#0F172A)] outline-none" :disabled="loading" />
        </label>
        <div class="flex items-end">
          <button type="button" class="w-full rounded-2xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-2 text-sm font-semibold text-[var(--color-text,#0F172A)] transition hover:bg-[var(--color-neutral,#F8FAFC)] disabled:cursor-not-allowed disabled:opacity-60" :disabled="loading" @click="applyCustom">Apply custom</button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
/**
 * @file src/apps/finance/components/FinanceBookRangeBar.vue
 * @description Shared period selector for finance books and statements.
 */

import { ref, watch } from 'vue'

const props = defineProps({
  range: {
    type: Object,
    default: () => ({ from: '', to: '' }),
  },
  mode: {
    type: String,
    default: 'year',
  },
  label: {
    type: String,
    default: '',
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['prev', 'next', 'preset', 'custom'])

const monthValue = ref('')
const yearValue = ref('')
const fromValue = ref('')
const toValue = ref('')

const activeButtonClass = 'bg-[var(--color-accent,#000000)] text-white'
const idleButtonClass = 'border border-[var(--color-neutral-dark,#E2E8F0)] text-[var(--color-text,#0F172A)] hover:bg-[var(--color-neutral,#F8FAFC)]'

watch(
  () => props.range,
  (nextRange) => {
    fromValue.value = nextRange?.from || ''
    toValue.value = nextRange?.to || ''
    monthValue.value = (nextRange?.from || '').slice(0, 7)
    yearValue.value = (nextRange?.from || '').slice(0, 4)
  },
  { immediate: true, deep: true },
)

function applyMonth() {
  if (!monthValue.value) return
  emit('preset', { mode: 'month', anchor: `${monthValue.value}-01` })
}

function applyYear() {
  if (!yearValue.value) return
  emit('preset', { mode: 'year', anchor: Number(yearValue.value) })
}

function applyCustom() {
  if (!fromValue.value || !toValue.value) return
  emit('custom', { from: fromValue.value, to: toValue.value })
}

function applyThisMonth() {
  emit('preset', { mode: 'month', anchor: new Date().toISOString().slice(0, 10) })
}

function applyThisYear() {
  emit('preset', { mode: 'year', anchor: new Date().getUTCFullYear() })
}
</script>

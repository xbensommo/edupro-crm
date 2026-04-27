<template>
  <teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
      <div class="w-full max-w-lg rounded-[28px] border border-[var(--color-neutral-dark,#E2E8F0)] bg-white p-6 shadow-[0_24px_64px_rgba(15,23,42,0.18)]">
        <p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-primary,#1860A8)]">Confirm action</p>
        <h2 class="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-text,#0F172A)]">{{ title }}</h2>
        <p class="mt-3 text-sm leading-7 text-[var(--color-text-light,#64748B)]">{{ message }}</p>
        <div class="mt-6 flex flex-wrap justify-end gap-3">
          <button type="button" class="inline-flex items-center justify-center rounded-2xl border border-[var(--color-neutral-dark,#E2E8F0)] px-5 py-3 text-sm font-semibold text-[var(--color-text,#0F172A)] transition hover:bg-[var(--color-neutral,#F8FAFC)] disabled:cursor-not-allowed disabled:opacity-60" :disabled="loading" @click="$emit('cancel')">{{ cancelText }}</button>
          <button type="button" class="inline-flex items-center justify-center rounded-2xl bg-[var(--color-accent,#000000)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60" :disabled="loading" @click="$emit('confirm')">{{ loading ? 'Working...' : confirmText }}</button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
/**
 * @file src/apps/finance/components/FinanceConfirmDialog.vue
 * @description Reusable confirmation dialog for finance actions that do not already use FinanceActionPanel.
 */

defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, required: true },
  message: { type: String, default: '' },
  confirmText: { type: String, default: 'Confirm' },
  cancelText: { type: String, default: 'Cancel' },
  loading: { type: Boolean, default: false },
})

defineEmits(['cancel', 'confirm'])
</script>

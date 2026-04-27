<template>
  <section class="rounded-[28px] border border-[var(--color-neutral-dark,#E2E8F0)] bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.05)]">
    <div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
      <div>
        <p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-primary,#1860A8)]">Operational action</p>
        <h2 class="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-text,#0F172A)]">Record refund</h2>
        <p class="mt-2 text-sm leading-7 text-[var(--color-text-light,#64748B)]">Use this when a client must be refunded. The form creates both the refund row and the matching draft finance transaction.</p>
      </div>
      <button type="button" class="inline-flex items-center justify-center rounded-2xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-2 text-sm font-semibold text-[var(--color-text,#0F172A)]" @click="$emit('cancel')">Close</button>
    </div>

    <form class="mt-6 grid gap-4 md:grid-cols-2" @submit.prevent="submitForm">
      <label class="space-y-2"><span class="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-text-light,#64748B)]">Client ID</span><input v-model.trim="form.clientId" required class="w-full rounded-2xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-3 text-sm" /></label>
      <label class="space-y-2"><span class="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-text-light,#64748B)]">Client label</span><input v-model.trim="form.clientLabel" class="w-full rounded-2xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-3 text-sm" /></label>
      <label class="space-y-2"><span class="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-text-light,#64748B)]">Engagement ID</span><input v-model.trim="form.engagementId" required class="w-full rounded-2xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-3 text-sm" /></label>
      <label class="space-y-2"><span class="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-text-light,#64748B)]">Engagement code</span><input v-model.trim="form.engagementCode" class="w-full rounded-2xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-3 text-sm" /></label>
      <label class="space-y-2"><span class="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-text-light,#64748B)]">Payment ID</span><input v-model.trim="form.paymentId" class="w-full rounded-2xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-3 text-sm" /></label>
      <label class="space-y-2"><span class="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-text-light,#64748B)]">Payment code</span><input v-model.trim="form.paymentCode" class="w-full rounded-2xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-3 text-sm" /></label>
      <label class="space-y-2"><span class="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-text-light,#64748B)]">Refund amount</span><input v-model.number="form.amount" type="number" min="0.01" step="0.01" required class="w-full rounded-2xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-3 text-sm" /></label>
      <label class="space-y-2"><span class="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-text-light,#64748B)]">Refund date</span><input v-model="form.refundDate" type="date" required class="w-full rounded-2xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-3 text-sm" /></label>
      <label class="space-y-2"><span class="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-text-light,#64748B)]">Refund method</span><select v-model="form.refundMethod" class="w-full rounded-2xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-3 text-sm"><option value="cash">Cash</option><option value="bank_transfer">Bank transfer</option><option value="eft">EFT</option><option value="wallet">Wallet</option></select></label>
      <label class="space-y-2"><span class="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-text-light,#64748B)]">Reference</span><input v-model.trim="form.referenceNumber" class="w-full rounded-2xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-3 text-sm" /></label>
      <label class="space-y-2 md:col-span-2"><span class="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-text-light,#64748B)]">Reason</span><textarea v-model.trim="form.reason" rows="3" class="w-full rounded-2xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-3 text-sm"></textarea></label>
      <div class="md:col-span-2 flex flex-wrap justify-end gap-3"><button type="button" class="inline-flex items-center justify-center rounded-2xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-2 text-sm font-semibold text-[var(--color-text,#0F172A)]" @click="$emit('cancel')">Cancel</button><button :disabled="isSubmitting" type="submit" class="inline-flex items-center justify-center rounded-2xl bg-[var(--color-accent,#000000)] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">{{ isSubmitting ? 'Saving...' : 'Record refund' }}</button></div>
    </form>
  </section>
</template>

<script setup>
import { reactive } from 'vue'

const props = defineProps({ isSubmitting: { type: Boolean, default: false } })
const emit = defineEmits(['submit', 'cancel'])
const today = new Date().toISOString().slice(0, 10)
const form = reactive({ clientId: '', clientLabel: '', engagementId: '', engagementCode: '', paymentId: '', paymentCode: '', amount: null, refundDate: today, refundMethod: 'bank_transfer', referenceNumber: '', reason: '', currency: 'NAD' })
function submitForm() { emit('submit', { ...form }) }
</script>

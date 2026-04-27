<template>
  <form class="grid gap-5 rounded-[28px] border border-[var(--color-neutral-dark,#E2E8F0)] bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.05)]" @submit.prevent="submit">
    <div class="grid gap-4 md:grid-cols-3">
      <label class="grid gap-2 text-sm font-semibold text-[var(--color-text,#0F172A)]">
        Payment
        <select v-model="form.paymentId" required class="rounded-2xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-3 text-sm font-normal outline-none focus:border-[var(--color-primary,#1860A8)]">
          <option value="" disabled>Select payment</option>
          <option v-for="payment in props.payments" :key="payment.id" :value="payment.id">{{ payment.paymentCode || payment.id }} · {{ payment.clientLabel || payment.clientId }}</option>
        </select>
      </label>
      <label class="grid gap-2 text-sm font-semibold text-[var(--color-text,#0F172A)]">
        Invoice
        <select v-model="form.invoiceId" required class="rounded-2xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-3 text-sm font-normal outline-none focus:border-[var(--color-primary,#1860A8)]">
          <option value="" disabled>Select invoice</option>
          <option v-for="invoice in openInvoices" :key="invoice.id" :value="invoice.id">{{ invoice.invoiceCode }} · {{ invoice.clientLabel || invoice.clientId }}</option>
        </select>
      </label>
      <label class="grid gap-2 text-sm font-semibold text-[var(--color-text,#0F172A)]">
        Amount
        <input v-model.number="form.amount" type="number" min="0.01" step="0.01" required class="rounded-2xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-3 text-sm font-normal outline-none focus:border-[var(--color-primary,#1860A8)]" />
      </label>
    </div>
    <label class="grid gap-2 text-sm font-semibold text-[var(--color-text,#0F172A)]">
      Notes
      <input v-model.trim="form.notes" class="rounded-2xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-3 text-sm font-normal outline-none focus:border-[var(--color-primary,#1860A8)]" placeholder="Optional allocation note" />
    </label>
    <div class="flex flex-wrap justify-end gap-3">
      <button type="button" class="rounded-2xl border border-[var(--color-neutral-dark,#E2E8F0)] px-5 py-3 text-sm font-semibold" :disabled="props.isSubmitting" @click="$emit('cancel')">Cancel</button>
      <button type="submit" class="rounded-2xl bg-[var(--color-accent,#000000)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60" :disabled="props.isSubmitting">{{ props.isSubmitting ? 'Allocating...' : 'Allocate payment' }}</button>
    </div>
  </form>
</template>

<script setup>
/**
 * @file src/apps/finance/components/FinanceAllocationForm.vue
 * @description Applies existing received payments to open invoices.
 */

import { computed, reactive } from 'vue'

const props = defineProps({
  payments: { type: Array, default: () => [] },
  invoices: { type: Array, default: () => [] },
  isSubmitting: { type: Boolean, default: false },
})

const emit = defineEmits(['submit', 'cancel'])

const form = reactive({
  paymentId: '',
  invoiceId: '',
  amount: 0,
  notes: '',
})

const openInvoices = computed(() => props.invoices.filter((invoice) => Number(invoice.balanceAmount || invoice.totalAmount || 0) > 0 && invoice.status !== 'cancelled'))

function submit() {
  const payment = props.payments.find((item) => item.id === form.paymentId)
  const invoice = props.invoices.find((item) => item.id === form.invoiceId)
  emit('submit', {
    ...form,
    paymentShardDate: payment?.paymentDate || payment?.createdAt || null,
    invoiceShardDate: invoice?.issueDate || invoice?.createdAt || null,
  })
}
</script>

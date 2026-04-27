<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
      @mousedown.self="emit('cancel')"
    >
      <section
        ref="dialogRef"
        role="dialog"
        aria-modal="true"
        aria-labelledby="record-expense-title"
        tabindex="-1"
        class="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[28px] border border-[var(--color-neutral-dark,#E2E8F0)] bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.22)] outline-none"
        @keydown="handleKeydown"
      >
        <div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-primary,#1860A8)]">
              Operational action
            </p>

            <h2
              id="record-expense-title"
              class="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-text,#0F172A)]"
            >
              Record expense
            </h2>

            <p class="mt-2 text-sm leading-7 text-[var(--color-text-light,#64748B)]">
              This captures an expense row and a matching draft finance transaction.
            </p>
          </div>

          <button
            type="button"
            class="inline-flex items-center justify-center rounded-2xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-2 text-sm font-semibold text-[var(--color-text,#0F172A)] transition hover:bg-[var(--color-neutral,#F8FAFC)]"
            @click="emit('cancel')"
          >
            Close
          </button>
        </div>

        <form class="mt-6 grid gap-4 md:grid-cols-2" @submit.prevent="submitForm">
          <label class="space-y-2">
            <span class="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-text-light,#64748B)]">
              Category
            </span>
            <input
              ref="firstInputRef"
              v-model.trim="form.category"
              required
              class="w-full rounded-2xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-3 text-sm outline-none transition focus:border-[var(--color-secondary,#4A90E2)] focus:ring-4 focus:ring-[var(--color-secondary,#4A90E2)]/10"
            >
          </label>

          <label class="space-y-2">
            <span class="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-text-light,#64748B)]">
              Amount
            </span>
            <input
              v-model.number="form.amount"
              type="number"
              min="0.01"
              step="0.01"
              required
              class="w-full rounded-2xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-3 text-sm outline-none transition focus:border-[var(--color-secondary,#4A90E2)] focus:ring-4 focus:ring-[var(--color-secondary,#4A90E2)]/10"
            >
          </label>

          <label class="space-y-2 md:col-span-2">
            <span class="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-text-light,#64748B)]">
              Description
            </span>
            <input
              v-model.trim="form.description"
              required
              class="w-full rounded-2xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-3 text-sm outline-none transition focus:border-[var(--color-secondary,#4A90E2)] focus:ring-4 focus:ring-[var(--color-secondary,#4A90E2)]/10"
            >
          </label>

          <label class="space-y-2">
            <span class="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-text-light,#64748B)]">
              Vendor
            </span>
            <input
              v-model.trim="form.vendorName"
              class="w-full rounded-2xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-3 text-sm outline-none transition focus:border-[var(--color-secondary,#4A90E2)] focus:ring-4 focus:ring-[var(--color-secondary,#4A90E2)]/10"
            >
          </label>

          <label class="space-y-2">
            <span class="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-text-light,#64748B)]">
              Expense date
            </span>
            <input
              v-model="form.expenseDate"
              type="date"
              required
              class="w-full rounded-2xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-3 text-sm outline-none transition focus:border-[var(--color-secondary,#4A90E2)] focus:ring-4 focus:ring-[var(--color-secondary,#4A90E2)]/10"
            >
          </label>

          <label class="space-y-2">
            <span class="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-text-light,#64748B)]">
              Payment method
            </span>
            <select
              v-model="form.paymentMethod"
              class="w-full rounded-2xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-3 text-sm outline-none transition focus:border-[var(--color-secondary,#4A90E2)] focus:ring-4 focus:ring-[var(--color-secondary,#4A90E2)]/10"
            >
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank transfer</option>
              <option value="eft">EFT</option>
              <option value="wallet">Wallet</option>
            </select>
          </label>

          <label class="space-y-2">
            <span class="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-text-light,#64748B)]">
              Reference
            </span>
            <input
              v-model.trim="form.referenceNumber"
              class="w-full rounded-2xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-3 text-sm outline-none transition focus:border-[var(--color-secondary,#4A90E2)] focus:ring-4 focus:ring-[var(--color-secondary,#4A90E2)]/10"
            >
          </label>

          <label class="space-y-2">
            <span class="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-text-light,#64748B)]">
              Related user ID
            </span>
            <input
              v-model.trim="form.relatedUserId"
              class="w-full rounded-2xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-3 text-sm outline-none transition focus:border-[var(--color-secondary,#4A90E2)] focus:ring-4 focus:ring-[var(--color-secondary,#4A90E2)]/10"
            >
          </label>

          <label class="space-y-2">
            <span class="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-text-light,#64748B)]">
              Related engagement ID
            </span>
            <input
              v-model.trim="form.relatedEngagementId"
              class="w-full rounded-2xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-3 text-sm outline-none transition focus:border-[var(--color-secondary,#4A90E2)] focus:ring-4 focus:ring-[var(--color-secondary,#4A90E2)]/10"
            >
          </label>

          <label class="space-y-2 md:col-span-2">
            <span class="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-text-light,#64748B)]">
              Notes
            </span>
            <textarea
              v-model.trim="form.notes"
              rows="3"
              class="w-full rounded-2xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-3 text-sm outline-none transition focus:border-[var(--color-secondary,#4A90E2)] focus:ring-4 focus:ring-[var(--color-secondary,#4A90E2)]/10"
            ></textarea>
          </label>

          <div class="flex flex-wrap justify-end gap-3 md:col-span-2">
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-2xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-2 text-sm font-semibold text-[var(--color-text,#0F172A)] transition hover:bg-[var(--color-neutral,#F8FAFC)]"
              @click="emit('cancel')"
            >
              Cancel
            </button>

            <button
              :disabled="isSubmitting"
              type="submit"
              class="inline-flex items-center justify-center rounded-2xl bg-[var(--color-accent,#000000)] px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {{ isSubmitting ? 'Saving...' : 'Record expense' }}
            </button>
          </div>
        </form>
      </section>
    </div>
  </Teleport>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'

defineProps({
  isSubmitting: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['submit', 'cancel'])

const dialogRef = ref(null)
const firstInputRef = ref(null)

const today = new Date().toISOString().slice(0, 10)

const form = reactive({
  category: '',
  description: '',
  vendorName: '',
  amount: null,
  expenseDate: today,
  paymentMethod: 'bank_transfer',
  referenceNumber: '',
  relatedUserId: '',
  relatedEngagementId: '',
  notes: '',
  currency: 'NAD',
})

const focusableSelector = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function lockBodyScroll() {
  if (typeof document === 'undefined') return
  document.body.style.overflow = 'hidden'
}

function unlockBodyScroll() {
  if (typeof document === 'undefined') return
  document.body.style.overflow = ''
}

async function focusModal() {
  await nextTick()

  const target = firstInputRef.value || dialogRef.value
  if (target && typeof target.focus === 'function') {
    target.focus({ preventScroll: true })
  }
}

function getFocusableElements() {
  if (!dialogRef.value) return []

  return Array.from(dialogRef.value.querySelectorAll(focusableSelector)).filter((element) => {
    return element.offsetParent !== null
  })
}

function handleKeydown(event) {
  if (event.key === 'Escape') {
    event.preventDefault()
    emit('cancel')
    return
  }

  if (event.key !== 'Tab') return

  const focusable = getFocusableElements()

  if (!focusable.length) {
    event.preventDefault()
    dialogRef.value?.focus()
    return
  }

  const first = focusable[0]
  const last = focusable[focusable.length - 1]

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
    return
  }

  if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

function submitForm() {
  emit('submit', { ...form })
}

onMounted(async () => {
  lockBodyScroll()
  await focusModal()
})

onBeforeUnmount(() => {
  unlockBodyScroll()
})
</script>
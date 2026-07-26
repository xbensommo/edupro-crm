<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/55 p-4">
      <form
        class="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[32px] border border-[var(--color-neutral-dark,#E2E8F0)] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]"
        @submit.prevent="submit"
      >
        <!-- Close button -->
        <button
          type="button"
          class="absolute top-4 right-4 rounded-full p-2 text-[var(--color-text-light,#64748B)] transition-colors hover:bg-[var(--color-neutral,#F8FAFC)] hover:text-[var(--color-text,#0F172A)]"
          :disabled="isSubmitting"
          @click="$emit('cancel')"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <!-- Header -->
        <div class="border-b border-[var(--color-neutral,#F1F5F9)] p-6">
          <div class="flex items-start gap-4">
            <div class="flex-1">
              <p class="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-primary,#1860A8)]">
                <span class="flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Client Receipts
                </span>
              </p>

              <h2 class="mt-1.5 text-2xl font-semibold tracking-tight text-[var(--color-text,#0F172A)]">
                {{ isEditing ? 'Edit Receipt' : 'Create Receipt' }}
              </h2>

              <p class="mt-1 text-sm text-[var(--color-text-light,#64748B)]">
                {{ isEditing ? 'Update receipt details' : 'Create a receipt for client payment or refund' }}
              </p>
            </div>
          </div>
        </div>

        <!-- Form Body -->
        <div class="p-6">
          <div class="space-y-6">
            <!-- Section 1: Client Information -->
            <section class="space-y-4">
              <div class="flex items-center gap-3">
                <div class="h-6 w-1 rounded-full bg-[var(--color-primary,#1860A8)]"></div>
                <h3 class="text-sm font-semibold text-[var(--color-text,#0F172A)]">Client Information</h3>
                <span class="text-xs text-[var(--color-text-light,#64748B)]">Who is this receipt for?</span>
              </div>

              <!-- Client Mode Toggle -->
              <div class="flex flex-wrap gap-2 p-1 bg-[var(--color-neutral,#F8FAFC)] rounded-2xl w-fit">
                <button
                  type="button"
                  class="rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200"
                  :class="clientMode === 'manual' ? 'bg-white shadow-sm text-[var(--color-text,#0F172A)]' : 'text-[var(--color-text-light,#64748B)] hover:text-[var(--color-text,#0F172A)]'"
                  @click="setClientMode('manual')"
                >
                  <span class="flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Manual
                  </span>
                </button>

                <button
                  type="button"
                  class="rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200"
                  :class="clientMode === 'existing' ? 'bg-white shadow-sm text-[var(--color-text,#0F172A)]' : 'text-[var(--color-text-light,#64748B)] hover:text-[var(--color-text,#0F172A)]'"
                  @click="setClientMode('existing')"
                >
                  <span class="flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Existing
                  </span>
                </button>
              </div>

              <!-- Manual Client Fields -->
              <div v-if="clientMode === 'manual'" class="grid gap-4 sm:grid-cols-2">
                <div class="sm:col-span-2">
                  <label class="block text-sm font-medium text-[var(--color-text,#0F172A)] mb-1.5">
                    Client Name <span class="text-rose-500">*</span>
                  </label>
                  <input
                    v-model.trim="manualClient.name"
                    required
                    class="w-full rounded-xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-2.5 text-sm transition-colors placeholder:text-[var(--color-text-light,#94A3B8)] focus:border-[var(--color-primary,#1860A8)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#1860A8)]/20"
                    placeholder="e.g., John Doe or Company Name"
                  >
                </div>

                <div>
                  <label class="block text-sm font-medium text-[var(--color-text,#0F172A)] mb-1.5">
                    Email Address
                  </label>
                  <input
                    v-model.trim="manualClient.email"
                    type="email"
                    class="w-full rounded-xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-2.5 text-sm transition-colors placeholder:text-[var(--color-text-light,#94A3B8)] focus:border-[var(--color-primary,#1860A8)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#1860A8)]/20"
                    placeholder="client@example.com"
                  >
                </div>

                <div>
                  <label class="block text-sm font-medium text-[var(--color-text,#0F172A)] mb-1.5">
                    Phone Number
                  </label>
                  <input
                    v-model.trim="manualClient.phone"
                    class="w-full rounded-xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-2.5 text-sm transition-colors placeholder:text-[var(--color-text-light,#94A3B8)] focus:border-[var(--color-primary,#1860A8)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#1860A8)]/20"
                    placeholder="+264 81 123 4567"
                  >
                </div>

                <div>
                  <label class="block text-sm font-medium text-[var(--color-text,#0F172A)] mb-1.5">
                    Client Number
                  </label>
                  <input
                    v-model.trim="manualClient.number"
                    class="w-full rounded-xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-2.5 text-sm transition-colors placeholder:text-[var(--color-text-light,#94A3B8)] focus:border-[var(--color-primary,#1860A8)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#1860A8)]/20"
                    placeholder="Optional reference"
                  >
                </div>
              </div>

              <!-- Existing Client Fields -->
              <div v-else class="grid gap-4 sm:grid-cols-2">
                <div>
                  <label class="block text-sm font-medium text-[var(--color-text,#0F172A)] mb-1.5">
                    Select Client <span class="text-rose-500">*</span>
                  </label>
                  <div class="flex gap-2">
                    <select
                      v-model="selectedClientId"
                      required
                      class="flex-1 rounded-xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-2.5 text-sm transition-colors focus:border-[var(--color-primary,#1860A8)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#1860A8)]/20"
                      @change="handleClientChange"
                    >
                      <option value="" disabled>Select a client...</option>
                      <option
                        v-for="client in normalizedClients"
                        :key="client.id"
                        :value="client.id"
                      >
                        {{ client.label }}
                      </option>
                    </select>

                    <button
                      v-if="canLoadMoreClients"
                      type="button"
                      class="rounded-xl border border-[var(--color-neutral-dark,#E2E8F0)] px-3 py-2.5 text-sm text-[var(--color-text-light,#64748B)] transition-colors hover:bg-[var(--color-neutral,#F8FAFC)] hover:text-[var(--color-text,#0F172A)] disabled:opacity-50"
                      :disabled="isLoadingClients"
                      @click="$emit('load-more-clients')"
                    >
                      <svg class="w-5 h-5" :class="isLoadingClients ? 'animate-spin' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-[var(--color-text,#0F172A)] mb-1.5">
                    Engagement
                  </label>
                  <select
                    v-model="selectedEngagementId"
                    :disabled="!selectedClientId || isLoadingEngagements"
                    class="w-full rounded-xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-2.5 text-sm transition-colors focus:border-[var(--color-primary,#1860A8)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#1860A8)]/20 disabled:opacity-50"
                    @change="handleEngagementChange"
                  >
                    <option value="">
                      {{ selectedClientId ? 'No engagement / select one' : 'Select client first' }}
                    </option>
                    <option
                      v-for="engagement in filteredEngagements"
                      :key="engagement.id"
                      :value="engagement.id"
                    >
                      {{ engagement.label }}
                    </option>
                  </select>
                </div>
              </div>
            </section>

            <!-- Section 2: Receipt Details -->
            <section class="space-y-4">
              <div class="flex items-center gap-3">
                <div class="h-6 w-1 rounded-full bg-[var(--color-primary,#1860A8)]"></div>
                <h3 class="text-sm font-semibold text-[var(--color-text,#0F172A)]">Receipt Details</h3>
                <span class="text-xs text-[var(--color-text-light,#64748B)]">Payment information</span>
              </div>

              <div class="grid gap-4 sm:grid-cols-2">
                <!-- <div>
                  <label class="block text-sm font-medium text-[var(--color-text,#0F172A)] mb-1.5">
                    Receipt Code
                  </label>
                  <input
                    v-model.trim="form.receiptCode"
                    class="w-full rounded-xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-2.5 text-sm transition-colors placeholder:text-[var(--color-text-light,#94A3B8)] focus:border-[var(--color-primary,#1860A8)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#1860A8)]/20"
                    placeholder="Auto-generated if left blank"
                  >
                </div> -->

                <div>
                  <label class="block text-sm font-medium text-[var(--color-text,#0F172A)] mb-1.5">
                    Receipt Type <span class="text-rose-500">*</span>
                  </label>
                  <select
                    v-model="form.receiptType"
                    required
                    class="w-full rounded-xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-2.5 text-sm transition-colors focus:border-[var(--color-primary,#1860A8)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#1860A8)]/20"
                  >
                    <option value="payment">Payment</option>
                    <option value="refund">Refund</option>
                    <option value="deposit">Deposit</option>
                    <option value="credit_note">Credit Note</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-[var(--color-text,#0F172A)] mb-1.5">
                    Payment Date <span class="text-rose-500">*</span>
                  </label>
                  <input
                    v-model="form.paymentDate"
                    type="date"
                    required
                    class="w-full rounded-xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-2.5 text-sm transition-colors focus:border-[var(--color-primary,#1860A8)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#1860A8)]/20"
                  >
                </div>

                <div>
                  <label class="block text-sm font-medium text-[var(--color-text,#0F172A)] mb-1.5">
                    Payment Method <span class="text-rose-500">*</span>
                  </label>
                  <select
                    v-model="form.paymentMethod"
                    required
                    class="w-full rounded-xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-2.5 text-sm transition-colors focus:border-[var(--color-primary,#1860A8)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#1860A8)]/20"
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="debit_card">Debit Card</option>
                    <option value="mobile_money">Mobile Money</option>
                    <option value="cheque">Cheque</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-[var(--color-text,#0F172A)] mb-1.5">
                    Amount <span class="text-rose-500">*</span>
                  </label>
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-light,#64748B)]">NAD</span>
                    <input
                      v-model.number="form.amount"
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      class="w-full rounded-xl border border-[var(--color-neutral-dark,#E2E8F0)] pl-14 pr-4 py-2.5 text-sm transition-colors focus:border-[var(--color-primary,#1860A8)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#1860A8)]/20"
                      placeholder="0.00"
                    >
                  </div>
                </div>

               <!--  <div>
                  <label class="block text-sm font-medium text-[var(--color-text,#0F172A)] mb-1.5">
                    Status <span class="text-rose-500">*</span>
                  </label>
                  <select
                    v-model="form.status"
                    required
                    class="w-full rounded-xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-2.5 text-sm transition-colors focus:border-[var(--color-primary,#1860A8)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#1860A8)]/20"
                  >
                    <option value="draft">Draft</option>
                    <option value="issued">Issued</option>
                  </select>
                </div> -->

                <div class="sm:col-span-2">
                  <label class="block text-sm font-medium text-[var(--color-text,#0F172A)] mb-1.5">
                    Reference Number
                  </label>
                  <input
                    v-model.trim="form.referenceNumber"
                    class="w-full rounded-xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-2.5 text-sm transition-colors placeholder:text-[var(--color-text-light,#94A3B8)] focus:border-[var(--color-primary,#1860A8)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#1860A8)]/20"
                    placeholder="Payment reference or transaction ID"
                  >
                </div>

                <div class="sm:col-span-2">
                  <label class="block text-sm font-medium text-[var(--color-text,#0F172A)] mb-1.5">
                    Description
                  </label>
                  <input
                    v-model.trim="form.description"
                    class="w-full rounded-xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-2.5 text-sm transition-colors placeholder:text-[var(--color-text-light,#94A3B8)] focus:border-[var(--color-primary,#1860A8)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#1860A8)]/20"
                    placeholder="e.g., Payment for invoice INV-001"
                  >
                </div>
              </div>
            </section>

            <!-- Section 3: Invoice & Payment Links -->
            <section class="space-y-4">
              <div class="flex items-center gap-3">
                <div class="h-6 w-1 rounded-full bg-[var(--color-primary,#1860A8)]"></div>
                <h3 class="text-sm font-semibold text-[var(--color-text,#0F172A)]">Linked Records</h3>
                <span class="text-xs text-[var(--color-text-light,#64748B)]">Optional references</span>
              </div>

              <div class="grid gap-4 sm:grid-cols-2">
                <div>
                  <label class="block text-sm font-medium text-[var(--color-text,#0F172A)] mb-1.5">
                    Invoice Code
                  </label>
                  <input
                    v-model.trim="form.invoiceCode"
                    class="w-full rounded-xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-2.5 text-sm transition-colors placeholder:text-[var(--color-text-light,#94A3B8)] focus:border-[var(--color-primary,#1860A8)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#1860A8)]/20"
                    placeholder="e.g., INV-001"
                  >
                </div>

                <div>
                  <label class="block text-sm font-medium text-[var(--color-text,#0F172A)] mb-1.5">
                    Payment Code
                  </label>
                  <input
                    v-model.trim="form.paymentCode"
                    class="w-full rounded-xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-2.5 text-sm transition-colors placeholder:text-[var(--color-text-light,#94A3B8)] focus:border-[var(--color-primary,#1860A8)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#1860A8)]/20"
                    placeholder="e.g., PAY-001"
                  >
                </div>
              </div>
            </section>

            <!-- Section 4: Notes -->
            <section class="space-y-4">
              <div class="flex items-center gap-3">
                <div class="h-6 w-1 rounded-full bg-[var(--color-primary,#1860A8)]"></div>
                <h3 class="text-sm font-semibold text-[var(--color-text,#0F172A)]">Additional Information</h3>
                <span class="text-xs text-[var(--color-text-light,#64748B)]">Optional notes</span>
              </div>

              <div>
                <label class="block text-sm font-medium text-[var(--color-text,#0F172A)] mb-1.5">
                  Notes
                </label>
                <textarea
                  v-model.trim="form.notes"
                  rows="3"
                  class="w-full rounded-xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-2.5 text-sm transition-colors placeholder:text-[var(--color-text-light,#94A3B8)] focus:border-[var(--color-primary,#1860A8)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#1860A8)]/20 resize-none"
                  placeholder="Any additional notes for this receipt"
                />
              </div>
            </section>
          </div>
        </div>

        <!-- Footer -->
        <div class="border-t border-[var(--color-neutral,#F1F5F9)] p-6 bg-[var(--color-neutral,#F8FAFC)] rounded-b-[32px]">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <p class="text-xs text-[var(--color-text-light,#64748B)]">
              <span class="font-medium text-[var(--color-text,#0F172A)]">{{ form.amount ? formatMoney(form.amount) : '0.00' }}</span> amount
            </p>

            <div class="flex flex-wrap gap-3">
              <button
                type="button"
                class="rounded-xl border border-[var(--color-neutral-dark,#E2E8F0)] bg-white px-5 py-2.5 text-sm font-medium text-[var(--color-text,#0F172A)] transition-colors hover:bg-[var(--color-neutral,#F8FAFC)] disabled:opacity-50"
                :disabled="isSubmitting"
                @click="$emit('cancel')"
              >
                Cancel
              </button>

              <button
                type="submit"
                class="rounded-xl bg-[var(--color-accent,#000000)] px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-[var(--color-text,#1E293B)] hover:shadow-md active:scale-95 disabled:opacity-60 disabled:active:scale-100 flex items-center gap-2"
                :disabled="isSubmitting"
              >
                <svg v-if="!isSubmitting" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                <svg v-else class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {{ isSubmitting ? 'Saving...' : isEditing ? 'Update Receipt' : 'Create Receipt' }}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, reactive, ref, onMounted } from 'vue'
import { formatMoney } from '../services/financeFormatters.js'

const props = defineProps({
  isSubmitting: {
    type: Boolean,
    default: false,
  },
  isEditing: {
    type: Boolean,
    default: false,
  },
  editData: {
    type: Object,
    default: null,
  },
  clients: {
    type: Array,
    default: () => [],
  },
  engagements: {
    type: Array,
    default: () => [],
  },
  isLoadingClients: {
    type: Boolean,
    default: false,
  },
  isLoadingEngagements: {
    type: Boolean,
    default: false,
  },
  canLoadMoreClients: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits([
  'submit',
  'cancel',
  'select-client',
  'load-more-clients',
])

const today = new Date().toISOString().slice(0, 10)

const clientMode = ref('manual')
const selectedClientId = ref('')
const selectedEngagementId = ref('')

const manualClient = reactive({
  name: '',
  number: '',
  email: '',
  phone: '',
})

const form = reactive({
  receiptCode: '',
  receiptType: 'payment',
  paymentDate: today,
  paymentMethod: 'bank_transfer',
  amount: 0,
  currency: 'NAD',
  status: 'issued',
  referenceNumber: '',
  description: '',
  notes: '',
  invoiceId: '',
  invoiceCode: '',
  paymentId: '',
  paymentCode: '',
  clientId: '',
  clientLabel: '',
  clientEmail: '',
  clientPhone: '',
  engagementId: '',
  engagementCode: '',
})

// Populate form if editing
onMounted(() => {
  if (props.isEditing && props.editData) {
    form.receiptCode = props.editData.receiptCode || ''
    form.receiptType = props.editData.receiptType || 'payment'
    form.paymentDate = props.editData.paymentDate ? 
      new Date(props.editData.paymentDate).toISOString().slice(0, 10) : today
    form.paymentMethod = props.editData.paymentMethod || 'bank_transfer'
    form.amount = props.editData.amount || 0
    form.currency = props.editData.currency || 'NAD'
    form.status = props.editData.status || 'draft'
    form.referenceNumber = props.editData.referenceNumber || ''
    form.description = props.editData.description || ''
    form.notes = props.editData.notes || ''
    form.invoiceId = props.editData.invoiceId || ''
    form.invoiceCode = props.editData.invoiceCode || ''
    form.paymentId = props.editData.paymentId || ''
    form.paymentCode = props.editData.paymentCode || ''
    form.clientId = props.editData.clientId || ''
    form.clientLabel = props.editData.clientLabel || ''
    form.clientEmail = props.editData.clientEmail || ''
    form.clientPhone = props.editData.clientPhone || ''
    form.engagementId = props.editData.engagementId || ''
    form.engagementCode = props.editData.engagementCode || ''

    if (form.clientId) {
      clientMode.value = 'existing'
      selectedClientId.value = form.clientId
      selectedEngagementId.value = form.engagementId
    }
  }
})

function unwrapRecord(record) {
  const data = record?.data && typeof record.data === 'object' ? record.data : record
  return {
    id: record?.id || data?.id || record?.docId || record?._id,
    ...data,
  }
}

function buildClientLabel(client) {
  const firstName = String(client?.firstName || '').trim()
  const lastName = String(client?.lastName || '').trim()
  const fullName = String(client?.fullName || '').trim()
  return [firstName, lastName].filter(Boolean).join(' ') || fullName || 'Unnamed client'
}

function buildEngagementLabel(engagement) {
  return [
    engagement?.engagementCode,
    engagement?.title,
  ].filter(Boolean).join(' — ') || 'Unnamed engagement'
}

const normalizedClients = computed(() => {
  return props.clients
    .map(unwrapRecord)
    .filter((client) => client?.id && client?.isDeleted !== true)
    .map((client) => ({
      ...client,
      label: buildClientLabel(client),
    }))
})

const normalizedEngagements = computed(() => {
  return props.engagements
    .map(unwrapRecord)
    .filter((engagement) => engagement?.id && engagement?.isDeleted !== true)
    .map((engagement) => ({
      ...engagement,
      label: buildEngagementLabel(engagement),
    }))
})

const filteredEngagements = computed(() => {
  if (!selectedClientId.value) return []
  return normalizedEngagements.value.filter((engagement) => {
    return engagement.clientId === selectedClientId.value
  })
})

function setClientMode(mode) {
  clientMode.value = mode
  selectedClientId.value = ''
  selectedEngagementId.value = ''
  form.clientId = ''
  form.clientLabel = ''
  form.clientEmail = ''
  form.clientPhone = ''
  form.engagementId = ''
  form.engagementCode = ''
}

function handleClientChange() {
  const client = normalizedClients.value.find((item) => item.id === selectedClientId.value)
  form.clientId = client?.id || ''
  form.clientLabel = client?.label || ''
  form.clientEmail = client?.email || ''
  form.clientPhone = client?.phone || ''
  selectedEngagementId.value = ''
  form.engagementId = ''
  form.engagementCode = ''
  emit('select-client', form.clientId)
}

function handleEngagementChange() {
  const engagement = filteredEngagements.value.find((item) => item.id === selectedEngagementId.value)
  form.engagementId = engagement?.id || ''
  form.engagementCode = engagement?.engagementCode || ''
}

function buildClientPayload() {
  if (clientMode.value === 'existing') {
    return {
      name: form.clientLabel,
      number: form.clientId,
      email: form.clientEmail,
      phone: form.clientPhone,
    }
  }
  return {
    name: manualClient.name,
    number: manualClient.number,
    email: manualClient.email,
    phone: manualClient.phone,
  }
}

function toIsoDate(value) {
  return value ? `${value}T00:00:00.000Z` : null
}

function submit() {
  const client = buildClientPayload()
  
  emit('submit', {
    ...form,
    paymentDate: toIsoDate(form.paymentDate),
    client: client,
    clientLabel: client.name,
    clientEmail: client.email,
    clientPhone: client.phone,
  })
}
</script>

<style scoped>
.max-h-\[92vh\] {
  scroll-behavior: smooth;
}

.max-h-\[92vh\]::-webkit-scrollbar {
  width: 6px;
}

.max-h-\[92vh\]::-webkit-scrollbar-track {
  background: transparent;
}

.max-h-\[92vh\]::-webkit-scrollbar-thumb {
  background: var(--color-neutral-dark, #E2E8F0);
  border-radius: 9999px;
}

.max-h-\[92vh\]::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-light, #94A3B8);
}

input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}

input, select, textarea, button {
  transition: all 0.2s ease;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 0.8s linear infinite;
}
</style>
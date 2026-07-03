<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/55 p-4">
      <form
        class="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[32px] border border-[var(--color-neutral-dark,#E2E8F0)] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]"
        @submit.prevent="submit"
      >
        <!-- Close button - top right -->
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
                  Client Estimate
                </span>
              </p>

              <h2 class="mt-1.5 text-2xl font-semibold tracking-tight text-[var(--color-text,#0F172A)]">
                Create Quotation
              </h2>

              <p class="mt-1 text-sm text-[var(--color-text-light,#64748B)]">
                Fill in the details below to generate a professional quotation for your client.
              </p>
            </div>
          </div>
        </div>

        <!-- Form Body -->
        <div class="p-6">
          <div class="space-y-6">
            <!-- Section 1: Client Selection -->
            <section class="space-y-4">
              <div class="flex items-center gap-3">
                <div class="h-6 w-1 rounded-full bg-[var(--color-primary,#1860A8)]"></div>
                <h3 class="text-sm font-semibold text-[var(--color-text,#0F172A)]">Client Information</h3>
                <span class="text-xs text-[var(--color-text-light,#64748B)]">Who is this quotation for?</span>
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

            <!-- Section 2: Quotation Details -->
            <section class="space-y-4">
              <div class="flex items-center gap-3">
                <div class="h-6 w-1 rounded-full bg-[var(--color-primary,#1860A8)]"></div>
                <h3 class="text-sm font-semibold text-[var(--color-text,#0F172A)]">Quotation Details</h3>
                <span class="text-xs text-[var(--color-text-light,#64748B)]">Set the scope and terms</span>
              </div>

              <div class="grid gap-4 sm:grid-cols-2">
                <!-- <div>
                  <label class="block text-sm font-medium text-[var(--color-text,#0F172A)] mb-1.5">
                    Quotation Code
                  </label>
                  <input
                    v-model.trim="form.quoteCode"
                    class="w-full rounded-xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-2.5 text-sm transition-colors placeholder:text-[var(--color-text-light,#94A3B8)] focus:border-[var(--color-primary,#1860A8)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#1860A8)]/20"
                    placeholder="Auto-generated if left blank"
                  >
                </div> -->

                <div>
                  <label class="block text-sm font-medium text-[var(--color-text,#0F172A)] mb-1.5">
                    Status <span class="text-rose-500">*</span>
                  </label>
                  <select
                    v-model="form.status"
                    class="w-full rounded-xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-2.5 text-sm transition-colors focus:border-[var(--color-primary,#1860A8)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#1860A8)]/20"
                  >
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-[var(--color-text,#0F172A)] mb-1.5">
                    Quote Date <span class="text-rose-500">*</span>
                  </label>
                  <input
                    v-model="form.quoteDate"
                    type="date"
                    required
                    class="w-full rounded-xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-2.5 text-sm transition-colors focus:border-[var(--color-primary,#1860A8)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#1860A8)]/20"
                  >
                </div>

                <div>
                  <label class="block text-sm font-medium text-[var(--color-text,#0F172A)] mb-1.5">
                    Valid Until
                  </label>
                  <input
                    v-model="form.validUntil"
                    type="date"
                    class="w-full rounded-xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-2.5 text-sm transition-colors focus:border-[var(--color-primary,#1860A8)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#1860A8)]/20"
                  >
                </div>

                <div>
                  <label class="block text-sm font-medium text-[var(--color-text,#0F172A)] mb-1.5">
                    Reference Label
                  </label>
                  <input
                    v-model.trim="form.referenceLabel"
                    class="w-full rounded-xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-2.5 text-sm transition-colors placeholder:text-[var(--color-text-light,#94A3B8)] focus:border-[var(--color-primary,#1860A8)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#1860A8)]/20"
                    placeholder="e.g., Project, Service, Engagement"
                  >
                </div>

                <div>
                  <label class="block text-sm font-medium text-[var(--color-text,#0F172A)] mb-1.5">
                    Reference Value
                  </label>
                  <input
                    v-model.trim="form.referenceValue"
                    class="w-full rounded-xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-2.5 text-sm transition-colors placeholder:text-[var(--color-text-light,#94A3B8)] focus:border-[var(--color-primary,#1860A8)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#1860A8)]/20"
                    placeholder="e.g. Assignment Proofreading"
                  >
                </div>
              </div>
            </section>

            <!-- Section 3: Line Items & Pricing -->
            <section class="space-y-4">
              <div class="flex items-center gap-3">
                <div class="h-6 w-1 rounded-full bg-[var(--color-primary,#1860A8)]"></div>
                <h3 class="text-sm font-semibold text-[var(--color-text,#0F172A)]">Line Items & Pricing</h3>
                <span class="text-xs text-[var(--color-text-light,#64748B)]">What are you quoting for?</span>
              </div>

              <div class="grid gap-4 sm:grid-cols-3">
                <div class="sm:col-span-3">
                  <label class="block text-sm font-medium text-[var(--color-text,#0F172A)] mb-1.5">
                    Description <span class="text-rose-500">*</span>
                  </label>
                  <input
                    v-model.trim="line.description"
                    required
                    class="w-full rounded-xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-2.5 text-sm transition-colors placeholder:text-[var(--color-text-light,#94A3B8)] focus:border-[var(--color-primary,#1860A8)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#1860A8)]/20"
                    placeholder="What product or service are you quoting?"
                  >
                </div>

                <div>
                  <label class="block text-sm font-medium text-[var(--color-text,#0F172A)] mb-1.5">
                    Quantity <span class="text-rose-500">*</span>
                  </label>
                  <input
                    v-model.number="line.quantity"
                    type="number"
                    min="1"
                    step="1"
                    required
                    class="w-full rounded-xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-2.5 text-sm transition-colors focus:border-[var(--color-primary,#1860A8)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#1860A8)]/20"
                  >
                </div>

                <div>
                  <label class="block text-sm font-medium text-[var(--color-text,#0F172A)] mb-1.5">
                    Unit Price <span class="text-rose-500">*</span>
                  </label>
                  <input
                    v-model.number="line.unitPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    class="w-full rounded-xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-2.5 text-sm transition-colors focus:border-[var(--color-primary,#1860A8)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#1860A8)]/20"
                  >
                </div>

                <div>
                  <label class="block text-sm font-medium text-[var(--color-text,#0F172A)] mb-1.5">
                    Currency
                  </label>
                  <select
                    v-model="form.currency"
                    class="w-full rounded-xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-2.5 text-sm transition-colors focus:border-[var(--color-primary,#1860A8)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#1860A8)]/20"
                  >
                    <option value="NAD">NAD</option>
                    <option value="ZAR">ZAR</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>

              <!-- Financial Summary Card -->
              <div class="grid gap-4 sm:grid-cols-3">
                <div>
                  <label class="block text-sm font-medium text-[var(--color-text,#0F172A)] mb-1.5">
                    Discount
                  </label>
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-light,#64748B)]">{{ form.currency }}</span>
                    <input
                      v-model.number="form.discountAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      class="w-full rounded-xl border border-[var(--color-neutral-dark,#E2E8F0)] pl-8 pr-4 py-2.5 text-sm transition-colors focus:border-[var(--color-primary,#1860A8)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#1860A8)]/20"
                      placeholder="0.00"
                    >
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-[var(--color-text,#0F172A)] mb-1.5">
                    Deposit Required
                  </label>
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-light,#64748B)]">{{ form.currency }}</span>
                    <input
                      v-model.number="form.depositAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      class="w-full rounded-xl border border-[var(--color-neutral-dark,#E2E8F0)] pl-8 pr-4 py-2.5 text-sm transition-colors focus:border-[var(--color-primary,#1860A8)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#1860A8)]/20"
                      placeholder="0.00"
                    >
                  </div>
                </div>

                <div class="rounded-xl bg-[var(--color-primary,#1860A8)]/5 border border-[var(--color-primary,#1860A8)]/20 p-4 flex flex-col justify-center">
                  <p class="text-xs font-medium uppercase tracking-[0.12em] text-[var(--color-primary,#1860A8)]">
                    Estimated Total
                  </p>
                  <p class="mt-1 text-2xl font-bold text-[var(--color-primary,#1860A8)]">
                    {{ estimatedTotalText }}
                  </p>
                </div>
              </div>
            </section>

            <!-- Section 4: Terms & Notes -->
            <section class="space-y-4">
              <div class="flex items-center gap-3">
                <div class="h-6 w-1 rounded-full bg-[var(--color-primary,#1860A8)]"></div>
                <h3 class="text-sm font-semibold text-[var(--color-text,#0F172A)]">Terms & Notes</h3>
                <span class="text-xs text-[var(--color-text-light,#64748B)]">Additional information</span>
              </div>

              <div class="grid gap-4">
                <div>
                  <label class="block text-sm font-medium text-[var(--color-text,#0F172A)] mb-1.5">
                    Notes
                  </label>
                  <textarea
                    v-model.trim="form.notes"
                    rows="2"
                    class="w-full rounded-xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-2.5 text-sm transition-colors placeholder:text-[var(--color-text-light,#94A3B8)] focus:border-[var(--color-primary,#1860A8)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#1860A8)]/20 resize-none"
                    placeholder="Any additional notes for this quotation"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-[var(--color-text,#0F172A)] mb-1.5">
                    Terms & Conditions
                  </label>
                  <textarea
                    v-model.trim="termsText"
                    rows="3"
                    class="w-full rounded-xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-2.5 text-sm transition-colors placeholder:text-[var(--color-text-light,#94A3B8)] focus:border-[var(--color-primary,#1860A8)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#1860A8)]/20 resize-none font-mono text-xs"
                    placeholder="Enter each term on a new line&#10;e.g.,&#10;50% deposit is required before work begins&#10;Final payment due upon completion"
                  />
                </div>
              </div>
            </section>
          </div>
        </div>

        <!-- Footer -->
        <div class="border-t border-[var(--color-neutral,#F1F5F9)] p-6 bg-[var(--color-neutral,#F8FAFC)] rounded-b-[32px]">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <p class="text-xs text-[var(--color-text-light,#64748B)]">
              <span class="font-medium text-[var(--color-text,#0F172A)]">{{ estimatedTotalText }}</span> estimated total
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
                {{ isSubmitting ? 'Creating...' : 'Create Quotation' }}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'

const props = defineProps({
  isSubmitting: {
    type: Boolean,
    default: false,
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
const termsText = ref('')

const manualClient = reactive({
  name: '',
  number: '',
  email: '',
  phone: '',
})

const form = reactive({
  quoteCode: '',
  status: 'draft',
  quoteDate: today,
  validUntil: '',
  clientId: '',
  clientNumber: '',
  clientLabel: '',
  clientEmail: '',
  clientPhone: '',
  engagementId: '',
  engagementCode: '',
  referenceLabel: 'Project',
  referenceValue: '',
  discountAmount: 0,
  depositAmount: 0,
  currency: 'NAD',
  notes: '',
})

const line = reactive({
  description: '',
  quantity: 1,
  unitPrice: 0,
})

const lineTotal = computed(() => {
  return Number(line.quantity || 0) * Number(line.unitPrice || 0)
})

const estimatedTotal = computed(() => {
  return Math.max(lineTotal.value - Number(form.discountAmount || 0), 0)
})

const estimatedTotalText = computed(() => {
  return new Intl.NumberFormat('en-NA', {
    style: 'currency',
    currency: form.currency || 'NAD',
    minimumFractionDigits: 2,
  }).format(estimatedTotal.value)
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
  ]
    .filter(Boolean)
    .join(' — ') || 'Unnamed engagement'
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
  form.clientNumber = ''
  form.clientLabel = ''
  form.clientEmail = ''
  form.clientPhone = ''
  form.engagementId = ''
  form.engagementCode = ''

  if (mode === 'manual') {
    form.referenceLabel = 'Project'
  }
}

function handleClientChange() {
  const client = normalizedClients.value.find((item) => item.id === selectedClientId.value)

  form.clientId = client?.id || ''
  form.clientNumber = client?.clientNumber || ''
  form.clientLabel = client?.label || ''
  form.clientEmail = client?.email || ''
  form.clientPhone = client?.phone || ''

  selectedEngagementId.value = ''
  form.engagementId = ''
  form.engagementCode = ''
  form.referenceLabel = 'Engagement'
  form.referenceValue = ''

  emit('select-client', form.clientId)
}

function handleEngagementChange() {
  const engagement = filteredEngagements.value.find((item) => item.id === selectedEngagementId.value)

  form.engagementId = engagement?.id || ''
  form.engagementCode = engagement?.engagementCode || ''
  form.referenceLabel = 'Engagement'
  form.referenceValue = engagement?.engagementCode || engagement?.title || ''
}

function toIsoDate(value) {
  return value ? `${value}T00:00:00.000Z` : null
}

function buildClientPayload() {
  if (clientMode.value === 'existing') {
    return {
      name: form.clientLabel,
      number: form.clientNumber || form.clientId,
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

function termsList() {
  return termsText.value
    .split('\n')
    .map((term) => term.trim())
    .filter(Boolean)
}

function submit() {
  const client = buildClientPayload()

  emit('submit', {
    quoteCode: form.quoteCode,
    quotationCode: form.quoteCode,
    status: form.status,
    quoteDate: toIsoDate(form.quoteDate),
    validUntil: toIsoDate(form.validUntil),

    client,

    clientId: form.clientId,
    clientNumber: form.clientNumber,
    clientLabel: client.name,
    clientEmail: client.email,
    clientPhone: client.phone,

    engagementId: form.engagementId,
    engagementCode: form.engagementCode,

    reference: {
      label: form.referenceLabel || 'Project',
      value: form.referenceValue || form.engagementCode || line.description,
    },

    lineItems: [
      {
        description: line.description,
        quantity: Number(line.quantity || 1),
        unitPrice: Number(line.unitPrice || 0),
      },
    ],

    discountAmount: Number(form.discountAmount || 0),
    depositAmount: Number(form.depositAmount || 0),
    totalAmount: estimatedTotal.value,
    currency: form.currency || 'NAD',
    notes: form.notes,
    terms: termsList(),
    showAcceptance: true,
  })
}
</script>

<style scoped>
/* Smooth scroll for the form container */
.max-h-\[92vh\] {
  scroll-behavior: smooth;
}

/* Custom scrollbar styling */
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

/* Hide number input arrows */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}

/* Smooth transitions */
input, select, textarea, button {
  transition: all 0.2s ease;
}

/* Loading spinner animation */
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
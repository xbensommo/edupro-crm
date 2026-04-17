<template>
  <section class="card space-y-4">
    <div>
      <p class="text-caption">Billing</p>
      <h3 class="section-title text-lg md:text-xl">Financials</h3>
    </div>

    <div class="grid gap-4 md:grid-cols-3">
      <label class="block text-sm">
        <span class="field-label">Tax Rate %</span>
        <input v-model.number="documentDraft.finance.taxRate" type="number" min="0" step="0.01" class="input-field" />
      </label>

      <div class="card-soft p-4">
        <span class="text-caption">Subtotal</span>
        <strong class="mt-2 block text-lg text-[var(--color-text)]">
          {{ formatMoney(normalizedDocument.finance.subtotal, normalizedDocument.meta.currency) }}
        </strong>
      </div>

      <div class="card-soft p-4">
        <span class="text-caption">Total</span>
        <strong class="mt-2 block text-lg text-[var(--color-text)]">
          {{ formatMoney(normalizedDocument.finance.total, normalizedDocument.meta.currency) }}
        </strong>
      </div>
    </div>

    <RichTextBlockEditor v-model="documentDraft.finance.paymentTermsHtml" label="Payment Terms" />
  </section>
</template>

<script setup>
import { formatMoney } from '../../utils/money.js';
import RichTextBlockEditor from './RichTextBlockEditor.vue';

defineProps({
  documentDraft: { type: Object, required: true },
  normalizedDocument: { type: Object, required: true },
});
</script>

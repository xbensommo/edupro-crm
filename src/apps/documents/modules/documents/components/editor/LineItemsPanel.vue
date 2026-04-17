<template>
  <section class="card space-y-4">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p class="text-caption">Billing rows</p>
        <h3 class="section-title text-lg md:text-xl">Line Items</h3>
      </div>

      <button type="button" class="btn-primary btn-sm w-full sm:w-auto" @click="$emit('add')">
        <i class="fa-solid fa-plus"></i>
        Add Line Item
      </button>
    </div>

    <div class="space-y-4">
      <article
        v-for="(item, index) in items"
        :key="item.id || index"
        class="card-soft space-y-4 p-4"
      >
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span class="text-caption">Item {{ index + 1 }}</span>
          <button type="button" class="btn-outline btn-sm w-full sm:w-auto" @click="$emit('remove', index)">
            <i class="fa-solid fa-trash-can"></i>
            Remove
          </button>
        </div>

        <div class="grid gap-3 md:grid-cols-3">
          <textarea
            v-model="item.description"
            rows="3"
            class="textarea-field md:col-span-3"
            placeholder="Description"
          ></textarea>
          <input v-model.number="item.quantity" type="number" min="0" class="input-field" placeholder="Qty" />
          <input v-model.number="item.unitPrice" type="number" min="0" step="0.01" class="input-field" placeholder="Rate" />

          <div class="card p-4">
            <span class="text-caption">Line Total</span>
            <strong class="mt-2 block text-[var(--color-text)]">
              {{ formatMoney((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), currency) }}
            </strong>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
import { formatMoney } from '../../utils/money.js';

defineProps({
  items: { type: Array, default: () => [] },
  currency: { type: String, default: 'NAD' },
});

defineEmits(['add', 'remove']);
</script>

<template>
  <section class="mb-5 break-inside-avoid">
    <h3 class="mb-3 text-xs font-bold uppercase tracking-[0.14em]" :style="{ color: document.brand.accentColor }">{{ section.title }}</h3>

    <div v-if="section.kind === 'meta'" class="grid gap-4 md:grid-cols-3">
      <div class="preview-card p-3">
        <div class="preview-kicker">Number</div>
        <strong class="mt-2 block break-words">{{ section.meta.number || 'Draft' }}</strong>
      </div>
      <div class="preview-card p-3">
        <div class="preview-kicker">Status</div>
        <strong class="mt-2 block break-words">{{ section.meta.status }}</strong>
      </div>
      <div class="preview-card p-3">
        <div class="preview-kicker">Issued On</div>
        <strong class="mt-2 block break-words">{{ formatDate(section.meta.issuedOn) }}</strong>
      </div>
    </div>

    <div v-else-if="section.kind === 'parties'" class="grid gap-4 md:grid-cols-2">
      <div class="preview-card p-4">
        <div class="preview-kicker">Issuer</div>
        <strong class="mt-2 block break-words">{{ section.parties.issuer.companyName }}</strong>
        <div class="mt-2 whitespace-pre-line text-sm leading-6 preview-copy break-words">{{ formatParty(section.parties.issuer) }}</div>
      </div>
      <div class="preview-card p-4">
        <div class="preview-kicker">Client</div>
        <strong class="mt-2 block break-words">{{ section.parties.client.companyName }}</strong>
        <div class="mt-2 whitespace-pre-line text-sm leading-6 preview-copy break-words">{{ formatParty(section.parties.client) }}</div>
      </div>
    </div>

    <div v-else-if="section.kind === 'summary' || section.kind === 'rich-text' || section.kind === 'notes'" class="preview-card p-4 preview-html" v-html="section.html"></div>

    <div v-else-if="section.kind === 'list'" class="overflow-hidden border preview-border">
      <table class="w-full border-collapse table-fixed text-sm">
        <thead>
          <tr class="preview-head-row">
            <th class="w-[28%] border-b border-r preview-border px-3 py-2 text-left font-semibold">Item</th>
            <th class="border-b preview-border px-3 py-2 text-left font-semibold">Details</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in section.items" :key="item.id">
            <td class="border-r border-t preview-border px-3 py-3 align-top font-semibold break-words">{{ item.label }}</td>
            <td class="border-t preview-border px-3 py-3 align-top whitespace-pre-line break-words">{{ item.value }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else-if="section.kind === 'table'" class="overflow-hidden border preview-border">
      <table class="w-full border-collapse table-fixed text-sm">
        <thead>
          <tr class="text-white" :style="{ backgroundColor: document.brand.primaryColor }">
            <th
              v-for="column in section.columns"
              :key="column.key"
              class="border-r px-3 py-3 font-semibold last:border-r-0"
              :class="column.align === 'right' ? 'text-right' : 'text-left'"
              :style="{ width: column.width, borderColor: 'rgba(255,255,255,0.18)' }"
            >
              {{ column.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in section.items" :key="item.id">
            <td class="border-t border-r preview-border px-3 py-3 align-top whitespace-pre-line break-words">{{ item.description }}</td>
            <td class="border-t border-r preview-border px-3 py-3 text-right align-top">{{ item.quantity }}</td>
            <td class="border-t border-r preview-border px-3 py-3 text-right align-top break-words">{{ formatMoney(item.unitPrice, document.meta.currency) }}</td>
            <td class="border-t preview-border px-3 py-3 text-right align-top font-semibold break-words">{{ formatMoney(item.total, document.meta.currency) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else-if="section.kind === 'totals'" class="ml-auto w-full max-w-[320px] border preview-border">
      <div class="grid grid-cols-[1fr_auto] gap-3 border-b preview-border px-4 py-3 text-sm">
        <span>Subtotal</span>
        <strong>{{ formatMoney(section.finance.subtotal, document.meta.currency) }}</strong>
      </div>
      <div class="grid grid-cols-[1fr_auto] gap-3 border-b preview-border px-4 py-3 text-sm">
        <span>Tax ({{ section.finance.taxRate }}%)</span>
        <strong>{{ formatMoney(section.finance.taxAmount, document.meta.currency) }}</strong>
      </div>
      <div class="grid grid-cols-[1fr_auto] gap-3 px-4 py-4 text-sm font-bold uppercase tracking-[0.12em] text-white" :style="{ backgroundColor: document.brand.accentColor }">
        <span>Total</span>
        <span>{{ formatMoney(section.finance.total, document.meta.currency) }}</span>
      </div>
    </div>

    <div v-else-if="section.kind === 'signatures'" class="grid gap-4 md:grid-cols-2">
      <div class="preview-card p-4">
        <div class="preview-kicker">Issuer</div>
        <strong class="mt-2 block break-words">{{ section.signatures.issuer.name }}</strong>
        <div class="preview-copy text-sm break-words">{{ section.signatures.issuer.title }}</div>
        <div class="preview-copy text-sm">{{ formatDate(section.signatures.issuer.signedOn) }}</div>
        <img v-if="issuerSignatureImage" :src="issuerSignatureImage" alt="Issuer signature" class="mt-3 max-h-16 object-contain" />
        <div v-else-if="section.signatures.issuer.initials" class="mt-4 text-xl font-bold">{{ section.signatures.issuer.initials }}</div>
      </div>
      <div class="preview-card p-4">
        <div class="preview-kicker">Client</div>
        <strong class="mt-2 block break-words">{{ section.signatures.client.name }}</strong>
        <div class="preview-copy text-sm break-words">{{ section.signatures.client.title }}</div>
        <div class="preview-copy text-sm">{{ formatDate(section.signatures.client.signedOn) }}</div>
        <img v-if="clientSignatureImage" :src="clientSignatureImage" alt="Client signature" class="mt-3 max-h-16 object-contain" />
        <div v-else-if="section.signatures.client.initials" class="mt-4 text-xl font-bold">{{ section.signatures.client.initials }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { formatDate } from '../../utils/date.js';
import { formatMoney } from '../../utils/money.js';

const props = defineProps({
  section: { type: Object, required: true },
  document: { type: Object, required: true },
});

const issuerSignatureImage = computed(() => props.section.signatures?.issuer?.imageUrl || props.section.signatures?.issuer?.drawnDataUrl || '');
const clientSignatureImage = computed(() => props.section.signatures?.client?.imageUrl || props.section.signatures?.client?.drawnDataUrl || '');

function formatParty(party) {
  return [party.contactName, party.email, party.phone, party.address].filter(Boolean).join('\n');
}
</script>

<style scoped>
.preview-card {
  border: 1px solid rgba(13, 27, 42, 0.08);
  background: rgba(244, 240, 232, 0.35);
}

.preview-kicker {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: rgba(26, 26, 26, 0.55);
}

.preview-copy,
.preview-head-row {
  color: rgba(26, 26, 26, 0.72);
}

.preview-head-row {
  background: rgba(244, 240, 232, 0.9);
}

.preview-border {
  border-color: rgba(13, 27, 42, 0.08);
}

.preview-html :deep(h1),
.preview-html :deep(h2),
.preview-html :deep(h3),
.preview-html :deep(p),
.preview-html :deep(li),
.preview-html :deep(blockquote) {
  margin: 0 0 12px;
  line-height: 1.7;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.preview-html :deep(h1) {
  font-size: 1.2rem;
  font-weight: 800;
}

.preview-html :deep(h2) {
  font-size: 1rem;
  font-weight: 700;
}

.preview-html :deep(ul),
.preview-html :deep(ol) {
  margin: 0 0 12px;
  padding-left: 1.25rem;
}

.preview-html :deep(*:last-child) {
  margin-bottom: 0;
}
</style>

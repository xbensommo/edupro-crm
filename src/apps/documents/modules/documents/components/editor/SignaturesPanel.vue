<template>
  <section class="card space-y-4">
    <div>
      <p class="text-caption">Approvals</p>
      <h3 class="section-title text-lg md:text-xl">Signatures</h3>
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
      <div class="card-soft p-4 md:p-5">
        <p class="text-caption">Sender sign-off</p>
        <h4 class="mb-4 text-base font-semibold text-[var(--color-text)]">Issuer Signature</h4>
        <SignaturePadField v-model="documentDraft.signatures.issuer" />
      </div>

      <div class="card-soft p-4 md:p-5">
        <p class="text-caption">Recipient sign-off</p>
        <h4 class="mb-4 text-base font-semibold text-[var(--color-text)]">Client Signature</h4>
        <SignaturePadField v-model="documentDraft.signatures.client" />
      </div>
    </div>
  </section>
</template>

<script setup>
import SignaturePadField from './SignaturePadField.vue';

defineProps({
  documentDraft: { type: Object, required: true },
});
</script>

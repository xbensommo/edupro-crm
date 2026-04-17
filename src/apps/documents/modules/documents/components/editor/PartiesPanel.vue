<template>
  <section class="card space-y-4">
    <div>
      <p class="text-caption">Participants</p>
      <h3 class="section-title text-lg md:text-xl">Parties</h3>
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
      <div class="card-soft p-4 md:p-5">
        <div class="mb-4 flex items-center justify-between gap-3">
          <div>
            <p class="text-caption">Sender</p>
            <h4 class="text-base font-semibold text-[var(--color-text)]">Issuer</h4>
          </div>
        </div>

        <div class="grid gap-3">
          <input v-model="documentDraft.parties.issuer.companyName" class="input-field" placeholder="Company name" />
          <input v-model="documentDraft.parties.issuer.contactName" class="input-field" placeholder="Contact name" />
          <input v-model="documentDraft.parties.issuer.email" class="input-field" placeholder="Email" />
          <input v-model="documentDraft.parties.issuer.phone" class="input-field" placeholder="Phone" />
          <textarea v-model="documentDraft.parties.issuer.address" rows="3" class="textarea-field" placeholder="Address"></textarea>
        </div>
      </div>

      <div class="card-soft p-4 md:p-5">
        <div class="mb-4 flex items-center justify-between gap-3">
          <div>
            <p class="text-caption">Recipient</p>
            <h4 class="text-base font-semibold text-[var(--color-text)]">Client</h4>
          </div>
        </div>

        <div class="grid gap-3">
          <input v-model="documentDraft.parties.client.companyName" class="input-field" placeholder="Company name" />
          <input v-model="documentDraft.parties.client.contactName" class="input-field" placeholder="Contact name" />
          <input v-model="documentDraft.parties.client.email" class="input-field" placeholder="Email" />
          <input v-model="documentDraft.parties.client.phone" class="input-field" placeholder="Phone" />
          <textarea v-model="documentDraft.parties.client.address" rows="3" class="textarea-field" placeholder="Address"></textarea>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
defineProps({
  documentDraft: { type: Object, required: true },
});
</script>

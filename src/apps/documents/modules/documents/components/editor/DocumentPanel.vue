<template>
  <section class="card space-y-4">
    <div>
      <p class="text-caption">Basics</p>
      <h3 class="section-title text-lg md:text-xl">Document</h3>
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <label class="block text-sm">
        <span class="field-label">Title</span>
        <input v-model="documentDraft.meta.title" class="input-field" />
      </label>

      <label class="block text-sm">
        <span class="field-label">Number</span>
        <input v-model="documentDraft.meta.number" class="input-field" />
      </label>

      <label class="block text-sm">
        <span class="field-label">Status</span>
        <select v-model="documentDraft.meta.status" class="select-field">
          <option v-for="status in definition.statuses" :key="status" :value="status">
            {{ status }}
          </option>
        </select>
      </label>

      <label class="block text-sm">
        <span class="field-label">Currency</span>
        <input v-model="documentDraft.meta.currency" class="input-field" />
      </label>

      <label class="block text-sm">
        <span class="field-label">Issued On</span>
        <input v-model="documentDraft.meta.issuedOn" type="date" class="input-field" />
      </label>

      <label class="block text-sm">
        <span class="field-label">Effective On</span>
        <input v-model="documentDraft.meta.effectiveOn" type="date" class="input-field" />
      </label>

      <label class="block text-sm">
        <span class="field-label">Due On</span>
        <input v-model="documentDraft.meta.dueOn" type="date" class="input-field" />
      </label>

      <label class="block text-sm">
        <span class="field-label">Reference</span>
        <input v-model="documentDraft.meta.reference" class="input-field" />
      </label>
    </div>
  </section>
</template>

<script setup>
defineProps({
  documentDraft: { type: Object, required: true },
  definition: { type: Object, required: true },
});
</script>

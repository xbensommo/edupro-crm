<template>
  <section class="card space-y-4">
    <div>
      <p class="text-caption">Identity</p>
      <h3 class="section-title text-lg md:text-xl">Brand</h3>
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <label class="block text-sm md:col-span-2">
        <span class="field-label">Company Name</span>
        <input v-model="documentDraft.brand.companyName" class="input-field" />
      </label>

      <label class="block text-sm md:col-span-2">
        <span class="field-label">Logo URL</span>
        <input v-model="documentDraft.brand.logoUrl" class="input-field" placeholder="https://..." />
      </label>

      <label class="block text-sm md:col-span-2">
        <span class="field-label">Logo File</span>
        <input type="file" accept="image/*" class="input-field file-upload-field" @change="onLogoFileChange" />
      </label>

      <div class="card-soft p-4 md:col-span-2">
        <span class="field-label">Logo Preview</span>
        <div class="mt-2 flex h-24 items-center justify-start overflow-hidden rounded-theme border border-theme bg-surface px-4">
          <img
            v-if="resolvedLogoUrl"
            :src="resolvedLogoUrl"
            alt="Logo preview"
            class="max-h-16 max-w-full object-contain"
            @error="clearLogo"
          />
          <span v-else class="font-display text-xl font-bold" :style="{ color: documentDraft.brand.accentColor }">{{ initials }}</span>
        </div>
      </div>

      <label class="block text-sm">
        <span class="field-label">Primary Color</span>
        <input v-model="documentDraft.brand.primaryColor" type="color" class="input-field color-field" />
      </label>

      <label class="block text-sm">
        <span class="field-label">Accent Color</span>
        <input v-model="documentDraft.brand.accentColor" type="color" class="input-field color-field" />
      </label>

      <label class="block text-sm md:col-span-2">
        <span class="field-label">Legal Line</span>
        <textarea v-model="documentDraft.brand.legalLine" rows="2" class="textarea-field"></textarea>
      </label>

      <label class="block text-sm md:col-span-2">
        <span class="field-label">Contact Line</span>
        <input v-model="documentDraft.brand.contactLine" class="input-field" />
      </label>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  documentDraft: { type: Object, required: true },
});

const resolvedLogoUrl = computed(() => props.documentDraft.brand.logoFileUrl || props.documentDraft.brand.logoUrl || '');
const initials = computed(() => String(props.documentDraft.brand.companyName || 'BD')
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0])
  .join('')
  .toUpperCase());

function onLogoFileChange(event) {
  const file = event.target?.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    props.documentDraft.brand.logoFileUrl = String(reader.result || '');
  };
  reader.readAsDataURL(file);
}

function clearLogo() {
  props.documentDraft.brand.logoUrl = '';
  props.documentDraft.brand.logoFileUrl = '';
}
</script>

<style scoped>
.file-upload-field {
  padding-top: 0.45rem;
  padding-bottom: 0.45rem;
}

.file-upload-field::file-selector-button {
  margin-right: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface-2);
  color: var(--color-text);
  padding: 0.55rem 0.9rem;
  font-weight: 600;
}

.color-field {
  min-height: var(--input-height);
  padding: 0.35rem;
}
</style>

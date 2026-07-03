<template>
  <div class="space-y-2">
    <span class="field-label mb-0">{{ label }}</span>

    <div class="input-group">
      <input
        v-model="field.draft"
        type="text"
        class="input-field pr-24"
        :placeholder="placeholder"
        @keydown.enter.prevent="$emit('add')"
      />
      <button
        type="button"
        class="btn-ghost btn-sm absolute right-1.5 top-1/2 -translate-y-1/2 px-3"
        @click="$emit('add')"
      >
        Add
      </button>
    </div>

    <p v-if="hint" class="field-hint">{{ hint }}</p>

    <ul v-if="field.items.length" class="flex flex-wrap gap-2 pt-1">
      <li v-for="(item, index) in field.items" :key="`${item}-${index}`" class="chip">
        <span>{{ item }}</span>
        <button
          type="button"
          class="text-muted transition-colors hover:text-[var(--color-danger)]"
          aria-label="Remove item"
          @click="$emit('remove', index)"
        >
          ×
        </button>
      </li>
    </ul>
    <p v-else class="text-xs text-muted">No items added yet.</p>
  </div>
</template>

<script setup>
defineProps({
  label: { type: String, required: true },
  hint: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  field: { type: Object, required: true }, // reactive({ items: [], draft: '' })
})

defineEmits(['add', 'remove'])
</script>

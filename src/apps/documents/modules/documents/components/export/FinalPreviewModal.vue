<template>
  <div v-if="open" class="overlay flex items-center justify-center p-4" @click.self="$emit('close')">
    <div class="modal-panel flex h-[92vh] w-full max-w-[1400px] flex-col overflow-hidden p-0">
      <div class="flex items-center justify-between gap-4 border-b border-theme px-5 py-4">
        <div>
          <div class="text-caption">Final Output Preview</div>
          <h3 class="mt-1 text-lg font-bold text-[var(--color-text)]">{{ title }}</h3>
        </div>

        <button type="button" class="icon-btn" @click="$emit('close')">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <iframe class="h-full w-full border-0 bg-surface-2" :srcdoc="html"></iframe>
    </div>
  </div>
</template>

<script setup>
defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: 'Preview' },
  html: { type: String, default: '' },
});

defineEmits(['close']);
</script>

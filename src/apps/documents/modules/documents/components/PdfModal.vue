<template>
  <div
    v-if="open"
    class="overlay flex items-center justify-center p-3 sm:p-5"
    @click.self="$emit('close')"
  >
    <div class="modal-panel flex h-[94vh] w-full max-w-7xl flex-col overflow-hidden p-0">
      <div class="border-b border-theme px-4 py-4 sm:px-6">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p class="text-caption">Final Output</p>
            <h3 class="mt-2 text-lg font-bold tracking-tight text-[var(--color-text)] sm:text-xl">{{ title }}</h3>
          </div>

          <div class="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <a
              v-if="pdfUrl"
              class="btn-secondary w-full sm:w-auto"
              :href="pdfUrl"
              target="_blank"
              rel="noopener"
            >
              <i class="fa-solid fa-arrow-up-right-from-square"></i>
              Open in New Page
            </a>

            <a
              v-if="pdfUrl"
              class="btn-primary w-full sm:w-auto"
              :href="pdfUrl"
              :download="`${fileName}.pdf`"
            >
              <i class="fa-solid fa-file-arrow-down"></i>
              Download
            </a>

            <button class="btn-secondary w-full sm:w-auto" type="button" @click="$emit('close')">
              <i class="fa-solid fa-xmark"></i>
              Close
            </button>
          </div>
        </div>
      </div>

      <div class="min-h-0 flex-1 bg-surface-2 p-3 sm:p-4">
        <div class="h-full overflow-hidden rounded-[1.25rem] border border-theme bg-surface shadow-theme-md">
          <iframe
            v-if="pdfUrl"
            class="h-full w-full bg-white"
            :src="pdfUrl"
            title="Final PDF Preview"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  open: { type: Boolean, default: false },
  pdfUrl: { type: String, default: '' },
  title: { type: String, default: 'Document PDF Preview' },
  fileName: { type: String, default: 'document' },
});

defineEmits(['close']);
</script>

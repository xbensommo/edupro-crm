<template>
  <button
    type="button"
    :disabled="disabled || isDownloading"
    class="rounded-2xl border border-[var(--color-neutral-dark,#E2E8F0)] px-4 py-2 text-xs font-semibold text-[var(--color-text,#0F172A)] disabled:cursor-not-allowed disabled:opacity-60"
    @click="download"
  >
    {{ isDownloading ? 'Preparing PDF...' : label }}
  </button>
</template>

<script setup>
import { ref } from 'vue'
import { downloadQuotationPdf } from '../services/quotationPdfEngine.js'

const props = defineProps({
  quotation: {
    type: Object,
    required: true,
  },
  label: {
    type: String,
    default: 'Download quotation',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  options: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['error', 'downloaded'])
const isDownloading = ref(false)

async function download() {
  if (isDownloading.value) return

  isDownloading.value = true

  try {
    await downloadQuotationPdf(props.quotation, props.options)
    emit('downloaded', props.quotation)
  } catch (error) {
    emit('error', error)
  } finally {
    isDownloading.value = false
  }
}
</script>

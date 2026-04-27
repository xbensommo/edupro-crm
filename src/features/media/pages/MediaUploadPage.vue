<template>
  <FeaturePageShell eyebrow="Media" title="Upload system files" description="Create file records for documents uploaded into the EduProLIC system.">
    <div class="grid gap-6 xl:grid-cols-[1fr,360px]">
      <UploadDropzone @select="handleSelection" />
      <aside class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 class="text-lg font-semibold text-slate-900">Selected files</h3>
        <ul class="mt-4 space-y-3 text-sm text-slate-600">
          <li v-for="item in selectedFiles" :key="item.name">{{ item.name }} · {{ item.size }} bytes</li>
        </ul>
      </aside>
    </div>
  </FeaturePageShell>
</template>

<script setup>
import { ref } from 'vue'
import FeaturePageShell from '../components/FeaturePageShell.vue'
import UploadDropzone from '../components/UploadDropzone.vue'
import { createMediaService } from '../services/mediaService.js'

const mediaService = createMediaService()
const selectedFiles = ref([])

async function handleSelection(files) {
  selectedFiles.value = files
  for (const file of files) {
    await mediaService.saveFile({
      name: file.name,
      originalName: file.name,
      mimeType: file.type || 'application/octet-stream',
      extension: file.name.includes('.') ? file.name.split('.').pop() : '',
      size: file.size,
      storagePath: `uploads/${Date.now()}_${file.name}`,
      metadata: { source: 'system-file-upload' },
      sourceModule: 'media',
      visibility: 'internal',
    })
  }
}
</script>

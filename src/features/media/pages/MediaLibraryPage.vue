<template>
  <FeaturePageShell eyebrow="Media" title="System files" description="Browse files uploaded into the EduProLIC system and keep an audit trail of who did what.">
    <div class="grid gap-6 xl:grid-cols-[1fr,340px]">
      <div>
        <MediaGrid v-if="files.length" :files="files" @select="selectedFile = $event" />
        <div v-else class="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
          No system files yet.
        </div>
      </div>
      <div class="space-y-4">
        <MediaDetailsPanel :file="selectedFile" />
        <div v-if="selectedFile" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <button class="btn-primary" type="button" @click="handleDownload(selectedFile)">Record download</button>
        </div>
      </div>
    </div>
  </FeaturePageShell>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import FeaturePageShell from '../components/FeaturePageShell.vue'
import MediaGrid from '../components/MediaGrid.vue'
import MediaDetailsPanel from '../components/MediaDetailsPanel.vue'
import { createMediaService } from '../services/mediaService.js'

const mediaService = createMediaService()
const files = ref([])
const selectedFile = ref(null)

async function loadFiles() {
  files.value = await mediaService.listFiles()
  selectedFile.value = files.value[0] || null
}

async function handleDownload(file) {
  await mediaService.recordDownload(file)
  await loadFiles()
}

onMounted(loadFiles)
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div class="card-soft w-full max-w-lg space-y-5">
        <div>
          <p class="section-label mb-3">Access control</p>
          <h3 class="section-title">Suspend {{ user?.displayName || user?.email || 'user' }}?</h3>
          <p class="mt-2 text-sm text-muted">This blocks access across the entire system on the next auth sync.</p>
        </div>

        <label class="grid gap-2">
          <span class="field-label mb-0">Reason</span>
          <textarea v-model="reason" rows="4" class="input-field min-h-32" placeholder="Explain why access is being suspended." />
        </label>

        <div class="flex flex-wrap justify-end gap-3">
          <button type="button" class="btn-secondary" @click="$emit('close')">Cancel</button>
          <button type="button" class="btn-primary" @click="$emit('confirm', reason)">Suspend user</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  user: {
    type: Object,
    default: null,
  },
})

defineEmits(['close', 'confirm'])

const reason = ref('')

watch(() => props.open, (value) => {
  if (!value) {
    reason.value = ''
  }
})
</script>

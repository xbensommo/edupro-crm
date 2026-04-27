<template>
  <section class="card-soft space-y-6">
    <div class="flex items-start justify-between gap-4">
      <div>
        <p class="section-label mb-3">Create invite</p>
        <h2 class="section-title">Invite a team member</h2>
        <p class="text-sm text-muted">Receptionists can invite. Admins can invite and control access.</p>
      </div>
      <span class="badge">Secure onboarding</span>
    </div>

    <form class="grid gap-4 md:grid-cols-2" @submit.prevent="handleSubmit()">
      <label class="grid gap-2">
        <span class="field-label mb-0">First name</span>
        <input v-model="form.firstName" class="input-field" placeholder="John" />
      </label>
      <label class="grid gap-2">
        <span class="field-label mb-0">Last name</span>
        <input v-model="form.lastName" class="input-field" placeholder="Doe" />
      </label>
      <label class="grid gap-2 md:col-span-2">
        <span class="field-label mb-0">Email</span>
        <input v-model="form.email" class="input-field" type="email" placeholder="john@company.com" required />
      </label>
      <label class="grid gap-2">
        <span class="field-label mb-0">Primary role</span>
        <select v-model="form.role" class="select-field">
          <option value="receptionist">Receptionist</option>
          <option value="consultant">Consultant</option>
          <option value="consultant_editor">Consultant editor</option>
          <option value="admin">Admin</option>
          <option value="sysadmin">Sysadmin</option>
        </select>
      </label>
      <label class="grid gap-2">
        <span class="field-label mb-0">Expiry</span>
        <select v-model="form.expiryPreset" class="select-field">
          <option value="24h">24 hours</option>
          <option value="48h">48 hours</option>
          <option value="72h">72 hours</option>
          <option value="7d">7 days</option>
          <option value="14d">14 days</option>
        </select>
      </label>
      <label class="grid gap-2">
        <span class="field-label mb-0">Department</span>
        <input v-model="form.department" class="input-field" placeholder="Operations" />
      </label>
      <label class="grid gap-2">
        <span class="field-label mb-0">Job title</span>
        <input v-model="form.jobTitle" class="input-field" placeholder="Senior consultant" />
      </label>
      <label class="grid gap-2 md:col-span-2">
        <span class="field-label mb-0">Note</span>
        <textarea v-model="form.note" rows="3" class="input-field min-h-28" placeholder="Optional onboarding note for the invitee or the team." />
      </label>

      <div class="md:col-span-2 flex flex-wrap gap-3 pt-2">
        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? 'Creating invite...' : 'Create invite' }}
        </button>
        <button type="button" class="btn-secondary" :disabled="loading" @click="handleSubmit(true)">
          {{ loading ? 'Please wait...' : 'Create and copy link' }}
        </button>
      </div>
    </form>
  </section>
</template>

<script setup>
import { reactive } from 'vue'

const emit = defineEmits(['submit'])

defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
})

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  role: 'user',
  expiryPreset: '72h',
  department: '',
  jobTitle: '',
  note: '',
})

function handleSubmit(copyAfterCreate = false) {
  emit('submit', {
    ...form,
    copyAfterCreate,
  })
}
</script>

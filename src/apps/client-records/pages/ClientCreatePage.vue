<template>
  <EntityPageShell eyebrow="Client Records" title="Add a new client" description="Capture a real EduProLIC client before work is opened in CRM.">
    <EntitySectionCard title="Client Profile" description="Basic intake information used by Client Records, CRM, notifications, and finance visibility.">
      <form class="grid gap-4 md:grid-cols-2" @submit.prevent="handleSubmit">
        <label class="space-y-2 text-sm text-soft">
          <span class="field-label mb-0">Client Type</span>
          <select v-model="form.type" class="select-field"><option value="individual">Individual</option><option value="business">Business</option><option value="sponsored">Sponsored</option></select>
        </label>
        <label class="space-y-2 text-sm text-soft">
          <span class="field-label mb-0">Status</span>
          <select v-model="form.status" class="select-field"><option value="lead">Lead</option><option value="prospect">Prospect</option><option value="active">Active</option></select>
        </label>
        <label class="space-y-2 text-sm text-soft md:col-span-2"><span class="field-label mb-0">Institution Name</span><input v-model="form.institutionName" type="text" class="input-field" /></label>
        <label class="space-y-2 text-sm text-soft md:col-span-2"><span class="field-label mb-0">Field Of Study</span><input v-model="form.fieldOfStudy" type="text" class="input-field" /></label>
        <label class="space-y-2 text-sm text-soft"><span class="field-label mb-0">Study level</span><input v-model="form.studyLevel" type="text" class="input-field" /></label>
        <label class="space-y-2 text-sm text-soft"><span class="field-label mb-0">City / Location</span><input v-model="form.city" type="text" class="input-field" /></label>
        <label class="space-y-2 text-sm text-soft"><span class="field-label mb-0">First Name</span><input v-model="form.firstName" type="text" class="input-field" required /></label>
        <label class="space-y-2 text-sm text-soft"><span class="field-label mb-0">Last Name</span><input v-model="form.lastName" type="text" class="input-field" required /></label>
        <label class="space-y-2 text-sm text-soft"><span class="field-label mb-0">Email</span><input v-model="form.email" type="email" class="input-field" /></label>
        <label class="space-y-2 text-sm text-soft"><span class="field-label mb-0">Phone</span><input v-model="form.phone" type="text" class="input-field" required /></label>
        <label class="space-y-2 text-sm text-soft"><span class="field-label mb-0">Lead Source</span><input v-model="form.leadSource" type="text" class="input-field" placeholder="Walk-in, referral, WhatsApp, phone" /></label>
        <label class="space-y-2 text-sm text-soft"><span class="field-label mb-0">Lifecycle Stage</span><select v-model="form.lifecycleStage" class="select-field"><option value="intake">Intake</option><option value="awaiting_work">Awaiting work</option><option value="active_client">Active client</option></select></label>
        <div class="md:col-span-2 flex flex-wrap items-center gap-3 pt-2">
          <button type="submit" class="btn-primary" :disabled="submitting">{{ submitting ? 'Saving...' : 'Create Client' }}</button>
          <p v-if="errorMessage" class="field-error mt-0 text-red-500">{{ errorMessage }}</p>
        </div>
      </form>
    </EntitySectionCard>
  </EntityPageShell>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@app/stores/appStore'
import EntityPageShell from '../components/EntityPageShell.vue'
import EntitySectionCard from '../components/EntitySectionCard.vue'
import { createClientService } from '../services/clientService.js'

const router = useRouter()
const store = useAppStore()
const clientService = createClientService({ store })
const submitting = ref(false)
const errorMessage = ref('')
const form = reactive({
  type: 'individual', firstName: '', lastName: '', email: '', phone: '', status: 'lead', lifecycleStage: 'intake',
  leadSource: '', fieldOfStudy: '', institutionName: '', studyLevel: '', city: '',
})

async function handleSubmit() {
  submitting.value = true
  errorMessage.value = ''
  if (!String(form.firstName).trim() || !String(form.lastName).trim() || !String(form.phone).trim()) {
    errorMessage.value = 'First name, last name, and phone are required.'
    submitting.value = false
    return
  }
  try {
    const created = await clientService.createClient(form)
    await router.push(created?.id ? `/clients/${created.id}` : '/clients')
  } catch (error) {
    console.error(error)
    errorMessage.value = error?.message || 'Failed to create client.'
  } finally {
    submitting.value = false
  }
}
</script>

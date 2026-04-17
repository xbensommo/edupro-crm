<template>
  <EntityPageShell
    eyebrow="Client Records"
    title="Add a new client"
    description="Add client  profile"
  >
    <EntitySectionCard title="Client Profile" description="Basic profile information for the new client.">
      <form class="grid gap-4 md:grid-cols-2" @submit.prevent="handleSubmit">
        <label class="space-y-2 text-sm text-soft">
          <span class="field-label mb-0">Client Type</span>
          <select v-model="form.type" class="select-field">
            <option value="individual" >Individual</option>
            <option value="business">Business</option>
            </select>
        </label>

        <label class="space-y-2 text-sm text-soft">
          <span class="field-label mb-0">Status</span>
          <select v-model="form.status" class="select-field">
            <option value="lead">Lead</option>
            <option value="prospect">Prospect</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>

        <label class="space-y-2 text-sm text-soft md:col-span-2">
          <span class="field-label mb-0">Institution Name</span>
          <input v-model="form.institutionName" type="text" class="input-field" />
        </label>

        <label class="space-y-2 text-sm text-soft md:col-span-2">
          <span class="field-label mb-0">Field Of Study</span>
          <input v-model="form.fieldOfStudy" type="text" class="input-field" />
        </label>

        <label class="space-y-2 text-sm text-soft">
          <span class="field-label mb-0">Study level</span>
          <input v-model="form.studyLevel" type="text" class="input-field" />
        </label>

        <label class="space-y-2 text-sm text-soft">
          <span class="field-label mb-0">City / Location</span>
          <input v-model="form.city" type="text" class="input-field" />
        </label>

        <label class="space-y-2 text-sm text-soft">
          <span class="field-label mb-0">First Name</span>
          <input v-model="form.firstName" type="text" class="input-field" />
        </label>

        <label class="space-y-2 text-sm text-soft">
          <span class="field-label mb-0">Last Name</span>
          <input v-model="form.lastName" type="text" class="input-field" />
        </label>

        <label class="space-y-2 text-sm text-soft">
          <span class="field-label mb-0">Email</span>
          <input v-model="form.email" type="email" class="input-field" />
        </label>

        <label class="space-y-2 text-sm text-soft">
          <span class="field-label mb-0">Phone</span>
          <input v-model="form.phone" type="text" class="input-field" />
        </label>

        <label class="space-y-2 text-sm text-soft">
          <span class="field-label mb-0">Lead Source</span>
          <input v-model="form.leadSource" type="text" class="input-field" />
        </label>
        

        <div class="md:col-span-2 flex flex-wrap items-center gap-3 pt-2">
          <button
            type="submit"
            class="btn-primary"
            :disabled="submitting"
          >
            {{ submitting ? 'Saving...' : 'Create Client' }}
          </button>
          <p v-if="errorMessage" class="field-error mt-0 text-red-500">
            {{ errorMessage }}
          </p>
        </div>
      </form>
    </EntitySectionCard>
  </EntityPageShell>
</template>

<script setup>
/**
 * @file ClientCreatePage.vue
 * @description Starter create page for client records.
 */

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
  type: 'individual',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  status: 'lead',
  lifecycleStage: 'lead',
  leadSource: '',
  fieldOfStudy: '',
  institutionName: '',
  studyLevel: '',
  city: '',
 // lastActivityAt: '',
  createdBy: '',
})

async function handleSubmit() {
  submitting.value = true
  errorMessage.value = ''

  // Validate that no user-facing form fields are null or empty strings
  const requiredFields = [
    'type', 'status', 'institutionName', 'fieldOfStudy', 
    'studyLevel', 'city', 'firstName', 'lastName', 
    'email', 'phone', 'leadSource'
  ]

  const hasEmptyFields = requiredFields.some(
    (field) => form[field] === null || form[field] === undefined || String(form[field]).trim() === ''
  )

  if (hasEmptyFields) {
    errorMessage.value = 'Please fill out all fields. No null or empty values are allowed.'
    submitting.value = false
    return
  }

  try { 
    const created = await clientService.createClient(form)
    
    if (created?.id) {
      await router.push(`/clients/${created.id}`)
    } else {
      await router.push('/clients')
    }
  } catch (error) {
    errorMessage.value = error?.message || 'Failed to create client.'
  } finally {
    submitting.value = false
  }
}
</script>
<template>
  <EntityPageShell
    eyebrow="Talent Acquisition"
    title="Post a new vacancy"
    description="Create a professional vacancy listing. Save it as a draft to keep refining, or publish it straight to the careers page."
  >
    <template #actions>
      <RouterLink to="/vacancies" class="btn-secondary">Back to Vacancies</RouterLink>
    </template>

    <form class="grid gap-6 xl:grid-cols-[1fr_380px] xl:items-start" @submit.prevent>
      <div class="space-y-6">
        <!-- Role Overview -->
        <EntitySectionCard
          title="Role Overview"
          description="Core details that identify the role and where it sits in the organisation."
        >
          <div class="grid gap-4 md:grid-cols-2">
            <label class="space-y-2 text-sm text-soft md:col-span-2">
              <span class="field-label mb-0">Job Title</span>
              <input v-model="form.title" type="text" class="input-field" placeholder="e.g. Consultant" required />
            </label>

            <label class="space-y-2 text-sm text-soft hidden">
              <span class="field-label mb-0">Vacancy Reference</span>
              <input v-model="form.vacancyNumber" type="text" class="input-field" placeholder="Auto-generated if left blank" />
              <span class="field-hint">Used internally to track applications against this role.</span>
            </label>

            <label class="space-y-2 text-sm text-soft">
              <span class="field-label mb-0">Open Positions</span>
              <input v-model.number="form.numberOfPositions" type="number" min="1" class="input-field" />
            </label>

            <label class="space-y-2 text-sm text-soft">
              <span class="field-label mb-0">Department</span>
              <input 
                v-model="form.department" 
                type="text"
                class="input-field"
                placeholder="Enter or select department"
                list="departments-list"
              />
              <datalist id="departments-list">
                <option v-for="dept in DEPARTMENTS" :key="dept" :value="dept"></option>
              </datalist>
            </label>

            <label v-if="form.department === 'Other'" class="space-y-2 text-sm text-soft">
              <span class="field-label mb-0">Specify Department</span>
              <input v-model="form.departmentOther" type="text" class="input-field" />
            </label>

            <label class="space-y-2 text-sm text-soft" :class="form.department !== 'Other' ? 'md:col-span-2' : ''">
              <span class="field-label mb-0">Location</span>
              <input v-model="form.location" type="text" class="input-field" placeholder="e.g. Rundu, Namibia" />
            </label>
          </div>

          <div class="space-y-2">
            <span class="field-label mb-0">Employment Type</span>
            <div class="grid gap-2 sm:grid-cols-3 xl:grid-cols-5">
              <button
                v-for="option in EMPLOYMENT_TYPES"
                :key="option.value"
                type="button"
                :class="['option-card justify-center text-center', form.employmentType === option.value && 'option-card-active']"
                @click="form.employmentType = option.value"
              >
                {{ option.label }}
              </button>
            </div>
          </div>

          <div class="space-y-2">
            <span class="field-label mb-0">Work Mode</span>
            <div class="grid gap-2 sm:grid-cols-3">
              <button
                v-for="option in WORK_MODES"
                :key="option.value"
                type="button"
                :class="['option-card justify-center text-center', form.workMode === option.value && 'option-card-active']"
                @click="form.workMode = option.value"
              >
                {{ option.label }}
              </button>
            </div>
          </div>

          <div class="space-y-2">
            <span class="field-label mb-0">Experience Level</span>
            <div class="grid gap-2 sm:grid-cols-3 xl:grid-cols-5">
              <button
                v-for="option in EXPERIENCE_LEVELS"
                :key="option.value"
                type="button"
                :class="['option-card justify-center text-center', form.experienceLevel === option.value && 'option-card-active']"
                @click="form.experienceLevel = option.value"
              >
                {{ option.label }}
              </button>
            </div>
          </div>
        </EntitySectionCard>

        <!-- Compensation -->
        <EntitySectionCard
          title="Compensation"
          description="Used for internal benchmarking. If published, the range is shown to applicants unless marked negotiable-only."
        >
          <div class="grid gap-4 md:grid-cols-3">
            <label class="space-y-2 text-sm text-soft">
              <span class="field-label mb-0">Minimum</span>
              <input v-model.number="form.salaryMin" type="number" min="0" class="input-field" placeholder="0" />
            </label>
            <label class="space-y-2 text-sm text-soft">
              <span class="field-label mb-0">Maximum</span>
              <input v-model.number="form.salaryMax" type="number" min="0" class="input-field" placeholder="0" />
            </label>
            <label class="space-y-2 text-sm text-soft">
              <span class="field-label mb-0">Currency</span>
              <select v-model="form.salaryCurrency" class="select-field">
                <option value="NAD">NAD — Namibian Dollar</option>
                <option value="ZAR">ZAR — South African Rand</option>
                <option value="USD">USD — US Dollar</option>
                <option value="EUR">EUR — Euro</option>
                <option value="GBP">GBP — British Pound</option>
              </select>
            </label>
          </div>

          <div class="flex flex-wrap items-end gap-6">
            <label class="space-y-2 text-sm text-soft">
              <span class="field-label mb-0">Pay Period</span>
              <select v-model="form.salaryPeriod" class="select-field">
                <option value="monthly">Monthly</option>
                <option value="annual">Annual</option>
                <option value="hourly">Hourly</option>
              </select>
            </label>

            <label class="checkbox-field cursor-pointer select-none pb-3.5" @click.prevent="form.salaryNegotiable = !form.salaryNegotiable">
              <span :class="['switch', form.salaryNegotiable && 'switch-active']"></span>
              <span>Salary is negotiable</span>
            </label>
          </div>
        </EntitySectionCard>

        <!-- Position Details -->
        <EntitySectionCard title="Position Details" description="The description and requirements applicants will read.">
          <label class="space-y-2 text-sm text-soft">
            <span class="field-label mb-0">Short Summary</span>
            <textarea
              v-model="form.summary"
              class="textarea-field"
              rows="2"
              maxlength="200"
              placeholder="One or two sentences shown on the vacancy listing card."
            ></textarea>
            <span class="field-hint">{{ form.summary.length }}/200 characters</span>
          </label>

          <label class="space-y-2 text-sm text-soft">
            <span class="field-label mb-0">Full Description</span>
            <textarea
              v-model="form.description"
              class="textarea-field"
              rows="6"
              placeholder="Describe the role, the team, and what success looks like in the first 90 days."
            ></textarea>
          </label>

          <ListField
            label="Key Responsibilities"
            hint="Press Enter or click Add after each point."
            placeholder="e.g. Lead the migration of legacy modules to Vue 3"
            :field="responsibilities"
            @add="addListItem(responsibilities)"
            @remove="(i) => removeListItem(responsibilities, i)"
          />

          <ListField
            label="Requirements"
            hint="What a candidate must have to be considered."
            placeholder="e.g. 4+ years building production Vue applications"
            :field="requirements"
            @add="addListItem(requirements)"
            @remove="(i) => removeListItem(requirements, i)"
          />

          <ListField
            label="Nice to Have"
            hint="Optional — strengthens an application but isn't mandatory."
            placeholder="e.g. Experience with Firebase security rules"
            :field="niceToHave"
            @add="addListItem(niceToHave)"
            @remove="(i) => removeListItem(niceToHave, i)"
          />

          <ListField
            label="Benefits"
            hint="What the company offers in return."
            placeholder="e.g. Flexible hybrid working"
            :field="benefits"
            @add="addListItem(benefits)"
            @remove="(i) => removeListItem(benefits, i)"
          />
        </EntitySectionCard>

        <!-- Hiring & Application -->
        <EntitySectionCard
          title="Hiring & Application"
          description="How candidates apply, and how this posting is tracked internally."
        >
          <div class="grid gap-4 md:grid-cols-2">
            <label class="space-y-2 text-sm text-soft">
              <span class="field-label mb-0">Hiring Manager</span>
              <input v-model="form.hiringManagerName" type="text" class="input-field" placeholder="Felicitas Fwanyanga" />
            </label>
            <label class="space-y-2 text-sm text-soft">
              <span class="field-label mb-0">Contact Email</span>
              <input v-model="form.contactEmail" type="email" class="input-field" placeholder="info@eduprolic.com" />
            </label>
            <label class="space-y-2 text-sm text-soft md:col-span-2">
              <span class="field-label mb-0">External Application Link</span>
              <input v-model="form.applicationUrl" type="url" class="input-field" placeholder="https://eduprolic.com/vacancies" />
              <span class="field-hint">Optional — leave blank to collect applications directly.</span>
            </label>
            <label class="space-y-2 text-sm text-soft md:col-span-2">
              <span class="field-label mb-0">Application Instructions</span>
              <textarea
                v-model="form.applicationInstructions"
                class="textarea-field"
                rows="3"
                placeholder="e.g. Include a portfolio link and your earliest available start date."
              ></textarea>
            </label>
            <label class="space-y-2 text-sm text-soft">
              <span class="field-label mb-0">Closing Date</span>
              <input v-model="form.closingDate" type="date" class="input-field" />
              <span class="field-hint">Leave blank to keep the role open until filled.</span>
            </label>
          </div>

          <ListField
            label="Tags"
            hint="Used for search and filtering on the careers page."
            placeholder="e.g. receptionist, namibia, remote-friendly"
            :field="tags"
            @add="addListItem(tags)"
            @remove="(i) => removeListItem(tags, i)"
          />

          <label class="checkbox-field cursor-pointer select-none" @click.prevent="form.isFeatured = !form.isFeatured">
            <span :class="['switch', form.isFeatured && 'switch-active']"></span>
            <span>Feature this vacancy at the top of the careers page</span>
          </label>
        </EntitySectionCard>

        <div class="flex flex-wrap items-center gap-3">
          <button type="button" class="btn-secondary" :disabled="submitting" @click="submitVacancy('draft')">
            {{ submitting && submitIntent === 'draft' ? 'Saving...' : 'Save as Draft' }}
          </button>
          <button type="button" class="btn-primary" :disabled="submitting" @click="submitVacancy('publish')">
            {{ submitting && submitIntent === 'publish' ? 'Publishing...' : 'Publish Vacancy' }}
          </button>
          <p v-if="errorMessage" class="field-error mt-0 text-red-500">{{ errorMessage }}</p>
        </div>
      </div>

      <VacancyPreviewPanel :vacancy="previewVacancy" />
    </form>
  </EntityPageShell>
</template>

<script setup>
/**
 * NOTE: adjust the relative import paths below to match where this page lands in your
 * project (mirrors the convention used by ClientCreatePage.vue). EntityPageShell.vue
 * already exists in your codebase and is reused as-is.
 */
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@app/stores/appStore'
import EntityPageShell from '../components/EntityPageShell.vue'
import EntitySectionCard from '../components/EntitySectionCard.vue'
import VacancyPreviewPanel from '../components/VacancyPreviewPanel.vue'
import ListField from '../components/ListField.vue'
import { createVacancyService } from '../services/vacancyService.js'

const router = useRouter()
const store = useAppStore()
const vacancyService = createVacancyService({ store })

const submitting = ref(false)
const submitIntent = ref('')
const errorMessage = ref('')

const EMPLOYMENT_TYPES = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
  { value: 'temporary', label: 'Temporary' },
]

const WORK_MODES = [
  { value: 'onsite', label: 'On-site' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
]

const EXPERIENCE_LEVELS = [
  { value: 'entry', label: 'Entry level' },
  { value: 'mid', label: 'Mid level' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Lead' },
  { value: 'executive', label: 'Executive' },
]

const DEPARTMENTS = [
  'Human Resources', 'Customer Support', 'Receptionist',
]

const form = reactive({
  vacancyNumber: '',
  title: '',
  department: '',
  departmentOther: '',
  location: '',
  workMode: 'onsite',
  employmentType: 'full_time',
  experienceLevel: 'mid',
  numberOfPositions: 1,
  status: 'draft',
  isPublished: false,
  isFeatured: false,
  summary: '',
  description: '',
  salaryMin: null,
  salaryMax: null,
  salaryCurrency: 'NAD',
  salaryPeriod: 'monthly',
  salaryNegotiable: false,
  hiringManagerName: '',
  contactEmail: '',
  applicationUrl: 'https://eduprolic.com/vacancies',
  applicationInstructions: '',
  closingDate: '',
})

function makeListField() {
  return reactive({ items: [], draft: '' })
}

const responsibilities = makeListField()
const requirements = makeListField()
const niceToHave = makeListField()
const benefits = makeListField()
const tags = makeListField()

function addListItem(field) {
  const value = field.draft.trim()
  if (!value) return
  if (!field.items.includes(value)) field.items.push(value)
  field.draft = ''
}

function removeListItem(field, index) {
  field.items.splice(index, 1)
}

const resolvedDepartment = computed(() => (form.department === 'Other' ? form.departmentOther.trim() : form.department))

const previewVacancy = computed(() => ({
  ...form,
  department: resolvedDepartment.value,
  responsibilities: responsibilities.items,
  requirements: requirements.items,
  niceToHave: niceToHave.items,
  benefits: benefits.items,
  tags: tags.items,
}))

function validate() {
  if (!form.title.trim()) return 'Job title is required.'
  if (!resolvedDepartment.value) return 'Department is required.'
  if (!form.location.trim()) return 'Location is required.'
  if (!form.summary.trim()) return 'A short summary is required for the listing preview.'
  if (form.salaryMin && form.salaryMax && Number(form.salaryMin) > Number(form.salaryMax)) {
    return 'Minimum salary cannot be greater than maximum salary.'
  }
  return ''
}

async function submitVacancy(intent) {
  errorMessage.value = ''
  const validationError = validate()
  if (validationError) {
    errorMessage.value = validationError
    return
  }

  submitting.value = true
  submitIntent.value = intent
  try {
    const payload = {
      ...form,
      department: resolvedDepartment.value,
      responsibilities: responsibilities.items,
      requirements: requirements.items,
      niceToHave: niceToHave.items,
      benefits: benefits.items,
      tags: tags.items,
      isPublished: intent === 'publish',
    }
    const created = await vacancyService.createVacancy(payload)
    await router.push(created?.id ? `/vacancy/m/${created.id}` : '/vacancy')
  } catch (error) {
    console.error(error)
    errorMessage.value = error?.message || 'Failed to save the vacancy.'
  } finally {
    submitting.value = false
    submitIntent.value = ''
  }
}
</script>

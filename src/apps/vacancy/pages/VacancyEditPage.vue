<template>
  <EntityPageShell
    eyebrow="Talent Acquisition"
    :title="loading ? 'Loading vacancy…' : `Edit · ${form.title || 'Untitled role'}`"
    description="Update the listing. Changes to a published vacancy go live on the careers page immediately on save."
  >
    <template #actions>
      <RouterLink to="/vacancy" class="btn-secondary">Back to Vacancies</RouterLink>
    </template>

    <div v-if="loadError" class="card p-6">
      <p class="field-error mt-0 text-red-500">{{ loadError }}</p>
    </div>

    <div v-else-if="loading" class="card p-10 text-center text-sm text-muted">
      Loading vacancy…
    </div>

    <form v-else class="grid gap-6 xl:grid-cols-[1fr_380px] xl:items-start" @submit.prevent>
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

            <label class="space-y-2 text-sm text-soft">
              <span class="field-label mb-0">Vacancy Reference</span>
              <input v-model="form.vacancyNumber" type="text" class="input-field" disabled />
              <span class="field-hint">Assigned automatically and not editable.</span>
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

            <label class="space-y-2 text-sm text-soft md:col-span-2">
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

          <div class="space-y-2">
            <span class="field-label mb-0">Status</span>
            <div class="grid gap-2 sm:grid-cols-3 xl:grid-cols-5">
              <button
                v-for="option in STATUS_OPTIONS"
                :key="option.value"
                type="button"
                :class="['option-card justify-center text-center', form.status === option.value && 'option-card-active']"
                @click="form.status = option.value"
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
            placeholder="e.g. vue, firebase, remote-friendly"
            :field="tags"
            @add="addListItem(tags)"
            @remove="(i) => removeListItem(tags, i)"
          />

          <label class="checkbox-field cursor-pointer select-none" @click.prevent="form.isFeatured = !form.isFeatured">
            <span :class="['switch', form.isFeatured && 'switch-active']"></span>
            <span>Feature this vacancy at the top of the careers page</span>
          </label>

          <label class="checkbox-field cursor-pointer select-none" @click.prevent="form.isPublished = !form.isPublished">
            <span :class="['switch', form.isPublished && 'switch-active']"></span>
            <span>Published — visible on the careers page</span>
          </label>
        </EntitySectionCard>

        <div class="flex flex-wrap items-center gap-3">
          <button type="button" class="btn-primary" :disabled="submitting" @click="saveChanges">
            {{ submitting ? 'Saving...' : 'Save Changes' }}
          </button>
          <button type="button" class="btn-secondary" :disabled="submitting" @click="goBack">Cancel</button>
          <button
            type="button"
            class="btn-ghost ml-auto text-[var(--color-danger)]"
            :disabled="submitting"
            @click="confirmingDelete = true"
          >
            Delete Vacancy
          </button>
          <p v-if="errorMessage" class="field-error mt-0 w-full text-red-500">{{ errorMessage }}</p>
        </div>
      </div>

      <VacancyPreviewPanel :vacancy="previewVacancy" />
    </form>

    <!-- Delete confirmation -->
    <div v-if="confirmingDelete" class="modal-backdrop" @click.self="confirmingDelete = false">
      <div class="modal-panel card max-w-md">
        <h3 class="section-title text-base">Delete this vacancy?</h3>
        <p class="mt-2 text-sm text-muted">
          This will permanently remove
          <span class="font-medium text-[var(--color-text)]">{{ form.title || 'this vacancy' }}</span>
          and take it off the careers page immediately. This action cannot be undone.
        </p>
        <p v-if="deleteError" class="field-error mt-3 text-red-500">{{ deleteError }}</p>
        <div class="mt-5 flex justify-end gap-3">
          <button type="button" class="btn-secondary" :disabled="deleting" @click="confirmingDelete = false">Cancel</button>
          <button type="button" class="btn-primary bg-[var(--color-danger)]" :disabled="deleting" @click="performDelete">
            {{ deleting ? 'Deleting…' : 'Delete Vacancy' }}
          </button>
        </div>
      </div>
    </div>
  </EntityPageShell>
</template>

<script setup>
/**
 * @file VacancyEditPage.vue
 * @description Edit an existing vacancy. Mirrors VacancyCreatePage's layout and
 *              components so the two stay visually and behaviourally consistent;
 *              loads the record by route param, lets the user change any field
 *              (including status and publish state), and supports delete from
 *              the same screen.
 *
 * Expected route: { path: '/vacancies/:id/edit', name: 'vacancy-edit' }
 */
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@app/stores/appStore'
import EntityPageShell from '../components/EntityPageShell.vue'
import EntitySectionCard from '../components/EntitySectionCard.vue'
import VacancyPreviewPanel from '../components/VacancyPreviewPanel.vue'
import ListField from '../components/ListField.vue'
import { createVacancyService } from '../services/vacancyService.js'

const route = useRoute()
const router = useRouter()
const store = useAppStore()
const vacancyService = createVacancyService({ store })

const vacancyId = computed(() => route.params.id)

const loading = ref(true)
const loadError = ref('')
const submitting = ref(false)
const errorMessage = ref('')

const confirmingDelete = ref(false)
const deleting = ref(false)
const deleteError = ref('')

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

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'open', label: 'Open' },
  { value: 'on_hold', label: 'On hold' },
  { value: 'closed', label: 'Closed' },
  { value: 'filled', label: 'Filled' },
]

const DEPARTMENTS = [
  'Human Resources', 'Customer Support', 'Receptionist',
]

const form = reactive({
  vacancyNumber: '',
  title: '',
  department: '',
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
  applicationUrl: '',
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

// Converts a stored timestamp/date value into the yyyy-mm-dd shape <input type="date"> expects.
function toDateInputValue(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

function hydrateForm(vacancy) {
  form.vacancyNumber = vacancy.vacancyNumber || ''
  form.title = vacancy.title || ''
  form.department = vacancy.department || ''
  form.location = vacancy.location || ''
  form.workMode = vacancy.workMode || 'onsite'
  form.employmentType = vacancy.employmentType || 'full_time'
  form.experienceLevel = vacancy.experienceLevel || 'mid'
  form.numberOfPositions = vacancy.numberOfPositions || 1
  form.status = vacancy.status || 'draft'
  form.isPublished = Boolean(vacancy.isPublished)
  form.isFeatured = Boolean(vacancy.isFeatured)
  form.summary = vacancy.summary || ''
  form.description = vacancy.description || ''
  form.salaryMin = vacancy.salaryMin ?? null
  form.salaryMax = vacancy.salaryMax ?? null
  form.salaryCurrency = vacancy.salaryCurrency || 'NAD'
  form.salaryPeriod = vacancy.salaryPeriod || 'monthly'
  form.salaryNegotiable = Boolean(vacancy.salaryNegotiable)
  form.hiringManagerName = vacancy.hiringManagerName || ''
  form.contactEmail = vacancy.contactEmail || ''
  form.applicationUrl = vacancy.applicationUrl || ''
  form.applicationInstructions = vacancy.applicationInstructions || ''
  form.closingDate = toDateInputValue(vacancy.closingDate)

  responsibilities.items = [...(vacancy.responsibilities || [])]
  requirements.items = [...(vacancy.requirements || [])]
  niceToHave.items = [...(vacancy.niceToHave || [])]
  benefits.items = [...(vacancy.benefits || [])]
  tags.items = [...(vacancy.tags || [])]
}

async function loadVacancy() {
  loading.value = true
  loadError.value = ''
  try {
    const vacancy = await vacancyService.getVacancy(vacancyId.value)
    if (!vacancy) {
      loadError.value = 'This vacancy could not be found.'
      return
    }
    hydrateForm(vacancy)
  } catch (error) {
    console.error(error)
    loadError.value = error?.message || 'Failed to load this vacancy.'
  } finally {
    loading.value = false
  }
}

onMounted(loadVacancy)

const previewVacancy = computed(() => ({
  ...form,
  responsibilities: responsibilities.items,
  requirements: requirements.items,
  niceToHave: niceToHave.items,
  benefits: benefits.items,
  tags: tags.items,
}))

function validate() {
  if (!form.title.trim()) return 'Job title is required.'
  if (!form.department.trim()) return 'Department is required.'
  if (!form.location.trim()) return 'Location is required.'
  if (!form.summary.trim()) return 'A short summary is required for the listing preview.'
  if (form.salaryMin && form.salaryMax && Number(form.salaryMin) > Number(form.salaryMax)) {
    return 'Minimum salary cannot be greater than maximum salary.'
  }
  return ''
}

async function saveChanges() {
  errorMessage.value = ''
  const validationError = validate()
  if (validationError) {
    errorMessage.value = validationError
    return
  }

  submitting.value = true
  try {
    const payload = {
      ...form,
      responsibilities: responsibilities.items,
      requirements: requirements.items,
      niceToHave: niceToHave.items,
      benefits: benefits.items,
      tags: tags.items,
    }
    await vacancyService.updateVacancy(vacancyId.value, payload)
    await router.push(`/vacancies/${vacancyId.value}`)
  } catch (error) {
    console.error(error)
    errorMessage.value = error?.message || 'Failed to save changes.'
  } finally {
    submitting.value = false
  }
}

function goBack() {
  router.push(`/vacancy/m/${vacancyId.value}`)
}

async function performDelete() {
  deleting.value = true
  deleteError.value = ''
  try {
    await vacancyService.deleteVacancy(vacancyId.value)
    confirmingDelete.value = false
    await router.push('/vacancies')
  } catch (error) {
    console.error(error)
    deleteError.value = error?.message || 'Failed to delete the vacancy.'
  } finally {
    deleting.value = false
  }
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.45);
}
.modal-panel {
  width: 100%;
  padding: 1.5rem;
}
</style>

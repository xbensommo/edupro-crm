<template>
  <EntityPageShell
    eyebrow="Talent Acquisition"
    title="Manage Vacancies"
    description="View, edit, publish, and remove vacancy listings across the organisation."
  >
    <template #actions>
      <RouterLink to="/vacancy/new" class="btn-primary">+ New Vacancy</RouterLink>
    </template>

    <template #filters>
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label class="space-y-2 text-sm text-soft lg:col-span-2">
          <span class="field-label mb-0">Search</span>
          <input
            v-model="searchTerm"
            type="text"
            class="input-field"
            placeholder="Search by title, department, or reference"
          />
        </label>

        <label class="space-y-2 text-sm text-soft">
          <span class="field-label mb-0">Status</span>
          <select v-model="statusFilter" class="select-field">
            <option value="">All statuses</option>
            <option v-for="option in STATUS_OPTIONS" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>

        <label class="space-y-2 text-sm text-soft">
          <span class="field-label mb-0">Visibility</span>
          <select v-model="publishedFilter" class="select-field">
            <option value="">All</option>
            <option value="published">Published</option>
            <option value="unpublished">Unpublished</option>
          </select>
        </label>
      </div>
    </template>

    <section class="card overflow-hidden p-0">
      <header class="flex items-center justify-between gap-3 border-b border-theme px-5 py-4 md:px-6">
        <div>
          <h2 class="section-title text-base md:text-lg">All Vacancies</h2>
          <p class="mt-1 text-sm text-muted">
            {{ filteredVacancies.length }} of {{ vacanciesList.length }} vacancies shown
          </p>
        </div>
        <button type="button" class="btn-ghost btn-sm" :disabled="loading" @click="refresh">
          {{ loading ? 'Refreshing…' : 'Refresh' }}
        </button>
      </header>

      <div v-if="loadError" class="px-5 py-4 md:px-6">
        <p class="field-error mt-0 text-red-500">{{ loadError }}</p>
      </div>

      <div v-else-if="loading && !vacanciesList.length" class="px-5 py-10 text-center text-sm text-muted md:px-6">
        Loading vacancies…
      </div>

      <div v-else-if="!filteredVacancies.length" class="px-5 py-10 text-center text-sm text-muted md:px-6">
        No vacancies match your filters.
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead>
            <tr class="border-b border-theme text-xs uppercase tracking-wide text-muted">
              <th class="px-5 py-3 font-medium md:px-6">Role</th>
              <th class="px-5 py-3 font-medium md:px-6">Department</th>
              <th class="px-5 py-3 font-medium md:px-6">Status</th>
              <th class="px-5 py-3 font-medium md:px-6">Visibility</th>
              <th class="px-5 py-3 font-medium md:px-6">Positions</th>
              <th class="px-5 py-3 font-medium md:px-6">Closing</th>
              <th class="px-5 py-3 font-medium md:px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="vacancy in filteredVacancies"
              :key="vacancy.id"
              class="border-b border-theme last:border-b-0 transition-colors hover:bg-[var(--color-surface-hover,rgba(0,0,0,0.02))]"
            >
              <td class="px-5 py-4 md:px-6">
                <RouterLink :to="`/vacancies/${vacancy.id}`" class="font-medium text-[var(--color-text)] hover:underline">
                  {{ vacancy.title || 'Untitled role' }}
                </RouterLink>
                <p class="mt-0.5 text-xs text-muted">{{ vacancy.vacancyNumber }}</p>
              </td>
              <td class="px-5 py-4 text-soft md:px-6">{{ vacancy.department || '—' }}</td>
              <td class="px-5 py-4 md:px-6">
                <select
                  class="select-field select-sm"
                  :value="vacancy.status"
                  :disabled="rowBusyId === vacancy.id"
                  @change="onStatusChange(vacancy, $event.target.value)"
                >
                  <option v-for="option in STATUS_OPTIONS" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
              </td>
              <td class="px-5 py-4 md:px-6">
                <span :class="['badge', vacancy.isPublished ? 'badge-success' : 'badge']">
                  {{ vacancy.isPublished ? 'Published' : 'Unpublished' }}
                </span>
                <span v-if="vacancy.isFeatured" class="badge badge-warning ml-1.5">Featured</span>
              </td>
              <td class="px-5 py-4 text-soft md:px-6">{{ vacancy.numberOfPositions || 1 }}</td>
              <td class="px-5 py-4 text-soft md:px-6">{{ formatDate(vacancy.closingDate) }}</td>
              <td class="px-5 py-4 md:px-6">
                <div class="flex items-center justify-end gap-2">
                  <RouterLink :to="`/vacancies/${vacancy.id}/edit`" class="btn-ghost btn-sm">Edit</RouterLink>
                  <button
                    type="button"
                    class="btn-ghost btn-sm"
                    :disabled="rowBusyId === vacancy.id"
                    @click="onTogglePublish(vacancy)"
                  >
                    {{ vacancy.isPublished ? 'Unpublish' : 'Publish' }}
                  </button>
                  <button
                    type="button"
                    class="btn-ghost btn-sm text-[var(--color-danger)]"
                    :disabled="rowBusyId === vacancy.id"
                    @click="confirmDelete(vacancy)"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Delete confirmation -->
    <div v-if="pendingDelete" class="modal-backdrop" @click.self="pendingDelete = null">
      <div class="modal-panel card max-w-md">
        <h3 class="section-title text-base">Delete this vacancy?</h3>
        <p class="mt-2 text-sm text-muted">
          This will permanently remove
          <span class="font-medium text-[var(--color-text)]">{{ pendingDelete.title || 'this vacancy' }}</span>
          and take it off the careers page immediately. This action cannot be undone.
        </p>
        <p v-if="deleteError" class="field-error mt-3 text-red-500">{{ deleteError }}</p>
        <div class="mt-5 flex justify-end gap-3">
          <button type="button" class="btn-secondary" :disabled="deleting" @click="pendingDelete = null">Cancel</button>
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
 * @file VacancyManagePage.vue
 * @description List/manage view for vacancies: search, filter, inline status changes,
 *              publish/unpublish toggle, edit links, and delete with confirmation.
 *              Mirrors EntityPageShell + EntitySectionCard conventions used by the
 *              create page so the module stays visually consistent.
 */
import { computed, onMounted, ref } from 'vue'
import { useAppStore } from '@app/stores/appStore'
import EntityPageShell from '../components/EntityPageShell.vue'
import { createVacancyService } from '../services/vacancyService.js'

const store = useAppStore()
const vacancyService = createVacancyService({ store })

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'open', label: 'Open' },
  { value: 'on_hold', label: 'On hold' },
  { value: 'closed', label: 'Closed' },
  { value: 'filled', label: 'Filled' },
]

const vacanciesList = ref([])
const loading = ref(false)
const loadError = ref('')

const searchTerm = ref('')
const statusFilter = ref('')
const publishedFilter = ref('')

const rowBusyId = ref('')
const pendingDelete = ref(null)
const deleting = ref(false)
const deleteError = ref('')

async function refresh() {
  loading.value = true
  loadError.value = ''
  try {
    const result = await vacancyService.listVacancies()
    vacanciesList.value = result.items
  } catch (error) {
    console.error(error)
    loadError.value = error?.message || 'Failed to load vacancies.'
  } finally {
    loading.value = false
  }
}

onMounted(refresh)

const filteredVacancies = computed(() => {
  const term = searchTerm.value.trim().toLowerCase()

  return vacanciesList.value.filter((vacancy) => {
    if (statusFilter.value && vacancy.status !== statusFilter.value) return false

    if (publishedFilter.value === 'published' && !vacancy.isPublished) return false
    if (publishedFilter.value === 'unpublished' && vacancy.isPublished) return false

    if (term) {
      const haystack = [vacancy.title, vacancy.department, vacancy.vacancyNumber, vacancy.location]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(term)) return false
    }

    return true
  })
})

function formatDate(value) {
  if (!value) return 'Open until filled'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Open until filled'
  return date.toLocaleDateString('en-NA', { day: 'numeric', month: 'short', year: 'numeric' })
}

async function onStatusChange(vacancy, status) {
  if (status === vacancy.status) return
  rowBusyId.value = vacancy.id
  try {
    const updated = await vacancyService.setVacancyStatus(vacancy.id, status)
    Object.assign(vacancy, updated)
  } catch (error) {
    console.error(error)
    loadError.value = error?.message || 'Failed to update status.'
  } finally {
    rowBusyId.value = ''
  }
}

async function onTogglePublish(vacancy) {
  rowBusyId.value = vacancy.id
  try {
    const updated = vacancy.isPublished
      ? await vacancyService.unpublishVacancy(vacancy.id)
      : await vacancyService.publishVacancy(vacancy.id)
    Object.assign(vacancy, updated)
  } catch (error) {
    console.error(error)
    loadError.value = error?.message || 'Failed to update visibility.'
  } finally {
    rowBusyId.value = ''
  }
}

function confirmDelete(vacancy) {
  deleteError.value = ''
  pendingDelete.value = vacancy
}

async function performDelete() {
  if (!pendingDelete.value) return
  deleting.value = true
  deleteError.value = ''
  try {
    await vacancyService.deleteVacancy(pendingDelete.value.id)
    vacanciesList.value = vacanciesList.value.filter((v) => v.id !== pendingDelete.value.id)
    pendingDelete.value = null
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
.select-sm {
  padding-top: 0.375rem;
  padding-bottom: 0.375rem;
  font-size: 0.8125rem;
}
</style>

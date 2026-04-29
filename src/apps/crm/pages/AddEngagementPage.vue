<template>
  <CrmPageShell
    title="Add Work"
    description="Add client work, assign ownership, upload secure supporting files"
  >
    <template #actions>
      <div class="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-end">
        <div class="flex flex-wrap items-center gap-2">
          <span class="badge">{{ sourceLabel }}</span>
          <span class="badge" :class="{ 'opacity-70': !form.clientId }">
            {{ selectedClientLabel || 'No client selected' }}
          </span>
        </div>
      </div>
    </template>

    <section class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <form class="card grid gap-6" @submit.prevent="submitEngagement">
        <section class="grid gap-4">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.24em] text-[var(--color-primary)]">
                Source Context
              </p>
              <h3 class="text-2xl text-[var(--color-secondary)]">
                Work Details
              </h3>
            </div>

            <button class="btn-outline btn-sm" type="button" @click="regenerateCode">
              Regenerate code
            </button>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <label class="grid gap-2">
              <span class="field-label mb-0">Workcode</span>
              <input
                v-model="form.engagementCode"
                class="input-field"
                autocomplete="off"
                required
              />
            </label>

            <label class="grid gap-2">
              <span class="field-label mb-0">Opened from</span>
              <input :value="sourceLabel" class="input-field opacity-80" readonly />
            </label>
          </div>
        </section>

        <section class="grid gap-4">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.24em] text-[var(--color-primary)]">
              Client Link
            </p>
            <h3 class="text-2xl text-[var(--color-secondary)]">
              Select Client
            </h3>
          </div>

          <label class="grid gap-2">
            <span class="field-label mb-0">Search client</span>
            <input
              v-model="clientQuery"
              class="input-field"
              placeholder="Search by client number, name, email, phone, or institution"
            />
          </label>

          <div class="border border-[var(--color-border-subtle)] bg-white">
            <div
              v-if="filteredClients.length"
              class="max-h-64 divide-y divide-[var(--color-border-subtle)] overflow-auto"
            >
              <button
                v-for="client in filteredClients"
                :key="getRecordId(client)"
                type="button"
                class="flex w-full items-start justify-between gap-4 px-4 py-3 text-left transition hover:bg-[var(--color-primary)]/5"
                :class="{ 'bg-[var(--color-primary)]/8': form.clientId === getRecordId(client) }"
                @click="selectClient(client)"
              >
                <div class="min-w-0">
                  <p class="font-semibold text-[var(--color-secondary)]">
                    {{ client.data.firstName + ' ' + client.data.lastName }}
                  </p>
                  <p class="text-sm text-[var(--color-text-soft)]">
                    {{ service.clientSecondaryLabel(client.data) }}
                  </p>
                </div>

                <span class="badge shrink-0">
                  {{ client.data.clientNumber }}
                </span>
              </button>
            </div>

            <div v-else class="px-4 py-6 text-sm text-[var(--color-text-soft)]">
              No client matches your search.
            </div>
          </div>

          <div
            class="rounded-2xl border border-dashed border-[var(--color-border-subtle)] bg-[var(--color-bg-soft)] p-4"
          >
            <div class="grid gap-3 md:grid-cols-3">
              <div>
                <p class="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--color-text-soft)]">
                  Selected client
                </p>
                <p class="mt-1 font-semibold text-[var(--color-secondary)]">
                  {{ selectedClientLabel || 'Required before save' }}
                </p>
              </div>

              <div>
                <p class="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--color-text-soft)]">
                  Institution
                </p>
                <p class="mt-1 text-sm text-[var(--color-text)]">
                  {{ selectedClientData.institutionName || '—' }}
                </p>
              </div>

              <div>
                <p class="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--color-text-soft)]">
                  Contact
                </p>
                <p class="mt-1 text-sm text-[var(--color-text)]">
                  {{ selectedClientData.email || selectedClientData.phone || '—' }}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section class="grid gap-4">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.24em] text-[var(--color-primary)]">
              Work Definition
            </p>
            <h3 class="text-2xl text-[var(--color-secondary)]">
              What is being delivered
            </h3>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <label class="grid gap-2 md:col-span-2">
              <span class="field-label mb-0">Title</span>
              <input
                v-model="form.title"
                class="input-field"
                placeholder="e.g. MBA admission application support"
                required
              />
            </label>

            <label class="grid gap-2">
              <span class="field-label mb-0">Service type</span>
              <select v-model="form.serviceType" class="select-field" required>
                <option value="">Select service</option>
                <option value="proof reading">proof reading</option>
                <option value="assignment">Assignment</option>
                <option value="research">Research</option>
                <option value="proposal">Proposal</option>
                <option value="consultation">Consultation</option>
                <option value="editing">Editing</option>
                <option value="other">Other</option>
              </select>
            </label>

            <label class="grid gap-2">
              <span class="field-label mb-0">Study level</span>
              <select v-model="form.studyLevel" class="select-field">
                <option value="">Not set</option>
                <option value="certificate">Certificate</option>
                <option value="diploma">Diploma</option>
                <option value="undergraduate">Undergraduate</option>
                <option value="postgraduate">Postgraduate</option>
                <option value="masters">Masters</option>
                <option value="phd">PhD</option>
                <option value="professional">Professional</option>
              </select>
            </label>

            <label class="grid gap-2">
              <span class="field-label mb-0">Institution</span>
              <input
                v-model="form.institutionName"
                class="input-field"
                placeholder="University / college / client company"
              />
            </label>

            <label class="grid gap-2">
              <span class="field-label mb-0">Priority</span>
              <select v-model="form.priority" class="select-field">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </label>

            <label class="grid gap-2">
              <span class="field-label mb-0">Status</span>
              <select v-model="form.status" class="select-field">
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="in_progress">In progress</option>
                <option value="awaiting_client">Awaiting client</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>

            <label class="grid gap-2">
              <span class="field-label mb-0">Delivery status</span>
              <select v-model="form.deliveryStatus" class="select-field">
                <option value="pending">Pending</option>
                <option value="working">Working</option>
                <option value="submitted">Submitted</option>
                <option value="delivered">Delivered</option>
              </select>
            </label>

            <label class="grid gap-2">
              <span class="field-label mb-0">Satisfaction status</span>
              <select v-model="form.satisfactionStatus" class="select-field">
                <option value="pending">Pending</option>
                <option value="satisfied">Satisfied</option>
                <option value="revision_requested">Revision requested</option>
                <option value="unsatisfied">Unsatisfied</option>
              </select>
            </label>

            <label class="grid gap-2 md:col-span-2">
              <span class="field-label mb-0">Description</span>
              <textarea
                v-model="form.description"
                class="textarea-field min-h-[120px]"
                placeholder="Work scope, deliverables, instructions, special conditions"
              />
            </label>
          </div>
        </section>

        <section class="grid gap-4">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.24em] text-[var(--color-primary)]">
              Ownership & Dates
            </p>
            <h3 class="text-2xl text-[var(--color-secondary)]">
              Assignment and delivery window
            </h3>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <label class="grid gap-2 md:col-span-2">
              <span class="field-label mb-0">Assigned consultant</span>
              <!-- <select v-model="form.assignedConsultantId" class="select-field">
                <option value="">Select consultant</option>
                <option
                  v-for="consultant in consultantsList"
                  :key="getRecordId(consultant)"
                  :value="assignConsultant(consultant)"
                >
                  {{ consultantDisplayName(consultant) }}
                </option>
              </select> -->

              <select
                v-model="form.assignedConsultantId"
                class="select-field"
                @change="syncSelectedConsultantInfo"
              >
                <option value="">Select consultant</option>
                <option
                  v-for="consultant in consultantsList"
                  :key="getRecordId(consultant)"
                  :value="getRecordId(consultant)"
                >
                  {{ consultantDisplayName(consultant) }}
                </option>
              </select>
            </label>

            <label class="grid gap-2">
              <span class="field-label mb-0">Start date</span>
              <input v-model="form.startDate" class="input-field" :min="minDate" type="date" />
            </label>

            <label class="grid gap-2">
              <span class="field-label mb-0">Due date</span>
              <input v-model="form.dueDate" :min="minDate" class="input-field" type="date" />
            </label>
          </div>
        </section>

        <section class="grid gap-4">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.24em] text-[var(--color-primary)]">
              Finance Snapshot
            </p>
            <h3 class="text-2xl text-[var(--color-secondary)]">
              Cache the values now
            </h3>
          </div>

          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label class="grid gap-2">
              <span class="field-label mb-0">Quoted amount</span>
              <input v-model="form.quotedAmount" class="input-field" type="number" min="0" inputmode="decimal" />
            </label>

            <label class="grid gap-2">
              <span class="field-label mb-0">Discount</span>
              <input v-model="form.discountAmount" class="input-field" type="number" inputmode="decimal" />
            </label>

            <label class="grid gap-2">
              <span class="field-label mb-0">Received</span>
              <input v-model="form.amountPaidCached" class="input-field" type="number" min="0" inputmode="decimal" />
            </label>

            <label class="grid gap-2">
              <span class="field-label mb-0">Currency</span>
              <select v-model="form.currency" class="select-field">
                <option value="NAD">NAD</option>
              </select>
            </label>

            <div class="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-soft)] p-4">
              <p class="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--color-text-soft)]">
                Net amount
              </p>
              <p class="mt-2 text-xl font-semibold text-[var(--color-secondary)]">
                {{ service.money(netAmount) }}
              </p>
            </div>

            <div class="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-soft)] p-4">
              <p class="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--color-text-soft)]">
                Amount due
              </p>
              <p class="mt-2 text-xl font-semibold text-[var(--color-secondary)]">
                {{ service.money(amountDue) }}
              </p>
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div class="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-soft)] p-4">
              <p class="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--color-text-soft)]">
                Consultant share (45%)
              </p>
              <p class="mt-2 text-lg font-semibold text-[var(--color-secondary)]">
                {{ service.money(consultantShare) }}
              </p>
            </div>

            <div class="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-soft)] p-4">
              <p class="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--color-text-soft)]">
                Company share (55%)
              </p>
              <p class="mt-2 text-lg font-semibold text-[var(--color-secondary)]">
                {{ service.money(companyShare) }}
              </p>
            </div>
          </div>
        </section>

        <section class="grid gap-4">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.24em] text-[var(--color-primary)]">
                Files
              </p>
              <h3 class="text-2xl text-[var(--color-secondary)]">
                Secure attachments
              </h3>
            </div>

            <span class="badge">
              {{ queuedFiles.length }} queued
            </span>
          </div>

          <div class="rounded-2xl border border-dashed border-[var(--color-border-subtle)] bg-(--color-bg-soft) p-4">
            <div class="grid gap-4 md:grid-cols-[1fr_220px_auto] md:items-end">
              <label class="grid gap-2">
                <span class="field-label mb-0">Attach files</span>
                <input
                  ref="fileInputRef"
                  type="file"
                  class="input-field"
                  multiple
                  :accept="acceptedFileTypes"
                  @change="onFileInputChange"
                />
              </label>

              <label class="grid gap-2">
                <span class="field-label mb-0">Default category</span>
                <select v-model="defaultFileCategory" class="select-field">
                  <option value="supporting_document">Supporting document</option>
                  <option value="source_material">Source material</option>
                  <!-- <option value="proof_of_payment">Proof of payment</option> -->
                  <option value="brief">Brief</option>
                  <option value="final_delivery">Final delivery</option>
                  <option value="revision">Revision</option>
                </select>
              </label>

              <button class="btn-outline" type="button" @click="clearQueuedFiles">
                Clear queue
              </button>
            </div>

            <p class="mt-3 text-xs text-[var(--color-text-soft)]">
              Allowed: PDF, Word, Excel, PowerPoint, TXT, JPG, PNG. Max 5 files, 10 MB each, 25 MB total. SVG, HTML, scripts, and executables are rejected.
            </p>
          </div>

          <div v-if="queuedFiles.length" class="grid gap-3 relative">
            <article
              v-for="item in queuedFiles"
              :key="item.localId"
              class="rounded-2xl border border-[var(--color-border-subtle)] p-4"
            >
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="truncate word-wrap text-wrap font-semibold text-[var(--color-secondary)]">
                    {{ item.file.name }}
                  </p>
                  <p class="text-sm text-[var(--color-text-soft)]">
                    {{ item.extension.toUpperCase() }} · {{ service.formatFileSize(item.file.size) }}
                  </p>
                </div>

                <div class="flex items-center gap-2">
                  <select v-model="item.category" class="select-field min-w-[180px]">
                    <option value="supporting_document">Supporting document</option>
                    <option value="source_material">Source material</option>
                    <option value="proof_of_payment">Proof of payment</option>
                    <option value="brief">Brief</option>
                    <option value="final_delivery">Final delivery</option>
                    <option value="revision">Revision</option>
                  </select>

                  <button class="btn-outline btn-sm" type="button" @click="removeQueuedFile(item.localId)">
                    Remove
                  </button>
                </div>
              </div>

              <div class="mt-3">
                <div class="h-2 overflow-hidden rounded-full bg-[var(--color-border-subtle)]">
                  <div
                    class="h-full rounded-full bg-[var(--color-primary)] transition-all duration-300"
                    :style="{ width: `${item.progress}%` }"
                  />
                </div>

                <div class="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span class="text-[var(--color-text-soft)]">
                    {{ item.statusLabel }}
                  </span>
                  <span v-if="item.error" class="text-red-600">{{ item.error }}</span>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section class="grid gap-4">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.24em] text-[var(--color-primary)]">
              Internal Notes
            </p>
          </div>

          <label class="grid gap-2">
            <span class="field-label mb-0">Remarks</span>
            <textarea
              v-model="form.remarks"
              class="textarea-field min-h-[120px]"
              placeholder="Internal remarks, special handling notes, revision notes, finance notes"
            />
          </label>
        </section>

        <div
          v-if="errorMessage"
          class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {{ errorMessage }}
        </div>

        <div
          v-if="successMessage"
          class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
        >
          {{ successMessage }}
        </div>

        <div class="flex flex-wrap items-center justify-end gap-3">
          <button class="btn-outline" type="button" @click="resetForm(true)">
            Reset fields
          </button>
          <button class="btn-primary" type="submit" :disabled="submitting || !canSubmit">
            {{ submitting ? 'Saving...' : 'Save Work' }}
          </button>
        </div>
      </form>

      <aside class="grid gap-4 xl:sticky xl:top-4 xl:self-start">
        <section class="card overflow-hidden">
          <div class="border-b border-[var(--color-border-subtle)] px-4 py-3">
            <p class="text-xs font-bold uppercase tracking-[0.24em] text-[var(--color-primary)]">
              Quick Summary
            </p>
          </div>

          <dl class="divide-y divide-[var(--color-border-subtle)] text-sm">
            <div class="grid grid-cols-[110px_minmax(0,1fr)] gap-3 px-4 py-3">
              <dt class="text-[var(--color-text-soft)]">Client</dt>
              <dd class="min-w-0 truncate font-medium text-[var(--color-secondary)]">
                {{ selectedClientLabel || 'Select a client' }}
              </dd>
            </div>
            <div class="grid grid-cols-[110px_minmax(0,1fr)] gap-3 px-4 py-3">
              <dt class="text-[var(--color-text-soft)]">Service</dt>
              <dd class="min-w-0 truncate text-[var(--color-text)]">
                {{ form.serviceType || '—' }}
              </dd>
            </div>
            <div class="grid grid-cols-[110px_minmax(0,1fr)] gap-3 px-4 py-3">
              <dt class="text-[var(--color-text-soft)]">Owner</dt>
              <dd class="min-w-0 truncate text-[var(--color-text)]">
                {{ selectedConsultantLabel }}
              </dd>
            </div>
            <div class="grid grid-cols-[110px_minmax(0,1fr)] gap-3 px-4 py-3">
              <dt class="text-[var(--color-text-soft)]">Due</dt>
              <dd class="text-[var(--color-text)]">
                {{ service.formatDate(form.dueDate) }}
              </dd>
            </div>
            <div class="grid grid-cols-[110px_minmax(0,1fr)] gap-3 px-4 py-3">
              <dt class="text-[var(--color-text-soft)]">Status</dt>
              <dd class="text-[var(--color-text)]">
                {{ form.status || 'draft' }}
              </dd>
            </div>
            <div class="grid grid-cols-[110px_minmax(0,1fr)] gap-3 px-4 py-3">
              <dt class="text-[var(--color-text-soft)]">Files</dt>
              <dd class="text-[var(--color-text)]">
                {{ queuedFiles.length }} queued
              </dd>
            </div>
            <div class="grid grid-cols-[110px_minmax(0,1fr)] gap-3 px-4 py-3">
              <dt class="text-[var(--color-text-soft)]">Net</dt>
              <dd class="font-semibold text-[var(--color-secondary)]">
                {{ service.money(netAmount) }}
              </dd>
            </div>
            <div class="grid grid-cols-[110px_minmax(0,1fr)] gap-3 px-4 py-3">
              <dt class="text-[var(--color-text-soft)]">Due amount</dt>
              <dd class="font-semibold text-[var(--color-secondary)]">
                {{ service.money(amountDue) }}
              </dd>
            </div>
          </dl>
        </section>

        <section class="card overflow-hidden">
          <div class="flex items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] px-4 py-3">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.24em] text-[var(--color-primary)]">
                Existing Files
              </p>
            </div>

            <button class="btn-outline btn-sm" type="button" @click="refreshFiles">
              Refresh
            </button>
          </div>

          <div v-if="uploadedFiles.length" class="divide-y divide-[var(--color-border-subtle)]">
            <div
              v-for="file in uploadedFiles.slice(0, 6)"
              :key="file.id || file.storagePath || file.url"
              class="grid grid-cols-[1fr_auto] gap-3 px-4 py-3 text-sm"
            >
              <div class="min-w-0">
                <p class="truncate font-medium text-[var(--color-secondary)]">
                  {{ file.name || 'Unnamed file' }}
                </p>
                <p class="truncate text-xs text-[var(--color-text-soft)]">
                  {{ file.category || 'file' }} · {{ file.fileType || 'unknown' }}
                </p>
              </div>
              <span class="badge self-start">{{ file.engagementId ? 'linked' : 'client' }}</span>
            </div>
          </div>

          <div
            v-else
            class="px-4 py-6 text-sm text-[var(--color-text-soft)]"
          >
            No uploaded files found for this client yet.
          </div>
        </section>
      </aside>
    </section>
  </CrmPageShell>
</template>


<script setup>
import { computed, onMounted, reactive, ref, unref } from 'vue'
import { useRoute } from 'vue-router'
import {
  deleteObject,
  getDownloadURL,
  getStorage,
  ref as storageRef,
  uploadBytesResumable,
} from 'firebase/storage'
import { useAppStore } from '@app/stores/appStore/index.js'
import {
  useCrmService,
} from '../services/crmService.js'
import { createCrmNotificationBridge } from '../services/createCrmNotificationBridge.js'
import CrmPageShell from '../components/CrmPageShell.vue'

import {
  roundMoney,
  getRecordId,
  MAX_FILE_COUNT, MAX_TOTAL_SIZE_BYTES,
  acceptedFileTypes, sanitizeFilename,
  validateFile, createStoragePath
} from '@core_services/index.js'

const { service } = useCrmService()
const route = useRoute()
const store = useAppStore()

const submitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const clientQuery = ref('')
const queuedFiles = ref([])
const fileInputRef = ref(null)
const defaultFileCategory = ref('supporting_document')

const minDate = computed(() => getLocalDateString(new Date));

const currentUser = computed(() => unref(store.currentUser) || null)
const currentUserId = computed(() => currentUser.value?.uid || currentUser.value?.id || null)

const crmNotifications = createCrmNotificationBridge({
  store,
  currentUser: () => currentUser.value || {},
})

const form = reactive({
  engagementCode: service.createEngagementCode(),
  clientId: '',
  clientName: '',
  clientEmail: '',
  clientPhone: '',
  title: '',
  serviceType: '',
  description: '',
  studyLevel: '',
  institutionName: '',
  assignedConsultantId: '',
  assignedConsultantInfo: '',

  assignedConsultantName: '',
  assignedConsultantEmail: '',
  consultantName: '',
  consultantEmail: '',

  assignedTeam: '',
  priority: 'medium',
  status: 'draft',
  deliveryStatus: 'pending',
  satisfactionStatus: 'pending',
  quotedAmount: '',
  discountAmount: '',
  currency: 'NAD',
  shareRuleId: '',
  amountPaidCached: '',
  amountRefundedCached: '',
  startDate: '',
  dueDate: '',
  remarks: '',
})

function recordData(record) {
  if (!record || typeof record !== 'object') return {}
  return record.data && typeof record.data === 'object' ? record.data : record
}
 
function getCollectionItems(name) {
  const direct = store?.[name]?.items
  if (Array.isArray(direct)) return direct

  const actionsState = store?.[`${name}Actions`]?.state?.items
  if (Array.isArray(actionsState)) return actionsState

  const collectionState = store?.collections?.[name]?.items
  if (Array.isArray(collectionState)) return collectionState

  return []
}

const clients = computed(() => getCollectionItems('clients'));

const consultantsList = computed(() =>  store.users.items )

const uploadedFiles = computed(() => {
  const items = getCollectionItems('crm_files')
    .map((entry) => ({ ...recordData(entry), id: getRecordId(entry) || entry.id }))
    .filter((entry) => !form.clientId || entry.clientId === form.clientId)

  return items.sort((a, b) => {
    const aTime = new Date(a.createdAt || a.updatedAt || 0).getTime()
    const bTime = new Date(b.createdAt || b.updatedAt || 0).getTime()
    return bTime - aTime
  })
})

const sourceLabel = computed(() => {
  const source = String(route.query.from || route.query.source || '').trim()
  if (source === 'crm') return 'Opened from CRM'
  if (source === 'client-records') return 'Opened from Client Records'
  return 'Standalone entry'
})

const selectedClient = computed(() =>
  clients.value.find((entry) => getRecordId(entry) === form.clientId) || null,
)

const selectedClientData = computed(() => recordData(selectedClient.value))

const selectedClientLabel = computed(() => {
  const client = selectedClient.value;
  return client ? `${client.data.firstName} ${client.data.lastName}` : ''
})

const selectedConsultant = computed(() =>
  consultantsList.value.find((entry) => getRecordId(entry) === form.assignedConsultantId) || null,
)

const selectedConsultantLabel = computed(() => {
  if (selectedConsultant.value) return consultantDisplayName(selectedConsultant.value)
  if (currentUserId.value && form.assignedConsultantId === currentUserId.value) return 'Current user'
  return 'Unassigned'
})

const filteredClients = computed(() => {
  const query = clientQuery.value.trim().toLowerCase()
  if (!query) return clients.value.slice(0, 24)

  return clients.value
    .filter((client) => {
      const data = recordData(client)
      const haystack = [
        data.clientNumber,
        data.firstName,
        data.lastName,
        data.email,
        data.phone,
        data.institutionName,
        data.fieldOfStudy,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(query)
    })
    .slice(0, 24)
})

const amountRefundedValue = ref(0)

const netAmount = computed(() =>
  Math.max(form.quotedAmount - form.discountAmount, 0),
)

const amountDue = computed(() =>
  Math.max(netAmount.value - form.amountPaidCached + form.amountRefundedCached, 0),
)

const consultantShare = computed(() => roundMoney(netAmount.value * 0.45))
const companyShare = computed(() => roundMoney(netAmount.value * 0.55))

const canSubmit = computed(() => {
  return Boolean(
    currentUserId.value &&
      form.clientId &&
      String(form.title).trim() &&
      String(form.serviceType).trim(),
  )
})

function consultantDisplayName(usr) {
  let { data } = usr;
  return [data.firstName, data.lastName].filter(Boolean).join(' ') || data.displayName || data.email;
}

/*function assignConsultant(usr){
  form.assignedConsultantInfo = `${usr.data.firstName} ${usr.data.lastName}`;
  return usr.id;
}*/

function syncSelectedConsultantInfo() {
  const consultant = selectedConsultant.value

  if (!consultant) {
    form.assignedConsultantInfo = ''
    form.assignedConsultantName = ''
    form.assignedConsultantEmail = ''
    form.consultantName = ''
    form.consultantEmail = ''
    return
  }

  const data = recordData(consultant)
  const displayName = consultantDisplayName(consultant)

  form.assignedConsultantInfo = displayName
  form.assignedConsultantName = displayName
  form.assignedConsultantEmail = data.email || ''
  form.consultantName = displayName
  form.consultantEmail = data.email || ''
}

function buildEngagementNotificationPayload({
  engagementId,
  engagementCode,
  payload,
  uploadedFilesPayload = [],
  uploadedFileUrls = [],
}) {
  return {
    ...payload,

    id: engagementId,
    docId: engagementId,
    engagementId,

    entityType: 'engagement',
    entityId: engagementId,

    engagementCode,
    title: payload.title,
    clientId: payload.clientId,
    clientName: payload.clientName || selectedClientLabel.value || 'Client',

    assignedConsultantId: payload.assignedConsultantId || '',
    assignedConsultantInfo: payload.assignedConsultantInfo || '',
    assignedConsultantName: payload.assignedConsultantName || payload.assignedConsultantInfo || '',
    assignedConsultantEmail: payload.assignedConsultantEmail || '',
    consultantName: payload.consultantName || payload.assignedConsultantInfo || '',
    consultantEmail: payload.consultantEmail || payload.assignedConsultantEmail || '',

    dueDate: payload.dueDate || '',
    priority: payload.priority || 'medium',

    files: uploadedFilesPayload,
    fileUrls: uploadedFileUrls,
    attachmentsCount: uploadedFilesPayload.length,
    hasAttachments: uploadedFilesPayload.length > 0,

    actorId: currentUserId.value,
    actorName: [currentUser.value?.firstName, currentUser.value?.lastName]
      .filter(Boolean)
      .join(' ') || currentUser.value?.email || 'System',
  }
}

function resolveStorage() {
  return store.storage || store.$storage || getStorage()
}

function requireCollectionActions(name) {
  const actions =
    store.getCollectionActions?.(name) ||
    unref(store[`${name}Actions`]) ||
    store[`${name}Actions`]

  if (!actions || typeof actions !== 'object') {
    throw new Error(`Missing collection actions for "${name}".`)
  }

  return actions
}

function regenerateCode() {
  form.engagementCode = service.createEngagementCode()
}

function getFileExtension(name = '') {
  const parts = String(name).toLowerCase().split('.')
  return parts.length > 1 ? parts.pop() : ''
}

function clearQueuedFiles() {
  queuedFiles.value = []
  if (fileInputRef.value) fileInputRef.value.value = ''
}

function removeQueuedFile(localId) {
  queuedFiles.value = queuedFiles.value.filter((entry) => entry.localId !== localId)
}

function onFileInputChange(event) {
  const files = Array.from(event.target?.files || [])
  if (!files.length) return

  errorMessage.value = ''
  successMessage.value = ''

  if (files.length + queuedFiles.value.length > MAX_FILE_COUNT) {
    errorMessage.value = `You can queue a maximum of ${MAX_FILE_COUNT} files.`
    event.target.value = ''
    return
  }

  const currentTotal = queuedFiles.value.reduce((sum, entry) => sum + (entry.file?.size || 0), 0)
  const newTotal = files.reduce((sum, file) => sum + (file.size || 0), currentTotal)

  if (newTotal > MAX_TOTAL_SIZE_BYTES) {
    errorMessage.value = 'Total selected files exceed 25 MB.'
    event.target.value = ''
    return
  }

  const rejected = []
  const accepted = []

  files.forEach((file) => {
    const validation = validateFile(file)
    if (!validation.ok) {
      rejected.push(`${file.name}: ${validation.reason}`)
      return
    }

    accepted.push({
      localId: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      file,
      extension: getFileExtension(file.name),
      safeName: sanitizeFilename(file.name),
      category: defaultFileCategory.value,
      progress: 0,
      status: 'queued',
      statusLabel: 'Queued',
      error: '',
    })
  })

  queuedFiles.value = [...queuedFiles.value, ...accepted]

  if (rejected.length) {
    errorMessage.value = rejected.join(' | ')
  }

  event.target.value = ''
}

async function refreshFiles() {
  try {
    await service.fetchRecentFiles()
  } catch (error) {
    errorMessage.value = error?.message || 'Failed to refresh files.'
  }
}

async function selectClient(client) {
  form.clientId = getRecordId(client)
  form.clientEmail = `${client.data?.email}`;
  form.clientPhone = `${client.data?.phone}`;
  form.clientName = `${client.data.firstName} ${client.data.lastName}`;
  const data = recordData(client)

  if (!form.institutionName && data?.institutionName) {
    form.institutionName = data.institutionName
  }

  successMessage.value = ''
  errorMessage.value = ''

  try {
    await Promise.allSettled([
      service.fetchRecentEngagements?.(),
      service.fetchRecentFiles?.(),
    ])
  } catch {
    // fetch helpers are best-effort here
  }
}

function prefillFromRoute() {
  const routeClientId = String(route.query.clientId || '').trim()
  const routeTitle = String(route.query.title || '').trim()
  const routeServiceType = String(route.query.serviceType || '').trim()
  const routeInstitutionName = String(route.query.institutionName || '').trim()
  const routeConsultantId = String(route.query.assignedConsultantId || '').trim()

  if (routeClientId) form.clientId = routeClientId
  if (routeTitle && !form.title) form.title = routeTitle
  if (routeServiceType && !form.serviceType) form.serviceType = routeServiceType
  if (routeInstitutionName && !form.institutionName) form.institutionName = routeInstitutionName
  if (routeConsultantId && !form.assignedConsultantId) form.assignedConsultantId = routeConsultantId

  if (!form.assignedConsultantId && currentUserId.value) {
    form.assignedConsultantId = currentUserId.value
    
  }
}

async function waitForUpload(task, queueItem) {
  return await new Promise((resolve, reject) => {
    task.on(
      'state_changed',
      (snapshot) => {
        queueItem.progress = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
        )
        queueItem.status = 'uploading'
        queueItem.statusLabel = `Uploading ${queueItem.progress}%`
      },
      (error) => reject(error),
      () => resolve(task.snapshot),
    )
  })
}

async function uploadSingleFile(queueItem, { clientId, engagementId }) {
  const crmFilesActions = requireCollectionActions('crm_files')
  const storage = resolveStorage()
  const safeName = queueItem.safeName
  const path = createStoragePath({ clientId, engagementId, safeName })
  const fileRef = storageRef(storage, path)

  const metadata = {
    contentType: queueItem.file.type || 'application/octet-stream',
    contentDisposition: `attachment; filename="${safeName}"`,
    customMetadata: {
      clientId,
      engagementId,
      uploadedBy: currentUserId.value || '',
      category: queueItem.category || 'supporting_document',
      originalName: queueItem.file.name || safeName,
    },
  }

  queueItem.status = 'uploading'
  queueItem.statusLabel = 'Starting upload...'
  queueItem.error = ''

  const task = uploadBytesResumable(fileRef, queueItem.file, metadata)

  try {
    const snapshot = await waitForUpload(task, queueItem)
    const url = await getDownloadURL(snapshot.ref)

    const fileDoc = await crmFilesActions.add({
      clientId,
      engagementId,
      name: safeName,
      originalName: queueItem.file.name || safeName,
      storagePath: path,
      url,
      fileType: queueItem.file.type || null,
      category: queueItem.category || 'supporting_document',
      uploadedBy: currentUserId.value || null,
    })

    queueItem.status = 'uploaded'
    queueItem.statusLabel = 'Uploaded'
    queueItem.progress = 100

    return fileDoc
  } catch (error) {
    queueItem.status = 'failed'
    queueItem.statusLabel = 'Failed'
    queueItem.error = error?.message || 'Upload failed.'

    try {
      await deleteObject(fileRef)
    } catch {
      // best-effort cleanup only
    }

    throw error
  }
}

async function uploadQueuedFiles(engagementId) {
  if (!queuedFiles.value.length) {
    return { uploaded: [], failed: [] }
  }

  const uploaded = []
  const failed = []

  for (const item of queuedFiles.value) {
    try {
      const created = await uploadSingleFile(item, {
        clientId: form.clientId,
        engagementId,
      })
      uploaded.push(created)
    } catch (error) {
      failed.push({
        name: item.file?.name || item.safeName,
        message: error?.message || 'Upload failed.',
      })
    }
  }

  return { uploaded, failed }
}

function resetForm(keepClient = false) {
  const rememberedClientId = form.clientId
  const rememberedInstitutionName = form.institutionName
  const rememberedConsultantId = form.assignedConsultantId || currentUserId.value || ''

  form.engagementCode = service.createEngagementCode()
  form.clientId = keepClient ? rememberedClientId : ''
  form.title = ''
  form.serviceType = ''
  form.description = ''
  form.studyLevel = ''
  form.institutionName = keepClient ? rememberedInstitutionName : ''
  form.assignedConsultantId = rememberedConsultantId
  form.assignedTeam = ''
  form.priority = 'medium'
  form.status = 'draft'
  form.deliveryStatus = 'pending'
  form.satisfactionStatus = 'pending'
  form.quotedAmount = ''
  form.discountAmount = ''
  form.currency = 'NAD'
  form.shareRuleId = ''
  form.amountPaidCached = ''
  form.amountRefundedCached = ''
  form.startDate = ''
  form.dueDate = ''
  form.remarks = ''

  clearQueuedFiles()
}

async function submitEngagement() {
  submitting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    if (!canSubmit.value) {
      throw new Error('Client, title, service type, and authentication are required.')
    }

    const payload = {
      ...form,

      assignedConsultantName: form.assignedConsultantName || form.assignedConsultantInfo || '',
      assignedConsultantEmail: form.assignedConsultantEmail || '',
      consultantName: form.consultantName || form.assignedConsultantInfo || '',
      consultantEmail: form.consultantEmail || form.assignedConsultantEmail || '',

      netAmountCached: netAmount.value,
      amountDueCached: amountDue.value,
      consultantShareCached: consultantShare.value,
      companyShareCached: companyShare.value,
      fileUrls: [],
      files: [],
      assignmentRespondedAt: '',
      assignmentRespondedBy: '',
      assignmentRespondedByName: '',
      assignmentStatus: form.assignedConsultantId ? 'pending' : 'unassigned',
      assignedBy: {
        uid: currentUserId.value,
        fullName: `${store.currentUser.firstName} ${store.currentUser.lastName}`,
      },
    }

    const engagementCode = form.engagementCode
    const created = await service.createEngagements(payload)
    const engagementId = created?.id || created?.docId || created?._id

    if (!engagementId) {
      throw new Error('Work was saved but no id was returned for file linking.')
    }

    const uploadSummary = await uploadQueuedFiles(engagementId)

    const uploadedFilesPayload = uploadSummary.uploaded.map((file) => ({
      id: file?.id || null,
      name: file?.name || file?.originalName || '',
      originalName: file?.originalName || file?.name || '',
      url: file?.url || '',
      storagePath: file?.storagePath || '',
      category: file?.category || 'supporting_document',
      fileType: file?.fileType || '',
      clientId: file?.clientId || form.clientId,
      engagementId,
      uploadedBy: file?.uploadedBy || currentUserId.value || null,
    }))

    const uploadedFileUrls = uploadedFilesPayload
      .map((file) => file.url)
      .filter(Boolean)

    await store.engagementsActions.update(engagementId, {
      fileUrls: uploadedFileUrls,
      files: uploadedFilesPayload,
      attachmentsCount: uploadedFilesPayload.length,
      hasAttachments: uploadedFilesPayload.length > 0,
    })

    const engagementForNotification = buildEngagementNotificationPayload({
      engagementId,
      engagementCode,
      payload,
      uploadedFilesPayload,
      uploadedFileUrls,
    })

    const notificationJobs = [
      crmNotifications.notifyWorkCreated(engagementForNotification),
    ] 

    if (form.assignedConsultantId) {
      notificationJobs.push(
        crmNotifications.notifyWorkAssignment(engagementForNotification),
      )
    }

    const notificationResults = await Promise.allSettled(notificationJobs)
    const failedNotificationCount = notificationResults.filter(
      (result) => result.status === 'rejected',
    ).length

    if (failedNotificationCount) {
      console.warn(
        `[crm] Work ${engagementCode} saved, but ${failedNotificationCount} notification job(s) failed.`,
        notificationResults,
      )
    }

    await Promise.allSettled([
      service.fetchRecentEngagements?.(),
      service.fetchRecentFiles?.(),
    ])

    resetForm(true)

    if (uploadSummary.failed.length) {
      successMessage.value = `Work ${engagementCode} saved. ${uploadSummary.uploaded.length} file(s) uploaded.`
      errorMessage.value = `Some files failed: ${uploadSummary.failed.map((item) => item.name).join(', ')}`
    } else {
      successMessage.value = `Work ${engagementCode} saved successfully.${uploadSummary.uploaded.length ? ` ${uploadSummary.uploaded.length} file(s) uploaded.` : ''}`
    }
  } catch (error) {
    errorMessage.value = error?.message || 'Failed to save work.'
  } finally {
    submitting.value = false
  }
}

async function loadPage() {
  try {
    await Promise.allSettled([
      service.fetchClients?.(),
      service.fetchRecentEngagements?.(),
      service.fetchRecentFiles?.(),
    ])
  } catch (error) {
    errorMessage.value = error?.message || 'Failed to load page data.'
  }
}

onMounted(async () => {
  prefillFromRoute()
  await store.usersActions.fetchInitialPage({ filters: {role: 'consultant', status: 'active' } })
  await loadPage()
})

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  return `${year}-${month}-${day}`;
};

const getLocalTimeString = (date = new Date()) => {
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${hours}:${minutes}`;
};
const pad = (value) => String(value).padStart(2, '0');
</script>

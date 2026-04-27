<template>
  <CrmPageShell
    title="Final Delivery"
    description="Upload final work"
  >
    <template #actions>
      <div class="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-end">
        <div class="flex flex-wrap items-center gap-2">
          <span class="badge" :class="{ 'opacity-70': !itemData.clientId }">
            {{ itemData.clientName + ' | '  }} 
          </span>
        </div>
      </div>
    </template>

    <section class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <form class="card grid gap-6" @submit.prevent="updateFinalEngagement">
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
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <label class="grid gap-2">
              <span class="field-label mb-0">Ref Code: {{ itemData.engagementCode }}</span>
              
            </label>
          </div>
        </section>

        <section class="grid gap-4">
          <div>
           <h3 class="text-xl text-primary">
              Title | {{  itemData.title }}
            </h3>

          </div>
          <div>
           <h3 class="text-xl text-secodary">
              Description
            </h3>
            <p class="text-xs text-wrap relative tracking-[0.24em] text-secondary">
              {{  itemData.description }}
            </p>

          </div>
        </section>

        
        <!-- used to be what is being delivered -->

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
              <dt class="text-[var(--color-text-soft)]">Files</dt>
              <dd class="text-[var(--color-text)]">
                {{ queuedFiles.length }} queued
              </dd>
            </div>
          </dl>
        </section>
      </aside>
    </section>
  </CrmPageShell>
</template>


<script setup>
import CrmPageShell from '../components/CrmPageShell.vue'
/**
* @file ConsultantSubmitWorkPage.vue
* @description Final delivery submission page for consultants.
*
* Totistack-aligned handling:
* - separate page/submission loading state
* - guarded submit flow
* - shard-provider collection actions only
* - structured validation + user-safe error messages
* - upload result normalization
* - best-effort storage cleanup
* - documented helper methods
*/
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
import { useCrmService } from '../services/crmService.js'
import {
  MAX_FILE_COUNT,
  MAX_TOTAL_SIZE_BYTES,
  acceptedFileTypes,
  sanitizeFilename,
  validateFile,
  createStoragePath,
} from '@core_services/index.js'

const { service } = useCrmService()
const route = useRoute()
const store = useAppStore()

const selectedWorkId = String(route.params.work_id || '').trim()

const selectedItem = ref(null)
const submitting = ref(false)
const isPageLoading = ref(false)

const errorMessage = ref('')
const successMessage = ref('')
const queuedFiles = ref([])
const fileInputRef = ref(null)
const defaultFileCategory = ref('final_delivery')

const form = reactive({
  remarks: '',
})

const currentUser = computed(() => unref(store.currentUser) || null)
const currentUserId = computed(() => currentUser.value?.uid || currentUser.value?.id || null)
const itemData = computed(() => selectedItem.value?.data || {})

/**
* Consultants can only submit when:
* - authenticated
* - engagement exists
* - engagement is assigned to them
* - engagement has been accepted
* - at least one file is queued
*/
const canSubmit = computed(() => {
  return Boolean(
    currentUserId.value &&
      selectedItem.value?.id &&
      itemData.value.clientId &&
      itemData.value.assignedConsultantId === currentUserId.value &&
      String(itemData.value.assignmentStatus || '').toLowerCase() === 'accepted' &&
      queuedFiles.value.length > 0,
  )
})

/**
* Extracts raw data from shard-provider style records.
*
* @param {object|null|undefined} record
* @returns {Record<string, any>}
*/
function recordData(record) {
  if (!record || typeof record !== 'object') return {}
  return record.data && typeof record.data === 'object' ? record.data : record
}

/**
* Normalized record id accessor.
*
* @param {object|null|undefined} record
* @returns {string}
*/
function getRecordId(record) {
  return record?.id || record?.docId || record?._id || ''
}

/**
* Safe current user display name.
*
* @returns {string}
*/
function getCurrentUserName() {
  return (
    currentUser.value?.displayName ||
    [currentUser.value?.firstName, currentUser.value?.lastName].filter(Boolean).join(' ') ||
    currentUser.value?.email ||
    'Unknown user'
  )
}

/**
* Maps technical errors to safer UI messages.
*
* @param {unknown} error
* @param {string} fallback
* @returns {string}
*/
function getFriendlyErrorMessage(error, fallback = 'Something went wrong.') {
  const code = error?.code || ''
  const message = String(error?.message || '')

  if (code === 'storage/unauthorized') return 'You are not allowed to upload this file.'
  if (code === 'storage/canceled') return 'The upload was cancelled.'
  if (code === 'storage/retry-limit-exceeded') return 'The upload took too long. Please try again.'
  if (code === 'permission-denied') return 'You do not have permission to perform this action.'
  if (code === 'NOT_FOUND') return 'The selected work item could not be found.'
  if (message) return message

  return fallback
}

/**
* Resolves Firebase Storage from the Totistack app store first.
*
* @returns {import('firebase/storage').FirebaseStorage}
*/
function resolveStorage() {
  return store.storage || store.$storage || getStorage()
}

/**
* Resolves shard-provider generated collection actions.
*
* @param {string} name
* @returns {Record<string, any>}
*/
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

/**
* Gets file extension from filename.
*
* @param {string} name
* @returns {string}
*/
function getFileExtension(name = '') {
  const parts = String(name).toLowerCase().split('.')
  return parts.length > 1 ? parts.pop() : ''
}

/**
* Resets inline messages.
*/
function clearMessages() {
  errorMessage.value = ''
  successMessage.value = ''
}

/**
* Clears queued files and resets file input.
*/
function clearQueuedFiles() {
  queuedFiles.value = []
  if (fileInputRef.value) fileInputRef.value.value = ''
}

/**
* Removes a queued file from the local upload list.
*
* @param {string} localId
*/
function removeQueuedFile(localId) {
  queuedFiles.value = queuedFiles.value.filter((entry) => entry.localId !== localId)
}

/**
* Resets page form state.
*/
function resetForm() {
  form.remarks = ''
  clearQueuedFiles()
  clearMessages()
}

/**
* Validates user permission to submit final work.
* Throws instead of returning booleans to keep submit flow linear.
*/
function validateBeforeSubmit() {
  if (!currentUserId.value) {
    throw new Error('You must be signed in to submit final work.')
  }

  if (!selectedItem.value?.id) {
    throw new Error('The selected work item could not be found.')
  }

  if (!itemData.value.clientId) {
    throw new Error('This work item is missing a linked client.')
  }

  if (itemData.value.assignedConsultantId !== currentUserId.value) {
    throw new Error('Only the assigned consultant can submit final work for this item.')
  }

  if (String(itemData.value.assignmentStatus || '').toLowerCase() !== 'accepted') {
    throw new Error('You must accept the assignment before submitting final work.')
  }

  if (!queuedFiles.value.length) {
    throw new Error('Please attach at least one final delivery file.')
  }
}

/**
* Handles file input selection with Totistack-style validation rules.
*
* @param {Event} event
*/
function onFileInputChange(event) {
  const files = Array.from(event.target?.files || [])
  if (!files.length) return

  clearMessages()

  if (files.length + queuedFiles.value.length > MAX_FILE_COUNT) {
    errorMessage.value = `You can queue a maximum of ${MAX_FILE_COUNT} files.`
    event.target.value = ''
    return
  }

  const currentTotal = queuedFiles.value.reduce((sum, entry) => sum + (entry.file?.size || 0), 0)
  const newTotal = files.reduce((sum, file) => sum + (file.size || 0), currentTotal)

  if (newTotal > MAX_TOTAL_SIZE_BYTES) {
    errorMessage.value = `Total selected files exceed ${Math.round(MAX_TOTAL_SIZE_BYTES / (1024 * 1024))} MB.`
    event.target.value = ''
    return
  }

  const rejected = []
  const accepted = []
  const baseNow = Date.now()

  files.forEach((file, index) => {
    const validation = validateFile(file)

    if (!validation.ok) {
      rejected.push(`${file.name}: ${validation.reason}`)
      return
    }

    accepted.push({
      localId: `${baseNow}_${index}_${Math.random().toString(36).slice(2, 8)}`,
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

/**
* Waits for Firebase resumable upload completion and updates UI progress.
*
* @param {import('firebase/storage').UploadTask} task
* @param {Record<string, any>} queueItem
* @returns {Promise<import('firebase/storage').UploadTaskSnapshot>}
*/
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

/**
* Uploads one file and writes its metadata to crm_files.
*
* @param {Record<string, any>} queueItem
* @param {{ clientId: string, engagementId: string }} context
* @returns {Promise<Record<string, any>>}
*/
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
      category: queueItem.category || 'final_delivery',
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
      category: queueItem.category || 'final_delivery',
      uploadedBy: currentUserId.value || null,
      uploadedByName: getCurrentUserName(),
      visibility: 'consultant_submission',
    })

    queueItem.status = 'uploaded'
    queueItem.statusLabel = 'Uploaded'
    queueItem.progress = 100

    return fileDoc
  } catch (error) {
    queueItem.status = 'failed'
    queueItem.statusLabel = 'Failed'
    queueItem.error = getFriendlyErrorMessage(error, 'Upload failed.')

    try {
      await deleteObject(fileRef)
    } catch {
      // Best-effort cleanup only.
    }

    throw error
  }
}

/**
* Uploads all queued files sequentially.
* Sequential flow is easier to reason about and debug in enterprise admin flows.
*
* @param {string} engagementId
* @returns {Promise<{uploaded: any[], failed: {name: string, message: string}[]}>}
*/
async function uploadQueuedFiles(engagementId) {
  if (!queuedFiles.value.length) {
    return { uploaded: [], failed: [] }
  }

  const uploaded = []
  const failed = []

  for (const item of queuedFiles.value) {
    try {
      const created = await uploadSingleFile(item, {
        clientId: itemData.value.clientId,
        engagementId,
      })
      uploaded.push(created)
    } catch (error) {
      failed.push({
        name: item.file?.name || item.safeName,
        message: getFriendlyErrorMessage(error, 'Upload failed.'),
      })
    }
  }
  

  return { uploaded, failed }
}

/**
* Writes activity log for auditability.
*
* @param {object} payload
* @param {string} payload.action
* @param {string} payload.message
* @param {string|null} [payload.fileId]
*/
async function logEngagementActivity({ action, message, fileId = null }) {
  try {
    const activityActions = requireCollectionActions('engagement_activity')

    await activityActions.add({
      engagementId: getRecordId(selectedItem.value),
      clientId: itemData.value.clientId || null,
      fileId,
      action,
      message,
      actorId: currentUserId.value || null,
      actorName: getCurrentUserName(),
      createdAtIso: new Date().toISOString(),
    })
  } catch {
    // Best-effort audit logging only.
  }
}

/**
* Normalizes file docs into a stored engagement payload snapshot.
*
* @param {any[]} uploaded
* @param {string} engagementId
* @returns {{files: any[], urls: string[]}}
*/
function buildUploadedFilesPayload(uploaded, engagementId) {
  const files = uploaded.map((file) => ({
    id: file?.id || file?.docId || file?._id || null,
    name: file?.name || file?.originalName || '',
    originalName: file?.originalName || file?.name || '',
    url: file?.url || '',
    storagePath: file?.storagePath || '',
    category: file?.category || 'final_delivery',
    fileType: file?.fileType || '',
    clientId: file?.clientId || itemData.value.clientId || '',
    engagementId,
    consultantInfo: {
      uid: currentUserId.value || null,
      fullName: getCurrentUserName(),
    },
    uploadedBy: file?.uploadedBy || currentUserId.value || null,
  }))

  const urls = files.map((file) => file.url).filter(Boolean)

  return { files, urls }
}

/**
* Updates engagement final-delivery fields after upload.
*
* @param {string} engagementId
* @param {any[]} uploaded
*/
async function persistFinalSubmission(engagementId, uploaded) {
  const engagementsActions = requireCollectionActions('engagements')
  const { files, urls } = buildUploadedFilesPayload(uploaded, engagementId)
  const existingUpdates = Array.isArray(itemData.value.finalUpdates) ? [...itemData.value.finalUpdates] : []
  const finalSubmittedAt = new Date().toISOString()
  const finalRemarks = String(form.remarks || '').trim()
  const newUpdate = {
    id: `final-${Date.now()}`,
    finalSubmittedAt,
    finalSubmittedBy: currentUserId.value || null,
    finalSubmittedByName: getCurrentUserName(),
    finalRemarks,
    consultantInfo: {
      uid: currentUserId.value || null,
      fullName: getCurrentUserName(),
    },
    files,
  }

  await engagementsActions.update(engagementId, {
    deliveryStatus: 'submitted',
    reviewStatus: 'pending',
    finalFileUrls: urls,
    finalFiles: files,
    finalUpdates: [...existingUpdates, newUpdate],
    finalAttachmentsCount: files.length,
    finalSubmittedAt,
    finalSubmittedBy: currentUserId.value || null,
    finalSubmittedByName: getCurrentUserName(),
    finalRemarks,
    notificationFeedStatus: 'queued',
  })

  await service.syncFinalSubmissionNotifications({
    id: engagementId,
    ...itemData.value,
    consultantName: getCurrentUserName(),
    deliveryStatus: 'submitted',
    reviewStatus: 'pending',
  })

  await logEngagementActivity({
    action: 'final_delivery_submitted',
    message: `Final delivery submitted with ${files.length} file(s).`,
  })
}

/**
* Main final submission handler.
*/
async function updateFinalEngagement() {
  submitting.value = true
  clearMessages()

  try {
    validateBeforeSubmit()

    const engagementId = getRecordId(selectedItem.value)
    const engagementCode = itemData.value.engagementCode || engagementId || 'work item'

    const uploadSummary = await uploadQueuedFiles(engagementId)

    if (!uploadSummary.uploaded.length) {
      if (uploadSummary.failed.length) {
        throw new Error(uploadSummary.failed.map((item) => item.message).join(' | '))
      }

      throw new Error('No files were uploaded.')
    }

    await persistFinalSubmission(engagementId, uploadSummary.uploaded)
    resetForm()

    if (uploadSummary.failed.length) {
      successMessage.value = `${engagementCode} submitted. ${uploadSummary.uploaded.length} file(s) uploaded.`
      errorMessage.value = `Some files failed: ${uploadSummary.failed.map((item) => item.name).join(', ')}`
      return
    }

    successMessage.value = `${engagementCode} submitted successfully. ${uploadSummary.uploaded.length} file(s) uploaded.`
  } catch (error) {
    errorMessage.value = getFriendlyErrorMessage(error, 'Failed to submit final work.')
  } finally {
    submitting.value = false
  }
}

/**
* Loads selected engagement.
*/
async function loadSelectedItem() {
  isPageLoading.value = true
  clearMessages()

  try {
    if (!selectedWorkId) {
      throw new Error('Missing work id.')
    }

    selectedItem.value = await store.engagementsActions.getById(selectedWorkId)

    if (!selectedItem.value) {
      throw new Error('The selected work item could not be loaded.')
    }
  } catch (error) {
    selectedItem.value = null
    errorMessage.value = getFriendlyErrorMessage(error, 'Failed to load work item.')
  } finally {
    isPageLoading.value = false
  }
}

onMounted(async () => {
  await loadSelectedItem()
})
</script>
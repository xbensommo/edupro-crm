<template>
  <CrmPageShell
    title="Listed Work"
    description="Manage posted work, review assignment status, and access attachments only after consultant acceptance."
  >
    <template #actions>
      <RouterLink
        v-if="isAssignedConsultant && assignmentStatus === 'accepted'"
        :to="`/crm/submit/${route.params.id}/final_d`"
        class="btn-primary"
      >
        Submit Completed Work
      </RouterLink>
    </template>

    <section
      v-if="selectedItem && !isPageLoading"
      class="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]"
    >
      <article class="card relative min-w-0 overflow-hidden p-0">
        <div class="absolute inset-x-6 top-0 h-px bg-brand-gradient opacity-70"></div>

        <div class="min-w-0 space-y-6 p-6 md:p-8">
          <div class="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div class="min-w-0 space-y-2">
              <p class="section-label">Selected Work Summary</p>

              <h2 class="section-title wrap-safe leading-tight">
                {{ itemData.title || 'Untitled Work Item' }}
              </h2>

              <div class="flex min-w-0 flex-wrap items-center gap-2 text-sm text-muted">
                <span class="inline-flex max-w-full items-center rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-bg-muted)] px-3 py-1 wrap-safe">
                  Ref Code: {{ itemData.engagementCode || '—' }}
                </span>

                <span class="inline-flex max-w-full items-center rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-bg-muted)] px-3 py-1 wrap-safe">
                  Level: {{ itemData.studyLevel || '—' }}
                </span>

                <span class="badge badge-secondary wrap-safe">
                  Assignment: {{ assignmentStatusLabel }}
                </span>
              </div>
            </div>

            <div class="flex min-w-0 flex-wrap gap-2">
              <span class="badge badge-primary wrap-safe">
                {{ itemData.status || 'unknown' }}
              </span>

              <span class="badge badge-secondary wrap-safe">
                Due Date: {{ formatFirestoreDateTime(itemData.dueDate) || '—' }}
              </span>
            </div>
          </div>

          <div
            v-if="canCurrentUserRespondToAssignment"
            class="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-muted)] p-5"
          >
            <div class="flex min-w-0 flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div class="min-w-0">
                <p class="text-sm font-semibold text-[var(--color-text)] wrap-safe">
                  Consultant assignment response
                </p>
                <p class="text-sm text-muted wrap-safe">
                  Accept to unlock attachments and confirm ownership, or deny to send it back for reassignment.
                </p>
              </div>

              <div class="flex flex-wrap gap-2">
                <button
                  class="btn-outline shrink-0"
                  type="button"
                  :disabled="assignmentActionLoading"
                  @click="handleAssignmentDecision('denied')"
                >
                  {{ assignmentActionLoading ? 'Processing...' : 'Deny assignment' }}
                </button>

                <button
                  class="btn-primary shrink-0"
                  type="button"
                  :disabled="assignmentActionLoading"
                  @click="handleAssignmentDecision('accepted')"
                >
                  {{ assignmentActionLoading ? 'Processing...' : 'Accept assignment' }}
                </button>
              </div>
            </div>
          </div>

          <div class="bg-[var(--color-bg-canvas)] p-5">
            <div class="flex min-w-0 items-center justify-between gap-3">
              <div class="min-w-0">
                <h3 class="text-sm font-semibold text-[var(--color-text)]">Description</h3>
                <p class="mt-1 text-xs text-muted wrap-safe">
                  {{ itemData.description }}
                </p>
              </div>
            </div>
          </div>

          <div class="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-canvas)] p-5">
            <div class="flex min-w-0 items-center justify-between gap-3">
              <div class="min-w-0">
                <h3 class="text-sm font-semibold text-[var(--color-text)]">Attachments</h3>
                <p class="mt-1 text-sm text-muted wrap-safe">
                  Files remain locked until the assigned consultant accepts this assignment.
                </p>
              </div>

              <button
                class="btn-outline btn-sm shrink-0"
                type="button"
                :disabled="attachmentsLoading"
                @click="refreshAttachments"
              >
                {{ attachmentsLoading ? 'Refreshing...' : 'Refresh' }}
              </button>
            </div>

            <div v-if="attachmentsLoading" class="mt-4 text-sm text-muted wrap-safe">
              Loading attachments...
            </div>

            <div
              v-else-if="!attachmentsVisible"
              class="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 wrap-safe"
            >
              Attachments are hidden until the assigned consultant accepts the assignment.
            </div>

            <div v-else-if="attachments.length" class="mt-4 grid gap-3">
              <article
                v-for="file in attachments"
                :key="file.id || file.storagePath || file.url"
                class="relative min-w-0 rounded-2xl border border-[var(--color-border-subtle)] p-4"
              >
                <div class="flex min-w-0 flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div class="min-w-0 flex-1">
                    <p class="break-hard font-semibold text-[var(--color-secondary)]">
                      {{ file.name || file.originalName || 'Unnamed file' }}
                    </p>

                    <p class="mt-1 wrap-safe text-sm text-[var(--color-text-soft)]">
                      {{ file.category || 'attachment' }} · {{ file.fileType || 'unknown' }}
                    </p>
                  </div>

                  <button
                    class="btn-primary btn-sm shrink-0"
                    type="button"
                    :disabled="isDownloading(file)"
                    @click="downloadAttachment(file)"
                  >
                    {{ isDownloading(file) ? 'Downloading...' : 'Download' }}
                  </button>
                </div>
              </article>
            </div>

            <div v-else class="mt-4 text-sm text-muted wrap-safe">
              No attachments linked to this work item.
            </div>
          </div>

          <div
            v-if="visibleFinalUpdates.length"
            class="bg-[var(--color-bg-canvas)] p-5"
          >
            <div class="flex min-w-0 items-center justify-between gap-3">
              <div class="min-w-0">
                <h3 class="text-sm font-semibold text-[var(--color-text)]">Final Updates</h3>
                <p class="mt-1 text-sm text-muted wrap-safe">
                  Submitted final delivery updates and files.
                </p>
              </div>
            </div>

            <div class="mt-4 grid gap-4">
              <article
                v-for="(update, updateIndex) in visibleFinalUpdates"
                :key="update.id || update.createdAt || update.finalSubmittedAt || `final-update-${updateIndex}`"
                class="min-w-0 p-4"
              >
                <div class="flex min-w-0 flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div class="min-w-0 flex-1">
                    <p class="font-semibold text-[var(--color-secondary)] wrap-safe">
                      Final Update {{ updateIndex + 1 }}
                    </p>

                    <p class="mt-1 wrap-safe text-sm text-[var(--color-text-soft)]">
                      By {{ update.consultantInfo?.fullName || update.finalSubmittedByName || 'Unknown consultant' }}
                    </p>

                    <p class="mt-1 wrap-safe text-xs text-[var(--color-text-soft)]">
                      {{ formatFirestoreDateTime(update.finalSubmittedAt || update.createdAt) }}
                    </p>
                  </div>

                  <span class="badge badge-secondary shrink-0 wrap-safe">
                    {{ (update.files || []).length }} file(s)
                  </span>
                </div>

                <div v-if="update.finalRemarks" class="mt-3 rounded-2xl bg-[var(--color-bg-muted)] p-3">
                  <p class="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-soft)]">
                    Remarks
                  </p>
                  <p class="mt-2 text-sm text-[var(--color-text)] wrap-safe">
                    {{ update.finalRemarks }}
                  </p>
                </div>

                <div v-if="(update.files || []).length" class="mt-4 grid gap-3">
                  <article
                    v-for="file in update.files"
                    :key="file.id || file.storagePath || file.url"
                    class="min-w-0 border border-primary p-4"
                  >
                    <div class="flex min-w-0 flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div class="min-w-0 flex-1">
                        <p class="break-hard font-semibold text-[var(--color-secondary)]">
                          {{ file.name || file.originalName || 'Unnamed file' }}
                        </p>

                        <p class="mt-1 wrap-safe text-sm text-[var(--color-text-soft)]">
                          {{ file.category || 'final delivery' }} · {{ file.fileType || 'unknown' }}
                        </p>
                      </div>

                      <!-- <button
                        class="btn-primary btn-sm shrink-0"
                        type="button"
                        :disabled="isDownloading(file)"
                        @click="downloadAttachment(file)"
                      >
                        {{ isDownloading(file) ? 'Downloading...' : 'Download' }}
                      </button> -->

                      <button
                        class="btn-primary btn-sm shrink-0"
                        type="button"
                        :disabled="isDownloading(file)"
                        @click="downloadAttachment(file, {
                          bypassAssignmentLock: true,
                          activityAction: 'final_update_file_downloaded',
                          label: 'final update file'
                        })"
                      >
                        {{ isDownloading(file) ? 'Downloading...' : 'Download' }}
                    </button>
                    </div>
                  </article>
                </div>
              </article>
            </div>
          </div>
        </div>
      </article>

      <aside class="min-w-0 p-6 md:p-7 space-y-5">
        <div class="card min-w-0">
          <div class="min-w-0">
            <p class="section-label">Assignment Details</p>
            <h3 class="text-lg font-semibold text-[var(--color-text)] wrap-safe">
              Ownership & progress
            </h3>
          </div>

          <dl class="space-y-4 text-sm">
            <div class="status-strip min-w-0">
              <dt class="text-muted">Assigned Consultant</dt>
              <dd class="wrap-safe font-medium text-[var(--color-text)]">
                {{ itemData.consultantName || 'Unassigned' }}
              </dd>
            </div>

            <!-- <div class="status-strip min-w-0">
              <dt class="text-muted">Client Name</dt>
              <dd class="wrap-safe font-medium text-[var(--color-text)]">
                {{ itemData.clientName }}
              </dd>
            </div> -->

            <!-- <div class="status-strip min-w-0">
              <dt class="text-muted">Client Email</dt>
              <dd class="break-hard font-medium text-[var(--color-text)]">
                {{ itemData.clientEmail || 'N/A' }}
              </dd>
            </div>

            <div class="status-strip min-w-0">
              <dt class="text-muted">Client Phone</dt>
              <dd class="break-hard font-medium text-[var(--color-text)]">
                {{ itemData.clientPhone || 'N/A' }}
              </dd>
            </div> -->

            <div class="status-strip min-w-0" v-if="store.hasRole('consultant')">
              <dt class="text-muted">Max Reward</dt>
              <dd class="wrap-safe font-medium text-[var(--color-text)]">
                {{ itemData.consultantShareAmountCached || itemData.consultantShareCached || '—' }}
              </dd>
            </div>
          </dl>
        </div>

        <div class="card-soft min-w-0" v-if="isAssignedConsultant">
          <div class="min-w-0">
            <span class="field-label text-xs text-italic wrap-safe">
              10% deduction if work is rejected by client or editor
            </span>
          </div>

          <dl class="space-y-4 text-sm">
            <div class="status-strip min-w-0">
              <dt class="text-muted">Commission</dt>
              <dd class="wrap-safe font-medium text-[var(--color-text)]">
                {{ itemData.consultantShareAmountCached ? `NAD ${itemData.consultantShareAmountCached}` : '—' }}
              </dd>
            </div>

            <div class="status-strip min-w-0">
              <dt class="text-muted">Assignment Status</dt>
              <dd class="wrap-safe font-medium text-[var(--color-text)]">
                {{ assignmentStatusLabel }}
              </dd>
            </div>

            <div class="status-strip min-w-0">
              <dt class="text-muted">Responded At</dt>
              <dd class="wrap-safe font-medium text-[var(--color-text)]">
                {{ formatFirestoreDateTime(itemData.assignmentRespondedAt) }}
              </dd>
            </div>

            <div class="status-strip min-w-0">
              <dt class="text-muted">Responded By</dt>
              <dd class="break-hard font-medium text-[var(--color-text)]">
                {{ itemData.assignmentRespondedByName || '—' }}
              </dd>
            </div>

            <div class="status-strip min-w-0" v-if="store.hasRole('consultant')">
              <dt class="text-muted">Max Reward</dt>
              <dd class="wrap-safe font-medium text-[var(--color-text)]">
                {{ itemData.consultantShareAmountCached || itemData.consultantShareCached || '—' }}
              </dd>
            </div>
          </dl>
        </div>
      </aside>
    </section>

    <section v-else-if="isPageLoading" class="card p-0 overflow-hidden">
      <Loader :loading="isPageLoading" />
    </section>

    <section v-else class="card p-10 text-center">
      <h3 class="text-xl font-semibold text-[var(--color-text)]">Item Not Found</h3>
      <p class="mt-2 text-sm text-muted wrap-safe">
        The selected work item could not be loaded or does not exist.
      </p>
    </section>
  </CrmPageShell>
</template>

<style scoped>
.wrap-safe {
  min-width: 0;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.break-hard {
  min-width: 0;
  white-space: normal;
  word-break: break-all;
}
</style>

<script setup>
/**
* @file SelectedWorkPage.vue
* @description Work detail page with:
* - shard-provider friendly attachment fetching
* - separate loading states
* - consultant accept / deny assignment flow
* - guarded attachment visibility
* - download logging without opening a new browser tab
*/
import { computed, inject, onMounted, ref, unref } from 'vue'
import {
  getDownloadURL,
  getStorage,
  ref as storageRef,
} from 'firebase/storage'
import { useRoute } from 'vue-router'
import CrmPageShell from '../components/CrmPageShell.vue'
import Loader from '@app/components/SkeletonLoader.vue'
import { useAppStore } from '@app/stores/appStore'
import { useActionExecutor } from '@action_modal/composables/use-action-executor.js';
import { useCrmService } from '../services/crmService.js'

const route = useRoute()
const store = useAppStore()
const confirmModal = inject('CONFIRM_MODAL_STORE_KEY', null)

const modalActions = useActionExecutor();
const { service } = useCrmService()

const selectedItem = ref(null)
const attachments = ref([])

const isPageLoading = ref(false)
const attachmentsLoading = ref(false)
const assignmentActionLoading = ref(false)
const downloadingIds = ref([])

const { id } = route.params

const currentUser = computed(() => unref(store.currentUser) || null)
const currentUserId = computed(() => currentUser.value?.uid || currentUser.value?.id || null)

const itemData = computed(() => selectedItem.value?.data || {})

const assignmentStatus = computed(() => {
  return String(itemData.value.assignmentStatus || 'pending').toLowerCase()
})

const assignmentStatusLabel = computed(() => {
  if (assignmentStatus.value === 'accepted') return 'Accepted'
  if (assignmentStatus.value === 'denied') return 'Denied'
  return 'Pending'
})

const canCurrentUserRespondToAssignment = computed(() => {
  return Boolean(
    currentUserId.value &&
      itemData.value.assignedConsultantId &&
      currentUserId.value === itemData.value.assignedConsultantId &&
      assignmentStatus.value !== 'accepted',
  )
  
})

const isAssignedConsultant = computed(() =>{
  return Boolean(
    currentUser.value && itemData.value.assignedConsultantId && store.hasRole(currentUser.value.role) && ( currentUser.value.uid == itemData.value.assignedConsultantId || currentUser.value.uid == itemData.assignmentRespondedBy)
  )
})

const attachmentsVisible = computed(() => assignmentStatus.value === 'accepted')

// ADD THESE COMPUTEDS INSIDE <script setup>, DO NOT REMOVE YOUR EXISTING CODE

const canViewAllFinalUpdates = computed(() => {
  return Boolean(store.hasRole?.('admin') || store.hasRole?.('receptionist'))
})

const normalizedFinalUpdates = computed(() => {
  const singleFinalUpdate =
    itemData.value?.finalFiles?.length ||
    itemData.value?.finalRemarks ||
    itemData.value?.finalSubmittedAt
      ? [
          {
            id: itemData.value?.finalUpdateId || `final-${getRecordId(selectedItem.value)}`,
            finalSubmittedAt: itemData.value?.finalSubmittedAt || null,
            finalSubmittedBy: itemData.value?.finalSubmittedBy || null,
            finalSubmittedByName: itemData.value?.finalSubmittedByName || '',
            finalRemarks: itemData.value?.finalRemarks || '',
            consultantInfo: itemData.value?.finalFiles?.[0]?.consultantInfo || null,
            files: Array.isArray(itemData.value?.finalFiles) ? itemData.value.finalFiles : [],
          },
        ]
      : []

  const multipleUpdates = Array.isArray(itemData.value?.finalUpdates)
    ? itemData.value.finalUpdates.map((entry, index) => ({
        id: entry?.id || entry?.finalUpdateId || `final-update-${index}`,
        finalSubmittedAt: entry?.finalSubmittedAt || entry?.createdAt || null,
        finalSubmittedBy: entry?.finalSubmittedBy || entry?.consultantInfo?.uid || null,
        finalSubmittedByName:
          entry?.finalSubmittedByName ||
          entry?.consultantInfo?.fullName ||
          '',
        finalRemarks: entry?.finalRemarks || entry?.remarks || '',
        consultantInfo: entry?.consultantInfo || null,
        files: Array.isArray(entry?.files) ? entry.files : [],
      }))
    : []

  return multipleUpdates.length ? multipleUpdates : singleFinalUpdate
})

const visibleFinalUpdates = computed(() => {
  if (canViewAllFinalUpdates.value) {
    return normalizedFinalUpdates.value
  }

  if (store.hasRole?.('consultant')) {
    return normalizedFinalUpdates.value.filter((update) => {
      const ownerId =
        update?.consultantInfo?.uid ||
        update?.finalSubmittedBy ||
        null

      return ownerId && ownerId === currentUserId.value
    })
  }

  return []
})

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
* Extracts the real data object from shard-provider records.
*
* @param {object|null|undefined} record
* @returns {Record<string, any>}
*/
function recordData(record) {
  if (!record || typeof record !== 'object') return {}
  return record.data && typeof record.data === 'object' ? record.data : record
}

/**
* Returns the record id in a provider-safe way.
*
* @param {object|null|undefined} record
* @returns {string}
*/
function getRecordId(record) {
  return record?.id || record?.docId || record?._id || ''
}

/**
* Loads the engagement once.
*/
async function loadSelectedItem() {
  isPageLoading.value = true

  try {
    selectedItem.value = await store.engagementsActions.getById(id)
  } catch (error) {
    selectedItem.value = null
  } finally {
    isPageLoading.value = false
  }
}

/**
* Loads linked attachments from crm_files.
* Uses a dedicated loading state instead of sharing page loading.
*/
async function fetchAttachments() {
  if (!selectedItem.value?.id) {
    attachments.value = []
    return
  }

  attachmentsLoading.value = true

  try {
    const crmFilesActions = requireCollectionActions('crm_files')

    /**
     * Prefer shard-provider filtered fetch if your generated actions expose it.
     * Fallback to local state if records were already prefetched elsewhere.
     */
    if (typeof crmFilesActions.fetchByFilters === 'function') {
      const result = await crmFilesActions.fetchByFilters({
        filters: {
          engagementId: getRecordId(selectedItem.value),
        },
      })

      const rows = Array.isArray(result?.items)
        ? result.items
        : Array.isArray(result)
          ? result
          : crmFilesActions.state?.items || []

      attachments.value = rows
        .map((entry) => ({ id: getRecordId(entry), ...recordData(entry) }))
        .filter((entry) => entry.engagementId === getRecordId(selectedItem.value))
    } else {
      const rows = Array.isArray(crmFilesActions?.state?.items)
        ? crmFilesActions.state.items
        : []

      attachments.value = rows
        .map((entry) => ({ id: getRecordId(entry), ...recordData(entry) }))
        .filter((entry) => entry.engagementId === getRecordId(selectedItem.value))
    }
  } catch (error) {
    attachments.value = []
  } finally {
    attachmentsLoading.value = false
  }
}

async function refreshAttachments() {
  await fetchAttachments()
}

/**
* Opens the action modal and updates assignment status for the assigned consultant.
*
* @param {'accepted'|'denied'} decision
*/
async function handleAssignmentDecision(decision) {
  if (!selectedItem.value?.id || !currentUserId.value) return

  const approved = await openDecisionModal(decision)
  if (!approved) return

  assignmentActionLoading.value = true

  try {
    const engagementsActions = requireCollectionActions('engagements')

    const assignmentRespondedAt = new Date().toISOString()
    const assignmentRespondedByName =
      currentUser.value?.displayName ||
      [currentUser.value?.firstName, currentUser.value?.lastName].filter(Boolean).join(' ') ||
      currentUser.value?.email ||
      'Unknown user'

    await engagementsActions.update(getRecordId(selectedItem.value), {
      assignmentStatus: decision,
      assignmentRespondedAt,
      assignmentRespondedBy: currentUserId.value,
      assignmentRespondedByName,
      notificationFeedStatus: 'queued',
    })

    await service.syncAssignmentDecisionNotification({
      id: getRecordId(selectedItem.value),
      ...itemData.value,
      assignmentStatus: decision,
      assignmentRespondedAt,
      assignmentRespondedBy: currentUserId.value,
      assignmentRespondedByName,
      consultantName: itemData.value.consultantName || assignmentRespondedByName,
    }, decision)

    await logEngagementActivity({
      action: decision === 'accepted' ? 'assignment_accepted' : 'assignment_denied',
      message:
        decision === 'accepted'
          ? 'Assigned consultant accepted the assignment.'
          : 'Assigned consultant denied the assignment.',
      fileId: null,
    })

    await loadSelectedItem()
    await fetchAttachments()
  } finally {
    assignmentActionLoading.value = false
  }
}

/**
* Uses the existing action / confirm modal provider.
*
* @param {'accepted'|'denied'} decision
* @returns {Promise<boolean>}
*/
async function openDecisionModal(decision) {
  const title =
    decision === 'accepted' ? 'Accept assignment?' : 'Deny assignment?'
  const message =
    decision === 'accepted'
      ? 'Accepting will unlock attachments for this assignment and confirm you as the owner.'
      : 'Denying will keep attachments locked and mark this assignment for reassignment.'

  if (confirmModal?.open) {
    return await confirmModal.open({
      title,
      message,
      confirmText: decision === 'accepted' ? 'Accept' : 'Deny',
      cancelText: 'Cancel',
      tone: decision === 'accepted' ? 'primary' : 'danger',
    })
  }

  return window.confirm(message)
}

/**
* Logs a work activity event.
* Update the collection name here if your app uses a different activity collection.
*
* @param {object} payload
* @param {string} payload.action
* @param {string} payload.message
* @param {string|null} payload.fileId
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
      actorName:
        currentUser.value?.displayName ||
        [currentUser.value?.firstName, currentUser.value?.lastName].filter(Boolean).join(' ') ||
        currentUser.value?.email ||
        'Unknown user',
      createdAtIso: new Date().toISOString(),
    })
  } catch {
    // Best effort only.
  }
}

/*function isDownloading(file) {
  const fileId = file?.id || file?.storagePath || file?.url
  return downloadingIds.value.includes(fileId)
}*/

function resolveDownloadId(file) {
  return [
    file?.id,
    file?.storagePath,
    file?.url,
    file?.downloadURL,
    file?.fileUrl,
    file?.fileURL,
    file?.name,
    file?.originalName,
  ]
    .filter(Boolean)
    .join('|')
}

function isDownloading(file) {
  const fileId = resolveDownloadId(file)
  return Boolean(fileId && downloadingIds.value.includes(fileId))
}
function resolveStorage() {
  return store.storage || store.$storage || getStorage()
}

async function resolveFileDownloadUrl(file) {
  const directUrl =
    file?.url ||
    file?.downloadURL ||
    file?.fileUrl ||
    file?.fileURL ||
    ''

  if (directUrl) return directUrl

  if (file?.storagePath) {
    const fileRef = storageRef(resolveStorage(), file.storagePath)
    return await getDownloadURL(fileRef)
  }

  return ''
}

function resolveDownloadName(file) {
  return (
    file?.originalName ||
    file?.name ||
    file?.safeName ||
    'attachment'
  )
}
/**
* Downloads a file as a blob so it does not open in another tab.
* Also logs the activity after download is initiated.
*
* @param {object} file
*/
/*async function downloadAttachment(file) {
  if (!attachmentsVisible.value) return
  if (!file?.url) return

  const fileId = file?.id || file?.storagePath || file?.url
  downloadingIds.value = [...downloadingIds.value, fileId]

  try {
    const response = await fetch(file.url)
    if (!response.ok) {
      throw new Error('Failed to download file.')
    }

    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = file.originalName || file.name || 'attachment'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(objectUrl)

    await logEngagementActivity({
      action: 'attachment_downloaded',
      message: `Downloaded attachment: ${file.originalName || file.name || 'attachment'}.`,
      fileId: file.id || null,
    })
  } finally {
    downloadingIds.value = downloadingIds.value.filter((entry) => entry !== fileId)
  }
}
*/
async function downloadAttachment(file, options = {}) {
  const bypassAssignmentLock = options.bypassAssignmentLock === true

  if (!bypassAssignmentLock && !attachmentsVisible.value) return

  const fileId = resolveDownloadId(file)

  if (!fileId || downloadingIds.value.includes(fileId)) return

  downloadingIds.value = [...downloadingIds.value, fileId]

  try {
    const downloadUrl = await resolveFileDownloadUrl(file)

    if (!downloadUrl) {
      throw new Error('This file has no download URL or storage path.')
    }

    const response = await fetch(downloadUrl)

    if (!response.ok) {
      throw new Error('Failed to download file.')
    }

    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)

    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = resolveDownloadName(file)
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()

    window.setTimeout(() => {
      URL.revokeObjectURL(objectUrl)
    }, 1000)

    await logEngagementActivity({
      action: options.activityAction || 'attachment_downloaded',
      message: `Downloaded ${options.label || 'attachment'}: ${resolveDownloadName(file)}.`,
      fileId: file?.id || file?.storagePath || null,
    })
  } catch (error) {
    console.error('[crm] File download failed:', error)
  } finally {
    downloadingIds.value = downloadingIds.value.filter((entry) => entry !== fileId)
  }
}
function formatFirestoreDateTime(value) {
  if (!value) return '—'
  if (typeof value === 'string') return new Date(value).toLocaleString()
  if (value?.seconds) return new Date(value.seconds * 1000).toLocaleString()
  return '—'
}

onMounted(async () => {
  await loadSelectedItem()
  await fetchAttachments()
})
</script>
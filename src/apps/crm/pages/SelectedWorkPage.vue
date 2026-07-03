<template>
  <CrmPageShell
    title="Listed Work"
    description="Manage posted work, review assignment status, and access attachments only after consultant acceptance."
  >
    <template #actions>
      <RouterLink
        v-if="canSubmitCompletedWork"
        :to="`/crm/submit/${route.params.id}/final_d`"
        class="btn-primary"
      >
        {{ reviewStatus === 'rejected' ? 'Resubmit Completed Work' : 'Submit Completed Work' }}
      </RouterLink>
    </template>

    <section
      v-if="selectedItem && !isPageLoading"
      class="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]"
    >
      <article class="card relative min-w-0 overflow-hidden p-0">
        <div class="absolute inset-x-6 top-0 h-px bg-brand-gradient opacity-70"></div>

        <div class="min-w-0 space-y-6 p-6 md:p-8">
          <!-- Summary -->
          <section class="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
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

                <span class="badge badge-secondary wrap-safe">
                  Delivery: {{ deliveryStatusLabel }}
                </span>

                <span class="badge badge-secondary wrap-safe">
                  Review: {{ reviewStatusLabel }}
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
          </section>

          <!-- Assignment Response -->
          <section
            v-if="canCurrentUserRespondToAssignment"
            class="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-muted)] p-5"
          >
            <div class="flex min-w-0 flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div class="min-w-0">
                <p class="text-sm font-semibold text-[var(--color-text)] wrap-safe">
                  Consultant assignment response
                </p>
                <p class="text-sm text-muted wrap-safe">
                  Accept to unlock source attachments and confirm ownership, or deny to send it back for reassignment.
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
          </section>

          <!-- Description -->
          <section class="bg-[var(--color-bg-canvas)] p-5">
            <h3 class="text-sm font-semibold text-[var(--color-text)]">Description</h3>
            <p class="mt-1 text-sm text-muted wrap-safe">
              {{ itemData.description || 'No description provided.' }}
            </p>
          </section>

          <!-- Source Attachments -->
          <section class="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-canvas)] p-5">
            <div class="flex min-w-0 items-center justify-between gap-3">
              <div class="min-w-0">
                <h3 class="text-sm font-semibold text-[var(--color-text)]">Source Attachments</h3>
                <p class="mt-1 text-sm text-muted wrap-safe">
                  Work files required by the assigned consultant. Downloads use crm_files only.
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
              v-else-if="!sourceAttachmentsVisible"
              class="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 wrap-safe"
            >
              Source attachments are locked until the assigned consultant accepts this assignment.
            </div>

            <div v-else-if="sourceAttachmentFiles.length" class="mt-4 grid gap-3">
              <article
                v-for="file in sourceAttachmentFiles"
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
                    @click="downloadAttachment(file, {
                      activityAction: 'source_attachment_downloaded',
                      label: 'source attachment'
                    })"
                  >
                    {{ isDownloading(file) ? 'Downloading...' : 'Download' }}
                  </button>
                </div>
              </article>
            </div>

            <div v-else class="mt-4 text-sm text-muted wrap-safe">
              No source attachments found for this work item.
            </div>
          </section>

          <!-- Consultant Final Delivery -->
          <section class="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-canvas)] p-5">
            <div class="flex min-w-0 items-center justify-between gap-3">
              <div class="min-w-0">
                <h3 class="text-sm font-semibold text-[var(--color-text)]">Consultant Final Delivery</h3>
                <p class="mt-1 text-sm text-muted wrap-safe">
                  Submitted final delivery files. Downloads use crm_files only.
                </p>
              </div>

              <span class="badge badge-secondary shrink-0 wrap-safe">
                {{ reviewStatusLabel }}
              </span>
            </div>

            <div
              v-if="reviewStatus === 'rejected'"
              class="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 wrap-safe"
            >
              <p class="font-semibold">Revision required</p>
              <p class="mt-1">
                {{ itemData.reviewRemarks || 'The editor rejected this submission without notes.' }}
              </p>
            </div>

            <div
              v-if="reviewStatus === 'accepted'"
              class="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 wrap-safe"
            >
              Final delivery accepted.
            </div>

            <div v-if="attachmentsLoading" class="mt-4 text-sm text-muted wrap-safe">
              Loading final delivery files...
            </div>

            <div v-else-if="finalDeliveryFiles.length" class="mt-4 grid gap-3">
              <article
                v-for="file in finalDeliveryFiles"
                :key="file.id || file.storagePath || file.url"
                class="relative min-w-0 rounded-2xl border border-[var(--color-border-subtle)] p-4"
              >
                <div class="flex min-w-0 flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div class="min-w-0 flex-1">
                    <p class="break-hard font-semibold text-[var(--color-secondary)]">
                      {{ file.name || file.originalName || 'Unnamed final delivery file' }}
                    </p>

                    <p class="mt-1 wrap-safe text-sm text-[var(--color-text-soft)]">
                      {{ file.category || 'final_delivery' }} · {{ file.fileType || 'unknown' }}
                    </p>

                    <p v-if="file.uploadedByName" class="mt-1 wrap-safe text-xs text-[var(--color-text-soft)]">
                      Uploaded by {{ file.uploadedByName }}
                    </p>
                  </div>

                  <button
                    class="btn-primary btn-sm shrink-0"
                    type="button"
                    :disabled="isDownloading(file)"
                    @click="downloadAttachment(file, {
                      bypassAssignmentLock: true,
                      activityAction: 'final_delivery_file_downloaded',
                      label: 'final delivery file'
                    })"
                  >
                    {{ isDownloading(file) ? 'Downloading...' : 'Download' }}
                  </button>
                </div>
              </article>
            </div>

            <div v-else class="mt-4 text-sm text-muted wrap-safe">
              No final delivery files submitted yet.
            </div>

            <div v-if="canSubmitCompletedWork" class="mt-4">
              <RouterLink
                :to="`/crm/submit/${route.params.id}/final_d`"
                class="btn-primary"
              >
                {{ reviewStatus === 'rejected' ? 'Resubmit Completed Work' : 'Submit Completed Work' }}
              </RouterLink>
            </div>

            <div
              v-if="downloadError"
              class="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 wrap-safe"
            >
              {{ downloadError }}
            </div>
          </section>

          <!-- Review Panel -->
          <section
            v-if="canReviewFinalDelivery && hasFinalDelivery"
            class="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-canvas)] p-5"
          >
            <div class="min-w-0">
              <h3 class="text-sm font-semibold text-[var(--color-text)]">Final Delivery Review</h3>
              <p class="mt-1 text-sm text-muted wrap-safe">
                Accept the consultant submission, or reject it with notes for revision.
              </p>
            </div>

            <label class="mt-4 grid gap-2">
              <span class="field-label mb-0">Review notes</span>
              <textarea
                v-model="reviewRemarks"
                class="textarea-field min-h-[110px]"
                placeholder="Required when rejecting. Optional when accepting."
              />
            </label>

            <div class="mt-4 flex flex-wrap justify-end gap-2">
              <button
                class="btn-outline"
                type="button"
                :disabled="reviewActionLoading"
                @click="handleFinalReview('rejected')"
              >
                {{ reviewActionLoading ? 'Saving...' : 'Reject with notes' }}
              </button>

              <button
                class="btn-primary"
                type="button"
                :disabled="reviewActionLoading"
                @click="handleFinalReview('accepted')"
              >
                {{ reviewActionLoading ? 'Saving...' : 'Accept final delivery' }}
              </button>
            </div>
          </section>

          <!-- Work History -->
          <section
            v-if="visibleFinalUpdates.length || itemData.reviewRespondedAt"
            class="bg-[var(--color-bg-canvas)] p-5"
          >
            <div class="min-w-0">
              <h3 class="text-sm font-semibold text-[var(--color-text)]">Work History</h3>
              <p class="mt-1 text-sm text-muted wrap-safe">
                Submission and review history. Downloadable files are shown only in the crm_files sections above.
              </p>
            </div>

            <div class="mt-4 grid gap-4">
              <article
                v-for="(update, updateIndex) in visibleFinalUpdates"
                :key="update.id || update.createdAt || update.finalSubmittedAt || `final-update-${updateIndex}`"
                class="min-w-0 rounded-2xl border border-[var(--color-border-subtle)] p-4"
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
                    {{ update.fileCount || 0 }} file(s)
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
              </article>

              <article
                v-if="itemData.reviewRespondedAt"
                class="min-w-0 rounded-2xl border border-[var(--color-border-subtle)] p-4"
              >
                <p class="font-semibold text-[var(--color-secondary)] wrap-safe">
                  Review {{ reviewStatusLabel }}
                </p>

                <p class="mt-1 wrap-safe text-sm text-[var(--color-text-soft)]">
                  By {{ itemData.reviewRespondedByName || 'Unknown reviewer' }}
                </p>

                <p class="mt-1 wrap-safe text-xs text-[var(--color-text-soft)]">
                  {{ formatFirestoreDateTime(itemData.reviewRespondedAt) }}
                </p>

                <div v-if="itemData.reviewRemarks" class="mt-3 rounded-2xl bg-[var(--color-bg-muted)] p-3">
                  <p class="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-soft)]">
                    Review notes
                  </p>
                  <p class="mt-2 text-sm text-[var(--color-text)] wrap-safe">
                    {{ itemData.reviewRemarks }}
                  </p>
                </div>
              </article>
            </div>
          </section>
        </div>
      </article>

      <aside class="min-w-0 space-y-5 p-6 md:p-7">
        <section class="card min-w-0">
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
                {{ itemData.consultantName || itemData.assignedConsultantInfo || 'Unassigned' }}
              </dd>
            </div>

            <div class="status-strip min-w-0">
              <dt class="text-muted">Assignment Status</dt>
              <dd class="wrap-safe font-medium text-[var(--color-text)]">
                {{ assignmentStatusLabel }}
              </dd>
            </div>

            <div class="status-strip min-w-0">
              <dt class="text-muted">Delivery Status</dt>
              <dd class="wrap-safe font-medium text-[var(--color-text)]">
                {{ deliveryStatusLabel }}
              </dd>
            </div>

            <div class="status-strip min-w-0">
              <dt class="text-muted">Review Status</dt>
              <dd class="wrap-safe font-medium text-[var(--color-text)]">
                {{ reviewStatusLabel }}
              </dd>
            </div>

            <div class="status-strip min-w-0">
              <dt class="text-muted">Submitted At</dt>
              <dd class="wrap-safe font-medium text-[var(--color-text)]">
                {{ formatFirestoreDateTime(itemData.finalSubmittedAt) }}
              </dd>
            </div>

            <div class="status-strip min-w-0">
              <dt class="text-muted">Reviewed At</dt>
              <dd class="wrap-safe font-medium text-[var(--color-text)]">
                {{ formatFirestoreDateTime(itemData.reviewRespondedAt) }}
              </dd>
            </div>
          </dl>
        </section>

        <section class="card-soft min-w-0" v-if="isAssignedConsultant">
          <div class="min-w-0">
            <span class="field-label text-xs text-italic wrap-safe">
              ~5% deduction if work is rejected by client
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
          </dl>
        </section>

        <section v-if="canViewClientSnapshot" class="card min-w-0">
  <div class="min-w-0">
    <p class="section-label">Client Snapshot</p>
    <h3 class="text-lg font-semibold text-[var(--color-text)] wrap-safe">
      Client details
    </h3>
  </div>

  <dl class="space-y-4 text-sm">
    <div class="status-strip min-w-0">
      <dt class="text-muted">Client</dt>
      <dd class="wrap-safe font-medium text-[var(--color-text)]">
        {{ itemData.clientName || '—' }}
      </dd>
    </div>

    <div class="status-strip min-w-0">
      <dt class="text-muted">Institution</dt>
      <dd class="wrap-safe font-medium text-[var(--color-text)]">
        {{ itemData.institutionName || '—' }}
      </dd>
    </div>

    <div class="status-strip min-w-0">
      <dt class="text-muted">Email</dt>
      <dd class="break-hard font-medium text-[var(--color-text)]">
        {{ itemData.clientEmail || '—' }}
      </dd>
    </div>

    <div class="status-strip min-w-0">
      <dt class="text-muted">Phone</dt>
      <dd class="break-hard font-medium text-[var(--color-text)]">
        {{ itemData.clientPhone || '—' }}
      </dd>
    </div>
  </dl>
</section>
      </aside>
    </section>

    <section v-else-if="isPageLoading" class="card overflow-hidden p-0">
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

<script setup>
/**
 * @file SelectedWorkPage.vue
 * @description Work detail page.
 *
 * Download rule:
 * - crm_files is the only downloadable file source.
 * - engagement.files, engagement.finalFiles, and finalUpdates.files are legacy snapshots only.
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
import { useCrmService } from '../services/crmService.js'

const route = useRoute()
const store = useAppStore()
const confirmModal = inject('CONFIRM_MODAL_STORE_KEY', null)
const { service } = useCrmService()

const selectedItem = ref(null)
const attachments = ref([])

const isPageLoading = ref(false)
const attachmentsLoading = ref(false)
const assignmentActionLoading = ref(false)
const reviewActionLoading = ref(false)
const downloadingIds = ref([])

const downloadError = ref('')
const reviewRemarks = ref('')

const { id } = route.params

const currentUser = computed(() => unref(store.currentUser) || null)
const currentUserId = computed(() => currentUser.value?.uid || currentUser.value?.id || null)

const itemData = computed(() => recordData(selectedItem.value))

const assignmentStatus = computed(() => normalizeKey(itemData.value.assignmentStatus || 'pending'))
const deliveryStatus = computed(() => normalizeKey(itemData.value.deliveryStatus || 'pending'))
const reviewStatus = computed(() => normalizeKey(itemData.value.reviewStatus || 'pending'))

const canViewClientSnapshot = computed(() => {
  return hasAnyRole(['admin', 'receptionist'])
})
const assignmentStatusLabel = computed(() => {
  if (assignmentStatus.value === 'accepted') return 'Accepted'
  if (assignmentStatus.value === 'denied') return 'Denied'
  if (assignmentStatus.value === 'unassigned') return 'Unassigned'
  return 'Pending'
})

const deliveryStatusLabel = computed(() => {
  if (deliveryStatus.value === 'submitted') return 'Submitted'
  if (deliveryStatus.value === 'delivered') return 'Delivered'
  if (deliveryStatus.value === 'working') return 'Working'
  return 'Pending'
})

const reviewStatusLabel = computed(() => {
  if (reviewStatus.value === 'accepted') return 'Accepted'
  if (reviewStatus.value === 'rejected') return 'Rejected'
  return 'Pending Review'
})

const isAssignedConsultant = computed(() => {
  return Boolean(
    currentUserId.value &&
      itemData.value.assignedConsultantId &&
      hasAnyRole(['consultant']) &&
      (
        currentUserId.value === itemData.value.assignedConsultantId ||
        currentUserId.value === itemData.value.assignmentRespondedBy
      ),
  )
})

const canCurrentUserRespondToAssignment = computed(() => {
  return Boolean(
    currentUserId.value &&
      itemData.value.assignedConsultantId &&
      currentUserId.value === itemData.value.assignedConsultantId &&
      assignmentStatus.value !== 'accepted',
  )
})

const canReviewFinalDelivery = computed(() => {
  return hasAnyRole([
    'admin',
    'editor',
    'senior_consultant',
    'senior-consultant',
  ])
})

const canViewAllFinalUpdates = computed(() => canReviewFinalDelivery.value)

const sourceAttachmentsVisible = computed(() => {
  return Boolean(
    canReviewFinalDelivery.value ||
      (
        isAssignedConsultant.value &&
        assignmentStatus.value === 'accepted'
      ),
  )
})

const downloadableFiles = computed(() => {
  return attachments.value.filter(hasDownloadTarget)
})

const sourceAttachmentFiles = computed(() => {
  return downloadableFiles.value.filter((file) => {
    const category = normalizeKey(file.category)
    const visibility = normalizeKey(file.visibility)

    return category !== 'final_delivery' && visibility !== 'consultant_submission'
  })
})

const finalDeliveryFiles = computed(() => {
  return downloadableFiles.value.filter((file) => {
    const category = normalizeKey(file.category)
    const visibility = normalizeKey(file.visibility)

    return category === 'final_delivery' || visibility === 'consultant_submission'
  })
})

const hasFinalDelivery = computed(() => {
  return Boolean(
    finalDeliveryFiles.value.length ||
      Number(itemData.value.finalAttachmentsCount || 0) > 0 ||
      itemData.value.finalSubmittedAt,
  )
})

const canSubmitCompletedWork = computed(() => {
  return Boolean(
    isAssignedConsultant.value &&
      assignmentStatus.value === 'accepted' &&
      reviewStatus.value !== 'accepted' &&
      (
        !hasFinalDelivery.value ||
        reviewStatus.value === 'rejected'
      ),
  )
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
            fileCount: Array.isArray(itemData.value?.finalFiles)
              ? itemData.value.finalFiles.length
              : Number(itemData.value.finalAttachmentsCount || 0),
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
        fileCount: Array.isArray(entry?.files) ? entry.files.length : 0,
      }))
    : []

  return multipleUpdates.length ? multipleUpdates : singleFinalUpdate
})

const visibleFinalUpdates = computed(() => {
  if (canViewAllFinalUpdates.value) return normalizedFinalUpdates.value

  if (hasAnyRole(['consultant'])) {
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

function normalizeKey(value) {
  return String(value || '').trim().toLowerCase()
}

function hasAnyRole(roles = []) {
  const normalizedRoles = roles.map(normalizeKey)
  const userRole = normalizeKey(currentUser.value?.role || currentUser.value?.data?.role)

  if (normalizedRoles.includes(userRole)) return true

  return normalizedRoles.some((role) => store.hasRole?.(role) === true)
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

function recordData(record) {
  if (!record || typeof record !== 'object') return {}
  return record.data && typeof record.data === 'object' ? record.data : record
}

function getRecordId(record) {
  return record?.id || record?.docId || record?._id || ''
}

function getSelectedEngagementId() {
  return getRecordId(selectedItem.value) || String(id || '')
}

function hasDownloadTarget(file) {
  return Boolean(
    file &&
      typeof file === 'object' &&
      (
        file.storagePath ||
        file.url ||
        file.downloadURL ||
        file.downloadUrl ||
        file.fileUrl ||
        file.fileURL
      ),
  )
}

function resolveDownloadId(file) {
  return [
    file?.id,
    file?.storagePath,
    file?.url,
    file?.downloadURL,
    file?.downloadUrl,
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

function resolveDownloadName(file) {
  return (
    file?.originalName ||
    file?.name ||
    file?.safeName ||
    'attachment'
  )
}

async function resolveFileDownloadUrl(file) {
  if (!file || typeof file !== 'object') {
    throw new Error('Invalid file record.')
  }

  if (file.storagePath) {
    const fileRef = storageRef(resolveStorage(), file.storagePath)
    return await getDownloadURL(fileRef)
  }

  const directUrl =
    file.url ||
    file.downloadURL ||
    file.downloadUrl ||
    file.fileUrl ||
    file.fileURL ||
    ''

  if (!directUrl) {
    throw new Error('This file has no download URL or storage path.')
  }

  return directUrl
}

function getActorName() {
  return (
    currentUser.value?.displayName ||
    [currentUser.value?.firstName, currentUser.value?.lastName].filter(Boolean).join(' ') ||
    currentUser.value?.email ||
    'Unknown user'
  )
}

async function loadSelectedItem() {
  isPageLoading.value = true

  try {
    selectedItem.value = await store.engagementsActions.getById(id)
    reviewRemarks.value = itemData.value.reviewRemarks || ''
  } catch {
    selectedItem.value = null
  } finally {
    isPageLoading.value = false
  }
}

async function fetchAttachments() {
  const engagementId = getSelectedEngagementId()

  if (!engagementId) {
    attachments.value = []
    return
  }

  attachmentsLoading.value = true
  downloadError.value = ''

  try {
    const crmFilesActions = requireCollectionActions('crm_files')

    let rows = []

    if (typeof crmFilesActions.fetchByFilters === 'function') {
      const result = await crmFilesActions.fetchByFilters({
        filters: {
          engagementId,
        },
      })

      rows = Array.isArray(result?.items)
        ? result.items
        : Array.isArray(result)
          ? result
          : crmFilesActions.state?.items || []
    } else {
      rows = Array.isArray(crmFilesActions?.state?.items)
        ? crmFilesActions.state.items
        : []
    }

    attachments.value = rows
      .map((entry) => ({ id: getRecordId(entry), ...recordData(entry) }))
      .filter((entry) => {
        return (
          entry.engagementId === engagementId &&
          entry.isDeleted !== true
        )
      })
  } catch (error) {
    attachments.value = []
    downloadError.value = error?.message || 'Failed to load files.'
  } finally {
    attachmentsLoading.value = false
  }
}

async function refreshAttachments() {
  await fetchAttachments()
}

async function handleAssignmentDecision(decision) {
  const engagementId = getSelectedEngagementId()

  if (!engagementId || !currentUserId.value) return

  const approved = await openDecisionModal(decision)
  if (!approved) return

  assignmentActionLoading.value = true

  try {
    const engagementsActions = requireCollectionActions('engagements')

    const assignmentRespondedAt = new Date().toISOString()
    const assignmentRespondedByName = getActorName()

    await engagementsActions.update(engagementId, {
      assignmentStatus: decision,
      assignmentRespondedAt,
      assignmentRespondedBy: currentUserId.value,
      assignmentRespondedByName,
      notificationFeedStatus: 'queued',
    })

    await service.syncAssignmentDecisionNotification?.({
      id: engagementId,
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

async function openDecisionModal(decision) {
  const title =
    decision === 'accepted' ? 'Accept assignment?' : 'Deny assignment?'
  const message =
    decision === 'accepted'
      ? 'Accepting will unlock source attachments for this assignment and confirm you as the owner.'
      : 'Denying will keep source attachments locked and mark this assignment for reassignment.'

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

async function openReviewModal(decision) {
  const isAccept = decision === 'accepted'

  const title = isAccept ? 'Accept final delivery?' : 'Reject final delivery?'
  const message = isAccept
    ? 'This will mark the consultant final delivery as accepted.'
    : 'This will reject the consultant final delivery and send it back for revision.'

  if (confirmModal?.open) {
    return await confirmModal.open({
      title,
      message,
      confirmText: isAccept ? 'Accept' : 'Reject',
      cancelText: 'Cancel',
      tone: isAccept ? 'primary' : 'danger',
    })
  }

  return window.confirm(message)
}

async function handleFinalReview(decision) {
  const engagementId = getSelectedEngagementId()

  if (!engagementId || !currentUserId.value || !canReviewFinalDelivery.value) return

  const nextReviewStatus = decision === 'accepted' ? 'accepted' : 'rejected'
  const notes = String(reviewRemarks.value || '').trim()

  if (nextReviewStatus === 'rejected' && !notes) {
    downloadError.value = 'Review notes are required when rejecting final delivery.'
    return
  }

  const approved = await openReviewModal(nextReviewStatus)
  if (!approved) return

  reviewActionLoading.value = true
  downloadError.value = ''

  try {
    const engagementsActions = requireCollectionActions('engagements')
    const reviewRespondedAt = new Date().toISOString()
    const reviewRespondedByName = getActorName()

    await engagementsActions.update(engagementId, {
      reviewStatus: nextReviewStatus,
      reviewRemarks: notes || null,
      reviewRespondedAt,
      reviewRespondedBy: currentUserId.value,
      reviewRespondedByName,
      deliveryStatus: nextReviewStatus === 'accepted' ? 'delivered' : 'submitted',
      notificationFeedStatus: 'queued',
    })

    await logEngagementActivity({
      action: nextReviewStatus === 'accepted'
        ? 'final_delivery_accepted'
        : 'final_delivery_rejected',
      message: nextReviewStatus === 'accepted'
        ? 'Final delivery was accepted.'
        : `Final delivery was rejected.${notes ? ` Notes: ${notes}` : ''}`,
      fileId: null,
    })

    await loadSelectedItem()
    await fetchAttachments()
  } catch (error) {
    downloadError.value = error?.message || 'Failed to update final delivery review.'
  } finally {
    reviewActionLoading.value = false
  }
}

async function logEngagementActivity({ action, message, fileId = null }) {
  try {
    const activityActions = requireCollectionActions('engagement_activity')

    await activityActions.add({
      engagementId: getSelectedEngagementId(),
      clientId: itemData.value.clientId || null,
      fileId,
      action,
      message,
      actorId: currentUserId.value || null,
      actorName: getActorName(),
      createdAtIso: new Date().toISOString(),
    })
  } catch {
    // Activity logging is best-effort only.
  }
}

async function downloadAttachment(file, options = {}) {
  const bypassAssignmentLock = options.bypassAssignmentLock === true

  downloadError.value = ''

  if (!bypassAssignmentLock && !sourceAttachmentsVisible.value) {
    downloadError.value = 'Source attachments are locked until this assignment is accepted.'
    return
  }

  const fileId = resolveDownloadId(file)

  if (!fileId) {
    downloadError.value = 'Invalid file record. Missing file id, URL, or storage path.'
    return
  }

  if (downloadingIds.value.includes(fileId)) return

  downloadingIds.value = [...downloadingIds.value, fileId]

  try {
    const downloadUrl = await resolveFileDownloadUrl(file)
    const fileName = resolveDownloadName(file)

    const anchor = document.createElement('a')
    anchor.href = downloadUrl
    anchor.download = fileName
    anchor.rel = 'noopener noreferrer'
    anchor.target = '_blank'

    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()

    await logEngagementActivity({
      action: options.activityAction || 'attachment_downloaded',
      message: `Downloaded ${options.label || 'attachment'}: ${fileName}.`,
      fileId: file?.id || file?.storagePath || null,
    })
  } catch (error) {
    downloadError.value = error?.message || 'Failed to download file.'
    console.error('File download failed:', error?.message || error)
  } finally {
    downloadingIds.value = downloadingIds.value.filter((entry) => entry !== fileId)
  }
}

function formatFirestoreDateTime(value) {
  if (!value) return '—'
  if (typeof value === 'string') return new Date(value).toLocaleString()
  if (value?.seconds) return new Date(value.seconds * 1000).toLocaleString()
  if (value?.type === 'firestore/timestamp/1.0' && value?.seconds) {
    return new Date(value.seconds * 1000).toLocaleString()
  }
  return '—'
}

onMounted(async () => {
  await loadSelectedItem()
  await fetchAttachments()
})
</script>

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
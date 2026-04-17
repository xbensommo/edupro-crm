<template>
  <CrmPageShell
    title="Add Engagement"
    description="Create client work, assign ownership, set delivery dates, and store finance-ready engagement values."
  >
    <template #actions>
      <div class="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-end">
        <div class="flex flex-wrap items-center gap-2">
          <span class="badge">{{ sourceLabel }}</span>
          <span class="badge" :class="{ 'opacity-70': !form.clientId }">
            {{ selectedClientLabel || 'No client selected' }}
          </span>
          <span v-if="currentUserId" class="badge">Actor: {{ currentUserId }}</span>
        </div>
      </div>
    </template>

    <section class="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_380px]">
      <form class="card-soft grid gap-6" @submit.prevent="submitEngagement">
        <section class="grid gap-4">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.24em] text-[var(--color-primary)]">
                Source Context
              </p>
              <h3 class="font-serif text-2xl text-[var(--color-secondary)]">
                Engagement Details
              </h3>
            </div>

            <button class="btn-outline btn-sm" type="button" @click="regenerateCode">
              Regenerate code
            </button>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <label class="grid gap-2">
              <span class="field-label mb-0">Engagement code</span>
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
            <h3 class="font-serif text-2xl text-[var(--color-secondary)]">
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

          <div class="rounded-2xl border border-[var(--color-border-subtle)] bg-white/70">
            <div
              v-if="filteredClients.length"
              class="max-h-64 divide-y divide-[var(--color-border-subtle)] overflow-auto"
            >
              <button
                v-for="client in filteredClients"
                :key="getRecordId(client)"
                type="button"
                class="flex w-full items-start justify-between gap-4 px-4 py-3 text-left transition hover:bg-[var(--color-primary)]/5"
                :class="{
                  'bg-[var(--color-primary)]/8': form.clientId === getRecordId(client),
                }"
                @click="selectClient(client)"
              >
                <div class="min-w-0">
                  <p class="font-semibold text-[var(--color-secondary)]">
                    {{ clientPrimaryLabel(client) }}
                  </p>
                  <p class="text-sm text-[var(--color-text-soft)]">
                    {{ clientSecondaryLabel(client) }}
                  </p>
                </div>

                <span class="badge shrink-0">
                  {{ client.clientNumber || getRecordId(client) }}
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
                  {{ selectedClient?.institutionName || '—' }}
                </p>
              </div>

              <div>
                <p class="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--color-text-soft)]">
                  Contact
                </p>
                <p class="mt-1 text-sm text-[var(--color-text)]">
                  {{ selectedClient?.email || selectedClient?.phone || '—' }}
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
            <h3 class="font-serif text-2xl text-[var(--color-secondary)]">
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
                <option value="application">Application</option>
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
            <h3 class="font-serif text-2xl text-[var(--color-secondary)]">
              Assignment and delivery window
            </h3>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <label class="grid gap-2">
              <span class="field-label mb-0">Assigned consultant ID</span>
              <input
                v-model="form.assignedConsultantId"
                class="input-field"
                placeholder="uid / consultant reference"
              />
            </label>

            <label class="grid gap-2">
              <span class="field-label mb-0">Assigned team</span>
              <input
                v-model="form.assignedTeam"
                class="input-field"
                placeholder="Admissions / Writing / Admin"
              />
            </label>

            <label class="grid gap-2">
              <span class="field-label mb-0">Start date</span>
              <input v-model="form.startDate" class="input-field" type="date" />
            </label>

            <label class="grid gap-2">
              <span class="field-label mb-0">Due date</span>
              <input v-model="form.dueDate" class="input-field" type="date" />
            </label>
          </div>
        </section>

        <section class="grid gap-4">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.24em] text-[var(--color-primary)]">
              Finance Snapshot
            </p>
            <h3 class="font-serif text-2xl text-[var(--color-secondary)]">
              Cache the values now
            </h3>
          </div>

          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label class="grid gap-2">
              <span class="field-label mb-0">Quoted amount</span>
              <input v-model="form.quotedAmount" class="input-field" inputmode="decimal" />
            </label>

            <label class="grid gap-2">
              <span class="field-label mb-0">Discount</span>
              <input v-model="form.discountAmount" class="input-field" inputmode="decimal" />
            </label>

            <label class="grid gap-2">
              <span class="field-label mb-0">Paid</span>
              <input v-model="form.amountPaidCached" class="input-field" inputmode="decimal" />
            </label>

            <label class="grid gap-2">
              <span class="field-label mb-0">Refunded</span>
              <input v-model="form.amountRefundedCached" class="input-field" inputmode="decimal" />
            </label>

            <label class="grid gap-2">
              <span class="field-label mb-0">Currency</span>
              <select v-model="form.currency" class="select-field">
                <option value="NAD">NAD</option>
                <option value="USD">USD</option>
                <option value="ZAR">ZAR</option>
              </select>
            </label>

            <label class="grid gap-2">
              <span class="field-label mb-0">Share rule</span>
              <input
                v-model="form.shareRuleId"
                class="input-field"
                placeholder="optional rule reference"
              />
            </label>

            <div class="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-soft)] p-4">
              <p class="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--color-text-soft)]">
                Net amount
              </p>
              <p class="mt-2 text-xl font-semibold text-[var(--color-secondary)]">
                {{ money(netAmount) }}
              </p>
            </div>

            <div class="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-soft)] p-4">
              <p class="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--color-text-soft)]">
                Amount due
              </p>
              <p class="mt-2 text-xl font-semibold text-[var(--color-secondary)]">
                {{ money(amountDue) }}
              </p>
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div class="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-soft)] p-4">
              <p class="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--color-text-soft)]">
                Consultant share (60%)
              </p>
              <p class="mt-2 text-lg font-semibold text-[var(--color-secondary)]">
                {{ money(consultantShare) }}
              </p>
            </div>

            <div class="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-soft)] p-4">
              <p class="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--color-text-soft)]">
                Company share (40%)
              </p>
              <p class="mt-2 text-lg font-semibold text-[var(--color-secondary)]">
                {{ money(companyShare) }}
              </p>
            </div>
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
            {{ submitting ? 'Saving...' : 'Save engagement' }}
          </button>
        </div>
      </form>

      <aside class="grid gap-6">
        <section class="card-soft grid gap-4">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.24em] text-[var(--color-primary)]">
              Quick Summary
            </p>
            <h3 class="font-serif text-2xl text-[var(--color-secondary)]">
              Before save
            </h3>
          </div>

          <div class="grid gap-3">
            <div class="rounded-2xl border border-[var(--color-border-subtle)] p-4">
              <p class="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--color-text-soft)]">
                Client
              </p>
              <p class="mt-2 font-semibold text-[var(--color-secondary)]">
                {{ selectedClientLabel || 'Select a client' }}
              </p>
            </div>

            <div class="rounded-2xl border border-[var(--color-border-subtle)] p-4">
              <p class="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--color-text-soft)]">
                Service
              </p>
              <p class="mt-2 font-semibold text-[var(--color-secondary)]">
                {{ form.serviceType || 'Not selected' }}
              </p>
            </div>

            <div class="rounded-2xl border border-[var(--color-border-subtle)] p-4">
              <p class="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--color-text-soft)]">
                Due date
              </p>
              <p class="mt-2 font-semibold text-[var(--color-secondary)]">
                {{ formatDate(form.dueDate) }}
              </p>
            </div>

            <div class="rounded-2xl border border-[var(--color-border-subtle)] p-4">
              <p class="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--color-text-soft)]">
                Owner
              </p>
              <p class="mt-2 font-semibold text-[var(--color-secondary)]">
                {{ form.assignedConsultantId || currentUserId || 'Unassigned' }}
              </p>
            </div>
          </div>
        </section>

        <section class="card-soft grid gap-4">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.24em] text-[var(--color-primary)]">
                Recent Client Work
              </p>
              <h3 class="font-serif text-2xl text-[var(--color-secondary)]">
                Latest engagements
              </h3>
            </div>

            <button class="btn-outline btn-sm" type="button" @click="loadRecentEngagements">
              Refresh
            </button>
          </div>

          <div
            v-if="recentEngagements.length"
            class="grid gap-3"
          >
            <article
              v-for="row in recentEngagements.slice(0, 5)"
              :key="row.id || row.engagementCode"
              class="rounded-2xl border border-[var(--color-border-subtle)] p-4"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="font-semibold text-[var(--color-secondary)]">
                    {{ row.title || 'Untitled engagement' }}
                  </p>
                  <p class="text-sm text-[var(--color-text-soft)]">
                    {{ row.engagementCode || '—' }} · {{ row.serviceType || '—' }}
                  </p>
                </div>
                <span class="badge">{{ row.status || 'draft' }}</span>
              </div>

              <div class="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-soft)]">
                <span>Due: {{ formatDate(row.dueDate) }}</span>
                <span>•</span>
                <span>Due amount: {{ money(row.amountDueCached) }}</span>
              </div>
            </article>
          </div>

          <div
            v-else
            class="rounded-2xl border border-dashed border-[var(--color-border-subtle)] px-4 py-6 text-sm text-[var(--color-text-soft)]"
          >
            No engagements found for this client yet.
          </div>
        </section>
      </aside>
    </section>

    <section class="card mt-6 p-0 overflow-hidden">
      <CrmDataTable
        :columns="columns"
        :rows="recentEngagements"
        empty-text="No engagements logged yet for this client."
      >
        <template #cell-status="{ row }">
          <span class="badge">{{ row.status || 'draft' }}</span>
        </template>

        <template #cell-dueDate="{ row }">
          {{ formatDate(row.dueDate) }}
        </template>

        <template #cell-amountDueCached="{ row }">
          {{ money(row.amountDueCached) }}
        </template>
      </CrmDataTable>
    </section>
  </CrmPageShell>
</template>

<script setup>
import { computed, onMounted, reactive, ref, unref } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@app/stores/appStore/index.js'
import CrmDataTable from '../components/CrmDataTable.vue'
import CrmPageShell from '../components/CrmPageShell.vue'

const route = useRoute()
const store = useAppStore()

const loading = ref(false)
const submitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const clientQuery = ref('')
const recentEngagements = ref([])
const clients = ref([])

const currentUser = computed(() => unref(store.currentUser) || null)
const currentUserId = computed(() => currentUser.value?.uid || currentUser.value?.id || null)

const columns = [
  { key: 'engagementCode', label: 'Code' },
  { key: 'title', label: 'Work' },
  { key: 'serviceType', label: 'Service' },
  { key: 'status', label: 'Status' },
  { key: 'dueDate', label: 'Due' },
  { key: 'assignedConsultantId', label: 'Consultant' },
  { key: 'amountDueCached', label: 'Amount due' },
]

const form = reactive({
  engagementCode: createEngagementCode(),
  clientId: '',
  title: '',
  serviceType: '',
  description: '',
  studyLevel: '',
  institutionName: '',
  assignedConsultantId: '',
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

const sourceLabel = computed(() => {
  const source = String(route.query.from || route.query.source || '').trim()

  if (source === 'crm') return 'Opened from CRM'
  if (source === 'client-records') return 'Opened from Client Records'
  return 'Standalone entry'
})

const selectedClient = computed(() =>
  clients.value.find((entry) => getRecordId(entry) === form.clientId) || null,
)

const selectedClientLabel = computed(() => {
  const client = selectedClient.value
  return client ? clientPrimaryLabel(client) : ''
})

const filteredClients = computed(() => {
  const query = clientQuery.value.trim().toLowerCase()

  if (!query) return clients.value.slice(0, 24)

  return clients.value
    .filter((client) => {
      const haystack = [
        client.clientNumber,
        client.firstName,
        client.lastName,
        client.email,
        client.phone,
        client.institutionName,
        client.fieldOfStudy,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(query)
    })
    .slice(0, 24)
})

const quotedAmountValue = computed(() => asMoney(form.quotedAmount))
const discountAmountValue = computed(() => asMoney(form.discountAmount))
const amountPaidValue = computed(() => asMoney(form.amountPaidCached))
const amountRefundedValue = computed(() => asMoney(form.amountRefundedCached))

const netAmount = computed(() =>
  Math.max(quotedAmountValue.value - discountAmountValue.value, 0),
)

const amountDue = computed(() =>
  Math.max(netAmount.value - amountPaidValue.value + amountRefundedValue.value, 0),
)

const consultantShare = computed(() => roundMoney(netAmount.value * 0.6))
const companyShare = computed(() => roundMoney(netAmount.value * 0.4))

const canSubmit = computed(() => {
  return Boolean(
    currentUserId.value &&
      form.clientId &&
      String(form.title).trim() &&
      String(form.serviceType).trim(),
  )
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

function getCollectionItems(name) {
  const collectionState = unref(store[name]) || store[name]

  if (Array.isArray(collectionState?.items)) return collectionState.items
  if (Array.isArray(collectionState?.value?.items)) return collectionState.value.items
  return []
}

function getRecordId(value) {
  return value?.id || value?.docId || value?._id || ''
}

function clientPrimaryLabel(client) {
  const fullName = [client?.firstName, client?.lastName].filter(Boolean).join(' ').trim()
  return client?.institutionName || fullName || client?.email || 'Unnamed client'
}

function clientSecondaryLabel(client) {
  return [
    client?.clientNumber,
    client?.email,
    client?.phone,
    client?.fieldOfStudy,
  ]
    .filter(Boolean)
    .join(' · ')
}

function asMoney(value) {
  const normalized = Number(value || 0)
  return Number.isFinite(normalized) ? normalized : 0
}

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100
}

function money(value) {
  const amount = Number(value || 0)
  return `${form.currency || 'NAD'} ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatDate(value) {
  if (!value) return '—'
  const parsed = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(parsed.getTime())) return '—'
  return parsed.toLocaleDateString()
}

function createEngagementCode() {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `ENG-${stamp}-${random}`
}

function regenerateCode() {
  form.engagementCode = createEngagementCode()
}

function toDateOrNull(value) {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function toTextOrNull(value) {
  const text = String(value || '').trim()
  return text || null
}

function selectClient(client) {
  form.clientId = getRecordId(client)

  if (!form.institutionName && client?.institutionName) {
    form.institutionName = client.institutionName
  }

  successMessage.value = ''
  errorMessage.value = ''
  loadRecentEngagements()
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

async function loadClients() {
  loading.value = true
  errorMessage.value = ''

  try {
    const clientsActions = requireCollectionActions('clients')

    await clientsActions.fetchInitialPage({
      pageSize: 100,
      sortBy: 'updatedAt',
      sortDirection: 'desc',
    })

    clients.value = getCollectionItems('clients')

    if (form.clientId && !selectedClient.value) {
      const matched = clients.value.find((entry) => getRecordId(entry) === form.clientId)
      if (matched) selectClient(matched)
    }
  } catch (error) {
    errorMessage.value = error?.message || 'Failed to load clients.'
  } finally {
    loading.value = false
  }
}

async function loadRecentEngagements() {
  if (!form.clientId) {
    recentEngagements.value = []
    return
  }

  try {
    const engagementsActions = requireCollectionActions('engagements')

    await engagementsActions.fetchInitialPage({
      pageSize: 20,
      sortBy: 'createdAt',
      sortDirection: 'desc',
      filters: { clientId: form.clientId },
    })

    recentEngagements.value = getCollectionItems('engagements').filter(
      (entry) => entry?.clientId === form.clientId,
    )
  } catch (error) {
    errorMessage.value = error?.message || 'Failed to load engagements.'
  }
}

function buildPayload() {
  return {
    engagementCode: String(form.engagementCode).trim(),
    clientId: String(form.clientId).trim(),
    title: String(form.title).trim(),
    serviceType: String(form.serviceType).trim(),
    description: toTextOrNull(form.description),
    studyLevel: toTextOrNull(form.studyLevel),
    institutionName: toTextOrNull(form.institutionName),
    assignedConsultantId: toTextOrNull(form.assignedConsultantId),
    assignedTeam: toTextOrNull(form.assignedTeam),
    priority: form.priority || 'medium',
    status: form.status || 'draft',
    deliveryStatus: form.deliveryStatus || 'pending',
    satisfactionStatus: form.satisfactionStatus || 'pending',
    quotedAmount: quotedAmountValue.value,
    discountAmount: discountAmountValue.value,
    netAmount: netAmount.value,
    currency: form.currency || 'NAD',
    shareRuleId: toTextOrNull(form.shareRuleId),
    amountPaidCached: amountPaidValue.value,
    amountRefundedCached: amountRefundedValue.value,
    amountDueCached: amountDue.value,
    consultantShareAmountCached: consultantShare.value,
    companyShareAmountCached: companyShare.value,
    startDate: toDateOrNull(form.startDate),
    dueDate: toDateOrNull(form.dueDate),
    remarks: toTextOrNull(form.remarks),
    createdBy: currentUserId.value || null,
  }
}

function resetForm(keepClient = false) {
  const rememberedClientId = form.clientId
  const rememberedInstitutionName = form.institutionName
  const rememberedConsultantId = form.assignedConsultantId || currentUserId.value || ''

  form.engagementCode = createEngagementCode()
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

  successMessage.value = ''
  errorMessage.value = ''
}

async function submitEngagement() {
  submitting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    if (!canSubmit.value) {
      throw new Error('Client, title, service type, and authentication are required.')
    }

    const engagementsActions = requireCollectionActions('engagements')
    const payload = buildPayload()

    await engagementsActions.add(payload)

    successMessage.value = `Engagement ${payload.engagementCode} saved successfully.`
    await loadRecentEngagements()
    resetForm(true)
  } catch (error) {
    errorMessage.value = error?.message || 'Failed to save engagement.'
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  prefillFromRoute()
  await loadClients()
  await loadRecentEngagements()
})
</script>
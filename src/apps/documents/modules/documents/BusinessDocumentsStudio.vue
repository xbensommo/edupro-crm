<template>
  <div class="app-content">
    <div class="page-wrap space-y-4 md:space-y-6">
      <header class="page-header">
        <div class="min-w-0">
          <span class="section-label">{{ badgeLabel }}</span>
          <h1 class="page-title mt-3">{{ title }}</h1>
          <p class="page-subtitle mt-2">
            {{ subtitle }}
          </p>
        </div>

        <div class="w-full lg:w-auto">
          <StatusBadge :status="normalizedDocument.meta.status" />
        </div>
      </header>

      <div class="grid gap-4 xl:grid-cols-[minmax(0,28rem)_minmax(0,1fr)_20rem]">
        <!-- Editor -->
        <aside class="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <section class="hero-panel">
            <div class="flex flex-col gap-4">
              <div class="min-w-0">
                <p class="text-caption">Studio overview</p>
                <h2 class="section-title mt-2">
                  {{ definition?.label || 'Unknown document' }}
                </h2>
                <p class="page-subtitle mt-2">
                  Edit document content using the shared EduPro theme and keep the flow clean on mobile first.
                </p>
              </div>

              <div class="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
                <div class="metric-card p-4">
                  <p class="text-caption">Type</p>
                  <p class="mt-2 text-sm font-semibold text-[var(--color-text)]">
                    {{ definition?.label || 'Unknown' }}
                  </p>
                </div>

                <div class="metric-card p-4">
                  <p class="text-caption">Status</p>
                  <p class="mt-2 text-sm font-semibold text-[var(--color-text)] first-letter:uppercase">
                    {{ normalizedDocument.meta.status }}
                  </p>
                </div>

                <div class="metric-card p-4">
                  <p class="text-caption">Pages</p>
                  <p class="mt-2 text-sm font-semibold text-[var(--color-text)]">
                    {{ pagePlan.pages.length }}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section
            v-if="validationErrors.length"
            class="alert alert-danger"
          >
            <div class="flex items-start gap-3">
              <i class="fa-solid fa-triangle-exclamation mt-0.5"></i>
              <div class="min-w-0">
                <p class="text-xs font-bold uppercase tracking-[0.16em]">
                  Validation issues
                </p>
                <ul class="mt-3 list-disc space-y-1.5 pl-5 text-sm">
                  <li v-for="error in validationErrors" :key="error">{{ error }}</li>
                </ul>
              </div>
            </div>
          </section>

          <section class="card-soft">
            <div class="grid gap-4">
              <label class="block">
                <span class="field-label">Document type</span>
                <select v-model="selectedType" class="select-field">
                  <option
                    v-for="entry in documentDefinitions"
                    :key="entry.id"
                    :value="entry.id"
                  >
                    {{ entry.label }}
                  </option>
                </select>
              </label>
            </div>
          </section>

          <section class="card p-0 overflow-hidden">
            <div class="border-b border-theme px-5 py-4 md:px-6">
              <h3 class="section-title text-lg md:text-xl">Editor</h3>
              <p class="page-subtitle mt-1">
                Update the draft content below.
              </p>
            </div>

            <div class="px-4 py-4 md:px-6 md:py-6">
              <EditorPanels
                :document-draft="documentDraft"
                :definition="definition"
                :normalized-document="normalizedDocument"
                @add-rich-block="addRichBlock"
                @remove-rich-block="removeRichBlock"
                @add-list-item="addListItem"
                @remove-list-item="removeListItem"
                @add-line-item="addLineItem"
                @remove-line-item="removeLineItem"
              />
            </div>
          </section>
        </aside>

        <!-- Preview -->
        <main class="min-w-0">
          <section class="card overflow-hidden">
            <div class="border-b border-theme px-5 py-5 md:px-6">
              <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div class="min-w-0">
                  <p class="text-caption">Live preview</p>
                  <h2 class="section-title mt-2 break-words">
                    {{ normalizedDocument.meta.number || 'Draft' }}
                  </h2>
                  <p class="page-subtitle mt-2 break-words">
                    {{ normalizedDocument.meta.title }}
                  </p>
                </div>

                <div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
                  <button
                    class="btn-primary w-full sm:w-auto"
                    type="button"
                    :disabled="loading"
                    :class="loading ? 'pointer-events-none opacity-70' : ''"
                    @click="generatePdfFile"
                  >
                    <i class="fa-solid fa-file-pdf"></i>
                    {{ loading ? 'Generating PDF...' : 'Generate PDF' }}
                  </button>

                  <button
                    class="btn-secondary w-full sm:w-auto"
                    type="button"
                    @click="handleValidate"
                  >
                    <i class="fa-solid fa-shield-check"></i>
                    Validate
                  </button>
                </div>
              </div>

              <div class="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <div class="card-soft p-4">
                  <p class="text-caption">Sections</p>
                  <p class="mt-2 text-base font-semibold text-[var(--color-text)]">
                    {{ sectionCount }}
                  </p>
                </div>

                <div class="card-soft p-4">
                  <p class="text-caption">Validation</p>
                  <p
                    class="mt-2 text-base font-semibold"
                    :class="validationErrors.length ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]'"
                  >
                    {{ validationErrors.length ? `${validationErrors.length} issue(s)` : 'Ready' }}
                  </p>
                </div>

                <div v-if="showTotalsChip" class="card-soft p-4 sm:col-span-2 xl:col-span-1">
                  <p class="text-caption">Total</p>
                  <p class="mt-2 text-base font-semibold text-[var(--color-text)]">
                    {{ money(normalizedDocument.finance.total) }}
                  </p>
                </div>
              </div>
            </div>

            <div class="bg-surface-2 px-3 py-3 md:px-4 md:py-4">
              <div class="overflow-auto xl:max-h-[calc(100vh-16rem)] rounded-[1.5rem] border border-theme bg-white p-3 md:p-5">
                <DocumentPreview :document="normalizedDocument" :page-plan="pagePlan" />
              </div>
            </div>
          </section>
        </main>

        <!-- Output -->
        <aside class="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <section class="card-dark">
            <p class="text-caption text-white/70">Output</p>
            <h2 class="mt-2 text-xl font-bold tracking-tight text-white">
              Final export
            </h2>
            <p class="mt-2 text-sm leading-6 text-white/70">
              Generate, inspect, open, and download without leaving the studio.
            </p>
          </section>

          <section class="card space-y-3">
            <button
              class="btn-dark w-full"
              type="button"
              :disabled="!pdfUrl"
              :class="!pdfUrl ? 'pointer-events-none opacity-50' : ''"
              @click="openPdfModal"
            >
              <i class="fa-solid fa-expand"></i>
              Preview Final PDF
            </button>

            <button
              class="btn-secondary w-full"
              type="button"
              :disabled="!pdfUrl"
              :class="!pdfUrl ? 'pointer-events-none opacity-50' : ''"
              @click="openPdfInNewTab"
            >
              <i class="fa-solid fa-arrow-up-right-from-square"></i>
              Open in New Tab
            </button>

            <button
              class="btn-secondary w-full"
              type="button"
              :disabled="!pdfUrl"
              :class="!pdfUrl ? 'pointer-events-none opacity-50' : ''"
              @click="downloadPdf"
            >
              <i class="fa-solid fa-file-arrow-down"></i>
              Download PDF
            </button>

            <button
              class="btn-secondary w-full"
              type="button"
              @click="resetCurrentDocument"
            >
              <i class="fa-solid fa-rotate-left"></i>
              Reset Draft
            </button>
          </section>

          <section class="card">
            <div class="space-y-3 text-sm">
              <div class="flex items-center justify-between gap-4">
                <span class="text-muted">Document</span>
                <strong class="text-[var(--color-text)]">{{ normalizedDocument.meta.type }}</strong>
              </div>

              <div class="flex items-center justify-between gap-4">
                <span class="text-muted">Currency</span>
                <strong class="text-[var(--color-text)]">{{ normalizedDocument.meta.currency }}</strong>
              </div>

              <div class="flex items-center justify-between gap-4">
                <span class="text-muted">Pages</span>
                <strong class="text-[var(--color-text)]">{{ pagePlan.pages.length }}</strong>
              </div>

              <div class="flex items-center justify-between gap-4">
                <span class="text-muted">Blocks</span>
                <strong class="text-[var(--color-text)]">{{ sectionCount }}</strong>
              </div>
            </div>
          </section>

          <section class="card-soft">
            <p class="text-caption">Studio notes</p>
            <p class="mt-3 text-sm text-soft">
              Mobile first: stacked panes on small screens, then sticky side panels and independent preview height on desktop.
            </p>
          </section>

          <p
            v-if="error"
            class="alert alert-danger"
          >
            {{ error }}
          </p>

          <p
            v-else-if="exportMessage"
            class="alert alert-success"
          >
            {{ exportMessage }}
          </p>
        </aside>
      </div>
    </div>

    <DocumentPdfModal
      :open="isPdfModalOpen"
      :pdf-url="pdfUrl"
      :title="`${normalizedDocument.meta.title} · ${normalizedDocument.meta.number || 'Draft'}`"
      :file-name="safeFileName"
      @close="isPdfModalOpen = false"
    />
  </div>
</template>


<script setup>
import { computed, onBeforeUnmount, ref } from 'vue';
import StatusBadge from './components/shared/StatusBadge.vue';
import EditorPanels from './components/editor/EditorPanels.vue';
import DocumentPreview from './components/preview/DocumentPreview.vue';
import DocumentPdfModal from './components/PdfModal.vue';
import { useDocumentStudio } from './composables/useDocumentStudio.js';
import { createBusinessDocumentPdfUrl } from './export/createPdfFile.js';
import { formatMoney } from './utils/money.js';

const props = defineProps({
  initialType: {
    type: String,
    default: 'contract',
  },
  definitions: {
    type: Array,
    default: () => [],
  },
  badgeLabel: {
    type: String,
    default: 'DocForge',
  },
  title: {
    type: String,
    default: 'Document Studio',
  },
  subtitle: {
    type: String,
    default: 'Enterprise-style editor with live preview, PDF generation, and clean Totistack integration points.',
  },
});

const {
  documentDefinitions,
  selectedType,
  definition,
  documentDraft,
  normalizedDocument,
  pagePlan,
  validationErrors,
  validate,
  addRichBlock,
  removeRichBlock,
  addListItem,
  removeListItem,
  addLineItem,
  removeLineItem,
  resetCurrentDocument,
} = useDocumentStudio(props.initialType, {
  definitions: props.definitions,
});

const pdfUrl = ref('');
const isPdfModalOpen = ref(false);
const loading = ref(false);
const error = ref('');
const exportMessage = ref('');

const sectionCount = computed(() => pagePlan.value.pages.reduce((sum, page) => sum + (page.sections?.length || 0), 0));
const showTotalsChip = computed(() => ['invoice', 'quotation', 'receipt'].includes(normalizedDocument.value.meta.type));
const safeFileName = computed(() => String(normalizedDocument.value.meta.number || normalizedDocument.value.meta.title || 'document')
  .replace(/[^\w-]+/g, '_')
  .replace(/^_+|_+$/g, '') || 'document');

function handleValidate() {
  validate();
}

async function generatePdfFile() {
  loading.value = true;
  error.value = '';
  exportMessage.value = '';

  try {
    validate();

    if (pdfUrl.value) {
      URL.revokeObjectURL(pdfUrl.value);
      pdfUrl.value = '';
    }

    pdfUrl.value = await createBusinessDocumentPdfUrl({
      document: normalizedDocument.value,
      pagePlan: pagePlan.value,
    });

    exportMessage.value = 'PDF ready.';
    isPdfModalOpen.value = true;
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err);
  } finally {
    loading.value = false;
  }
}

function openPdfModal() {
  if (!pdfUrl.value) return;
  isPdfModalOpen.value = true;
}

function openPdfInNewTab() {
  if (!pdfUrl.value) return;
  window.open(pdfUrl.value, '_blank', 'noopener,noreferrer');
}

function downloadPdf() {
  if (!pdfUrl.value) return;

  const anchor = document.createElement('a');
  anchor.href = pdfUrl.value;
  anchor.download = `${safeFileName.value}.pdf`;
  anchor.click();
}

function money(value) {
  return formatMoney(value, normalizedDocument.value.meta.currency);
}

onBeforeUnmount(() => {
  if (pdfUrl.value) {
    URL.revokeObjectURL(pdfUrl.value);
  }
});
</script>

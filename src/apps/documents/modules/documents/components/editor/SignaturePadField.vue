<template>
  <div class="space-y-4">
    <div class="grid gap-3 md:grid-cols-3">
      <label class="block text-sm">
        <span class="field-label">Mode</span>
        <select :value="modelValue.mode" class="select-field" @change="updateField('mode', $event.target.value)">
          <option value="upload">Upload</option>
          <option value="initials">Initials</option>
          <option value="draw">Draw</option>
        </select>
      </label>

      <label class="block text-sm">
        <span class="field-label">Name</span>
        <input :value="modelValue.name" class="input-field" @input="updateField('name', $event.target.value)" />
      </label>

      <label class="block text-sm">
        <span class="field-label">Title</span>
        <input :value="modelValue.title" class="input-field" @input="updateField('title', $event.target.value)" />
      </label>
    </div>

    <label v-if="modelValue.mode === 'upload'" class="block text-sm">
      <span class="field-label">Upload Signature</span>
      <input type="file" accept="image/*" class="input-field file-upload-field" @change="onFileChange" />
    </label>

    <label v-if="modelValue.mode === 'initials'" class="block text-sm">
      <span class="field-label">Initials</span>
      <input
        :value="modelValue.initials"
        maxlength="8"
        class="input-field"
        @input="updateField('initials', $event.target.value)"
      />
    </label>

    <div v-if="modelValue.mode === 'draw'" class="space-y-3">
      <div class="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          class="btn-secondary btn-sm w-full sm:w-auto"
          @click="openDrawModal"
        >
          <i class="fa-solid fa-pen-nib"></i>
          Open Signature Pad
        </button>

        <button
          v-if="modelValue.drawnDataUrl"
          type="button"
          class="btn-outline btn-sm w-full sm:w-auto"
          @click="clearPad"
        >
          <i class="fa-solid fa-eraser"></i>
          Clear Saved Signature
        </button>
      </div>
    </div>

    <label class="block text-sm">
      <span class="field-label">Signed On</span>
      <input
        :value="modelValue.signedOn"
        type="date"
        class="input-field"
        @input="updateField('signedOn', $event.target.value)"
      />
    </label>

    <div v-if="previewSource" class="card-soft px-4 py-3">
      <img
        v-if="previewSource.startsWith('data:image')"
        :src="previewSource"
        alt="Signature preview"
        class="max-h-16 object-contain"
      />
      <div v-else class="text-base font-semibold text-[var(--color-text)]">{{ previewSource }}</div>
    </div>

    <teleport to="body">
      <div v-if="isModalOpen" class="overlay z-[1000] flex items-center justify-center p-4">
        <div class="modal-panel w-full max-w-3xl p-0">
          <div class="flex items-center justify-between border-b border-theme px-4 py-3">
            <div>
              <p class="text-caption">Capture</p>
              <div class="text-sm font-semibold text-[var(--color-text)]">Draw Signature</div>
            </div>

            <button
              type="button"
              class="btn-secondary btn-sm"
              @click="closeDrawModal"
            >
              Close
            </button>
          </div>

          <div class="space-y-4 p-4">
            <canvas
              ref="canvasRef"
              class="signature-pad"
              @pointerdown="startDraw"
              @pointermove="draw"
              @pointerup="stopDraw"
              @pointercancel="stopDraw"
              @pointerleave="stopDraw"
            ></canvas>

            <div class="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                class="btn-secondary btn-sm w-full sm:w-auto"
                @click="clearCanvasOnly"
              >
                <i class="fa-solid fa-eraser"></i>
                Clear
              </button>

              <button
                type="button"
                class="btn-primary btn-sm w-full sm:w-auto"
                @click="saveAndClose"
              >
                <i class="fa-solid fa-check"></i>
                Save Signature
              </button>
            </div>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { readFileAsDataUrl } from '../../utils/file.js';

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(['update:modelValue']);

const canvasRef = ref(null);
const isModalOpen = ref(false);
const isDrawing = ref(false);
const lastPoint = ref(null);

let resizeObserver = null;

const previewSource = computed(() => {
  if (props.modelValue.mode === 'upload') return props.modelValue.imageUrl || '';
  if (props.modelValue.mode === 'draw') return props.modelValue.drawnDataUrl || '';
  if (props.modelValue.mode === 'initials') return props.modelValue.initials || '';
  return '';
});

function updateField(key, value) {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: value,
  });
}

async function onFileChange(event) {
  const [file] = Array.from(event.target.files || []);
  if (!file) return;
  const dataUrl = await readFileAsDataUrl(file);
  updateField('imageUrl', dataUrl);
}

function getCanvas() {
  return canvasRef.value;
}

function getContext() {
  const canvas = getCanvas();
  return canvas ? canvas.getContext('2d') : null;
}

function setupContext() {
  const ctx = getContext();
  if (!ctx) return;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#1A1A1A';
  ctx.lineWidth = 1.6;
}

function clearCanvasOnly() {
  const canvas = getCanvas();
  const ctx = getContext();
  if (!canvas || !ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function clearPad() {
  clearCanvasOnly();
  updateField('drawnDataUrl', '');
}

function getPoint(event) {
  const canvas = getCanvas();
  if (!canvas) return { x: 0, y: 0 };

  const rect = canvas.getBoundingClientRect();

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function resizeCanvas() {
  const canvas = getCanvas();
  if (!canvas) return;

  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  const cssWidth = Math.max(rect.width, 320);
  const cssHeight = 220;
  const previous = props.modelValue.drawnDataUrl || '';

  canvas.width = Math.floor(cssWidth * ratio);
  canvas.height = Math.floor(cssHeight * ratio);
  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${cssHeight}px`;

  const ctx = getContext();
  if (!ctx) return;

  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  setupContext();

  if (previous) {
    restoreFromDataUrl(previous);
  } else {
    clearCanvasOnly();
  }
}

function restoreFromDataUrl(dataUrl) {
  const canvas = getCanvas();
  const ctx = getContext();
  if (!canvas || !ctx || !dataUrl) return;

  const img = new Image();
  img.onload = () => {
    const rect = canvas.getBoundingClientRect();
    clearCanvasOnly();
    ctx.drawImage(img, 0, 0, rect.width, rect.height);
  };
  img.src = dataUrl;
}

function startDraw(event) {
  const canvas = getCanvas();
  const ctx = getContext();
  if (!canvas || !ctx) return;

  event.preventDefault();
  canvas.setPointerCapture?.(event.pointerId);

  isDrawing.value = true;
  const point = getPoint(event);
  lastPoint.value = point;

  ctx.beginPath();
  ctx.moveTo(point.x, point.y);
}

function draw(event) {
  const ctx = getContext();
  if (!ctx || !isDrawing.value) return;

  event.preventDefault();

  const point = getPoint(event);
  const previous = lastPoint.value || point;
  const midX = (previous.x + point.x) / 2;
  const midY = (previous.y + point.y) / 2;

  ctx.beginPath();
  ctx.moveTo(previous.x, previous.y);
  ctx.quadraticCurveTo(previous.x, previous.y, midX, midY);
  ctx.stroke();

  lastPoint.value = point;
}

function stopDraw(event) {
  const canvas = getCanvas();
  if (!canvas || !isDrawing.value) return;

  event?.preventDefault();
  canvas.releasePointerCapture?.(event.pointerId);

  isDrawing.value = false;
  lastPoint.value = null;
}

function saveDrawing() {
  const canvas = getCanvas();
  if (!canvas) return;
  updateField('drawnDataUrl', canvas.toDataURL('image/png'));
}

async function openDrawModal() {
  isModalOpen.value = true;

  await nextTick();
  resizeCanvas();

  const canvas = getCanvas();
  if (!canvas) return;

  resizeObserver?.disconnect();
  resizeObserver = new ResizeObserver(() => {
    resizeCanvas();
  });
  resizeObserver.observe(canvas);
}

function closeDrawModal() {
  resizeObserver?.disconnect();
  resizeObserver = null;
  isModalOpen.value = false;
}

function saveAndClose() {
  saveDrawing();
  closeDrawModal();
}

watch(
  () => props.modelValue.drawnDataUrl,
  (value) => {
    if (!value || isDrawing.value || !isModalOpen.value) return;
    restoreFromDataUrl(value);
  }
);

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
});
</script>

<style scoped>
.file-upload-field {
  padding-top: 0.45rem;
  padding-bottom: 0.45rem;
}

.file-upload-field::file-selector-button {
  margin-right: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface-2);
  color: var(--color-text);
  padding: 0.55rem 0.9rem;
  font-weight: 600;
}

.signature-pad {
  display: block;
  width: 100%;
  height: 220px;
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  background: var(--color-surface);
  touch-action: none;
  cursor: crosshair;
}
</style>

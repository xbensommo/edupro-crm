<template>
  <section class="card space-y-4">
    <div>
      <p class="text-caption">Page settings</p>
      <h3 class="section-title text-lg md:text-xl">Layout</h3>
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <label class="block text-sm">
        <span class="field-label">Watermark</span>
        <select v-model="documentDraft.layout.watermark.preset" class="select-field" @change="syncWatermarkPreset">
          <option v-for="preset in watermarkPresets" :key="preset.value" :value="preset.value">
            {{ preset.label }}
          </option>
        </select>
      </label>

      <label class="block text-sm">
        <span class="field-label">Watermark Text</span>
        <input v-model="documentDraft.layout.watermark.text" class="input-field" />
      </label>

      <label class="block text-sm">
        <span class="field-label">Header Height</span>
        <input v-model.number="documentDraft.layout.header.height" type="number" min="72" step="4" class="input-field" />
      </label>

      <label class="block text-sm">
        <span class="field-label">Footer Height</span>
        <input v-model.number="documentDraft.layout.footer.height" type="number" min="36" step="4" class="input-field" />
      </label>

      <label class="block text-sm">
        <span class="field-label">Top Margin</span>
        <input v-model.number="documentDraft.layout.margins.top" type="number" min="24" step="2" class="input-field" />
      </label>

      <label class="block text-sm">
        <span class="field-label">Bottom Margin</span>
        <input v-model.number="documentDraft.layout.margins.bottom" type="number" min="24" step="2" class="input-field" />
      </label>

      <label class="block text-sm">
        <span class="field-label">Left Margin</span>
        <input v-model.number="documentDraft.layout.margins.left" type="number" min="24" step="2" class="input-field" />
      </label>

      <label class="block text-sm">
        <span class="field-label">Right Margin</span>
        <input v-model.number="documentDraft.layout.margins.right" type="number" min="24" step="2" class="input-field" />
      </label>

      <label class="block text-sm">
        <span class="field-label">Header Left</span>
        <textarea v-model="documentDraft.layout.header.leftText" rows="2" class="textarea-field"></textarea>
      </label>

      <label class="block text-sm">
        <span class="field-label">Header Right</span>
        <textarea v-model="documentDraft.layout.header.rightText" rows="2" class="textarea-field"></textarea>
      </label>

      <label class="block text-sm">
        <span class="field-label">Footer Left</span>
        <input v-model="documentDraft.layout.footer.leftText" class="input-field" />
      </label>

      <label class="block text-sm">
        <span class="field-label">Footer Center</span>
        <input v-model="documentDraft.layout.footer.centerText" class="input-field" />
      </label>

      <label class="block text-sm md:col-span-2">
        <span class="field-label">Footer Right</span>
        <input v-model="documentDraft.layout.footer.rightText" class="input-field" />
      </label>

      <label class="option-card md:col-span-2">
        <input v-model="documentDraft.layout.footer.showPageNumbers" type="checkbox" class="h-4 w-4" />
        <span>Show page numbers</span>
      </label>
    </div>
  </section>
</template>

<script setup>
import { WATERMARK_PRESETS } from '../../core/constants.js';

const props = defineProps({
  documentDraft: { type: Object, required: true },
});

const watermarkPresets = WATERMARK_PRESETS;

function syncWatermarkPreset() {
  const matched = watermarkPresets.find((entry) => entry.value === props.documentDraft.layout.watermark.preset);
  if (!matched) return;
  props.documentDraft.layout.watermark.text = matched.text;
  props.documentDraft.layout.watermark.opacity = matched.opacity;
  props.documentDraft.layout.watermark.rotation = matched.rotation;
}
</script>

<template>
  <div class="space-y-2">
    <div v-if="label" class="field-label">
      {{ label }}
    </div>

    <div class="overflow-hidden rounded-[1.25rem] border border-theme bg-surface shadow-theme-xs">
      <RichTextToolbar @command="applyCommand" />
      <div
        ref="editableRef"
        class="doc-rich-editor min-h-[180px] px-4 py-4 text-sm leading-7 outline-none"
        contenteditable="true"
        @input="emitHtml"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from 'vue';
import RichTextToolbar from './RichTextToolbar.vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: '<p></p>',
  },
  label: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:modelValue']);
const editableRef = ref(null);

function getSafeHtml(value) {
  return value || '<p></p>';
}

function setEditorHtml(html, preserveSelection = false) {
  const editor = editableRef.value;
  if (!editor) return;

  let selection = null;
  let range = null;

  if (preserveSelection) {
    selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      range = selection.getRangeAt(0).cloneRange();
    }
  }

  editor.innerHTML = getSafeHtml(html);

  if (preserveSelection && range && selection) {
    try {
      selection.removeAllRanges();
      selection.addRange(range);
    } catch {
      // ignore invalid saved range after html changes
    }
  }
}

function emitHtml() {
  const html = editableRef.value?.innerHTML || '<p></p>';
  emit('update:modelValue', html);
}

async function applyCommand(command) {
  const editor = editableRef.value;
  if (!editor || !command?.type) return;

  editor.focus();
  document.execCommand(command.type, false, command.value || null);

  await nextTick();
  emitHtml();
}

onMounted(() => {
  setEditorHtml(props.modelValue, false);
});

watch(
  () => props.modelValue,
  (nextValue) => {
    const editor = editableRef.value;
    if (!editor) return;

    const safeNextValue = getSafeHtml(nextValue);

    if (editor.innerHTML === safeNextValue) return;

    const isFocused = document.activeElement === editor;
    setEditorHtml(safeNextValue, isFocused);
  }
);
</script>

<style scoped>
.doc-rich-editor {
  background: var(--color-surface);
  color: var(--color-text-soft);
}

.doc-rich-editor :deep(p),
.doc-rich-editor :deep(ul),
.doc-rich-editor :deep(ol),
.doc-rich-editor :deep(blockquote),
.doc-rich-editor :deep(h1),
.doc-rich-editor :deep(h2),
.doc-rich-editor :deep(h3) {
  margin: 0 0 0.8rem;
}

.doc-rich-editor :deep(h1),
.doc-rich-editor :deep(h2),
.doc-rich-editor :deep(h3) {
  color: var(--color-text);
}

.doc-rich-editor :deep(ul),
.doc-rich-editor :deep(ol) {
  padding-left: 1.25rem;
}

.doc-rich-editor :deep(*:last-child) {
  margin-bottom: 0;
}
</style>

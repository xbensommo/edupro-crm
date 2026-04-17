<template>
  <section class="card space-y-4">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p class="text-caption">Content blocks</p>
        <h3 class="section-title text-lg md:text-xl">{{ title }}</h3>
      </div>

      <button type="button" class="btn-primary btn-sm w-full sm:w-auto" @click="$emit('add')">
        <i class="fa-solid fa-plus"></i>
        Add Block
      </button>
    </div>

    <div class="space-y-4">
      <article
        v-for="(block, index) in blocks"
        :key="block.id || index"
        class="card-soft space-y-4 p-4"
      >
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            v-model="block.label"
            class="input-field flex-1"
            placeholder="Section title"
          />

          <button
            type="button"
            class="btn-outline btn-sm w-full sm:w-auto"
            @click="$emit('remove', index)"
          >
            <i class="fa-solid fa-trash-can"></i>
            Remove
          </button>
        </div>

        <RichTextBlockEditor v-model="block.html" />
      </article>
    </div>
  </section>
</template>

<script setup>
import RichTextBlockEditor from './RichTextBlockEditor.vue';

defineProps({
  title: { type: String, default: 'Rich Text Blocks' },
  blocks: { type: Array, default: () => [] },
});

defineEmits(['add', 'remove']);
</script>

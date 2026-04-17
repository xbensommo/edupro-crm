<template>
  <section class="card space-y-4">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p class="text-caption">Structured content</p>
        <h3 class="section-title text-lg md:text-xl">{{ title }}</h3>
      </div>

      <button type="button" class="btn-primary btn-sm w-full sm:w-auto" @click="$emit('add')">
        <i class="fa-solid fa-plus"></i>
        Add
      </button>
    </div>

    <div class="space-y-4">
      <article
        v-for="(item, index) in items"
        :key="item.id || index"
        class="card-soft space-y-4 p-4"
      >
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span class="text-caption">{{ singularLabel }} {{ index + 1 }}</span>
          <button type="button" class="btn-outline btn-sm w-full sm:w-auto" @click="$emit('remove', index)">
            <i class="fa-solid fa-trash-can"></i>
            Remove
          </button>
        </div>

        <div class="grid gap-3 md:grid-cols-2">
          <input v-model="item.label" class="input-field" placeholder="Label" />
          <input v-model="item.value" class="input-field" placeholder="Value" />
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
defineProps({
  title: { type: String, default: 'Items' },
  singularLabel: { type: String, default: 'Item' },
  items: { type: Array, default: () => [] },
});

defineEmits(['add', 'remove']);
</script>

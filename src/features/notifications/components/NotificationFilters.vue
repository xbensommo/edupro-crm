<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({}),
  },
  showStatus: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['update:modelValue', 'refresh'])

function update(name, value) {
  emit('update:modelValue', {
    ...props.modelValue,
    [name]: value,
  })
}
</script>

<template>
  <section class="notification-filters grid gap-3 rounded-2xl border p-4 md:grid-cols-6">
    <input
      :value="modelValue.search || ''"
      class="input-base md:col-span-2"
      placeholder="Search notifications"
      type="search"
      @input="update('search', $event.target.value)"
    />

    <select :value="modelValue.type || ''" class="input-base" @change="update('type', $event.target.value)">
      <option value="">All types</option>
      <option value="system">System</option>
      <option value="auth">Auth</option>
      <option value="crm">CRM</option>
      <option value="workflow">Workflow</option>
      <option value="finance">Finance</option>
      <option value="client_records">Client records</option>
    </select>

    <select :value="modelValue.channel || ''" class="input-base" @change="update('channel', $event.target.value)">
      <option value="">All channels</option>
      <option value="in_app">In-app</option>
      <option value="email">Email</option>
      <option value="push">Push / FCM</option>
      <option value="whatsapp">WhatsApp</option>
    </select>

    <select
      v-if="showStatus"
      :value="modelValue.status || ''"
      class="input-base"
      @change="update('status', $event.target.value)"
    >
      <option value="">All statuses</option>
      <option value="queued">Queued</option>
      <option value="pending">Pending</option>
      <option value="sent">Sent</option>
      <option value="failed">Failed</option>
      <option value="read">Read</option>
      <option value="archived">Archived</option>
    </select>

    <label class="filter-toggle inline-flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-sm font-medium">
      <span>Unread only</span>
      <input
        :checked="modelValue.unreadOnly || false"
        type="checkbox"
        @change="update('unreadOnly', $event.target.checked)"
      />
    </label>

    <button class="refresh-btn rounded-xl border px-3 py-2 text-sm font-semibold" type="button" @click="$emit('refresh')">
      Refresh
    </button>
  </section>
</template>

<style scoped>
.notification-filters {
  background: var(--color-surface, #ffffff);
  border-color: var(--color-border, #e5e7eb);
}

.input-base {
  min-height: 2.75rem;
  width: 100%;
  border-radius: 0.9rem;
  border: 1px solid var(--color-border, #e5e7eb);
  background: var(--color-surface-muted, #f8fafc);
  padding: 0.7rem 0.85rem;
  color: var(--color-text, #111827);
  outline: none;
}

.input-base:focus {
  border-color: var(--color-primary, #1860a8);
}

.filter-toggle,
.refresh-btn {
  background: var(--color-surface, #ffffff);
  border-color: var(--color-border, #e5e7eb);
  color: var(--color-text, #111827);
}

.refresh-btn:hover {
  background: var(--color-surface-muted, #f8fafc);
}
</style>

<template>
  <span class="badge" :class="badgeClass">
    {{ label }}
  </span>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  status: {
    type: String,
    default: 'draft',
  },
});

const label = computed(() => String(props.status || 'draft').replaceAll('_', ' '));

const badgeClass = computed(() => {
  switch (props.status) {
    case 'signed':
    case 'active':
    case 'paid':
    case 'completed':
      return 'badge-success';
    case 'approved':
      return 'badge-primary';
    case 'cancelled':
    case 'void':
      return 'badge-danger';
    case 'sent':
      return 'badge-warning';
    default:
      return '';
  }
});
</script>

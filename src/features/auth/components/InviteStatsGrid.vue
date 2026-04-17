<template>
  <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    <article class="metric-card p-5">
      <p class="stat-title">Pending invites</p>
      <p class="stat-value text-3xl">{{ metrics.pendingInvites || 0 }}</p>
    </article>
    <article class="metric-card p-5">
      <p class="stat-title">Accepted invites</p>
      <p class="stat-value text-3xl">{{ metrics.acceptedInvites || 0 }}</p>
    </article>
    <article class="metric-card p-5">
      <p class="stat-title">Expired invites</p>
      <p class="stat-value text-3xl">{{ metrics.expiredInvites || 0 }}</p>
    </article>
    <article class="metric-card p-5">
      <p class="stat-title">Suspended users</p>
      <p class="stat-value text-3xl">{{ metrics.suspendedUsers || 0 }}</p>
    </article>
  </div>
</template>

<script setup>
defineProps({
  metrics: {
    type: Object,
    default: () => ({}),
  },
})
</script>

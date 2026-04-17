<template>
  <section class="card-soft space-y-5">
    <div>
      <p class="section-label mb-3">User access</p>
      <h2 class="section-title">Current staff access</h2>
    </div>

    <div class="overflow-x-auto">
      <table class="min-w-full text-left text-sm">
        <thead>
          <tr class="border-b border-[var(--color-border-subtle)] text-muted">
            <th class="px-3 py-3 font-medium">User</th>
            <th class="px-3 py-3 font-medium">Role</th>
            <th class="px-3 py-3 font-medium">Department</th>
            <th class="px-3 py-3 font-medium">Status</th>
            <th class="px-3 py-3 font-medium">Last login</th>
            <th class="px-3 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id || user.uid" class="border-b border-[var(--color-border-subtle)] last:border-b-0">
            <td class="px-3 py-4 align-top">
              <p class="font-medium text-[var(--color-text)]">{{ user.data.displayName || user.data.data.email }}</p>
              <p class="mt-1 text-xs text-muted">{{ user.data.email }}</p>
            </td>
            <td class="px-3 py-4 align-top">{{ user.data.role || 'user' }}</td>
            <td class="px-3 py-4 align-top">{{ user.data.department || '—' }}</td>
            <td class="px-3 py-4 align-top"><span class="badge">{{ user.data.status || 'pending_invite' }}</span></td>
            <td class="px-3 py-4 align-top">{{ formatDate(user.data.lastLoginAt) }}</td>
            <td class="px-3 py-4 align-top">
              <div class="flex flex-wrap gap-2">
                <button v-if="user.data.status !== 'suspended'" type="button" class="btn-secondary !px-3 !py-2" @click="$emit('suspend', user)">Suspend</button>
                <button v-else type="button" class="btn-secondary !px-3 !py-2" @click="$emit('reactivate', user)">Reactivate</button>
              </div>
            </td>
          </tr>
          <tr v-if="!users.length">
            <td colspan="6" class="px-3 py-10 text-center text-sm text-muted">No team users found yet.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
import { formatDate } from '@core_services/index.js';

defineProps({
  users: {
    type: Array,
    default: () => [],
  },
})

defineEmits(['suspend', 'reactivate'])

</script>

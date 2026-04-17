<template>
  <section class="card-soft space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p class="section-label mb-3">Invite activity</p>
        <h2 class="section-title">Invitation pipeline</h2>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="item in tabs"
          :key="item"
          type="button"
          class="badge transition"
          :class="activeTab === item ? 'ring-1 ring-primary bg-primary/10 text-primary' : ''"
          @click="$emit('update:activeTab', item)"
        >
          {{ item }}
        </button>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="min-w-full text-left text-sm">
        <thead>
          <tr class="border-b border-[var(--color-border-subtle)] text-muted">
            <th class="px-3 py-3 font-medium">Invitee</th>
            <th class="px-3 py-3 font-medium">Role</th>
            <th class="px-3 py-3 font-medium">Status</th>
            <th class="px-3 py-3 font-medium">Expires</th>
            <th class="px-3 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="invite in items" :key="invite.id" class="border-b border-[var(--color-border-subtle)] last:border-b-0">
            <td class="px-3 py-4 align-top">
              <p class="font-medium text-[var(--color-text)]">{{ invite.data.displayName || `${invite.data.firstName || ''} ${invite.data.lastName || ''}`.trim() || invite.data.email }}</p>
              <p class="mt-1 text-xs text-muted">{{ invite.data.email }}</p>
            </td>
            <td class="px-3 py-4 align-top">{{ invite.data.role || 'user' }}</td>
            <td class="px-3 py-4 align-top"><span class="badge">{{ invite.data.status }}</span></td>
            <td class="px-3 py-4 align-top">{{ formatDate(invite.data.expiresAt) }}</td>
            <td class="px-3 py-4 align-top">
              <div class="flex flex-wrap gap-2">
                <button v-if="invite.data.inviteUrl" type="button" class="btn-secondary !px-3 !py-2" @click="$emit('copy', invite)">Copy link</button>
                <button v-if="invite.data.status === 'pending'" type="button" class="btn-secondary !px-3 !py-2" @click="$emit('extend', invite)">Extend</button>
                <button v-if="invite.data.status === 'pending'" type="button" class="btn-secondary !px-3 !py-2" @click="$emit('revoke', invite)">Revoke</button>
                <button v-if="invite.data.status !== 'pending'" type="button" class="btn-secondary !px-3 !py-2" @click="$emit('recreate', invite)">Recreate</button>
              </div>
            </td>
          </tr>
          <tr v-if="!items.length">
            <td colspan="5" class="px-3 py-10 text-center text-sm text-muted">No invitations in this view yet.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
import { formatDate } from '@core_services/index.js';

const tabs = ['pending', 'accepted', 'expired', 'revoked']

defineProps({
  activeTab: {
    type: String,
    default: 'pending',
  },
  items: {
    type: Array,
    default: () => [],
  },
})

defineEmits(['update:activeTab', 'copy', 'extend', 'revoke', 'recreate'])

</script>

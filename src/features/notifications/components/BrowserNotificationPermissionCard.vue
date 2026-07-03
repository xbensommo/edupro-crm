<script setup>
import { useBrowserNotifications } from '../composables/useBrowserNotifications.js'

const { supported, permission, loading, error, enableBrowserNotifications } = useBrowserNotifications()
</script>

<template>
  <section class="rounded-2xl border border-[var(--color-border,#e5e7eb)] bg-[var(--color-surface,#fff)] p-5">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-muted,#6b7280)]">
          Browser notifications
        </p>
        <h3 class="mt-2 text-base font-semibold text-[var(--color-text,#111827)]">
          Enable FCM push alerts
        </h3>
        <p class="mt-1 text-sm leading-6 text-[color:var(--color-muted,#6b7280)]">
          Receive urgent EduProLIC CRM, review, and finance alerts even when the app is not focused.
        </p>
      </div>

      <button
        class="rounded-full bg-[var(--color-primary,#1860a8)] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        type="button"
        :disabled="!supported || loading || permission === 'granted'"
        @click="enableBrowserNotifications"
      >
        <span v-if="loading">Enabling...</span>
        <span v-else-if="permission === 'granted'">Enabled</span>
        <span v-else-if="permission === 'denied'">Blocked by browser</span>
        <span v-else>Enable</span>
      </button>
    </div>

    <p v-if="!supported" class="mt-3 text-sm text-red-700">
      This browser does not support FCM browser notifications.
    </p>
    <p v-if="error" class="mt-3 text-sm text-red-700">
      {{ error }}
    </p>
  </section>
</template>

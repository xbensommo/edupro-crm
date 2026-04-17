<script setup>
const logs = [
  { id: 'log_1', channel: 'in_app', provider: 'database', status: 'sent', notificationId: 'ntf_demo_1' },
  { id: 'log_2', channel: 'email', provider: 'resend', status: 'failed', notificationId: 'ntf_demo_2' },
]
</script>

<template>
  <section class="space-y-6">
    <header class="rounded-[2rem] border p-6 sm:p-8">
      <p class="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-muted,#6b7280)]">
        Admin
      </p>
      <h1 class="mt-3 text-2xl font-semibold sm:text-3xl">Delivery Logs</h1>
      <p class="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--color-muted,#6b7280)]">
        Review provider outcomes and retry failures from one place.
      </p>
    </header>

    <div class="grid gap-4 md:grid-cols-2">
      <article v-for="log in logs" :key="log.id" class="rounded-[2rem] border p-5">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted,#6b7280)]">
              {{ log.channel }}
            </p>
            <h2 class="mt-2 text-base font-semibold">{{ log.notificationId }}</h2>
          </div>
          <span class="status-chip">{{ log.status }}</span>
        </div>
        <p class="mt-3 text-sm text-[color:var(--color-muted,#6b7280)]">
          Provider: {{ log.provider }}
        </p>
        <button class="retry-btn mt-5 rounded-full px-4 py-2 text-sm font-semibold" type="button">
          Retry
        </button>
      </article>
    </div>
  </section>
</template>

<style scoped>
header,
article {
  background: var(--color-surface, #ffffff);
  border-color: var(--color-border, #e5e7eb);
}

.status-chip {
  display: inline-flex;
  border-radius: 999px;
  padding: 0.35rem 0.7rem;
  color: white;
  background: var(--color-secondary, #4a90e2);
}

.retry-btn {
  color: white;
  background: var(--color-primary, #1860a8);
}
</style>

<script setup>
const templates = [
  { key: 'lead.assigned', event: 'lead.assigned', channels: ['in_app', 'email'], active: true },
  { key: 'booking.confirmed', event: 'booking.confirmed', channels: ['in_app', 'email', 'whatsapp'], active: true },
  { key: 'invoice.overdue', event: 'invoice.overdue', channels: ['in_app', 'email', 'whatsapp'], active: true },
]
</script>

<template>
  <section class="space-y-6">
    <header class="rounded-[2rem] border p-6 sm:p-8">
      <p class="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-muted,#6b7280)]">
        Admin
      </p>
      <h1 class="mt-3 text-2xl font-semibold sm:text-3xl">Notification Templates</h1>
      <p class="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--color-muted,#6b7280)]">
        Manage event templates without touching business features.
      </p>
    </header>

    <div class="rounded-[2rem] border p-4 sm:p-6">
      <div class="overflow-x-auto">
        <table class="min-w-full text-left text-sm">
          <thead>
            <tr class="text-[color:var(--color-muted,#6b7280)]">
              <th class="px-4 py-3 font-medium">Key</th>
              <th class="px-4 py-3 font-medium">Event</th>
              <th class="px-4 py-3 font-medium">Channels</th>
              <th class="px-4 py-3 font-medium">Active</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="template in templates" :key="template.key" class="border-t">
              <td class="px-4 py-3 font-medium">{{ template.key }}</td>
              <td class="px-4 py-3">{{ template.event }}</td>
              <td class="px-4 py-3">{{ template.channels.join(', ') }}</td>
              <td class="px-4 py-3">{{ template.active ? 'Yes' : 'No' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<style scoped>
header,
div.rounded-\[2rem\] {
  background: var(--color-surface, #ffffff);
  border-color: var(--color-border, #e5e7eb);
}

tr.border-t {
  border-color: var(--color-border, #e5e7eb);
}
</style>

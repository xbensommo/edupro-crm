<script setup>
import { formatDateTime, humanizeToken, isUnread } from '../utils/notification.filters.js'

defineProps({
  items: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  emptyTitle: {
    type: String,
    default: 'No notifications yet',
  },
  emptyText: {
    type: String,
    default: 'Operational alerts from CRM, finance, auth, and client records will appear here.',
  },
})

const emit = defineEmits(['open', 'mark-read', 'archive'])
</script>

<template>
  <div class="space-y-3">
    <div v-if="loading" class="rounded-2xl border p-6 text-sm text-[color:var(--color-muted,#6b7280)]">
      Loading notifications…
    </div>

    <div v-else-if="items.length" class="space-y-3">
      <article
        v-for="item in items"
        :key="item.id"
        :class="['notification-card rounded-2xl border p-4 transition hover:-translate-y-0.5', isUnread(item) ? 'notification-card-unread' : '']"
      >
        <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <button class="min-w-0 text-left" type="button" @click="$emit('open', item)">
            <div class="flex flex-wrap items-center gap-2">
              <span class="pill pill-type">{{ humanizeToken(item.type || item.domain || 'system') }}</span>
              <span v-if="item.priority" class="pill pill-priority">{{ humanizeToken(item.priority) }}</span>
              <span v-if="item.isActionRequired" class="pill pill-action">action</span>
              <span v-if="isUnread(item)" class="pill pill-new">new</span>
            </div>

            <h3 class="mt-3 text-sm font-semibold sm:text-base">
              {{ item.title || 'Untitled notification' }}
            </h3>

            <p class="mt-1 line-clamp-3 text-sm leading-6 text-[color:var(--color-muted,#6b7280)]">
              {{ item.message || 'No message provided.' }}
            </p>

            <div class="mt-3 flex flex-wrap items-center gap-2 text-xs text-[color:var(--color-muted,#6b7280)]">
              <span>{{ humanizeToken(item.channel || (item.channels || [])[0] || 'in_app') }}</span>
              <span>•</span>
              <span>{{ item.event || 'system.alert' }}</span>
              <span v-if="item.entityLabel || item.entityId">•</span>
              <span v-if="item.entityLabel || item.entityId">{{ item.entityLabel || item.entityId }}</span>
              <span>•</span>
              <span>{{ formatDateTime(item.createdAt) }}</span>
            </div>
          </button>

          <div class="flex shrink-0 flex-wrap gap-2 lg:flex-col">
            <button
              class="action-btn"
              :disabled="!isUnread(item)"
              type="button"
              @click="$emit('mark-read', item)"
            >
              Read
            </button>
            <button class="action-btn" type="button" @click="$emit('archive', item)">
              Archive
            </button>
            <button class="action-btn action-btn-primary" type="button" @click="$emit('open', item)">
              Open
            </button>
          </div>
        </div>
      </article>
    </div>

    <div v-else class="empty-state rounded-2xl border p-6 text-center">
      <h3 class="text-sm font-semibold sm:text-base">{{ emptyTitle }}</h3>
      <p class="mt-2 text-sm text-[color:var(--color-muted,#6b7280)]">{{ emptyText }}</p>
    </div>
  </div>
</template>

<style scoped>
.notification-card,
.empty-state,
div[loading] {
  background: var(--color-surface, #ffffff);
  border-color: var(--color-border, #e5e7eb);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
}

.notification-card-unread {
  border-color: color-mix(in srgb, var(--color-primary, #1860a8) 45%, var(--color-border, #e5e7eb));
}

.pill {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.2rem 0.55rem;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.pill-type {
  color: var(--color-secondary, #4a90e2);
  background: color-mix(in srgb, var(--color-secondary, #4a90e2) 12%, white);
}

.pill-priority {
  color: var(--color-accent, #111827);
  background: color-mix(in srgb, var(--color-accent, #111827) 8%, white);
}

.pill-action {
  color: #92400e;
  background: #fef3c7;
}

.pill-new {
  color: #ffffff;
  background: var(--color-primary, #1860a8);
}

.action-btn {
  min-width: 4.75rem;
  border-radius: 999px;
  border: 1px solid var(--color-border, #e5e7eb);
  background: transparent;
  padding: 0.55rem 0.8rem;
  font-size: 0.76rem;
  font-weight: 700;
  color: var(--color-text, #111827);
}

.action-btn:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.action-btn-primary {
  color: #ffffff;
  border-color: transparent;
  background: var(--color-primary, #1860a8);
}
</style>

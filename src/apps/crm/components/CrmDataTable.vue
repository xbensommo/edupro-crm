<template>
  <div class="table-wrap">
    <div class="overflow-x-auto">
      <table class="table-base min-w-full">
        <thead>
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
            >
              {{ column.label }}
            </th>

            <th v-if="$slots.actions" class="text-right">
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="isLoading">
            <td :colspan="columnSpan">
              <div class="space-y-4 p-4">
                <div
                  v-for="i in loadingRows"
                  :key="i"
                  class="h-12 animate-pulse rounded-xl bg-accent/50"
                />
              </div>
            </td>
          </tr>

          <tr v-else-if="normalizedRows.length === 0">
            <td :colspan="columnSpan">
              <div class="empty-state rounded-none border-0 shadow-none">
                <i class="fa fa-folder-open text-3xl text-muted opacity-50"></i>
                <span class="mt-3 text-sm font-medium text-muted">{{ emptyText }}</span>
              </div>
            </td>
          </tr>

          <tr
            v-for="row in normalizedRows"
            v-else
            :key="row.id || row._key || JSON.stringify(row)"
          >
            <td
              v-for="column in columns"
              :key="`${row.id || row._key || 'row'}-${column.key}`"
              class="word-wrap"
            >
              <slot
                :name="`cell-${column.key}`"
                :row="row"
                :value="row[column.key]"
              >
                {{ formatCellValue(row[column.key], column.key) }}
              </slot>
            </td>

            <td v-if="$slots.actions" class="text-right text-sm">
              <slot name="actions" :row="row" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatDate } from '@core_services/index.js'

/**
 * Reusable and extendable CRM table.
 */
const props = defineProps({
  columns: {
    type: Array,
    required: true,
  },
  rows: {
    type: Array,
    default: () => [],
  },
  emptyText: {
    type: String,
    default: 'No records found.',
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  clickableLink: {
    type: String,
    default: null,
  },
  loadingRows: {
    type: Number,
    default: 3,
  },
})

const normalizedRows = computed(() =>
  (Array.isArray(props.rows) ? props.rows : []).map((row) => {
    const data = row?.data && typeof row.data === 'object' ? row.data : {}

    return {
      ...row,
      ...data,
      id: row?.id || row?.docId || row?._id || data?.id || '',
    }
  }),
)

const columnSpan = computed(() => props.columns.length + (useActionsColumn() ? 1 : 0))

function useActionsColumn() {
  return Boolean(props.columns) && !!props.columns.length
}

/**
 * Format cell output safely.
 *
 * @param {unknown} value
 * @param {string} key
 * @returns {string}
 */
function formatCellValue(value, key) {
  if (value === null || value === undefined || value === '') return '—'
  if (key === 'dueDate') return formatDate(value)
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}
</script>
<template>
  <div class="table-wrap">
    <div class="overflow-x-auto">
      <table class="table-base min-w-full">
        <thead>
          <tr>
            <th v-for="column in columns" :key="column.key">
              {{ column.label }}
            </th>
            <th v-if="$slots.actions" class="text-right">
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="normalizedRows.length === 0">
            <td :colspan="columns.length + ($slots.actions ? 1 : 0)" class="px-4 py-10 text-center text-sm text-muted">
              {{ emptyText }}
            </td>
          </tr>

          <tr v-for="row in normalizedRows" v-else :key="row.id || row._key || JSON.stringify(row)">
            <td v-for="column in columns" :key="column.key" class="whitespace-nowrap">
              <slot :name="`cell:${column.key}`" :row="row" :value="row[column.key]">
                {{ formatValue(row[column.key]) }}
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

/**
 * @file EntityTable.vue
 * @description Generic table for starter CRUD modules.
 */
const props = defineProps({
  columns: {
    type: Array,
    default: () => [],
  },
  rows: {
    type: Array,
    default: () => [],
  },
  emptyText: {
    type: String,
    default: 'No records found.',
  },
})

const normalizedRows = computed(() =>
  props.rows.map((row) => {
  
    const data = row?.data && typeof row.data === 'object' ? row.data : {}
    return {
      ...row,
      ...data,
      id: row?.id || row?.docId || row?._id || data?.id || '',
    }
  }),
)

/**
 * Format cell values for default rendering.
 *
 * @param {unknown} value
 * @returns {string}
 */
function formatValue(value) {
  if (value === null || value === undefined || value === '') return '—'
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}
</script>
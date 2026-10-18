<!--
  - Copyright (c)
  - Weyoss <weyoss@outlook.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    currentPage: number;
    totalPages: number;
    pageSize: number;
    pageSizeOptions?: number[];
    totalCount?: number;
    start?: number;
    end?: number;
  }>(),
  {
    pageSizeOptions: () => [10, 20, 50, 100],
    totalCount: undefined,
    start: undefined,
    end: undefined,
  },
);

const emit = defineEmits<{
  'page-change': [page: number];
  'page-size-change': [size: number];
}>();

const visiblePages = computed<number[]>(() => {
  const total = props.totalPages;
  const current = props.currentPage;
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  let start = Math.max(1, current - 2);
  const end = Math.min(total, start + 4);
  start = Math.max(1, end - 4);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
});

function onPageSizeChange(e: Event) {
  emit('page-size-change', Number((e.target as HTMLSelectElement).value));
}
</script>

<template>
  <div class="pagination">
    <div class="pagination__summary">
      <template
        v-if="
          totalCount !== undefined && start !== undefined && end !== undefined
        "
      >
        <template v-if="totalCount > 0">
          {{ start }}–{{ end }} of {{ totalCount.toLocaleString() }}
        </template>
        <template v-else>0 of 0</template>
      </template>
      <label class="pagination__size">
        <span class="pagination__size-label">Per page:</span>
        <select
          class="form-select form-select-sm"
          :value="pageSize"
          @change="onPageSizeChange"
        >
          <option v-for="n in pageSizeOptions" :key="n" :value="n">
            {{ n }}
          </option>
        </select>
      </label>
    </div>

    <nav
      v-if="totalPages > 1"
      class="pagination__pages"
      aria-label="Pagination"
    >
      <button
        type="button"
        class="btn btn-sm btn-outline-secondary"
        :disabled="currentPage <= 1"
        aria-label="First page"
        @click="emit('page-change', 1)"
      >
        <i class="bi bi-chevron-double-left" />
      </button>
      <button
        type="button"
        class="btn btn-sm btn-outline-secondary"
        :disabled="currentPage <= 1"
        aria-label="Previous page"
        @click="emit('page-change', currentPage - 1)"
      >
        <i class="bi bi-chevron-left" />
      </button>

      <button
        v-for="p in visiblePages"
        :key="p"
        type="button"
        class="btn btn-sm"
        :class="p === currentPage ? 'btn-primary' : 'btn-outline-secondary'"
        :aria-current="p === currentPage ? 'page' : undefined"
        @click="emit('page-change', p)"
      >
        {{ p }}
      </button>

      <button
        type="button"
        class="btn btn-sm btn-outline-secondary"
        :disabled="currentPage >= totalPages"
        aria-label="Next page"
        @click="emit('page-change', currentPage + 1)"
      >
        <i class="bi bi-chevron-right" />
      </button>
      <button
        type="button"
        class="btn btn-sm btn-outline-secondary"
        :disabled="currentPage >= totalPages"
        aria-label="Last page"
        @click="emit('page-change', totalPages)"
      >
        <i class="bi bi-chevron-double-right" />
      </button>
    </nav>
  </div>
</template>

<style scoped>
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--rsmq-space-4);
  flex-wrap: wrap;
  padding: var(--rsmq-space-3) 0;
}
.pagination__summary {
  display: flex;
  align-items: center;
  gap: var(--rsmq-space-4);
  color: var(--rsmq-color-text-muted);
  font-size: 0.875rem;
}
.pagination__size {
  display: flex;
  align-items: center;
  gap: var(--rsmq-space-2);
}
.pagination__size-label {
  white-space: nowrap;
}
.pagination__size .form-select {
  width: auto;
}
.pagination__pages {
  display: flex;
  gap: var(--rsmq-space-1);
  flex-wrap: wrap;
}
@media (max-width: 576px) {
  .pagination {
    flex-direction: column;
    align-items: stretch;
  }
  .pagination__summary {
    justify-content: space-between;
  }
  .pagination__pages {
    justify-content: center;
  }
}
</style>

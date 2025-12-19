/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { computed, ref } from 'vue';

export interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  start: number;
  end: number;
  hasItems: boolean;
}

export function usePagination(defaultPageSize: number = 20) {
  // Reactive state
  const currentPage = ref(1);
  const pageSize = ref(defaultPageSize);
  const totalCount = ref(0);

  // Computed properties
  const totalPages = computed(
    () => Math.ceil(totalCount.value / pageSize.value) || 1,
  );

  const paginationInfo = computed((): PaginationInfo => {
    const start =
      totalCount.value > 0 ? (currentPage.value - 1) * pageSize.value + 1 : 0;
    const end = Math.min(currentPage.value * pageSize.value, totalCount.value);

    return {
      currentPage: currentPage.value,
      pageSize: pageSize.value,
      totalCount: totalCount.value,
      totalPages: totalPages.value,
      start,
      end,
      hasItems: totalCount.value > 0,
    };
  });

  // Navigation helpers
  const canGoPrevious = computed(() => currentPage.value > 1);
  const canGoNext = computed(() => currentPage.value < totalPages.value);

  // Event handlers
  function handlePageChange(page: number): void {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page;
    }
  }

  function handlePageSizeChange(size: number): void {
    pageSize.value = size;
    currentPage.value = 1; // Reset to first page when changing page size
  }

  function handleFirstPage(): void {
    currentPage.value = 1;
  }

  function handlePreviousPage(): void {
    if (canGoPrevious.value) {
      currentPage.value--;
    }
  }

  function handleNextPage(): void {
    if (canGoNext.value) {
      currentPage.value++;
    }
  }

  function handleLastPage(): void {
    currentPage.value = totalPages.value;
  }

  function resetPagination(): void {
    currentPage.value = 1;
    totalCount.value = 0;
  }

  function setTotalCount(count: number): void {
    totalCount.value = Math.max(0, count);
  }

  return {
    // State
    currentPage,
    pageSize,
    totalCount,
    totalPages,

    // Computed
    paginationInfo,
    canGoPrevious,
    canGoNext,

    // Methods
    handlePageChange,
    handlePageSizeChange,
    handleFirstPage,
    handlePreviousPage,
    handleNextPage,
    handleLastPage,
    resetPagination,
    setTotalCount,
  };
}

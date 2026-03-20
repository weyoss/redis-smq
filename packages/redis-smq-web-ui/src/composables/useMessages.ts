/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { computed, reactive, type Ref, watch } from 'vue';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import {
  useDeleteApiMessagesId,
  usePostApiMessagesIdRequeue,
} from '@/api/generated/messages/messages.ts';
import type { IQueueParams } from '@/types/index.ts';
import { getErrorMessage } from '@/lib/error.ts';
import type { IMessageTransferable } from '@/api/model';

/**
 * Local pagination info exposed to the UI.
 */
export interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  start: number;
  end: number;
  hasItems: boolean;
}

/**
 * API response structure for messages
 */
export interface MessagesApiResponse {
  data?: {
    items?: IMessageTransferable[];
    totalItems?: number;
  };
}

/**
 * Error object with potential status codes
 */
interface ErrorWithStatus {
  status?: number;
  response?: {
    status?: number;
  };
}

/**
 * Configuration for the messages query function
 */
export interface MessagesQueryConfig {
  queryFn: (params: {
    ns: string;
    name: string;
    page: number;
    pageSize: number;
  }) => Promise<MessagesApiResponse>;
  queryKeyPrefix: string;
  enableDelete?: boolean;
  enableRequeue?: boolean;
  enabled?: Ref<boolean | null>; // When false, query is disabled. When null, wait. When true, enable if queue exists.
}

export function useMessages(
  queueParams: Ref<IQueueParams | null>,
  config: MessagesQueryConfig,
  initialPageSize = 20,
) {
  const queryClient = useQueryClient();

  // Local UI pagination state
  const pagination = reactive({
    currentPage: 1,
    pageSize: initialPageSize,
  });

  // Modified queryKey - include enabled state
  const queryKey = computed(() => {
    if (!queueParams.value || !isEnabled.value) {
      return ['disabled', config.queryKeyPrefix];
    }
    return [
      config.queryKeyPrefix,
      queueParams.value.ns,
      queueParams.value.name,
      'page',
      pagination.currentPage,
      'size',
      pagination.pageSize,
    ];
  });

  // Helper to extract total count
  function extractTotalItems(payload: MessagesApiResponse): number {
    return payload?.data?.totalItems ?? 0;
  }

  // Computed enabled state - FIXED!
  const isEnabled = computed(() => {
    // First check: queue params must exist
    const queueExists = !!(queueParams.value?.ns && queueParams.value?.name);
    if (!queueExists) return false;

    // Second check: if config.enabled is provided, respect its value
    if (config.enabled !== undefined) {
      // If config.enabled is null, wait (don't enable yet)
      if (config.enabled.value === null) return false;

      // Only enable if config.enabled is true
      return config.enabled.value;
    }

    // If no config.enabled provided, default to true when queue exists
    return true;
  });

  // Single page query
  const {
    data,
    error: fetchError,
    isLoading,
    isFetching,
    isSuccess,
    refetch,
  } = useQuery<MessagesApiResponse>({
    queryKey,
    enabled: isEnabled,
    retry: (failureCount: number, err: unknown) => {
      const errorWithStatus = err as ErrorWithStatus;
      const status =
        errorWithStatus?.status ?? errorWithStatus?.response?.status;
      if (status === 422) return false;
      return failureCount < 3;
    },
    queryFn: async () => {
      if (!queueParams.value) {
        throw new Error('Queue parameters are required');
      }

      return await config.queryFn({
        ns: queueParams.value.ns,
        name: queueParams.value.name,
        page: pagination.currentPage,
        pageSize: pagination.pageSize,
      });
    },
    // Keep previous data while fetching to avoid UI flicker
    placeholderData: (previousData) => previousData,
    // Cache for 5 minutes
    gcTime: 1000 * 60 * 5,
    // Consider data fresh for 30 seconds
    staleTime: 1000 * 30,
  });

  watch(
    isEnabled,
    (enabled) => {
      if (enabled) {
        // Force a refetch when enabled becomes true
        setTimeout(() => {
          refetch();
        }, 0);
      }
    },
    { immediate: true },
  );

  // Watch for queueParams changes
  watch(
    () => queueParams.value,
    (newQueue, oldQueue) => {
      if (
        newQueue &&
        (!oldQueue ||
          newQueue.ns !== oldQueue.ns ||
          newQueue.name !== oldQueue.name)
      ) {
        pagination.currentPage = 1;
        // Force a refetch when queue changes
        setTimeout(() => {
          refetch();
        }, 0);
      }
    },
    { immediate: true, deep: true },
  );

  // Mutations
  const onMutationSuccess = async () => {
    // Invalidate all queries for this queue
    const baseKey = [
      config.queryKeyPrefix,
      queueParams.value?.ns,
      queueParams.value?.name,
    ];
    await queryClient.invalidateQueries({
      queryKey: baseKey,
      refetchType: 'all',
    });
  };

  const deleteMessageMutation = config.enableDelete
    ? useDeleteApiMessagesId({
        mutation: {
          onSuccess: onMutationSuccess,
          onError: (error) => {
            console.error('[useMessages] Delete failed:', error);
          },
        },
      })
    : null;

  const requeueMessageMutation = config.enableRequeue
    ? usePostApiMessagesIdRequeue({
        mutation: {
          onSuccess: onMutationSuccess,
          onError: (error) => {
            console.error('[useMessages] Requeue failed:', error);
          },
        },
      })
    : null;

  // Current page messages - ensure we always return an array
  const messages = computed<IMessageTransferable[]>(() => {
    const items = data.value?.data?.items;
    return items || [];
  });

  const totalMessages = computed<number>(() => {
    return extractTotalItems(data.value ?? {});
  });

  const isDeleting = computed<boolean>(
    () => deleteMessageMutation?.isPending.value ?? false,
  );
  const isRequeuing = computed<boolean>(
    () => requeueMessageMutation?.isPending.value ?? false,
  );

  const error = computed(() => {
    const err =
      fetchError.value ||
      deleteMessageMutation?.error.value ||
      requeueMessageMutation?.error.value;
    return getErrorMessage(err);
  });

  const hasNextPage = computed(() => {
    return pagination.currentPage < paginationInfo.value.totalPages;
  });

  const hasPreviousPage = computed(() => {
    return pagination.currentPage > 1;
  });

  const paginationInfo = computed<PaginationInfo>(() => {
    const total = totalMessages.value || 0;
    const totalPages = total > 0 ? Math.ceil(total / pagination.pageSize) : 1;
    const start =
      total > 0 ? (pagination.currentPage - 1) * pagination.pageSize + 1 : 0;
    const end = Math.min(start + pagination.pageSize - 1, total);

    return {
      currentPage: pagination.currentPage,
      pageSize: pagination.pageSize,
      totalCount: total,
      totalPages,
      start,
      end,
      hasItems: total > 0,
    };
  });

  // Go to specific page
  async function goToPage(page: number) {
    if (page < 1) return;
    if (
      paginationInfo.value.totalCount > 0 &&
      page > paginationInfo.value.totalPages
    )
      return;
    if (page === pagination.currentPage) return;

    pagination.currentPage = page;
  }

  // Go to next page
  async function goToNextPage() {
    if (!hasNextPage.value) return;
    await goToPage(pagination.currentPage + 1);
  }

  // Go to previous page
  async function goToPreviousPage() {
    if (!hasPreviousPage.value) return;
    await goToPage(pagination.currentPage - 1);
  }

  async function setPageSize(size: number) {
    if (size === pagination.pageSize) return;

    pagination.pageSize = size;
    pagination.currentPage = 1;
  }

  async function handleRefresh() {
    pagination.currentPage = 1;
    await refetch();
  }

  async function deleteMessage(id: string) {
    if (!deleteMessageMutation) {
      throw new Error('Delete operation is not enabled for this message type');
    }
    await deleteMessageMutation.mutateAsync({ id });
  }

  async function requeueMessage(id: string) {
    if (!requeueMessageMutation) {
      throw new Error('Requeue operation is not enabled for this message type');
    }
    await requeueMessageMutation.mutateAsync({ id });
  }

  // Prefetch adjacent pages for smoother navigation
  watch(
    () => [pagination.currentPage, data.value],
    () => {
      if (!queueParams.value) return;
      if (!isEnabled.value) return; // Don't prefetch if not enabled

      const totalPages = paginationInfo.value.totalPages;

      // Prefetch next page
      if (pagination.currentPage < totalPages) {
        const nextPageKey = [
          config.queryKeyPrefix,
          queueParams.value.ns,
          queueParams.value.name,
          'page',
          pagination.currentPage + 1,
          'size',
          pagination.pageSize,
        ];

        queryClient.prefetchQuery({
          queryKey: nextPageKey,
          queryFn: async () => {
            if (!queueParams.value) return { data: { items: [] } };
            return config.queryFn({
              ns: queueParams.value.ns,
              name: queueParams.value.name,
              page: pagination.currentPage + 1,
              pageSize: pagination.pageSize,
            });
          },
        });
      }

      // Prefetch previous page
      if (pagination.currentPage > 1) {
        const prevPageKey = [
          config.queryKeyPrefix,
          queueParams.value.ns,
          queueParams.value.name,
          'page',
          pagination.currentPage - 1,
          'size',
          pagination.pageSize,
        ];

        queryClient.prefetchQuery({
          queryKey: prevPageKey,
          queryFn: async () => {
            if (!queueParams.value) return { data: { items: [] } };
            return config.queryFn({
              ns: queueParams.value.ns,
              name: queueParams.value.name,
              page: pagination.currentPage - 1,
              pageSize: pagination.pageSize,
            });
          },
        });
      }
    },
    { immediate: true },
  );

  return {
    messages,
    pagination: paginationInfo,
    isLoading,
    isFetching,
    isDeleting,
    isRequeuing,
    error,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    setPageSize,
    refresh: handleRefresh,
    deleteMessage: config.enableDelete ? deleteMessage : undefined,
    requeueMessage: config.enableRequeue ? requeueMessage : undefined,
    // Expose additional state
    totalMessages,
    hasNextPage,
    hasPreviousPage,
    currentPage: computed(() => pagination.currentPage),
    isSuccess, // Expose success state
    data, // Expose raw data for debugging
  };
}

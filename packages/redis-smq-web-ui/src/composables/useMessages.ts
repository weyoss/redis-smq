/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { computed, reactive, watch, type Ref, ref } from 'vue';
import { useInfiniteQuery, useQueryClient } from '@tanstack/vue-query';
import {
  useDeleteApiV1MessagesId,
  usePostApiV1MessagesIdRequeue,
} from '@/api/generated/messages/messages.ts';
import type { IQueueParams, IMessageTransferable } from '@/types/index.ts';
import { getErrorMessage } from '@/lib/error.ts';

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
    extraParams?: Record<string, unknown>;
  }) => Promise<MessagesApiResponse>;
  queryKeyPrefix: string;
  enableDelete?: boolean;
  enableRequeue?: boolean;
}

/**
 * A robust messages composable that:
 * - Fetches queue messages with variable-sized chunks (SSCAN-safe) using useInfiniteQuery.
 * - Buffers results and exposes stable page/pageSize UI pagination by slicing the buffer.
 * - Provides configurable delete and requeue mutations, with proper cache invalidation.
 * - Surfaces a single aggregated error for view components.
 * - Is reusable across different message types (regular, scheduled, dead-lettered, etc.)
 */
export function useMessages(
  queueParams: Ref<IQueueParams | null>,
  config: MessagesQueryConfig,
  initialPageSize = 20,
  extraParams: Ref<Record<string, unknown>> = ref({}), // 4th argument for extra parameters
) {
  const queryClient = useQueryClient();

  // Local UI pagination state (decoupled from backend chunking)
  const pagination = reactive({
    currentPage: 1,
    pageSize: initialPageSize,
  });

  // Stable query key per queue and message type
  const queryKey = computed(() => {
    if (!queueParams.value) return ['disabled'];

    const key = [
      config.queryKeyPrefix,
      queueParams.value.ns,
      queueParams.value.name,
    ];

    // Include extra parameters in query key for proper caching
    const extraParamsEntries = Object.entries(extraParams.value);
    if (extraParamsEntries.length > 0) {
      extraParamsEntries.forEach(([paramKey, paramValue]) => {
        if (paramValue !== undefined && paramValue !== null) {
          key.push(paramKey, String(paramValue));
        }
      });
    }

    return key;
  });

  // Helper to extract total count from different API payloads
  function extractTotalItems(payload: MessagesApiResponse): number {
    return payload?.data?.totalItems ?? 0;
  }

  // Infinite query fetching variable-sized chunks
  const {
    data,
    error: fetchError,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery<MessagesApiResponse>({
    queryKey,
    initialPageParam: 1,
    enabled: computed(() => {
      // Only enable query when queueParams is not null and has required fields
      return !!(queueParams.value?.ns && queueParams.value?.name);
    }),
    retry: (failureCount: number, err: unknown) => {
      // Do not retry on 422 Unprocessable Entity
      const errorWithStatus = err as ErrorWithStatus;
      const status =
        errorWithStatus?.status ?? errorWithStatus?.response?.status;
      if (status === 422) return false;
      return failureCount < 3;
    },
    queryFn: async ({ pageParam = 1 }) => {
      if (!queueParams.value) {
        throw new Error('Queue parameters are required');
      }

      return config.queryFn({
        ns: queueParams.value.ns,
        name: queueParams.value.name,
        page: Number(pageParam),
        pageSize: pagination.pageSize,
        extraParams: extraParams.value, // Pass extra parameters
      });
    },
    getNextPageParam: (
      lastPage: MessagesApiResponse,
      allPages: MessagesApiResponse[],
    ) => {
      const lastItems = lastPage?.data?.items ?? [];
      const total = extractTotalItems(allPages?.[0]);
      const buffered = allPages.flatMap(
        (p: MessagesApiResponse) => p?.data?.items ?? [],
      ).length;

      if (!lastItems.length || (total && buffered >= total)) {
        return undefined;
      }
      return allPages.length + 1;
    },
  });

  // Mutations (only create if enabled)
  const onMutationSuccess = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKey.value });
  };

  const deleteMessageMutation = config.enableDelete
    ? useDeleteApiV1MessagesId({
        mutation: { onSuccess: onMutationSuccess },
      })
    : null;

  const requeueMessageMutation = config.enableRequeue
    ? usePostApiV1MessagesIdRequeue({
        mutation: { onSuccess: onMutationSuccess },
      })
    : null;

  // Buffered messages
  const allMessages = computed<IMessageTransferable[]>(
    () => data.value?.pages.flatMap((p) => p?.data?.items ?? []) ?? [],
  );

  const totalMessages = computed<number>(() =>
    extractTotalItems(data.value?.pages?.[0] ?? {}),
  );

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

  // Slice buffer into fixed-size UI pages
  const messages = computed<IMessageTransferable[]>(() => {
    const start = (pagination.currentPage - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    return allMessages.value.slice(start, end);
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

  // Ensure buffer covers requested page; fetch chunks until it does.
  async function goToPage(page: number) {
    if (page < 1) return;
    pagination.currentPage = page;
    const required = page * pagination.pageSize;

    while (
      allMessages.value.length < required &&
      hasNextPage.value &&
      !isFetchingNextPage.value
    ) {
      await fetchNextPage();
    }
  }

  async function setPageSize(size: number) {
    pagination.pageSize = size;
    pagination.currentPage = 1;
    await refetch();
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

  // Reset when queue or extra parameters change
  watch(
    () => [
      queueParams.value && [queueParams.value.ns, queueParams.value.name],
      extraParams.value,
    ],
    async () => {
      if (queueParams.value) {
        pagination.currentPage = 1;
        await refetch();
      }
    },
    { deep: true },
  );

  return {
    messages,
    pagination: paginationInfo,
    isLoading,
    isDeleting,
    isRequeuing,
    error,
    goToPage,
    setPageSize,
    refresh: handleRefresh,
    deleteMessage: config.enableDelete ? deleteMessage : undefined,
    requeueMessage: config.enableRequeue ? requeueMessage : undefined,
    // Expose additional state for advanced use cases
    hasNextPage,
    isFetchingNextPage,
    totalMessages,
    allMessages,
  };
}

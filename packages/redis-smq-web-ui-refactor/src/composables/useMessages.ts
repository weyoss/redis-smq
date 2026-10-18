/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { computed, reactive, toValue, watch, type MaybeRefOrGetter } from 'vue';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import type {
  IBrowserPageIMessageTransferable,
  IQueueParams,
} from '@/api/model';
import {
  useDeleteMessageById,
  useRequeueMessageById,
} from '@/api/generated/messages/messages';
import { getErrorMessage } from '@/lib/error';

export interface MessagesListConfig {
  queryKeyPrefix: MaybeRefOrGetter<string>;
  queryFn: (params: {
    ns: string;
    name: string;
    page: number;
    pageSize: number;
  }) => Promise<{ data: IBrowserPageIMessageTransferable }>;
  enabled?: MaybeRefOrGetter<boolean>;
  enableDelete?: boolean;
  enableRequeue?: boolean;
}

export function useMessages(
  queue: MaybeRefOrGetter<IQueueParams | null>,
  config: MessagesListConfig,
  initialPageSize = 20,
) {
  const queryClient = useQueryClient();
  const pagination = reactive({ page: 1, pageSize: initialPageSize });

  const prefix = computed(() => toValue(config.queryKeyPrefix));
  const queueRef = computed(() => toValue(queue));

  const enabled = computed(() => {
    if (!queueRef.value) return false;
    return config.enabled === undefined ? true : toValue(config.enabled);
  });

  const queryKey = computed(() => {
    const q = queueRef.value;
    if (!q) return ['messages', prefix.value, 'disabled'] as const;
    return [
      'messages',
      prefix.value,
      q.ns,
      q.name,
      pagination.page,
      pagination.pageSize,
    ] as const;
  });

  const query = useQuery({
    queryKey,
    enabled,
    queryFn: async () => {
      const q = queueRef.value;
      if (!q) throw new Error('Queue is required');
      return config.queryFn({
        ns: q.ns,
        name: q.name,
        page: pagination.page,
        pageSize: pagination.pageSize,
      });
    },
    placeholderData: (prev) => prev,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  // Reset page when the queue changes — the only reason page lives here.
  watch(queueRef, (next, prev) => {
    if (next && (!prev || next.ns !== prev.ns || next.name !== prev.name)) {
      pagination.page = 1;
    }
  });

  function invalidate() {
    return queryClient.invalidateQueries({
      queryKey: ['messages', prefix.value],
    });
  }

  const deleteMutation = config.enableDelete
    ? useDeleteMessageById({ mutation: { onSuccess: () => invalidate() } })
    : null;
  const requeueMutation = config.enableRequeue
    ? useRequeueMessageById({
        mutation: { onSuccess: () => invalidate() },
      })
    : null;

  const items = computed(() => query.data.value?.data.items ?? []);
  const totalCount = computed(() => query.data.value?.data.totalItems ?? 0);

  const paginationInfo = computed(() => {
    const total = totalCount.value;
    const pageSize = pagination.pageSize;
    const totalPages = total > 0 ? Math.ceil(total / pageSize) : 1;
    const start = total > 0 ? (pagination.page - 1) * pageSize + 1 : 0;
    const end = Math.min(start + pageSize - 1, total);
    return {
      currentPage: pagination.page,
      pageSize,
      totalCount: total,
      totalPages,
      start,
      end,
      hasItems: total > 0,
    };
  });

  function goToPage(page: number) {
    const max = paginationInfo.value.totalPages;
    if (page < 1 || page > max || page === pagination.page) return;
    pagination.page = page;
  }

  function setPageSize(size: number) {
    if (size === pagination.pageSize) return;
    pagination.pageSize = size;
    pagination.page = 1;
  }

  function refresh() {
    return query.refetch();
  }

  return {
    query,
    items,
    pagination: paginationInfo,
    totalCount,
    isLoading: computed(() => query.isLoading.value),
    isFetching: computed(() => query.isFetching.value),
    error: computed(() => getErrorMessage(query.error.value) || null),
    goToPage,
    setPageSize,
    refresh,
    invalidate,

    isDeleting: computed(() => deleteMutation?.isPending.value ?? false),
    isRequeuing: computed(() => requeueMutation?.isPending.value ?? false),
    deleteMessage: deleteMutation
      ? (id: string) => deleteMutation.mutateAsync({ id })
      : undefined,
    requeueMessage: requeueMutation
      ? (id: string) => requeueMutation.mutateAsync({ id })
      : undefined,
  };
}

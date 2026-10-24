/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import type { IQueueParams, IQueueStateTransition } from '@/api/model';
import { useGetQueueStateHistory } from '@/api/generated/queue-operational-state/queue-operational-state';
import { getErrorMessage } from '@/lib/error';

export function useQueueStateHistory(
  queue: MaybeRefOrGetter<IQueueParams | null>,
) {
  const params = computed(() => toValue(queue));
  const enabled = computed(() => params.value !== null);

  const query = useGetQueueStateHistory(
    computed(() => params.value?.ns ?? ''),
    computed(() => params.value?.name ?? ''),
    { query: { enabled, staleTime: 30_000 } },
  );

  return {
    query,
    history: computed<IQueueStateTransition[]>(
      () => query.data.value?.data ?? [],
    ),
    isLoading: computed(() => query.isLoading.value),
    error: computed(() => getErrorMessage(query.error.value) || null),
    refetch: query.refetch,
  };
}

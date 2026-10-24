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
import { useGetQueueState } from '@/api/generated/queue-operational-state/queue-operational-state';
import { getErrorMessage } from '@/lib/error';

export function useQueueState(
  queue: MaybeRefOrGetter<IQueueParams | null>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  const params = computed(() => toValue(queue));
  const isEnabled = computed(() => toValue(enabled) && params.value !== null);

  const query = useGetQueueState(
    computed(() => params.value?.ns ?? ''),
    computed(() => params.value?.name ?? ''),
    {
      query: {
        enabled: isEnabled,
        staleTime: 10_000,
        refetchOnMount: 'always',
      },
    },
  );

  return {
    query,
    data: computed<IQueueStateTransition | null>(
      () => query.data.value?.data ?? null,
    ),
    isLoading: computed(() => query.isLoading.value),
    error: computed(() => getErrorMessage(query.error.value) || null),
    refetch: query.refetch,
  };
}

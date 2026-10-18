/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import type { IQueueConsumer, IQueueParams } from '@/api/model';
import { useGetQueueConsumers } from '@/api/generated/queue-consumers/queue-consumers';
import { getErrorMessage } from '@/lib/error';

export interface ConsumerWithId extends IQueueConsumer {
  id: string;
}

export function useQueueConsumers(
  queue: MaybeRefOrGetter<IQueueParams | null>,
) {
  const params = computed(() => toValue(queue));
  const enabled = computed(() => params.value !== null);

  const query = useGetQueueConsumers(
    computed(() => params.value?.ns ?? ''),
    computed(() => params.value?.name ?? ''),
    { query: { enabled, refetchInterval: 15_000 } },
  );

  const consumers = computed<ConsumerWithId[]>(() => {
    const data = query.data.value?.data ?? {};
    return Object.entries(data).map(([id, c]) => ({ id, ...c }));
  });

  return {
    query,
    consumers,
    count: computed(() => consumers.value.length),
    isLoading: computed(() => query.isLoading.value),
    error: computed(() => getErrorMessage(query.error.value) || null),
    refetch: query.refetch,
  };
}

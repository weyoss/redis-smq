/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import type { IQueueParams } from '@/api/model';
import { EQueueDeliveryModel } from '@/types/queues';
import { useGetQueueProperties } from '@/api/generated/queue/queue';
import { getErrorMessage } from '@/lib/error';

export function useQueueProperties(
  queue: MaybeRefOrGetter<IQueueParams | null>,
) {
  const params = computed(() => toValue(queue));
  const enabled = computed(() => params.value !== null);

  const query = useGetQueueProperties(
    computed(() => params.value?.ns ?? ''),
    computed(() => params.value?.name ?? ''),
    { query: { enabled, staleTime: 5_000 } },
  );

  const data = computed(() => query.data.value?.data ?? null);
  const isPubSub = computed(
    () => data.value?.deliveryModel === EQueueDeliveryModel.PUB_SUB,
  );

  return {
    query,
    data,
    isPubSub,
    isLoading: computed(() => query.isLoading.value),
    error: computed(() => getErrorMessage(query.error.value) || null),
    refetch: query.refetch,
  };
}

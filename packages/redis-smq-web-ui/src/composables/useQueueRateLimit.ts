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
import { useGetQueueRateLimit } from '@/api/generated/rate-limiting/rate-limiting';
import { getErrorMessage } from '@/lib/error';

export function useQueueRateLimit(
  queue: MaybeRefOrGetter<IQueueParams | null>,
) {
  const params = computed(() => toValue(queue));
  const enabled = computed(() => params.value !== null);

  const query = useGetQueueRateLimit(
    computed(() => params.value?.ns ?? ''),
    computed(() => params.value?.name ?? ''),
    { query: { enabled, retry: false } },
  );

  return {
    query,
    rateLimit: computed(() => query.data.value?.data ?? null),
    isLoading: computed(() => query.isLoading.value),
    error: computed(() => getErrorMessage(query.error.value) || null),
    refetch: query.refetch,
  };
}

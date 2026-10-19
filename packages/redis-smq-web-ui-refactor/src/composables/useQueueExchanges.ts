/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import type { IExchangeParsedParams, IQueueParams } from '@/api/model';
import { useGetQueueExchanges } from '@/api/generated/queue-exchanges/queue-exchanges';
import { getErrorMessage } from '@/lib/error';

export function useQueueExchanges(
  queue: MaybeRefOrGetter<IQueueParams | null>,
) {
  const params = computed(() => toValue(queue));
  const enabled = computed(() => params.value !== null);

  const query = useGetQueueExchanges(
    computed(() => params.value?.ns ?? ''),
    computed(() => params.value?.name ?? ''),
    { query: { enabled, staleTime: 15_000 } },
  );

  const exchanges = computed<IExchangeParsedParams[]>(
    () => query.data.value?.data ?? [],
  );

  return {
    query,
    exchanges,
    count: computed(() => exchanges.value.length),
    isLoading: computed(() => query.isLoading.value),
    error: computed(() => getErrorMessage(query.error.value) || null),
    refetch: query.refetch,
  };
}

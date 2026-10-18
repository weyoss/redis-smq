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
import { useGetBindings } from '@/api/generated/namespace-exchanges/namespace-exchanges';
import { getErrorMessage } from '@/lib/error';

export interface BindingGroup {
  key: string;
  queues: IQueueParams[];
}

const FANOUT_KEY = '_all';

export function useExchangeBindings(
  exchange: MaybeRefOrGetter<IExchangeParsedParams | null>,
) {
  const params = computed(() => toValue(exchange));
  const enabled = computed(() => params.value !== null);

  const query = useGetBindings(
    computed(() => params.value?.ns ?? ''),
    computed(() => params.value?.name ?? ''),
    {},
    { query: { enabled } },
  );

  const bindings = computed<BindingGroup[]>(() => {
    const data = query.data.value?.data;
    if (!data) return [];
    // Fanout returns IQueueParams[]; direct/topic return Record<string, IQueueParams[]>
    if (Array.isArray(data)) {
      return [{ key: FANOUT_KEY, queues: data }];
    }
    return Object.entries(data).map(([key, queues]) => ({ key, queues }));
  });

  const totalQueues = computed(() => {
    const seen = new Set<string>();
    for (const b of bindings.value) {
      for (const q of b.queues) seen.add(`${q.ns}/${q.name}`);
    }
    return seen.size;
  });

  return {
    query,
    bindings,
    totalQueues,
    isLoading: computed(() => query.isLoading.value),
    error: computed(() => getErrorMessage(query.error.value) || null),
    refetch: query.refetch,
  };
}

export { FANOUT_KEY };

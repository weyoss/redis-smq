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
import { EExchangeType } from '@/types/exchanges';

export interface BindingGroup {
  /**
   * `'routed'` for direct/topic exchanges (one group per routing key /
   * pattern), `'fanout'` for fanout exchanges (a single keyless group).
   */
  kind: 'fanout' | 'routed';
  /**
   * The routing key / pattern for `kind: 'routed'` groups. Always the
   * empty string for `kind: 'fanout'` groups (fanout ignores routing
   * keys). Using `''` rather than `undefined` keeps the field always
   * present, so consumers only need to check `kind` — no null checks.
   */
  key: string;
  queues: IQueueParams[];
}

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
    const ex = params.value;
    if (!data || !ex) return [];

    // `exchange.type` is the semantic source of truth; the runtime shape
    // of the response is a defensive guard in case the server ever
    // disagrees (it shouldn't — fanout returns IQueueParams[]; direct /
    // topic return Record<string, IQueueParams[]>).
    if (ex.type === EExchangeType.FANOUT) {
      const queues = Array.isArray(data) ? data : [];
      return [{ kind: 'fanout' as const, key: '', queues }];
    }

    const grouped: Record<string, IQueueParams[]> = Array.isArray(data)
      ? {}
      : data;
    return Object.entries(grouped).map(([key, queues]) => ({
      kind: 'routed' as const,
      key,
      queues,
    }));
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

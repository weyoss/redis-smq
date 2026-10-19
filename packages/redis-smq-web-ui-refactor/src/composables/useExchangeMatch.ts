/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */
import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import type { IQueueParams, MatchQueuesParams } from '@/api/model';
import { useMatchQueues } from '@/api/generated/namespace-exchanges/namespace-exchanges';
import { getErrorMessage } from '@/lib/error';

export function useExchangeMatch(
  ns: MaybeRefOrGetter<string>,
  exchange: MaybeRefOrGetter<string>,
  routingKey: MaybeRefOrGetter<string>,
  enabled: MaybeRefOrGetter<boolean> = true,
) {
  const nsRef = computed(() => toValue(ns));
  const exchangeRef = computed(() => toValue(exchange));
  const keyRef = computed(() => toValue(routingKey).trim());
  const isEnabled = computed(
    () => toValue(enabled) && !!nsRef.value && !!exchangeRef.value,
  );

  // Query params as an object — Orval's generated signature takes
  // MaybeRef<MatchQueuesParams>, not a bare string. When the key is
  // empty, `{}` is fine: `enabled` gates whether the request fires, and
  // fanout ignores `routingKey` anyway.
  const params = computed<MatchQueuesParams>(() => {
    const k = keyRef.value;
    return k === '' ? {} : { routingKey: k };
  });

  const query = useMatchQueues(nsRef, exchangeRef, params, {
    query: {
      enabled: isEnabled,
      retry: false,
      staleTime: 5_000,
    },
  });

  return {
    query,
    queues: computed<IQueueParams[]>(() => query.data.value?.data ?? []),
    isLoading: computed(() => query.isLoading.value),
    error: computed(() => getErrorMessage(query.error.value) || null),
    refetch: query.refetch,
  };
}

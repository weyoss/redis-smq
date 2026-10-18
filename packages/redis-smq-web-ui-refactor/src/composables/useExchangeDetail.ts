/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */
import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import type { IExchangeParsedParams } from '@/api/model';
import { useGetExchange } from '@/api/generated/namespace-exchanges/namespace-exchanges';
import { getErrorMessage } from '@/lib/error';

export function useExchangeDetail(
  exchange: MaybeRefOrGetter<{ ns: string; name: string } | null>,
) {
  const params = computed(() => toValue(exchange));
  const enabled = computed(() => params.value !== null);

  const query = useGetExchange(
    computed(() => params.value?.ns ?? ''),
    computed(() => params.value?.name ?? ''),
    { query: { enabled } },
  );

  return {
    query,
    data: computed<IExchangeParsedParams | null>(
      () => query.data.value?.data ?? null,
    ),
    isLoading: computed(() => query.isLoading.value),
    error: computed(() => getErrorMessage(query.error.value) || null),
    refetch: query.refetch,
  };
}

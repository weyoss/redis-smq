/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */
import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import { useGetNamespaceExchanges } from '@/api/generated/namespace-exchanges/namespace-exchanges';
import { getErrorMessage } from '@/lib/error';

export function useNamespaceExchanges(ns: MaybeRefOrGetter<string | null>) {
  const nsRef = computed(() => toValue(ns));
  const enabled = computed(() => !!nsRef.value);

  const query = useGetNamespaceExchanges(
    computed(() => nsRef.value ?? ''),
    { query: { enabled } },
  );

  return {
    query,
    exchanges: computed(() => query.data.value?.data ?? []),
    isLoading: computed(() => query.isLoading.value),
    error: computed(() => getErrorMessage(query.error.value) || null),
    refetch: query.refetch,
  };
}

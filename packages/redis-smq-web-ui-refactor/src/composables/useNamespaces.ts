/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */
import { computed } from 'vue';
import { useGetNamespaces } from '@/api/generated/namespaces/namespaces';
import { getErrorMessage } from '@/lib/error';

export function useNamespaces() {
  const query = useGetNamespaces();
  return {
    query,
    namespaces: computed(() => query.data.value?.data ?? []),
    isLoading: computed(() => query.isLoading.value),
    error: computed(() => getErrorMessage(query.error.value) || null),
    refetch: query.refetch,
  };
}

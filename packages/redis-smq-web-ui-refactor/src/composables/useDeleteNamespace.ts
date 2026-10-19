/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { computed } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
import { useDeleteNamespace as useOrvalDeleteNamespace } from '@/api/generated/namespaces/namespaces';
import { getGetNamespacesQueryKey } from '@/api/generated/namespaces/namespaces';
import { getGetAllQueuesQueryKey } from '@/api/generated/queues/queues';
import { getGetExchangesQueryKey } from '@/api/generated/exchanges/exchanges';
import { getErrorMessage } from '@/lib/error';

export function useDeleteNamespace(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  const mutation = useOrvalDeleteNamespace({
    mutation: {
      onSuccess: () => {
        // The namespace is gone; every list that could show it is stale.
        // TanStack's default invalidation matches by prefix, so these
        // exact keys also refetch every cached sub-query.
        queryClient.invalidateQueries({
          queryKey: getGetNamespacesQueryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: getGetAllQueuesQueryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: getGetExchangesQueryKey(),
        });
        onSuccess?.();
      },
    },
  });

  async function remove(ns: string): Promise<void> {
    await mutation.mutateAsync({ ns });
  }

  return {
    remove,
    isPending: computed(() => mutation.isPending.value),
    error: computed(() => getErrorMessage(mutation.error.value) || null),
    reset: mutation.reset,
  };
}

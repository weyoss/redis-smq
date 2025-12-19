/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { computed, ref, unref, type MaybeRef } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';

// Generated API hooks for Fanout exchange
import {
  // Queries
  useGetApiV1NamespacesNsExchangesFanoutFanoutQueues,
  getGetApiV1NamespacesNsExchangesFanoutFanoutQueuesQueryKey,
  // Mutations
  usePutApiV1NamespacesNsExchangesFanoutFanoutQueuesQueue,
  useDeleteApiV1NamespacesNsExchangesFanoutFanoutQueuesQueue,
  useDeleteApiV1NamespacesNsExchangesFanoutFanout,
} from '@/api/generated/fanout-exchange/fanout-exchange';

/**
 * Composable to manage Fanout exchanges in a given namespace:
 * - select a fanout exchange
 * - load bound queues
 * - bind/unbind a queue
 * - delete the fanout exchange
 *
 * Note: The generated API for fanout exchanges currently exposes queue listing/bind/unbind
 * and deleting a specific fanout exchange. It does not expose create/list all fanout exchanges.
 */
export function useFanoutExchanges(ns: MaybeRef<string>) {
  const queryClient = useQueryClient();

  // Selected fanout exchange name in the provided namespace
  const selectedFanout = ref<string | null>(null);
  const selectedFanoutForQuery = computed(() => selectedFanout.value ?? '');

  // Load queues bound to the selected fanout exchange
  const boundQueuesQuery = useGetApiV1NamespacesNsExchangesFanoutFanoutQueues(
    ns,
    selectedFanoutForQuery,
    {
      query: {
        // keep a bit of caching for UX and avoid flicker
        staleTime: 60_000,
      },
    },
  );

  // Normalized queues list (supports both array and { data } payload shapes)
  const boundQueues = computed(() => {
    const raw = boundQueuesQuery.data?.value;
    if (raw) {
      return raw.data;
    }
    return [];
  });

  // Mutations
  const bindQueueMutation =
    usePutApiV1NamespacesNsExchangesFanoutFanoutQueuesQueue({
      mutation: {
        onSuccess: (_res, variables) => {
          const { fanout } = variables;
          const key =
            getGetApiV1NamespacesNsExchangesFanoutFanoutQueuesQueryKey(
              unref(ns),
              fanout,
            );
          return queryClient.invalidateQueries({ queryKey: key });
        },
      },
    });

  const unbindQueueMutation =
    useDeleteApiV1NamespacesNsExchangesFanoutFanoutQueuesQueue({
      mutation: {
        onSuccess: (_res, variables) => {
          const { fanout } = variables;
          const key =
            getGetApiV1NamespacesNsExchangesFanoutFanoutQueuesQueryKey(
              unref(ns),
              fanout,
            );
          return queryClient.invalidateQueries({ queryKey: key });
        },
      },
    });

  const deleteFanoutMutation = useDeleteApiV1NamespacesNsExchangesFanoutFanout({
    mutation: {
      onSuccess: () => {
        // If we deleted the currently selected exchange, clear selection and its queues
        selectedFanout.value = null;
      },
    },
  });

  // Actions
  async function bindQueue(queue: string) {
    const fanout = selectedFanout.value;
    if (!fanout) throw new Error('No fanout exchange selected');
    return bindQueueMutation.mutateAsync({
      ns: unref(ns),
      fanout,
      queue,
    });
  }

  async function unbindQueue(queue: string) {
    const fanout = selectedFanout.value;
    if (!fanout) throw new Error('No fanout exchange selected');
    return unbindQueueMutation.mutateAsync({
      ns: unref(ns),
      fanout,
      queue,
    });
  }

  async function deleteSelectedFanout() {
    const fanout = selectedFanout.value;
    if (!fanout) throw new Error('No fanout exchange selected');
    return deleteFanoutMutation.mutateAsync({
      ns: unref(ns),
      fanout,
    });
  }

  function selectFanout(name: string | null) {
    selectedFanout.value = name;
  }

  // Expose state
  return {
    // selection
    selectedFanout,
    selectFanout,

    // bound queues
    boundQueues,
    isLoadingBoundQueues: boundQueuesQuery.isLoading,
    boundQueuesError: boundQueuesQuery.error,
    refreshBoundQueues: boundQueuesQuery.refetch,

    // actions
    bindQueue,
    unbindQueue,
    deleteSelectedFanout,

    // mutation states
    isBindingQueue: bindQueueMutation.isPending,
    bindQueueError: bindQueueMutation.error,

    isUnbindingQueue: unbindQueueMutation.isPending,
    unbindQueueError: unbindQueueMutation.error,

    isDeletingFanout: deleteFanoutMutation.isPending,
    deleteFanoutError: deleteFanoutMutation.error,
  };
}

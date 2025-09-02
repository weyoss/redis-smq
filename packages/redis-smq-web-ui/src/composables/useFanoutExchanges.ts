/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { computed, ref } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
import {
  getGetApiV1ExchangesFanOutQueryKey,
  useDeleteApiV1ExchangesFanOutFanOutName,
  useGetApiV1ExchangesFanOut,
  useGetApiV1ExchangesFanOutFanOutNameQueues,
  getGetApiV1ExchangesFanOutFanOutNameQueuesQueryKey,
  usePostApiV1ExchangesFanOut,
  usePutApiV1ExchangesFanOutFanOutNameQueues,
  useDeleteApiV1ExchangesFanOutFanOutNameQueues,
} from '@/api/generated/exchanges/exchanges.ts';
import type {
  PostApiV1ExchangesFanOutBody,
  PutApiV1ExchangesFanOutFanOutNameQueuesBody,
} from '@/api/model/index.ts';
import type { IQueueParams } from '@/types';

/**
 * Composable for managing fanout exchanges.
 * Provides reactive state, and methods for fetching, creating, deleting,
 * and binding/unbinding queues to exchanges.
 */
export function useFanoutExchanges() {
  const queryClient = useQueryClient();
  const fanoutExchangesQueryKey = getGetApiV1ExchangesFanOutQueryKey();

  // State for the currently selected exchange
  const selectedFanOutName = ref<string | null>(null);

  // A computed property that is always a string to satisfy the hook's type signature.
  const fanOutNameForQuery = computed(() => selectedFanOutName.value ?? '');

  // Query for fetching all fanout exchanges
  const {
    data: fanoutExchangesResponse,
    error: fanoutExchangesError,
    isLoading: isLoadingFanoutExchanges,
    refetch: refreshFanoutExchanges,
  } = useGetApiV1ExchangesFanOut({
    query: {
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  });

  // Query for fetching queues of the selected fanout exchange
  const {
    data: boundQueuesResponse,
    error: boundQueuesError,
    isLoading: isLoadingBoundQueues,
    refetch: refreshBoundQueues,
  } = useGetApiV1ExchangesFanOutFanOutNameQueues(fanOutNameForQuery, {
    query: {
      enabled: computed(() => !!selectedFanOutName.value),
    },
  });

  // Mutation for creating a new fanout exchange
  const createFanoutExchangeMutation = usePostApiV1ExchangesFanOut({
    mutation: {
      onSuccess: () => {
        return queryClient.invalidateQueries({
          queryKey: fanoutExchangesQueryKey,
        });
      },
    },
  });

  // Mutation for deleting a fanout exchange
  const deleteFanoutExchangeMutation = useDeleteApiV1ExchangesFanOutFanOutName({
    mutation: {
      onSuccess: (_, { fanOutName }) => {
        if (selectedFanOutName.value === fanOutName) {
          selectedFanOutName.value = null;
        }
        return queryClient.invalidateQueries({
          queryKey: fanoutExchangesQueryKey,
        });
      },
    },
  });

  // Mutation for binding a queue to a fanout exchange
  const bindQueueMutation = usePutApiV1ExchangesFanOutFanOutNameQueues({
    mutation: {
      onSuccess: (_, { fanOutName }) => {
        const boundQueuesQueryKey =
          getGetApiV1ExchangesFanOutFanOutNameQueuesQueryKey(fanOutName);
        return queryClient.invalidateQueries({ queryKey: boundQueuesQueryKey });
      },
    },
  });

  // Mutation for unbinding a queue from a fanout exchange
  const unbindQueueMutation = useDeleteApiV1ExchangesFanOutFanOutNameQueues({
    mutation: {
      onSuccess: (_, { fanOutName }) => {
        const boundQueuesQueryKey =
          getGetApiV1ExchangesFanOutFanOutNameQueuesQueryKey(fanOutName);
        return queryClient.invalidateQueries({
          queryKey: boundQueuesQueryKey,
        });
      },
    },
  });

  // Computed property for the list of all fanout exchanges
  const fanoutExchanges = computed<string[]>(
    () => fanoutExchangesResponse.value?.data ?? [],
  );

  // Computed property for a sorted list of fanout exchanges
  const sortedFanoutExchanges = computed(() => {
    return [...fanoutExchanges.value].sort((a, b) => a.localeCompare(b));
  });

  // Computed property for the queues bound to the selected exchange
  const boundQueues = computed(() => boundQueuesResponse.value?.data ?? []);

  // Computed states for mutations
  const isCreatingFanoutExchange = computed(
    () => createFanoutExchangeMutation.isPending.value,
  );
  const createFanoutExchangeError = computed(
    () => createFanoutExchangeMutation.error.value,
  );

  const isDeletingFanoutExchange = computed(
    () => deleteFanoutExchangeMutation.isPending.value,
  );
  const deleteFanoutExchangeError = computed(
    () => deleteFanoutExchangeMutation.error.value,
  );

  const isBindingQueue = computed(() => bindQueueMutation.isPending.value);
  const bindQueueError = computed(() => bindQueueMutation.error.value);

  const isUnbindingQueue = computed(() => unbindQueueMutation.isPending.value);
  const unbindQueueError = computed(() => unbindQueueMutation.error.value);

  // Action to create a fanout exchange
  async function createFanoutExchange(data: PostApiV1ExchangesFanOutBody) {
    return createFanoutExchangeMutation.mutateAsync({ data });
  }

  // Action to delete a fanout exchange
  async function deleteFanoutExchange(fanOutName: string) {
    return deleteFanoutExchangeMutation.mutateAsync({ fanOutName });
  }

  // Action to bind a queue to a fanout exchange
  async function bindQueueToFanoutExchange(
    fanOutName: string,
    data: PutApiV1ExchangesFanOutFanOutNameQueuesBody,
  ) {
    return bindQueueMutation.mutateAsync({ fanOutName, data });
  }

  // Action to unbind a queue from a fanout exchange
  async function unbindQueueFromFanoutExchange(
    fanOutName: string,
    queue: IQueueParams,
  ) {
    return unbindQueueMutation.mutateAsync({
      fanOutName,
      params: queue,
    });
  }

  // Action to select an exchange, which will trigger fetching its bound queues
  function selectFanOutExchange(fanOutName: string | null) {
    selectedFanOutName.value = fanOutName;
  }

  return {
    // Data
    sortedFanoutExchanges,
    selectedFanOutName,
    boundQueues,

    // Loading states
    isLoadingFanoutExchanges,
    isCreatingFanoutExchange,
    isDeletingFanoutExchange,
    isLoadingBoundQueues,
    isBindingQueue,
    isUnbindingQueue,

    // Errors
    fanoutExchangesError,
    createFanoutExchangeError,
    deleteFanoutExchangeError,
    boundQueuesError,
    bindQueueError,
    unbindQueueError,

    // Actions
    createFanoutExchange,
    deleteFanoutExchange,
    refreshFanoutExchanges,
    selectFanOutExchange,
    refreshBoundQueues,
    bindQueueToFanoutExchange,
    unbindQueueFromFanoutExchange,

    // Raw mutations for advanced usage
    createFanoutExchangeMutation,
    deleteFanoutExchangeMutation,
    bindQueueMutation,
    unbindQueueMutation,
  };
}

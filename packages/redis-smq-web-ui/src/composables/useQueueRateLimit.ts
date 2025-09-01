/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  useDeleteApiV1NamespacesNsQueuesNameRateLimit,
  useGetApiV1NamespacesNsQueuesNameRateLimit,
  usePutApiV1NamespacesNsQueuesNameRateLimit,
} from '@/api/generated/rate-limiting/rate-limiting.ts';
import type { PutApiV1NamespacesNsQueuesNameRateLimitBody } from '@/api/model';
import { computed } from 'vue';
import { useSelectedQueueStore } from '@/stores/selectedQueue.ts';

export function useQueueRateLimit() {
  const selectedQueueStore = useSelectedQueueStore();

  // Rate Limit Query
  const rateLimitQuery = useGetApiV1NamespacesNsQueuesNameRateLimit(
    computed(() => selectedQueueStore.selectedQueue?.ns || ''),
    computed(() => selectedQueueStore.selectedQueue?.name || ''),
    {
      query: {
        enabled: computed(
          () =>
            !!selectedQueueStore.selectedQueue?.ns &&
            !!selectedQueueStore.selectedQueue?.name,
        ),
        retry: false, // Don't retry if rate limit doesn't exist
      },
    },
  );

  // Rate Limit Mutations
  const setRateLimitMutation = usePutApiV1NamespacesNsQueuesNameRateLimit({
    mutation: {
      onSuccess: async () => {
        // Refetch rate limit data after successful update
        await rateLimitQuery.refetch();
      },
    },
  });

  const clearRateLimitMutation = useDeleteApiV1NamespacesNsQueuesNameRateLimit({
    mutation: {
      onSuccess: async () => {
        // Refetch rate limit data after successful deletion
        await rateLimitQuery.refetch();
      },
    },
  });

  // Computed properties for easy access to data
  const rateLimit = computed(() => rateLimitQuery.data.value);

  // Loading states
  const isLoadingRateLimit = computed(() => rateLimitQuery.isLoading.value);
  const isUpdatingRateLimit = computed(
    () => setRateLimitMutation.isPending.value,
  );
  const isClearingRateLimit = computed(
    () => clearRateLimitMutation.isPending.value,
  );

  // Combined loading state
  const isLoading = computed(
    () =>
      isLoadingRateLimit.value ||
      isUpdatingRateLimit.value ||
      isClearingRateLimit.value,
  );

  // Error states
  const rateLimitError = computed(() => rateLimitQuery.error.value);
  const setRateLimitError = computed(() => setRateLimitMutation.error.value);
  const clearRateLimitError = computed(
    () => clearRateLimitMutation.error.value,
  );

  // Combined error state
  const error = computed(
    () =>
      rateLimitError.value ||
      setRateLimitError.value ||
      clearRateLimitError.value,
  );

  // Computed getters
  const hasRateLimit = computed(() => {
    return !!rateLimit.value?.data;
  });

  // Rate limit operations
  async function setRateLimit(
    rateLimitData: PutApiV1NamespacesNsQueuesNameRateLimitBody,
  ): Promise<void> {
    if (!selectedQueueStore.selectedQueue) {
      throw new Error('No queue selected');
    }

    await setRateLimitMutation.mutateAsync({
      ...selectedQueueStore.selectedQueue,
      data: rateLimitData,
    });
  }

  async function clearRateLimit(): Promise<void> {
    if (!selectedQueueStore.selectedQueue) {
      throw new Error('No queue selected');
    }

    await clearRateLimitMutation.mutateAsync(selectedQueueStore.selectedQueue);
  }

  // Utility functions
  async function refreshRateLimit(): Promise<void> {
    await rateLimitQuery.refetch();
  }

  function refetchRateLimitData(): Promise<unknown> {
    if (!selectedQueueStore.selectedQueue) {
      return Promise.resolve();
    }
    return rateLimitQuery.refetch();
  }

  // Reset mutations (useful for clearing error states)
  function resetSetRateLimitMutation(): void {
    setRateLimitMutation.reset();
  }

  function resetClearRateLimitMutation(): void {
    clearRateLimitMutation.reset();
  }

  function resetAllMutations(): void {
    setRateLimitMutation.reset();
    clearRateLimitMutation.reset();
  }

  return {
    // Query objects (for direct access)
    rateLimitQuery,

    // Mutation objects (for direct access to mutate, mutateAsync, etc.)
    setRateLimitMutation,
    clearRateLimitMutation,

    // Data computed properties
    rateLimit,

    // Loading states
    isLoading,
    isLoadingRateLimit,
    isUpdatingRateLimit,
    isClearingRateLimit,

    // Error states
    error,
    rateLimitError,
    setRateLimitError,
    clearRateLimitError,

    // Computed getters
    hasRateLimit,

    // Actions
    setRateLimit,
    clearRateLimit,
    refreshRateLimit,
    refetchRateLimitData,

    // Mutation reset methods
    resetSetRateLimitMutation,
    resetClearRateLimitMutation,
    resetAllMutations,
  };
}

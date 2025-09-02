/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { useGetApiV1NamespacesNsQueuesNameTotalMessagesStats } from '@/api/generated/total-messages/total-messages.ts';
import { computed, type ComputedRef } from 'vue';
import { useSelectedQueueStore } from '@/stores/selectedQueue.ts';

export interface QueueStats {
  pending: number;
  acknowledged: number;
  deadLettered: number;
  scheduled: number;
}

export interface QueueStatsState {
  stats: ComputedRef<QueueStats>;
  totalMessages: ComputedRef<number>;
  isLoading: ComputedRef<boolean>;
  error: ComputedRef<unknown>;
  hasValidQueue: ComputedRef<boolean>;
  getPercentage: (value: number) => number;
  refetchAll: () => void;
}

// Helper function to safely convert API response values to numbers
function toNumber(value: unknown): number {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'object' && value !== null) {
    // Handle case where value is an object with string keys and number values
    // Sum all the numeric values in the object
    const obj = value as { [p: string]: number };
    return Object.values(obj).reduce((sum, num) => {
      return sum + num;
    }, 0);
  }
  return 0;
}

export function useQueueStats(): QueueStatsState {
  // Global state
  const selectedQueueStore = useSelectedQueueStore();
  const selectedQueue = computed(() => selectedQueueStore.selectedQueue);

  // Reactive properties for API calls
  const ns = computed(() => selectedQueue.value?.ns);
  const queueName = computed(() => selectedQueue.value?.name);
  const hasValidQueue = computed(() => !!(ns.value && queueName.value));

  const queryOptions = {
    query: {
      enabled: hasValidQueue,
      refetchOnWindowFocus: true,
      staleTime: 5000, // 5 seconds
      retry: 2,
      retryDelay: 1000,
    },
  };

  // Single API call for all queue statistics
  const statsQuery = useGetApiV1NamespacesNsQueuesNameTotalMessagesStats(
    computed(() => ns.value ?? ''),
    computed(() => queueName.value ?? ''),
    queryOptions,
  );

  // Loading state (simplified since we only have one query)
  const isLoading = computed(() => statsQuery.isLoading.value);

  // Error state (simplified since we only have one query)
  const error = computed(() => statsQuery.error.value);

  // Computed properties for stats with fallback values and proper type conversion
  const stats = computed(
    (): QueueStats => ({
      pending: toNumber(statsQuery.data.value?.data?.pending),
      acknowledged: toNumber(statsQuery.data.value?.data?.acknowledged),
      deadLettered: toNumber(statsQuery.data.value?.data?.deadLettered),
      scheduled: toNumber(statsQuery.data.value?.data?.scheduled),
    }),
  );

  const totalMessages = computed(() =>
    Object.values(stats.value).reduce((sum, count) => sum + count, 0),
  );

  // Calculate percentage safely
  function getPercentage(value: number): number {
    return totalMessages.value > 0 ? (value / totalMessages.value) * 100 : 0;
  }

  // Refetch statistics (simplified since we only have one query)
  function refetchAll(): void {
    if (!hasValidQueue.value) {
      console.warn('QueueStats: Cannot refetch - no valid queue selected');
      return;
    }

    statsQuery.refetch().catch((error) => {
      console.error('QueueStats: Error during refetch:', error);
    });
  }

  return {
    stats,
    totalMessages,
    isLoading,
    error,
    hasValidQueue,
    getPercentage,
    refetchAll,
  };
}

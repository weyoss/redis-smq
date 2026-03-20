/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { useGetApiNamespacesNsQueuesNameMessagesCount } from '@/api/generated/queue-messages/queue-messages.ts';
import { computed, type ComputedRef } from 'vue';
import { useSelectedQueueStore } from '@/stores/selectedQueue.ts';
import type { IQueuePublishedMessagesCountByStatus } from '@/api/model';

// Type for consumer group pending counts
export interface IQueueGroupConsumersPendingCount {
  [consumerGroupId: string]: number;
}

export interface QueueStats {
  pending: number | IQueueGroupConsumersPendingCount;
  acknowledged: number;
  deadLettered: number;
  scheduled: number;
  published?: number;
}

export interface QueueStatsState {
  stats: ComputedRef<QueueStats>;
  totalMessages: ComputedRef<number>;
  isLoading: ComputedRef<boolean>;
  error: ComputedRef<unknown>;
  hasValidQueue: ComputedRef<boolean>;
  getPercentage: (value: number) => number;
  refetchAll: () => void;
  isGroupedByStatus: ComputedRef<boolean>;
  hasConsumerGroups: ComputedRef<boolean>;
  getConsumerGroupPendingCount: (consumerGroupId: string) => number;
  getTotalPendingCount: ComputedRef<number>;
}

// Helper function to safely convert API response values to numbers
function processMessageCount(
  data: number | IQueuePublishedMessagesCountByStatus | undefined,
): QueueStats {
  const defaultStats: QueueStats = {
    pending: 0,
    acknowledged: 0,
    deadLettered: 0,
    scheduled: 0,
  };

  if (data === undefined) {
    return defaultStats;
  }

  // Case 1: data is a number (total count)
  if (typeof data === 'number') {
    return {
      ...defaultStats,
      pending: data,
      published: data,
    };
  }

  // Case 2: data is an object with status counts
  if (typeof data === 'object' && data !== null) {
    // Handle pending which could be number or consumer group object
    let pendingValue: number | IQueueGroupConsumersPendingCount = 0;

    if (typeof data.pending === 'number') {
      pendingValue = data.pending;
    } else if (typeof data.pending === 'object' && data.pending !== null) {
      // It's a consumer group pending count object
      pendingValue = { ...data.pending } as IQueueGroupConsumersPendingCount;
    }

    return {
      pending: pendingValue,
      acknowledged: data.acknowledged ?? 0,
      deadLettered: data.deadLettered ?? 0,
      scheduled: data.scheduled ?? 0,
    };
  }

  return defaultStats;
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

  // Single API call for all queue statistics with groupBy=status
  const statsQuery = useGetApiNamespacesNsQueuesNameMessagesCount(
    computed(() => ns.value ?? ''),
    computed(() => queueName.value ?? ''),
    {
      groupBy: 'status',
    },
    queryOptions,
  );

  // Determine if the response is grouped by status
  const isGroupedByStatus = computed(() => {
    const data = statsQuery.data.value?.data;
    return typeof data === 'object' && data !== null;
  });

  // Check if the queue has consumer groups (pending is an object)
  const hasConsumerGroups = computed(() => {
    const data = statsQuery.data.value?.data;
    return (
      typeof data === 'object' &&
      data !== null &&
      typeof data.pending === 'object' &&
      data.pending !== null
    );
  });

  // Loading state
  const isLoading = computed(() => statsQuery.isLoading.value);

  // Error state
  const error = computed(() => statsQuery.error.value);

  // Computed properties for stats with fallback values
  const stats = computed(() =>
    processMessageCount(statsQuery.data.value?.data),
  );

  // Get total pending count (sum of all consumer groups if needed)
  const getTotalPendingCount = computed<number>(() => {
    if (typeof stats.value.pending === 'number') {
      return stats.value.pending;
    }
    // Sum all consumer group pending counts
    return Object.values(stats.value.pending).reduce(
      (sum, count) => sum + count,
      0,
    );
  });

  // Get pending count for a specific consumer group
  function getConsumerGroupPendingCount(consumerGroupId: string): number {
    const pending = stats.value.pending;
    if (typeof pending === 'number') {
      return pending; // If no consumer groups, all pending messages count
    }
    return pending[consumerGroupId] || 0;
  }

  // Calculate total messages
  const totalMessages = computed(() => {
    const data = statsQuery.data.value?.data;

    // If it's a number, that's the total
    if (typeof data === 'number') {
      return data;
    }

    // If it's an object, sum all the values
    if (typeof data === 'object' && data !== null) {
      let total = 0;

      // Add acknowledged
      total += data.acknowledged ?? 0;

      // Add dead-lettered
      total += data.deadLettered ?? 0;

      // Add scheduled
      total += data.scheduled ?? 0;

      // Add pending (handling both number and object)
      if (typeof data.pending === 'number') {
        total += data.pending;
      } else if (typeof data.pending === 'object' && data.pending !== null) {
        total += Object.values(data.pending).reduce(
          (sum, count) => sum + count,
          0,
        );
      }

      return total;
    }

    return 0;
  });

  // Calculate percentage safely
  function getPercentage(value: number): number {
    const total = totalMessages.value;
    return total > 0 ? (value / total) * 100 : 0;
  }

  // Refetch statistics
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
    isGroupedByStatus,
    hasConsumerGroups,
    getConsumerGroupPendingCount,
    getTotalPendingCount,
  };
}

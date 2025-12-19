/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { useGetApiV1NamespacesNsQueuesNameConsumers } from '@/api/generated/consumers/consumers.ts';
import { computed, ref } from 'vue';
import { useSelectedQueueStore } from '@/stores/selectedQueue.ts';

// Define consumer data type based on API response
export type ConsumerData = {
  createdAt: number;
  hostname: string;
  ipAddress: string[];
  pid: number;
};

// Extended consumer type with ID for easier handling
export type Consumer = ConsumerData & {
  id: string;
  consumerId: string;
};

// Default refetch interval (in milliseconds)
const DEFAULT_REFETCH_INTERVAL = 5000; // 5 seconds

export function useQueueConsumers() {
  // Use queues store for selected queue
  const selectedQueueStore = useSelectedQueueStore();

  const refetchInterval = ref<number | false>(DEFAULT_REFETCH_INTERVAL);

  // Consumers Query - uses selectedQueue.selectedQueue
  const consumersQuery = useGetApiV1NamespacesNsQueuesNameConsumers(
    computed(() => selectedQueueStore.selectedQueue?.ns || ''),
    computed(() => selectedQueueStore.selectedQueue?.name || ''),
    {
      query: {
        enabled: computed(
          () =>
            !!selectedQueueStore.selectedQueue?.ns &&
            !!selectedQueueStore.selectedQueue?.name,
        ),
        refetchInterval: computed(() => refetchInterval.value), // Auto-refresh for real-time updates
        refetchIntervalInBackground: false, // Only when tab is active
      },
    },
  );

  // Computed properties for easy access to data
  const consumers = computed(() => consumersQuery.data.value);

  // Loading states
  const isLoadingConsumers = computed(() => consumersQuery.isLoading.value);
  const isRefetchingConsumers = computed(
    () => consumersQuery.isRefetching.value,
  );

  // Error states
  const consumersError = computed(() => consumersQuery.error.value);

  // Convert consumers object to array for easier processing
  const consumersArray = computed((): Consumer[] => {
    if (!consumers.value?.data) return [];

    return Object.entries(consumers.value.data).map(
      ([consumerId, consumerData]) => ({
        id: consumerId,
        consumerId,
        ...consumerData,
      }),
    );
  });

  // Get consumers as object (original structure)
  const consumersObject = computed(() => {
    return consumers.value?.data || {};
  });

  // Get consumer IDs
  const consumerIds = computed(() => {
    return Object.keys(consumersObject.value);
  });

  // Computed getters for consumers data
  const hasConsumers = computed(() => {
    return consumersArray.value.length > 0;
  });

  const sortedConsumers = computed(() => {
    return [...consumersArray.value].sort((a, b) => {
      // Sort by consumer ID
      return a.id.localeCompare(b.id);
    });
  });

  // Sort by creation time (newest first)
  const sortedConsumersByCreatedAt = computed(() => {
    return [...consumersArray.value].sort((a, b) => {
      return b.createdAt - a.createdAt;
    });
  });

  // Sort by hostname
  const sortedConsumersByHostname = computed(() => {
    return [...consumersArray.value].sort((a, b) => {
      return a.hostname.localeCompare(b.hostname);
    });
  });

  const consumerCount = computed(() => {
    return consumersArray.value.length;
  });

  // Group consumers by hostname
  const consumersByHostname = computed(() => {
    const grouped: Record<string, Consumer[]> = {};

    consumersArray.value.forEach((consumer) => {
      if (!grouped[consumer.hostname]) {
        grouped[consumer.hostname] = [];
      }
      grouped[consumer.hostname].push(consumer);
    });

    return grouped;
  });

  // Get unique hostnames
  const uniqueHostnames = computed(() => {
    return [
      ...new Set(consumersArray.value.map((consumer) => consumer.hostname)),
    ].sort();
  });

  // Consumer statistics
  const consumerStats = computed(() => {
    const stats = {
      total: consumersArray.value.length,
      uniqueHostnames: uniqueHostnames.value.length,
      averageCreatedAt: 0,
      oldestConsumer: null as Consumer | null,
      newestConsumer: null as Consumer | null,
    };

    if (consumersArray.value.length > 0) {
      // Calculate average creation time
      const totalCreatedAt = consumersArray.value.reduce(
        (sum, consumer) => sum + consumer.createdAt,
        0,
      );
      stats.averageCreatedAt = totalCreatedAt / consumersArray.value.length;

      // Find oldest and newest consumers
      const sortedByCreatedAt = [...consumersArray.value].sort(
        (a, b) => a.createdAt - b.createdAt,
      );
      stats.oldestConsumer = sortedByCreatedAt[0];
      stats.newestConsumer = sortedByCreatedAt[sortedByCreatedAt.length - 1];
    }

    return stats;
  });

  // Utility functions
  async function refreshConsumers(): Promise<void> {
    await consumersQuery.refetch();
  }

  function refetchConsumersData(): Promise<unknown> {
    if (!selectedQueueStore.selectedQueue) {
      return Promise.resolve();
    }
    return consumersQuery.refetch();
  }

  // Enable/disable real-time updates
  function enableRealTimeUpdates(): void {
    refetchInterval.value = DEFAULT_REFETCH_INTERVAL;
    console.log(
      `Real-time updates enabled with ${DEFAULT_REFETCH_INTERVAL}ms interval`,
    );
  }

  function disableRealTimeUpdates(): void {
    refetchInterval.value = false;
    console.log('Real-time updates disabled');
  }

  // Consumer filtering and searching
  function findConsumerById(consumerId: string): Consumer | null {
    return (
      consumersArray.value.find((consumer) => consumer.id === consumerId) ||
      null
    );
  }

  function getConsumerData(consumerId: string): ConsumerData | null {
    return consumersObject.value[consumerId] || null;
  }

  function getConsumersByHostname(hostname: string): Consumer[] {
    return consumersArray.value.filter(
      (consumer) => consumer.hostname === hostname,
    );
  }

  function getConsumersByPid(pid: number): Consumer[] {
    return consumersArray.value.filter((consumer) => consumer.pid === pid);
  }

  function getConsumersCreatedAfter(timestamp: number): Consumer[] {
    return consumersArray.value.filter(
      (consumer) => consumer.createdAt > timestamp,
    );
  }

  function getConsumersCreatedBefore(timestamp: number): Consumer[] {
    return consumersArray.value.filter(
      (consumer) => consumer.createdAt < timestamp,
    );
  }

  // Search consumers by various criteria
  function searchConsumers(query: string): Consumer[] {
    const lowerQuery = query.toLowerCase();
    return consumersArray.value.filter(
      (consumer) =>
        consumer.id.toLowerCase().includes(lowerQuery) ||
        consumer.hostname.toLowerCase().includes(lowerQuery) ||
        consumer.pid.toString().includes(lowerQuery) ||
        consumer.ipAddress.some((ip) => ip.includes(query)),
    );
  }

  // Validation helpers
  function isValidConsumerId(consumerId: string): boolean {
    return !!consumerId && consumerId.trim().length > 0;
  }

  function hasConsumerWithId(consumerId: string): boolean {
    return consumerId in consumersObject.value;
  }

  // Queue validation
  function isValidQueue(): boolean {
    return (
      !!selectedQueueStore.selectedQueue?.ns &&
      !!selectedQueueStore.selectedQueue?.name
    );
  }

  function getQueueDisplayName(): string {
    if (!selectedQueueStore.selectedQueue) return '';
    return `${selectedQueueStore.selectedQueue.ns}/${selectedQueueStore.selectedQueue.name}`;
  }

  function getConsumerUptime(consumer: Consumer): number {
    return Date.now() - consumer.createdAt;
  }

  return {
    // Expose queues store for convenience
    queuesStore: selectedQueueStore,

    // Query objects (for direct access)
    consumersQuery,

    // Data computed properties
    consumers,
    consumersArray,
    consumersObject,
    consumerIds,

    // Loading states
    isLoadingConsumers,
    isRefetchingConsumers,

    // Error states
    consumersError,

    // Computed getters
    hasConsumers,
    sortedConsumers,
    sortedConsumersByCreatedAt,
    sortedConsumersByHostname,
    consumerCount,
    consumersByHostname,
    uniqueHostnames,
    consumerStats,

    // Actions
    refreshConsumers,
    refetchConsumersData,
    enableRealTimeUpdates,
    disableRealTimeUpdates,

    // Consumer operations
    findConsumerById,
    getConsumerData,
    getConsumersByHostname,
    getConsumersByPid,
    getConsumersCreatedAfter,
    getConsumersCreatedBefore,
    searchConsumers,

    // Helper methods
    isValidConsumerId,
    hasConsumerWithId,
    isValidQueue,
    getQueueDisplayName,
    getConsumerUptime,
  };
}

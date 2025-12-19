/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { useGetApiV1NamespacesNsQueuesName } from '@/api/generated/queue/queue.ts';
import { EQueueDeliveryModel } from '@/types/index.ts';
import { defineStore } from 'pinia';
import { computed } from 'vue';
import { useSelectedQueueStore } from '@/stores/selectedQueue.ts';

export const useSelectedQueuePropertiesStore = defineStore(
  'queueProperties',
  () => {
    const selectedQueueStore = useSelectedQueueStore();

    const selectedQueue = computed(() => {
      return selectedQueueStore.selectedQueue;
    });

    // Queue Properties Query
    const queuePropertiesQuery = useGetApiV1NamespacesNsQueuesName(
      computed(() => selectedQueue.value?.ns || ''),
      computed(() => selectedQueue.value?.name || ''),
      {
        query: {
          enabled: computed(() => !!selectedQueue.value),
        },
      },
    );

    // watch(
    //   selectedQueue,
    //   async (newQueue, oldQueue) => {
    //     if (
    //       newQueue &&
    //       (!oldQueue ||
    //         newQueue.ns !== oldQueue.ns ||
    //         newQueue.name !== oldQueue.name)
    //     ) {
    //       // Immediately fetch when queue changes
    //       await queuePropertiesQuery.refetch();
    //     }
    //   },
    //   { immediate: true },
    // );

    // Computed properties for easy access to data
    const queueProperties = computed(() => queuePropertiesQuery.data.value);

    // Loading states
    const isLoadingQueueProperties = computed(
      () => queuePropertiesQuery.isLoading.value,
    );

    // Error states
    const queuePropertiesError = computed(
      () => queuePropertiesQuery.error.value,
    );

    // Computed getters for queue properties
    const isPubSubQueue = computed(() => {
      return (
        queueProperties.value?.data.deliveryModel ===
        EQueueDeliveryModel.PUB_SUB
      );
    });

    const isPointToPointQueue = computed(() => {
      return (
        queueProperties.value?.data.deliveryModel ===
        EQueueDeliveryModel.POINT_TO_POINT
      );
    });

    const queueType = computed(() => {
      return queueProperties.value?.data.queueType;
    });

    const queueDeliveryModel = computed(() => {
      return queueProperties.value?.data.deliveryModel;
    });

    const hasQueueProperties = computed(() => {
      return !!queueProperties.value?.data;
    });

    // Utility functions
    async function refreshQueueProperties(): Promise<void> {
      await queuePropertiesQuery.refetch();
    }

    return {
      // Query objects (for direct access)
      queuePropertiesQuery,

      // Data computed properties
      queueProperties,

      // Loading states
      isLoadingQueueProperties,

      // Error states
      queuePropertiesError,

      // Computed getters
      isPubSubQueue,
      isPointToPointQueue,
      queueType,
      queueDeliveryModel,
      hasQueueProperties,

      // Actions
      refreshQueueProperties,
    };
  },
);

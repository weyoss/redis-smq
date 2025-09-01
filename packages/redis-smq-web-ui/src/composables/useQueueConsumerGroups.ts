/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  useGetApiV1NamespacesNsQueuesNameConsumerGroups,
  usePostApiV1NamespacesNsQueuesNameConsumerGroups,
  useDeleteApiV1NamespacesNsQueuesNameConsumerGroupsConsumerGroupId,
} from '@/api/generated/consumer-groups/consumer-groups.ts';
import type { PostApiV1NamespacesNsQueuesNameConsumerGroupsBody } from '@/api/model';
import { useSelectedQueuePropertiesStore } from '@/stores/selectedQueueProperties.ts';
import { computed } from 'vue';
import { useSelectedQueueStore } from '@/stores/selectedQueue.ts';

export function useQueueConsumerGroups() {
  const selectedQueueStore = useSelectedQueueStore();
  const queuePropertiesStore = useSelectedQueuePropertiesStore();

  const selectedQueue = computed(() => {
    return selectedQueueStore.selectedQueue;
  });

  // Consumer Groups Query
  const consumerGroupsQuery = useGetApiV1NamespacesNsQueuesNameConsumerGroups(
    computed(() => selectedQueue.value?.ns || ''),
    computed(() => selectedQueue.value?.name || ''),
    {
      query: {
        enabled: computed(
          () => !!selectedQueue.value && queuePropertiesStore.isPubSubQueue,
        ),
      },
    },
  );

  // Consumer Groups Mutations
  const createConsumerGroupMutation =
    usePostApiV1NamespacesNsQueuesNameConsumerGroups({
      mutation: {
        onSuccess: async () => {
          // Refetch consumer groups after successful creation
          await consumerGroupsQuery.refetch();
        },
      },
    });

  const deleteConsumerGroupMutation =
    useDeleteApiV1NamespacesNsQueuesNameConsumerGroupsConsumerGroupId({
      mutation: {
        onSuccess: async () => {
          // Refetch consumer groups after successful deletion
          await consumerGroupsQuery.refetch();
        },
      },
    });

  // Computed properties for easy access to data
  const consumerGroups = computed(() => consumerGroupsQuery.data.value);

  // Loading states
  const isLoadingConsumerGroups = computed(
    () => consumerGroupsQuery.isLoading.value,
  );
  const isCreatingConsumerGroup = computed(
    () => createConsumerGroupMutation.isPending.value,
  );
  const isDeletingConsumerGroup = computed(
    () => deleteConsumerGroupMutation.isPending.value,
  );

  // Combined loading state
  const isLoading = computed(
    () =>
      isLoadingConsumerGroups.value ||
      isCreatingConsumerGroup.value ||
      isDeletingConsumerGroup.value,
  );

  // Error states
  const consumerGroupsError = computed(() => consumerGroupsQuery.error.value);
  const createConsumerGroupError = computed(
    () => createConsumerGroupMutation.error.value,
  );
  const deleteConsumerGroupError = computed(
    () => deleteConsumerGroupMutation.error.value,
  );

  // Combined error state
  const error = computed(
    () =>
      consumerGroupsError.value ||
      createConsumerGroupError.value ||
      deleteConsumerGroupError.value,
  );

  // Computed getters
  const hasConsumerGroups = computed(() => {
    return (
      queuePropertiesStore.isPubSubQueue &&
      !!consumerGroups.value?.data &&
      Array.isArray(consumerGroups.value.data) &&
      consumerGroups.value.data.length > 0
    );
  });

  const sortedConsumerGroups = computed(() => {
    if (!consumerGroups.value?.data) return [];
    return [...consumerGroups.value.data].sort((a, b) => a.localeCompare(b));
  });

  // Consumer group operations
  async function createConsumerGroup(consumerGroupId: string): Promise<void> {
    if (!selectedQueue.value) {
      throw new Error('No queue selected');
    }

    const payload: PostApiV1NamespacesNsQueuesNameConsumerGroupsBody = {
      consumerGroupId,
    };

    await createConsumerGroupMutation.mutateAsync({
      ns: selectedQueue.value.ns,
      name: selectedQueue.value.name,
      data: payload,
    });
  }

  async function deleteConsumerGroup(consumerGroupId: string): Promise<void> {
    if (!selectedQueue.value) {
      throw new Error('No queue selected');
    }

    await deleteConsumerGroupMutation.mutateAsync({
      ns: selectedQueue.value.ns,
      name: selectedQueue.value.name,
      consumerGroupId,
    });
  }

  // Utility functions
  async function refreshConsumerGroups(): Promise<void> {
    await consumerGroupsQuery.refetch();
  }

  function refetchConsumerGroupsData(): Promise<unknown> {
    if (!selectedQueue.value || !queuePropertiesStore.isPubSubQueue) {
      return Promise.resolve();
    }
    return consumerGroupsQuery.refetch();
  }

  // Reset mutations (useful for clearing error states)
  function resetCreateConsumerGroupMutation(): void {
    createConsumerGroupMutation.reset();
  }

  function resetDeleteConsumerGroupMutation(): void {
    deleteConsumerGroupMutation.reset();
  }

  function resetAllMutations(): void {
    createConsumerGroupMutation.reset();
    deleteConsumerGroupMutation.reset();
  }

  // Validation helpers
  function isValidConsumerGroupId(id: string): boolean {
    const validPattern = /^[a-zA-Z0-9_-]+$/;
    return validPattern.test(id) && id.length >= 1 && id.length <= 50;
  }

  function consumerGroupExists(consumerGroupId: string): boolean {
    if (!consumerGroups.value?.data) return false;
    return consumerGroups.value.data.includes(consumerGroupId);
  }

  return {
    // Query objects (for direct access)
    consumerGroupsQuery,

    // Mutation objects (for direct access to mutate, mutateAsync, etc.)
    createConsumerGroupMutation,
    deleteConsumerGroupMutation,

    // Data computed properties
    consumerGroups,

    // Loading states
    isLoading,
    isLoadingConsumerGroups,
    isCreatingConsumerGroup,
    isDeletingConsumerGroup,

    // Error states
    error,
    consumerGroupsError,
    createConsumerGroupError,
    deleteConsumerGroupError,

    // Computed getters
    hasConsumerGroups,
    sortedConsumerGroups,

    // Actions
    createConsumerGroup,
    deleteConsumerGroup,
    refreshConsumerGroups,
    refetchConsumerGroupsData,

    // Mutation reset methods
    resetCreateConsumerGroupMutation,
    resetDeleteConsumerGroupMutation,
    resetAllMutations,

    // Helper methods
    isValidConsumerGroupId,
    consumerGroupExists,
  };
}

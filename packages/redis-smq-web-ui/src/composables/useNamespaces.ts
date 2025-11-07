/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  useGetApiV1Namespaces,
  useGetApiV1NamespacesNsQueues,
  useDeleteApiV1NamespacesNs,
} from '@/api/generated/namespaces/namespaces.ts';
import { computed } from 'vue';
import { useSelectedNamespaceStore } from '@/stores/selectedNamespace.ts';

export function useNamespaces() {
  const selectedNamespaceStore = useSelectedNamespaceStore();

  const selectedNamespace = computed(
    () => selectedNamespaceStore.selectedNamespace,
  );

  // Namespace Queries
  const namespacesQuery = useGetApiV1Namespaces();

  const namespaceQueuesQuery = useGetApiV1NamespacesNsQueues(
    computed(() => selectedNamespace.value || ''),
    {
      query: {
        enabled: computed(() => !!selectedNamespace.value),
      },
    },
  );

  // Mutations with automatic refetching
  const deleteNamespaceMutation = useDeleteApiV1NamespacesNs({
    mutation: {
      onSuccess: async () => {
        // Clear selected namespace and refetch namespaces
        selectedNamespaceStore.clearSelectedNamespace();
        await namespacesQuery.refetch();
      },
    },
  });

  // Computed properties for easy access to data
  const namespaces = computed(() => namespacesQuery.data.value);
  const namespaceQueues = computed(() => namespaceQueuesQuery.data.value);

  // Loading states
  const isLoadingNamespaces = computed(() => namespacesQuery.isLoading.value);
  const isLoadingNamespaceQueues = computed(
    () => namespaceQueuesQuery.isLoading.value,
  );

  // Mutation loading states
  const isDeletingNamespace = computed(
    () => deleteNamespaceMutation.isPending.value,
  );

  // Combined loading state
  const isLoading = computed(
    () =>
      isLoadingNamespaces.value ||
      isLoadingNamespaceQueues.value ||
      isDeletingNamespace.value,
  );

  // Error states
  const namespacesError = computed(() => namespacesQuery.error.value);
  const namespaceQueuesError = computed(() => namespaceQueuesQuery.error.value);

  // Mutation error states
  const deleteNamespaceError = computed(
    () => deleteNamespaceMutation.error.value,
  );

  // Combined error state
  const error = computed(
    () =>
      namespacesError.value ||
      namespaceQueuesError.value ||
      deleteNamespaceError.value,
  );

  // Computed getters for namespaces
  const sortedNamespaces = computed(() => {
    if (!namespaces.value?.data.length) return [];
    return [...namespaces.value.data].sort((a, b) => a.localeCompare(b));
  });

  const sortedNamespaceQueues = computed(() => {
    if (!namespaceQueues.value?.data.length) return [];
    return [...namespaceQueues.value.data].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  });

  // Namespace-related computed properties
  const hasNamespaces = computed(() => {
    return !!namespaces.value?.data && namespaces.value.data.length > 0;
  });

  const hasNamespaceQueues = computed(() => {
    return (
      !!namespaceQueues.value?.data && namespaceQueues.value.data.length > 0
    );
  });

  const namespaceExists = computed(() => {
    return (ns: string) => {
      if (!namespaces.value?.data) return false;
      return namespaces.value.data.includes(ns);
    };
  });

  // Namespace-specific actions
  async function refreshNamespaces(): Promise<void> {
    await namespacesQuery.refetch();
  }

  async function refreshNamespaceQueues(ns?: string): Promise<void> {
    const targetNamespace = ns || selectedNamespace.value;
    if (targetNamespace) {
      // Temporarily set namespace if provided
      const originalNamespace = selectedNamespace.value;
      if (ns && ns !== selectedNamespace.value) {
        selectedNamespaceStore.selectNamespace(ns);
      }

      try {
        await namespaceQueuesQuery.refetch();
      } finally {
        // Restore original namespace if we changed it
        if (ns && ns !== originalNamespace) {
          if (originalNamespace)
            selectedNamespaceStore.selectNamespace(originalNamespace);
          else selectedNamespaceStore.clearSelectedNamespace();
        }
      }
    }
  }

  async function deleteNamespace(ns: string): Promise<void> {
    await deleteNamespaceMutation.mutateAsync({ ns });
  }

  function refetchNamespaceData(ns?: string): Promise<unknown[]> {
    const targetNamespace = ns || selectedNamespace.value;
    if (!targetNamespace) {
      return Promise.resolve([]);
    }

    const promises: Promise<unknown>[] = [namespacesQuery.refetch()];

    // If the target namespace is currently selected, refetch its queues
    if (targetNamespace === selectedNamespace.value) {
      promises.push(namespaceQueuesQuery.refetch());
    }

    return Promise.all(promises);
  }

  // Validation helpers
  function isValidNamespace(ns: string): boolean {
    return !!ns && ns.trim().length > 0;
  }

  return {
    // Query objects (for direct access)
    namespacesQuery,
    namespaceQueuesQuery,

    // Mutation objects (for direct access to mutate, mutateAsync, etc.)
    deleteNamespaceMutation,

    // Data computed properties
    namespaces,
    namespaceQueues,

    // Loading states
    isLoading,
    isLoadingNamespaces,
    isLoadingNamespaceQueues,
    isDeletingNamespace,

    // Error states
    error,
    namespacesError,
    namespaceQueuesError,
    deleteNamespaceError,

    // Computed getters
    sortedNamespaces,
    sortedNamespaceQueues,
    hasNamespaces,
    hasNamespaceQueues,
    namespaceExists,

    // Actions
    refreshNamespaces,
    refreshNamespaceQueues,
    deleteNamespace,
    refetchNamespaceData,

    // Helper methods
    isValidNamespace,
  };
}

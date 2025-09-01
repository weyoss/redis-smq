<!--
  - Copyright (c)
  - Weyoss <weyoss@protonmail.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import type { IQueueParams } from '@/types/index.js';
import { computed, onMounted, ref, watchEffect } from 'vue';
import { useRouter } from 'vue-router';
import { useNamespaces } from '@/composables/useNamespaces.ts';
import { usePageContentStore, type PageAction } from '@/stores/pageContent';

import PageContent from '@/components/PageContent.vue';
import NamespaceCard from '@/components/cards/NamespaceCard.vue';
import DeleteNamespaceModal from '@/components/modals/DeleteNamespaceModal.vue';
import { getErrorMessage } from '@/lib/error.ts';
import { useSelectedQueueStore } from '@/stores/selectedQueue.ts';
import { useSelectedNamespaceStore } from '@/stores/selectedNamespace.ts';
import { useListQueues } from '@/composables/useListQueues.ts';

const router = useRouter();
const namespaces = useNamespaces();
const listQueues = useListQueues();
const selectedQueueStore = useSelectedQueueStore();
const selectedNamespaceStore = useSelectedNamespaceStore();
const pageContentStore = usePageContentStore();

// Local state for modal visibility
const showDeleteModal = ref(false);
const namespaceToDelete = ref<string | null>(null);

// Computed state from stores
const sortedNamespaces = computed(() => namespaces.sortedNamespaces.value);
const isLoading = computed(() => namespaces.isLoadingNamespaces.value);
const error = computed(() => namespaces.namespacesError.value);
const isDeletingNamespace = computed(
  () => namespaces.isDeletingNamespace.value,
);
const deleteError = computed(() => namespaces.deleteNamespaceError.value);
const hasNamespaces = computed(() => sortedNamespaces.value.length > 0);

// Page content definitions
const pageTitle = 'Namespaces';
const pageSubtitle = 'Organize and manage your message queue namespaces';

const pageActions = computed((): PageAction[] => [
  {
    id: 'refresh-namespaces',
    label: 'Refresh',
    icon: 'bi bi-arrow-clockwise',
    variant: 'primary',
    disabled: isLoading.value,
    loading: isLoading.value,
    handler: handleRefresh,
  },
]);

// Event Handlers
function handleRefresh() {
  namespaces.refreshNamespaces();
}

function goToCreateQueue() {
  router.push({ name: 'Queues' });
}

function goToNamespace(namespace: string) {
  selectedNamespaceStore.selectNamespace(namespace);
  router.push({ name: 'Namespace Queues', params: { ns: namespace } });
}

function goToQueueDetails(queue: IQueueParams): void {
  selectedQueueStore.selectQueue(queue.ns, queue.name);
  router.push({ name: 'Queue', params: { ns: queue.ns, queue: queue.name } });
}

function confirmDelete(namespace: string) {
  namespaceToDelete.value = namespace;
  showDeleteModal.value = true;
}

function cancelDelete() {
  showDeleteModal.value = false;
  namespaceToDelete.value = null;
}

async function deleteNamespace() {
  if (!namespaceToDelete.value) return;
  try {
    await namespaces.deleteNamespace(namespaceToDelete.value);
    cancelDelete();
  } catch (error) {
    // Error is handled by the store and displayed in the modal
    console.error('Failed to delete namespace:', error);
  }
}

// Sync component state with the page content store
watchEffect(() => {
  pageContentStore.setPageHeader({
    title: pageTitle,
    subtitle: pageSubtitle,
    icon: 'bi bi-folder',
  });
  pageContentStore.setPageActions(pageActions.value);
  pageContentStore.setLoadingState(isLoading.value);

  if (error.value) {
    pageContentStore.setErrorState(getErrorMessage(error.value));
    pageContentStore.setEmptyState(false);
  } else if (!isLoading.value && !hasNamespaces.value) {
    pageContentStore.setErrorState(null);
    pageContentStore.setEmptyState(true, {
      icon: 'bi bi-folder-plus',
      title: 'No Namespaces Found',
      message:
        'Namespaces are created automatically when you create queues. Start by creating your first queue.',
      actionLabel: 'Create Queue',
      actionHandler: goToCreateQueue,
    });
  } else {
    pageContentStore.setErrorState(null);
    pageContentStore.setEmptyState(false);
  }
});

// Clear selections when navigating to this top-level view
watchEffect(() => {
  selectedQueueStore.clearSelectedQueue();
});

onMounted(() => {
  handleRefresh();
});
</script>

<template>
  <div>
    <PageContent>
      <!-- The content below is only rendered when not loading, not in an error state, and not empty -->

      <!-- Deletion Error Banner -->
      <div
        v-if="deleteError && !showDeleteModal"
        class="alert alert-warning alert-dismissible fade show mb-4"
        role="alert"
      >
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        {{ getErrorMessage(deleteError) }}
        <button
          type="button"
          class="btn-close"
          aria-label="Close"
          @click="namespaces.deleteNamespaceMutation.reset()"
        ></button>
      </div>

      <!-- Namespaces Grid -->
      <div class="namespaces-grid">
        <NamespaceCard
          v-for="namespace in sortedNamespaces"
          :key="namespace"
          :namespace="namespace"
          :queue-count="listQueues.getNamespaceQueueCount.value(namespace)"
          :recent-queues="
            listQueues.getQueuesInNamespace(namespace).slice(0, 3)
          "
          :is-deleting="isDeletingNamespace && namespaceToDelete === namespace"
          @click="goToNamespace(namespace)"
          @queue-click="goToQueueDetails"
          @delete="confirmDelete"
        />
      </div>
    </PageContent>

    <!-- Delete Confirmation Modal (teleported to body) -->
    <DeleteNamespaceModal
      :is-visible="showDeleteModal"
      :namespace="namespaceToDelete"
      :queue-count="
        namespaceToDelete
          ? listQueues.getNamespaceQueueCount.value(namespaceToDelete)
          : 0
      "
      :is-deleting="isDeletingNamespace"
      :error="deleteError"
      @cancel="cancelDelete"
      @confirm="deleteNamespace"
    />
  </div>
</template>

<style scoped>
.namespaces-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .namespaces-grid {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  }
}

@media (max-width: 768px) {
  .namespaces-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
</style>

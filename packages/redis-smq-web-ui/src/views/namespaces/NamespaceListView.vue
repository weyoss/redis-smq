<!--
  - Copyright (c)
  - Weyoss <weyoss@outlook.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import type { IQueueParams } from '@/types';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQueryClient } from '@tanstack/vue-query';
import { usePageContentStore, type PageAction } from '@/stores/pageContent.ts';

// Generated API hooks
import {
  useGetApiNamespaces,
  useDeleteApiNamespacesNs,
  getGetApiNamespacesQueryKey,
} from '@/api/generated/namespaces/namespaces';

import PageContent from '@/components/PageContent.vue';
import NamespaceCard from '@/components/cards/NamespaceCard.vue';
import DeleteNamespaceModal from '@/components/modals/DeleteNamespaceModal.vue';
import { getErrorMessage } from '@/lib/error.ts';
import { useSelectedQueueStore } from '@/stores/selectedQueue.ts';
import { useSelectedNamespaceStore } from '@/stores/selectedNamespace.ts';

const router = useRouter();
const queryClient = useQueryClient();
const selectedQueueStore = useSelectedQueueStore();
const selectedNamespaceStore = useSelectedNamespaceStore();
const pageContentStore = usePageContentStore();

// Local state
const showDeleteModal = ref(false);
const namespaceToDelete = ref<string | null>(null);

// Fetch all namespaces
const {
  data: namespacesData,
  isLoading: isLoadingNamespaces,
  error: namespacesError,
  refetch: refetchNamespaces,
} = useGetApiNamespaces({
  query: {
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true,
  },
});

const namespaces = computed(() => namespacesData.value?.data || []);

// Combined loading state
const isLoading = computed(() => isLoadingNamespaces.value);

// Error state
const error = computed(() => namespacesError.value);

// Delete namespace mutation
const deleteMutation = useDeleteApiNamespacesNs({
  mutation: {
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getGetApiNamespacesQueryKey(),
      });
      showDeleteModal.value = false;
      namespaceToDelete.value = null;
    },
  },
});

const isDeleting = computed(() => deleteMutation.isPending.value);
const deleteError = computed(() =>
  getErrorMessage(deleteMutation.error.value?.error),
);

// Page actions
const pageActions = computed((): PageAction[] => [
  {
    id: 'refresh',
    label: 'Refresh',
    icon: 'bi bi-arrow-clockwise',
    variant: 'primary',
    disabled: isLoading.value,
    handler: refetchNamespaces,
  },
]);

// Navigation
function goToNamespace(ns: string) {
  selectedNamespaceStore.selectNamespace(ns);
  router.push({ name: 'Namespace Queues', params: { ns } });
}

function goToExchanges(ns: string) {
  selectedNamespaceStore.selectNamespace(ns);
  router.push({ name: 'Namespace Exchanges', params: { ns } });
}

function goToQueue(queue: IQueueParams) {
  selectedQueueStore.selectQueue(queue.ns, queue.name);
  router.push({ name: 'Queue', params: { ns: queue.ns, queue: queue.name } });
}

// Delete handlers
function confirmDelete(namespace: string) {
  namespaceToDelete.value = namespace;
  showDeleteModal.value = true;
}

function cancelDelete() {
  showDeleteModal.value = false;
  namespaceToDelete.value = null;
  deleteMutation.reset();
}

async function deleteNamespace() {
  if (!namespaceToDelete.value) return;
  await deleteMutation.mutateAsync({ ns: namespaceToDelete.value });
}

// Page content
import { watch } from 'vue';

watch([isLoading, error, namespaces], () => {
  pageContentStore.setPageHeader({
    title: 'Namespaces',
    subtitle: 'Organize and manage your message queue namespaces',
    icon: 'bi bi-folder',
  });

  pageContentStore.setPageActions(pageActions.value);
  pageContentStore.setLoadingState(isLoading.value);

  if (error.value) {
    pageContentStore.setErrorState(getErrorMessage(error.value));
  } else if (!isLoading.value && namespaces.value.length === 0) {
    pageContentStore.setEmptyState(true, {
      icon: 'bi bi-folder-plus',
      title: 'No Namespaces Found',
      message: 'Namespaces are created automatically when you create queues.',
      actionLabel: 'Create Queue',
      actionHandler: () => router.push({ name: 'Queues' }),
    });
  } else {
    pageContentStore.setErrorState(null);
    pageContentStore.setEmptyState(false);
  }
});

onMounted(() => {
  selectedQueueStore.clearSelectedQueue();
});
</script>

<template>
  <div>
    <PageContent>
      <!-- Error Banner -->
      <div
        v-if="deleteError && !showDeleteModal"
        class="alert alert-warning alert-dismissible fade show mb-4"
        role="alert"
      >
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        {{ deleteError }}
        <button
          type="button"
          class="btn-close"
          aria-label="Close"
          @click="deleteMutation.reset()"
        ></button>
      </div>

      <!-- Namespaces Grid -->
      <div class="namespaces-grid">
        <NamespaceCard
          v-for="ns in namespaces"
          :key="ns"
          :namespace="ns"
          :is-deleting="isDeleting && namespaceToDelete === ns"
          @click="goToNamespace(ns)"
          @delete="confirmDelete"
          @view-exchanges="goToExchanges"
          @queue-click="goToQueue"
        />
      </div>
    </PageContent>

    <!-- Delete Modal -->
    <DeleteNamespaceModal
      :is-visible="showDeleteModal"
      :namespace="namespaceToDelete"
      :queue-count="0"
      :is-deleting="isDeleting"
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

.alert-warning {
  color: #664d03;
  background-color: #fff3cd;
  border-color: #ffecb5;
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
  position: relative;
  padding-right: 3rem;
}

.alert-dismissible .btn-close {
  position: absolute;
  top: 0;
  right: 0;
  padding: 0.75rem 1rem;
  background: none;
  border: none;
  font-size: 1.125rem;
  cursor: pointer;
  opacity: 0.5;
}

.alert-dismissible .btn-close:hover {
  opacity: 0.75;
}

.alert-dismissible .btn-close::before {
  content: '×';
  font-weight: bold;
}

.mb-4 {
  margin-bottom: 1.5rem;
}

@media (max-width: 768px) {
  .namespaces-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
</style>

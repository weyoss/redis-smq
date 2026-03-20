<!--
  - Copyright (c)
  - Weyoss <weyoss@outlook.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { computed, onMounted, ref, watch, watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQueryClient } from '@tanstack/vue-query';

import { getErrorMessage } from '@/lib/error.ts';
import { useSelectedNamespaceStore } from '@/stores/selectedNamespace.ts';
import { usePageContentStore, type PageAction } from '@/stores/pageContent.ts';

// Generated API hooks
import {
  useGetApiNamespacesNsQueues,
  getGetApiNamespacesNsQueuesQueryKey,
} from '@/api/generated/namespace-queues/namespace-queues';

import { useGetApiNamespaces } from '@/api/generated/namespaces/namespaces';

import PageContent from '@/components/PageContent.vue';
import CreateQueueModal from '@/components/modals/CreateQueueModal.vue';
import QueueListItem from '@/components/QueueListItem.vue';

const route = useRoute();
const router = useRouter();
const queryClient = useQueryClient();
const selectedNamespaceStore = useSelectedNamespaceStore();
const pageContentStore = usePageContentStore();

// Route and Data State
const namespace = computed(() => route.params.ns as string);

// Fetch all namespaces to check if current namespace exists
const {
  data: namespacesData,
  isLoading: isLoadingNamespaces,
  error: namespacesError,
} = useGetApiNamespaces();

const namespaces = computed(() => namespacesData.value?.data || []);

const namespaceExists = computed(() => {
  if (!namespace.value) return false;
  return namespaces.value.includes(namespace.value);
});

// Fetch queues for this specific namespace
const {
  data: queuesData,
  isLoading: isLoadingQueues,
  error: queuesError,
  refetch: refetchQueues,
  isFetching,
} = useGetApiNamespacesNsQueues(namespace, {
  query: {
    enabled: computed(() => !!namespace.value && namespaceExists.value),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  },
});

// Get queues for the current namespace
const namespaceQueues = computed(() => queuesData.value?.data || []);

// Local state for modals
const showCreateForm = ref(false);

const hasQueues = computed(() => namespaceQueues.value.length > 0);

// Combined loading state
const isLoading = computed(
  () => isLoadingNamespaces.value || isLoadingQueues.value,
);

// Combined error state
const error = computed(() => namespacesError.value || queuesError.value);

function goBackToNamespaces() {
  selectedNamespaceStore.clearSelectedNamespace();
  router.push({ name: 'Namespaces' });
}

// Modal Actions
function openCreateForm() {
  showCreateForm.value = true;
}

function cancelCreate() {
  showCreateForm.value = false;
}

function handleQueueDeleted() {
  // Refresh the list after a queue is deleted
  queryClient.invalidateQueries({
    queryKey: getGetApiNamespacesNsQueuesQueryKey(namespace.value),
    refetchType: 'all',
  });
}

function retryFetch() {
  queryClient.invalidateQueries({
    queryKey: getGetApiNamespacesNsQueuesQueryKey(namespace.value),
    refetchType: 'all',
  });
  refetchQueues();
}

// Watch for namespace changes to fetch new data
watch(namespace, (newNamespace, oldNamespace) => {
  if (newNamespace && newNamespace !== oldNamespace) {
    if (oldNamespace) {
      queryClient.invalidateQueries({
        queryKey: getGetApiNamespacesNsQueuesQueryKey(oldNamespace),
      });
    }
    queryClient.invalidateQueries({
      queryKey: getGetApiNamespacesNsQueuesQueryKey(newNamespace),
      refetchType: 'all',
    });
  }
});

// Page Content Store Management
const pageActions = computed((): PageAction[] => {
  if (!namespaceExists.value) {
    return [];
  }

  return [
    {
      id: 'refresh-queues',
      label: 'Refresh',
      icon: 'bi bi-arrow-clockwise',
      variant: 'secondary',
      disabled: isLoading.value,
      loading: isLoading.value,
      handler: retryFetch,
    },
    {
      id: 'create-queue',
      label: 'Create Queue',
      icon: 'bi bi-plus-circle',
      variant: 'primary',
      disabled: !namespaceExists.value,
      loading: false,
      handler: openCreateForm,
    },
  ];
});

watchEffect(() => {
  pageContentStore.setPageHeader({
    title: namespace.value,
    subtitle: `Manage queues in namespace: ${namespace.value}`,
    icon: 'bi bi-folder-fill',
  });

  pageContentStore.setPageActions(pageActions.value);
  pageContentStore.setLoadingState(isLoading.value);

  if (!isLoading.value) {
    if (!namespaceExists.value) {
      pageContentStore.setEmptyState(true, {
        icon: 'bi bi-folder-x',
        title: 'Namespace Not Found',
        message: `The namespace "${namespace.value}" does not exist or has been deleted.`,
        actionLabel: 'Back to Namespaces',
        actionHandler: goBackToNamespaces,
      });
      pageContentStore.setPageActions([]);
    } else if (error.value) {
      pageContentStore.setErrorState(getErrorMessage(error.value));
      pageContentStore.setEmptyState(false);
    } else if (!hasQueues.value) {
      pageContentStore.setErrorState(null);
      pageContentStore.setEmptyState(true, {
        icon: 'bi bi-inbox',
        title: 'No queues in this namespace',
        message: `Create your first queue in the "${namespace.value}" namespace to start managing messages.`,
        actionLabel: 'Create Your First Queue',
        actionHandler: openCreateForm,
      });
    } else {
      pageContentStore.setErrorState(null);
      pageContentStore.setEmptyState(false);
    }
  }
});

// Sync selected namespace with store
watch(
  namespace,
  (newNamespace) => {
    if (newNamespace) {
      selectedNamespaceStore.selectNamespace(newNamespace);
    }
  },
  { immediate: true },
);

onMounted(() => {
  if (namespace.value) {
    selectedNamespaceStore.selectNamespace(namespace.value);
    queryClient.invalidateQueries({
      queryKey: getGetApiNamespacesNsQueuesQueryKey(namespace.value),
      refetchType: 'all',
    });
  }
});
</script>

<template>
  <div>
    <PageContent>
      <!-- Namespace Summary -->
      <div class="content-card namespace-summary">
        <div class="summary-content">
          <div class="summary-stats">
            <div class="stat-item">
              <div class="stat-icon">
                <i class="bi bi-list-ul"></i>
              </div>
              <div class="stat-content">
                <div class="stat-number">{{ namespaceQueues.length }}</div>
                <div class="stat-label">
                  Queue{{ namespaceQueues.length !== 1 ? 's' : '' }}
                </div>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon">
                <i class="bi bi-folder-fill"></i>
              </div>
              <div class="stat-content">
                <div class="stat-number">{{ namespace }}</div>
                <div class="stat-label">Namespace</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Queues list -->
      <div class="content-card queues-card">
        <div class="queues-header">
          <h5 class="queues-count">
            {{ namespaceQueues.length }} Queue{{
              namespaceQueues.length !== 1 ? 's' : ''
            }}
          </h5>
          <div v-if="isFetching" class="fetching-indicator">
            <i class="bi bi-arrow-repeat spin"></i>
            <span>Refreshing...</span>
          </div>
        </div>
        <div class="queues-list">
          <QueueListItem
            v-for="queue in namespaceQueues"
            :key="`${queue.ns}-${queue.name}`"
            :ns="queue.ns"
            :name="queue.name"
            @deleted="handleQueueDeleted"
          />
          <div
            v-if="namespaceQueues.length === 0 && !isLoading"
            class="empty-queues-message"
          >
            <i class="bi bi-inbox"></i>
            <p>No queues found in this namespace</p>
          </div>
        </div>
      </div>
    </PageContent>

    <!-- Create Queue Modal -->
    <CreateQueueModal
      :is-visible="showCreateForm"
      :namespace="namespace"
      @close="cancelCreate"
      @created="
        () => {
          queryClient.invalidateQueries({
            queryKey: getGetApiNamespacesNsQueuesQueryKey(namespace),
            refetchType: 'all',
          });
        }
      "
    />
  </div>
</template>

<style scoped>
.content-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #e9ecef;
  overflow: hidden;
  margin-bottom: 1.5rem;
}

/* Namespace Summary */
.namespace-summary {
  padding: 0;
}

.summary-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem;
  gap: 2rem;
}

.summary-stats {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: #212529;
  margin-bottom: 0.125rem;
  font-family: 'Courier New', monospace;
}

.stat-label {
  font-size: 0.85rem;
  color: #6c757d;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Queues List */
.queues-card {
  padding: 0;
}

.queues-header {
  padding: 1.5rem 2rem 1rem;
  border-bottom: 1px solid #e9ecef;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.queues-count {
  margin: 0;
  color: #495057;
  font-weight: 600;
  font-size: 1rem;
}

.fetching-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #0d6efd;
}

.fetching-indicator i {
  font-size: 0.9rem;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.queues-list {
  max-height: calc(100vh - 400px);
  overflow-y: auto;
  min-height: 200px;
}

.empty-queues-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  color: #6c757d;
  text-align: center;
}

.empty-queues-message i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-queues-message p {
  margin: 0;
  font-size: 1rem;
}

/* Custom Scrollbar */
.queues-list::-webkit-scrollbar {
  width: 6px;
}

.queues-list::-webkit-scrollbar-track {
  background: #f8f9fa;
}

.queues-list::-webkit-scrollbar-thumb {
  background: #ced4da;
  border-radius: 3px;
}

.queues-list::-webkit-scrollbar-thumb:hover {
  background: #adb5bd;
}

/* Responsive Design */
@media (max-width: 768px) {
  .summary-content {
    flex-direction: column;
    align-items: stretch;
    gap: 1.5rem;
    padding: 1.25rem 1.5rem;
  }

  .summary-stats {
    justify-content: center;
    gap: 1.5rem;
  }

  .queues-header {
    padding: 1rem 1.5rem 0.75rem;
  }

  .queues-list {
    max-height: calc(100vh - 350px);
  }
}

@media (max-width: 576px) {
  .summary-stats {
    flex-direction: column;
    gap: 1rem;
  }

  .stat-item {
    justify-content: center;
  }

  .queues-header {
    padding: 1rem;
  }
}
</style>

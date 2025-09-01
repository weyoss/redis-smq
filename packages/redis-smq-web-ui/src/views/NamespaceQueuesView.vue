<!--
  - Copyright (c)
  - Weyoss <weyoss@protonmail.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import type { PostApiV1QueuesBody } from '@/api/model/index.js';
import { computed, onMounted, ref, watch, watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useNamespaces } from '@/composables/useNamespaces.ts';
import { EQueueDeliveryModel, EQueueType } from '@/types/index.js';
import { getErrorMessage } from '@/lib/error.ts';
import { useSelectedQueueStore } from '@/stores/selectedQueue.ts';
import { useCreateQueue } from '@/composables/useCreateQueue.ts';
import { useSelectedNamespaceStore } from '@/stores/selectedNamespace.ts';
import { useDeleteQueue } from '@/composables/useDeleteQueue.ts';
import { usePageContentStore, type PageAction } from '@/stores/pageContent.ts';

import PageContent from '@/components/PageContent.vue';
import CreateQueueModal from '@/components/modals/CreateQueueModal.vue';
import DeleteQueueModal from '@/components/modals/DeleteQueueModal.vue';
import QueueListItem from '@/components/QueueListItem.vue';

const route = useRoute();
const router = useRouter();
const namespaces = useNamespaces();
const selectedNamespaceStore = useSelectedNamespaceStore();
const selectedQueueStore = useSelectedQueueStore();
const pageContentStore = usePageContentStore();

const createQueue = useCreateQueue(async () => {
  showCreateForm.value = false;
  await namespaces.refreshNamespaceQueues(namespace.value);
});

const deleteQueue = useDeleteQueue(async () => {
  showDeleteConfirm.value = false;
  queueToDelete.value = null;
  await namespaces.refreshNamespaceQueues(namespace.value);
});

// Local state for modals
const showCreateForm = ref(false);
const showDeleteConfirm = ref(false);
const queueToDelete = ref<{ ns: string; name: string } | null>(null);

// Route and Data State
const namespace = computed(() => route.params.ns as string);
const namespaceQueues = computed(() => namespaces.sortedNamespaceQueues.value);
const isLoadingQueues = computed(
  () => namespaces.isLoadingNamespaceQueues.value,
);
const queuesError = computed(() => namespaces.namespaceQueuesError.value);
const hasQueues = computed(() => namespaceQueues.value.length > 0);
const namespaceExists = computed(() => {
  if (!namespace.value) return false;
  return namespaces.namespaceExists.value(namespace.value);
});

// Mutation States
const isCreatingQueue = computed(() => createQueue.isCreatingQueue.value);
const createQueueError = computed(() => createQueue.createQueueError.value);
const isDeletingQueue = computed(() => deleteQueue.isDeletingQueue.value);
const deleteQueueError = computed(() => deleteQueue.deleteQueueError.value);

// Navigation
function goToQueueDetails(ns: string, queue: string) {
  selectedQueueStore.selectQueue(ns, queue);
  router.push({ name: 'Queue', params: { ns, queue } });
}

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

function confirmDelete(ns: string, name: string) {
  queueToDelete.value = { ns, name };
  showDeleteConfirm.value = true;
}

function cancelDelete() {
  showDeleteConfirm.value = false;
  queueToDelete.value = null;
}

// API Actions
async function handleCreateQueue(formValues: {
  name: string;
  ns: string;
  type: EQueueType;
  deliveryModel: EQueueDeliveryModel;
}) {
  const queueData: PostApiV1QueuesBody = {
    queue: { ns: formValues.ns, name: formValues.name },
    queueType: formValues.type,
    queueDeliveryModel: formValues.deliveryModel,
  };
  await createQueue.createQueueMutation.mutateAsync({ data: queueData });
}

async function deleteQueueConfirmed() {
  if (!queueToDelete.value) return;
  await deleteQueue.deleteQueueMutation.mutateAsync({
    ns: queueToDelete.value.ns,
    name: queueToDelete.value.name,
  });
}

function retryFetch() {
  namespaces.refreshNamespaceQueues(namespace.value);
}

// Page Content Store Management
const pageActions = computed((): PageAction[] => [
  {
    id: 'refresh-queues',
    label: 'Refresh',
    icon: 'bi bi-arrow-clockwise',
    variant: 'secondary',
    disabled: isLoadingQueues.value,
    handler: retryFetch,
  },
  {
    id: 'create-queue',
    label: 'Create Queue',
    icon: 'bi bi-plus-circle',
    variant: 'primary',
    disabled: isCreatingQueue.value,
    loading: isCreatingQueue.value,
    handler: openCreateForm,
  },
]);

watchEffect(() => {
  // Set Header
  pageContentStore.setPageHeader({
    title: namespace.value,
    subtitle: 'Manage queues in this namespace',
    icon: 'bi bi-folder-fill',
  });

  // Set Actions
  pageContentStore.setPageActions(pageActions.value);

  // Set Content State
  pageContentStore.setLoadingState(isLoadingQueues.value);

  if (!isLoadingQueues.value) {
    if (!namespaceExists.value) {
      pageContentStore.setEmptyState(true, {
        icon: 'bi bi-folder-x',
        title: 'Namespace Not Found',
        message: `The namespace "${namespace.value}" does not exist or has been deleted.`,
        actionLabel: 'Back to Namespaces',
        actionHandler: goBackToNamespaces,
      });
      pageContentStore.setPageActions([]);
    } else if (queuesError.value) {
      pageContentStore.setErrorState(getErrorMessage(queuesError.value));
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
  }
});
</script>

<template>
  <div>
    <PageContent>
      <!-- Contextual Error Banners -->
      <div
        v-if="createQueueError && !showCreateForm"
        class="alert alert-warning alert-dismissible fade show error-banner"
      >
        <div class="d-flex align-items-center">
          <i class="bi bi-exclamation-triangle me-2"></i>
          <span
            >Failed to create queue:
            {{ getErrorMessage(createQueueError) }}</span
          >
        </div>
        <button
          type="button"
          class="btn-close"
          @click="createQueue.createQueueMutation.reset()"
        ></button>
      </div>

      <div
        v-if="deleteQueueError && !showDeleteConfirm"
        class="alert alert-warning alert-dismissible fade show error-banner"
      >
        <div class="d-flex align-items-center">
          <i class="bi bi-exclamation-triangle me-2"></i>
          <span
            >Failed to delete queue:
            {{ getErrorMessage(deleteQueueError) }}</span
          >
        </div>
        <button
          type="button"
          class="btn-close"
          @click="deleteQueue.deleteQueueMutation.reset()"
        ></button>
      </div>

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
        </div>
        <div class="queues-list">
          <QueueListItem
            v-for="queue in namespaceQueues"
            :key="`${queue.ns}-${queue.name}`"
            :queue="queue"
            @select="goToQueueDetails"
            @delete="confirmDelete"
          />
        </div>
      </div>
    </PageContent>

    <!-- Modals -->
    <CreateQueueModal
      :is-visible="showCreateForm"
      :is-creating="isCreatingQueue"
      :create-error="
        createQueueError ? `${getErrorMessage(createQueueError)?.message}` : ''
      "
      :namespace="namespace"
      @close="cancelCreate"
      @create="handleCreateQueue"
    />

    <DeleteQueueModal
      v-if="queueToDelete"
      :is-visible="showDeleteConfirm"
      :is-deleting="isDeletingQueue"
      :queue="queueToDelete"
      @cancel="cancelDelete"
      @confirm="deleteQueueConfirmed"
    />
  </div>
</template>

<style scoped>
/* Minimal styles needed after refactoring */
.error-banner {
  border-radius: 8px;
  margin-bottom: 1.5rem;
  padding: 1rem 1.25rem;
}

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

.emoji-icon {
  font-size: 1.5rem;
  line-height: 1;
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

.queues-list {
  max-height: calc(100vh - 400px);
  overflow-y: auto;
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

@media (max-width: 480px) {
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

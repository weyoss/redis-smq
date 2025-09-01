<!--
  - Copyright (c)
  - Weyoss <weyoss@protonmail.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { computed, onMounted, ref, watchEffect } from 'vue';
import { useRouter } from 'vue-router';
import { usePageContentStore, type PageAction } from '@/stores/pageContent';
import { useSelectedQueueStore } from '@/stores/selectedQueue';
import { useEscapeKey } from '@/composables/useEscapeKey';
import type { QueueFormValues } from '@/composables/useQueueForm';
import type { PostApiV1QueuesBody } from '@/api/model/index.js';

import PageContent from '@/components/PageContent.vue';
import QueueListItem from '@/components/QueueListItem.vue';
import CreateQueueModal from '@/components/modals/CreateQueueModal.vue';
import DeleteQueueModal from '@/components/modals/DeleteQueueModal.vue';
import { getErrorMessage } from '@/lib/error.ts';
import { useListQueues } from '@/composables/useListQueues.ts';
import { useCreateQueue } from '@/composables/useCreateQueue.ts';
import { useDeleteQueue } from '@/composables/useDeleteQueue.ts';

const router = useRouter();
const pageContentStore = usePageContentStore();
const selectedQueueStore = useSelectedQueueStore();

// Directly use composable hooks for queue management
const { sortedQueues, isLoadingQueues, queuesError, refetchQueues } =
  useListQueues();

const { createQueue, isCreatingQueue, createQueueError, createQueueMutation } =
  useCreateQueue(async () => {
    await refetchQueues();
  });

const { deleteQueue, isDeletingQueue, deleteQueueError, deleteQueueMutation } =
  useDeleteQueue(async () => {
    await refetchQueues();
  });

// Local computed properties from hooks
const hasQueues = computed(() => sortedQueues.value.length > 0);

// Local UI state for modals
const showCreateModal = ref(false);
const showDeleteModal = ref(false);
const queueToDelete = ref<{ ns: string; name: string } | null>(null);

// Page content definitions
const pageTitle = 'Queues';
const pageSubtitle = 'Manage all available message queues';

const pageActions = computed((): PageAction[] => [
  {
    id: 'refresh-queues',
    label: 'Refresh',
    icon: 'bi bi-arrow-clockwise',
    variant: 'secondary',
    disabled: isLoadingQueues.value,
    loading: isLoadingQueues.value,
    handler: () => refetchQueues(),
  },
  {
    id: 'create-queue',
    label: 'Create Queue',
    icon: 'bi bi-plus-circle',
    variant: 'primary',
    disabled: isCreatingQueue.value,
    loading: isCreatingQueue.value,
    handler: () => (showCreateModal.value = true),
  },
]);

// Event Handlers
function goToQueueDetails(ns: string, name: string) {
  router.push({ name: 'Queue', params: { ns, queue: name } });
}

async function handleCreateQueue(formValues: QueueFormValues) {
  try {
    const queueData: PostApiV1QueuesBody = {
      queue: { ns: formValues.ns, name: formValues.name },
      queueType: formValues.type,
      queueDeliveryModel: formValues.deliveryModel,
    };
    await createQueue({ data: queueData });
    showCreateModal.value = false;
  } catch (err) {
    // Error is handled by the hook and displayed in the modal
    console.error('Failed to create queue:', err);
  }
}

function confirmDelete(ns: string, name: string) {
  queueToDelete.value = { ns, name };
  showDeleteModal.value = true;
}

async function deleteQueueConfirmed() {
  if (!queueToDelete.value) return;
  try {
    await deleteQueue(queueToDelete.value);
    showDeleteModal.value = false;
  } catch (err) {
    // Error is handled by the hook and displayed in the modal
    console.error('Failed to delete queue:', err);
  }
}

// Sync component state with the page content store
watchEffect(() => {
  pageContentStore.setPageHeader({
    title: pageTitle,
    subtitle: pageSubtitle,
    icon: 'bi bi-card-list',
  });
  pageContentStore.setPageActions(pageActions.value);
  pageContentStore.setLoadingState(isLoadingQueues.value);

  if (queuesError.value) {
    pageContentStore.setErrorState(getErrorMessage(queuesError.value));
    pageContentStore.setEmptyState(false);
  } else if (!isLoadingQueues.value && !hasQueues.value) {
    pageContentStore.setErrorState(null);
    pageContentStore.setEmptyState(true, {
      icon: 'bi bi-plus-square-dotted',
      title: 'No Queues Found',
      message: 'Get started by creating your first message queue.',
      actionLabel: 'Create Your First Queue',
      actionHandler: () => (showCreateModal.value = true),
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
  refetchQueues();
});

// Keyboard shortcuts for modals
useEscapeKey([
  {
    isVisible: showCreateModal,
    onEscape: () => (showCreateModal.value = false),
  },
  {
    isVisible: showDeleteModal,
    onEscape: () => (showDeleteModal.value = false),
  },
]);
</script>

<template>
  <div>
    <PageContent>
      <!-- Transient Error Banners -->
      <div
        v-if="createQueueError && !showCreateModal"
        class="alert alert-warning alert-dismissible fade show mb-4"
        role="alert"
      >
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        {{ getErrorMessage(createQueueError) }}
        <button
          type="button"
          class="btn-close"
          aria-label="Close"
          @click="createQueueMutation.reset()"
        ></button>
      </div>
      <div
        v-if="deleteQueueError && !showDeleteModal"
        class="alert alert-warning alert-dismissible fade show mb-4"
        role="alert"
      >
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        {{ getErrorMessage(deleteQueueError) }}
        <button
          type="button"
          class="btn-close"
          aria-label="Close"
          @click="deleteQueueMutation.reset()"
        ></button>
      </div>

      <!-- Queues List Container -->
      <div class="queues-list-container">
        <div class="queues-list-header">
          <h5 class="queues-count">
            {{ sortedQueues.length }} Queue{{
              sortedQueues.length !== 1 ? 's' : ''
            }}
          </h5>
        </div>
        <div class="queues-list">
          <QueueListItem
            v-for="queue in sortedQueues"
            :key="`${queue.ns}-${queue.name}`"
            :queue="queue"
            @select="goToQueueDetails"
            @delete="confirmDelete"
          />
        </div>
      </div>
    </PageContent>

    <!-- Modals (teleported to body) -->
    <CreateQueueModal
      :is-visible="showCreateModal"
      :is-creating="isCreatingQueue"
      :create-error="
        createQueueError ? `${getErrorMessage(createQueueError)?.message}` : ''
      "
      @close="showCreateModal = false"
      @create="handleCreateQueue"
    />
    <DeleteQueueModal
      v-if="showDeleteModal && queueToDelete"
      :is-visible="showDeleteModal"
      :is-deleting="isDeletingQueue"
      :queue="queueToDelete"
      @cancel="showDeleteModal = false"
      @confirm="deleteQueueConfirmed"
    />
  </div>
</template>

<style scoped>
.queues-list-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #e9ecef;
  overflow: hidden;
}

.queues-list-header {
  padding: 1.5rem 2rem 1rem;
  border-bottom: 1px solid #e9ecef;
  background: #f8f9fa;
}

.queues-count {
  margin: 0;
  color: #495057;
  font-weight: 600;
  font-size: 1rem;
}

.queues-list {
  max-height: calc(100vh - 260px); /* Adjust based on header height */
  overflow-y: auto;
}

/* Custom Scrollbar for a cleaner look */
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

/* Responsive adjustments */
@media (max-width: 768px) {
  .queues-list-header {
    padding: 1rem 1.5rem 0.75rem;
  }
  .queues-list {
    max-height: calc(100vh - 220px);
  }
}
</style>

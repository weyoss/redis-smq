<!--
  - Copyright (c)
  - Weyoss <weyoss@protonmail.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { computed, ref, watch, watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSelectedQueueStore } from '@/stores/selectedQueue.ts';
import { useSelectedQueuePropertiesStore } from '@/stores/selectedQueueProperties.ts';
import { type PageAction, usePageContentStore } from '@/stores/pageContent';
import { useDeleteQueue } from '@/composables/useDeleteQueue.ts';
import { useEscapeKey } from '@/composables/useEscapeKey';
import { getErrorMessage } from '@/lib/error.ts';

import PageContent from '@/components/PageContent.vue';
import QueuePropertiesCard from '@/components/cards/QueuePropertiesCard.vue';
import ConsumerGroupsCard from '@/components/cards/ConsumerGroupsCard.vue';
import QueueRateLimitCard from '@/components/cards/QueueRateLimitCard.vue';
import DeleteQueueModal from '@/components/modals/DeleteQueueModal.vue';
import QueueConsumersCard from '@/components/cards/QueueConsumersCard.vue';

// Core State & Route Params
const route = useRoute();
const router = useRouter();
const pageContentStore = usePageContentStore();
const selectedQueueStore = useSelectedQueueStore();
const queuePropertiesStore = useSelectedQueuePropertiesStore();

const ns = computed(() => route.params.ns as string);
const name = computed(() => route.params.queue as string);

// Data Fetching & State
const queue = computed(() => selectedQueueStore.selectedQueue);
const isLoading = computed(() => queuePropertiesStore.isLoadingQueueProperties);
const queuePropertiesError = computed(
  () => queuePropertiesStore.queuePropertiesError,
);

// Delete Queue Logic
const { deleteQueue, isDeletingQueue, deleteQueueError, deleteQueueMutation } =
  useDeleteQueue(async () => {
    // On successful deletion, navigate away
    await router.push({ name: 'Queues' });
  });

// Modal Management Logic
const isDeleteModalVisible = ref(false);

function showDeleteModal() {
  deleteQueueMutation.reset(); // Clear any stale errors from previous attempts
  isDeleteModalVisible.value = true;
}

function hideDeleteModal() {
  isDeleteModalVisible.value = false;
}

async function handleConfirmDelete() {
  if (!queue.value) return;
  await deleteQueue({ ns: queue.value.ns, name: queue.value.name });
  // On success, the callback provided to useDeleteQueue will navigate away.
  // On error, the error state will be updated, and the modal will remain open.
}
// --- End Modal Management Logic ---

// Combined Error Handling
const error = computed(() => {
  // Prioritize showing the most recent error (delete error over fetch error)
  const err = deleteQueueError.value || queuePropertiesError.value;
  return getErrorMessage(err);
});

const isQueueNotFoundError = computed(() => {
  const err = queuePropertiesError.value?.error;
  return err?.message === 'QueueNotFoundError';
});

// Page Content Management
const pageTitle = computed(() => `${name.value} @ ${ns.value}`);
const pageSubtitle = 'Queue Details & Management';

const pageActions = computed((): PageAction[] => [
  {
    id: 'delete-queue',
    label: 'Delete',
    icon: 'bi bi-trash',
    variant: 'danger',
    disabled: isLoading.value || isDeletingQueue.value,
    loading: isDeletingQueue.value,
    handler: showDeleteModal,
  },
]);

function goBackToQueues() {
  selectedQueueStore.clearSelectedQueue();
  router.push({ name: 'Queues' });
}

// Sync component state with the global page content store
watchEffect(() => {
  pageContentStore.setPageHeader({
    title: pageTitle.value,
    subtitle: pageSubtitle,
    icon: 'bi bi-card-list',
  });

  pageContentStore.setLoadingState(isLoading.value);

  if (isQueueNotFoundError.value) {
    pageContentStore.setEmptyState(true, {
      icon: 'bi bi-question-circle',
      title: 'Queue Not Found',
      message: `The queue "${name.value}" in namespace "${ns.value}" could not be found. It may have been deleted.`,
      actionLabel: 'Back to Queues',
      actionHandler: goBackToQueues,
    });
    pageContentStore.setPageActions([]);
  } else if (error.value && !isDeleteModalVisible.value) {
    // Only show page-level error if the modal isn't active
    pageContentStore.setErrorState(error.value);
    pageContentStore.setPageActions([]);
  } else {
    pageContentStore.setEmptyState(false);
    pageContentStore.setErrorState(null);
    pageContentStore.setPageActions(pageActions.value);
  }
});

// Sync selected queue with route params
watch(
  [ns, name],
  ([newNs, newName]) => {
    if (newNs && newName) {
      selectedQueueStore.selectQueue(newNs, newName);
    } else {
      selectedQueueStore.clearSelectedQueue();
    }
  },
  { immediate: true },
);

// Keyboard Shortcuts
useEscapeKey([
  {
    isVisible: isDeleteModalVisible,
    onEscape: hideDeleteModal,
  },
]);
</script>

<template>
  <div class="queue-properties-view">
    <PageContent>
      <!-- The main content is rendered by the slot if not loading/error/empty -->
      <div v-if="queue" class="details-grid">
        <div class="details-column-main">
          <QueuePropertiesCard />
          <ConsumerGroupsCard />
        </div>
        <div class="details-column-secondary">
          <QueueRateLimitCard />
          <QueueConsumersCard />
        </div>
      </div>
    </PageContent>

    <!-- Delete Confirmation Modal -->
    <DeleteQueueModal
      :queue="{ ns, name }"
      :is-deleting="isDeletingQueue"
      :is-visible="isDeleteModalVisible"
      @cancel="hideDeleteModal"
      @confirm="handleConfirmDelete"
    />
  </div>
</template>

<style scoped>
/* Mobile-first safety: sizing and overflow guards within this view */
.queue-properties-view,
.queue-properties-view * {
  box-sizing: border-box;
  max-width: 100%;
}

/* Use fluid gaps and prevent horizontal scroll; rely on PageContent padding */
.details-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(12px, 3vw, 24px);
  align-items: start;
  overflow-wrap: anywhere; /* guard against long strings overflowing */
  word-break: break-word;
}

.details-column-main,
.details-column-secondary {
  display: flex;
  flex-direction: column;
  gap: clamp(12px, 2.5vw, 20px);
  min-width: 0; /* ensure children can shrink without causing overflow */
}

/* Collapse to single column earlier to avoid cramped layout */
@media (max-width: 1200px) {
  .details-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

/* Tighter gaps on tablets/phones and safe bottom spacing */
@media (max-width: 768px) {
  .details-grid {
    gap: clamp(10px, 3.5vw, 16px);
    margin-bottom: env(safe-area-inset-bottom);
  }
  .details-column-main,
  .details-column-secondary {
    gap: clamp(10px, 3.5vw, 16px);
  }
}

/* Extra small screens: ensure ample breathing room */
@media (max-width: 576px) {
  .details-grid {
    gap: clamp(8px, 4vw, 14px);
  }
}
</style>

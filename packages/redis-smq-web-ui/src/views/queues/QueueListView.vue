<!--
  - Copyright (c)
  - Weyoss <weyoss@outlook.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { computed, onMounted, ref, watchEffect } from 'vue';
import { usePageContentStore, type PageAction } from '@/stores/pageContent.ts';
import { useSelectedQueueStore } from '@/stores/selectedQueue.ts';
import { useEscapeKey } from '@/composables/useEscapeKey.ts';

import PageContent from '@/components/PageContent.vue';
import QueueListItem from '@/components/QueueListItem.vue';
import CreateQueueModal from '@/components/modals/CreateQueueModal.vue';
import { getErrorMessage } from '@/lib/error.ts';
import { useListQueues } from '@/composables/useListQueues.ts';

const pageContentStore = usePageContentStore();
const selectedQueueStore = useSelectedQueueStore();

// Use composable for queue listing
const { sortedQueues, isLoadingQueues, queuesError, refetchQueues } =
  useListQueues();

// Local computed properties
const hasQueues = computed(() => sortedQueues.value.length > 0);

// Local UI state for modals
const showCreateModal = ref(false);

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
    disabled: false,
    loading: false,
    handler: () => (showCreateModal.value = true),
  },
]);

// Handle queue deletion success
function handleQueueDeleted() {
  refetchQueues();
}

// Sync component state with the page content store
watchEffect(() => {
  pageContentStore.setPageHeader({
    title: pageTitle,
    subtitle: pageSubtitle,
    icon: 'bi bi-list-ul',
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
]);
</script>

<template>
  <div>
    <PageContent>
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
            :ns="queue.ns"
            :name="queue.name"
            @deleted="handleQueueDeleted"
          />
        </div>
      </div>
    </PageContent>

    <!-- Create Queue Modal -->
    <CreateQueueModal
      :is-visible="showCreateModal"
      @close="showCreateModal = false"
      @created="refetchQueues()"
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
  max-height: calc(100vh - 260px);
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

<!--
  - Copyright (c)
  - Weyoss <weyoss@protonmail.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import ConsumerGroupSelector from '@/components/ConsumerGroupSelector.vue';
import MessageList from '@/components/MessageList.vue';
import PageContent from '@/components/PageContent.vue';
import { usePendingMessages } from '@/composables/usePendingMessages.ts';
import { usePageContentStore } from '@/stores/pageContent.js';
import { useSelectedQueuePropertiesStore } from '@/stores/selectedQueueProperties.ts';
import { useSelectedQueueStore } from '@/stores/selectedQueue.ts';
import type { IQueueParams } from '@/types/index.js';
import { computed, watch, watchEffect } from 'vue';
import { useRoute } from 'vue-router';

const selectedQueueStore = useSelectedQueueStore();
const queuePropertiesStore = useSelectedQueuePropertiesStore();
const pageContentStore = usePageContentStore();
const route = useRoute();

// Route parameters
const ns = computed(() => route.params.ns as string);
const name = computed(() => route.params.queue as string);
const consumerGroupId = computed(
  () => route.query.consumerGroupId as string | null,
);

// Reactive queue params from route (without consumerGroupId)
const queueParams = computed<IQueueParams | null>(() => {
  if (!ns.value || !name.value) return null;
  return {
    ns: ns.value,
    name: name.value,
  };
});

// Keep global selected queue in sync
watch(
  [ns, name],
  ([newNs, newName]) => {
    if (newNs && newName) {
      selectedQueueStore.selectQueue(newNs, newName);
    }
  },
  { immediate: true },
);

// Queue state
const selectedQueue = computed(() => selectedQueueStore.selectedQueue);
const isPubSubQueue = computed(() => queuePropertiesStore.isPubSubQueue);
const isLoadingQueueProperties = computed(
  () => queuePropertiesStore.isLoadingQueueProperties,
);
const queueProperties = computed(() => queuePropertiesStore.queueProperties);

// View state - now accounts for loading queue properties
const shouldShowConsumerGroupSelector = computed(() => {
  return (
    selectedQueue.value &&
    queueProperties.value &&
    isPubSubQueue.value &&
    !consumerGroupId.value
  );
});

const shouldShowMessages = computed(() => {
  return (
    selectedQueue.value &&
    queueProperties.value &&
    (!isPubSubQueue.value || consumerGroupId.value)
  );
});

const shouldShowLoadingState = computed(() => {
  return selectedQueue.value && isLoadingQueueProperties.value;
});

// Conditional query execution - only fetch when we should show messages
const conditionalQueueParams = computed<IQueueParams | null>(() => {
  if (!shouldShowMessages.value) {
    return null; // This will disable the query
  }
  return queueParams.value;
});

// Use the pending messages composable with separate consumerGroupId parameter
const {
  messages,
  pagination,
  isLoading,
  isDeleting,
  isRequeuing,
  error,
  goToPage,
  setPageSize,
  refresh,
  deleteMessage,
  requeueMessage,
} = usePendingMessages(conditionalQueueParams, consumerGroupId, 20);

// Page content
const pageTitle = computed(() => {
  if (!selectedQueue.value) return 'Pending Messages';

  const queueContext = `${selectedQueue.value.name}@${selectedQueue.value.ns}`;
  if (isPubSubQueue.value && consumerGroupId.value) {
    return `Pending Messages - ${queueContext} (${consumerGroupId.value})`;
  }
  return `Pending Messages - ${queueContext}`;
});

const pageSubtitle = computed(() => {
  if (!selectedQueue.value) return undefined;

  if (isLoadingQueueProperties.value) {
    return 'Loading queue properties...';
  }

  if (isPubSubQueue.value && consumerGroupId.value) {
    return `Pub/Sub Queue • Consumer Group: ${consumerGroupId.value}`;
  }
  if (isPubSubQueue.value) {
    return 'Pub/Sub Queue • Select Consumer Group';
  }
  return 'Point-2-Point Queue';
});

const emptyMessage = computed(() => {
  if (isPubSubQueue.value && consumerGroupId.value) {
    return `No pending messages found for consumer group "${consumerGroupId.value}". Messages appear here when they are waiting to be processed by consumers in this group.`;
  }
  return 'No pending messages found for this queue. Messages appear here when they are waiting to be processed.';
});

// Page header management
watchEffect(() => {
  pageContentStore.setPageHeader({
    title: pageTitle.value,
    subtitle: pageSubtitle.value,
    icon: 'bi bi-hourglass-split',
  });
});

// Page content state management
watchEffect(() => {
  if (!selectedQueue.value) {
    pageContentStore.setEmptyState(true, {
      icon: 'bi bi-inbox',
      title: 'No Queue Selected',
      message:
        'Please select a queue from the sidebar to view its pending messages.',
    });
    pageContentStore.setPageActions([]);
    pageContentStore.setLoadingState(false);
    pageContentStore.setErrorState(null);
    return;
  }

  // Show loading state while queue properties are being fetched
  if (isLoadingQueueProperties.value) {
    pageContentStore.setLoadingState(true);
    pageContentStore.setErrorState(null);
    pageContentStore.setEmptyState(false);
    pageContentStore.setPageActions([]);
    return;
  }

  // Clear page-level states when queue properties are loaded - let child components handle their own states
  pageContentStore.setLoadingState(false);
  pageContentStore.setErrorState(null);
  pageContentStore.setEmptyState(false);
  pageContentStore.setPageActions([]);
});

// Event handlers to connect UI events to composable actions
async function handleDelete(messageId: string) {
  if (deleteMessage) {
    await deleteMessage(messageId);
  }
}

async function handleRequeue(messageId: string) {
  if (requeueMessage) {
    await requeueMessage(messageId);
  }
}

function onPageChange(page: number) {
  void goToPage(page);
}

async function onPageSizeChange(size: number) {
  await setPageSize(size);
}
</script>

<template>
  <PageContent :show-section-header="false">
    <!-- Loading State for Queue Properties -->
    <div v-if="shouldShowLoadingState" class="loading-state">
      <div class="d-flex justify-content-center align-items-center py-5">
        <div class="spinner-border text-primary me-3" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <span class="text-muted">Loading queue properties...</span>
      </div>
    </div>

    <!-- Consumer Group Selection for Pub/Sub Queues -->
    <ConsumerGroupSelector
      v-else-if="shouldShowConsumerGroupSelector"
      :show-section-header="false"
    />

    <!-- Messages Display -->
    <MessageList
      v-else-if="shouldShowMessages"
      :messages="messages"
      :is-loading="isLoading"
      :error="error"
      :pagination="pagination"
      :show-pagination="true"
      :empty-message="emptyMessage"
      icon="bi-hourglass-split"
      :is-deleting="isDeleting"
      :is-requeuing="isRequeuing"
      @refresh="refresh"
      @delete-message="handleDelete"
      @requeue-message="handleRequeue"
      @page-change="onPageChange"
      @page-size-change="onPageSizeChange"
      @first-page="onPageChange(1)"
      @previous-page="onPageChange(pagination.currentPage - 1)"
      @next-page="onPageChange(pagination.currentPage + 1)"
      @last-page="onPageChange(pagination.totalPages)"
    />
  </PageContent>
</template>

<style scoped>
.loading-state {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

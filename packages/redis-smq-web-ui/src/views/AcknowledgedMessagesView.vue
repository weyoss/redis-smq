<!--
  - Copyright (c)
  - Weyoss <weyoss@protonmail.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { computed, watch, watchEffect } from 'vue';
import { useRoute } from 'vue-router';
import MessageList from '@/components/MessageList.vue';
import PageContent from '@/components/PageContent.vue';
import { usePageContentStore } from '@/stores/pageContent.ts';
import { useSelectedQueuePropertiesStore } from '@/stores/selectedQueueProperties.ts';
import { useSelectedQueueStore } from '@/stores/selectedQueue.ts';
import type { IQueueParams } from '@/types/index.ts';
import { useAcknowledgedMessages } from '@/composables/useAcknowledgedMessages.ts';

const selectedQueueStore = useSelectedQueueStore();
const queuePropertiesStore = useSelectedQueuePropertiesStore();
const pageContentStore = usePageContentStore();
const route = useRoute();

// Route parameters
const ns = computed(() => route.params.ns as string);
const name = computed(() => route.params.queue as string);

// Reactive queue params from route
const queueParams = computed<IQueueParams>(() => ({
  ns: ns.value,
  name: name.value,
}));

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

// Use the acknowledged messages composable
const {
  messages,
  pagination,
  isLoading,
  isDeleting,
  error,
  goToPage,
  setPageSize,
  refresh,
  deleteMessage,
} = useAcknowledgedMessages(queueParams, 20);

// Page content
const pageTitle = computed(() => {
  if (!selectedQueue.value) return 'Acknowledged Messages';

  const queueContext = `${selectedQueue.value.ns}/${selectedQueue.value.name}`;
  return `Acknowledged Messages - ${queueContext}`;
});

const pageSubtitle = computed(() => {
  if (!selectedQueue.value) return undefined;

  return queuePropertiesStore.isPubSubQueue
    ? 'Pub/Sub Queue'
    : 'Point-2-Point Queue';
});

// Page header management
watchEffect(() => {
  pageContentStore.setPageHeader({
    title: pageTitle.value,
    subtitle: pageSubtitle.value,
    icon: 'bi bi-check-circle',
  });
});

// Page content state management - simplified to handle only queue selection
watchEffect(() => {
  if (!selectedQueue.value) {
    pageContentStore.setEmptyState(true, {
      icon: 'bi bi-inbox',
      title: 'No Queue Selected',
      message:
        'Please select a queue from the sidebar to view its acknowledged messages.',
    });
    pageContentStore.setPageActions([]);
    pageContentStore.setLoadingState(false);
    pageContentStore.setErrorState(null);
    return;
  }

  // Clear page-level states when queue is selected - let MessageList component handle its own states
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

function onPageChange(page: number) {
  void goToPage(page);
}

async function onPageSizeChange(size: number) {
  await setPageSize(size);
}
</script>

<template>
  <PageContent :show-section-header="false">
    <MessageList
      v-if="selectedQueue"
      :messages="messages"
      :is-loading="isLoading"
      :error="error"
      :pagination="pagination"
      :show-pagination="true"
      empty-message="No acknowledged messages found for this queue. Messages appear here when they have been successfully processed and acknowledged by consumers."
      icon="bi-check-circle"
      :is-deleting="isDeleting"
      :is-requeuing="false"
      @refresh="refresh"
      @delete-message="handleDelete"
      @page-change="onPageChange"
      @page-size-change="onPageSizeChange"
      @first-page="onPageChange(1)"
      @previous-page="onPageChange(pagination.currentPage - 1)"
      @next-page="onPageChange(pagination.currentPage + 1)"
      @last-page="onPageChange(pagination.totalPages)"
    />
  </PageContent>
</template>

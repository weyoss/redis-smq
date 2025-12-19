<!--
  - Copyright (c)
  - Weyoss <weyoss@outlook.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { computed, watch, watchEffect } from 'vue';
import { useRoute } from 'vue-router';
import PageContent from '@/components/PageContent.vue';
import MessageList from '@/components/MessageList.vue';
import { usePageContentStore } from '@/stores/pageContent.ts';
import { useSelectedQueueStore } from '@/stores/selectedQueue.ts';
import type { IQueueParams } from '@/types/index.ts';
import { useQueueMessages } from '@/composables/useQueueMessages.ts';

const route = useRoute();
const pageContentStore = usePageContentStore();
const selectedQueueStore = useSelectedQueueStore();

// Reactive queue params from route
const queueParams = computed<IQueueParams>(() => ({
  ns: route.params.ns as string,
  name: route.params.queue as string,
}));

// Keep global selected queue in sync
watch(
  queueParams,
  (newParams) => {
    if (newParams.ns && newParams.name) {
      selectedQueueStore.selectQueue(newParams.ns, newParams.name);
    }
  },
  { immediate: true, deep: true },
);

// Use the specific queue messages composable
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
} = useQueueMessages(queueParams, 20);

// Page header wiring
const pageTitle = computed(() => {
  if (!queueParams.value.ns) return 'Queue Messages';
  return `Queue Messages - ${queueParams.value.name}@${queueParams.value.ns}`;
});

watchEffect(() => {
  pageContentStore.setPageHeader({
    title: pageTitle.value,
    subtitle: 'View and manage messages for this queue.',
    icon: 'bi bi-clock',
  });
  // Let MessageList handle its own loading/empty/error visuals
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
    <MessageList
      :messages="messages"
      :is-loading="isLoading"
      :error="error"
      :pagination="pagination"
      :show-pagination="true"
      empty-message="No messages found for this queue"
      icon="bi-clock"
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

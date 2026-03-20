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
import { useSelectedQueuePropertiesStore } from '@/stores/selectedQueueProperties.ts';
import type { IQueueParams } from '@/types';
import { useQueuePublishedMessages } from '@/composables/useQueuePublishedMessages.ts';

const route = useRoute();
const pageContentStore = usePageContentStore();
const selectedQueueStore = useSelectedQueueStore();
const queuePropertiesStore = useSelectedQueuePropertiesStore();

// Route parameters
const ns = computed(() => route.params.ns as string);
const name = computed(() => route.params.queue as string);

// Reactive queue params
const queueParams = computed<IQueueParams>(() => {
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

// Use the published messages composable
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
} = useQueuePublishedMessages(queueParams, 20);

// Page header
const pageTitle = computed(() => {
  if (!selectedQueue.value) return 'Published Messages';
  return `Published Messages - ${selectedQueue.value.name}@${selectedQueue.value.ns}`;
});

watchEffect(() => {
  pageContentStore.setPageHeader({
    title: pageTitle.value,
    subtitle: 'View all messages published to this queue.',
    icon: 'bi bi-collection-fill',
  });
  pageContentStore.setPageActions([]);
});

function handleRetryQueueProperties() {
  queuePropertiesStore.refreshQueueProperties();
}
</script>

<template>
  <PageContent :show-section-header="false">
    <MessageList
      :messages="messages"
      :pagination="pagination"
      :is-loading="isLoading"
      :error="error"
      :is-deleting="isDeleting"
      :is-requeuing="isRequeuing"
      :is-loading-queue-properties="
        queuePropertiesStore.isLoadingQueueProperties
      "
      :queue-properties-error="queuePropertiesStore.queuePropertiesError?.error"
      :has-selected-queue="!!selectedQueue"
      empty-message="No published messages found for this queue."
      icon="bi-collection-fill"
      :on-refresh="refresh"
      :on-page-change="goToPage"
      :on-page-size-change="setPageSize"
      :on-first-page="() => goToPage(1)"
      :on-previous-page="() => goToPage(pagination.currentPage - 1)"
      :on-next-page="() => goToPage(pagination.currentPage + 1)"
      :on-last-page="() => goToPage(pagination.totalPages)"
      :on-retry-queue-properties="handleRetryQueueProperties"
    />
  </PageContent>
</template>

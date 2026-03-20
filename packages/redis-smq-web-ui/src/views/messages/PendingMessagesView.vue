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
import ConsumerGroupSelector from '@/components/ConsumerGroupSelector.vue';
import { usePageContentStore } from '@/stores/pageContent.ts';
import { useSelectedQueueStore } from '@/stores/selectedQueue.ts';
import { useSelectedQueuePropertiesStore } from '@/stores/selectedQueueProperties.ts';
import type { IQueueParams } from '@/types';
import { usePendingMessages } from '@/composables/usePendingMessages.ts';

const route = useRoute();
const pageContentStore = usePageContentStore();
const selectedQueueStore = useSelectedQueueStore();
const queuePropertiesStore = useSelectedQueuePropertiesStore();

// Route parameters
const ns = computed(() => route.params.ns as string);
const name = computed(() => route.params.queue as string);
const consumerGroupId = computed(
  () => route.query.consumerGroupId as string | null,
);

// Reactive queue params
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
const queueProperties = computed(() => queuePropertiesStore.queueProperties);

// View state
const shouldShowConsumerGroupSelector = computed(() => {
  return (
    selectedQueue.value &&
    queueProperties.value &&
    isPubSubQueue.value &&
    !consumerGroupId.value
  );
});

// Conditional query execution
const conditionalQueueParams = computed<IQueueParams | null>(() => {
  if (shouldShowConsumerGroupSelector.value) {
    return null;
  }
  return queueParams.value;
});

// Use the pending messages composable
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
} = usePendingMessages(conditionalQueueParams, consumerGroupId, 20);

// Page header
const pageTitle = computed(() => {
  if (!selectedQueue.value) return 'Pending Messages';

  const queueContext = `${selectedQueue.value.name}@${selectedQueue.value.ns}`;
  if (isPubSubQueue.value && consumerGroupId.value) {
    return `Pending Messages - ${queueContext} (${consumerGroupId.value})`;
  }
  return `Pending Messages - ${queueContext}`;
});

watchEffect(() => {
  pageContentStore.setPageHeader({
    title: pageTitle.value,
    subtitle: 'View messages waiting to be processed.',
    icon: 'bi bi-clock-history',
  });
  pageContentStore.setPageActions([]);
});

function handleRetryQueueProperties() {
  queuePropertiesStore.refreshQueueProperties();
}

// Custom empty message based on queue type and consumer group
const emptyMessage = computed(() => {
  if (isPubSubQueue.value && consumerGroupId.value) {
    return `No pending messages found for consumer group "${consumerGroupId.value}".`;
  }
  return 'No pending messages found for this queue.';
});
</script>

<template>
  <PageContent :show-section-header="false">
    <!-- Consumer Group Selection for Pub/Sub Queues -->
    <ConsumerGroupSelector
      v-if="shouldShowConsumerGroupSelector"
      :show-section-header="false"
    />

    <!-- Messages Display -->
    <MessageList
      v-else
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
      :empty-message="emptyMessage"
      icon="bi-clock-history"
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

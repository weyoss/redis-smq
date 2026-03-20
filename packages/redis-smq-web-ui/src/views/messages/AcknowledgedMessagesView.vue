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
import { useAcknowledgedMessages } from '@/composables/useAcknowledgedMessages.ts';

const route = useRoute();
const pageContentStore = usePageContentStore();
const selectedQueueStore = useSelectedQueueStore();
const queuePropertiesStore = useSelectedQueuePropertiesStore();

// Route parameters
const ns = computed(() => route.params.ns as string);
const name = computed(() => route.params.queue as string);

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

// Use the acknowledged messages composable
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
  isConfigLoading,
  configError,
  ackEnabled,
  refetchConfig,
} = useAcknowledgedMessages(queueParams, 20);

// Page header
const pageTitle = computed(() => {
  if (!selectedQueue.value) return 'Acknowledged Messages';
  return `Acknowledged Messages - ${selectedQueue.value.name}@${selectedQueue.value.ns}`;
});

watchEffect(() => {
  pageContentStore.setPageHeader({
    title: pageTitle.value,
    subtitle: 'View messages that have been successfully processed.',
    icon: 'bi bi-check-circle-fill',
  });
  pageContentStore.setPageActions([]);
});

function handleRetryQueueProperties() {
  queuePropertiesStore.refreshQueueProperties();
}

function handleRetryConfig() {
  refetchConfig();
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
      :is-config-loading="isConfigLoading"
      :config-error="configError"
      :is-feature-enabled="ackEnabled"
      :has-selected-queue="!!selectedQueue"
      feature-name="Acknowledged messages"
      enable-message="Acknowledged message auditing is disabled in the RedisSMQ configuration. This view will remain empty until auditing is enabled."
      empty-message="No acknowledged messages found for this queue."
      icon="bi-check-circle-fill"
      :on-refresh="refresh"
      :enable-requeue="true"
      :on-page-change="goToPage"
      :on-page-size-change="setPageSize"
      :on-first-page="() => goToPage(1)"
      :on-previous-page="() => goToPage(pagination.currentPage - 1)"
      :on-next-page="() => goToPage(pagination.currentPage + 1)"
      :on-last-page="() => goToPage(pagination.totalPages)"
      :on-retry-queue-properties="handleRetryQueueProperties"
      :on-retry-config="handleRetryConfig"
    />
  </PageContent>
</template>

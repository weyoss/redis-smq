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
import MessageList from '@/components/MessageList.vue';
import PageContent from '@/components/PageContent.vue';
import { usePageContentStore } from '@/stores/pageContent.ts';
import { useSelectedQueuePropertiesStore } from '@/stores/selectedQueueProperties.ts';
import { useSelectedQueueStore } from '@/stores/selectedQueue.ts';
import type { IQueueParams } from '@/types/index.ts';
import { useDeadLetteredMessages } from '@/composables/useDeadLetteredMessages.ts';

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

// Use the dead-lettered messages composable
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
  isConfigLoading,
  configError,
  deadLetteringEnabled,
  refetchConfig,
} = useDeadLetteredMessages(queueParams, 20);

// Page content
const pageTitle = computed(() => {
  if (!selectedQueue.value) return 'Dead-Lettered Messages';

  const queueContext = `${selectedQueue.value.name}@${selectedQueue.value.ns}`;
  return `Dead-Lettered Messages - ${queueContext}`;
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
    icon: 'bi bi-heartbreak',
  });
});

// Page content state management
watchEffect(() => {
  if (!selectedQueue.value) {
    pageContentStore.setEmptyState(true, {
      icon: 'bi bi-inbox',
      title: 'No Queue Selected',
      message:
        'Please select a queue from the sidebar to view its dead-lettered messages.',
    });
    pageContentStore.setPageActions([]);
    pageContentStore.setLoadingState(false);
    pageContentStore.setErrorState(null);
    return;
  }

  // Clear page-level states when queue is selected
  pageContentStore.setLoadingState(false);
  pageContentStore.setErrorState(null);
  pageContentStore.setEmptyState(false);
  pageContentStore.setPageActions([]);
});
</script>

<template>
  <PageContent :show-section-header="false">
    <!-- CONFIG LOADING BANNER -->
    <div
      v-if="isConfigLoading"
      class="dlq-loading-alert"
      role="status"
      aria-live="polite"
    >
      <div class="dlq-alert-row">
        <i class="bi bi-arrow-repeat dlq-alert-icon" aria-hidden="true"></i>
        <div class="dlq-alert-text">
          <strong>Loading configuration…</strong>
          <p class="dlq-alert-message">
            Checking server settings for dead-lettered messages audit.
          </p>
        </div>
        <div class="dlq-alert-actions">
          <span
            class="spinner-border spinner-border-sm"
            aria-hidden="true"
          ></span>
        </div>
      </div>
    </div>

    <!-- CONFIG ERROR BANNER -->
    <div
      v-else-if="configError"
      class="dlq-error-alert"
      role="alert"
      aria-live="polite"
    >
      <div class="dlq-alert-row">
        <i
          class="bi bi-exclamation-triangle-fill dlq-alert-icon"
          aria-hidden="true"
        ></i>
        <div class="dlq-alert-text">
          <strong>Could not load server configuration</strong>
          <p class="dlq-alert-message">
            {{ configError }}
          </p>
        </div>
        <div class="dlq-alert-actions">
          <button
            class="btn btn-sm btn-outline-primary"
            type="button"
            @click="refetchConfig()"
          >
            <i class="bi bi-arrow-clockwise me-1"></i>
            Retry
          </button>
        </div>
      </div>
    </div>

    <!-- DISABLED STORAGE BANNER -->
    <div
      v-else-if="deadLetteringEnabled === false"
      class="dlq-disabled-alert"
      role="status"
      aria-live="polite"
    >
      <div class="dlq-alert-row">
        <i class="bi bi-info-circle-fill dlq-alert-icon" aria-hidden="true"></i>
        <div class="dlq-alert-text">
          <strong>Dead-lettered message audit is disabled</strong>
          <p class="dlq-alert-message">
            Dead-lettered message auditing is disabled in the RedisSMQ
            configuration. This view will remain empty until auditing is
            enabled.
          </p>
        </div>
      </div>
    </div>

    <!-- MAIN LIST: only when a queue is selected AND dead-lettering is enabled -->
    <MessageList
      v-if="selectedQueue && deadLetteringEnabled === true"
      :messages="messages"
      :is-loading="isLoading"
      :error="error"
      :pagination="pagination"
      :show-pagination="true"
      empty-message="No dead-lettered messages found for this queue. Messages are moved here after failing all retry attempts."
      icon="bi-heartbreak"
      :is-deleting="isDeleting"
      :is-requeuing="isRequeuing"
      @refresh="refresh"
      @delete-message="deleteMessage"
      @requeue-message="requeueMessage"
      @page-change="goToPage"
      @page-size-change="setPageSize"
      @first-page="goToPage(1)"
      @previous-page="goToPage(pagination.currentPage - 1)"
      @next-page="goToPage(pagination.currentPage + 1)"
      @last-page="goToPage(pagination.totalPages)"
    />
  </PageContent>
</template>

<style scoped>
/* Using 'dlq' prefix for styles to avoid conflicts */
.dlq-alert-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.dlq-alert-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

/* Loading */
.dlq-loading-alert {
  background: #cff4fc;
  border: 1px solid #b6effb;
  color: #055160;
  border-radius: 12px;
  padding: clamp(10px, 2.5vw, 16px);
  margin-bottom: clamp(12px, 2.5vw, 16px);
  box-shadow: 0 2px 4px rgba(5, 81, 96, 0.06);
}

/* Error */
.dlq-error-alert {
  background: #f8d7da;
  border: 1px solid #f5c2c7;
  color: #842029;
  border-radius: 12px;
  padding: clamp(10px, 2.5vw, 16px);
  margin-bottom: clamp(12px, 2.5vw, 16px);
  box-shadow: 0 2px 4px rgba(132, 32, 41, 0.06);
}

/* Disabled info */
.dlq-disabled-alert {
  background: #fff3cd;
  border: 1px solid #ffe69c;
  color: #664d03;
  border-radius: 12px;
  padding: clamp(10px, 2.5vw, 16px);
  margin-bottom: clamp(12px, 2.5vw, 16px);
  box-shadow: 0 2px 4px rgba(102, 77, 3, 0.06);
}

.dlq-alert-text {
  display: grid;
  gap: 0.25rem;
  min-width: 0;
}

.dlq-alert-message {
  margin: 0;
  line-height: 1.4;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.dlq-alert-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100%;
}

@media (max-width: 768px) {
  .dlq-alert-row {
    gap: 0.5rem;
  }
}
</style>

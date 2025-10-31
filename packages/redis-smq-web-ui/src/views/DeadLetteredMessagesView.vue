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
import { useDeadLetteredMessages } from '@/composables/useDeadLetteredMessages.ts';
import { useGetApiV1Config } from '@/api/generated/configuration/configuration.ts';
import { getErrorMessage } from '@/lib/error.ts';

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

// Use the dead lettered messages composable
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
    icon: 'bi bi-x-circle',
  });
});

// Page content state management - simplified to handle only queue selection
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

  // Clear page-level states when queue is selected - let MessageList component handle its own states
  pageContentStore.setLoadingState(false);
  pageContentStore.setErrorState(null);
  pageContentStore.setEmptyState(false);
  pageContentStore.setPageActions([]);
});

// Load RedisSMQ configuration to check if dead-lettered messages storage is enabled
const {
  data: configData,
  isLoading: isConfigLoading,
  error: configError,
  refetch: refetchConfig,
} = useGetApiV1Config();

const dlEnabled = computed<boolean | null>(() => {
  // Expected shape from generated model: data.messages.store.deadLettered.enabled
  const enabled =
    configData.value?.data?.messageAudit.deadLetteredMessages?.enabled;
  return typeof enabled === 'boolean' ? enabled : null;
});

const configErrorMessage = computed(() => {
  return getErrorMessage(configError);
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
    <!-- CONFIG LOADING BANNER -->
    <div
      v-if="isConfigLoading"
      class="dl-loading-alert"
      role="status"
      aria-live="polite"
    >
      <div class="dl-alert-row">
        <i class="bi bi-arrow-repeat dl-alert-icon" aria-hidden="true"></i>
        <div class="dl-alert-text">
          <strong>Loading configuration…</strong>
          <p class="dl-alert-message">
            Checking server settings for dead-lettered messages storage.
          </p>
        </div>
        <div class="dl-alert-actions">
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
      class="dl-error-alert"
      role="alert"
      aria-live="polite"
    >
      <div class="dl-alert-row">
        <i
          class="bi bi-exclamation-triangle-fill dl-alert-icon"
          aria-hidden="true"
        ></i>
        <div class="dl-alert-text">
          <strong>Could not load server configuration</strong>
          <p class="dl-alert-message">
            {{ configErrorMessage }}
          </p>
        </div>
        <div class="dl-alert-actions">
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
      v-else-if="dlEnabled === false"
      class="dl-disabled-alert"
      role="status"
      aria-live="polite"
    >
      <div class="dl-alert-row">
        <i class="bi bi-info-circle-fill dl-alert-icon" aria-hidden="true"></i>
        <div class="dl-alert-text">
          <strong>Dead-lettered messages audit is disabled</strong>
          <p class="dl-alert-message">
            The server configuration indicates that dead-lettered messages audit
            is not being enabled. This view may be empty or missing data until
            messages audit is enabled on the server.
          </p>
        </div>
      </div>
    </div>

    <MessageList
      v-if="selectedQueue"
      :messages="messages"
      :is-loading="isLoading"
      :error="error"
      :pagination="pagination"
      :show-pagination="true"
      empty-message="No dead-lettered messages found for this queue. Messages appear here when they fail processing and exceed retry limits."
      icon="bi-x-circle"
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
/* Shared layout for banners */
.dl-alert-row {
  display: flex;
  align-items: center; /* center vertically */
  gap: 0.75rem;
  flex-wrap: wrap;
}

.dl-alert-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.dl-alert-text {
  display: grid;
  gap: 0.25rem;
  min-width: 0;
}

.dl-alert-message {
  margin: 0;
  line-height: 1.4;
  overflow-wrap: anywhere;
  word-break: break-word;
}

/* Right-aligned actions (spinner/retry) centered vertically */
.dl-alert-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100%;
}

/* Loading style */
.dl-loading-alert {
  background: #cff4fc;
  border: 1px solid #b6effb;
  color: #055160;
  border-radius: 12px;
  padding: clamp(10px, 2.5vw, 16px);
  margin-bottom: clamp(12px, 2.5vw, 16px);
  box-shadow: 0 2px 4px rgba(5, 81, 96, 0.06);
}

/* Error style */
.dl-error-alert {
  background: #f8d7da;
  border: 1px solid #f5c2c7;
  color: #842029;
  border-radius: 12px;
  padding: clamp(10px, 2.5vw, 16px);
  margin-bottom: clamp(12px, 2.5vw, 16px);
  box-shadow: 0 2px 4px rgba(132, 32, 41, 0.06);
}

/* Disabled style */
.dl-disabled-alert {
  background: #fff3cd;
  border: 1px solid #ffe69c;
  color: #664d03;
  border-radius: 12px;
  padding: clamp(10px, 2.5vw, 16px);
  margin-bottom: clamp(12px, 2.5vw, 16px);
  box-shadow: 0 2px 4px rgba(102, 77, 3, 0.06);
}

/* Small screens: tighter gaps */
@media (max-width: 768px) {
  .dl-alert-row {
    gap: 0.5rem;
  }
}
</style>

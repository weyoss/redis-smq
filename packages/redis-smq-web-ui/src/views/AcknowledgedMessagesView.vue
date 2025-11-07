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

// Generated API client hook to load RedisSMQ configuration
// Path: packages/redis-smq-web-ui/src/api/generated/configuration/configuration.ts
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

  const queueContext = `${selectedQueue.value.name}@${selectedQueue.value.ns}`;
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

// Load RedisSMQ configuration to check if acknowledged messages storage is enabled
const {
  data: configData,
  isLoading: isConfigLoading,
  error: configError,
  refetch: refetchConfig,
} = useGetApiV1Config();

const ackEnabled = computed<boolean | null>(() => {
  const enabled =
    configData.value?.data?.messageAudit?.acknowledgedMessages?.enabled;
  return typeof enabled === 'boolean' ? enabled : null;
});

const configErrorMessage = computed(() => {
  return getErrorMessage(configError.value);
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
    <!-- CONFIG LOADING BANNER -->
    <div
      v-if="isConfigLoading"
      class="ack-loading-alert"
      role="status"
      aria-live="polite"
    >
      <div class="ack-alert-row">
        <i class="bi bi-arrow-repeat ack-alert-icon" aria-hidden="true"></i>
        <div class="ack-alert-text">
          <strong>Loading configuration…</strong>
          <p class="ack-alert-message">
            Checking server settings for acknowledged messages storage.
          </p>
        </div>
        <div class="ack-alert-actions">
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
      class="ack-error-alert"
      role="alert"
      aria-live="polite"
    >
      <div class="ack-alert-row">
        <i
          class="bi bi-exclamation-triangle-fill ack-alert-icon"
          aria-hidden="true"
        ></i>
        <div class="ack-alert-text">
          <strong>Could not load server configuration</strong>
          <p class="ack-alert-message">
            {{ configErrorMessage }}
          </p>
        </div>
        <div class="ack-alert-actions">
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
      v-else-if="ackEnabled === false"
      class="ack-disabled-alert"
      role="status"
      aria-live="polite"
    >
      <div class="ack-alert-row">
        <i class="bi bi-info-circle-fill ack-alert-icon" aria-hidden="true"></i>
        <div class="ack-alert-text">
          <strong>Acknowledged messages audit is disabled</strong>
          <p class="ack-alert-message">
            Acknowledged message auditing is disabled in the RedisSMQ
            configuration. This view will remain empty until auditing is
            enabled.
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

<style scoped>
/* Responsive, mobile-friendly banners with safe paddings and no overflow */
.ack-alert-row {
  display: flex;
  align-items: center; /* center items vertically */
  gap: 0.75rem;
  flex-wrap: wrap;
}

.ack-alert-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

/* Loading */
.ack-loading-alert {
  background: #cff4fc;
  border: 1px solid #b6effb;
  color: #055160;
  border-radius: 12px;
  padding: clamp(10px, 2.5vw, 16px);
  margin-bottom: clamp(12px, 2.5vw, 16px);
  box-shadow: 0 2px 4px rgba(5, 81, 96, 0.06);
}

/* Error */
.ack-error-alert {
  background: #f8d7da;
  border: 1px solid #f5c2c7;
  color: #842029;
  border-radius: 12px;
  padding: clamp(10px, 2.5vw, 16px);
  margin-bottom: clamp(12px, 2.5vw, 16px);
  box-shadow: 0 2px 4px rgba(132, 32, 41, 0.06);
}

/* Disabled info */
.ack-disabled-alert {
  background: #fff3cd;
  border: 1px solid #ffe69c;
  color: #664d03;
  border-radius: 12px;
  padding: clamp(10px, 2.5vw, 16px);
  margin-bottom: clamp(12px, 2.5vw, 16px);
  box-shadow: 0 2px 4px rgba(102, 77, 3, 0.06);
}

.ack-alert-text {
  display: grid;
  gap: 0.25rem;
  min-width: 0;
}

.ack-alert-message {
  margin: 0;
  line-height: 1.4;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.ack-alert-actions {
  margin-left: auto; /* push to right */
  display: flex;
  align-items: center; /* vertical centering */
  justify-content: center; /* center within its own area */
  min-height: 100%;
}

/* Small screens: stack nicely and ensure spacing respects container width */
@media (max-width: 768px) {
  .ack-alert-row {
    gap: 0.5rem;
  }
}
</style>

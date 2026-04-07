<!--
  - Copyright (c)
  - Weyoss <weyoss@outlook.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { computed, ref, watch, watchEffect } from 'vue';
import { useRoute } from 'vue-router';
import { useQueryClient } from '@tanstack/vue-query';
import { useSelectedQueueStore } from '@/stores/selectedQueue.ts';
import { useSelectedQueuePropertiesStore } from '@/stores/selectedQueueProperties.ts';
import { type PageAction, usePageContentStore } from '@/stores/pageContent.ts';
import { useEscapeKey } from '@/composables/useEscapeKey.ts';
import { getErrorMessage } from '@/lib/error.ts';

import PageContent from '@/components/PageContent.vue';
import ConsumerGroupsCard from '@/components/cards/ConsumerGroupsCard.vue';
import QueueRateLimitCard from '@/components/cards/QueueRateLimitCard.vue';
import DeleteQueueModal from '@/components/modals/DeleteQueueModal.vue';
import PauseQueueModal from '@/components/modals/PauseQueueModal.vue';
import StopQueueModal from '@/components/modals/StopQueueModal.vue';
import ResumeQueueModal from '@/components/modals/ResumeQueueModal.vue';
import QueueConsumersCard from '@/components/cards/QueueConsumersCard.vue';
import QueueOperationalStateBanner from '@/components/QueueOperationalStateBanner.vue';
import { EQueueOperationalState } from '@/types';
import { getGetApiNamespacesNsQueuesNameQueryKey } from '@/api/generated/queue/queue';
import { useGetApiNamespacesNsQueuesNameState } from '@/api/generated/queue-operational-state/queue-operational-state.ts';
import QueueMessageStatsCard from '@/components/cards/QueueMessageStatsCard.vue';
import QueueConfigurationCard from '@/components/cards/QueueConfigurationCard.vue';
import QueueOperationalStateHistoryCard from '@/components/cards/QueueOperationalStateHistoryCard.vue';
import { useTypedRouter } from '@/router/useTypeRouter.ts';

// Core State & Route Params
const route = useRoute();
const router = useTypedRouter();
const queryClient = useQueryClient();
const pageContentStore = usePageContentStore();
const selectedQueueStore = useSelectedQueueStore();
const queuePropertiesStore = useSelectedQueuePropertiesStore();

const ns = computed(() => route.params.ns as string);
const name = computed(() => route.params.queue as string);

// Data Fetching & State
const queue = computed(() => selectedQueueStore.selectedQueue);
const isLoading = computed(() => queuePropertiesStore.isLoadingQueueProperties);
const queuePropertiesError = computed(
  () => queuePropertiesStore.queuePropertiesError,
);

// Queue Status from properties
const queueOperationalState = computed<EQueueOperationalState | undefined>(
  () => queuePropertiesStore.queueProperties?.data?.operationalState,
);

// Fetch operational state details when queue is not ACTIVE
const {
  data: operationalState,
  isLoading: isLoadingOperationalState,
  error: operationalStateError,
  refetch: refetchOperationalState,
} = useGetApiNamespacesNsQueuesNameState(ns, name, {
  query: {
    enabled: computed(
      () =>
        !!ns.value &&
        !!name.value &&
        queueOperationalState.value != null &&
        queueOperationalState.value !== EQueueOperationalState.ACTIVE,
    ),
    refetchOnWindowFocus: false,
  },
});

// Modal Management
const isDeleteModalVisible = ref(false);
const isPauseModalVisible = ref(false);
const isStopModalVisible = ref(false);
const isResumeModalVisible = ref(false);

// Delete Modal
function showDeleteModal() {
  isDeleteModalVisible.value = true;
}

function hideDeleteModal() {
  isDeleteModalVisible.value = false;
}

// Pause Modal
function showPauseModal() {
  isPauseModalVisible.value = true;
}

function hidePauseModal() {
  isPauseModalVisible.value = false;
}

// Stop Modal
function showStopModal() {
  isStopModalVisible.value = true;
}

function hideStopModal() {
  isStopModalVisible.value = false;
}

// Resume Modal
function showResumeModal() {
  isResumeModalVisible.value = true;
}

function hideResumeModal() {
  isResumeModalVisible.value = false;
}

// Action Handlers
async function handleDeleteSuccess() {
  isDeleteModalVisible.value = false;
  // Invalidate queues list query
  queryClient.invalidateQueries({
    queryKey: getGetApiNamespacesNsQueuesNameQueryKey(ns.value, name.value),
  });
  // Navigate away on successful deletion
  await router.push('queues');
}

async function handlePauseSuccess() {
  // Refresh queue properties after successful pause
  await queuePropertiesStore.refreshQueueProperties();
  await refetchOperationalState();
  hidePauseModal();
}

async function handleStopSuccess() {
  // Refresh queue properties after successful stop
  await queuePropertiesStore.refreshQueueProperties();
  await refetchOperationalState();
  hideStopModal();
}

async function handleResumeSuccess() {
  // Refresh queue properties after successful resume
  await queuePropertiesStore.refreshQueueProperties();
  await refetchOperationalState();
  hideResumeModal();
}

// Combined Error Handling
const error = computed(() => {
  const err = queuePropertiesError.value || operationalStateError.value;
  return getErrorMessage(err);
});

const isQueueNotFoundError = computed(() => {
  const err = queuePropertiesError.value?.error;
  return err?.message === 'QueueNotFoundError';
});

// Determine if any queue operation is in progress
const isAnyOperationInProgress = computed(
  () => isLoading.value || isLoadingOperationalState.value,
);

// Page Content Management
const pageTitle = computed(() => `Queue: ${name.value}@${ns.value}`);
const pageSubtitle = 'Queue Details & Management';

const pageActions = computed((): PageAction[] => {
  const actions: PageAction[] = [];

  const deleteAction: PageAction = {
    id: 'delete-queue',
    label: 'Delete',
    icon: 'bi bi-trash',
    variant: 'danger',
    disabled: isAnyOperationInProgress.value,
    loading: false,
    handler: showDeleteModal,
  };

  const pauseAction: PageAction = {
    id: 'pause-queue',
    label: 'Pause',
    icon: 'bi bi-pause-fill',
    disabled: isAnyOperationInProgress.value,
    loading: false,
    handler: showPauseModal,
  };

  const stopAction: PageAction = {
    id: 'stop-queue',
    label: 'Stop',
    icon: 'bi bi-stop-fill',
    disabled: isAnyOperationInProgress.value,
    loading: false,
    handler: showStopModal,
  };

  const resumeAction: PageAction = {
    id: 'resume-queue',
    label: 'Resume',
    icon: 'bi bi-play-fill',
    disabled: isAnyOperationInProgress.value,
    loading: false,
    handler: showResumeModal,
  };

  // Add state management actions based on current queue status
  switch (queueOperationalState.value) {
    case EQueueOperationalState.ACTIVE:
      actions.push(pauseAction, stopAction, deleteAction);
      break;

    case EQueueOperationalState.PAUSED:
    case EQueueOperationalState.STOPPED:
      actions.push(resumeAction, deleteAction);
      break;

    default:
      break;
  }

  return actions;
});

function goBackToQueues() {
  selectedQueueStore.clearSelectedQueue();
  router.push('queues');
}

// Sync component state with the global page content store
watchEffect(() => {
  pageContentStore.setPageHeader({
    title: pageTitle.value,
    subtitle: pageSubtitle,
    icon: 'bi bi-card-list',
  });

  pageContentStore.setLoadingState(isLoading.value);

  if (isQueueNotFoundError.value) {
    pageContentStore.setEmptyState(true, {
      icon: 'bi bi-question-circle',
      title: 'Queue Not Found',
      message: `The queue "${name.value}" in namespace "${ns.value}" could not be found. It may have been deleted.`,
      actionLabel: 'Back to Queues',
      actionHandler: goBackToQueues,
    });
    pageContentStore.setPageActions([]);
  } else if (
    error.value &&
    !isDeleteModalVisible.value &&
    !isPauseModalVisible.value &&
    !isStopModalVisible.value &&
    !isResumeModalVisible.value
  ) {
    // Only show page-level error if no modals are active
    pageContentStore.setErrorState(error.value);
    pageContentStore.setPageActions([]);
  } else {
    pageContentStore.setEmptyState(false);
    pageContentStore.setErrorState(null);
    pageContentStore.setPageActions(pageActions.value);
  }
});

// Sync selected queue with route params
watch(
  [ns, name],
  ([newNs, newName]) => {
    if (newNs && newName) {
      selectedQueueStore.selectQueue(newNs, newName);
    } else {
      selectedQueueStore.clearSelectedQueue();
    }
  },
  { immediate: true },
);

// Keyboard Shortcuts - Close modals with Escape key
useEscapeKey([
  {
    isVisible: isDeleteModalVisible,
    onEscape: hideDeleteModal,
  },
  {
    isVisible: isPauseModalVisible,
    onEscape: hidePauseModal,
  },
  {
    isVisible: isStopModalVisible,
    onEscape: hideStopModal,
  },
  {
    isVisible: isResumeModalVisible,
    onEscape: hideResumeModal,
  },
]);

// Refresh queue properties when returning to the view
watch(
  () => route.params,
  () => {
    if (ns.value && name.value) {
      queuePropertiesStore.refreshQueueProperties();
    }
  },
  { immediate: true },
);
</script>

<template>
  <div class="queue-properties-view">
    <PageContent>
      <!-- Queue Operational State Banner - Shows when queue is not ACTIVE -->
      <QueueOperationalStateBanner
        v-if="
          queue &&
          queueOperationalState != null &&
          queueOperationalState !== EQueueOperationalState.ACTIVE
        "
        :queue="{ ns, name }"
        :status="queueOperationalState"
        :operational-state="operationalState?.data"
        :is-loading="isLoadingOperationalState"
        :error="getErrorMessage(operationalStateError?.error)?.message ?? null"
        @on-resume="showResumeModal"
        @on-refresh="refetchOperationalState"
      />

      <!-- The main content is rendered by the slot if not loading/error/empty -->
      <div v-if="queue" class="details-grid">
        <!-- Full Width Row -->
        <div class="details-full-width">
          <QueueMessageStatsCard />
          <QueueConfigurationCard />
          <QueueRateLimitCard />
          <ConsumerGroupsCard />
          <QueueOperationalStateHistoryCard />
          <QueueConsumersCard />
        </div>
      </div>
    </PageContent>

    <!-- Modals remain the same -->
    <DeleteQueueModal
      v-if="isDeleteModalVisible"
      :is-visible="isDeleteModalVisible"
      :queue="{ ns, name }"
      @close="hideDeleteModal"
      @success="handleDeleteSuccess"
    />

    <PauseQueueModal
      v-if="isPauseModalVisible"
      :is-visible="isPauseModalVisible"
      :queue="{ ns, name }"
      @close="hidePauseModal"
      @success="handlePauseSuccess"
    />

    <StopQueueModal
      v-if="isStopModalVisible"
      :is-visible="isStopModalVisible"
      :queue="{ ns, name, status: queueOperationalState }"
      @close="hideStopModal"
      @success="handleStopSuccess"
    />

    <ResumeQueueModal
      v-if="isResumeModalVisible"
      :is-visible="isResumeModalVisible"
      :queue="{ ns, name, status: queueOperationalState }"
      @close="hideResumeModal"
      @success="handleResumeSuccess"
    />
  </div>
</template>

<style scoped>
/* Mobile-first safety: sizing and overflow guards within this view */
.queue-properties-view,
.queue-properties-view * {
  box-sizing: border-box;
  max-width: 100%;
}

/* Use fluid gaps and prevent horizontal scroll; rely on PageContent padding */
.details-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(12px, 3vw, 24px);
  align-items: start;
  overflow-wrap: anywhere; /* guard against long strings overflowing */
  word-break: break-word;
}

.details-full-width {
  grid-column: 1 / -1; /* Span the entire width */
  display: flex;
  flex-direction: column;
  gap: clamp(12px, 2.5vw, 20px);
  margin-top: 0; /* Remove any top margin since grid gap handles spacing */
}

.details-column-main,
.details-column-secondary {
  display: flex;
  flex-direction: column;
  gap: clamp(12px, 2.5vw, 20px);
  min-width: 0; /* ensure children can shrink without causing overflow */
}

/* Collapse to single column earlier to avoid cramped layout */
@media (max-width: 1200px) {
  .details-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  /* On single column layout, full width is automatic */
  .details-full-width {
    grid-column: auto;
  }
}

/* Tighter gaps on tablets/phones and safe bottom spacing */
@media (max-width: 768px) {
  .details-grid {
    gap: clamp(10px, 3.5vw, 16px);
    margin-bottom: env(safe-area-inset-bottom);
  }
  .details-column-main,
  .details-column-secondary {
    gap: clamp(10px, 3.5vw, 16px);
  }
}

/* Extra small screens: ensure ample breathing room */
@media (max-width: 576px) {
  .details-grid {
    gap: clamp(8px, 4vw, 14px);
  }
}

.operation-toast {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 1100;
  max-width: 400px;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@media (max-width: 576px) {
  .operation-toast {
    left: 1rem;
    right: 1rem;
    max-width: none;
    bottom: 1rem;
  }
}
</style>

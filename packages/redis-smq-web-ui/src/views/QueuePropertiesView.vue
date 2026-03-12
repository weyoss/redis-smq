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
import { useRoute, useRouter } from 'vue-router';
import { useSelectedQueueStore } from '@/stores/selectedQueue.ts';
import { useSelectedQueuePropertiesStore } from '@/stores/selectedQueueProperties.ts';
import { type PageAction, usePageContentStore } from '@/stores/pageContent';
import { useDeleteQueue } from '@/composables/useDeleteQueue.ts';
import { useStopQueue } from '@/composables/useStopQueue.ts';
import { usePauseQueue } from '@/composables/usePauseQueue.ts';
import { useResumeQueue } from '@/composables/useResumeQueue.ts';
import { useEscapeKey } from '@/composables/useEscapeKey';
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
import { useGetApiV1NamespacesNsQueuesNameOperationalState } from '@/api/generated/queue-operational-state/queue-operational-state.ts';
import type {
  PostApiV1NamespacesNsQueuesNameOperationalStatePauseBodyReason,
  PostApiV1NamespacesNsQueuesNameOperationalStateResumeBodyReason,
  PostApiV1NamespacesNsQueuesNameOperationalStateStopBodyReason,
} from '@/api/model';
import QueueMessageStatsCard from '@/components/cards/QueueMessageStatsCard.vue';
import QueueConfigurationCard from '@/components/cards/QueueConfigurationCard.vue';
import QueueOperationalStateHistoryCard from '@/components/cards/QueueOperationalStateHistoryCard.vue';

// Core State & Route Params
const route = useRoute();
const router = useRouter();
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
} = useGetApiV1NamespacesNsQueuesNameOperationalState(ns, name, {
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

// Delete Queue Logic
const { deleteQueue, isDeletingQueue, deleteQueueError, deleteQueueMutation } =
  useDeleteQueue(async () => {
    // On successful deletion, navigate away
    await router.push({ name: 'Queues' });
  });

// Pause Queue Logic
const { pauseQueue, isPausingQueue, pauseQueueError, pauseQueueMutation } =
  usePauseQueue(async () => {
    // On successful pause, refresh queue properties
    await queuePropertiesStore.refreshQueueProperties();
    await refetchOperationalState();
    hidePauseModal();
  });

// Resume Queue Logic
const { resumeQueue, isResumingQueue, resumeQueueError, resumeQueueMutation } =
  useResumeQueue(async () => {
    // On successful resume, refresh queue properties
    await queuePropertiesStore.refreshQueueProperties();
    await refetchOperationalState();
    hideResumeModal();
  });

// Stop Queue Logic
const { stopQueue, isStoppingQueue, stopQueueError, stopQueueMutation } =
  useStopQueue(async () => {
    // On successful stop, refresh queue properties
    await queuePropertiesStore.refreshQueueProperties();
    await refetchOperationalState();
    hideStopModal();
  });

// Modal Management
const isDeleteModalVisible = ref(false);
const isPauseModalVisible = ref(false);
const isStopModalVisible = ref(false);
const isResumeModalVisible = ref(false);

// Delete Modal
function showDeleteModal() {
  deleteQueueMutation.reset();
  isDeleteModalVisible.value = true;
}

function hideDeleteModal() {
  isDeleteModalVisible.value = false;
}

// Pause Modal
function showPauseModal() {
  pauseQueueMutation.reset();
  isPauseModalVisible.value = true;
}

function hidePauseModal() {
  isPauseModalVisible.value = false;
}

// Stop Modal
function showStopModal() {
  stopQueueMutation.reset();
  isStopModalVisible.value = true;
}

function hideStopModal() {
  isStopModalVisible.value = false;
}

// Resume Modal
function showResumeModal() {
  resumeQueueMutation.reset();
  isResumeModalVisible.value = true;
}

function hideResumeModal() {
  isResumeModalVisible.value = false;
}

// Action Handlers
async function handleConfirmDelete() {
  if (!queue.value) return;
  await deleteQueue({ ns: queue.value.ns, name: queue.value.name });
}

async function handleConfirmPause(data: {
  reason: string;
  description?: string;
  metadata?: Record<string, unknown>;
}) {
  if (!queue.value) return;
  await pauseQueue({
    ns: queue.value.ns,
    name: queue.value.name,
    reason:
      data.reason as PostApiV1NamespacesNsQueuesNameOperationalStatePauseBodyReason,
    description: data.description,
    metadata: data.metadata,
  });
}

async function handleConfirmStop(data: {
  reason: string;
  description?: string;
  metadata?: Record<string, unknown>;
}) {
  if (!queue.value) return;
  await stopQueue({
    ns: queue.value.ns,
    name: queue.value.name,
    reason:
      data.reason as PostApiV1NamespacesNsQueuesNameOperationalStateStopBodyReason,
    description: data.description,
    metadata: data.metadata,
  });
}

async function handleConfirmResume(data: {
  reason: string;
  description?: string;
  metadata?: Record<string, unknown>;
}) {
  if (!queue.value) return;
  await resumeQueue({
    ns: queue.value.ns,
    name: queue.value.name,
    reason:
      data.reason as PostApiV1NamespacesNsQueuesNameOperationalStateResumeBodyReason,
    description: data.description,
    metadata: data.metadata,
  });
}

// Combined Error Handling
const error = computed(() => {
  const err =
    deleteQueueError.value ||
    pauseQueueError.value ||
    resumeQueueError.value ||
    stopQueueError.value ||
    queuePropertiesError.value ||
    operationalStateError.value;
  return getErrorMessage(err);
});

const isQueueNotFoundError = computed(() => {
  const err = queuePropertiesError.value?.error;
  return err?.message === 'QueueNotFoundError';
});

// Determine if any queue operation is in progress
const isAnyOperationInProgress = computed(
  () =>
    isLoading.value ||
    isDeletingQueue.value ||
    isPausingQueue.value ||
    isResumingQueue.value ||
    isStoppingQueue.value ||
    isLoadingOperationalState.value,
);

// Page Content Management
const pageTitle = computed(() => `${name.value} @ ${ns.value}`);
const pageSubtitle = 'Queue Details & Management';

const pageActions = computed((): PageAction[] => {
  const actions: PageAction[] = [];

  const deleteAction: PageAction = {
    id: 'delete-queue',
    label: 'Delete',
    icon: 'bi bi-trash',
    variant: 'danger',
    disabled: isAnyOperationInProgress.value,
    loading: isDeletingQueue.value,
    handler: showDeleteModal,
  };

  const pauseAction: PageAction = {
    id: 'pause-queue',
    label: 'Pause',
    icon: 'bi bi-pause-fill',
    disabled: isAnyOperationInProgress.value,
    loading: isPausingQueue.value,
    handler: showPauseModal,
  };

  const stopAction: PageAction = {
    id: 'stop-queue',
    label: 'Stop',
    icon: 'bi bi-stop-fill',
    disabled: isAnyOperationInProgress.value,
    loading: isStoppingQueue.value,
    handler: showStopModal,
  };

  const resumeAction: PageAction = {
    id: 'resume-queue',
    label: 'Resume',
    icon: 'bi bi-play-fill',
    disabled: isAnyOperationInProgress.value,
    loading: isResumingQueue.value,
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
  router.push({ name: 'Queues' });
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
        <div class="details-column-main">
          <QueueConfigurationCard />
          <ConsumerGroupsCard />
          <QueueConsumersCard />
        </div>
        <div class="details-column-secondary">
          <QueueMessageStatsCard />
          <QueueRateLimitCard />
          <QueueOperationalStateHistoryCard />
        </div>
      </div>
    </PageContent>

    <!-- Delete Confirmation Modal -->
    <DeleteQueueModal
      :queue="{ ns, name }"
      :is-deleting="isDeletingQueue"
      :is-visible="isDeleteModalVisible"
      @cancel="hideDeleteModal"
      @confirm="handleConfirmDelete"
    />

    <!-- Pause Queue Modal -->
    <PauseQueueModal
      v-if="isPauseModalVisible"
      :queue="{ ns, name }"
      :is-pausing="isPausingQueue"
      :is-visible="isPauseModalVisible"
      @cancel="hidePauseModal"
      @confirm="handleConfirmPause"
    />

    <!-- Stop Queue Modal -->
    <StopQueueModal
      v-if="isStopModalVisible"
      :queue="{ ns, name, status: queueOperationalState }"
      :is-stopping="isStoppingQueue"
      :is-visible="isStopModalVisible"
      @cancel="hideStopModal"
      @confirm="handleConfirmStop"
    />

    <!-- Resume Queue Modal -->
    <ResumeQueueModal
      v-if="isResumeModalVisible"
      :queue="{ ns, name, status: queueOperationalState }"
      :is-resuming="isResumingQueue"
      :is-visible="isResumeModalVisible"
      @cancel="hideResumeModal"
      @confirm="handleConfirmResume"
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

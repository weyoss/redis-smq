<!--
  - Copyright (c)
  - Weyoss <weyoss@outlook.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { EExchangeType, EMessagePropertyStatus } from '@/types';
import { computed, ref } from 'vue';
import { formatDate } from '@/lib/format.ts';
import DeleteMessageModal from '@/components/modals/DeleteMessageModal.vue';
import RequeueMessageModal from '@/components/modals/RequeueMessageModal.vue';
import BaseModal from './BaseModal.vue';
import { useGetApiMessagesIdUnackHistory } from '@/api/generated/messages/messages';
import type { IMessageTransferable } from '@/api/model';
import { getErrorMessage } from '@/lib/error';
import {
  EMessageUnacknowledgementCause,
  EMessageDeadLetterCause,
  EMessageUnacknowledgementAction,
} from '@/types';

interface Props {
  message: IMessageTransferable | null;
  show: boolean;
  enableRequeue?: boolean;
}

interface Emits {
  (e: 'close'): void;
  (e: 'update:show', value: boolean): void;
  (e: 'message-deleted', messageId: string): void;
  (e: 'message-requeued', messageId: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  enableRequeue: false,
});

const emit = defineEmits<Emits>();

const activeTab = ref<
  'overview' | 'body' | 'state' | 'scheduling' | 'timeline' | 'unack-history'
>('overview');
const showDeleteModal = ref(false);
const showRequeueModal = ref(false);

// Fetch unack history when message is available
const {
  data: unackHistoryData,
  isLoading: isLoadingUnackHistory,
  error: unackHistoryError,
  refetch: refetchUnackHistory,
} = useGetApiMessagesIdUnackHistory(
  computed(() => props.message?.id || ''),
  {
    query: {
      enabled: computed(
        () => !!props.message?.id && activeTab.value === 'unack-history',
      ),
      staleTime: 1000 * 30,
      refetchOnWindowFocus: false,
    },
  },
);

const unackHistory = computed(() => unackHistoryData.value?.data || []);
const unackHistoryErrorMsg = computed(() =>
  getErrorMessage(unackHistoryError.value),
);

function getUnackActionText(action: number): string {
  switch (action) {
    case EMessageUnacknowledgementAction.DEAD_LETTER:
      return 'Dead-lettered';
    case EMessageUnacknowledgementAction.REQUEUE:
      return 'Requeued';
    case EMessageUnacknowledgementAction.DELAY:
      return 'Delayed';
    default:
      return `Unknown (${action})`;
  }
}

function getUnackCauseText(cause: number): string {
  const causeMap: Record<number, string> = {
    [EMessageUnacknowledgementCause.TIMEOUT]: 'Consumer timeout',
    [EMessageUnacknowledgementCause.CONSUME_ERROR]: 'Consumer error',
    [EMessageUnacknowledgementCause.UNACKNOWLEDGED]:
      'Unacknowledged by consumer',
    [EMessageUnacknowledgementCause.OFFLINE_CONSUMER]: 'Consumer offline',
    [EMessageUnacknowledgementCause.SHUTTING_DOWN]: 'System shutting down',
    [EMessageUnacknowledgementCause.TTL_EXPIRED]: 'Message TTL expired',
    [EMessageUnacknowledgementCause.QUEUE_STOPPED]: 'Queue stopped',
    [EMessageUnacknowledgementCause.QUEUE_INVALID_STATE]:
      'Queue in invalid state',
    [EMessageUnacknowledgementCause.QUEUE_LOCKED]: 'Queue locked',
    [EMessageUnacknowledgementCause.MESSAGE_NOT_FOUND]: 'Message not found',
    [EMessageUnacknowledgementCause.QUEUE_STATE_CHANGED]: 'Queue state changed',
    [EMessageUnacknowledgementCause.QUEUE_NOT_FOUND]: 'Queue not found',
    [EMessageUnacknowledgementCause.UNEXPECTED_ERROR]: 'Unexpected error',
    [EMessageUnacknowledgementCause.INVALID_HANDLER_SIGNATURE]:
      'Invalid handler signature',
  };
  return causeMap[cause] || `Unknown cause (${cause})`;
}

function getDeadLetterCauseText(cause: number): string {
  const causeMap: Record<number, string> = {
    [EMessageDeadLetterCause.TTL_EXPIRED]: 'TTL expired',
    [EMessageDeadLetterCause.RETRY_THRESHOLD_EXCEEDED]:
      'Retry threshold exceeded',
    [EMessageDeadLetterCause.PERIODIC_MESSAGE]: 'Periodic message',
  };
  return causeMap[cause] || `Unknown cause (${cause})`;
}

// Computed properties for formatted data
const formattedCreatedAt = computed(() => {
  return formatDate(props.message?.createdAt);
});

const formattedPublishedAt = computed(() => {
  return formatDate(props.message?.messageState.publishedAt);
});

const formattedScheduledAt = computed(() => {
  return formatDate(props.message?.messageState.scheduledAt);
});

const formattedLastRetriedAt = computed(() => {
  return formatDate(props.message?.messageState.lastRetriedAttemptAt);
});

const formattedProcessingStartedAt = computed(() => {
  return formatDate(props.message?.messageState.processingStartedAt);
});

const formattedLastProcessedAt = computed(() => {
  return formatDate(props.message?.messageState.lastProcessedAt);
});

const formattedAcknowledgedAt = computed(() => {
  return formatDate(props.message?.messageState.acknowledgedAt);
});

const formattedDeadLetteredAt = computed(() => {
  return formatDate(props.message?.messageState.deadLetteredAt);
});

const formattedLastRequeuedAt = computed(() => {
  return formatDate(props.message?.messageState.lastRequeuedAt);
});

const statusBadgeClass = computed(() => {
  if (!props.message) return '';
  switch (props.message.status) {
    case EMessagePropertyStatus.SCHEDULED:
      return 'badge bg-secondary';
    case EMessagePropertyStatus.PENDING:
      return 'badge bg-warning';
    case EMessagePropertyStatus.PROCESSING:
      return 'badge bg-info';
    case EMessagePropertyStatus.ACKNOWLEDGED:
      return 'badge bg-success';
    case EMessagePropertyStatus.UNACK_DELAYING:
      return 'badge bg-warning';
    case EMessagePropertyStatus.UNACK_REQUEUING:
      return 'badge bg-warning';
    case EMessagePropertyStatus.DEAD_LETTERED:
      return 'badge bg-danger';
    default:
      return 'badge bg-secondary';
  }
});

const statusText = computed(() => {
  if (!props.message) return '';
  switch (props.message.status) {
    case EMessagePropertyStatus.SCHEDULED:
      return 'Scheduled';
    case EMessagePropertyStatus.PENDING:
      return 'Pending';
    case EMessagePropertyStatus.PROCESSING:
      return 'Processing';
    case EMessagePropertyStatus.ACKNOWLEDGED:
      return 'Acknowledged';
    case EMessagePropertyStatus.UNACK_DELAYING:
      return 'Unack Delaying';
    case EMessagePropertyStatus.UNACK_REQUEUING:
      return 'Unack Requeuing';
    case EMessagePropertyStatus.DEAD_LETTERED:
      return 'Dead Lettered';
    default:
      return 'Unknown';
  }
});

const priorityText = computed(() => {
  if (!props.message?.priority && props.message?.priority !== 0)
    return 'Normal';
  const priorities = [
    'Highest',
    'Very High',
    'High',
    'Above Normal',
    'Normal',
    'Low',
    'Very Low',
    'Lowest',
  ];
  return priorities[props.message!.priority!] || 'Normal';
});

const formattedBody = computed(() => {
  if (!props.message?.body) return '';
  try {
    if (typeof props.message.body === 'string') {
      const parsed = JSON.parse(props.message.body);
      return JSON.stringify(parsed, null, 2);
    }
    return JSON.stringify(props.message.body, null, 2);
  } catch {
    return String(props.message.body);
  }
});

// Check if any action is in progress
const isActionInProgress = computed(
  () => showDeleteModal.value || showRequeueModal.value,
);

// Enhanced timeline events with lastProcessedAt
const timelineEvents = computed(() => {
  if (!props.message) return [];

  const events = [];

  // Created event
  if (props.message.createdAt) {
    events.push({
      type: 'Created',
      timestamp: props.message.createdAt,
      icon: 'bi-plus-circle-fill',
      color: 'text-primary',
      description: 'Message was created and queued',
    });
  }

  // Scheduled events
  if (props.message.messageState.scheduledAt) {
    events.push({
      type: 'Scheduled',
      timestamp: props.message.messageState.scheduledAt,
      icon: 'bi-calendar-plus-fill',
      color: 'text-info',
      description: props.message.scheduledCron
        ? `Scheduled with cron pattern: ${props.message.scheduledCron}`
        : props.message.scheduledDelay
          ? `Scheduled with delay: ${props.message.scheduledDelay}ms`
          : 'Message scheduled for future delivery',
    });
  }

  if (props.message.messageState.lastScheduledAt) {
    events.push({
      type: 'Last Scheduled',
      timestamp: props.message.messageState.lastScheduledAt,
      icon: 'bi-calendar-check-fill',
      color: 'text-info',
      description: `Last scheduled occurrence (repeat count: ${props.message.messageState.scheduledRepeatCount})`,
    });
  }

  // Published event
  if (props.message.messageState.publishedAt) {
    events.push({
      type: 'Published',
      timestamp: props.message.messageState.publishedAt,
      icon: 'bi-send-fill',
      color: 'text-primary',
      description: 'Message was published to the queue',
    });
  }

  // Processing events
  if (props.message.messageState.processingStartedAt) {
    events.push({
      type: 'Processing Started',
      timestamp: props.message.messageState.processingStartedAt,
      icon: 'bi-play-circle-fill',
      color: 'text-warning',
      description: `Attempt #${props.message.messageState.attempts} - Consumer started processing`,
    });
  }

  // Last Processed event
  if (props.message.messageState.lastProcessedAt) {
    const processingDuration =
      props.message.messageState.processingStartedAt &&
      props.message.messageState.lastProcessedAt
        ? ` (duration: ${((props.message.messageState.lastProcessedAt - props.message.messageState.processingStartedAt) / 1000).toFixed(2)}s)`
        : '';

    events.push({
      type: 'Last Processed',
      timestamp: props.message.messageState.lastProcessedAt,
      icon: 'bi-play-circle-fill',
      color: 'text-warning',
      description: `Message was processed by consumer${processingDuration}`,
    });
  }

  // Acknowledged event
  if (props.message.messageState.acknowledgedAt) {
    events.push({
      type: 'Acknowledged',
      timestamp: props.message.messageState.acknowledgedAt,
      icon: 'bi-check2-circle',
      color: 'text-success',
      description: 'Message was successfully acknowledged',
    });
  }

  // Unacknowledged events
  if (props.message.messageState.unacknowledgedAt) {
    events.push({
      type: 'Unacknowledged',
      timestamp: props.message.messageState.unacknowledgedAt,
      icon: 'bi-arrow-counterclockwise',
      color: 'text-warning',
      description: 'Message was not acknowledged by consumer',
    });
  }

  if (props.message.messageState.lastUnacknowledgedAt) {
    events.push({
      type: 'Last Unacknowledged',
      timestamp: props.message.messageState.lastUnacknowledgedAt,
      icon: 'bi-arrow-counterclockwise',
      color: 'text-warning',
      description: `Last unacknowledged event (total attempts: ${props.message.messageState.attempts})`,
    });
  }

  // Requeued events
  if (props.message.messageState.requeuedAt) {
    events.push({
      type: 'Requeued',
      timestamp: props.message.messageState.requeuedAt,
      icon: 'bi-arrow-repeat',
      color: 'text-secondary',
      description: `Message was requeued (requeue count: ${props.message.messageState.requeueCount})`,
    });
  }

  if (props.message.messageState.lastRequeuedAt) {
    events.push({
      type: 'Last Requeued',
      timestamp: props.message.messageState.lastRequeuedAt,
      icon: 'bi-arrow-repeat',
      color: 'text-secondary',
      description: 'Last time message was requeued',
    });
  }

  // Retry events
  if (props.message.messageState.lastRetriedAttemptAt) {
    events.push({
      type: 'Last Retry Attempt',
      timestamp: props.message.messageState.lastRetriedAttemptAt,
      icon: 'bi-bootstrap-reboot',
      color: 'text-warning',
      description: `Retry #${props.message.messageState.attempts} - Delay: ${props.message.retryDelay}ms`,
    });
  }

  // Dead-lettered event
  if (props.message.messageState.deadLetteredAt) {
    events.push({
      type: 'Dead-lettered',
      timestamp: props.message.messageState.deadLetteredAt,
      icon: 'bi-x-octagon-fill',
      color: 'text-danger',
      description:
        props.message.messageState.attempts >= props.message.retryThreshold
          ? `Message was dead-lettered after ${props.message.messageState.attempts} attempts (threshold: ${props.message.retryThreshold})`
          : 'Message was moved to dead-letter queue',
    });
  }

  return events.sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
});

function handleClose(): void {
  if (isActionInProgress.value) return;
  emit('close');
  emit('update:show', false);
}

function copyToClipboard(text: string): void {
  navigator.clipboard.writeText(text);
}

function handleDeleteSuccess(): void {
  showDeleteModal.value = false;
  if (props.message?.id) {
    emit('message-deleted', props.message.id);
  }
}

function handleRequeueSuccess(): void {
  showRequeueModal.value = false;
  if (props.message?.id) {
    emit('message-requeued', props.message.id);
  }
}
</script>

<template>
  <BaseModal
    :is-visible="!!message && show"
    title="Message Details"
    :subtitle="message ? `ID: ${message.id}` : undefined"
    icon="bi bi-envelope-fill"
    size="lg"
    @close="handleClose"
  >
    <template #body>
      <div class="vm-body">
        <!-- Status Bar -->
        <div class="status-bar p-3 border rounded-2 bg-light">
          <div class="d-flex align-items-center gap-2 flex-wrap">
            <span :class="statusBadgeClass">{{ statusText }}</span>
            <span class="text-muted ms-3">
              <i class="bi bi-clock me-1"></i>
              {{ formattedCreatedAt }}
            </span>
          </div>
          <div v-if="message" class="d-flex align-items-center gap-2">
            <span class="badge bg-light text-dark border">
              <i class="bi bi-collection me-1"></i>
              {{ message.destinationQueue.name }}@{{
                message.destinationQueue.ns
              }}
            </span>
          </div>
        </div>

        <!-- Tabs -->
        <div class="modal-tabs mb-3 overflow-x-auto">
          <button
            class="tab-button"
            :class="{ active: activeTab === 'overview' }"
            :disabled="isActionInProgress"
            @click="activeTab = 'overview'"
          >
            <i class="bi bi-info-circle me-1"></i>
            Overview
          </button>
          <button
            class="tab-button"
            :class="{ active: activeTab === 'body' }"
            :disabled="isActionInProgress"
            @click="activeTab = 'body'"
          >
            <i class="bi bi-file-text me-1"></i>
            Message Body
          </button>
          <button
            class="tab-button"
            :class="{ active: activeTab === 'state' }"
            :disabled="isActionInProgress"
            @click="activeTab = 'state'"
          >
            <i class="bi bi-gear me-1"></i>
            State
          </button>
          <button
            class="tab-button"
            :class="{ active: activeTab === 'scheduling' }"
            :disabled="isActionInProgress"
            @click="activeTab = 'scheduling'"
          >
            <i class="bi bi-calendar me-1"></i>
            Scheduling
          </button>
          <button
            class="tab-button"
            :class="{ active: activeTab === 'timeline' }"
            :disabled="isActionInProgress"
            @click="activeTab = 'timeline'"
          >
            <i class="bi bi-clock-history me-2"></i>
            Timeline
          </button>
          <button
            class="tab-button"
            :class="{ active: activeTab === 'unack-history' }"
            :disabled="isActionInProgress"
            @click="activeTab = 'unack-history'"
          >
            <i class="bi bi-exclamation-triangle me-1"></i>
            Unack History
          </button>
        </div>

        <!-- Tab Content -->
        <div class="tab-panels">
          <!-- Overview Tab -->
          <div v-if="activeTab === 'overview'" class="tab-content">
            <div class="info-grid">
              <div class="info-section">
                <h6 class="section-title">
                  <i class="bi bi-info-circle me-2"></i>
                  Basic Information
                </h6>
                <div class="info-items">
                  <div class="info-item">
                    <span class="info-label">Status:</span>
                    <span :class="statusBadgeClass">{{ statusText }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Priority:</span>
                    <span class="info-value">{{ priorityText }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">TTL:</span>
                    <span class="info-value">{{ message!.ttl }}ms</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Consumer Group:</span>
                    <span class="info-value">{{
                      message!.consumerGroupId || 'None'
                    }}</span>
                  </div>
                </div>
              </div>

              <div class="info-section">
                <h6 class="section-title">
                  <i class="bi bi-arrow-repeat me-2"></i>
                  Retry Configuration
                </h6>
                <div class="info-items">
                  <div class="info-item">
                    <span class="info-label">Retry Threshold:</span>
                    <span class="info-value">{{
                      message!.retryThreshold
                    }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Retry Delay:</span>
                    <span class="info-value">{{ message!.retryDelay }}ms</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Consume Timeout:</span>
                    <span class="info-value"
                      >{{ message!.consumeTimeout }}ms</span
                    >
                  </div>
                  <div class="info-item">
                    <span class="info-label">Current Attempts:</span>
                    <span class="info-value">{{
                      message!.messageState.attempts
                    }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Requeue Count:</span>
                    <span class="info-value">{{
                      message!.messageState.requeueCount
                    }}</span>
                  </div>
                </div>
              </div>

              <div v-if="message?.exchange" class="info-section">
                <h6 class="section-title">
                  <i class="bi bi-diagram-3 me-2"></i>
                  Exchange Information
                </h6>
                <div class="info-items">
                  <div class="info-item">
                    <span class="info-label">Exchange Params:</span>
                    <span class="info-value"
                      >{{ message!.exchange!.name }}@{{
                        message!.exchange!.ns
                      }}</span
                    >
                  </div>
                  <div class="info-item">
                    <span class="info-label">Type:</span>
                    <span class="info-value">{{
                      EExchangeType[message!.exchange!.type]
                    }}</span>
                  </div>
                </div>
              </div>

              <div v-if="message?.queue" class="info-section">
                <h6 class="section-title">
                  <i class="bi bi-box me-2"></i>
                  Queue Information
                </h6>
                <div class="info-items">
                  <div class="info-item">
                    <span class="info-label">Queue Params:</span>
                    <span class="info-value"
                      >{{ message!.queue!.name }}@{{ message!.queue!.ns }}</span
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Message Body Tab -->
          <div v-if="activeTab === 'body'" class="tab-content">
            <div class="body-section">
              <div
                class="d-flex justify-content-between align-items-center mb-3"
              >
                <h6 class="section-title mb-0">
                  <i class="bi bi-file-text me-2"></i>
                  Message Body
                </h6>
                <button
                  class="btn btn-sm btn-outline-primary"
                  :disabled="isActionInProgress"
                  @click="copyToClipboard(formattedBody)"
                >
                  <i class="bi bi-clipboard me-1"></i>
                  Copy
                </button>
              </div>
              <pre class="message-body"><code>{{ formattedBody }}</code></pre>
            </div>
          </div>

          <!-- State Tab -->
          <div v-if="activeTab === 'state'" class="tab-content">
            <div class="info-grid">
              <div class="info-section">
                <h6 class="section-title">
                  <i class="bi bi-gear me-2"></i>
                  Message State
                </h6>
                <div class="info-items">
                  <div class="info-item">
                    <span class="info-label">UUID:</span>
                    <code class="info-value">{{
                      message!.messageState.uuid
                    }}</code>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Published At:</span>
                    <span class="info-value">{{ formattedPublishedAt }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Attempts:</span>
                    <span class="info-value">{{
                      message!.messageState.attempts
                    }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Expired:</span>
                    <span
                      class="badge"
                      :class="
                        message!.messageState.expired
                          ? 'bg-danger'
                          : 'bg-success'
                      "
                    >
                      {{ message!.messageState.expired ? 'Yes' : 'No' }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="info-section">
                <h6 class="section-title">
                  <i class="bi bi-clock me-2"></i>
                  Timing Information
                </h6>
                <div class="info-items">
                  <div class="info-item">
                    <span class="info-label">Processing Started At:</span>
                    <span class="info-value">{{
                      formattedProcessingStartedAt
                    }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Last Processed At:</span>
                    <span class="info-value">{{
                      formattedLastProcessedAt
                    }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Acknowledged At:</span>
                    <span class="info-value">{{
                      formattedAcknowledgedAt
                    }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Last Retried At:</span>
                    <span class="info-value">{{ formattedLastRetriedAt }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Last Requeued At:</span>
                    <span class="info-value">{{
                      formattedLastRequeuedAt
                    }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Dead-Lettered At:</span>
                    <span class="info-value">{{
                      formattedDeadLetteredAt
                    }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Scheduled Times:</span>
                    <span class="info-value">{{
                      message!.messageState.scheduledTimes
                    }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Scheduling Tab -->
          <div v-if="activeTab === 'scheduling'" class="tab-content">
            <div class="info-grid">
              <div class="info-section">
                <h6 class="section-title">
                  <i class="bi bi-calendar me-2"></i>
                  Schedule Configuration
                </h6>
                <div class="info-items">
                  <div class="info-item">
                    <span class="info-label">Scheduled At:</span>
                    <span class="info-value">{{ formattedScheduledAt }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Scheduled Cron:</span>
                    <span class="info-value">{{
                      message!.scheduledCron || 'None'
                    }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Scheduled Delay:</span>
                    <span class="info-value">
                      {{
                        message!.scheduledDelay
                          ? `${message!.scheduledDelay} ms`
                          : 'None'
                      }}
                    </span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Cron Fired:</span>
                    <span
                      class="badge"
                      :class="
                        message!.messageState.scheduledCronFired
                          ? 'bg-success'
                          : 'bg-secondary'
                      "
                    >
                      {{
                        message!.messageState.scheduledCronFired ? 'Yes' : 'No'
                      }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="info-section">
                <h6 class="section-title">
                  <i class="bi bi-arrow-repeat me-2"></i>
                  Repeat Configuration
                </h6>
                <div class="info-items">
                  <div class="info-item">
                    <span class="info-label">Repeat Period:</span>
                    <span class="info-value">
                      {{
                        message!.scheduledRepeatPeriod
                          ? `${message!.scheduledRepeatPeriod} ms`
                          : 'None'
                      }}
                    </span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Repeat Count:</span>
                    <span class="info-value">{{
                      message!.scheduledRepeat
                    }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Current Repeat:</span>
                    <span class="info-value">{{
                      message!.messageState.scheduledRepeatCount
                    }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Last Scheduled At:</span>
                    <span class="info-value">
                      {{
                        message!.messageState.lastScheduledAt
                          ? new Date(
                              message!.messageState.lastScheduledAt,
                            ).toLocaleString()
                          : 'Never'
                      }}
                    </span>
                  </div>
                </div>
              </div>

              <div
                v-if="message?.messageState.scheduledMessageParentId"
                class="info-section"
              >
                <h6 class="section-title">
                  <i class="bi bi-link me-2"></i>
                  Scheduled Message Reference
                </h6>
                <div class="info-items">
                  <div class="info-item">
                    <span class="info-label">Scheduled Message Parent ID:</span>
                    <div class="d-flex align-items-center">
                      <code class="info-value">{{
                        message!.messageState.scheduledMessageParentId
                      }}</code>
                      <button
                        class="btn btn-sm btn-outline-secondary ms-2"
                        title="Copy Scheduled Message Parent ID"
                        @click="
                          copyToClipboard(
                            message!.messageState.scheduledMessageParentId!,
                          )
                        "
                      >
                        <i class="bi bi-clipboard"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div
                v-if="message?.messageState.requeuedMessageParentId"
                class="info-section"
              >
                <h6 class="section-title">
                  <i class="bi bi-link me-2"></i>
                  Requeued Message Reference
                </h6>
                <div class="info-items">
                  <div class="info-item">
                    <span class="info-label">Requeued Message Parent ID:</span>
                    <div class="d-flex align-items-center">
                      <code class="info-value">{{
                        message!.messageState.requeuedMessageParentId
                      }}</code>
                      <button
                        class="btn btn-sm btn-outline-secondary ms-2"
                        title="Copy Requeued Message Parent ID"
                        @click="
                          copyToClipboard(
                            message!.messageState.requeuedMessageParentId!,
                          )
                        "
                      >
                        <i class="bi bi-clipboard"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Enhanced Timeline Tab -->
          <div v-if="activeTab === 'timeline'" class="tab-content">
            <div class="timeline-container">
              <div
                v-for="(event, index) in timelineEvents"
                :key="index"
                class="timeline-item enhanced"
              >
                <div class="timeline-marker" :class="event.color">
                  <i :class="event.icon"></i>
                </div>
                <div class="timeline-content">
                  <div class="timeline-header">
                    <h5 class="timeline-title">{{ event.type }}</h5>
                    <span class="timeline-badge" :class="event.color">
                      {{ formatDate(event.timestamp) }}
                    </span>
                  </div>
                  <p v-if="event.description" class="timeline-description">
                    <i class="bi bi-info-circle me-1"></i>
                    {{ event.description }}
                  </p>
                  <div class="timeline-details">
                    <small class="text-muted">
                      <i class="bi bi-clock me-1"></i>
                      {{ formatDate(event.timestamp) }}
                    </small>
                  </div>
                </div>
                <div
                  v-if="index < timelineEvents.length - 1"
                  class="timeline-connector"
                ></div>
              </div>

              <!-- No events state -->
              <div v-if="timelineEvents.length === 0" class="text-center py-4">
                <i class="bi bi-inbox fs-1 text-muted"></i>
                <p class="mt-2 text-muted">No timeline events available</p>
              </div>
            </div>
          </div>

          <!-- Unack History Tab -->
          <div v-if="activeTab === 'unack-history'" class="tab-content">
            <!-- Loading State -->
            <div v-if="isLoadingUnackHistory" class="text-center py-4">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading unack history...</span>
              </div>
              <p class="mt-2 text-muted">
                Loading unacknowledgement history...
              </p>
            </div>

            <!-- Error State -->
            <div v-else-if="unackHistoryErrorMsg" class="text-center py-4">
              <i class="bi bi-exclamation-triangle-fill text-danger fs-1"></i>
              <p class="mt-2 text-danger">{{ unackHistoryErrorMsg.message }}</p>
              <button
                class="btn btn-sm btn-outline-primary mt-2"
                @click="() => refetchUnackHistory()"
              >
                <i class="bi bi-arrow-clockwise me-1"></i>
                Retry
              </button>
            </div>

            <!-- Empty State -->
            <div v-else-if="!unackHistory?.length" class="text-center py-4">
              <i class="bi bi-inbox fs-1 text-muted"></i>
              <p class="mt-2 text-muted">
                No unacknowledgement history found for this message.
              </p>
            </div>

            <!-- Unack History List -->
            <div
              v-else
              class="d-flex flex-column gap-3"
              style="max-height: 500px; overflow-y: auto"
            >
              <div
                v-for="(entry, index) in unackHistory"
                :key="index"
                class="border rounded-3 p-3 bg-light"
              >
                <div
                  class="d-flex align-items-center gap-3 pb-2 mb-2 border-bottom"
                >
                  <span class="fw-bold text-secondary">#{{ index + 1 }}</span>
                  <span
                    class="badge"
                    :class="{
                      'bg-warning text-dark': entry.action === 2,
                      'bg-info': entry.action === 1,
                      'bg-danger': entry.action === 0,
                    }"
                  >
                    {{ getUnackActionText(entry.action) }}
                  </span>
                </div>
                <div class="d-flex flex-column gap-2">
                  <div class="d-flex align-items-start gap-2">
                    <span
                      class="fw-semibold text-secondary"
                      style="min-width: 110px"
                      >Consumer ID:</span
                    >
                    <span
                      class="font-monospace small bg-white px-2 py-1 rounded border"
                      >{{ entry.consumerId }}</span
                    >
                  </div>
                  <div class="d-flex align-items-start gap-2">
                    <span
                      class="fw-semibold text-secondary"
                      style="min-width: 110px"
                      >Retry Count:</span
                    >
                    <span>{{ entry.retryCount }}</span>
                  </div>
                  <div class="d-flex align-items-start gap-2">
                    <span
                      class="fw-semibold text-secondary"
                      style="min-width: 110px"
                      >Timestamp:</span
                    >
                    <span>{{ formatDate(entry.timestamp) }}</span>
                  </div>
                  <div class="d-flex align-items-start gap-2">
                    <span
                      class="fw-semibold text-secondary"
                      style="min-width: 110px"
                      >Cause:</span
                    >
                    <span>{{ getUnackCauseText(entry.cause) }}</span>
                  </div>
                  <div
                    v-if="entry.deadLetterCause !== undefined"
                    class="d-flex align-items-start gap-2"
                  >
                    <span
                      class="fw-semibold text-secondary"
                      style="min-width: 110px"
                      >Dead Letter Cause:</span
                    >
                    <span>{{
                      getDeadLetterCauseText(entry.deadLetterCause)
                    }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div
        class="d-flex align-items-center justify-content-end gap-2 flex-wrap"
      >
        <!-- Requeue Button (only when requeue is enabled) -->
        <button
          v-if="enableRequeue"
          type="button"
          class="btn btn-warning"
          :disabled="isActionInProgress"
          @click="showRequeueModal = true"
        >
          <i class="bi bi-arrow-clockwise me-2"></i>
          Requeue Message
        </button>

        <!-- Delete Button -->
        <button
          type="button"
          class="btn btn-danger"
          :disabled="isActionInProgress"
          @click="showDeleteModal = true"
        >
          <i class="bi bi-trash me-2"></i>
          Delete Message
        </button>

        <!-- Close Button -->
        <button
          type="button"
          class="btn btn-secondary"
          :disabled="isActionInProgress"
          @click="handleClose"
        >
          Close
        </button>
      </div>
    </template>
  </BaseModal>

  <!-- Delete Message Modal (self-contained) -->
  <DeleteMessageModal
    :is-visible="showDeleteModal"
    :message-id="message?.id || ''"
    @close="showDeleteModal = false"
    @success="handleDeleteSuccess"
  />

  <!-- Requeue Message Modal (self-contained) -->
  <RequeueMessageModal
    :is-visible="showRequeueModal"
    :message-id="message?.id || ''"
    @close="showRequeueModal = false"
    @success="handleRequeueSuccess"
  />
</template>

<style scoped>
/* Wrapper inside BaseModal body */
.vm-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow-x: hidden;
}

/* Status Bar */
.status-bar {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
}

/* Navigation Tabs - Custom component */
.modal-tabs {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  display: flex;
  gap: 0.25rem;
  padding: 0.5rem;
  overflow-x: auto;
  scrollbar-width: thin;
}

.tab-button {
  background: none;
  border: none;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6c757d;
  border-radius: 6px;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.tab-button:hover:not(:disabled) {
  color: #495057;
  background: rgba(0, 0, 0, 0.05);
}

.tab-button.active {
  color: #0d6efd;
  background: #e7f3ff;
}

.tab-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Tab Content Animation */
.tab-content {
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Info Section */
.info-section {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid #e9ecef;
}

.info-items {
  display: grid;
  gap: 0.5rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.375rem 0;
  border-bottom: 1px solid #e9ecef;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-weight: 500;
  color: #6c757d;
  font-size: 0.875rem;
}

.info-value {
  font-weight: 500;
  color: #212529;
  font-size: 0.875rem;
  text-align: right;
  overflow-wrap: anywhere;
  word-break: break-word;
}

/* Message Body */
.message-body {
  background: #ffffff;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 1rem;
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.5;
  max-height: 400px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-body code {
  background: none;
  padding: 0;
  color: inherit;
  font-size: inherit;
}

/* Enhanced Timeline Styles */
.timeline-container {
  position: relative;
  padding: 1rem 0;
}

.timeline-item.enhanced {
  position: relative;
  display: flex;
  margin-bottom: 2rem;
}

.timeline-marker {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  background: #ffffff;
  border: 2px solid #e9ecef;
  z-index: 1;
  flex-shrink: 0;
  margin-right: 1rem;
}

.timeline-marker.text-primary {
  border-color: #0d6efd;
  color: #0d6efd;
}
.timeline-marker.text-info {
  border-color: #0dcaf0;
  color: #0dcaf0;
}
.timeline-marker.text-warning {
  border-color: #ffc107;
  color: #ffc107;
}
.timeline-marker.text-success {
  border-color: #198754;
  color: #198754;
}
.timeline-marker.text-danger {
  border-color: #dc3545;
  color: #dc3545;
}
.timeline-marker.text-secondary {
  border-color: #6c757d;
  color: #6c757d;
}

.timeline-content {
  flex: 1;
  background: #ffffff;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.2s ease;
}

.timeline-content:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.timeline-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  color: #212529;
}

.timeline-badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  background: #f8f9fa;
  color: #6c757d;
}

.timeline-badge.text-primary {
  background: #e7f3ff;
  color: #0d6efd;
}
.timeline-badge.text-info {
  background: #cff4fc;
  color: #0dcaf0;
}
.timeline-badge.text-warning {
  background: #fff3cd;
  color: #ffc107;
}
.timeline-badge.text-success {
  background: #d1e7dd;
  color: #198754;
}
.timeline-badge.text-danger {
  background: #f8d7da;
  color: #dc3545;
}

.timeline-description {
  font-size: 0.875rem;
  color: #6c757d;
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
}

.timeline-details {
  font-size: 0.75rem;
  color: #adb5bd;
}

.timeline-connector {
  position: absolute;
  left: 19px;
  top: 40px;
  bottom: -20px;
  width: 2px;
  background: #e9ecef;
}

/* Responsive */
@media (max-width: 768px) {
  .modal-tabs {
    padding: 0.375rem;
  }

  .tab-button {
    padding: 0.375rem 0.75rem;
    font-size: 0.8125rem;
  }

  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }

  .info-value {
    text-align: left;
  }

  .timeline-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .timeline-marker {
    width: 32px;
    height: 32px;
    font-size: 1rem;
  }

  .timeline-connector {
    left: 15px;
  }
}

@media (max-width: 576px) {
  .message-body {
    max-height: 45vh;
  }

  .timeline-marker {
    width: 28px;
    height: 28px;
    font-size: 0.875rem;
  }

  .timeline-connector {
    left: 13px;
  }
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .status-bar,
  .modal-tabs,
  .info-section,
  .timeline-content {
    background: #2d2d2d;
    border-color: #404040;
  }

  .message-body {
    background: #1a1a1a;
    border-color: #404040;
    color: #ffffff;
  }

  .tab-button.active {
    background: #1a3a5f;
    color: #9ec1ff;
  }

  .timeline-marker {
    background: #2d2d2d;
    border-color: #404040;
  }

  .timeline-connector {
    background: #404040;
  }

  .timeline-title {
    color: #e5e7eb;
  }

  .info-label {
    color: #a0a0a0;
  }

  .info-value {
    color: #ffffff;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .tab-content,
  .tab-button,
  .timeline-content {
    transition: none;
    animation: none;
  }
}
</style>

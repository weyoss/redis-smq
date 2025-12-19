<!--
  - Copyright (c)
  - Weyoss <weyoss@outlook.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { EExchangeType, type IMessageTransferable } from '@/types';
import { computed, ref } from 'vue';
import { formatDistanceToNow } from 'date-fns';
import { formatDate } from '@/lib/format.ts';
import ConfirmationDialogModal from '@/components/modals/ConfirmationDialogModal.vue';
import BaseModal from './BaseModal.vue';

interface Props {
  message: IMessageTransferable | null;
  show: boolean;
  isDeleting?: boolean;
  isRequeuing?: boolean;
}

interface Emits {
  (e: 'close'): void;
  (e: 'update:show', value: boolean): void;
  (e: 'delete-message', messageId: string): void;
  (e: 'requeue-message', messageId: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  isDeleting: false,
  isRequeuing: false,
});

const emit = defineEmits<Emits>();

const activeTab = ref<
  'overview' | 'body' | 'state' | 'scheduling' | 'timeline'
>('overview');
const showDeleteConfirm = ref(false);
const showRequeueConfirm = ref(false);

// Computed properties for formatted data
const formattedCreatedAt = computed(() => {
  if (!props.message?.createdAt) return 'N/A';
  const date = new Date(props.message.createdAt);
  return `${date.toLocaleString()} (${formatDistanceToNow(date, { addSuffix: true })})`;
});

const formattedPublishedAt = computed(() => {
  if (!props.message?.messageState.publishedAt) return 'Not published';
  const date = new Date(props.message.messageState.publishedAt);
  return `${date.toLocaleString()} (${formatDistanceToNow(date, { addSuffix: true })})`;
});

const formattedScheduledAt = computed(() => {
  if (!props.message?.messageState.scheduledAt) return 'Not scheduled';
  const date = new Date(props.message.messageState.scheduledAt);
  return `${date.toLocaleString()} (${formatDistanceToNow(date, { addSuffix: true })})`;
});

const formattedLastRetriedAt = computed(() => {
  if (!props.message?.messageState.lastRetriedAttemptAt) return 'Never';
  const date = new Date(props.message.messageState.lastRetriedAttemptAt);
  return `${date.toLocaleString()} (${formatDistanceToNow(date, { addSuffix: true })})`;
});

const formattedProcessingStartedAt = computed(() => {
  if (!props.message?.messageState.processingStartedAt) return 'N/A';
  const date = new Date(props.message.messageState.processingStartedAt);
  return `${date.toLocaleString()} (${formatDistanceToNow(date, { addSuffix: true })})`;
});

const formattedAcknowledgedAt = computed(() => {
  if (!props.message?.messageState.acknowledgedAt) return 'N/A';
  const date = new Date(props.message.messageState.acknowledgedAt);
  return `${date.toLocaleString()} (${formatDistanceToNow(date, { addSuffix: true })})`;
});

const formattedDeadLetteredAt = computed(() => {
  if (!props.message?.messageState.deadLetteredAt) return 'N/A';
  const date = new Date(props.message.messageState.deadLetteredAt);
  return `${date.toLocaleString()} (${formatDistanceToNow(date, { addSuffix: true })})`;
});

const formattedLastRequeuedAt = computed(() => {
  if (!props.message?.messageState.lastRequeuedAt) return 'Never';
  const date = new Date(props.message.messageState.lastRequeuedAt);
  return `${date.toLocaleString()} (${formatDistanceToNow(date, { addSuffix: true })})`;
});

const statusBadgeClass = computed(() => {
  if (!props.message) return '';
  switch (props.message.status) {
    case 0:
      return 'badge bg-secondary'; // SCHEDULED
    case 1:
      return 'badge bg-warning'; // PENDING
    case 2:
      return 'badge bg-info'; // PROCESSING
    case 3:
      return 'badge bg-success'; // ACKNOWLEDGED
    case 4:
      return 'badge bg-warning'; // UNACK_DELAYING
    case 5:
      return 'badge bg-warning'; // UNACK_REQUEUING
    case 6:
      return 'badge bg-danger'; // DEAD_LETTERED
    default:
      return 'badge bg-secondary';
  }
});

const statusText = computed(() => {
  if (!props.message) return '';
  switch (props.message.status) {
    case 0:
      return 'Scheduled';
    case 1:
      return 'Pending';
    case 2:
      return 'Processing';
    case 3:
      return 'Acknowledged';
    case 4:
      return 'Unack Delaying';
    case 5:
      return 'Unack Requeuing';
    case 6:
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

// Check if message is dead-lettered (status 6)
const isDeadLettered = computed(() => props.message?.status === 6);

// Check if any action is in progress
const isActionInProgress = computed(
  () => props.isDeleting || props.isRequeuing,
);

const timelineEvents = computed(() => {
  if (!props.message) return [];
  const events = [
    {
      type: 'Created',
      timestamp: props.message.createdAt,
      icon: 'bi-plus-circle-fill',
      color: 'text-primary',
    },
    {
      type: 'Scheduled',
      timestamp: props.message.messageState.scheduledAt,
      icon: 'bi-calendar-plus-fill',
      color: 'text-info',
    },
    {
      type: 'Last Scheduled',
      timestamp: props.message.messageState.lastScheduledAt,
      icon: 'bi-calendar-check-fill',
      color: 'text-info',
    },
    {
      type: 'Published',
      timestamp: props.message.messageState.publishedAt,
      icon: 'bi-send-fill',
      color: 'text-primary',
    },
    {
      type: 'Processing Started',
      timestamp: props.message.messageState.processingStartedAt,
      icon: 'bi-play-circle-fill',
      color: 'text-warning',
    },
    {
      type: 'Acknowledged',
      timestamp: props.message.messageState.acknowledgedAt,
      icon: 'bi-check2-circle',
      color: 'text-success',
    },
    {
      type: 'Unacknowledged',
      timestamp: props.message.messageState.unacknowledgedAt,
      icon: 'bi-arrow-counterclockwise',
      color: 'text-warning',
    },
    {
      type: 'Last Unacknowledged',
      timestamp: props.message.messageState.lastUnacknowledgedAt,
      icon: 'bi-arrow-counterclockwise',
      color: 'text-warning',
    },
    {
      type: 'Requeued',
      timestamp: props.message.messageState.requeuedAt,
      icon: 'bi-arrow-repeat',
      color: 'text-secondary',
    },
    {
      type: 'Last Requeued',
      timestamp: props.message.messageState.lastRequeuedAt,
      icon: 'bi-arrow-repeat',
      color: 'text-secondary',
    },
    {
      type: 'Last Retry Attempt',
      timestamp: props.message.messageState.lastRetriedAttemptAt,
      icon: 'bi-bootstrap-reboot',
      color: 'text-warning',
    },
    {
      type: 'Dead-lettered',
      timestamp: props.message.messageState.deadLetteredAt,
      icon: 'bi-x-octagon-fill',
      color: 'text-danger',
    },
  ];
  return events
    .filter((e) => !!e.timestamp)
    .sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
});

function handleClose(): void {
  if (isActionInProgress.value) return; // Prevent closing during actions
  emit('close');
  emit('update:show', false);
}

function copyToClipboard(text: string): void {
  navigator.clipboard.writeText(text).then(() => {
    // Optional: add a toast here
    // console.log('Copied to clipboard');
  });
}

// Delete message handlers
function confirmDelete(): void {
  if (props.message?.id) {
    emit('delete-message', props.message.id);
  }
  showDeleteConfirm.value = false;
}

// Requeue message handlers
function confirmRequeue(): void {
  if (props.message?.id) {
    emit('requeue-message', props.message.id);
  }
  showRequeueConfirm.value = false;
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
        <div class="status-bar">
          <div class="status-info">
            <span :class="statusBadgeClass">{{ statusText }}</span>
            <span class="text-muted ms-3">
              <i class="bi bi-clock me-1"></i>
              {{ formattedCreatedAt }}
            </span>
          </div>
          <div v-if="message" class="queue-info">
            <span class="badge bg-light text-dark">
              <i class="bi bi-collection me-1"></i>
              {{ message.destinationQueue.name }}@{{
                message.destinationQueue.ns
              }}
            </span>
          </div>
        </div>

        <!-- Tabs -->
        <div class="modal-tabs">
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
        </div>

        <!-- Tab Content -->
        <div class="tab-panels">
          <!-- Overview Tab -->
          <div v-if="activeTab === 'overview'" class="tab-content">
            <div class="info-grid">
              <div class="info-section">
                <h6 class="section-title">Basic Information</h6>
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
                <h6 class="section-title">Retry Configuration</h6>
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
                <h6 class="section-title">Exchange Information</h6>
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
                <h6 class="section-title">Queue Information</h6>
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
                <h6 class="section-title mb-0">Message Body</h6>
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
                <h6 class="section-title">Message State</h6>
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
                <h6 class="section-title">Timing Information</h6>
                <div class="info-items">
                  <div class="info-item">
                    <span class="info-label">Processing Started At:</span>
                    <span class="info-value">{{
                      formattedProcessingStartedAt
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
                <h6 class="section-title">Schedule Configuration</h6>
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
                <h6 class="section-title">Repeat Configuration</h6>
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
                <h6 class="section-title">Scheduled Message Reference</h6>
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
                <h6 class="section-title">Requeued Message Reference</h6>
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

          <!-- Timeline Tab -->
          <div v-if="activeTab === 'timeline'" class="timeline-section">
            <ul class="timeline">
              <li
                v-for="event in timelineEvents"
                :key="`${event.type}-${event.timestamp}`"
                class="timeline-item"
              >
                <div class="timeline-marker" :class="event.color">
                  <i :class="event.icon"></i>
                </div>
                <div class="timeline-content">
                  <h5 class="timeline-title">{{ event.type }}</h5>
                  <p class="timeline-time">
                    {{ formatDate(event.timestamp) }}
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="footer-info">
        <small class="text-muted">
          <i class="bi bi-info-circle me-1"></i>
          Message created {{ formattedCreatedAt }}
        </small>
      </div>
      <div class="footer-actions">
        <!-- Requeue Button (only for dead-lettered messages) -->
        <button
          v-if="isDeadLettered"
          type="button"
          class="btn btn-warning"
          :disabled="isActionInProgress"
          @click="showRequeueConfirm = true"
        >
          <template v-if="isRequeuing">
            <span class="spinner-border spinner-border-sm me-2"></span>
            Requeuing...
          </template>
          <template v-else>
            <i class="bi bi-arrow-clockwise me-2"></i>
            Requeue Message
          </template>
        </button>

        <!-- Delete Button -->
        <button
          type="button"
          class="btn btn-danger"
          :disabled="isActionInProgress"
          @click="showDeleteConfirm = true"
        >
          <template v-if="isDeleting">
            <span class="spinner-border spinner-border-sm me-2"></span>
            Deleting...
          </template>
          <template v-else>
            <i class="bi bi-trash me-2"></i>
            Delete Message
          </template>
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

  <!-- Confirmation Dialogs using the reusable component -->
  <ConfirmationDialogModal
    :is-visible="showDeleteConfirm"
    title="Delete Message"
    message="Are you sure you want to delete this message? This action cannot be undone."
    confirm-text="Delete Message"
    variant="danger"
    :is-loading="isDeleting"
    @confirm="confirmDelete"
    @close="showDeleteConfirm = false"
  >
    <template #message-preview>
      <strong>Message ID: </strong>
      <code>{{ message?.id }}</code>
    </template>
  </ConfirmationDialogModal>

  <ConfirmationDialogModal
    :is-visible="showRequeueConfirm"
    title="Requeue Message"
    message="Are you sure you want to requeue this dead-lettered message? It will be moved back to the pending queue for processing."
    confirm-text="Requeue Message"
    variant="warning"
    :is-loading="isRequeuing"
    @confirm="confirmRequeue"
    @close="showRequeueConfirm = false"
  >
    <template #message-preview>
      <strong>Message ID: </strong>
      <code>{{ message?.id }}</code>
    </template>
  </ConfirmationDialogModal>
</template>

<style scoped>
/* Wrapper inside BaseModal body: ensure safe overflow and spacing harmony with BaseModal */
.vm-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow-x: hidden; /* guard against horizontal scroll on mobile */
}

/* Status Bar */
.status-bar {
  padding: 0.75rem 1rem;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.status-info,
.queue-info {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

/* Navigation Tabs */
.modal-tabs {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  width: 100%;
  overflow: hidden;
}

.tab-button {
  background: none;
  border: none;
  padding: 0.875rem 1rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6c757d;
  border-bottom: 3px solid transparent;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease;
  white-space: nowrap;
  align-items: center;
}

.tab-button:hover:not(:disabled) {
  color: #495057;
  background: rgba(0, 0, 0, 0.03);
}

.tab-button.active {
  color: #0d6efd;
  border-bottom-color: #0d6efd;
  background: #ffffff;
}

/* Panels */
.tab-panels {
  display: block;
}

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

/* Information Layout */
.info-grid {
  display: grid;
  gap: 1rem;
}

.info-section {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid #e9ecef;
}

.section-title {
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #495057;
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

/* Message Body Display */
.body-section {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid #e9ecef;
}

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

/* Timeline styles */
.timeline-section {
  padding: 0.5rem 0;
}

.timeline {
  list-style: none;
  padding: 0;
  margin: 0;
  position: relative;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 20px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #e9ecef;
}

.timeline-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  position: relative;
}

.timeline-item:last-child {
  margin-bottom: 0;
}

.timeline-marker {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  background: #ffffff;
  border: 2px solid #e9ecef;
  z-index: 1;
  flex-shrink: 0;
}

.timeline-marker.text-primary {
  border-color: #0d6efd;
}
.timeline-marker.text-info {
  border-color: #0dcaf0;
}
.timeline-marker.text-warning {
  border-color: #ffc107;
}
.timeline-marker.text-success {
  border-color: #198754;
}
.timeline-marker.text-danger {
  border-color: #dc3545;
}

.timeline-content {
  margin-left: 1.25rem;
  padding-top: 0.25rem;
}

.timeline-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
}

.timeline-time {
  font-size: 0.875rem;
  color: #6c757d;
  margin: 0;
}

/* Footer expect BaseModal to align content horizontally by default */
.footer-info {
  flex: 1;
  overflow-wrap: anywhere;
}

.footer-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap; /* allow wrapping instead of overflow */
  gap: 0.75rem; /* primary spacing between buttons */
}

/* Button Styles (inherited elsewhere; keep local hover transforms reduced for mobile) */
.btn {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 500;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  font-size: 0.875rem;
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn-secondary {
  background: #6c757d;
  border-color: #6c757d;
  color: #ffffff;
}
.btn-secondary:hover:not(:disabled) {
  background: #5c636a;
  border-color: #565e64;
  transform: translateY(-1px);
}
.btn-danger {
  background: #dc3545;
  border-color: #dc3545;
  color: #ffffff;
}
.btn-danger:hover:not(:disabled) {
  background: #c82333;
  border-color: #bd2130;
  transform: translateY(-1px);
}
.btn-warning {
  background: #ffc107;
  border-color: #ffc107;
  color: #212529;
}
.btn-warning:hover:not(:disabled) {
  background: #e0a800;
  border-color: #d39e00;
  transform: translateY(-1px);
}
.btn-outline-secondary {
  background: transparent;
  border-color: #6c757d;
  color: #6c757d;
}
.btn-outline-secondary:hover:not(:disabled) {
  background: #6c757d;
  color: #ffffff;
}
.btn-outline-primary {
  background: transparent;
  border-color: #0d6efd;
  color: #0d6efd;
}
.btn-outline-primary:hover:not(:disabled) {
  background: #0d6efd;
  color: #ffffff;
}
.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.8125rem;
}

/* Utilities */
.spinner-border {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  vertical-align: -0.125em;
  border: 0.125em solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spinner-border 0.75s linear infinite;
}
.spinner-border-sm {
  width: 0.875rem;
  height: 0.875rem;
  border-width: 0.125em;
}
@keyframes spinner-border {
  to {
    transform: rotate(360deg);
  }
}
.badge {
  display: inline-block;
  padding: 0.25em 0.4em;
  font-size: 0.75em;
  font-weight: 700;
  line-height: 1;
  text-align: center;
  white-space: nowrap;
  vertical-align: baseline;
  border-radius: 0.25rem;
}
.bg-secondary {
  background-color: #6c757d !important;
  color: #ffffff;
}
.bg-success {
  background-color: #198754 !important;
  color: #ffffff;
}
.bg-danger {
  background-color: #dc3545 !important;
  color: #ffffff;
}
.bg-light {
  background-color: #f8f9fa !important;
  color: #212529;
}
.text-dark {
  color: #212529 !important;
}
.text-muted {
  color: #6c757d !important;
}

/* Responsive Design */
@media (max-width: 768px) {
  .status-bar {
    padding: 0.75rem;
    gap: 0.5rem;
  }

  .modal-tabs {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }

  .tab-button {
    padding: 0.75rem 0.75rem;
    font-size: 0.82rem;
  }

  .info-section {
    padding: 0.875rem;
  }

  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }

  .info-value {
    text-align: left;
  }

  .footer-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .footer-actions .btn {
    flex: 1 1 auto;
  }
}

@media (max-width: 576px) {
  .body-section {
    padding: 0.75rem;
  }

  .message-body {
    max-height: 45vh; /* more room on small screens */
  }

  .footer-actions {
    flex-direction: column;
  }

  .footer-actions .btn {
    width: 100%;
    justify-content: center;
  }
}

/* Accessibility, High Contrast and Dark Mode parity with BaseModal */
@media (prefers-reduced-motion: reduce) {
  .tab-content,
  .btn,
  .tab-button {
    transition: none;
    animation: none;
  }
  .spinner-border {
    animation: none;
  }
}

@media (prefers-contrast: more) {
  .info-item {
    border-bottom-width: 2px;
  }
  .badge {
    border: 1px solid currentColor;
  }
}

@media (prefers-color-scheme: dark) {
  .status-bar,
  .modal-tabs {
    background: #2d2d2d;
    border-color: #404040;
  }
  .info-section,
  .body-section {
    background: #2d2d2d;
    border-color: #404040;
  }
  .message-body {
    background: #1a1a1a;
    border-color: #404040;
    color: #ffffff;
  }
  .tab-button.active {
    background: #1a1a1a;
  }
  .text-muted {
    color: #a0a0a0 !important;
  }
  .info-label {
    color: #a0a0a0;
  }
  .info-value {
    color: #ffffff;
  }
}
</style>

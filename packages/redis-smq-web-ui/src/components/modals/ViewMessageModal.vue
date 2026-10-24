<!--
  - Copyright (c)
  - Weyoss <weyoss@outlook.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import BaseModal from '@/components/ui/BaseModal.vue';
import ConfirmationModal from '@/components/modals/ConfirmationModal.vue';
import { useMessageDetail } from '@/composables/useMessageDetail';
import { useMessageUnackHistory } from '@/composables/useMessageUnackHistory';
import { useMessageActions } from '@/composables/useMessageActions';
import { EMessagePropertyStatus } from '@/types/messages.ts';
import { ExchangeTypeLabel } from '@/types/exchanges';
import {
  EMessageUnacknowledgementAction,
  EMessageUnacknowledgementCause,
  EMessageDeadLetterCause,
} from '@/types/messages';
import { formatDate, formatSince } from '@/lib/format';
import { getErrorMessage } from '@/lib/error';

type Tab =
  'overview' | 'body' | 'state' | 'scheduling' | 'timeline' | 'unack-history';

const props = defineProps<{
  isVisible: boolean;
  messageId: string | null;
}>();

const emit = defineEmits<{
  close: [];
  deleted: [];
  requeued: [];
}>();

const activeTab = ref<Tab>('overview');

// Modal-local action state. Declared before the watcher below so the
// watcher can reset them without hitting a TDZ error.
const showDelete = ref(false);
const showRequeue = ref(false);
const deleteError = ref<string | null>(null);
const requeueError = ref<string | null>(null);
const actionFlash = ref<string | null>(null);

const message = useMessageDetail(() => props.messageId);

const unackHistory = useMessageUnackHistory(
  () => props.messageId,
  () => activeTab.value === 'unack-history',
);

const actions = useMessageActions();

// Reset per-message UI state on message change, and refetch the detail
// query every time the modal becomes visible.
//
// The second part matters because `useMessageDetail`'s query observer
// is not re-registered when `isVisible` toggles — the modal stays
// mounted (BaseModal hides only its inner DOM via Teleport v-if). A
// message's state can change between two opens of the same modal: a
// consumer picks up a requeued message, a scheduled time arrives, a
// background job transitions the state, another tab requeues via
// useMessageActions. `staleTime: 5_000` on the query hid all of that;
// refetching on visibility change is the correct fix. `onConfirmRequeue`
// still calls message.refetch() explicitly so the counter updates
// immediately for the user who is watching — this watcher covers the
// close-then-reopen path.
watch(
  [() => props.messageId, () => props.isVisible],
  ([id, visible], [prevId]) => {
    if (!visible) return;
    if (id && id === prevId) {
      // Same message, re-shown — refetch for freshness.
      message.refetch();
      return;
    }
    if (id && id !== prevId) {
      // Different message — reset UI state and refetch.
      activeTab.value = 'overview';
      actionFlash.value = null;
      showDelete.value = false;
      showRequeue.value = false;
      deleteError.value = null;
      requeueError.value = null;
      message.refetch();
    }
  },
  { immediate: true },
);

// --- Actions ---
async function onConfirmDelete() {
  if (!props.messageId) return;
  deleteError.value = null;
  try {
    await actions.deleteMessage(props.messageId);
    showDelete.value = false;
    emit('deleted');
    emit('close');
  } catch (e) {
    deleteError.value = getErrorMessage(e);
  }
}

async function onConfirmRequeue() {
  if (!props.messageId) return;
  requeueError.value = null;
  try {
    await actions.requeueMessage(props.messageId);
    showRequeue.value = false;
    actionFlash.value = 'Message requeued';
    message.refetch();
    emit('requeued');
  } catch (e) {
    requeueError.value = getErrorMessage(e);
  }
}

// --- Display helpers ---
const msg = computed(() => message.message.value);

const STATUS_LABELS: Record<EMessagePropertyStatus, string> = {
  [EMessagePropertyStatus.NEW]: 'New',
  [EMessagePropertyStatus.PENDING]: 'Pending',
  [EMessagePropertyStatus.PROCESSING]: 'Processing',
  [EMessagePropertyStatus.SCHEDULED]: 'Scheduled',
  [EMessagePropertyStatus.ACKNOWLEDGED]: 'Acknowledged',
  [EMessagePropertyStatus.UNACK_REQUEUING]: 'Requeuing',
  [EMessagePropertyStatus.UNACK_DELAYING]: 'Delaying',
  [EMessagePropertyStatus.DEAD_LETTERED]: 'Dead-lettered',
};

const statusLabel = computed(() =>
  msg.value ? STATUS_LABELS[msg.value.status] : '',
);

const statusTint = computed(() => {
  const s = msg.value?.status;
  if (s === EMessagePropertyStatus.PENDING) return 'warning';
  if (s === EMessagePropertyStatus.PROCESSING) return 'info';
  if (s === EMessagePropertyStatus.ACKNOWLEDGED) return 'success';
  if (s === EMessagePropertyStatus.DEAD_LETTERED) return 'danger';
  if (
    s === EMessagePropertyStatus.UNACK_REQUEUING ||
    s === EMessagePropertyStatus.UNACK_DELAYING
  ) {
    return 'warning';
  }
  return 'secondary';
});

const priorityLabel = computed(() => {
  const p = msg.value?.priority;
  if (p == null) return 'Normal';
  const labels = [
    'Highest',
    'Very High',
    'High',
    'Above Normal',
    'Normal',
    'Low',
    'Very Low',
    'Lowest',
  ];
  return labels[p] ?? `Priority ${p}`;
});

const bodyDisplay = computed(() => {
  const b = msg.value?.body;
  if (b == null) return '';
  if (typeof b === 'string') {
    try {
      return JSON.stringify(JSON.parse(b), null, 2);
    } catch {
      return b;
    }
  }
  try {
    return JSON.stringify(b, null, 2);
  } catch {
    return String(b);
  }
});

function copyBody() {
  if (!bodyDisplay.value) return;
  navigator.clipboard.writeText(bodyDisplay.value);
}

// --- Timeline ---
interface TimelineEvent {
  type: string;
  timestamp: number;
  icon: string;
  tint: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'secondary';
  description: string;
}

const timeline = computed<TimelineEvent[]>(() => {
  const m = msg.value;
  if (!m) return [];
  const st = m.messageState;
  const events: TimelineEvent[] = [];

  events.push({
    type: 'Created',
    timestamp: m.createdAt,
    icon: 'bi-plus-circle',
    tint: 'primary',
    description: 'Message created',
  });

  if (st.scheduledAt) {
    events.push({
      type: 'Scheduled',
      timestamp: st.scheduledAt,
      icon: 'bi-calendar-plus',
      tint: 'info',
      description: m.scheduledCron
        ? `Cron: ${m.scheduledCron}`
        : m.scheduledDelay
          ? `Delay: ${m.scheduledDelay}ms`
          : 'Scheduled for delivery',
    });
  }

  if (st.publishedAt) {
    events.push({
      type: 'Published',
      timestamp: st.publishedAt,
      icon: 'bi-send',
      tint: 'primary',
      description: 'Message published',
    });
  }

  if (st.processingStartedAt) {
    events.push({
      type: 'Processing started',
      timestamp: st.processingStartedAt,
      icon: 'bi-play-circle',
      tint: 'warning',
      description: `Attempt ${st.attempts}`,
    });
  }

  if (st.lastProcessedAt) {
    events.push({
      type: 'Processed',
      timestamp: st.lastProcessedAt,
      icon: 'bi-check-circle',
      tint: 'success',
      description: 'Processed by consumer',
    });
  }

  if (st.acknowledgedAt) {
    events.push({
      type: 'Acknowledged',
      timestamp: st.acknowledgedAt,
      icon: 'bi-check-circle-fill',
      tint: 'success',
      description: 'Successfully acknowledged',
    });
  }

  if (st.unacknowledgedAt) {
    events.push({
      type: 'Unacknowledged',
      timestamp: st.unacknowledgedAt,
      icon: 'bi-arrow-counterclockwise',
      tint: 'warning',
      description: 'Not acknowledged by consumer',
    });
  }

  if (st.lastRequeuedAt) {
    events.push({
      type: 'Requeued',
      timestamp: st.lastRequeuedAt,
      icon: 'bi-arrow-repeat',
      tint: 'secondary',
      description: `Requeue count: ${st.requeueCount}`,
    });
  }

  if (st.lastRetriedAttemptAt) {
    events.push({
      type: 'Retry attempt',
      timestamp: st.lastRetriedAttemptAt,
      icon: 'bi-bootstrap-reboot',
      tint: 'warning',
      description: `Delay: ${m.retryDelay}ms`,
    });
  }

  if (st.deadLetteredAt) {
    events.push({
      type: 'Dead-lettered',
      timestamp: st.deadLetteredAt,
      icon: 'bi-x-octagon-fill',
      tint: 'danger',
      description: `After ${st.attempts} attempts`,
    });
  }

  return events.sort((a, b) => a.timestamp - b.timestamp);
});

// --- Unack history labels ---
function unackActionLabel(action: EMessageUnacknowledgementAction): string {
  switch (action) {
    case EMessageUnacknowledgementAction.DEAD_LETTER:
      return 'Dead-lettered';
    case EMessageUnacknowledgementAction.REQUEUE:
      return 'Requeued';
    case EMessageUnacknowledgementAction.DELAY:
      return 'Delayed';
  }
}

const UNACK_CAUSE_LABELS: Record<EMessageUnacknowledgementCause, string> = {
  [EMessageUnacknowledgementCause.TIMEOUT]: 'Timeout',
  [EMessageUnacknowledgementCause.CONSUME_ERROR]: 'Consume error',
  [EMessageUnacknowledgementCause.UNACKNOWLEDGED]: 'Unacknowledged',
  [EMessageUnacknowledgementCause.OFFLINE_CONSUMER]: 'Offline consumer',
  [EMessageUnacknowledgementCause.SHUTTING_DOWN]: 'Shutting down',
  [EMessageUnacknowledgementCause.TTL_EXPIRED]: 'TTL expired',
  [EMessageUnacknowledgementCause.QUEUE_STOPPED]: 'Queue stopped',
  [EMessageUnacknowledgementCause.QUEUE_INVALID_STATE]: 'Queue invalid state',
  [EMessageUnacknowledgementCause.QUEUE_LOCKED]: 'Queue locked',
  [EMessageUnacknowledgementCause.MESSAGE_NOT_FOUND]: 'Message not found',
  [EMessageUnacknowledgementCause.QUEUE_STATE_CHANGED]: 'Queue state changed',
  [EMessageUnacknowledgementCause.QUEUE_NOT_FOUND]: 'Queue not found',
  [EMessageUnacknowledgementCause.UNEXPECTED_ERROR]: 'Unexpected error',
  [EMessageUnacknowledgementCause.INVALID_HANDLER_SIGNATURE]:
    'Invalid handler signature',
};

const DEAD_LETTER_CAUSE_LABELS: Record<EMessageDeadLetterCause, string> = {
  [EMessageDeadLetterCause.TTL_EXPIRED]: 'TTL expired',
  [EMessageDeadLetterCause.RETRY_THRESHOLD_EXCEEDED]:
    'Retry threshold exceeded',
  [EMessageDeadLetterCause.PERIODIC_MESSAGE]: 'Periodic message',
};

// --- Requeue eligibility ---
// redis-smq allows requeue from ACKNOWLEDGED or DEAD_LETTERED. Any
// other status returns MessageNotRequeueableError server-side.
const canRequeue = computed(() => {
  const s = msg.value?.status;
  return (
    s === EMessagePropertyStatus.ACKNOWLEDGED ||
    s === EMessagePropertyStatus.DEAD_LETTERED
  );
});

const TABS: ReadonlyArray<{ id: Tab; label: string; icon: string }> = [
  { id: 'overview', label: 'Overview', icon: 'bi-info-circle' },
  { id: 'body', label: 'Body', icon: 'bi-file-text' },
  { id: 'state', label: 'State', icon: 'bi-gear' },
  { id: 'scheduling', label: 'Scheduling', icon: 'bi-calendar' },
  { id: 'timeline', label: 'Timeline', icon: 'bi-clock-history' },
  {
    id: 'unack-history',
    label: 'Unack history',
    icon: 'bi-exclamation-triangle',
  },
];

function close() {
  if (showDelete.value || showRequeue.value) return;
  emit('close');
}
</script>

<template>
  <BaseModal
    :is-visible="isVisible"
    title="Message details"
    :subtitle="messageId ?? undefined"
    icon="bi-envelope"
    size="xl"
    @close="close"
  >
    <template #body>
      <!-- Loading -->
      <div v-if="message.isLoading.value" class="center-state">
        <div class="spinner-border text-primary" role="status" />
        <p>Loading message…</p>
      </div>

      <!-- Error -->
      <div
        v-else-if="message.error.value"
        class="center-state center-state--error"
      >
        <i class="bi bi-exclamation-triangle-fill" aria-hidden="true" />
        <p>{{ message.error.value }}</p>
        <button
          class="btn btn-sm btn-outline-secondary"
          @click="message.refetch()"
        >
          Try again
        </button>
      </div>

      <!-- Content -->
      <div v-else-if="msg" class="view-message">
        <!-- Status bar -->
        <div class="status-bar">
          <span class="badge" :class="`bg-${statusTint}`">
            {{ statusLabel }}
          </span>
          <span class="status-bar__meta">
            <i class="bi bi-clock me-1" aria-hidden="true" />
            <span :title="formatDate(msg.createdAt)">
              {{ formatSince(msg.createdAt) }}
            </span>
          </span>
          <span class="status-bar__meta">
            <i class="bi bi-collection me-1" aria-hidden="true" />
            {{ msg.destinationQueue.name }}@{{ msg.destinationQueue.ns }}
          </span>
        </div>

        <!-- Tabs -->
        <nav class="vm-tabs" role="tablist" aria-label="Message details tabs">
          <button
            v-for="t in TABS"
            :key="t.id"
            type="button"
            role="tab"
            class="vm-tab"
            :class="{ 'vm-tab--active': activeTab === t.id }"
            :aria-selected="activeTab === t.id"
            @click="activeTab = t.id"
          >
            <i :class="t.icon" aria-hidden="true" />
            {{ t.label }}
          </button>
        </nav>

        <!-- Overview -->
        <div v-if="activeTab === 'overview'" class="vm-panel">
          <dl class="vm-grid">
            <div>
              <dt>ID</dt>
              <dd class="font-mono">{{ msg.id }}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{{ statusLabel }}</dd>
            </div>
            <div>
              <dt>Priority</dt>
              <dd>{{ priorityLabel }}</dd>
            </div>
            <div>
              <dt>Consumer group</dt>
              <dd>{{ msg.consumerGroupId ?? '—' }}</dd>
            </div>
            <div>
              <dt>TTL</dt>
              <dd>{{ msg.ttl }}ms</dd>
            </div>
            <div>
              <dt>Consume timeout</dt>
              <dd>{{ msg.consumeTimeout }}ms</dd>
            </div>
            <div>
              <dt>Retry threshold</dt>
              <dd>{{ msg.retryThreshold }}</dd>
            </div>
            <div>
              <dt>Retry delay</dt>
              <dd>{{ msg.retryDelay }}ms</dd>
            </div>
            <div>
              <dt>Attempts</dt>
              <dd>{{ msg.messageState.attempts }}</dd>
            </div>
            <div>
              <dt>Requeue count</dt>
              <dd>{{ msg.messageState.requeueCount }}</dd>
            </div>
            <div v-if="msg.exchange">
              <dt>Exchange</dt>
              <dd>
                {{ msg.exchange.name }}@{{ msg.exchange.ns }} ({{
                  ExchangeTypeLabel[msg.exchange.type]
                }})
              </dd>
            </div>
            <div v-if="msg.queue">
              <dt>Queue</dt>
              <dd>{{ msg.queue.name }}@{{ msg.queue.ns }}</dd>
            </div>
          </dl>
        </div>

        <!-- Body -->
        <div v-if="activeTab === 'body'" class="vm-panel">
          <div class="vm-body-head">
            <h4>Message body</h4>
            <button class="btn btn-sm btn-outline-secondary" @click="copyBody">
              <i class="bi bi-clipboard me-1" aria-hidden="true" /> Copy
            </button>
          </div>
          <pre class="vm-body font-mono">{{ bodyDisplay || '(empty)' }}</pre>
        </div>

        <!-- State -->
        <div v-if="activeTab === 'state'" class="vm-panel">
          <dl class="vm-grid">
            <div>
              <dt>UUID</dt>
              <dd class="font-mono">{{ msg.messageState.uuid }}</dd>
            </div>
            <div>
              <dt>Attempts</dt>
              <dd>{{ msg.messageState.attempts }}</dd>
            </div>
            <div>
              <dt>Expired</dt>
              <dd>{{ msg.messageState.expired ? 'Yes' : 'No' }}</dd>
            </div>
            <div>
              <dt>Effective scheduled delay</dt>
              <dd>{{ msg.messageState.effectiveScheduledDelay }}ms</dd>
            </div>
            <div>
              <dt>Published at</dt>
              <dd>
                {{
                  msg.messageState.publishedAt
                    ? formatDate(msg.messageState.publishedAt)
                    : '—'
                }}
              </dd>
            </div>
            <div>
              <dt>Processing started</dt>
              <dd>
                {{
                  msg.messageState.processingStartedAt
                    ? formatDate(msg.messageState.processingStartedAt)
                    : '—'
                }}
              </dd>
            </div>
            <div>
              <dt>Last processed</dt>
              <dd>
                {{
                  msg.messageState.lastProcessedAt
                    ? formatDate(msg.messageState.lastProcessedAt)
                    : '—'
                }}
              </dd>
            </div>
            <div>
              <dt>Acknowledged</dt>
              <dd>
                {{
                  msg.messageState.acknowledgedAt
                    ? formatDate(msg.messageState.acknowledgedAt)
                    : '—'
                }}
              </dd>
            </div>
            <div>
              <dt>Unacknowledged</dt>
              <dd>
                {{
                  msg.messageState.unacknowledgedAt
                    ? formatDate(msg.messageState.unacknowledgedAt)
                    : '—'
                }}
              </dd>
            </div>
            <div>
              <dt>Dead-lettered</dt>
              <dd>
                {{
                  msg.messageState.deadLetteredAt
                    ? formatDate(msg.messageState.deadLetteredAt)
                    : '—'
                }}
              </dd>
            </div>
            <div>
              <dt>Requeued</dt>
              <dd>
                {{
                  msg.messageState.requeuedAt
                    ? formatDate(msg.messageState.requeuedAt)
                    : '—'
                }}
              </dd>
            </div>
            <div>
              <dt>Last requeued</dt>
              <dd>
                {{
                  msg.messageState.lastRequeuedAt
                    ? formatDate(msg.messageState.lastRequeuedAt)
                    : '—'
                }}
              </dd>
            </div>
            <div>
              <dt>Last retry</dt>
              <dd>
                {{
                  msg.messageState.lastRetriedAttemptAt
                    ? formatDate(msg.messageState.lastRetriedAttemptAt)
                    : '—'
                }}
              </dd>
            </div>
          </dl>
        </div>

        <!-- Scheduling -->
        <div v-if="activeTab === 'scheduling'" class="vm-panel">
          <dl class="vm-grid">
            <div>
              <dt>Scheduled at</dt>
              <dd>
                {{
                  msg.messageState.scheduledAt
                    ? formatDate(msg.messageState.scheduledAt)
                    : '—'
                }}
              </dd>
            </div>
            <div>
              <dt>Scheduled delay</dt>
              <dd>
                {{ msg.scheduledDelay ?? '—'
                }}{{ msg.scheduledDelay ? 'ms' : '' }}
              </dd>
            </div>
            <div>
              <dt>Cron</dt>
              <dd class="font-mono">{{ msg.scheduledCron ?? '—' }}</dd>
            </div>
            <div>
              <dt>Cron fired</dt>
              <dd>{{ msg.messageState.scheduledCronFired ? 'Yes' : 'No' }}</dd>
            </div>
            <div>
              <dt>Repeat count</dt>
              <dd>{{ msg.scheduledRepeat }}</dd>
            </div>
            <div>
              <dt>Repeat period</dt>
              <dd>
                {{ msg.scheduledRepeatPeriod ?? '—'
                }}{{ msg.scheduledRepeatPeriod ? 'ms' : '' }}
              </dd>
            </div>
            <div>
              <dt>Repeat progress</dt>
              <dd>
                {{ msg.messageState.scheduledRepeatCount }} /
                {{ msg.scheduledRepeat }}
              </dd>
            </div>
            <div>
              <dt>Last scheduled</dt>
              <dd>
                {{
                  msg.messageState.lastScheduledAt
                    ? formatDate(msg.messageState.lastScheduledAt)
                    : '—'
                }}
              </dd>
            </div>
            <div v-if="msg.messageState.scheduledMessageParentId">
              <dt>Scheduled parent</dt>
              <dd class="font-mono">
                {{ msg.messageState.scheduledMessageParentId }}
              </dd>
            </div>
            <div v-if="msg.messageState.requeuedMessageParentId">
              <dt>Requeued parent</dt>
              <dd class="font-mono">
                {{ msg.messageState.requeuedMessageParentId }}
              </dd>
            </div>
          </dl>
        </div>

        <!-- Timeline -->
        <div v-if="activeTab === 'timeline'" class="vm-panel">
          <ol v-if="timeline.length > 0" class="timeline">
            <li
              v-for="e in timeline"
              :key="`${e.type}-${e.timestamp}`"
              class="timeline__item"
            >
              <span
                class="timeline__icon"
                :class="`timeline__icon--${e.tint}`"
                aria-hidden="true"
              >
                <i :class="e.icon" />
              </span>
              <div class="timeline__body">
                <div class="timeline__head">
                  <strong>{{ e.type }}</strong>
                  <span class="timeline__time" :title="formatDate(e.timestamp)">
                    {{ formatSince(e.timestamp) }}
                  </span>
                </div>
                <p class="timeline__desc">{{ e.description }}</p>
              </div>
            </li>
          </ol>
          <p v-else class="muted">No events recorded.</p>
        </div>

        <!-- Unack history -->
        <div v-if="activeTab === 'unack-history'" class="vm-panel">
          <div v-if="unackHistory.isDisabled.value" class="center-state">
            <i class="bi bi-info-circle" aria-hidden="true" />
            <p>
              Unacknowledgement history is disabled in the server configuration.
            </p>
          </div>
          <div v-else-if="unackHistory.isLoading.value" class="center-state">
            <div class="spinner-border text-primary" role="status" />
            <p>Loading…</p>
          </div>
          <div
            v-else-if="unackHistory.error.value"
            class="center-state center-state--error"
          >
            <i class="bi bi-exclamation-triangle-fill" aria-hidden="true" />
            <p>{{ unackHistory.error.value }}</p>
          </div>
          <div
            v-else-if="unackHistory.history.value.length === 0"
            class="center-state"
          >
            <i class="bi bi-inbox" aria-hidden="true" />
            <p>No unacknowledgement events recorded.</p>
          </div>
          <ol v-else class="unack-list">
            <li
              v-for="(rec, i) in unackHistory.history.value"
              :key="i"
              class="unack-item"
            >
              <div class="unack-item__head">
                <span class="unack-item__badge">
                  {{ unackActionLabel(rec.action) }}
                </span>
                <span
                  class="unack-item__time"
                  :title="formatDate(rec.timestamp)"
                >
                  {{ formatSince(rec.timestamp) }}
                </span>
              </div>
              <dl class="vm-grid">
                <div>
                  <dt>Consumer</dt>
                  <dd class="font-mono">{{ rec.consumerId }}</dd>
                </div>
                <div>
                  <dt>Cause</dt>
                  <dd>{{ UNACK_CAUSE_LABELS[rec.cause] }}</dd>
                </div>
                <div>
                  <dt>Retry count</dt>
                  <dd>{{ rec.retryCount }}</dd>
                </div>
                <div v-if="rec.deadLetterCause !== undefined">
                  <dt>Dead letter cause</dt>
                  <dd>{{ DEAD_LETTER_CAUSE_LABELS[rec.deadLetterCause] }}</dd>
                </div>
              </dl>
            </li>
          </ol>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="vm-footer">
        <div v-if="actionFlash" class="vm-footer__flash" role="status">
          <i class="bi bi-check-circle-fill me-1" aria-hidden="true" />
          {{ actionFlash }}
        </div>
        <button type="button" class="btn btn-secondary" @click="close">
          Close
        </button>
        <button
          v-if="canRequeue"
          type="button"
          class="btn btn-warning"
          :disabled="actions.isRequeuing.value"
          @click="showRequeue = true"
        >
          <i class="bi bi-arrow-repeat me-1" aria-hidden="true" /> Requeue
        </button>
        <button
          type="button"
          class="btn btn-danger"
          :disabled="actions.isDeleting.value"
          @click="showDelete = true"
        >
          <i class="bi bi-trash me-1" aria-hidden="true" /> Delete
        </button>
      </div>
    </template>
  </BaseModal>

  <ConfirmationModal
    :is-visible="showDelete"
    title="Delete message"
    subtitle="This action cannot be undone"
    icon="bi-exclamation-triangle"
    :message="`Delete message ${messageId ?? ''}?`"
    confirm-label="Delete"
    confirm-variant="danger"
    :is-pending="actions.isDeleting.value"
    :error="deleteError"
    @close="showDelete = false"
    @confirm="onConfirmDelete"
  />

  <ConfirmationModal
    :is-visible="showRequeue"
    title="Requeue message"
    icon="bi-arrow-repeat"
    :message="`Requeue message ${messageId ?? ''}?`"
    confirm-label="Requeue"
    confirm-variant="primary"
    :is-pending="actions.isRequeuing.value"
    :error="requeueError"
    @close="showRequeue = false"
    @confirm="onConfirmRequeue"
  />
</template>

<style scoped>
.view-message {
  display: flex;
  flex-direction: column;
  gap: var(--rsmq-space-4);
}

.status-bar {
  display: flex;
  align-items: center;
  gap: var(--rsmq-space-3);
  flex-wrap: wrap;
  padding: var(--rsmq-space-3);
  background: var(--rsmq-color-bg);
  border-radius: var(--rsmq-radius-md);
}
.status-bar__meta {
  display: inline-flex;
  align-items: center;
  color: var(--rsmq-color-text-muted);
  font-size: 0.8rem;
}

.vm-tabs {
  display: flex;
  gap: var(--rsmq-space-1);
  border-bottom: 1px solid var(--rsmq-color-border);
  overflow-x: auto;
  scrollbar-width: thin;
}
.vm-tab {
  display: inline-flex;
  align-items: center;
  gap: var(--rsmq-space-2);
  padding: var(--rsmq-space-2) var(--rsmq-space-3);
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--rsmq-color-text-muted);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  margin-bottom: -1px;
  transition:
    color var(--rsmq-transition),
    border-color var(--rsmq-transition);
}
.vm-tab:hover {
  color: var(--rsmq-color-primary);
}
.vm-tab--active {
  color: var(--rsmq-color-primary);
  border-bottom-color: var(--rsmq-color-primary);
  font-weight: 600;
}

.vm-panel {
  min-height: 200px;
}

.vm-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--rsmq-space-3);
  margin: 0;
}
.vm-grid dt {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--rsmq-color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.02em;
  margin-bottom: 2px;
}
.vm-grid dd {
  margin: 0;
  color: var(--rsmq-color-text);
  font-weight: 500;
  font-size: 0.875rem;
  overflow-wrap: anywhere;
}

.vm-body-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--rsmq-space-3);
}
.vm-body-head h4 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
}
.vm-body {
  margin: 0;
  padding: var(--rsmq-space-3);
  background: var(--rsmq-color-bg);
  border: 1px solid var(--rsmq-color-border);
  border-radius: var(--rsmq-radius-sm);
  font-size: 0.8rem;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 400px;
  overflow-y: auto;
}

.center-state {
  padding: var(--rsmq-space-6) var(--rsmq-space-4);
  text-align: center;
  color: var(--rsmq-color-text-muted);
}
.center-state i {
  font-size: 2rem;
  display: block;
  margin: 0 auto var(--rsmq-space-2);
}
.center-state p {
  margin: var(--rsmq-space-2) 0;
}
.center-state--error {
  color: var(--rsmq-color-danger);
}

.timeline {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--rsmq-space-3);
}
.timeline__item {
  display: flex;
  gap: var(--rsmq-space-3);
  align-items: flex-start;
}
.timeline__icon {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 0.9rem;
  color: #fff;
}
.timeline__icon--primary {
  background: var(--rsmq-color-primary);
}
.timeline__icon--success {
  background: var(--rsmq-color-success);
}
.timeline__icon--warning {
  background: var(--rsmq-color-warning);
}
.timeline__icon--danger {
  background: var(--rsmq-color-danger);
}
.timeline__icon--info {
  background: var(--rsmq-color-info);
}
.timeline__icon--secondary {
  background: var(--rsmq-color-text-muted);
}
.timeline__body {
  flex: 1;
  min-width: 0;
  background: var(--rsmq-color-bg);
  border-radius: var(--rsmq-radius-sm);
  padding: var(--rsmq-space-2) var(--rsmq-space-3);
}
.timeline__head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: var(--rsmq-space-2);
  flex-wrap: wrap;
}
.timeline__time {
  font-size: 0.75rem;
  color: var(--rsmq-color-text-muted);
}
.timeline__desc {
  margin: var(--rsmq-space-1) 0 0;
  font-size: 0.8rem;
  color: var(--rsmq-color-text-muted);
}

.unack-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--rsmq-space-3);
}
.unack-item {
  border: 1px solid var(--rsmq-color-border);
  border-radius: var(--rsmq-radius-md);
  padding: var(--rsmq-space-3);
}
.unack-item__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--rsmq-space-2);
  gap: var(--rsmq-space-2);
  flex-wrap: wrap;
}
.unack-item__badge {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  padding: 0.15rem 0.5rem;
  background: var(--rsmq-color-primary-tint);
  color: var(--rsmq-color-primary);
  border-radius: var(--rsmq-radius-sm);
}
.unack-item__time {
  font-size: 0.75rem;
  color: var(--rsmq-color-text-muted);
}

.vm-footer {
  display: flex;
  align-items: center;
  gap: var(--rsmq-space-2);
  width: 100%;
  justify-content: flex-end;
  flex-wrap: wrap;
}
.vm-footer__flash {
  margin-right: auto;
  color: var(--rsmq-color-success);
  font-size: 0.85rem;
  font-weight: 500;
}

.muted {
  margin: 0;
  color: var(--rsmq-color-text-muted);
  font-size: 0.85rem;
  text-align: center;
}

@media (max-width: 576px) {
  .vm-grid {
    grid-template-columns: 1fr;
  }
  .vm-footer {
    flex-direction: column-reverse;
  }
  .vm-footer .btn {
    width: 100%;
    justify-content: center;
  }
  .vm-footer__flash {
    margin-right: 0;
    text-align: center;
    width: 100%;
  }
}
</style>

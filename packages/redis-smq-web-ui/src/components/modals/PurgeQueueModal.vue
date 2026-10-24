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
import { usePurgeQueueMessages } from '@/composables/usePurgeQueueMessages';
import { usePurgeConsumerGroupMessages } from '@/composables/usePurgeConsumerGroupMessages';
import { usePurgeQueueJob } from '@/composables/usePurgeQueueJob';
import { useCancelPurgeJob } from '@/composables/useCancelPurgeJob';
import { EBackgroundJobStatus } from '@/types/queues';
import type { IQueueParams, MessageStatus } from '@/api/model';

type Phase = 'confirm' | 'running' | 'done' | 'error' | 'cancelled';

const props = defineProps<{
  isVisible: boolean;
  queue: IQueueParams | null;
  defaultStatus: MessageStatus;
  consumerGroupId?: string | null;
}>();

const emit = defineEmits<{ close: []; purged: [] }>();

// --- Phase ---
const phase = ref<Phase>('confirm');

const selectedStatus = ref<MessageStatus>(props.defaultStatus);
const trackedStatus = ref<MessageStatus | null>(null);
const jobId = ref<string | null>(null);

// `published` in the API = "all messages regardless of status". The UI
// surfaces this as "All messages" and locks in a destructive-confirm
// checkbox for it. Every other status is a narrowing filter.
const isAllScope = computed(() => selectedStatus.value === 'published');

// --- Composables ---
const purger = usePurgeQueueMessages(() => props.queue);
const groupPurger = usePurgeConsumerGroupMessages(
  () => props.queue,
  () => props.consumerGroupId ?? null,
);
const job = usePurgeQueueJob(() => props.queue, trackedStatus, jobId);
const canceller = useCancelPurgeJob(() => props.queue, trackedStatus, jobId);

const isGroupMode = computed(() => !!props.consumerGroupId);

// --- Destructive confirm for the "all" scope ---
const confirmedAll = ref(false);

watch(
  () => props.isVisible,
  (v) => {
    if (!v) return;
    phase.value = 'confirm';
    selectedStatus.value = props.defaultStatus;
    confirmedAll.value = false;
    trackedStatus.value = null;
    jobId.value = null;
    purger.reset();
    groupPurger.reset();
    canceller.reset();
  },
  { immediate: true },
);

// Toggling away from "all" clears any prior acknowledgement.
watch(selectedStatus, (v) => {
  if (v !== 'published') confirmedAll.value = false;
});

// Drive phase from the server-side job. Keyed on the whole job object
// (not just status) so updates that only change `completedAt` also
// trigger the watcher.
//
// `completedAt` is the spec-guaranteed terminal marker; FAILED and
// CANCELLED are checked additionally because they need distinct UI.
// We deliberately do NOT rely on `status === COMPLETED` (numeric 2) —
// the enum values aren't named in the spec.
watch(
  () => job.job.value,
  (j) => {
    if (!jobId.value || !j) return;
    if (
      j.completedAt !== undefined ||
      j.status === EBackgroundJobStatus.COMPLETED
    ) {
      phase.value = 'done';
      emit('purged');
    } else if (j.status === EBackgroundJobStatus.FAILED) {
      phase.value = 'error';
    } else if (j.status === EBackgroundJobStatus.CANCELLED) {
      phase.value = 'cancelled';
    }
  },
);

// --- Confirm-phase validation ---
const canConfirm = computed(() => {
  if (isGroupMode.value) return !groupPurger.isPending.value;
  if (purger.isPending.value) return false;
  if (isAllScope.value && !confirmedAll.value) return false;
  return true;
});

const queueLabel = computed(() =>
  props.queue ? `${props.queue.name}@${props.queue.ns}` : '',
);

const confirmMessage = computed(() => {
  if (isGroupMode.value) {
    return `Delete all pending messages in consumer group "${props.consumerGroupId}" from ${queueLabel.value}? This cannot be undone.`;
  }
  if (isAllScope.value) {
    return `Delete ALL messages from ${queueLabel.value}? Every message in the queue will be removed regardless of status. This cannot be undone.`;
  }
  return `Delete all ${selectedStatus.value} messages from ${queueLabel.value}? This cannot be undone.`;
});

const confirmLabel = computed(() => {
  if (isGroupMode.value) return 'Purge group messages';
  if (isAllScope.value) return 'Purge all messages';
  return `Purge ${selectedStatus.value}`;
});

// --- Confirm action ---
async function onConfirm() {
  if (isGroupMode.value) {
    try {
      await groupPurger.purge();
      phase.value = 'done';
      emit('purged');
    } catch {
      phase.value = 'error';
    }
    return;
  }

  try {
    const { jobId: newJobId } = await purger.purge(selectedStatus.value);
    trackedStatus.value = selectedStatus.value;
    jobId.value = newJobId;
    phase.value = 'running';
  } catch {
    phase.value = 'error';
  }
}

// --- Cancel action ---
async function onCancelPurge() {
  try {
    await canceller.cancel();
  } catch {
    // BackgroundJobNotCancellableError → job already reached a terminal
    // state; refetch so the phase watcher catches up.
    await job.refetch();
  }
}

// --- Terminal display ---
const purgedCount = computed(() => job.job.value?.meta.purged ?? 0);

const failureMessage = computed(() => {
  if (isGroupMode.value) return groupPurger.error.value ?? 'Purge failed';
  if (phase.value === 'error' && job.job.value?.error) {
    return job.job.value.error;
  }
  return purger.error.value ?? job.error.value ?? 'Purge failed';
});

// The five valid MessageStatus values. `published` is displayed as
// "All messages" — that is what it means to the API. The other four
// narrow to messages currently in that state.
const STATUS_OPTIONS: ReadonlyArray<{
  value: MessageStatus;
  label: string;
  hint?: string;
}> = [
  {
    value: 'published',
    label: 'Published messages',
    hint: 'Every message in the queue, regardless of status',
  },
  { value: 'pending', label: 'Pending messages' },
  { value: 'scheduled', label: 'Scheduled messages' },
  { value: 'dead-lettered', label: 'Dead-lettered messages' },
  { value: 'acknowledged', label: 'Acknowledged messages' },
];

const selectedOption = computed(() =>
  STATUS_OPTIONS.find((o) => o.value === selectedStatus.value),
);

const title = computed(() => {
  switch (phase.value) {
    case 'confirm':
      return 'Purge messages';
    case 'running':
      return 'Purging messages…';
    case 'done':
      return 'Purge complete';
    case 'error':
      return 'Purge failed';
    case 'cancelled':
    default:
      return 'Purge cancelled';
  }
});
</script>

<template>
  <BaseModal
    :is-visible="isVisible"
    :title="title"
    :subtitle="phase === 'confirm' ? 'This action cannot be undone' : undefined"
    :icon="
      phase === 'done'
        ? 'bi-check-circle'
        : phase === 'error'
          ? 'bi-exclamation-triangle'
          : phase === 'cancelled'
            ? 'bi-slash-circle'
            : 'bi-exclamation-triangle'
    "
    size="sm"
    @close="emit('close')"
  >
    <template #body>
      <!-- Confirm -->
      <template v-if="phase === 'confirm'">
        <p class="message">{{ confirmMessage }}</p>

        <div v-if="!isGroupMode" class="field">
          <label for="purge-scope" class="form-label">What to delete</label>
          <select
            id="purge-scope"
            v-model="selectedStatus"
            class="form-select"
            :disabled="purger.isPending.value"
          >
            <option v-for="o in STATUS_OPTIONS" :key="o.value" :value="o.value">
              {{ o.label }}
            </option>
          </select>
          <p v-if="selectedOption?.hint" class="hint">
            {{ selectedOption.hint }}
          </p>
        </div>

        <div v-if="isAllScope" class="form-check mt-3">
          <input
            id="purge-confirm-all"
            v-model="confirmedAll"
            class="form-check-input"
            type="checkbox"
            :disabled="purger.isPending.value"
          />
          <label for="purge-confirm-all" class="form-check-label">
            I understand this will delete every message in the queue
          </label>
        </div>

        <div
          v-if="purger.error.value || groupPurger.error.value"
          class="alert alert-danger mb-0 mt-3"
          role="alert"
        >
          {{ purger.error.value || groupPurger.error.value }}
        </div>
      </template>

      <!-- Running -->
      <template v-else-if="phase === 'running'">
        <div class="progress-state">
          <div class="spinner-border text-primary" role="status" />
          <p class="progress-state__title">Purge in progress…</p>
          <p class="progress-state__message">
            The server is deleting messages in the background. You can close
            this dialog and the purge will continue.
          </p>
          <p v-if="purgedCount > 0" class="progress-state__count">
            <strong>{{ purgedCount.toLocaleString() }}</strong>
            {{ purgedCount === 1 ? 'message' : 'messages' }} purged so far
          </p>
        </div>
      </template>

      <!-- Done -->
      <template v-else-if="phase === 'done'">
        <div class="progress-state progress-state--done">
          <i
            class="bi bi-check-circle-fill progress-state__icon"
            aria-hidden="true"
          />
          <p class="progress-state__title">Purge complete</p>
          <p v-if="purgedCount > 0" class="progress-state__message">
            <strong>{{ purgedCount.toLocaleString() }}</strong>
            {{ purgedCount === 1 ? 'message' : 'messages' }} deleted from
            {{ queueLabel }}.
          </p>
          <p v-else class="progress-state__message">
            Messages were deleted from {{ queueLabel }}.
          </p>
        </div>
      </template>

      <!-- Error -->
      <template v-else-if="phase === 'error'">
        <div class="progress-state progress-state--error">
          <i
            class="bi bi-exclamation-triangle-fill progress-state__icon"
            aria-hidden="true"
          />
          <p class="progress-state__title">Purge failed</p>
          <p class="progress-state__message">{{ failureMessage }}</p>
        </div>
      </template>

      <!-- Cancelled -->
      <template v-else-if="phase === 'cancelled'">
        <div class="progress-state progress-state--cancelled">
          <i
            class="bi bi-slash-circle progress-state__icon"
            aria-hidden="true"
          />
          <p class="progress-state__title">Purge cancelled</p>
          <p class="progress-state__message">
            The job was cancelled.
            <template v-if="purgedCount > 0">
              <strong>{{ purgedCount.toLocaleString() }}</strong>
              {{ purgedCount === 1 ? 'message was' : 'messages were' }} deleted
              before cancellation.
            </template>
          </p>
        </div>
      </template>
    </template>

    <template #footer>
      <template v-if="phase === 'confirm'">
        <button
          type="button"
          class="btn btn-secondary"
          :disabled="purger.isPending.value || groupPurger.isPending.value"
          @click="emit('close')"
        >
          Cancel
        </button>
        <button
          type="button"
          class="btn btn-danger"
          :disabled="!canConfirm"
          @click="onConfirm"
        >
          <span
            v-if="purger.isPending.value || groupPurger.isPending.value"
            class="spinner-border spinner-border-sm me-1"
            aria-hidden="true"
          />
          {{ confirmLabel }}
        </button>
      </template>

      <template v-else-if="phase === 'running'">
        <button type="button" class="btn btn-secondary" @click="emit('close')">
          Close
        </button>
        <button
          type="button"
          class="btn btn-outline-danger"
          :disabled="canceller.isPending.value"
          @click="onCancelPurge"
        >
          <span
            v-if="canceller.isPending.value"
            class="spinner-border spinner-border-sm me-1"
            aria-hidden="true"
          />
          Cancel purge
        </button>
      </template>

      <template v-else-if="phase === 'done'">
        <button type="button" class="btn btn-primary" @click="emit('close')">
          Close
        </button>
      </template>

      <template v-else-if="phase === 'error'">
        <button type="button" class="btn btn-secondary" @click="emit('close')">
          Close
        </button>
        <button
          type="button"
          class="btn btn-primary"
          @click="phase = 'confirm'"
        >
          Try again
        </button>
      </template>

      <template v-else-if="phase === 'cancelled'">
        <button type="button" class="btn btn-primary" @click="emit('close')">
          Close
        </button>
      </template>
    </template>
  </BaseModal>
</template>

<style scoped>
.message {
  margin: 0 0 var(--rsmq-space-3);
  color: var(--rsmq-color-text);
  line-height: 1.5;
}
.field {
  margin-bottom: 0;
}
.hint {
  margin: var(--rsmq-space-1) 0 0;
  font-size: 0.75rem;
  color: var(--rsmq-color-text-muted);
}

.progress-state {
  text-align: center;
  padding: var(--rsmq-space-4) 0;
}
.progress-state__icon {
  font-size: 2.5rem;
  display: block;
  margin: 0 auto var(--rsmq-space-3);
}
.progress-state__title {
  margin: 0 0 var(--rsmq-space-2);
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--rsmq-color-text);
}
.progress-state__message {
  margin: 0 0 var(--rsmq-space-2);
  color: var(--rsmq-color-text-muted);
  line-height: 1.5;
  font-size: 0.9rem;
}
.progress-state__count {
  margin: var(--rsmq-space-3) 0 0;
  font-size: 0.9rem;
  color: var(--rsmq-color-text);
}
.progress-state--done .progress-state__icon {
  color: var(--rsmq-color-success);
}
.progress-state--error .progress-state__icon {
  color: var(--rsmq-color-danger);
}
.progress-state--cancelled .progress-state__icon {
  color: var(--rsmq-color-text-muted);
}
</style>

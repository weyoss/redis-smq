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
import {
  usePurgeQueueMessages,
  type PurgeScope,
} from '@/composables/usePurgeQueueMessages';
import type { IQueueParams, MessageStatus } from '@/api/model';
import { usePurgeConsumerGroupMessages } from '@/composables/usePurgeConsumerGroupMessages.ts';

const props = defineProps<{
  isVisible: boolean;
  queue: IQueueParams | null;
  defaultStatus: MessageStatus;
  consumerGroupId?: string | null;
}>();

const emit = defineEmits<{ close: []; purged: [] }>();

const scope = ref<PurgeScope>(props.defaultStatus);
const confirmed = ref(false);

const purger = usePurgeQueueMessages(() => props.queue);
const groupPurger = usePurgeConsumerGroupMessages(
  () => props.queue,
  () => props.consumerGroupId ?? null,
);

const isGroupMode = computed(() => !!props.consumerGroupId);

const isAll = computed(() => scope.value === 'all');

watch(
  () => props.isVisible,
  (v) => {
    if (!v) return;
    scope.value = props.defaultStatus;
    confirmed.value = false;
    purger.reset();
    groupPurger.reset();
  },
  { immediate: true },
);

const queueLabel = computed(() =>
  props.queue ? `${props.queue.name}@${props.queue.ns}` : '',
);

const message = computed(() => {
  if (isGroupMode.value) {
    return `Delete all pending messages in consumer group "${props.consumerGroupId}" from ${queueLabel.value}? This cannot be undone.`;
  }
  if (isAll.value) {
    return `Delete ALL messages from ${queueLabel.value}? Every message in the queue will be removed regardless of status. This cannot be undone.`;
  }
  return `Delete all ${scope.value} messages from ${queueLabel.value}? This cannot be undone.`;
});

const canConfirm = computed(() => {
  const pending = isGroupMode.value
    ? groupPurger.isPending.value
    : purger.isPending.value;
  if (pending) return false;
  if (isAll.value && !confirmed.value) return false;
  return true;
});

const SCOPE_OPTIONS: ReadonlyArray<{ value: PurgeScope; label: string }> = [
  { value: 'published', label: 'Published messages' },
  { value: 'scheduled', label: 'Scheduled messages' },
  { value: 'pending', label: 'Pending messages' },
  { value: 'dead-lettered', label: 'Dead-lettered messages' },
  { value: 'acknowledged', label: 'Acknowledged messages' },
  { value: 'all', label: 'All messages (every status)' },
];

const confirmLabel = computed(() =>
  isGroupMode.value
    ? 'Purge group messages'
    : isAll.value
      ? 'Purge all messages'
      : `Purge ${scope.value}`,
);

async function onConfirm() {
  try {
    if (isGroupMode.value) {
      await groupPurger.purge();
    } else {
      await purger.purge(scope.value);
    }
    emit('purged');
  } catch {
    // purger.error renders inline; the modal stays open
  }
}
</script>

<template>
  <BaseModal
    :is-visible="isVisible"
    title="Purge messages"
    subtitle="This action cannot be undone"
    icon="bi-exclamation-triangle"
    size="sm"
    @close="emit('close')"
  >
    <template #body>
      <p class="message">{{ message }}</p>

      <div v-if="!isGroupMode" class="field">
        <label for="purge-scope" class="form-label">What to delete</label>
        <select
          id="purge-scope"
          v-model="scope"
          class="form-select"
          :disabled="purger.isPending.value"
        >
          <option v-for="o in SCOPE_OPTIONS" :key="o.value" :value="o.value">
            {{ o.label }}
          </option>
        </select>
      </div>

      <div v-if="isAll" class="form-check mt-3">
        <input
          id="purge-confirm-all"
          v-model="confirmed"
          class="form-check-input"
          type="checkbox"
          :disabled="purger.isPending.value"
        />
        <label for="purge-confirm-all" class="form-check-label">
          I understand this will delete every message in the queue
        </label>
      </div>

      <div
        v-if="isGroupMode ? groupPurger.error.value : purger.error.value"
        class="alert alert-danger mb-0 mt-3"
        role="alert"
      >
        {{ isGroupMode ? groupPurger.error.value : purger.error.value }}
      </div>
    </template>
    <template #footer>
      <button
        type="button"
        class="btn btn-secondary"
        :disabled="
          isGroupMode ? groupPurger.isPending.value : purger.isPending.value
        "
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
          v-if="
            isGroupMode ? groupPurger.isPending.value : purger.isPending.value
          "
          class="spinner-border spinner-border-sm me-1"
          aria-hidden="true"
        />
        {{
          (isGroupMode ? groupPurger.isPending.value : purger.isPending.value)
            ? 'Purging…'
            : confirmLabel
        }}
      </button>
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
</style>

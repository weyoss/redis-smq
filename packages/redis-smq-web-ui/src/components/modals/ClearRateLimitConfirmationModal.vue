<!--
  - Copyright (c)
  - Weyoss <weyoss@protonmail.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { computed } from 'vue';
import BaseModal from '@/components/modals/BaseModal.vue';

type Props = {
  isVisible: boolean;
  queueName?: string | null;
  queueNs?: string | null;
  isProcessing?: boolean;
};

const props = withDefaults(defineProps<Props>(), {
  isProcessing: false,
});

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'confirm'): void;
}>();

// Build a readable queue identifier
const subject = computed(() => {
  const name = (props.queueName ?? '').trim();
  const ns = (props.queueNs ?? '').trim();
  if (name && ns) return `"${name}@${ns}"`;
  if (name) return `"${name}"`;
  if (ns) return `"@${ns}"`;
  return 'this queue';
});

function onClose() {
  emit('close');
}

function onCancel() {
  emit('close');
}

function onConfirm() {
  if (!props.isProcessing) emit('confirm');
}
</script>

<template>
  <BaseModal
    :is-visible="isVisible"
    title="Clear rate limit"
    icon="bi bi-exclamation-triangle-fill"
    size="sm"
    @close="onClose"
  >
    <template #body>
      <div class="body">
        <p class="message">
          Are you sure you want to clear the rate limit for
          <strong class="subject">{{ subject }}</strong
          >?
        </p>

        <div class="callout warning" role="note" aria-label="Warning">
          <i class="bi bi-info-circle me-2" aria-hidden="true"></i>
          <span>
            This will remove any active throttling and allow messages to be
            without rate restriction until a new limit is applied.
          </span>
        </div>
      </div>
    </template>

    <template #footer>
      <button type="button" class="btn btn-outline-secondary" @click="onCancel">
        Cancel
      </button>
      <button
        type="button"
        class="btn btn-danger"
        :disabled="isProcessing"
        @click="onConfirm"
      >
        <template v-if="isProcessing">
          <span
            class="spinner-border spinner-border-sm me-2"
            role="status"
            aria-hidden="true"
          ></span>
          Clearing...
        </template>
        <template v-else>
          <i class="bi bi-trash me-2" aria-hidden="true"></i>
          Clear rate limit
        </template>
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
.body {
  display: grid;
  gap: 0.75rem;
}

.message {
  color: #374151;
  margin: 0;
  line-height: 1.5;
}

.subject {
  color: #0d6efd;
  word-break: break-word;
}

.callout {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.75rem 0.875rem;
  border-radius: 8px;
  font-size: 0.95rem;
}

.callout.warning {
  background: #fff8e1;
  color: #7a4d00;
  border: 1px solid #ffe8a1;
}
</style>

<!--
  - Copyright (c)
  - Weyoss <weyoss@outlook.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import BaseModal from '@/components/modals/BaseModal.vue';
import { getErrorMessage } from '@/lib/error.ts';
import { useDeleteApiNamespacesNsQueuesName } from '@/api/generated/queue/queue';

interface Props {
  isVisible: boolean;
  queue: {
    ns: string;
    name: string;
  };
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'success'): void;
}>();

// Custom focus directive for error section
const vFocus = {
  mounted: (el: HTMLElement) => el.focus(),
};

// Error section ref for focusing
const errorSectionRef = ref<HTMLElement | null>(null);

// Delete queue mutation
const deleteQueueMutation = useDeleteApiNamespacesNsQueuesName({
  mutation: {
    onSuccess: () => {
      emit('success');
    },
    onError: (error) => {
      console.error('Failed to delete queue:', error);
      // Focus the error section
      nextTick(() => {
        errorSectionRef.value?.focus();
      });
    },
  },
});

const isDeleting = computed(() => deleteQueueMutation.isPending.value);
const error = computed(() =>
  getErrorMessage(deleteQueueMutation.error.value?.error),
);

function handleClose() {
  if (!isDeleting.value) {
    deleteQueueMutation.reset();
    emit('close');
  }
}

async function handleConfirm() {
  if (isDeleting.value) return;

  await deleteQueueMutation.mutateAsync({
    ns: props.queue.ns,
    name: props.queue.name,
  });
}

// Reset mutation when modal is hidden
watch(
  () => props.isVisible,
  (newVal) => {
    if (!newVal) {
      deleteQueueMutation.reset();
    }
  },
);
</script>

<template>
  <BaseModal
    :is-visible="isVisible"
    title="Delete Queue"
    subtitle="This action cannot be undone"
    icon="bi bi-exclamation-triangle-fill"
    size="sm"
    @close="handleClose"
  >
    <template #body>
      <div class="dialog-body">
        <!-- Error Alert -->
        <div
          v-if="error"
          ref="errorSectionRef"
          v-focus
          class="error-alert"
          role="alert"
          tabindex="-1"
          aria-live="assertive"
        >
          <i class="bi bi-exclamation-triangle-fill" aria-hidden="true"></i>
          <span>{{ error }}</span>
        </div>

        <!-- Confirmation -->
        <section class="confirmation-message">
          <p class="message-text">
            Are you sure you want to permanently delete the following queue?
          </p>

          <div class="queue-details" role="group" aria-label="Queue details">
            <div class="queue-info">
              <div class="info-item">
                <span class="info-label">Queue Name:</span>
                <span class="info-value queue-name" :title="queue.name">
                  {{ queue.name }}
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">Namespace:</span>
                <span class="info-value namespace" :title="queue.ns">
                  {{ queue.ns }}
                </span>
              </div>
            </div>
          </div>
        </section>

        <!-- Warning -->
        <section class="warning-section" aria-live="polite">
          <div class="warning-content">
            <div class="warning-icon" aria-hidden="true">
              <i class="bi bi-shield-exclamation"></i>
            </div>
            <div class="warning-text">
              <h4 class="warning-title">Warning</h4>
              <ul class="warning-list">
                <li>All messages in this queue will be permanently lost</li>
                <li>
                  Ensure all consumers connected to this queue are disconnected
                </li>
                <li>This action cannot be reversed</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </template>

    <template #footer>
      <div class="actions">
        <button
          type="button"
          class="btn btn-outline-secondary"
          :disabled="isDeleting"
          @click="handleClose"
        >
          <i class="bi bi-x-circle me-2" aria-hidden="true"></i>
          Cancel
        </button>
        <button
          type="button"
          class="btn btn-danger"
          :disabled="isDeleting"
          @click="handleConfirm"
        >
          <template v-if="isDeleting">
            <span
              class="spinner-border spinner-border-sm me-2"
              role="status"
              aria-hidden="true"
            ></span>
            Deleting Queue...
          </template>
          <template v-else>
            <i class="bi bi-trash-fill me-2" aria-hidden="true"></i>
            Delete Queue
          </template>
        </button>
      </div>
    </template>
  </BaseModal>
</template>

<style scoped>
/* Mobile-first safety: only style inside BaseModal content area */
.dialog-body,
.dialog-body * {
  box-sizing: border-box;
  max-width: 100%;
}

.dialog-body {
  display: grid;
  gap: clamp(12px, 2.8vw, 18px);
  padding: 0; /* BaseModal provides padding */
  overflow-x: hidden;
}

/* Error Alert */
.error-alert {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  border-radius: 8px;
  font-size: 0.9rem;
  transition: box-shadow 0.2s ease;
}

.error-alert:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.25);
  border-color: #dc3545;
}

.error-alert i {
  font-size: 1rem;
  flex-shrink: 0;
}

/* Confirmation content */
.confirmation-message {
  display: grid;
  gap: 0.75rem;
}

.message-text {
  color: #374151;
  font-size: 1rem;
  line-height: 1.6;
  margin: 0;
  overflow-wrap: anywhere;
  word-break: break-word;
}

/* Queue details */
.queue-details {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: clamp(12px, 2.6vw, 16px);
}

.queue-info {
  display: grid;
  gap: 0.75rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: center;
  padding: 0.25rem 0;
}

.info-label {
  color: #6b7280;
  font-weight: 600;
  font-size: 0.9rem;
  flex: 0 0 auto;
}

.info-value {
  font-weight: 700;
  font-family: 'Courier New', monospace;
  font-size: 0.95rem;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.queue-name {
  color: #dc2626;
}
.namespace {
  color: #059669;
}

/* Warning section */
.warning-section {
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 12px;
  padding: clamp(12px, 2.6vw, 16px);
}

.warning-content {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}

.warning-icon {
  width: 40px;
  height: 40px;
  background: #fef3c7;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #d97706;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.warning-text {
  flex: 1 1 auto;
  min-width: 0;
}

.warning-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #92400e;
  margin: 0 0 0.5rem 0;
}

.warning-list {
  margin: 0;
  padding-left: 1.25rem;
  color: #92400e;
  font-size: 0.9rem;
  line-height: 1.5;
}

/* Footer actions: spacing and mobile behavior */
.actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.actions .btn {
  min-width: 140px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .info-item {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 576px) {
  .warning-content {
    flex-direction: column;
  }

  .info-value {
    white-space: normal;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .actions {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }

  .actions .btn {
    width: 100%;
    min-width: 0;
    justify-content: center;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .actions .btn,
  .error-alert {
    transition: none;
  }
}
</style>

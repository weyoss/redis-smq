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
import { usePostApiMessagesIdRequeue } from '@/api/generated/messages/messages';

interface Props {
  isVisible: boolean;
  messageId: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'success'): void;
}>();

// Error section ref for focusing
const errorSectionRef = ref<HTMLElement | null>(null);

// Requeue message mutation
const requeueMessageMutation = usePostApiMessagesIdRequeue({
  mutation: {
    onSuccess: () => {
      emit('success');
    },
    onError: (error) => {
      console.error('Failed to requeue message:', error);
      nextTick(() => {
        errorSectionRef.value?.focus();
      });
    },
  },
});

const isRequeuing = computed(() => requeueMessageMutation.isPending.value);
const error = computed(() =>
  getErrorMessage(requeueMessageMutation.error.value),
);

function handleClose() {
  if (!isRequeuing.value) {
    requeueMessageMutation.reset();
    emit('close');
  }
}

async function handleConfirm() {
  if (isRequeuing.value) return;

  await requeueMessageMutation.mutateAsync({
    id: props.messageId,
  });
}

// Reset mutation when modal is hidden
watch(
  () => props.isVisible,
  (newVal) => {
    if (!newVal) {
      requeueMessageMutation.reset();
    }
  },
);
</script>

<template>
  <BaseModal
    :is-visible="isVisible"
    title="Requeue Message"
    subtitle="Move message back to pending queue"
    icon="bi bi-arrow-clockwise"
    size="sm"
    @close="handleClose"
  >
    <template #body>
      <div class="dialog-body">
        <!-- Error Alert -->
        <div
          v-if="error"
          ref="errorSectionRef"
          class="error-alert"
          role="alert"
          tabindex="-1"
          aria-live="assertive"
        >
          <i class="bi bi-exclamation-triangle-fill" aria-hidden="true"></i>
          <span class="error-text">{{ error }}</span>
        </div>

        <!-- Confirmation -->
        <div class="confirmation-message">
          <p class="message-text">
            Are you sure you want to requeue this dead-lettered message?
          </p>

          <div class="message-details">
            <div class="detail-row">
              <span class="detail-label">Message ID:</span>
              <span class="detail-value message-id">{{ messageId }}</span>
            </div>
          </div>
        </div>

        <!-- Info -->
        <div class="info-section">
          <div class="info-header">
            <i class="bi bi-info-circle-fill info-icon"></i>
            <span class="info-title">What happens when requeued?</span>
          </div>
          <ul class="info-list">
            <li>The message will be moved back to the pending queue</li>
            <li>It will become available for processing again</li>
            <li>
              All message properties (priority, TTL, etc.) remain unchanged
            </li>
          </ul>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="footer-actions">
        <button
          type="button"
          class="btn btn-secondary"
          :disabled="isRequeuing"
          @click="handleClose"
        >
          Cancel
        </button>
        <button
          type="button"
          class="btn btn-warning"
          :disabled="isRequeuing"
          @click="handleConfirm"
        >
          <span
            v-if="isRequeuing"
            class="spinner-border spinner-border-sm me-2"
          ></span>
          <i v-else class="bi bi-arrow-clockwise me-2"></i>
          {{ isRequeuing ? 'Requeuing...' : 'Requeue Message' }}
        </button>
      </div>
    </template>
  </BaseModal>
</template>

<style scoped>
.dialog-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0.5rem 0;
}

/* Error Alert */
.error-alert {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  color: #991b1b;
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
}

.error-alert:focus {
  outline: 2px solid #dc2626;
  outline-offset: 2px;
}

.error-alert i {
  font-size: 1rem;
  flex-shrink: 0;
  margin-top: 0.1rem;
}

.error-text {
  flex: 1;
  word-break: break-word;
}

/* Confirmation */
.confirmation-message {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.message-text {
  color: #1f2937;
  font-size: 0.95rem;
  line-height: 1.5;
  margin: 0;
}

.message-details {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 0.75rem;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.detail-label {
  color: #6b7280;
  font-weight: 600;
  flex-shrink: 0;
}

.detail-value {
  font-family: monospace;
  color: #1f2937;
  word-break: break-all;
  overflow: hidden;
  text-overflow: ellipsis;
}

.message-id {
  color: #b45309;
  font-weight: 500;
}

/* Info section */
.info-section {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  padding: 0.75rem;
}

.info-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.info-icon {
  color: #1d4ed8;
  font-size: 1rem;
}

.info-title {
  color: #1e3a8a;
  font-weight: 600;
  font-size: 0.9rem;
}

.info-list {
  margin: 0;
  padding-left: 1.25rem;
  color: #1e40af;
  font-size: 0.85rem;
  line-height: 1.5;
}

.info-list li {
  margin-bottom: 0.25rem;
}

.info-list li:last-child {
  margin-bottom: 0;
}

/* Footer actions */
.footer-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  width: 100%;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s ease;
  min-width: 100px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f3f4f6;
  border-color: #e5e7eb;
  color: #374151;
}

.btn-secondary:hover:not(:disabled) {
  background: #e5e7eb;
}

.btn-warning {
  background: #f59e0b;
  color: white;
}

.btn-warning:hover:not(:disabled) {
  background: #d97706;
}

.spinner-border-sm {
  width: 0.875rem;
  height: 0.875rem;
  border-width: 0.15rem;
}

.me-2 {
  margin-right: 0.5rem;
}

/* Responsive */
@media (max-width: 576px) {
  .footer-actions {
    flex-direction: column-reverse;
  }

  .btn {
    width: 100%;
  }

  .detail-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }

  .info-list {
    padding-left: 1rem;
  }
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .error-alert {
    background: #2a1a1a;
    border-color: #742a2a;
    color: #fecaca;
  }

  .message-text {
    color: #e5e7eb;
  }

  .message-details {
    background: #1f2937;
    border-color: #374151;
  }

  .detail-label {
    color: #9ca3af;
  }

  .detail-value {
    color: #e5e7eb;
  }

  .info-section {
    background: #1a2a3a;
    border-color: #2a4a6f;
  }

  .info-title {
    color: #9ec1ff;
  }

  .info-list {
    color: #9ec1ff;
  }

  .btn-secondary {
    background: #374151;
    border-color: #4b5563;
    color: #e5e7eb;
  }

  .btn-secondary:hover:not(:disabled) {
    background: #4b5563;
  }

  .btn-warning {
    background: #b45309;
  }

  .btn-warning:hover:not(:disabled) {
    background: #92400e;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .btn {
    transition: none;
  }
}
</style>

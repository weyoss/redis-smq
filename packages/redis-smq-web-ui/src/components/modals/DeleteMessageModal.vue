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
import { useDeleteApiMessagesId } from '@/api/generated/messages/messages';

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

// Delete message mutation
const deleteMessageMutation = useDeleteApiMessagesId({
  mutation: {
    onSuccess: () => {
      emit('success');
    },
    onError: (error) => {
      console.error('Failed to delete message:', error);
      nextTick(() => {
        errorSectionRef.value?.focus();
      });
    },
  },
});

const isDeleting = computed(() => deleteMessageMutation.isPending.value);
const error = computed(() =>
  getErrorMessage(deleteMessageMutation.error.value),
);

function handleClose() {
  if (!isDeleting.value) {
    deleteMessageMutation.reset();
    emit('close');
  }
}

async function handleConfirm() {
  if (isDeleting.value) return;

  await deleteMessageMutation.mutateAsync({
    id: props.messageId,
  });
}

// Reset mutation when modal is hidden
watch(
  () => props.isVisible,
  (newVal) => {
    if (!newVal) {
      deleteMessageMutation.reset();
    }
  },
);
</script>

<template>
  <BaseModal
    :is-visible="isVisible"
    title="Delete Message"
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
            Are you sure you want to permanently delete this message?
          </p>

          <div class="message-details">
            <div class="detail-row">
              <span class="detail-label">Message ID:</span>
              <span class="detail-value message-id">{{ messageId }}</span>
            </div>
          </div>
        </div>

        <!-- Warning -->
        <div class="warning-section">
          <div class="warning-header">
            <i class="bi bi-exclamation-triangle-fill warning-icon"></i>
            <span class="warning-title">Warning</span>
          </div>
          <ul class="warning-list">
            <li>This message will be permanently deleted</li>
            <li>This action cannot be reversed</li>
          </ul>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="footer-actions">
        <button
          type="button"
          class="btn btn-secondary"
          :disabled="isDeleting"
          @click="handleClose"
        >
          Cancel
        </button>
        <button
          type="button"
          class="btn btn-danger"
          :disabled="isDeleting"
          @click="handleConfirm"
        >
          <span
            v-if="isDeleting"
            class="spinner-border spinner-border-sm me-2"
          ></span>
          <i v-else class="bi bi-trash-fill me-2"></i>
          {{ isDeleting ? 'Deleting...' : 'Delete Message' }}
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
  color: #dc2626;
  font-weight: 500;
}

/* Warning section */
.warning-section {
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 6px;
  padding: 0.75rem;
}

.warning-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.warning-icon {
  color: #d97706;
  font-size: 1rem;
}

.warning-title {
  color: #92400e;
  font-weight: 600;
  font-size: 0.9rem;
}

.warning-list {
  margin: 0;
  padding-left: 1.25rem;
  color: #92400e;
  font-size: 0.85rem;
  line-height: 1.5;
}

.warning-list li {
  margin-bottom: 0.25rem;
}

.warning-list li:last-child {
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

.btn-danger {
  background: #dc2626;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #b91c1c;
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

  .warning-list {
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

  .warning-section {
    background: #2a241a;
    border-color: #745a2a;
  }

  .warning-title {
    color: #fde68a;
  }

  .warning-list {
    color: #fde68a;
  }

  .btn-secondary {
    background: #374151;
    border-color: #4b5563;
    color: #e5e7eb;
  }

  .btn-secondary:hover:not(:disabled) {
    background: #4b5563;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .btn {
    transition: none;
  }
}
</style>

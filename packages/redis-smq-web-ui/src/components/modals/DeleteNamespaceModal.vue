<!--
  - Copyright (c)
  - Weyoss <weyoss@outlook.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script lang="ts" setup>
import BaseModal from '@/components/modals/BaseModal.vue';
import { getErrorMessage } from '@/lib/error.ts';

interface Props {
  isVisible: boolean;
  namespace: string | null;
  queueCount: number;
  isDeleting: boolean;
  error: ReturnType<typeof getErrorMessage>;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'cancel'): void;
  (e: 'confirm'): void;
}>();

function handleClose() {
  if (!props.isDeleting) emit('cancel');
}

function handleConfirm() {
  if (!props.isDeleting) emit('confirm');
}
</script>

<template>
  <BaseModal
    :is-visible="isVisible"
    title="Delete Namespace"
    subtitle="This action cannot be undone"
    icon="bi bi-exclamation-triangle-fill"
    size="sm"
    @close="handleClose"
  >
    <template #body>
      <div class="dialog-body">
        <!-- Confirmation -->
        <section class="confirmation-message">
          <p class="message-text">
            Are you sure you want to permanently delete the namespace
            <strong class="namespace-identifier" :title="namespace ?? ''">
              {{ namespace }}
            </strong>
            ?
          </p>

          <div
            class="namespace-details"
            role="group"
            aria-label="Namespace details"
          >
            <div class="detail-item">
              <span class="detail-label">Queues in namespace:</span>
              <span class="detail-value">{{ queueCount }}</span>
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
                <li>
                  All queues in this namespace will be permanently deleted
                </li>
                <li>All messages in these queues will be lost</li>
                <li>
                  Ensure all consumers connected to these queues are
                  disconnected
                </li>
                <li>This action cannot be reversed</li>
              </ul>
            </div>
          </div>
        </section>

        <!-- Error Display -->
        <section v-if="error" class="error-section" role="alert">
          <div class="error-content">
            <div class="error-icon" aria-hidden="true">
              <i class="bi bi-exclamation-circle-fill"></i>
            </div>
            <div class="error-text">
              <h4 class="error-title">Deletion Failed</h4>
              <p class="error-message">{{ error }}</p>
            </div>
          </div>
        </section>
      </div>
    </template>

    <template #footer>
      <div class="actions">
        <button
          class="btn btn-outline-secondary"
          type="button"
          :disabled="isDeleting"
          @click="handleClose"
        >
          <i class="bi bi-x-circle me-2" aria-hidden="true"></i>
          Cancel
        </button>

        <button
          class="btn btn-danger"
          type="button"
          :disabled="isDeleting"
          @click="handleConfirm"
        >
          <template v-if="isDeleting">
            <span
              class="spinner-border spinner-border-sm me-2"
              role="status"
              aria-hidden="true"
            ></span>
            Deleting...
          </template>
          <template v-else>
            <i class="bi bi-trash-fill me-2" aria-hidden="true"></i>
            Delete Namespace
          </template>
        </button>
      </div>
    </template>
  </BaseModal>
</template>

<style scoped>
/* Body layout and overflow safety */
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

/* Confirmation section */
.confirmation-message {
  display: grid;
  gap: 0.75rem;
}

.message-text {
  font-size: 1rem;
  color: #495057;
  line-height: 1.6;
  margin: 0;
  overflow-wrap: anywhere;
}

.namespace-identifier {
  font-family: 'Courier New', monospace;
  background-color: #e9ecef;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-size: 0.9em;
}

/* Namespace details */
.namespace-details {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: clamp(10px, 2.6vw, 14px);
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
}

.detail-label {
  font-weight: 500;
  color: #6c757d;
}

.detail-value {
  font-weight: 700;
  font-size: 1.125rem;
}

/* Warning section */
.warning-section {
  background-color: #f8d7da;
  border: 1px solid #f5c2c7;
  border-radius: 8px;
  padding: clamp(10px, 2.6vw, 14px);
  color: #58151c;
}

.warning-content {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  min-width: 0;
}

.warning-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.warning-title {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  font-weight: 600;
}

.warning-list {
  margin: 0;
  padding-left: 1.25rem;
  font-size: 0.875rem;
  line-height: 1.5;
}

.warning-list li {
  margin-bottom: 0.25rem;
}

/* Error section */
.error-section {
  background-color: #f8d7da;
  border: 1px solid #f5c2c7;
  border-radius: 8px;
  padding: clamp(10px, 2.6vw, 14px);
}

.error-content {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.error-icon {
  font-size: 1.25rem;
  color: #842029;
  flex-shrink: 0;
}

.error-title {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #842029;
}

.error-message {
  margin: 0;
  font-size: 0.875rem;
  color: #842029;
  overflow-wrap: anywhere;
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

/* Allow stacking buttons on small screens */
@media (max-width: 576px) {
  .warning-content,
  .error-content,
  .detail-item {
    flex-direction: column;
    align-items: stretch;
    text-align: left;
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
  .actions .btn {
    transition: none;
  }
}
</style>

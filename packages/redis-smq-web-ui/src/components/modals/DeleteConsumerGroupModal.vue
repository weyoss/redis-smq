<!--
  - Copyright (c)
  - Weyoss <weyoss@protonmail.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { defineEmits, defineProps } from 'vue';
import BaseModal from '@/components/modals/BaseModal.vue';

const props = defineProps<{
  isVisible: boolean;
  isPending: boolean;
  error?: string;
  consumerGroup: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'delete'): void;
}>();

function onConfirmDeleteConsumerGroup() {
  emit('delete');
}

function onClose() {
  emit('close');
}
</script>

<template>
  <BaseModal
    :is-visible="isVisible"
    title="Delete Consumer Group"
    subtitle="This action cannot be undone"
    icon="bi bi-exclamation-triangle-fill"
    size="sm"
    @close="onClose"
  >
    <template #body>
      <div class="dialog-body">
        <!-- Confirmation -->
        <section class="confirmation-message">
          <p class="message-text">
            Are you sure you want to permanently delete the following consumer
            group?
          </p>

          <div class="consumer-group-details">
            <div class="group-info">
              <div class="group-icon">
                <i class="bi bi-people-fill" aria-hidden="true"></i>
              </div>
              <div class="group-content">
                <div class="group-label">Consumer Group</div>
                <div class="group-name" :title="consumerGroup">
                  {{ consumerGroup }}
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Warning -->
        <section class="warning-section" aria-live="polite">
          <div class="warning-content">
            <div class="warning-icon">
              <i class="bi bi-shield-exclamation" aria-hidden="true"></i>
            </div>
            <div class="warning-text">
              <h4 class="warning-title">Warning</h4>
              <ul class="warning-list">
                <li>All consumers in this group will be disconnected</li>
                <li>Message processing for this group will stop immediately</li>
                <li>This action cannot be reversed</li>
              </ul>
            </div>
          </div>
        </section>

        <!-- Error -->
        <section v-if="error" class="error-section" role="alert">
          <div class="error-content">
            <div class="error-icon">
              <i class="bi bi-exclamation-circle-fill" aria-hidden="true"></i>
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
          type="button"
          class="btn btn-outline-secondary"
          :disabled="isPending"
          @click="onClose"
        >
          <i class="bi bi-x-circle me-2" aria-hidden="true"></i>
          Cancel
        </button>

        <button
          type="button"
          class="btn btn-danger"
          :disabled="isPending"
          @click="onConfirmDeleteConsumerGroup"
        >
          <template v-if="isPending">
            <span
              class="spinner-border spinner-border-sm me-2"
              role="status"
              aria-hidden="true"
            ></span>
            Deleting Group...
          </template>
          <template v-else>
            <i class="bi bi-trash-fill me-2" aria-hidden="true"></i>
            Delete Consumer Group
          </template>
        </button>
      </div>
    </template>
  </BaseModal>
</template>

<style scoped>
/* Body layout and overflow safety */
.dialog-body {
  display: grid;
  gap: clamp(12px, 2.5vw, 18px);
  padding: 0; /* BaseModal provides padding */
  overflow-x: hidden;
}

.message-text {
  color: #374151;
  font-size: 1rem;
  line-height: 1.6;
  margin: 0 0 0.75rem 0;
  overflow-wrap: anywhere;
}

/* Consumer group display */
.consumer-group-details {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: clamp(12px, 2.5vw, 16px);
}

.group-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.group-icon {
  width: 40px;
  height: 40px;
  background: #e8f5e8;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #198754;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.group-content {
  flex: 1 1 auto;
  min-width: 0;
}

.group-label {
  color: #6b7280;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.25rem;
}

.group-name {
  color: #1f2937;
  font-weight: 700;
  font-family: 'Courier New', monospace;
  font-size: 0.95rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Warning section */
.warning-section {
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 12px;
  padding: clamp(12px, 2.5vw, 16px);
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
  display: flex;
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
  font-size: 1rem;
  font-weight: 600;
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

/* Error section */
.error-section {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  padding: clamp(12px, 2.5vw, 16px);
}

.error-content {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}

.error-icon {
  width: 40px;
  height: 40px;
  background: #fee2e2;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #dc2626;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.error-text {
  flex: 1 1 auto;
  min-width: 0;
}

.error-title {
  font-size: 1rem;
  font-weight: 600;
  color: #991b1b;
  margin: 0 0 0.25rem 0;
}

.error-message {
  color: #991b1b;
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0;
  overflow-wrap: anywhere;
}

/* Footer actions */
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

/* Mobile responsiveness */
@media (max-width: 768px) {
  .group-info,
  .warning-content,
  .error-content {
    flex-direction: column;
    text-align: center;
  }

  .group-name {
    white-space: normal;
    overflow-wrap: anywhere;
  }
}

@media (max-width: 576px) {
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

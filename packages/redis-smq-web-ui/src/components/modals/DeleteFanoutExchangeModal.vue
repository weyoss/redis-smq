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
import type { getErrorMessage } from '@/lib/error.ts';
import BaseModal from '@/components/modals/BaseModal.vue';

const props = defineProps<{
  isVisible: boolean;
  isDeleting: boolean;
  exchangeName: string | null;
  deleteError?: ReturnType<typeof getErrorMessage>;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'confirm'): void;
}>();

function handleClose() {
  if (!props.isDeleting) emit('close');
}

function handleConfirm() {
  if (!props.isDeleting) emit('confirm');
}
</script>

<template>
  <BaseModal
    :is-visible="isVisible"
    title="Delete Fanout Exchange"
    subtitle="This action cannot be undone"
    icon="bi bi-exclamation-triangle-fill"
    size="sm"
    @close="handleClose"
  >
    <template #body>
      <div class="dialog-body">
        <!-- Confirmation -->
        <section class="confirmation-section">
          <p class="message-text">
            Are you sure you want to permanently delete the fanout exchange
            <strong class="exchange-name" :title="exchangeName ?? ''">
              {{ exchangeName }}
            </strong>
            ?
          </p>
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
                <li>All queue bindings to this exchange will be removed</li>
                <li>
                  Messages published to this exchange will no longer be routed
                </li>
                <li>This action cannot be reversed</li>
              </ul>
            </div>
          </div>
        </section>

        <!-- Error -->
        <section v-if="deleteError" class="error-section" role="alert">
          <div class="error-content">
            <div class="error-icon" aria-hidden="true">
              <i class="bi bi-exclamation-circle-fill"></i>
            </div>
            <div class="error-text">
              <h4 class="error-title">Deletion Failed</h4>
              <p class="error-message">{{ deleteError }}</p>
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
            Confirm Delete
          </template>
        </button>
      </div>
    </template>
  </BaseModal>
</template>

<style scoped>
/* Mobile-first safety: sizing and overflow guards */
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

.message-text {
  color: #374151;
  font-size: 1rem;
  line-height: 1.6;
  margin: 0;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.exchange-name {
  color: #dc3545;
  font-family: 'Courier New', Courier, monospace;
  background-color: #f8d7da;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
}

/* Warning section */
.warning-section {
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 12px;
  padding: clamp(10px, 2.6vw, 14px);
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
  margin: 0 0 0.25rem 0;
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
  padding: clamp(10px, 2.6vw, 14px);
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
  display: inline-flex;
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
  font-size: 0.95rem;
  font-weight: 700;
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

@media (max-width: 576px) {
  .warning-content,
  .error-content {
    flex-direction: column;
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

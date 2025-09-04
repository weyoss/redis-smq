<!--
  - Copyright (c)
  - Weyoss <weyoss@protonmail.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script lang="ts" setup>
import { getErrorMessage } from '@/lib/error.ts';

interface Props {
  isVisible: boolean;
  namespace: string | null;
  queueCount: number;
  isDeleting: boolean;
  error: any;
}

defineProps<Props>();

const emit = defineEmits<{
  (e: 'cancel'): void;
  (e: 'confirm'): void;
}>();
</script>

<template>
  <teleport to="body">
    <div
      v-if="isVisible"
      aria-labelledby="delete-namespace-title"
      aria-modal="true"
      class="modal-overlay"
      role="dialog"
      @click="emit('cancel')"
      @keydown.esc="emit('cancel')"
    >
      <div class="modal-container" @click.stop>
        <div class="modal-content">
          <!-- Header -->
          <header class="modal-header delete-header">
            <div class="header-icon">
              <i class="bi bi-exclamation-triangle-fill"></i>
            </div>
            <div class="header-content">
              <h2 id="delete-namespace-title" class="modal-title">
                Delete Namespace
              </h2>
              <p class="modal-subtitle">This action cannot be undone</p>
            </div>
            <button
              aria-label="Close modal"
              class="btn-close"
              type="button"
              @click="emit('cancel')"
            >
              <i class="bi bi-x"></i>
            </button>
          </header>

          <!-- Body -->
          <main class="modal-body">
            <div class="confirmation-message">
              <p class="message-text">
                Are you sure you want to permanently delete the namespace
                <strong class="namespace-identifier">{{ namespace }}</strong
                >?
              </p>

              <div class="namespace-details">
                <div class="detail-item">
                  <span class="detail-label">Queues in namespace:</span>
                  <span class="detail-value">{{ queueCount }}</span>
                </div>
              </div>
            </div>

            <div class="warning-section">
              <div class="warning-content">
                <div class="warning-icon">
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
                      Make sure that all consumers connected to these queues are
                      disconnected
                    </li>
                    <li>This action cannot be reversed</li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- Error Display -->
            <div v-if="error" class="error-section">
              <div class="error-content">
                <div class="error-icon">
                  <i class="bi bi-exclamation-circle-fill"></i>
                </div>
                <div class="error-text">
                  <h4 class="error-title">Deletion Failed</h4>
                  <p class="error-message">
                    {{ getErrorMessage(error)?.message }}
                  </p>
                </div>
              </div>
            </div>
          </main>

          <!-- Footer -->
          <footer class="modal-footer">
            <button
              class="btn btn-secondary"
              type="button"
              @click="emit('cancel')"
            >
              <i class="bi bi-x-circle me-2"></i>
              Cancel
            </button>
            <button
              :disabled="isDeleting"
              class="btn btn-danger"
              type="button"
              @click="emit('confirm')"
            >
              <template v-if="isDeleting">
                <span class="spinner-border spinner-border-sm me-2"></span>
                Deleting...
              </template>
              <template v-else>
                <i class="bi bi-trash-fill me-2"></i>
                Delete Namespace
              </template>
            </button>
          </footer>
        </div>
      </div>
    </div>
  </teleport>
</template>

<style scoped>
/* Modal Overlay */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  backdrop-filter: blur(4px);
}

/* Modal Container */
.modal-container {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Modal Content */
.modal-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* Modal Header */
.modal-header {
  display: flex;
  align-items: flex-start;
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
}

.delete-header {
  background-color: #fff3cd;
  color: #664d03;
}

.header-icon {
  font-size: 1.75rem;
  margin-right: 1rem;
  flex-shrink: 0;
}

.header-content {
  flex-grow: 1;
}

.modal-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.modal-subtitle {
  margin: 0.25rem 0 0 0;
  font-size: 0.875rem;
  opacity: 0.8;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s ease;
  padding: 0;
  line-height: 1;
}

.btn-close:hover {
  opacity: 1;
}

/* Modal Body */
.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex-grow: 1;
}

.confirmation-message {
  margin-bottom: 1.5rem;
}

.message-text {
  font-size: 1rem;
  color: #495057;
  line-height: 1.6;
  margin: 0 0 1rem 0;
}

.namespace-identifier {
  font-family: 'Courier New', monospace;
  background-color: #e9ecef;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-size: 0.9em;
}

.namespace-details {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-label {
  font-weight: 500;
  color: #6c757d;
}

.detail-value {
  font-weight: 600;
  font-size: 1.125rem;
}

/* Warning Section */
.warning-section {
  background-color: #f8d7da;
  border: 1px solid #f5c2c7;
  border-radius: 8px;
  padding: 1rem;
  color: #58151c;
}

.warning-content {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.warning-icon {
  font-size: 1.5rem;
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

/* Error Section */
.error-section {
  margin-top: 1.5rem;
  background-color: #f8d7da;
  border: 1px solid #f5c2c7;
  border-radius: 8px;
  padding: 1rem;
}

.error-content {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.error-icon {
  font-size: 1.25rem;
  color: #842029;
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
}

/* Modal Footer */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e9ecef;
  background-color: #f8f9fa;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.625rem 1.25rem;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.875rem;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary {
  background-color: white;
  border-color: #ced4da;
  color: #495057;
}

.btn-secondary:hover {
  background-color: #f8f9fa;
  border-color: #adb5bd;
}

.btn-danger {
  background-color: #dc3545;
  border-color: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background-color: #c82333;
  border-color: #bd2130;
}

.btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.spinner-border-sm {
  width: 1rem;
  height: 1rem;
  border-width: 0.2em;
}
</style>

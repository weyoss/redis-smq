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

function handleOverlayClick() {
  // Only close if clicking on the overlay, not the modal content
  // The @click.stop on modal-container prevents this from firing when clicking inside
  onClose();
}
</script>

<template>
  <teleport to="body">
    <div
      v-if="isVisible"
      class="modal-overlay"
      role="dialog"
      aria-labelledby="deleteConsumerGroupModalLabel"
      aria-modal="true"
      @click="handleOverlayClick"
      @keydown.esc="onClose"
    >
      <div class="modal-container" @click.stop>
        <div class="modal-content">
          <!-- Header -->
          <header class="modal-header">
            <div class="header-icon">
              <i class="bi bi-exclamation-triangle-fill"></i>
            </div>
            <div class="header-content">
              <h2 id="deleteConsumerGroupModalLabel" class="modal-title">
                Delete Consumer Group
              </h2>
              <p class="modal-subtitle">This action cannot be undone</p>
            </div>
            <button
              type="button"
              class="btn-close"
              aria-label="Close modal"
              @click="onClose"
            >
              <i class="bi bi-x"></i>
            </button>
          </header>

          <!-- Body -->
          <main class="modal-body">
            <div class="confirmation-message">
              <p class="message-text">
                Are you sure you want to permanently delete the following
                consumer group?
              </p>

              <div class="consumer-group-details">
                <div class="group-info">
                  <div class="group-icon">
                    <i class="bi bi-people-fill"></i>
                  </div>
                  <div class="group-content">
                    <div class="group-label">Consumer Group</div>
                    <div class="group-name">{{ consumerGroup }}</div>
                  </div>
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
                    <li>All consumers in this group will be disconnected</li>
                    <li>
                      Message processing for this group will stop immediately
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
                  <p class="error-message">{{ error }}</p>
                </div>
              </div>
            </div>
          </main>

          <!-- Footer -->
          <footer class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="onClose">
              <i class="bi bi-x-circle me-2"></i>
              Cancel
            </button>
            <button
              type="button"
              class="btn btn-danger"
              :disabled="isPending"
              @click="onConfirmDeleteConsumerGroup"
            >
              <template v-if="isPending">
                <span class="spinner-border spinner-border-sm me-2"></span>
                Deleting Group...
              </template>
              <template v-else>
                <i class="bi bi-trash-fill me-2"></i>
                Delete Consumer Group
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
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  padding: 1.5rem;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Modal Container */
.modal-container {
  max-width: 480px;
  width: 100%;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Modal Content */
.modal-content {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  border: 1px solid #e9ecef;
}

/* Header */
.modal-header {
  background: linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%);
  padding: 2rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  border-bottom: 1px solid #fed7d7;
  position: relative;
}

.header-icon {
  width: 48px;
  height: 48px;
  background: #fee2e2;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #dc2626;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.header-content {
  flex: 1;
  min-width: 0;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
  line-height: 1.2;
}

.modal-subtitle {
  color: #6b7280;
  font-size: 0.9rem;
  margin: 0;
  font-weight: 500;
}

.btn-close {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1.1rem;
}

.btn-close:hover {
  background: white;
  color: #374151;
  border-color: #d1d5db;
  transform: scale(1.05);
}

/* Body */
.modal-body {
  padding: 2rem;
}

.confirmation-message {
  margin-bottom: 2rem;
}

.message-text {
  color: #374151;
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.consumer-group-details {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
}

.group-info {
  display: flex;
  align-items: center;
  gap: 1rem;
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
  flex: 1;
}

.group-label {
  color: #6b7280;
  font-weight: 600;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.25rem;
}

.group-name {
  color: #1f2937;
  font-weight: 700;
  font-family: 'Courier New', monospace;
  font-size: 1rem;
}

/* Warning Section */
.warning-section {
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.warning-content {
  display: flex;
  gap: 1rem;
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
  font-size: 1.2rem;
  flex-shrink: 0;
}

.warning-text {
  flex: 1;
}

.warning-title {
  font-size: 1rem;
  font-weight: 600;
  color: #92400e;
  margin: 0 0 0.75rem 0;
}

.warning-list {
  margin: 0;
  padding-left: 1.25rem;
  color: #92400e;
  font-size: 0.9rem;
  line-height: 1.5;
}

.warning-list li {
  margin-bottom: 0.25rem;
}

.warning-list li:last-child {
  margin-bottom: 0;
}

/* Error Section */
.error-section {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.error-content {
  display: flex;
  gap: 1rem;
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
  font-size: 1.2rem;
  flex-shrink: 0;
}

.error-text {
  flex: 1;
}

.error-title {
  font-size: 1rem;
  font-weight: 600;
  color: #991b1b;
  margin: 0 0 0.5rem 0;
}

.error-message {
  color: #991b1b;
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0;
}

/* Footer */
.modal-footer {
  background: #f9fafb;
  padding: 1.5rem 2rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 140px;
}

.btn-secondary {
  background: white;
  color: #374151;
  border-color: #d1d5db;
}

.btn-secondary:hover:not(:disabled) {
  background: #f3f4f6;
  border-color: #9ca3af;
  transform: translateY(-1px);
}

.btn-danger {
  background: #dc2626;
  color: white;
  border-color: #dc2626;
}

.btn-danger:hover:not(:disabled) {
  background: #b91c1c;
  border-color: #b91c1c;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.spinner-border {
  width: 1rem;
  height: 1rem;
  border-width: 2px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .modal-overlay {
    padding: 1rem;
  }

  .modal-header {
    padding: 1.5rem;
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }

  .btn-close {
    position: static;
    align-self: flex-end;
    margin-top: -0.5rem;
  }

  .modal-body {
    padding: 1.5rem;
  }

  .consumer-group-details {
    padding: 1rem;
  }

  .group-info {
    flex-direction: column;
    text-align: center;
    gap: 0.75rem;
  }

  .warning-section,
  .error-section {
    padding: 1rem;
  }

  .warning-content,
  .error-content {
    flex-direction: column;
    gap: 0.75rem;
  }

  .modal-footer {
    padding: 1rem 1.5rem;
    flex-direction: column;
    gap: 0.75rem;
  }

  .btn {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .modal-overlay {
    padding: 0.5rem;
  }

  .modal-header {
    padding: 1rem;
  }

  .modal-body {
    padding: 1rem;
  }

  .modal-title {
    font-size: 1.25rem;
  }

  .consumer-group-details,
  .warning-section,
  .error-section {
    padding: 0.75rem;
  }

  .modal-footer {
    padding: 1rem;
  }
}

/* Focus states for accessibility */
.btn:focus,
.btn-close:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.btn-danger:focus {
  outline-color: #dc2626;
}

/* High contrast mode support */
@media (prefers-contrast: more) {
  .modal-content {
    border: 2px solid #000;
  }

  .modal-header {
    border-bottom-color: #000;
  }

  .modal-footer {
    border-top-color: #000;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .modal-overlay,
  .modal-container,
  .btn,
  .btn-close {
    animation: none;
    transition: none;
  }

  .btn:hover,
  .btn-close:hover {
    transform: none;
  }
}
</style>

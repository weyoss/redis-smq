<!--
  - Copyright (c)
  - Weyoss <weyoss@protonmail.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { useCreateConsumerGroupForm } from '@/composables/useCreateConsumerGroupForm.ts';
import { defineProps, defineEmits, watch } from 'vue';
import { Form } from 'vee-validate';
import { Field, ErrorMessage } from 'vee-validate';

// Custom focus directive
const vFocus = {
  mounted: (el: HTMLElement) => el.focus(),
};

const props = defineProps<{
  isVisible: boolean;
  isCreating: boolean;
  createError?: string;
}>();

const { errors, resetForm, validationSchema } = useCreateConsumerGroupForm();

// Reset form when dialog is closed
watch(
  () => props.isVisible,
  (isVisible) => {
    if (!isVisible) {
      resetForm();
    }
  },
);

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'submit', values: { consumerGroupName: string }): void;
}>();

function onSubmit(values: any) {
  emit('submit', values);
}

function onClose() {
  emit('close');
}

function handleOverlayClick() {
  // Only close if clicking on the overlay, not the modal content
  onClose();
}
</script>

<template>
  <teleport to="body">
    <div
      v-if="isVisible"
      class="modal-overlay"
      role="dialog"
      aria-labelledby="create-consumer-group-title"
      aria-modal="true"
      @click="handleOverlayClick"
      @keydown.esc="onClose"
    >
      <div class="modal-container" @click.stop>
        <div class="modal-content">
          <!-- Header -->
          <header class="modal-header">
            <div class="header-icon">
              <i class="bi bi-people-fill"></i>
            </div>
            <div class="header-content">
              <h2 id="create-consumer-group-title" class="modal-title">
                Create Consumer Group
              </h2>
              <p class="modal-subtitle">
                Add a new consumer group for message processing
              </p>
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
            <Form
              v-slot="{ meta }"
              :validation-schema="validationSchema"
              @submit="onSubmit"
            >
              <div class="form-content">
                <!-- Consumer Group Information Section -->
                <section class="form-section">
                  <div class="section-header">
                    <h3 class="section-title">
                      <i class="bi bi-info-circle-fill section-icon"></i>
                      Group Information
                    </h3>
                    <p class="section-description">
                      Define the consumer group identifier
                    </p>
                  </div>

                  <div class="form-group">
                    <label for="consumerGroupName" class="form-label">
                      <i class="bi bi-tag-fill label-icon"></i>
                      Consumer Group Name
                      <span class="required-indicator">*</span>
                    </label>
                    <Field
                      id="consumerGroupName"
                      v-focus
                      name="consumerGroupName"
                      type="text"
                      placeholder="e.g. email-processors"
                      :class="[
                        'form-control',
                        { error: errors.consumerGroupName },
                      ]"
                      autocomplete="off"
                      aria-describedby="consumerGroupName-help consumerGroupName-error"
                    />
                    <ErrorMessage
                      id="consumerGroupName-error"
                      name="consumerGroupName"
                      class="field-error"
                    />
                    <div id="consumerGroupName-help" class="field-help">
                      <i class="bi bi-lightbulb help-icon"></i>
                      Use letters, numbers, underscores, and hyphens only
                    </div>
                  </div>
                </section>

                <!-- Benefits Section -->
                <section class="benefits-section">
                  <div class="benefits-header">
                    <h4 class="benefits-title">
                      <i class="bi bi-check-circle-fill me-2"></i>
                      Consumer Group Benefits
                    </h4>
                  </div>
                  <div class="benefits-list">
                    <div class="benefit-item">
                      <i class="bi bi-arrow-right benefit-icon"></i>
                      <span
                        >Parallel message processing across multiple
                        consumers</span
                      >
                    </div>
                    <div class="benefit-item">
                      <i class="bi bi-arrow-right benefit-icon"></i>
                      <span>Automatic load balancing and fault tolerance</span>
                    </div>
                    <div class="benefit-item">
                      <i class="bi bi-arrow-right benefit-icon"></i>
                      <span>Scalable message consumption patterns</span>
                    </div>
                  </div>
                </section>

                <!-- Error Display -->
                <div v-if="createError" class="error-section">
                  <div class="error-content">
                    <div class="error-icon">
                      <i class="bi bi-exclamation-triangle-fill"></i>
                    </div>
                    <div class="error-text">
                      <h4 class="error-title">Creation Failed</h4>
                      <p class="error-message">{{ createError }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Footer -->
              <footer class="modal-footer">
                <button
                  type="button"
                  class="btn btn-secondary"
                  @click="onClose"
                >
                  <i class="bi bi-x-circle me-2"></i>
                  Cancel
                </button>
                <button
                  type="submit"
                  class="btn btn-primary"
                  :disabled="isCreating || !meta.valid"
                >
                  <template v-if="isCreating">
                    <span class="spinner-border spinner-border-sm me-2"></span>
                    Creating Group...
                  </template>
                  <template v-else>
                    <i class="bi bi-check-circle me-2"></i>
                    Create Consumer Group
                  </template>
                </button>
              </footer>
            </Form>
          </main>
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
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
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
  display: flex;
  flex-direction: column;
  max-height: 100%;
}

/* Header */
.modal-header {
  background: linear-gradient(135deg, #f3e8ff 0%, #e8d5ff 100%);
  padding: 2rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  border-bottom: 1px solid #e8d5ff;
  position: relative;
  flex-shrink: 0;
}

.header-icon {
  width: 48px;
  height: 48px;
  background: #6f42c1;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
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
  padding: 0;
  overflow-y: auto;
  flex: 1;
}

.form-content {
  padding: 2rem;
}

/* Form Sections */
.form-section {
  margin-bottom: 2rem;
}

.section-header {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e9ecef;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-icon {
  color: #6f42c1;
  font-size: 1rem;
}

.section-description {
  color: #6b7280;
  font-size: 0.9rem;
  margin: 0;
  line-height: 1.4;
}

/* Form Groups */
.form-group {
  display: flex;
  flex-direction: column;
}

.form-label {
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.label-icon {
  color: #6b7280;
  font-size: 0.85rem;
}

.required-indicator {
  color: #dc2626;
  font-weight: 700;
}

/* Form Controls */
.form-control {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  background: white;
}

.form-control:focus {
  outline: none;
  border-color: #6f42c1;
  box-shadow: 0 0 0 3px rgba(111, 66, 193, 0.1);
}

.form-control.error {
  border-color: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.form-control::placeholder {
  color: #9ca3af;
}

/* Field Errors */
.field-error {
  color: #dc2626;
  font-size: 0.8rem;
  margin-top: 0.25rem;
  font-weight: 500;
}

/* Field Help */
.field-help {
  color: #6b7280;
  font-size: 0.8rem;
  margin-top: 0.5rem;
  display: flex;
  align-items: flex-start;
  gap: 0.25rem;
  line-height: 1.4;
}

.help-icon {
  color: #6f42c1;
  font-size: 0.75rem;
  margin-top: 0.1rem;
  flex-shrink: 0;
}

/* Benefits Section */
.benefits-section {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.benefits-header {
  margin-bottom: 1rem;
}

.benefits-title {
  font-size: 1rem;
  font-weight: 600;
  color: #198754;
  margin: 0;
  display: flex;
  align-items: center;
}

.benefits-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.benefit-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #495057;
  font-size: 0.9rem;
  line-height: 1.4;
}

.benefit-icon {
  color: #198754;
  font-size: 0.8rem;
  flex-shrink: 0;
}

/* Error Section */
.error-section {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  padding: 1.5rem;
  margin-top: 1.5rem;
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
  flex-shrink: 0;
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

.btn-primary {
  background: #6f42c1;
  color: white;
  border-color: #6f42c1;
}

.btn-primary:hover:not(:disabled) {
  background: #5a2d91;
  border-color: #5a2d91;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(111, 66, 193, 0.4);
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

  .modal-container {
    max-height: 95vh;
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

  .form-content {
    padding: 1.5rem;
  }

  .form-section {
    margin-bottom: 1.5rem;
  }

  .section-header {
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
  }

  .benefits-section {
    padding: 1rem;
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

  .form-content {
    padding: 1rem;
  }

  .modal-title {
    font-size: 1.25rem;
  }

  .benefits-section {
    padding: 0.75rem;
  }

  .error-section {
    padding: 1rem;
  }

  .error-content {
    flex-direction: column;
    gap: 0.75rem;
  }

  .modal-footer {
    padding: 1rem;
  }
}

/* Focus states for accessibility */
.btn:focus,
.btn-close:focus,
.form-control:focus {
  outline: 2px solid #6f42c1;
  outline-offset: 2px;
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
  .btn-close,
  .form-control {
    animation: none;
    transition: none;
  }

  .btn:hover,
  .btn-close:hover {
    transform: none;
  }
}
</style>

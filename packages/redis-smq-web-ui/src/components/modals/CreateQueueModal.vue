<!--
  - Copyright (c)
  - Weyoss <weyoss@protonmail.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { EQueueDeliveryModel, EQueueType } from '@/types';
import {
  useQueueForm,
  type QueueFormValues,
} from '@/composables/useQueueForm.ts';
import { Field, ErrorMessage, type GenericObject } from 'vee-validate';
import { Form } from 'vee-validate';
import { watch } from 'vue';

// Custom focus directive
const vFocus = {
  mounted: (el: HTMLElement) => el.focus(),
};

const props = defineProps<{
  isVisible: boolean;
  isCreating: boolean;
  createError: string;
  namespace?: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (
    e: 'create',
    formValues: {
      name: string;
      ns: string;
      type: EQueueType;
      deliveryModel: EQueueDeliveryModel;
    },
  ): void;
}>();

// Use the form hook - destructure individual properties
const { errors, resetForm, initialValues, validationSchema } = useQueueForm({
  ns: props.namespace,
});

// Reset form when dialog is closed
watch(
  () => props.isVisible,
  (isVisible) => {
    if (!isVisible) {
      resetForm();
    }
  },
);

// Form submission handler - now properly typed with QueueFormValues
const onFormSubmit = (values: GenericObject) => {
  emit('create', {
    ...(values as QueueFormValues),
  });
};

function handleOverlayClick() {
  // Only close if clicking on the overlay, not the modal content
  emit('close');
}
</script>

<template>
  <Teleport v-if="isVisible" to="body">
    <div
      class="modal-overlay"
      role="dialog"
      aria-labelledby="create-queue-title"
      aria-modal="true"
      @click="handleOverlayClick"
      @keydown.esc="$emit('close')"
    >
      <div class="modal-container" @click.stop>
        <div class="modal-content">
          <!-- Header -->
          <header class="modal-header">
            <div class="header-icon">
              <i class="bi bi-plus-circle-fill"></i>
            </div>
            <div class="header-content">
              <h2 id="create-queue-title" class="modal-title">
                Create New Queue
              </h2>
              <p class="modal-subtitle">
                Configure your message queue settings
              </p>
            </div>
            <button
              type="button"
              class="btn-close"
              aria-label="Close modal"
              @click="$emit('close')"
            >
              <i class="bi bi-x"></i>
            </button>
          </header>

          <!-- Body -->
          <main class="modal-body">
            <Form
              v-slot="{ meta }"
              :initial-values="initialValues"
              :validation-schema="validationSchema"
              @submit="onFormSubmit"
            >
              <div class="form-content">
                <!-- Basic Information Section -->
                <section class="form-section">
                  <div class="section-header">
                    <h3 class="section-title">
                      <i class="bi bi-info-circle-fill section-icon"></i>
                      Basic Information
                    </h3>
                    <p class="section-description">
                      Define the queue name and namespace
                    </p>
                  </div>

                  <div class="form-grid">
                    <!-- Queue Name Field -->
                    <div class="form-group">
                      <label for="name" class="form-label">
                        <i class="bi bi-tag-fill label-icon"></i>
                        Queue Name
                        <span class="required-indicator">*</span>
                      </label>
                      <Field
                        id="name"
                        v-focus
                        name="name"
                        type="text"
                        placeholder="e.g. user-notifications"
                        :class="['form-control', { error: errors.name }]"
                        autocomplete="off"
                        aria-describedby="name-help name-error"
                      />
                      <ErrorMessage
                        id="name-error"
                        name="name"
                        class="field-error"
                      />
                      <div id="name-help" class="field-help">
                        <i class="bi bi-lightbulb help-icon"></i>
                        Use letters, numbers, underscores, and hyphens only
                      </div>
                    </div>

                    <!-- Namespace Field -->
                    <div class="form-group">
                      <label for="ns" class="form-label">
                        <i class="bi bi-folder-fill label-icon"></i>
                        Namespace
                        <span class="required-indicator">*</span>
                      </label>
                      <Field
                        id="ns"
                        name="ns"
                        type="text"
                        placeholder="e.g. production"
                        :class="['form-control', { error: errors.ns }]"
                        autocomplete="off"
                        aria-describedby="ns-help ns-error"
                      />
                      <ErrorMessage
                        id="ns-error"
                        name="ns"
                        class="field-error"
                      />
                      <div id="ns-help" class="field-help">
                        <i class="bi bi-lightbulb help-icon"></i>
                        Organize queues by environment or application
                      </div>
                    </div>
                  </div>
                </section>

                <!-- Configuration Section -->
                <section class="form-section">
                  <div class="section-header">
                    <h3 class="section-title">
                      <i class="bi bi-gear-fill section-icon"></i>
                      Queue Configuration
                    </h3>
                    <p class="section-description">
                      Choose how messages are processed and delivered
                    </p>
                  </div>

                  <div class="form-grid">
                    <!-- Queue Type Field -->
                    <div class="form-group">
                      <label for="type" class="form-label">
                        <i class="bi bi-list-ol label-icon"></i>
                        Queue Type
                        <span class="required-indicator">*</span>
                      </label>
                      <Field
                        id="type"
                        name="type"
                        as="select"
                        :class="['form-select', { error: errors.type }]"
                        aria-describedby="type-help type-error"
                      >
                        <option value="">Select processing order</option>
                        <option :value="EQueueType.FIFO_QUEUE">
                          FIFO Queue
                        </option>
                        <option :value="EQueueType.LIFO_QUEUE">
                          LIFO Queue
                        </option>
                        <option :value="EQueueType.PRIORITY_QUEUE">
                          Priority Queue
                        </option>
                      </Field>
                      <ErrorMessage
                        id="type-error"
                        name="type"
                        class="field-error"
                      />
                      <div id="type-help" class="field-help">
                        <div class="help-options">
                          <div class="help-option">
                            <strong>FIFO:</strong> First message in, first
                            message out
                          </div>
                          <div class="help-option">
                            <strong>LIFO:</strong> Last message in, first
                            message out
                          </div>
                          <div class="help-option">
                            <strong>Priority:</strong> Higher priority messages
                            processed first
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Delivery Model Field -->
                    <div class="form-group">
                      <label for="deliveryModel" class="form-label">
                        <i class="bi bi-arrow-left-right label-icon"></i>
                        Delivery Model
                        <span class="required-indicator">*</span>
                      </label>
                      <Field
                        id="deliveryModel"
                        name="deliveryModel"
                        as="select"
                        :class="[
                          'form-select',
                          { error: errors.deliveryModel },
                        ]"
                        aria-describedby="deliveryModel-help deliveryModel-error"
                      >
                        <option value="">Select delivery pattern</option>
                        <option :value="EQueueDeliveryModel.POINT_TO_POINT">
                          Point to Point
                        </option>
                        <option :value="EQueueDeliveryModel.PUB_SUB">
                          Publish/Subscribe
                        </option>
                      </Field>
                      <ErrorMessage
                        id="deliveryModel-error"
                        name="deliveryModel"
                        class="field-error"
                      />
                      <div id="deliveryModel-help" class="field-help">
                        <div class="help-options">
                          <div class="help-option">
                            <strong>Point to Point:</strong> One-to-one message
                            delivery
                          </div>
                          <div class="help-option">
                            <strong>Pub/Sub:</strong> One-to-many message
                            broadcasting
                          </div>
                        </div>
                      </div>
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
                  @click="$emit('close')"
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
                    Creating Queue...
                  </template>
                  <template v-else>
                    <i class="bi bi-check-circle me-2"></i>
                    Create Queue
                  </template>
                </button>
              </footer>
            </Form>
          </main>
        </div>
      </div>
    </div>
  </Teleport>
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
  padding: 0.75rem;
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
  max-width: 550px;
  width: 100%;
  max-height: 95vh;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease-out;
  /* Add overflow hidden to contain children */
  overflow: hidden;
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
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  border: 1px solid #e9ecef;
  display: flex;
  flex-direction: column;
  max-height: 100%;
  height: 100%;
}

/* Header */
.modal-header {
  background: linear-gradient(135deg, #e7f3ff 0%, #cce7ff 100%);
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  border-bottom: 1px solid #cce7ff;
  position: relative;
  flex-shrink: 0;
}

.header-icon {
  width: 40px;
  height: 40px;
  background: #0d6efd;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.header-content {
  flex: 1;
  min-width: 0;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
  line-height: 1.2;
}

.modal-subtitle {
  color: #6b7280;
  font-size: 0.85rem;
  margin: 0;
  font-weight: 500;
}

.btn-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 28px;
  height: 28px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1rem;
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
  min-height: 0;
}

.form-content {
  padding: 1.25rem 1.5rem;
}

/* Form Sections */
.form-section {
  margin-bottom: 1.75rem;
}

.form-section:last-child {
  margin-bottom: 0;
}

.section-header {
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e9ecef;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.375rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-icon {
  color: #0d6efd;
  font-size: 0.9rem;
}

.section-description {
  color: #6b7280;
  font-size: 0.8rem;
  margin: 0;
  line-height: 1.4;
}

/* Form Grid */
.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
}

/* Form Groups */
.form-group {
  display: flex;
  flex-direction: column;
}

.form-label {
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.375rem;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.85rem;
}

.label-icon {
  color: #6b7280;
  font-size: 0.8rem;
}

.required-indicator {
  color: #dc2626;
  font-weight: 700;
}

/* Form Controls */
.form-control,
.form-select {
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 0.625rem 0.75rem;
  font-size: 0.85rem;
  transition: all 0.2s ease;
  background: white;
}

.form-control:focus,
.form-select:focus {
  outline: none;
  border-color: #0d6efd;
  box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.1);
}

.form-control.error,
.form-select.error {
  border-color: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.form-control::placeholder {
  color: #9ca3af;
}

/* Field Errors */
.field-error {
  color: #dc2626;
  font-size: 0.75rem;
  margin-top: 0.25rem;
  font-weight: 500;
}

/* Field Help */
.field-help {
  color: #6b7280;
  font-size: 0.75rem;
  margin-top: 0.375rem;
  display: flex;
  align-items: flex-start;
  gap: 0.25rem;
  line-height: 1.4;
}

.help-icon {
  color: #0d6efd;
  font-size: 0.7rem;
  margin-top: 0.1rem;
  flex-shrink: 0;
}

.help-options {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-left: 0.75rem;
}

.help-option {
  font-size: 0.75rem;
  line-height: 1.3;
}

.help-option strong {
  color: #374151;
}

/* Error Section */
.error-section {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
}

.error-content {
  display: flex;
  gap: 0.75rem;
}

.error-icon {
  width: 32px;
  height: 32px;
  background: #fee2e2;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #dc2626;
  font-size: 1rem;
  flex-shrink: 0;
}

.error-text {
  flex: 1;
}

.error-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #991b1b;
  margin: 0 0 0.375rem 0;
}

.error-message {
  color: #991b1b;
  font-size: 0.8rem;
  line-height: 1.5;
  margin: 0;
}

/* Footer */
.modal-footer {
  background: #f9fafb;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  flex-shrink: 0;
}

.btn {
  padding: 0.625rem 1.25rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.85rem;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 100px;
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
  background: #0d6efd;
  color: white;
  border-color: #0d6efd;
}

.btn-primary:hover:not(:disabled) {
  background: #0b5ed7;
  border-color: #0a58ca;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(13, 110, 253, 0.4);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.spinner-border {
  width: 0.875rem;
  height: 0.875rem;
  border-width: 2px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .modal-overlay {
    padding: 0.5rem;
  }

  .modal-container {
    max-height: 98vh;
    height: 98vh;
  }

  .modal-header {
    padding: 1rem;
    flex-direction: column;
    text-align: center;
    gap: 0.75rem;
  }

  .modal-content {
    max-height: 100%;
    height: 100%;
  }

  .modal-body {
    padding: 0;
    overflow-y: auto;
    flex: 1 1 auto;
    min-height: 0;
    max-height: 60vh; /* fallback for desktop */
  }

  .btn-close {
    position: static;
    align-self: flex-end;
    margin-top: -0.5rem;
  }

  .form-content {
    padding: 1rem;
  }

  .form-section {
    margin-bottom: 1.25rem;
  }

  .section-header {
    margin-bottom: 0.75rem;
    padding-bottom: 0.5rem;
  }

  .form-grid {
    gap: 1rem;
  }

  .modal-footer {
    padding: 0.75rem 1rem;
    flex-direction: column;
    gap: 0.5rem;
  }

  .btn {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .modal-overlay {
    padding: 0.25rem;
  }

  .modal-container {
    max-height: 99vh;
    height: 99vh;
  }

  .modal-header {
    padding: 0.75rem;
  }

  .modal-content {
    max-height: 100%;
    height: 100%;
  }

  .modal-body {
    max-height: none;
    height: 100%;
    min-height: 0;
    overflow-y: auto;
  }

  .form-content {
    padding: 0.75rem;
  }

  .modal-title {
    font-size: 1.1rem;
  }

  .error-section {
    padding: 0.75rem;
  }

  .error-content {
    flex-direction: column;
    gap: 0.5rem;
  }

  .modal-footer {
    padding: 0.75rem;
  }

  .help-options {
    margin-left: 0;
  }
}

@media (max-height: 820px) {
  .modal-container {
    max-height: 100vh;
    height: 100vh;
  }

  .modal-overlay {
    padding: 0;
    align-items: flex-start;
  }

  .modal-content {
    border-radius: 0;
    max-height: 100%;
    height: 100%;
  }

  .modal-body {
    max-height: none;
    height: 100%;
    min-height: 0;
    overflow-y: auto;
  }

  .modal-header {
    padding: 0.75rem 1rem;
  }

  .form-content {
    padding: 0.75rem 1rem;
  }

  .form-section {
    margin-bottom: 1rem;
  }

  .section-header {
    margin-bottom: 0.5rem;
    padding-bottom: 0.375rem;
  }

  .modal-footer {
    padding: 0.75rem 1rem;
  }
}

/* Focus states for accessibility */
.btn:focus,
.btn-close:focus,
.form-control:focus,
.form-select:focus {
  outline: 2px solid #0d6efd;
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
  .form-control,
  .form-select {
    animation: none;
    transition: none;
  }

  .btn:hover,
  .btn-close:hover {
    transform: none;
  }
}
</style>

<!--
  - Copyright (c)
  - Weyoss <weyoss@protonmail.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import BaseModal from './BaseModal.vue';
import { useCreateConsumerGroupForm } from '@/composables/useCreateConsumerGroupForm.ts';
import { defineProps, defineEmits, watch } from 'vue';
import { Form, Field, ErrorMessage } from 'vee-validate';

// Custom focus directive (used on the first field)
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
</script>

<template>
  <BaseModal
    :is-visible="isVisible"
    title="Create Consumer Group"
    subtitle="Add a new consumer group for message processing"
    icon="bi bi-people-fill"
    size="md"
    @close="onClose"
  >
    <template #body>
      <!-- Use a form id so footer submit (outside of form subtree) can submit via form attribute -->
      <Form
        id="create-consumer-group-form"
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
                :class="['form-control', { error: errors.consumerGroupName }]"
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
                  >Parallel message processing across multiple consumers</span
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
      </Form>
    </template>

    <template #footer>
      <!-- Buttons live in BaseModal footer; submit button references the form by id -->
      <button
        type="button"
        class="btn btn-secondary"
        :disabled="isCreating"
        @click="onClose"
      >
        <i class="bi bi-x-circle me-2"></i>
        Cancel
      </button>
      <button
        type="submit"
        class="btn btn-primary"
        :disabled="isCreating"
        form="create-consumer-group-form"
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
    </template>
  </BaseModal>
</template>

<style scoped>
/* Body form content spacing */
.form-content {
  --content-padding: clamp(16px, 3.2vw, 24px);
  padding: var(--content-padding);
  display: flex;
  flex-direction: column;
  gap: clamp(16px, 2.4vw, 24px);
  overflow-x: hidden; /* prevent horizontal bleed */
}

/* Form Sections */
.form-section {
  margin: 0;
}

.section-header {
  margin-bottom: clamp(10px, 2vw, 16px);
  padding-bottom: clamp(8px, 1.6vw, 12px);
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
  padding: clamp(12px, 2.4vw, 20px);
  margin: 0;
}

.benefits-header {
  margin-bottom: 0.75rem;
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
  padding: clamp(12px, 2.4vw, 20px);
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
  min-width: 0;
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
  overflow-wrap: anywhere;
  word-break: break-word;
}

/* Buttons rely on global/utility styles; ensure mobile-friendly footer spacing if needed */
@media (max-width: 768px) {
  /* BaseModal already stacks footer on small screens; this is a safe override if needed */
  :global(.modal-footer) {
    gap: 0.75rem;
  }
}

@media (max-width: 576px) {
  .error-content {
    flex-direction: column;
    gap: 0.75rem;
  }
}

/* Accessibility focus */
.form-control:focus {
  outline: 2px solid #6f42c1;
  outline-offset: 2px;
}

/* High contrast */
@media (prefers-contrast: more) {
  .benefits-section,
  .error-section {
    border-width: 2px;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .form-control {
    transition: none;
  }
}
</style>

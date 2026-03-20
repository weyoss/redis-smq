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
import { Field } from 'vee-validate';
import BaseModal from '@/components/modals/BaseModal.vue';
import { useQueueStateChangeForm } from '@/composables/useQueueStateChangeForm';
import { usePatchApiNamespacesNsQueuesNameState } from '@/api/generated/queue-operational-state/queue-operational-state';
import { EQueueStateTransitionReason } from '@/api/model';

const props = defineProps<{
  isVisible: boolean;
  queue: {
    ns: string;
    name: string;
  };
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'success'): void;
}>();

// Error section ref for focusing
const errorSectionRef = ref<HTMLElement | null>(null);

// State mutation
const stateMutation = usePatchApiNamespacesNsQueuesNameState({
  mutation: {
    onSuccess: () => {
      emit('success');
    },
    onError: (error) => {
      console.error('Failed to pause queue:', error);
      nextTick(() => {
        errorSectionRef.value?.focus();
      });
    },
  },
});

const isPausing = computed(() => stateMutation.isPending.value);
const error = computed(() => stateMutation.error.value?.error);

// Initialize form using the composable
const {
  reasonError,
  description,
  descriptionError,
  isFormValid,
  handleSubmit,
  resetForm,
  metadataEntries,
  metadataKey,
  metadataValue,
  addMetadataEntry,
  removeMetadataEntry,
  getMetadataObject,
  showAdvanced,
  reasonOptions,
} = useQueueStateChangeForm({
  reasonEnum: EQueueStateTransitionReason,
  defaultReason: EQueueStateTransitionReason.MANUAL,
  maxDescriptionLength: 500,
});

// Handle modal close
function handleModalClose() {
  if (!isPausing.value) {
    resetForm();
    stateMutation.reset();
    emit('close');
  }
}

// Submit handler
const onSubmit = handleSubmit(async (values) => {
  if (isPausing.value) return;

  const options: Record<string, any> = {};
  if (values.description) options.description = values.description;
  if (getMetadataObject()) options.metadata = getMetadataObject();
  if (values.reason) options.reason = values.reason;

  await stateMutation.mutateAsync({
    ns: props.queue.ns,
    name: props.queue.name,
    data: {
      state: 'pause',
      options,
    },
  });
});

// Reset form when modal is hidden
watch(
  () => props.isVisible,
  (newVal) => {
    if (!newVal) {
      resetForm();
      stateMutation.reset();
    }
  },
);
</script>

<template>
  <BaseModal
    :is-visible="isVisible"
    title="Pause Queue"
    subtitle="Temporarily stop message processing"
    icon="bi bi-pause-circle-fill"
    size="md"
    @close="handleModalClose"
  >
    <template #body>
      <form id="pause-queue-form" @submit.prevent="onSubmit">
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
            <span>{{ error }}</span>
          </div>

          <!-- Confirmation -->
          <section class="confirmation-message">
            <p class="message-text">
              Are you sure you want to pause the following queue?
            </p>

            <div class="queue-details" role="group" aria-label="Queue details">
              <div class="queue-info">
                <div class="info-item">
                  <span class="info-label">Queue Name:</span>
                  <span class="info-value queue-name" :title="queue.name">
                    {{ queue.name }}
                  </span>
                </div>
                <div class="info-item">
                  <span class="info-label">Namespace:</span>
                  <span class="info-value namespace" :title="queue.ns">
                    {{ queue.ns }}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <!-- Reason Selection -->
          <section class="form-section">
            <h4 class="section-title">Reason for pausing</h4>

            <div class="form-group" :class="{ 'has-error': reasonError }">
              <label for="pause-reason" class="form-label">Select reason</label>
              <Field
                id="pause-reason"
                as="select"
                name="reason"
                class="form-select"
                :class="{ 'is-invalid': reasonError }"
                :disabled="isPausing"
              >
                <option
                  v-for="option in reasonOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </Field>
              <Transition name="fade">
                <div v-if="reasonError" class="error-message" role="alert">
                  <i class="bi bi-exclamation-triangle-fill me-1"></i>
                  {{ reasonError }}
                </div>
              </Transition>
            </div>

            <div class="form-group" :class="{ 'has-error': descriptionError }">
              <label for="pause-description" class="form-label">
                Description <span class="optional-badge">Optional</span>
                <span v-if="description" class="character-count">
                  {{ description.length }}/500
                </span>
              </label>
              <Field
                id="pause-description"
                as="textarea"
                name="description"
                class="form-textarea"
                :class="{ 'is-invalid': descriptionError }"
                placeholder="Add additional context about why this queue is being paused..."
                rows="3"
                :disabled="isPausing"
              ></Field>
              <Transition name="fade">
                <div v-if="descriptionError" class="error-message" role="alert">
                  <i class="bi bi-exclamation-triangle-fill me-1"></i>
                  {{ descriptionError }}
                </div>
              </Transition>
            </div>
          </section>

          <!-- Advanced Options -->
          <section class="advanced-section">
            <button
              type="button"
              class="advanced-toggle"
              :disabled="isPausing"
              @click="showAdvanced = !showAdvanced"
            >
              <i
                class="bi"
                :class="showAdvanced ? 'bi-chevron-up' : 'bi-chevron-down'"
              ></i>
              {{ showAdvanced ? 'Hide' : 'Show' }} Advanced Options
            </button>

            <Transition name="slide">
              <div v-if="showAdvanced" class="advanced-content">
                <h4 class="section-title">Metadata</h4>
                <p class="metadata-hint">
                  Add custom metadata to help with auditing and tracking
                </p>

                <!-- Metadata entries list -->
                <div v-if="metadataEntries.length > 0" class="metadata-list">
                  <div
                    v-for="(entry, index) in metadataEntries"
                    :key="index"
                    class="metadata-item"
                  >
                    <span class="metadata-key">{{ entry.key }}:</span>
                    <span class="metadata-value">{{ entry.value }}</span>
                    <button
                      type="button"
                      class="metadata-remove"
                      :disabled="isPausing"
                      aria-label="Remove metadata entry"
                      @click="removeMetadataEntry(index)"
                    >
                      <i class="bi bi-x"></i>
                    </button>
                  </div>
                </div>

                <!-- Add new metadata entry -->
                <div class="metadata-add">
                  <input
                    v-model="metadataKey"
                    type="text"
                    class="metadata-input"
                    placeholder="Key"
                    :disabled="isPausing"
                  />
                  <input
                    v-model="metadataValue"
                    type="text"
                    class="metadata-input"
                    placeholder="Value"
                    :disabled="isPausing"
                  />
                  <button
                    type="button"
                    class="metadata-add-btn"
                    :disabled="
                      isPausing || !metadataKey.trim() || !metadataValue.trim()
                    "
                    @click="addMetadataEntry"
                  >
                    <i class="bi bi-plus"></i>
                    Add
                  </button>
                </div>
              </div>
            </Transition>
          </section>

          <!-- Info -->
          <section class="info-section" aria-live="polite">
            <div class="info-content">
              <div class="info-icon" aria-hidden="true">
                <i class="bi bi-info-circle-fill"></i>
              </div>
              <div class="info-text">
                <h4 class="info-title">What happens when paused?</h4>
                <ul class="info-list">
                  <li>New messages can still be produced to the queue</li>
                  <li>Consumers will stop receiving messages</li>
                  <li>Existing consumers will be disconnected</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </form>
    </template>

    <template #footer>
      <div class="actions">
        <button
          type="button"
          class="btn btn-outline-secondary"
          :disabled="isPausing"
          @click="handleModalClose"
        >
          <i class="bi bi-x-circle me-2" aria-hidden="true"></i>
          Cancel
        </button>
        <button
          type="submit"
          form="pause-queue-form"
          class="btn btn-warning"
          :disabled="isPausing || !isFormValid"
        >
          <template v-if="isPausing">
            <span
              class="spinner-border spinner-border-sm me-2"
              role="status"
              aria-hidden="true"
            ></span>
            Pausing Queue...
          </template>
          <template v-else>
            <i class="bi bi-pause-fill me-2" aria-hidden="true"></i>
            Pause Queue
          </template>
        </button>
      </div>
    </template>
  </BaseModal>
</template>

<style scoped>
.dialog-body {
  display: grid;
  gap: clamp(16px, 3vw, 24px);
  padding: 0;
  overflow-x: hidden;
}

/* Error Alert */
.error-alert {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  border-radius: 8px;
  font-size: 0.9rem;
  transition: box-shadow 0.2s ease;
}

.error-alert:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.25);
  border-color: #dc3545;
}

.error-alert i {
  font-size: 1rem;
  flex-shrink: 0;
}

/* Confirmation section */
.confirmation-message {
  display: grid;
  gap: 0.75rem;
}

.message-text {
  color: #374151;
  font-size: 1rem;
  line-height: 1.6;
  margin: 0;
  overflow-wrap: anywhere;
  word-break: break-word;
}

/* Queue details */
.queue-details {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: clamp(12px, 2.6vw, 16px);
}

.queue-info {
  display: grid;
  gap: 0.75rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: center;
  padding: 0.25rem 0;
}

.info-label {
  color: #6b7280;
  font-weight: 600;
  font-size: 0.9rem;
  flex: 0 0 auto;
}

.info-value {
  font-weight: 700;
  font-family: 'Courier New', monospace;
  font-size: 0.95rem;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.queue-name {
  color: #b45309;
}
.namespace {
  color: #059669;
}

/* Form section */
.form-section {
  display: grid;
  gap: 1rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.form-group {
  display: grid;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #4b5563;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.optional-badge {
  font-size: 0.75rem;
  font-weight: 400;
  color: #9ca3af;
  margin-left: 0.5rem;
}

.character-count {
  font-size: 0.75rem;
  color: #9ca3af;
  font-weight: 400;
}

.form-select {
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.95rem;
  color: #1f2937;
  background-color: white;
  transition: all 0.2s ease;
}

.form-select:focus {
  outline: none;
  border-color: #b45309;
  box-shadow: 0 0 0 3px rgba(180, 83, 9, 0.1);
}

.form-select:disabled {
  background-color: #f3f4f6;
  cursor: not-allowed;
}

.form-select.is-invalid {
  border-color: #dc2626;
}

.form-select.is-invalid:focus {
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.form-textarea {
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.95rem;
  color: #1f2937;
  background-color: white;
  resize: vertical;
  font-family: inherit;
  transition: all 0.2s ease;
}

.form-textarea:focus {
  outline: none;
  border-color: #b45309;
  box-shadow: 0 0 0 3px rgba(180, 83, 9, 0.1);
}

.form-textarea:disabled {
  background-color: #f3f4f6;
  cursor: not-allowed;
}

.form-textarea.is-invalid {
  border-color: #dc2626;
}

.form-textarea.is-invalid:focus {
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

/* Error message */
.error-message {
  color: #dc2626;
  font-size: 0.85rem;
  margin-top: 0.25rem;
  display: flex;
  align-items: center;
}

/* Advanced section */
.advanced-section {
  border-top: 1px solid #e5e7eb;
  padding-top: 1rem;
}

.advanced-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  color: #6b7280;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0.25rem 0;
  transition: color 0.2s ease;
  width: 100%;
  text-align: left;
}

.advanced-toggle:hover:not(:disabled) {
  color: #374151;
}

.advanced-toggle:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.advanced-toggle i {
  font-size: 0.8rem;
}

.advanced-content {
  margin-top: 1rem;
  display: grid;
  gap: 1rem;
}

.metadata-hint {
  font-size: 0.85rem;
  color: #6b7280;
  margin: -0.5rem 0 0.5rem 0;
}

.metadata-list {
  background: #f9fafb;
  border-radius: 8px;
  padding: 0.5rem;
  display: grid;
  gap: 0.5rem;
}

.metadata-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: white;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.metadata-key {
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
}

.metadata-value {
  color: #6b7280;
  font-size: 0.9rem;
  flex: 1;
  word-break: break-word;
}

.metadata-remove {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.metadata-remove:hover:not(:disabled) {
  color: #dc2626;
  background: #fee2e2;
}

.metadata-remove:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.metadata-add {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 0.5rem;
  align-items: center;
}

.metadata-input {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.metadata-input:focus {
  outline: none;
  border-color: #b45309;
  box-shadow: 0 0 0 3px rgba(180, 83, 9, 0.1);
}

.metadata-input:disabled {
  background-color: #f3f4f6;
  cursor: not-allowed;
}

.metadata-add-btn {
  padding: 0.5rem 1rem;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  color: #374151;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.metadata-add-btn:hover:not(:disabled) {
  background: #e5e7eb;
  border-color: #9ca3af;
}

.metadata-add-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Info section */
.info-section {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 12px;
  padding: clamp(12px, 2.6vw, 16px);
}

.info-content {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}

.info-icon {
  width: 40px;
  height: 40px;
  background: #dbeafe;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #1d4ed8;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.info-text {
  flex: 1 1 auto;
  min-width: 0;
}

.info-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1e3a8a;
  margin: 0 0 0.5rem 0;
}

.info-list {
  margin: 0;
  padding-left: 1.25rem;
  color: #1e40af;
  font-size: 0.9rem;
  line-height: 1.5;
}

.info-list li {
  margin-bottom: 0.25rem;
}

.info-list li:last-child {
  margin-bottom: 0;
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

/* Animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
  max-height: 500px;
  overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  max-height: 0;
  margin-top: 0;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }

  .metadata-add {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 576px) {
  .info-content {
    flex-direction: column;
  }

  .info-value {
    white-space: normal;
    overflow-wrap: anywhere;
    word-break: break-word;
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

  .metadata-item {
    flex-wrap: wrap;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .form-select,
  .form-textarea,
  .metadata-input,
  .metadata-add-btn,
  .metadata-remove,
  .advanced-toggle,
  .btn,
  .error-alert {
    transition: none;
  }

  .fade-enter-active,
  .fade-leave-active,
  .slide-enter-active,
  .slide-leave-active {
    transition: none;
  }
}
</style>

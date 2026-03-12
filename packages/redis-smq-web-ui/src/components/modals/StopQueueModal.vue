<!--
  - Copyright (c)
  - Weyoss <weyoss@outlook.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Field } from 'vee-validate';
import BaseModal from '@/components/modals/BaseModal.vue';
import { useQueueStateChangeForm } from '@/composables/useQueueStateChangeForm';
import { PostApiV1NamespacesNsQueuesNameOperationalStateStopBodyReason } from '@/api/model';
import { EQueueOperationalState } from '@/types';

const props = defineProps<{
  isVisible: boolean;
  isStopping: boolean;
  queue: {
    ns: string;
    name: string;
    status?: EQueueOperationalState;
  };
}>();

const emit = defineEmits<{
  (e: 'cancel'): void;
  (
    e: 'confirm',
    data: {
      reason: string;
      description?: string;
      metadata?: Record<string, unknown>;
    },
  ): void;
}>();

// Confirmation acknowledgment state
const acknowledged = ref<boolean>(false);

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
  reasonEnum: PostApiV1NamespacesNsQueuesNameOperationalStateStopBodyReason,
  defaultReason:
    PostApiV1NamespacesNsQueuesNameOperationalStateStopBodyReason.MANUAL,
  maxDescriptionLength: 500,
});

// Handle modal close
function handleModalClose() {
  if (!props.isStopping) {
    resetForm();
    acknowledged.value = false;
    emit('cancel');
  }
}

// Submit handler
const onSubmit = handleSubmit((values) => {
  if (!props.isStopping && acknowledged.value) {
    emit('confirm', {
      reason: values.reason,
      description: values.description || undefined,
      metadata: getMetadataObject(),
    });

    resetForm();
    acknowledged.value = false;
  }
});

// Helper to check if queue is currently paused (for additional warnings)
const isQueuePaused = computed(
  () => props.queue.status === EQueueOperationalState.PAUSED,
);

// Determine if submit should be disabled
const isSubmitDisabled = computed(
  () => props.isStopping || !isFormValid.value || !acknowledged.value,
);
</script>

<template>
  <BaseModal
    :is-visible="isVisible"
    title="Stop Queue"
    subtitle="This action has serious implications"
    icon="bi bi-exclamation-octagon-fill"
    size="md"
    @close="handleModalClose"
  >
    <template #body>
      <form id="stop-queue-form" @submit.prevent="onSubmit">
        <div class="dialog-body">
          <!-- Confirmation -->
          <section class="confirmation-message">
            <p class="message-text">
              Are you sure you want to permanently stop the following queue?
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
                <div v-if="queue.status" class="info-item">
                  <span class="info-label">Current Status:</span>
                  <span
                    class="info-value"
                    :class="{
                      'status-paused':
                        queue.status === EQueueOperationalState.PAUSED,
                      'status-stopped':
                        queue.status === EQueueOperationalState.STOPPED,
                    }"
                  >
                    {{ queue.status }}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <!-- Critical Warning Banner -->
          <section class="critical-warning" role="alert">
            <div class="critical-warning-content">
              <i
                class="bi bi-exclamation-triangle-fill critical-warning-icon"
              ></i>
              <div class="critical-warning-text">
                <strong>This action cannot be undone</strong> - Stopping a queue
                is a disruptive operation that will immediately impact all
                connected applications.
              </div>
            </div>
          </section>

          <!-- Additional warning for paused queues -->
          <section v-if="isQueuePaused" class="info-section">
            <div class="info-content">
              <i class="bi bi-info-circle-fill info-icon-small"></i>
              <span class="info-text-small">
                <strong>Note:</strong> This queue is currently paused. Stopping
                it will disconnect any idle consumers and prevent any future
                operations until resumed.
              </span>
            </div>
          </section>

          <!-- Reason Selection -->
          <section class="form-section">
            <h4 class="section-title">Reason for stopping</h4>

            <div class="form-group" :class="{ 'has-error': reasonError }">
              <label for="stop-reason" class="form-label">Select reason</label>
              <Field
                id="stop-reason"
                as="select"
                name="reason"
                class="form-select"
                :class="{ 'is-invalid': reasonError }"
                :disabled="isStopping"
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
              <label for="stop-description" class="form-label">
                Description
                <span class="optional-badge">Optional but recommended</span>
                <span v-if="description" class="character-count">
                  {{ description.length }}/500
                </span>
              </label>
              <Field
                id="stop-description"
                as="textarea"
                name="description"
                class="form-textarea"
                :class="{ 'is-invalid': descriptionError }"
                placeholder="Provide detailed context about why this queue needs to be stopped. This helps with incident investigation and auditing."
                rows="4"
                :disabled="isStopping"
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
              :disabled="isStopping"
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
                  Add custom metadata to help with auditing, incident tracking,
                  and forensics
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
                      :disabled="isStopping"
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
                    placeholder="Key (e.g., incident-id, ticket-number)"
                    :disabled="isStopping"
                  />
                  <input
                    v-model="metadataValue"
                    type="text"
                    class="metadata-input"
                    placeholder="Value"
                    :disabled="isStopping"
                  />
                  <button
                    type="button"
                    class="metadata-add-btn"
                    :disabled="
                      isStopping || !metadataKey.trim() || !metadataValue.trim()
                    "
                    @click="addMetadataEntry"
                  >
                    <i class="bi bi-plus"></i>
                    Add
                  </button>
                </div>

                <div class="metadata-examples">
                  <p class="metadata-examples-title">Suggested metadata:</p>
                  <div class="metadata-examples-tags">
                    <span class="metadata-tag">incident-id: INC-12345</span>
                    <span class="metadata-tag">ticket: OPS-6789</span>
                    <span class="metadata-tag">authorized-by: john.doe</span>
                    <span class="metadata-tag">reason-ref: RFC-789</span>
                  </div>
                </div>
              </div>
            </Transition>
          </section>

          <!-- Warning: What happens when stopped -->
          <section class="warning-section" aria-live="polite">
            <div class="warning-content">
              <div class="warning-icon" aria-hidden="true">
                <i class="bi bi-shield-exclamation"></i>
              </div>
              <div class="warning-text">
                <h4 class="warning-title">
                  ⚠️ Critical: Understand the implications
                </h4>
                <ul class="warning-list">
                  <li>
                    <strong>Consumers will be disconnected</strong> - All active
                    consumers will be forcibly disconnected immediately
                  </li>
                  <li>
                    <strong>Message production blocked</strong> - No new
                    messages can be produced to this queue until resumed
                  </li>
                  <li>
                    <strong>Message consumption stopped</strong> - Messages
                    cannot be consumed until the queue is resumed
                  </li>
                  <li>
                    <strong>Monitoring alerts may trigger</strong> - Connected
                    services may report errors or connection issues
                  </li>
                  <li>
                    <strong>Manual intervention required</strong> - You must
                    explicitly resume the queue to restore operations
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <!-- Confirmation Checkbox -->
          <section class="confirmation-checkbox">
            <label class="checkbox-label">
              <input
                v-model="acknowledged"
                type="checkbox"
                :disabled="isStopping"
              />
              <span>
                I understand the implications of stopping this queue and
                acknowledge that this will impact all connected applications
              </span>
            </label>
          </section>
        </div>
      </form>
    </template>

    <template #footer>
      <div class="actions">
        <button
          type="button"
          class="btn btn-outline-secondary"
          :disabled="isStopping"
          @click="handleModalClose"
        >
          <i class="bi bi-x-circle me-2" aria-hidden="true"></i>
          Cancel
        </button>
        <button
          type="submit"
          form="stop-queue-form"
          class="btn btn-danger"
          :disabled="isSubmitDisabled"
        >
          <template v-if="isStopping">
            <span
              class="spinner-border spinner-border-sm me-2"
              role="status"
              aria-hidden="true"
            ></span>
            Stopping Queue...
          </template>
          <template v-else>
            <i class="bi bi-stop-fill me-2" aria-hidden="true"></i>
            Stop Queue
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
  color: #dc2626;
}
.namespace {
  color: #059669;
}

.status-running {
  color: #059669;
}
.status-paused {
  color: #b45309;
}
.status-stopped {
  color: #dc2626;
}

/* Critical warning banner */
.critical-warning {
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 1rem;
}

.critical-warning-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.critical-warning-icon {
  color: #dc2626;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.critical-warning-text {
  color: #991b1b;
  font-size: 0.95rem;
  line-height: 1.5;
}

/* Info section for additional warnings */
.info-section {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  padding: 0.75rem 1rem;
}

.info-content {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}

.info-icon-small {
  color: #1d4ed8;
  font-size: 1rem;
  flex-shrink: 0;
  margin-top: 0.2rem;
}

.info-text-small {
  color: #1e40af;
  font-size: 0.9rem;
  line-height: 1.5;
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
  border-color: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.form-select:disabled {
  background-color: #f3f4f6;
  cursor: not-allowed;
}

.form-select.is-invalid {
  border-color: #dc2626;
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
  border-color: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.form-textarea:disabled {
  background-color: #f3f4f6;
  cursor: not-allowed;
}

.form-textarea.is-invalid {
  border-color: #dc2626;
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
  border-color: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
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

.metadata-examples {
  background: #f3f4f6;
  border-radius: 6px;
  padding: 0.75rem;
}

.metadata-examples-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: #4b5563;
  margin: 0 0 0.5rem 0;
}

.metadata-examples-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.metadata-tag {
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
  color: #374151;
  font-family: monospace;
}

/* Warning section */
.warning-section {
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 12px;
  padding: clamp(12px, 2.6vw, 16px);
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
  margin: 0 0 0.5rem 0;
}

.warning-list {
  margin: 0;
  padding-left: 1.25rem;
  color: #92400e;
  font-size: 0.9rem;
  line-height: 1.5;
}

.warning-list li {
  margin-bottom: 0.5rem;
}

.warning-list li:last-child {
  margin-bottom: 0;
}

.warning-list strong {
  color: #b45309;
}

/* Impact section */
.impact-section {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: clamp(12px, 2.6vw, 16px);
}

.impact-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #374151;
  margin: 0 0 0.75rem 0;
}

.impact-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.impact-item {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.75rem;
}

.impact-item-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #4b5563;
  margin-bottom: 0.5rem;
}

.impact-item-header i {
  color: #9ca3af;
}

.impact-item p {
  margin: 0;
  font-size: 0.85rem;
  color: #6b7280;
  line-height: 1.4;
}

/* Confirmation checkbox */
.confirmation-checkbox {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
}

.checkbox-label {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  cursor: pointer;
  font-size: 0.95rem;
  color: #374151;
  line-height: 1.5;
}

.checkbox-label input[type='checkbox'] {
  margin-top: 0.2rem;
  width: 1rem;
  height: 1rem;
  cursor: pointer;
}

.checkbox-label input[type='checkbox']:disabled {
  cursor: not-allowed;
  opacity: 0.5;
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

  .impact-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 576px) {
  .warning-content {
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

  .critical-warning-content {
    align-items: flex-start;
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
  .btn {
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

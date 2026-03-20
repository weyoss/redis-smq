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
import { EExchangeType } from '@/types/exchanges';
import { getErrorMessage } from '@/lib/error';
import BaseModal from '@/components/modals/BaseModal.vue';
import { usePostApiNamespacesNsExchangesExchangeBindingsQueue } from '@/api/generated/namespace-exchanges/namespace-exchanges';

// Custom focus directive
const vFocus = {
  mounted: (el: HTMLElement) => el.focus(),
};

// Error section ref for focusing
const errorSectionRef = ref<HTMLElement | null>(null);

const props = defineProps<{
  isVisible: boolean;
}>();

const emit = defineEmits<{
  (e: 'cancel'): void;
  (e: 'success'): void;
}>();

// Form state
const name = ref('');
const ns = ref('default');
const type = ref<EExchangeType>(EExchangeType.DIRECT);
const queueName = ref('');
const routingKey = ref('');
const routingPattern = ref('');
const createError = ref('');

// Exchange type options
const exchangeTypeOptions = [
  {
    value: EExchangeType.DIRECT,
    label: 'Direct',
    description: 'Routes messages to queues based on exact routing key match',
    paramName: 'routingKey',
    paramPlaceholder: 'e.g., user.created',
    paramHelp:
      'Messages with this exact routing key will be routed to the queue',
  },
  {
    value: EExchangeType.TOPIC,
    label: 'Topic',
    description: 'Routes messages based on wildcard pattern matching (* and #)',
    paramName: 'routingPattern',
    paramPlaceholder: 'e.g., user.* or orders.#',
    paramHelp: '* matches one word, # matches zero or more words',
  },
  {
    value: EExchangeType.FANOUT,
    label: 'Fanout',
    description: 'Routes messages to all bound queues (ignores routing key)',
    paramName: null,
    paramPlaceholder: '',
    paramHelp:
      'No routing parameters needed - messages are broadcast to all bound queues',
  },
];

const selectedExchangeType = computed(() => {
  return exchangeTypeOptions.find((option) => option.value === type.value);
});

// Validation
const isFormValid = computed(() => {
  const basicValid =
    name.value.trim() !== '' &&
    ns.value.trim() !== '' &&
    queueName.value.trim() !== '';

  if (!basicValid) return false;

  // For direct exchanges, routing key is required
  if (type.value === EExchangeType.DIRECT) {
    return routingKey.value.trim() !== '';
  }

  // For topic exchanges, routing pattern is required
  if (type.value === EExchangeType.TOPIC) {
    return routingPattern.value.trim() !== '';
  }

  // For fanout exchanges, no additional params needed
  return true;
});

const currentParamValue = computed({
  get: () => {
    if (type.value === EExchangeType.DIRECT) return routingKey.value;
    if (type.value === EExchangeType.TOPIC) return routingPattern.value;
    return '';
  },
  set: (value: string) => {
    if (type.value === EExchangeType.DIRECT) routingKey.value = value;
    if (type.value === EExchangeType.TOPIC) routingPattern.value = value;
  },
});

// Creation Mutation
const createExchangeMutation =
  usePostApiNamespacesNsExchangesExchangeBindingsQueue({
    mutation: {
      onSuccess: () => {
        emit('success');
      },
      onError: (err) => {
        console.error('Failed to create exchange:', err);
        createError.value =
          getErrorMessage(err.error)?.message ?? 'Failed to create exchange';

        // Focus the error section when error occurs
        nextTick(() => {
          errorSectionRef.value?.focus();
        });
      },
    },
  });

const isCreating = computed(() => createExchangeMutation.isPending.value);

function handleSubmit() {
  if (!isFormValid.value || isCreating.value) return;

  // Clear previous errors
  createError.value = '';

  // Build params based on exchange type
  const params: Record<string, string> = {};

  if (type.value === EExchangeType.DIRECT && routingKey.value.trim()) {
    params.routingKey = routingKey.value.trim();
  }

  if (type.value === EExchangeType.TOPIC && routingPattern.value.trim()) {
    params.routingPattern = routingPattern.value.trim();
  }

  createExchangeMutation
    .mutateAsync({
      ns: ns.value.trim(),
      exchange: name.value.trim(),
      queue: queueName.value.trim(),
      params,
    })
    .catch(() => {
      // the error will be handled in createExchangeMutation
    });
}

function handleClose() {
  emit('cancel');
}

// Reset form when modal is hidden
watch(
  () => props.isVisible,
  (newVal) => {
    if (!newVal) {
      name.value = '';
      ns.value = 'default';
      type.value = EExchangeType.DIRECT;
      queueName.value = '';
      routingKey.value = '';
      routingPattern.value = '';
      createError.value = '';
      createExchangeMutation.reset();
    }
  },
);

// Clear routing key/pattern when exchange type changes
watch(
  () => type.value,
  () => {
    routingKey.value = '';
    routingPattern.value = '';
  },
);
</script>

<template>
  <BaseModal
    :is-visible="isVisible"
    title="Create New Exchange"
    subtitle="Configure your message exchange settings"
    icon="bi bi-diagram-3-fill"
    @close="handleClose"
  >
    <template #body>
      <div class="form-content">
        <!-- Information Alert -->
        <div class="alert alert-info mb-4">
          <i class="bi bi-info-circle me-2"></i>
          <strong>Note:</strong> Exchanges are created automatically when you
          bind the first queue to them. You'll create the exchange by binding a
          queue with the appropriate routing parameters.
        </div>

        <form @submit.prevent="handleSubmit">
          <!-- Exchange Details Section -->
          <section class="form-section">
            <div class="section-header">
              <h3 class="section-title">
                <i class="bi bi-info-circle-fill section-icon"></i>
                Exchange Details
              </h3>
              <p class="section-description">
                Define the exchange name, namespace, and type
              </p>
            </div>

            <div class="form-grid">
              <!-- Exchange Name Field -->
              <div class="form-group">
                <label for="exchange-name" class="form-label">
                  <i class="bi bi-diagram-3 label-icon"></i>
                  Exchange Name
                  <span class="required-indicator">*</span>
                </label>
                <input
                  id="exchange-name"
                  v-model="name"
                  v-focus
                  type="text"
                  class="form-control"
                  placeholder="e.g., user-events"
                  required
                  :disabled="isCreating"
                  autocomplete="off"
                  aria-describedby="exchange-name-help"
                  :aria-invalid="!!createError"
                />
                <div id="exchange-name-help" class="field-help">
                  <i class="bi bi-lightbulb help-icon"></i>
                  Use letters, numbers, underscores, and hyphens only
                </div>
              </div>

              <!-- Namespace Field -->
              <div class="form-group">
                <label for="exchange-ns" class="form-label">
                  <i class="bi bi-folder-fill label-icon"></i>
                  Namespace
                  <span class="required-indicator">*</span>
                </label>
                <input
                  id="exchange-ns"
                  v-model="ns"
                  type="text"
                  class="form-control"
                  placeholder="e.g., default"
                  required
                  :disabled="isCreating"
                  autocomplete="off"
                  aria-describedby="exchange-ns-help"
                  :aria-invalid="!!createError"
                />
                <div id="exchange-ns-help" class="field-help">
                  <i class="bi bi-lightbulb help-icon"></i>
                  Organize exchanges by environment or application
                </div>
              </div>

              <!-- Exchange Type Field -->
              <div class="form-group">
                <label for="exchange-type" class="form-label">
                  <i class="bi bi-gear-fill label-icon"></i>
                  Exchange Type
                  <span class="required-indicator">*</span>
                </label>
                <select
                  id="exchange-type"
                  v-model="type"
                  class="form-select"
                  :disabled="isCreating"
                  aria-describedby="exchange-type-help"
                  :aria-invalid="!!createError"
                >
                  <option
                    v-for="option in exchangeTypeOptions"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
                <div id="exchange-type-help" class="field-help">
                  <div v-if="selectedExchangeType" class="help-content">
                    <span class="help-text">
                      <strong>{{ selectedExchangeType.label }}:</strong>
                      {{ selectedExchangeType.description }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Queue Binding Section -->
          <section class="form-section">
            <div class="section-header">
              <h3 class="section-title">
                <i class="bi bi-link-45deg section-icon"></i>
                Queue Binding
              </h3>
              <p class="section-description">
                Bind a queue to create the exchange with its first binding
              </p>
            </div>

            <div class="form-grid">
              <!-- Queue Name Field -->
              <div class="form-group">
                <label for="queue-name" class="form-label">
                  <i class="bi bi-list-ul label-icon"></i>
                  Queue Name
                  <span class="required-indicator">*</span>
                </label>
                <input
                  id="queue-name"
                  v-model="queueName"
                  type="text"
                  class="form-control"
                  placeholder="e.g., user-notifications"
                  required
                  :disabled="isCreating"
                  autocomplete="off"
                  aria-describedby="queue-name-help"
                  :aria-invalid="!!createError"
                />
                <div id="queue-name-help" class="field-help">
                  <i class="bi bi-lightbulb help-icon"></i>
                  The first queue to bind to this exchange
                </div>
              </div>

              <!-- Dynamic Parameter Field (based on exchange type) -->
              <div v-if="selectedExchangeType?.paramName" class="form-group">
                <label :for="selectedExchangeType.paramName" class="form-label">
                  <i
                    :class="{
                      'bi bi-key-fill': type === EExchangeType.DIRECT,
                      'bi bi-asterisk': type === EExchangeType.TOPIC,
                    }"
                    class="label-icon"
                  ></i>
                  {{
                    type === EExchangeType.DIRECT
                      ? 'Routing Key'
                      : 'Routing Pattern'
                  }}
                  <span class="required-indicator">*</span>
                </label>
                <input
                  :id="selectedExchangeType.paramName"
                  v-model="currentParamValue"
                  type="text"
                  class="form-control"
                  :placeholder="selectedExchangeType.paramPlaceholder"
                  required
                  :disabled="isCreating"
                  autocomplete="off"
                  :aria-describedby="`${selectedExchangeType.paramName}-help`"
                  :aria-invalid="!!createError"
                />
                <div
                  :id="`${selectedExchangeType.paramName}-help`"
                  class="field-help"
                >
                  <i class="bi bi-lightbulb help-icon"></i>
                  {{ selectedExchangeType.paramHelp }}
                </div>

                <!-- Additional help for topic patterns -->
                <div v-if="type === EExchangeType.TOPIC" class="help-examples">
                  <div class="example-item">
                    <code>user.*</code> matches <code>user.create</code>,
                    <code>user.update</code>
                  </div>
                  <div class="example-item">
                    <code>orders.#</code> matches <code>orders</code>,
                    <code>orders.europe</code>,
                    <code>orders.europe.pending</code>
                  </div>
                </div>
              </div>

              <!-- Fanout info message -->
              <div v-if="type === EExchangeType.FANOUT" class="info-message">
                <i class="bi bi-info-circle-fill me-2"></i>
                Fanout exchanges don't use routing keys - messages are broadcast
                to all bound queues.
              </div>
            </div>
          </section>

          <!-- Error Display - with focus management -->
          <div
            v-if="createError"
            ref="errorSectionRef"
            class="error-section"
            role="alert"
            tabindex="-1"
            aria-live="assertive"
          >
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
        </form>
      </div>
    </template>

    <template #footer>
      <button
        type="button"
        class="btn btn-secondary"
        :disabled="isCreating"
        @click="handleClose"
      >
        <i class="bi bi-x-circle me-2"></i>
        Cancel
      </button>
      <button
        type="button"
        class="btn btn-primary"
        :disabled="!isFormValid || isCreating"
        @click="handleSubmit"
      >
        <template v-if="isCreating">
          <span class="spinner-border spinner-border-sm me-2"></span>
          Creating...
        </template>
        <template v-else>
          <i class="bi bi-check-circle me-2"></i>
          Create Exchange
        </template>
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
.form-content {
  padding: 1.25rem 1.5rem;
  max-height: 70vh;
  overflow-y: auto;
}

/* Alert */
.alert {
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 1px solid;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.85rem;
  line-height: 1.5;
}

.alert-info {
  background-color: #e7f3ff;
  border-color: #b8daff;
  color: #004085;
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

.form-control::placeholder {
  color: #9ca3af;
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

.help-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.help-text {
  line-height: 1.4;
}

/* Help Examples */
.help-examples {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 0.75rem;
  color: #495057;
}

.example-item {
  margin-bottom: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.example-item code {
  background: #e9ecef;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  color: #0d6efd;
}

/* Info Message */
.info-message {
  padding: 0.75rem;
  background: #fff3cd;
  border: 1px solid #ffe69c;
  border-radius: 6px;
  color: #664d03;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
}

/* Error Section - with focus styles */
.error-section {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
  transition: box-shadow 0.2s ease;
}

.error-section:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.25);
  border-color: #dc2626;
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

/* Buttons */
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

.me-2 {
  margin-right: 0.5rem;
}

.mb-4 {
  margin-bottom: 1.5rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .form-content {
    padding: 1rem;
    max-height: 60vh;
  }

  .example-item {
    flex-direction: column;
    align-items: flex-start;
  }
}

/* Focus states for accessibility */
.btn:focus,
.form-control:focus,
.form-select:focus {
  outline: 2px solid #0d6efd;
  outline-offset: 2px;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .btn,
  .form-control,
  .form-select,
  .error-section {
    transition: none;
  }

  .btn:hover {
    transform: none;
  }
}
</style>

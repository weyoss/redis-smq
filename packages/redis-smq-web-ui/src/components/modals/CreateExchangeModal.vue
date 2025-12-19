<!--
  - Copyright (c)
  - Weyoss <weyoss@outlook.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { EExchangeType } from '@/types/exchanges';
import { getErrorMessage } from '@/lib/error';
import BaseModal from '@/components/modals/BaseModal.vue';

// Custom focus directive
const vFocus = {
  mounted: (el: HTMLElement) => el.focus(),
};

const props = defineProps<{
  isVisible: boolean;
  isLoading: boolean;
  error: ReturnType<typeof getErrorMessage>;
}>();

const emit = defineEmits<{
  (e: 'cancel'): void;
  (
    e: 'confirm',
    payload: {
      name: string;
      ns: string;
      type: EExchangeType;
      queueName: string;
      routingKey?: string;
      bindingPattern?: string;
    },
  ): void;
}>();

const name = ref('');
const ns = ref('default');
const type = ref<EExchangeType>(EExchangeType.DIRECT);
const queueName = ref('');
const routingKey = ref('');
const bindingPattern = ref('');

// Exchange type options with proper integer values and display names
const exchangeTypeOptions = [
  {
    value: EExchangeType.DIRECT,
    label: 'Direct',
    description: 'Routes messages to queues based on exact routing key match',
  },
  {
    value: EExchangeType.FANOUT,
    label: 'Fanout',
    description: 'Routes messages to all bound queues (ignores routing key)',
  },
  {
    value: EExchangeType.TOPIC,
    label: 'Topic',
    description: 'Routes messages based on wildcard pattern matching (* and #)',
  },
];

const selectedExchangeType = computed(() => {
  return exchangeTypeOptions.find((option) => option.value === type.value);
});

const isFormValid = computed(() => {
  const basicValid =
    name.value.trim() !== '' &&
    ns.value.trim() !== '' &&
    queueName.value.trim() !== '';

  // For direct exchanges, routing key is required
  if (type.value === EExchangeType.DIRECT) {
    return basicValid && routingKey.value.trim() !== '';
  }

  // For topic exchanges, binding pattern is required
  if (type.value === EExchangeType.TOPIC) {
    return basicValid && bindingPattern.value.trim() !== '';
  }

  return basicValid;
});

const showRoutingKeyField = computed(() => {
  return type.value === EExchangeType.DIRECT;
});

const showBindingPatternField = computed(() => {
  return type.value === EExchangeType.TOPIC;
});

const errorMessage = computed(() => {
  return props.error ? getErrorMessage(props.error) : null;
});

function handleSubmit() {
  if (isFormValid.value && !props.isLoading) {
    const payload: {
      name: string;
      ns: string;
      type: EExchangeType;
      queueName: string;
      routingKey?: string;
      bindingPattern?: string;
    } = {
      name: name.value.trim(),
      ns: ns.value.trim(),
      type: type.value,
      queueName: queueName.value.trim(),
    };

    // Add routing key for direct exchanges
    if (type.value === EExchangeType.DIRECT && routingKey.value.trim()) {
      payload.routingKey = routingKey.value.trim();
    }

    // Add binding pattern for topic exchanges
    if (type.value === EExchangeType.TOPIC && bindingPattern.value.trim()) {
      payload.bindingPattern = bindingPattern.value.trim();
    }

    emit('confirm', payload);
  }
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
      bindingPattern.value = '';
    }
  },
);

// Clear routing key/binding pattern when exchange type changes
watch(
  () => type.value,
  () => {
    routingKey.value = '';
    bindingPattern.value = '';
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
          <strong>Note:</strong> Exchanges are created by binding the first
          queue to them. You'll need to specify both the exchange details and
          the initial queue binding.
        </div>

        <form @submit.prevent="handleSubmit">
          <!-- Basic Information Section -->
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
                  :disabled="isLoading"
                  autocomplete="off"
                  aria-describedby="exchange-name-help"
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
                  :disabled="isLoading"
                  autocomplete="off"
                  aria-describedby="exchange-ns-help"
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
                  :disabled="isLoading"
                  aria-describedby="exchange-type-help"
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
                  <div v-if="selectedExchangeType" class="help-options">
                    <div class="help-option">
                      <strong>{{ selectedExchangeType.label }}:</strong>
                      {{ selectedExchangeType.description }}
                    </div>
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
                Initial Queue Binding
              </h3>
              <p class="section-description">
                Exchanges are created by binding the first queue to them
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
                  :disabled="isLoading"
                  autocomplete="off"
                  aria-describedby="queue-name-help"
                />
                <div id="queue-name-help" class="field-help">
                  <i class="bi bi-lightbulb help-icon"></i>
                  The first queue to bind to this exchange
                </div>
              </div>

              <!-- Routing Key Field (Direct Exchange) -->
              <div v-if="showRoutingKeyField" class="form-group">
                <label for="routing-key" class="form-label">
                  <i class="bi bi-key-fill label-icon"></i>
                  Routing Key
                  <span class="required-indicator">*</span>
                </label>
                <input
                  id="routing-key"
                  v-model="routingKey"
                  type="text"
                  class="form-control"
                  placeholder="e.g., user.created"
                  required
                  :disabled="isLoading"
                  autocomplete="off"
                  aria-describedby="routing-key-help"
                />
                <div id="routing-key-help" class="field-help">
                  <i class="bi bi-lightbulb help-icon"></i>
                  Messages with this exact routing key will be routed to the
                  queue
                </div>
              </div>

              <!-- Binding Pattern Field (Topic Exchange) -->
              <div v-if="showBindingPatternField" class="form-group">
                <label for="binding-pattern" class="form-label">
                  <i class="bi bi-asterisk label-icon"></i>
                  Binding Pattern
                  <span class="required-indicator">*</span>
                </label>
                <input
                  id="binding-pattern"
                  v-model="bindingPattern"
                  type="text"
                  class="form-control"
                  placeholder="e.g., user.* or user.#"
                  required
                  :disabled="isLoading"
                  autocomplete="off"
                  aria-describedby="binding-pattern-help"
                />
                <div id="binding-pattern-help" class="field-help">
                  <div class="help-options">
                    <div class="help-option">
                      <strong>*</strong> matches exactly one word
                    </div>
                    <div class="help-option">
                      <strong>#</strong> matches zero or more words
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Error Display -->
          <div v-if="errorMessage" class="error-section">
            <div class="error-content">
              <div class="error-icon">
                <i class="bi bi-exclamation-triangle-fill"></i>
              </div>
              <div class="error-text">
                <h4 class="error-title">Creation Failed</h4>
                <p class="error-message">{{ errorMessage }}</p>
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
        :disabled="isLoading"
        @click="handleClose"
      >
        <i class="bi bi-x-circle me-2"></i>
        Cancel
      </button>
      <button
        type="button"
        class="btn btn-primary"
        :disabled="!isFormValid || isLoading"
        @click="handleSubmit"
      >
        <template v-if="isLoading">
          <span class="spinner-border spinner-border-sm me-2"></span>
          Creating Exchange...
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
/* Form Content - Added proper padding to match CreateQueueModal */
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
  .form-select {
    transition: none;
  }

  .btn:hover {
    transform: none;
  }
}
</style>

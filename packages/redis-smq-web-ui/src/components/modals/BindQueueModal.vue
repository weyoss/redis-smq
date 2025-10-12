<!--
  - Copyright (c)
  - Weyoss <weyoss@protonmail.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import BaseModal from './BaseModal.vue';
import type { getErrorMessage } from '@/lib/error.ts';

interface Props {
  isVisible: boolean;
  isLoading?: boolean;
  error?: ReturnType<typeof getErrorMessage>;
  exchangeType: 'direct' | 'fanout' | 'topic';
  exchangeName: string;
  namespace: string;
}

interface EmitPayload {
  queueName: string;
  routingKey?: string;
  bindingPattern?: string;
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  error: null,
});

const emit = defineEmits<{
  (e: 'confirm', payload: EmitPayload): void;
  (e: 'cancel'): void;
}>();

// Form state
const queueName = ref('');
const routingKey = ref('');
const bindingPattern = ref('');

// Form validation
const queueNameError = ref('');
const routingKeyError = ref('');
const bindingPatternError = ref('');

// Form refs for focus management
const queueNameInput = ref<HTMLInputElement | null>(null);

// Computed properties
const modalTitle = computed(() => {
  const typeLabel =
    props.exchangeType.charAt(0).toUpperCase() + props.exchangeType.slice(1);
  return `Bind Queue to ${typeLabel} Exchange`;
});

const modalSubtitle = computed(() => {
  return `${props.exchangeName} • ${props.namespace}`;
});

const modalDescription = computed(() => {
  switch (props.exchangeType) {
    case 'direct':
      return 'Bind a queue to this direct exchange with a specific routing key. Messages will be routed to the queue only when the routing key matches exactly.';
    case 'fanout':
      return 'Bind a queue to this fanout exchange. All messages published to this exchange will be delivered to the bound queue.';
    case 'topic':
      return 'Bind a queue to this topic exchange with a binding pattern. Messages will be routed based on pattern matching with routing keys.';
    default:
      return 'Bind a queue to this exchange.';
  }
});

const needsRoutingKey = computed(() => props.exchangeType === 'direct');
const needsBindingPattern = computed(() => props.exchangeType === 'topic');

const isFormValid = computed(() => {
  const hasQueueName = queueName.value.trim().length > 0;
  const hasRoutingKey =
    !needsRoutingKey.value || routingKey.value.trim().length > 0;
  const hasBindingPattern =
    !needsBindingPattern.value || bindingPattern.value.trim().length > 0;

  return (
    hasQueueName &&
    hasRoutingKey &&
    hasBindingPattern &&
    !queueNameError.value &&
    !routingKeyError.value &&
    !bindingPatternError.value
  );
});

// Validation functions
const validateQueueName = () => {
  const value = queueName.value.trim();
  if (!value) {
    queueNameError.value = 'Queue name is required';
    return false;
  }
  if (value.length < 1 || value.length > 255) {
    queueNameError.value = 'Queue name must be between 1 and 255 characters';
    return false;
  }
  if (!/^[a-zA-Z0-9._-]+$/.test(value)) {
    queueNameError.value =
      'Queue name can only contain letters, numbers, dots, underscores, and hyphens';
    return false;
  }
  queueNameError.value = '';
  return true;
};

const validateRoutingKey = () => {
  if (!needsRoutingKey.value) {
    routingKeyError.value = '';
    return true;
  }

  const value = routingKey.value.trim();
  if (!value) {
    routingKeyError.value = 'Routing key is required for direct exchanges';
    return false;
  }
  if (value.length > 255) {
    routingKeyError.value = 'Routing key must not exceed 255 characters';
    return false;
  }
  routingKeyError.value = '';
  return true;
};

const validateBindingPattern = () => {
  if (!needsBindingPattern.value) {
    bindingPatternError.value = '';
    return true;
  }

  const value = bindingPattern.value.trim();
  if (!value) {
    bindingPatternError.value =
      'Binding pattern is required for topic exchanges';
    return false;
  }
  if (value.length > 255) {
    bindingPatternError.value =
      'Binding pattern must not exceed 255 characters';
    return false;
  }
  bindingPatternError.value = '';
  return true;
};

const validateForm = () => {
  const isQueueNameValid = validateQueueName();
  const isRoutingKeyValid = validateRoutingKey();
  const isBindingPatternValid = validateBindingPattern();

  return isQueueNameValid && isRoutingKeyValid && isBindingPatternValid;
};

// Event handlers
const handleConfirm = () => {
  if (!validateForm() || props.isLoading) return;

  const payload: EmitPayload = {
    queueName: queueName.value.trim(),
  };

  if (needsRoutingKey.value) {
    payload.routingKey = routingKey.value.trim();
  }

  if (needsBindingPattern.value) {
    payload.bindingPattern = bindingPattern.value.trim();
  }

  emit('confirm', payload);
};

const handleCancel = () => {
  if (props.isLoading) return;
  emit('cancel');
};

// Reset form when modal opens/closes
const resetForm = () => {
  queueName.value = '';
  routingKey.value = '';
  bindingPattern.value = '';
  queueNameError.value = '';
  routingKeyError.value = '';
  bindingPatternError.value = '';
};

// Watch for modal visibility changes
watch(
  () => props.isVisible,
  async (isVisible) => {
    if (isVisible) {
      resetForm();
      await nextTick();
      queueNameInput.value?.focus();
    }
  },
);

// Watch for error changes to clear form errors
watch(
  () => props.error,
  (newError) => {
    if (!newError) {
      // Clear form errors when external error is cleared
      queueNameError.value = '';
      routingKeyError.value = '';
      bindingPatternError.value = '';
    }
  },
);
</script>

<template>
  <BaseModal
    :is-visible="isVisible"
    :title="modalTitle"
    :subtitle="modalSubtitle"
    icon="bi bi-link-45deg"
    size="md"
    @close="handleCancel"
  >
    <template #body>
      <div class="bind-queue-content">
        <p class="modal-description" aria-live="polite">
          {{ modalDescription }}
        </p>

        <!-- Error Alert -->
        <div v-if="error" class="error-alert" role="alert">
          <i class="bi bi-exclamation-triangle-fill" aria-hidden="true"></i>
          <span class="error-text">{{ error }}</span>
        </div>

        <form class="bind-form" @submit.prevent="handleConfirm">
          <!-- Queue Name Field -->
          <div class="form-group">
            <label for="queueName" class="form-label">
              Queue Name <span class="required">*</span>
            </label>
            <input
              id="queueName"
              ref="queueNameInput"
              v-model="queueName"
              type="text"
              class="form-input"
              :class="{ error: !!queueNameError }"
              placeholder="Enter queue name"
              :disabled="isLoading"
              :aria-invalid="!!queueNameError"
              aria-describedby="queueName-hint queueName-error"
              inputmode="text"
              autocomplete="off"
              autocapitalize="off"
              autocorrect="off"
              spellcheck="false"
              maxlength="255"
              pattern="[A-Za-z0-9._-]+"
              @blur="validateQueueName"
              @input="queueNameError = ''"
            />
            <div
              v-if="queueNameError"
              id="queueName-error"
              class="field-error"
              role="alert"
            >
              {{ queueNameError }}
            </div>
            <div id="queueName-hint" class="field-hint">
              Queue name can contain letters, numbers, dots, underscores, and
              hyphens
            </div>
          </div>

          <!-- Routing Key Field (Direct Exchange) -->
          <div v-if="needsRoutingKey" class="form-group">
            <label for="routingKey" class="form-label">
              Routing Key <span class="required">*</span>
            </label>
            <input
              id="routingKey"
              v-model="routingKey"
              type="text"
              class="form-input"
              :class="{ error: !!routingKeyError }"
              placeholder="Enter routing key"
              :disabled="isLoading"
              :aria-invalid="!!routingKeyError"
              aria-describedby="routingKey-hint routingKey-error"
              inputmode="text"
              autocomplete="off"
              autocapitalize="off"
              autocorrect="off"
              spellcheck="false"
              maxlength="255"
              @blur="validateRoutingKey"
              @input="routingKeyError = ''"
            />
            <div
              v-if="routingKeyError"
              id="routingKey-error"
              class="field-error"
              role="alert"
            >
              {{ routingKeyError }}
            </div>
            <div id="routingKey-hint" class="field-hint">
              Messages will be routed to this queue only when the routing key
              matches exactly
            </div>
          </div>

          <!-- Binding Pattern Field (Topic Exchange) -->
          <div v-if="needsBindingPattern" class="form-group">
            <label for="bindingPattern" class="form-label">
              Binding Pattern <span class="required">*</span>
            </label>
            <input
              id="bindingPattern"
              v-model="bindingPattern"
              type="text"
              class="form-input"
              :class="{ error: !!bindingPatternError }"
              placeholder="Enter binding pattern (e.g., user.*.created)"
              :disabled="isLoading"
              :aria-invalid="!!bindingPatternError"
              aria-describedby="bindingPattern-hint bindingPattern-error"
              inputmode="text"
              autocomplete="off"
              autocapitalize="off"
              autocorrect="off"
              spellcheck="false"
              maxlength="255"
              @blur="validateBindingPattern"
              @input="bindingPatternError = ''"
            />
            <div
              v-if="bindingPatternError"
              id="bindingPattern-error"
              class="field-error"
              role="alert"
            >
              {{ bindingPatternError }}
            </div>
            <div id="bindingPattern-hint" class="field-hint">
              Use * to match one word, # to match zero or more words (e.g.,
              user.*.created, logs.#)
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
        @click="handleCancel"
      >
        Cancel
      </button>
      <button
        type="submit"
        class="btn btn-primary"
        :disabled="!isFormValid || isLoading"
        @click="handleConfirm"
      >
        <span
          v-if="isLoading"
          class="loading-spinner"
          aria-hidden="true"
        ></span>
        <i v-else class="bi bi-link-45deg" aria-hidden="true"></i>
        {{ isLoading ? 'Binding...' : 'Bind Queue' }}
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
/* Container: responsive spacing, guard against horizontal overflow */
.bind-queue-content {
  --content-padding: clamp(12px, 2.8vw, 24px);
  padding: var(--content-padding);
  display: flex;
  flex-direction: column;
  gap: clamp(12px, 2.2vw, 24px);
  overflow-x: hidden;
}

/* Ensure inner content never bleeds horizontally */
.bind-queue-content,
.bind-queue-content * {
  max-width: 100%;
  box-sizing: border-box;
}

/* Modal Description */
.modal-description {
  color: #6c757d;
  font-size: 0.95rem;
  line-height: 1.5;
  margin: 0;
  padding: clamp(10px, 2.2vw, 16px);
  background: #e7f3ff;
  border-left: 4px solid #0d6efd;
  border-radius: 6px;
  overflow-wrap: anywhere;
  word-break: break-word;
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
}

.error-alert i {
  font-size: 1rem;
  flex-shrink: 0;
  line-height: 1;
}

.error-text {
  overflow-wrap: anywhere;
  word-break: break-word;
}

/* Form Styles */
.bind-form {
  display: grid;
  gap: clamp(12px, 2vw, 16px);
}

.form-group {
  display: grid;
  gap: 0.5rem;
  min-width: 0; /* allow children to shrink */
}

.form-label {
  font-weight: 600;
  color: #212529;
  font-size: 0.9rem;
  margin: 0;
  overflow-wrap: anywhere;
}

.required {
  color: #dc3545;
}

.form-input {
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 8px;
  font-size: 0.95rem;
  transition:
    box-shadow 0.2s ease,
    border-color 0.2s ease;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  width: 100%;
}

.form-input:focus {
  outline: none;
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
}

.form-input.error {
  border-color: #dc3545;
}

.form-input.error:focus {
  border-color: #dc3545;
  box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
}

.form-input:disabled {
  background-color: #e9ecef;
  opacity: 1;
  cursor: not-allowed;
}

.field-error {
  color: #dc3545;
  font-size: 0.82rem;
  font-weight: 600;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.field-hint {
  color: #6c757d;
  font-size: 0.82rem;
  line-height: 1.4;
  overflow-wrap: anywhere;
  word-break: break-word;
}

/* Button Styles (footer buttons come from BaseModal footer layout) */
.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    background 0.2s ease,
    border-color 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
  min-width: 120px;
  border: 1px solid transparent;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

.btn-secondary {
  background: #6c757d;
  color: white;
  border-color: #6c757d;
}

.btn-secondary:hover:not(:disabled) {
  background: #5c636a;
  border-color: #5c636a;
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
}

/* Loading Spinner */
.loading-spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Responsive Design */
@media (max-width: 576px) {
  .bind-queue-content {
    gap: 1rem;
    padding: clamp(10px, 3.5vw, 16px);
    padding-bottom: calc(
      clamp(10px, 3.5vw, 16px) + env(safe-area-inset-bottom)
    );
  }

  .modal-description {
    padding: 0.75rem;
    font-size: 0.9rem;
  }

  .form-input {
    padding: 0.65rem 0.75rem;
    font-size: 0.9rem;
  }

  /* Make actions full width in BaseModal footer when stacked on mobile */
  :global(.modal-footer) {
    align-items: stretch;
  }
  .btn {
    padding: 0.65rem 1rem;
    font-size: 0.9rem;
    min-width: 0;
    width: 100%;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .btn:hover {
    transform: none;
  }
}
</style>

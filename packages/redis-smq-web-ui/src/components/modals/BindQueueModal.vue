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
import { useQueryClient } from '@tanstack/vue-query';
import BaseModal from './BaseModal.vue';
import { getErrorMessage } from '@/lib/error.ts';
import { usePostApiNamespacesNsExchangesExchangeBindingsQueue } from '@/api/generated/namespace-exchanges/namespace-exchanges';
import {
  getGetApiNamespacesNsExchangesExchangeRoutingKeysQueryKey,
  getGetApiNamespacesNsExchangesExchangeRoutingPatternsQueryKey,
  getGetApiNamespacesNsExchangesExchangeBindingsQueryKey,
} from '@/api/generated/namespace-exchanges/namespace-exchanges';
import { type TExchangeType } from '@/types';

interface Props {
  isVisible: boolean;
  exchangeType: TExchangeType;
  exchangeName: string;
  namespace: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'success'): void;
}>();

// Custom focus directive
const vFocus = {
  mounted: (el: HTMLElement) => el.focus(),
};

const queryClient = useQueryClient();

// Form state
const queueName = ref('');
const routingKey = ref('');
const bindingPattern = ref('');

// Form validation errors
const queueNameError = ref('');
const routingKeyError = ref('');
const bindingPatternError = ref('');

// Form refs for focus management
const queueNameInput = ref<HTMLInputElement | null>(null);
const errorSectionRef = ref<HTMLElement | null>(null);

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

// Bind queue mutation
const bindQueueMutation = usePostApiNamespacesNsExchangesExchangeBindingsQueue({
  mutation: {
    onSuccess: () => {
      // Invalidate all relevant queries
      if (props.exchangeType === 'direct') {
        queryClient.invalidateQueries({
          queryKey: getGetApiNamespacesNsExchangesExchangeRoutingKeysQueryKey(
            props.namespace,
            props.exchangeName,
          ),
        });
      } else if (props.exchangeType === 'topic') {
        queryClient.invalidateQueries({
          queryKey:
            getGetApiNamespacesNsExchangesExchangeRoutingPatternsQueryKey(
              props.namespace,
              props.exchangeName,
            ),
        });
      }

      queryClient.invalidateQueries({
        queryKey: getGetApiNamespacesNsExchangesExchangeBindingsQueryKey(
          props.namespace,
          props.exchangeName,
        ),
      });

      // Emit success and close
      emit('success');
      resetForm();
    },
    onError: (error) => {
      console.error('Failed to bind queue:', error);
      // Focus the error section
      nextTick(() => {
        errorSectionRef.value?.focus();
      });
    },
  },
});

const isLoading = computed(() => bindQueueMutation.isPending.value);
const error = computed(() =>
  getErrorMessage(bindQueueMutation.error.value?.error),
);

// Form validation
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
  if (!validateForm() || isLoading.value) return;

  const params: Record<string, string> = {};

  if (needsRoutingKey.value) {
    params.routingKey = routingKey.value.trim();
  }

  if (needsBindingPattern.value) {
    params.routingPattern = bindingPattern.value.trim();
  }

  bindQueueMutation.mutateAsync({
    ns: props.namespace,
    exchange: props.exchangeName,
    queue: queueName.value.trim(),
    params,
  });
};

const handleClose = () => {
  if (isLoading.value) return;
  bindQueueMutation.reset();
  resetForm();
  emit('close');
};

// Reset form
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
      bindQueueMutation.reset();
      await nextTick();
      queueNameInput.value?.focus();
    }
  },
);

// Clear routing key/pattern when exchange type changes
watch(
  () => props.exchangeType,
  () => {
    routingKey.value = '';
    bindingPattern.value = '';
    routingKeyError.value = '';
    bindingPatternError.value = '';
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
    @close="handleClose"
  >
    <template #body>
      <div class="bind-queue-content">
        <p class="modal-description" aria-live="polite">
          {{ modalDescription }}
        </p>

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
              v-focus
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
              placeholder="Enter routing key (e.g., user.created)"
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
              <p>Use * to match one word, # to match zero or more words</p>
              <div class="pattern-examples">
                <code>user.*</code> matches <code>user.create</code>,
                <code>user.update</code>
                <br />
                <code>orders.#</code> matches <code>orders</code>,
                <code>orders.europe</code>, <code>orders.europe.pending</code>
              </div>
            </div>
          </div>

          <!-- Fanout Info (no params needed) -->
          <div v-if="exchangeType === 'fanout'" class="info-message">
            <i class="bi bi-info-circle-fill" aria-hidden="true"></i>
            <span>
              Fanout exchanges broadcast all messages to every bound queue. No
              routing key or pattern is needed.
            </span>
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

.pattern-examples {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.8rem;
}

.pattern-examples code {
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
  border-radius: 8px;
  color: #664d03;
  font-size: 0.9rem;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.info-message i {
  color: #d97706;
  font-size: 1rem;
  flex-shrink: 0;
  margin-top: 0.1rem;
}

/* Button Styles */
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

  .btn {
    padding: 0.65rem 1rem;
    font-size: 0.9rem;
    min-width: 0;
    width: 100%;
  }

  .pattern-examples {
    font-size: 0.75rem;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .btn:hover,
  .loading-spinner {
    animation: none;
    transform: none;
  }
}
</style>

<!--
  - Copyright (c)
  - Weyoss <weyoss@outlook.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { computed } from 'vue';
import BaseModal from './BaseModal.vue';
import type { getErrorMessage } from '@/lib/error.ts';

interface Props {
  isVisible: boolean;
  isLoading?: boolean;
  error?: ReturnType<typeof getErrorMessage>;
  queueName: string;
  routingKey?: string;
  bindingPattern?: string;
  exchangeType: 'direct' | 'fanout' | 'topic';
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  error: null,
  routingKey: '',
  bindingPattern: '',
});

const emit = defineEmits<{
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();

// Computed properties
const modalTitle = computed(() => {
  const typeLabel =
    props.exchangeType.charAt(0).toUpperCase() + props.exchangeType.slice(1);
  return `Unbind Queue from ${typeLabel} Exchange`;
});

const modalSubtitle = computed(() => {
  return `${props.queueName}`;
});

const bindingKey = computed(() => {
  switch (props.exchangeType) {
    case 'direct':
      return props.routingKey;
    case 'topic':
      return props.bindingPattern;
    case 'fanout':
      return null; // Fanout exchanges don't use routing keys
    default:
      return null;
  }
});

const bindingKeyLabel = computed(() => {
  switch (props.exchangeType) {
    case 'direct':
      return 'Routing Key';
    case 'topic':
      return 'Binding Pattern';
    default:
      return null;
  }
});

const confirmationMessage = computed(() => {
  const baseMessage = `Are you sure you want to unbind the queue "${props.queueName}"`;

  if (bindingKey.value) {
    return `${baseMessage} with ${bindingKeyLabel.value?.toLowerCase()} "${bindingKey.value}"?`;
  }

  return `${baseMessage}?`;
});

const warningMessage = computed(() => {
  switch (props.exchangeType) {
    case 'direct':
      return 'Messages with this routing key will no longer be delivered to this queue.';
    case 'fanout':
      return 'This queue will no longer receive messages published to this exchange.';
    case 'topic':
      return 'Messages matching this binding pattern will no longer be delivered to this queue.';
    default:
      return 'This queue will no longer receive messages from this exchange.';
  }
});

// Event handlers
const handleConfirm = () => {
  if (props.isLoading) return;
  emit('confirm');
};

const handleCancel = () => {
  if (props.isLoading) return;
  emit('cancel');
};
</script>

<template>
  <BaseModal
    :is-visible="isVisible"
    :title="modalTitle"
    :subtitle="modalSubtitle"
    icon="bi bi-unlink"
    size="sm"
    @close="handleCancel"
  >
    <template #body>
      <div class="unbind-queue-content">
        <!-- Error Alert -->
        <div v-if="error" class="error-alert" role="alert">
          <i class="bi bi-exclamation-triangle-fill" aria-hidden="true"></i>
          <span>{{ error }}</span>
        </div>

        <!-- Confirmation Message -->
        <div class="confirmation-section">
          <div class="confirmation-icon">
            <i class="bi bi-question-circle-fill" aria-hidden="true"></i>
          </div>
          <div class="confirmation-content">
            <p class="confirmation-message">{{ confirmationMessage }}</p>
            <p class="warning-message">{{ warningMessage }}</p>
          </div>
        </div>

        <!-- Binding Details -->
        <div class="binding-details">
          <div class="detail-item">
            <span class="detail-label">Queue:</span>
            <span class="detail-value queue-name">{{ queueName }}</span>
          </div>

          <div class="detail-item">
            <span class="detail-label">Exchange Type:</span>
            <span class="detail-value exchange-type">{{ exchangeType }}</span>
          </div>

          <div v-if="bindingKey && bindingKeyLabel" class="detail-item">
            <span class="detail-label">{{ bindingKeyLabel }}:</span>
            <span class="detail-value binding-key">{{ bindingKey }}</span>
          </div>
        </div>
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
        type="button"
        class="btn btn-danger"
        :disabled="isLoading"
        @click="handleConfirm"
      >
        <span
          v-if="isLoading"
          class="loading-spinner"
          aria-hidden="true"
        ></span>
        <i v-else class="bi bi-unlink" aria-hidden="true"></i>
        {{ isLoading ? 'Unbinding...' : 'Unbind Queue' }}
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
.unbind-queue-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Error Alert */
.error-alert {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  border-radius: 6px;
  font-size: 0.875rem;
}

.error-alert i {
  font-size: 1rem;
  flex-shrink: 0;
}

/* Confirmation Section */
.confirmation-section {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.confirmation-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  background: #fff3cd;
  color: #856404;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.confirmation-content {
  flex: 1;
}

.confirmation-message {
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
  font-weight: 500;
  color: #212529;
  line-height: 1.4;
}

.warning-message {
  margin: 0;
  font-size: 0.875rem;
  color: #856404;
  background: #fff3cd;
  padding: 0.75rem;
  border-radius: 4px;
  border-left: 4px solid #ffc107;
}

/* Binding Details */
.binding-details {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.detail-label {
  font-weight: 600;
  color: #495057;
  min-width: 100px;
  font-size: 0.875rem;
}

.detail-value {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  color: #212529;
  background: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  border: 1px solid #dee2e6;
  font-size: 0.875rem;
  flex: 1;
}

.queue-name {
  color: #0c5460;
  font-weight: 500;
}

.exchange-type {
  text-transform: capitalize;
  color: #0d6efd;
  font-weight: 500;
}

.binding-key {
  color: #856404;
  font-weight: 500;
}

/* Button Styles */
.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
  min-width: 120px;
  border: none;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn:focus-visible {
  outline: 2px solid;
  outline-offset: 2px;
}

.btn-secondary {
  background: #6c757d;
  color: white;
  border: 1px solid #6c757d;
}

.btn-secondary:hover:not(:disabled) {
  background: #5c636a;
  border-color: #5c636a;
}

.btn-secondary:focus-visible {
  outline-color: #6c757d;
}

.btn-danger {
  background: #dc3545;
  color: white;
  border: 1px solid #dc3545;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
  border-color: #bd2130;
}

.btn-danger:focus-visible {
  outline-color: #dc3545;
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
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Responsive Design */
@media (max-width: 576px) {
  .unbind-queue-content {
    padding: 1rem;
    gap: 1rem;
  }

  .confirmation-section {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 0.75rem;
  }

  .confirmation-icon {
    width: 40px;
    height: 40px;
    font-size: 1.25rem;
  }

  .detail-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }

  .detail-label {
    min-width: auto;
  }

  .detail-value {
    width: 100%;
  }

  .btn {
    padding: 0.625rem 1.25rem;
    font-size: 0.8rem;
    min-width: 100px;
  }
}
</style>

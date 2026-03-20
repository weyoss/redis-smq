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
import { useDeleteApiNamespacesNsExchangesExchangeBindingsQueue } from '@/api/generated/namespace-exchanges/namespace-exchanges';
import {
  getGetApiNamespacesNsExchangesExchangeRoutingKeysQueryKey,
  getGetApiNamespacesNsExchangesExchangeRoutingPatternsQueryKey,
  getGetApiNamespacesNsExchangesExchangeBindingsQueryKey,
} from '@/api/generated/namespace-exchanges/namespace-exchanges';

interface Props {
  isVisible: boolean;
  queueName: string;
  exchangeName: string;
  namespace: string;
  exchangeType: 'direct' | 'fanout' | 'topic';
  routingKey?: string;
  bindingPattern?: string;
}

const props = withDefaults(defineProps<Props>(), {
  routingKey: '',
  bindingPattern: '',
});

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'success'): void;
}>();

const queryClient = useQueryClient();
const errorSectionRef = ref<HTMLElement | null>(null);

// Unbind queue mutation
const unbindQueueMutation =
  useDeleteApiNamespacesNsExchangesExchangeBindingsQueue({
    mutation: {
      onSuccess: () => {
        // Invalidate all relevant queries based on exchange type
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

        emit('success');
      },
      onError: (error) => {
        console.error('Failed to unbind queue:', error);
        // Focus the error section
        nextTick(() => {
          errorSectionRef.value?.focus();
        });
      },
    },
  });

const isLoading = computed(() => unbindQueueMutation.isPending.value);
const error = computed(() =>
  getErrorMessage(unbindQueueMutation.error.value?.error),
);

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
      return null;
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
const handleConfirm = async () => {
  if (isLoading.value) return;

  const params: Record<string, string> = {};

  if (props.exchangeType === 'direct' && props.routingKey) {
    params.routingKey = props.routingKey;
  } else if (props.exchangeType === 'topic' && props.bindingPattern) {
    params.routingPattern = props.bindingPattern;
  }

  await unbindQueueMutation.mutateAsync({
    ns: props.namespace,
    exchange: props.exchangeName,
    queue: props.queueName,
    params,
  });
};

const handleClose = () => {
  if (isLoading.value) return;
  unbindQueueMutation.reset();
  emit('close');
};

// Watch for visibility changes to reset state
watch(
  () => props.isVisible,
  (isVisible) => {
    if (!isVisible) {
      unbindQueueMutation.reset();
    }
  },
);
</script>

<template>
  <BaseModal
    :is-visible="isVisible"
    :title="modalTitle"
    :subtitle="modalSubtitle"
    icon="bi bi-unlink"
    size="sm"
    @close="handleClose"
  >
    <template #body>
      <div class="unbind-queue-content">
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

        <!-- Confirmation Section -->
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
            <span class="detail-label">Exchange:</span>
            <span class="detail-value exchange-name">{{ exchangeName }}</span>
          </div>

          <div class="detail-item">
            <span class="detail-label">Namespace:</span>
            <span class="detail-value namespace">{{ namespace }}</span>
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

        <!-- Additional warning for fanout exchanges -->
        <div v-if="exchangeType === 'fanout'" class="info-message">
          <i class="bi bi-info-circle-fill" aria-hidden="true"></i>
          <span>
            Fanout exchanges broadcast to all bound queues. After unbinding,
            this queue will no longer receive any messages from this exchange.
          </span>
        </div>
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
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  border-radius: 6px;
  font-size: 0.875rem;
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
  word-break: break-word;
}

.queue-name {
  color: #0c5460;
  font-weight: 500;
}

.exchange-name {
  color: #0d6efd;
  font-weight: 500;
}

.namespace {
  color: #6c757d;
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

/* Info Message */
.info-message {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #e7f3ff;
  border: 1px solid #b8daff;
  border-radius: 6px;
  color: #004085;
  font-size: 0.875rem;
}

.info-message i {
  color: #0d6efd;
  font-size: 1rem;
  flex-shrink: 0;
  margin-top: 0.1rem;
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

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .btn,
  .loading-spinner,
  .error-alert {
    animation: none;
    transition: none;
  }
}
</style>

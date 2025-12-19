<!--
  - Copyright (c)
  - Weyoss <weyoss@outlook.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { ref, computed, watchEffect, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQueryClient } from '@tanstack/vue-query';
import {
  useGetApiV1NamespacesNsExchangesFanoutFanoutQueues,
  usePutApiV1NamespacesNsExchangesFanoutFanoutQueuesQueue,
  useDeleteApiV1NamespacesNsExchangesFanoutFanoutQueuesQueue,
  getGetApiV1NamespacesNsExchangesFanoutFanoutQueuesQueryKey,
} from '@/api/generated/fanout-exchange/fanout-exchange';
import { usePageContentStore, type PageAction } from '@/stores/pageContent';
import { getErrorMessage } from '@/lib/error';
import PageContent from '@/components/PageContent.vue';
import BindQueueModal from '@/components/modals/BindQueueModal.vue';
import UnbindQueueModal from '@/components/modals/UnbindQueueModal.vue';
import DeleteExchangeModal from '@/components/modals/DeleteExchangeModal.vue';
import { EExchangeType } from '@/types/exchanges';

// Composables
const route = useRoute();
const router = useRouter();
const pageContentStore = usePageContentStore();
const queryClient = useQueryClient();

// Extract exchange details from route
const exchangeName = computed(() => String(route.params.exchange));
const namespace = computed(() => String(route.params.ns));

// Validation
const isValidRoute = computed(() => !!(exchangeName.value && namespace.value));

// Modal states
const showDeleteDialog = ref(false);
const showBindQueueModal = ref(false);
const showUnbindQueueModal = ref(false);

// Selected items for operations
const selectedQueueForUnbind = ref<string | null>(null);

// --- API Data Fetching ---

// Fetch queues bound to this fanout exchange
const {
  data: queuesData,
  isLoading: isLoadingQueues,
  error: queuesError,
  refetch: refetchQueues,
} = useGetApiV1NamespacesNsExchangesFanoutFanoutQueues(
  namespace,
  exchangeName,
  {
    query: {
      enabled: isValidRoute,
    },
  },
);

// --- API Mutations ---

// Bind queue mutation
const bindQueueMutation =
  usePutApiV1NamespacesNsExchangesFanoutFanoutQueuesQueue({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getGetApiV1NamespacesNsExchangesFanoutFanoutQueuesQueryKey(
            namespace.value,
            exchangeName.value,
          ),
        });
        showBindQueueModal.value = false;
      },
      onError: (error) => {
        console.error('Failed to bind queue:', error);
      },
    },
  });

// Unbind queue mutation
const unbindQueueMutation =
  useDeleteApiV1NamespacesNsExchangesFanoutFanoutQueuesQueue({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getGetApiV1NamespacesNsExchangesFanoutFanoutQueuesQueryKey(
            namespace.value,
            exchangeName.value,
          ),
        });
        showUnbindQueueModal.value = false;
        selectedQueueForUnbind.value = null;
      },
      onError: (error) => {
        console.error('Failed to unbind queue:', error);
      },
    },
  });

// --- Computed Properties ---

const isLoading = computed(() => isLoadingQueues.value);
const hasError = computed(() => !!queuesError.value);
const errorMessage = computed(() => getErrorMessage(queuesError.value));

// Process queue data
const boundQueues = computed(() => {
  const queueData = queuesData.value?.data || [];
  return queueData.map((q) => ({ name: q.name }));
});

const totalQueues = computed(() => boundQueues.value.length);

// Loading states for mutations
const isBindingQueue = computed(() => bindQueueMutation.isPending.value);
const isUnbindingQueue = computed(() => unbindQueueMutation.isPending.value);

const bindError = computed(() =>
  getErrorMessage(bindQueueMutation.error.value?.error),
);
const unbindError = computed(() =>
  getErrorMessage(unbindQueueMutation.error.value?.error),
);

// --- Event Handlers ---

const handleBindQueue = () => {
  showBindQueueModal.value = true;
};

const handleUnbindQueue = (queueName: string) => {
  selectedQueueForUnbind.value = queueName;
  showUnbindQueueModal.value = true;
};

const handleDeleteExchange = () => {
  // Open modal; it will handle deletion internally and prevent deletion if blocked.
  showDeleteDialog.value = true;
};

const handleRefresh = () => {
  refetchQueues();
};

// Confirm actions
const confirmBindQueue = async (payload: { queueName: string }) => {
  await bindQueueMutation.mutateAsync({
    ns: namespace.value,
    fanout: exchangeName.value,
    queue: payload.queueName,
  });
};

const confirmUnbindQueue = async () => {
  if (!selectedQueueForUnbind.value) return;

  await unbindQueueMutation.mutateAsync({
    ns: namespace.value,
    fanout: exchangeName.value,
    queue: selectedQueueForUnbind.value,
  });
};

// After successful deletion inside DeleteExchangeModal, navigate away
const onDeleted = () => {
  router.push('/exchanges');
};

// --- Page Content Setup ---

const pageActions = computed((): PageAction[] => [
  {
    id: 'bind-queue',
    label: 'Bind Queue',
    icon: 'bi bi-link-45deg',
    variant: 'primary',
    disabled: isBindingQueue.value,
    loading: isBindingQueue.value,
    handler: handleBindQueue,
    tooltip: 'Bind a queue to this fanout exchange',
  },
  {
    id: 'refresh',
    label: 'Refresh',
    icon: 'bi bi-arrow-clockwise',
    variant: 'refresh',
    disabled: isLoading.value,
    loading: isLoading.value,
    handler: handleRefresh,
    tooltip: 'Refresh exchange data',
  },
  {
    id: 'delete-exchange',
    label: 'Delete Exchange',
    icon: 'bi bi-trash',
    variant: 'danger',
    // Keep enabled; DeleteExchangeModal manages its own pending state.
    disabled: false,
    loading: false,
    handler: handleDeleteExchange,
    tooltip:
      'Delete this exchange. If any queues are bound, you will be prompted to unbind them first.',
  },
]);

// Page content management
watchEffect(() => {
  if (!isValidRoute.value) {
    pageContentStore.setPageHeader({
      title: 'Invalid Exchange',
      subtitle: 'Exchange name and namespace are required',
      icon: 'bi bi-exclamation-triangle',
    });
    pageContentStore.setPageActions([]);
    pageContentStore.setErrorState({ message: 'Invalid route parameters' });
    return;
  }

  pageContentStore.setPageHeader({
    title: `Fanout Exchange: ${exchangeName.value}`,
    subtitle: `Namespace: ${namespace.value} • Broadcasts messages to all bound queues`,
    icon: 'bi bi-arrows-angle-expand',
  });

  pageContentStore.setPageActions(pageActions.value);
  pageContentStore.setLoadingState(isLoading.value);

  if (hasError.value) {
    pageContentStore.setErrorState(errorMessage.value);
    pageContentStore.setEmptyState(false);
  } else if (!isLoading.value && totalQueues.value === 0) {
    pageContentStore.setErrorState(null);
    pageContentStore.setEmptyState(true, {
      icon: 'bi bi-arrows-angle-expand',
      title: 'No Queue Bindings',
      message:
        'This fanout exchange has no queue bindings. Bind a queue to start broadcasting messages.',
      actionLabel: 'Bind Queue',
      actionHandler: handleBindQueue,
    });
  } else {
    pageContentStore.setErrorState(null);
    pageContentStore.setEmptyState(false);
  }
});

// Navigate back to exchanges list if route becomes invalid
onMounted(() => {
  if (!isValidRoute.value) {
    router.push('/exchanges');
  }
});
</script>

<template>
  <div class="fanout-exchange-view">
    <PageContent>
      <!-- Exchange Overview Stats -->
      <div
        v-if="!isLoading && !hasError && totalQueues > 0"
        class="stats-overview"
      >
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon queues">
              <i class="bi bi-box" aria-hidden="true"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ totalQueues }}</div>
              <div class="stat-label">
                Bound {{ totalQueues === 1 ? 'Queue' : 'Queues' }}
              </div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon broadcast">
              <i class="bi bi-broadcast" aria-hidden="true"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">100%</div>
              <div class="stat-label">Message Delivery</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Fanout Exchange Info -->
      <div
        v-if="!isLoading && !hasError && totalQueues > 0"
        class="exchange-info"
      >
        <div class="info-card">
          <div class="info-header">
            <i class="bi bi-info-circle" aria-hidden="true"></i>
            <h3>How Fanout Exchange Works</h3>
          </div>
          <p class="info-description">
            Fanout exchanges broadcast every message to all bound queues. When
            you publish a message to this exchange, it will be delivered to
            <strong
              >all {{ totalQueues }} bound queue{{
                totalQueues === 1 ? '' : 's'
              }}</strong
            >
            regardless of routing keys.
          </p>
        </div>
      </div>

      <!-- Bound Queues List -->
      <div
        v-if="!isLoading && !hasError && boundQueues.length > 0"
        class="queues-section"
      >
        <h2 class="section-title">
          <i class="bi bi-box" aria-hidden="true"></i>
          Bound Queues
        </h2>

        <div class="queues-grid">
          <div
            v-for="queue in boundQueues"
            :key="queue.name"
            class="queue-card"
          >
            <div class="queue-header">
              <div class="queue-info">
                <i class="bi bi-box" aria-hidden="true"></i>
                <span class="queue-name">{{ queue.name }}</span>
              </div>
              <button
                type="button"
                class="btn-unbind"
                :disabled="isUnbindingQueue"
                :aria-label="`Unbind queue ${queue.name}`"
                @click="handleUnbindQueue(queue.name)"
              >
                <i class="bi bi-x-circle" aria-hidden="true"></i>
                <span>Unbind</span>
              </button>
            </div>

            <div class="queue-status">
              <div class="status-indicator active">
                <i class="bi bi-check-circle-fill" aria-hidden="true"></i>
                <span>Receiving all messages</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContent>

    <!-- Delete Exchange Modal (self-contained deletion) -->
    <DeleteExchangeModal
      :is-visible="showDeleteDialog"
      :exchange-type="EExchangeType.FANOUT"
      :exchange-name="exchangeName"
      :namespace="namespace"
      :total-queues="totalQueues"
      @deleted="onDeleted"
      @close="showDeleteDialog = false"
    />

    <!-- Bind Queue Modal -->
    <BindQueueModal
      :is-visible="showBindQueueModal"
      :is-loading="isBindingQueue"
      :error="bindError"
      exchange-type="fanout"
      :exchange-name="exchangeName"
      :namespace="namespace"
      @confirm="confirmBindQueue"
      @cancel="showBindQueueModal = false"
    />

    <!-- Unbind Queue Modal -->
    <UnbindQueueModal
      :is-visible="showUnbindQueueModal"
      :is-loading="isUnbindingQueue"
      :error="unbindError"
      :queue-name="selectedQueueForUnbind || ''"
      exchange-type="fanout"
      @confirm="confirmUnbindQueue"
      @cancel="
        showUnbindQueueModal = false;
        selectedQueueForUnbind = null;
      "
    />
  </div>
</template>

<style scoped>
/* Wrapper: mobile-first safety and overflow guards */
.fanout-exchange-view,
.fanout-exchange-view * {
  box-sizing: border-box;
  max-width: 100%;
}

.fanout-exchange-view {
  display: flex;
  flex-direction: column;
  gap: clamp(12px, 2.4vw, 24px);
  overflow-x: hidden; /* guard against horizontal scroll */
  padding-bottom: env(safe-area-inset-bottom);
}

/* Stats Overview */
.stats-overview {
  margin-bottom: clamp(12px, 2.5vw, 24px);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(
    auto-fit,
    minmax(clamp(180px, 35vw, 240px), 1fr)
  );
  gap: clamp(12px, 2.5vw, 20px);
}

.stat-card {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: clamp(12px, 2.8vw, 24px);
  display: flex;
  align-items: center;
  gap: clamp(10px, 2vw, 16px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition:
    box-shadow 0.2s ease,
    transform 0.2s ease;
  min-width: 0;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.stat-icon.queues {
  background: #d1ecf1;
  color: #0c5460;
}

.stat-icon.broadcast {
  background: #d1e7dd;
  color: #0f5132;
}

.stat-content {
  flex: 1;
  min-width: 0; /* allow text to wrap/ellipsis */
}

.stat-value {
  font-size: clamp(1.5rem, 4.5vw, 2rem);
  font-weight: 700;
  color: #212529;
  line-height: 1.2;
}

.stat-label {
  font-size: 0.875rem;
  color: #6c757d;
  font-weight: 500;
  margin-top: 0.25rem;
  overflow-wrap: anywhere;
  word-break: break-word;
}

/* Exchange Info */
.exchange-info {
  margin-bottom: clamp(12px, 2.5vw, 24px);
}

.info-card {
  background: #e7f3ff;
  border: 1px solid #b3d9ff;
  border-left: 4px solid #0d6efd;
  border-radius: 8px;
  padding: clamp(12px, 2.8vw, 24px);
}

.info-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: clamp(8px, 2vw, 12px);
}

.info-header i {
  color: #0d6efd;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.info-header h3 {
  margin: 0;
  font-size: clamp(1rem, 2.8vw, 1.125rem);
  font-weight: 600;
  color: #212529;
  overflow-wrap: anywhere;
}

.info-description {
  margin: 0;
  color: #495057;
  line-height: 1.5;
  font-size: 0.95rem;
  overflow-wrap: anywhere;
  word-break: break-word;
}

/* Queues Section */
.queues-section {
  margin-top: clamp(12px, 2.5vw, 24px);
}

.section-title {
  font-size: clamp(1.25rem, 3.5vw, 1.5rem);
  font-weight: 600;
  color: #212529;
  margin: 0 0 clamp(12px, 2.5vw, 20px) 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.queues-grid {
  display: grid;
  grid-template-columns: repeat(
    auto-fill,
    minmax(clamp(260px, 44vw, 340px), 1fr)
  );
  gap: clamp(12px, 2.8vw, 24px);
}

.queue-card {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: clamp(12px, 2.8vw, 24px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition:
    box-shadow 0.2s ease,
    transform 0.2s ease;
  min-width: 0;
}

.queue-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.queue-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: clamp(10px, 2.2vw, 16px);
  gap: 0.75rem;
  min-width: 0;
  flex-wrap: wrap; /* avoid overflow on narrow screens */
}

.queue-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
}

.queue-info i {
  color: #0c5460;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.queue-name {
  font-weight: 600;
  color: #212529;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 1rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn-unbind {
  background: none;
  border: 1px solid #dc3545;
  color: #dc3545;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  transition:
    transform 0.15s ease,
    background 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
  white-space: nowrap;
}

.btn-unbind:hover:not(:disabled) {
  background-color: #dc3545;
  color: white;
  transform: translateY(-1px);
}

.btn-unbind:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-unbind:focus-visible {
  outline: 2px solid #dc3545;
  outline-offset: 2px;
}

.queue-status {
  padding-top: clamp(10px, 2.2vw, 16px);
  border-top: 1px solid #e9ecef;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  overflow-wrap: anywhere;
}

.status-indicator.active {
  color: #198754;
}

.status-indicator.active i {
  color: #198754;
}

/* Responsive Design */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .queues-grid {
    grid-template-columns: 1fr;
  }

  .queue-header {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .queue-name {
    white-space: normal;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .btn-unbind {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 576px) {
  .stat-icon {
    width: 40px;
    height: 40px;
    font-size: 1.25rem;
  }

  .stat-value {
    font-size: clamp(1.25rem, 5vw, 1.5rem);
  }

  .info-header h3 {
    font-size: clamp(0.95rem, 3.2vw, 1rem);
  }

  .queue-name {
    font-size: 0.95rem;
  }

  .btn-unbind {
    padding: 0.45rem 0.6rem;
    font-size: 0.85rem;
  }
}

/* Focus management */
.queue-card:focus-within {
  outline: 2px solid #0d6efd;
  outline-offset: 2px;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .stat-card,
  .queue-card,
  .btn-unbind {
    transition: none;
  }
  .stat-card:hover,
  .queue-card:hover,
  .btn-unbind:hover {
    transform: none;
  }
}

/* High contrast support */
@media (prefers-contrast: more) {
  .queue-card,
  .stat-card,
  .info-card {
    border-width: 2px;
  }
}
</style>

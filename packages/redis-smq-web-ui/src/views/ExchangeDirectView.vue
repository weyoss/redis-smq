<!--
  - Copyright (c)
  - Weyoss <weyoss@outlook.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { computed, onMounted, ref, watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQueryClient } from '@tanstack/vue-query';
import {
  getGetApiV1NamespacesNsExchangesDirectDirectQueuesQueryKey,
  getGetApiV1NamespacesNsExchangesDirectDirectRoutingKeysQueryKey,
  useDeleteApiV1NamespacesNsExchangesDirectDirectQueuesQueue,
  useGetApiV1NamespacesNsExchangesDirectDirectQueues,
  useGetApiV1NamespacesNsExchangesDirectDirectRoutingKeys,
  usePutApiV1NamespacesNsExchangesDirectDirectQueuesQueue,
} from '@/api/generated/direct-exchange/direct-exchange';
import type { GetApiV1NamespacesNsExchangesDirectDirectQueuesParams } from '@/api/model/index.ts';
import { type PageAction, usePageContentStore } from '@/stores/pageContent';
import { getErrorMessage } from '@/lib/error';
import PageContent from '@/components/PageContent.vue';
import BindQueueModal from '@/components/modals/BindQueueModal.vue';
import UnbindQueueModal from '@/components/modals/UnbindQueueModal.vue';
import DeleteExchangeModal from '@/components/modals/DeleteExchangeModal.vue';
import { EExchangeType } from '@/types/index.ts';

// Composables
const route = useRoute();
const router = useRouter();
const pageContentStore = usePageContentStore();
const queryClient = useQueryClient();

// Extract exchange details from route
const exchangeName = computed(() => String(route.params.exchange));
const namespace = computed(() => String(route.params.ns));

// Validation
const isValidRoute = computed(() => !!exchangeName.value && !!namespace.value);

// Modal states
const showDeleteDialog = ref(false);
const showBindQueueModal = ref(false);
const showUnbindQueueModal = ref(false);

// Selected items for operations
const selectedQueueForUnbind = ref<{ name: string; routingKey: string } | null>(
  null,
);

// --- API Data Fetching ---

// Fetch routing keys
const {
  data: routingKeysData,
  isLoading: isLoadingRoutingKeys,
  error: routingKeysError,
  refetch: refetchRoutingKeys,
} = useGetApiV1NamespacesNsExchangesDirectDirectRoutingKeys(
  namespace,
  exchangeName,
  {
    query: {
      enabled: isValidRoute,
    },
  },
);

const routingKeys = computed(() => routingKeysData.value?.data || []);

// Fetch queues for each routing key
const maxRoutingKeys = 20; // Reasonable limit
const queueQueries = Array.from({ length: maxRoutingKeys }, (_, index) => {
  const routingKey = computed(() => routingKeys.value[index] || '');
  const shouldEnable = computed(
    () =>
      isValidRoute.value &&
      index < routingKeys.value.length &&
      !!routingKeys.value[index],
  );

  return useGetApiV1NamespacesNsExchangesDirectDirectQueues(
    namespace,
    exchangeName,
    computed(
      () =>
        ({
          routingKey: routingKey.value,
        }) as GetApiV1NamespacesNsExchangesDirectDirectQueuesParams,
    ),
    {
      query: {
        enabled: shouldEnable,
      },
    },
  );
});

// --- API Mutations ---

// Bind queue mutation
const bindQueueMutation =
  usePutApiV1NamespacesNsExchangesDirectDirectQueuesQueue({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey:
            getGetApiV1NamespacesNsExchangesDirectDirectRoutingKeysQueryKey(
              namespace.value,
              exchangeName.value,
            ),
        });
        // Invalidate all queue queries
        routingKeys.value.forEach((routingKey) => {
          queryClient.invalidateQueries({
            queryKey:
              getGetApiV1NamespacesNsExchangesDirectDirectQueuesQueryKey(
                namespace.value,
                exchangeName.value,
                { routingKey },
              ),
          });
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
  useDeleteApiV1NamespacesNsExchangesDirectDirectQueuesQueue({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey:
            getGetApiV1NamespacesNsExchangesDirectDirectRoutingKeysQueryKey(
              namespace.value,
              exchangeName.value,
            ),
        });
        // Invalidate all queue queries
        routingKeys.value.forEach((routingKey) => {
          queryClient.invalidateQueries({
            queryKey:
              getGetApiV1NamespacesNsExchangesDirectDirectQueuesQueryKey(
                namespace.value,
                exchangeName.value,
                { routingKey },
              ),
          });
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

const isLoading = computed(() => {
  return (
    isLoadingRoutingKeys.value ||
    queueQueries.some(
      (query, index) =>
        index < routingKeys.value.length && query.isLoading.value,
    )
  );
});

const hasError = computed(() => {
  return (
    !!routingKeysError.value ||
    queueQueries.some(
      (query, index) => index < routingKeys.value.length && !!query.error.value,
    )
  );
});

const errorMessage = computed(() => {
  if (routingKeysError.value) return getErrorMessage(routingKeysError.value);

  const queryError = queueQueries.find(
    (query, index) => index < routingKeys.value.length && query.error.value,
  )?.error.value;

  return queryError ? getErrorMessage(queryError) : null;
});

// Process queue bindings data
const queueBindings = computed(() => {
  const bindings: Array<{
    routingKey: string;
    queues: Array<{ name: string }>;
    totalQueues: number;
  }> = [];

  routingKeys.value.forEach((routingKey, index) => {
    if (index >= queueQueries.length) return;

    const query = queueQueries[index];
    const queueData = query.data?.value?.data || [];

    bindings.push({
      routingKey,
      queues: queueData.map((q) => ({ name: q.name })),
      totalQueues: queueData.length,
    });
  });

  return bindings;
});

const totalQueues = computed(() => {
  return queueBindings.value.reduce(
    (sum, binding) => sum + binding.totalQueues,
    0,
  );
});

const totalRoutingKeys = computed(() => routingKeys.value.length);

// Loading states for mutations
const isBindingQueue = computed(() => bindQueueMutation.isPending.value);
const isUnbindingQueue = computed(() => unbindQueueMutation.isPending.value);

// --- Event Handlers ---

const handleBindQueue = () => {
  showBindQueueModal.value = true;
};

const handleUnbindQueue = (queueName: string, routingKey: string) => {
  selectedQueueForUnbind.value = { name: queueName, routingKey };
  showUnbindQueueModal.value = true;
};

const handleDeleteExchange = () => {
  // Always open; DeleteExchangeModal will inform user if deletion is blocked and handle deletion internally.
  showDeleteDialog.value = true;
};

const handleRefresh = () => {
  refetchRoutingKeys();
  queueQueries.forEach((query, index) => {
    if (index < routingKeys.value.length) {
      query.refetch();
    }
  });
};

// Confirm actions
const confirmBindQueue = async (payload: {
  queueName: string;
  routingKey?: string;
}) => {
  await bindQueueMutation.mutateAsync({
    ns: namespace.value,
    direct: exchangeName.value,
    queue: payload.queueName,
    params: { routingKey: String(payload.routingKey) },
  });
};

const confirmUnbindQueue = async () => {
  if (!selectedQueueForUnbind.value) return;

  await unbindQueueMutation.mutateAsync({
    ns: namespace.value,
    direct: exchangeName.value,
    queue: selectedQueueForUnbind.value.name,
    params: { routingKey: selectedQueueForUnbind.value.routingKey },
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
    tooltip: 'Bind a queue to this exchange with a routing key',
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
    title: `Direct Exchange: ${exchangeName.value}`,
    subtitle: `Namespace: ${namespace.value} • Routes messages based on exact routing key matches`,
    icon: 'bi bi-arrow-right',
  });

  pageContentStore.setPageActions(pageActions.value);
  pageContentStore.setLoadingState(isLoading.value);

  if (hasError.value) {
    pageContentStore.setErrorState(errorMessage.value);
    pageContentStore.setEmptyState(false);
  } else if (!isLoading.value && totalRoutingKeys.value === 0) {
    pageContentStore.setErrorState(null);
    pageContentStore.setEmptyState(true, {
      icon: 'bi bi-arrow-right',
      title: 'No Queue Bindings',
      message:
        'This direct exchange has no queue bindings. Bind a queue with a routing key to start routing messages.',
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
  <div class="exchange-content">
    <PageContent>
      <!-- Exchange Overview Stats -->
      <div
        v-if="!isLoading && !hasError && totalRoutingKeys > 0"
        class="stats-overview"
      >
        <div class="stats-grid" role="group" aria-label="Exchange stats">
          <div class="stat-card">
            <div class="stat-icon routing-keys" aria-hidden="true">
              <i class="bi bi-key"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ totalRoutingKeys }}</div>
              <div class="stat-label">
                Routing {{ totalRoutingKeys === 1 ? 'Key' : 'Keys' }}
              </div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon queues" aria-hidden="true">
              <i class="bi bi-box"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ totalQueues }}</div>
              <div class="stat-label">
                Bound {{ totalQueues === 1 ? 'Queue' : 'Queues' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Queue Bindings List -->
      <section
        v-if="!isLoading && !hasError && queueBindings.length > 0"
        class="bindings-section"
        aria-labelledby="bindings-title"
      >
        <h2 id="bindings-title" class="section-title">
          <i class="bi bi-diagram-3" aria-hidden="true"></i>
          Queue Bindings
        </h2>

        <div class="bindings-list">
          <article
            v-for="binding in queueBindings"
            :key="binding.routingKey"
            class="binding-card"
          >
            <header class="binding-header">
              <div class="routing-key-info">
                <div class="routing-key-badge" title="Routing key">
                  <i class="bi bi-key" aria-hidden="true"></i>
                  <span class="routing-key-text">{{ binding.routingKey }}</span>
                </div>
                <div class="queue-count">
                  {{ binding.totalQueues }}
                  {{ binding.totalQueues === 1 ? 'queue' : 'queues' }}
                </div>
              </div>
            </header>

            <div v-if="binding.queues.length > 0" class="queues-list">
              <div
                v-for="queue in binding.queues"
                :key="`${binding.routingKey}-${queue.name}`"
                class="queue-item"
              >
                <div class="queue-info">
                  <i class="bi bi-box" aria-hidden="true"></i>
                  <span class="queue-name">{{ queue.name }}</span>
                </div>
                <button
                  type="button"
                  class="btn-unbind"
                  :disabled="isUnbindingQueue"
                  :aria-label="`Unbind queue ${queue.name} from routing key ${binding.routingKey}`"
                  @click="handleUnbindQueue(queue.name, binding.routingKey)"
                >
                  <i class="bi bi-x-circle" aria-hidden="true"></i>
                  <span>Unbind</span>
                </button>
              </div>
            </div>

            <div v-else class="no-queues">
              <i class="bi bi-inbox" aria-hidden="true"></i>
              <span>No queues bound to this routing key</span>
            </div>
          </article>
        </div>
      </section>
    </PageContent>

    <!-- Delete Exchange Modal (self-contained deletion) -->
    <DeleteExchangeModal
      :is-visible="showDeleteDialog"
      :exchange-type="EExchangeType.DIRECT"
      :exchange-name="exchangeName"
      :namespace="namespace"
      :total-queues="totalQueues"
      :total-routing-keys="totalRoutingKeys"
      @deleted="onDeleted"
      @close="showDeleteDialog = false"
    />

    <!-- Bind Queue Modal -->
    <BindQueueModal
      :is-visible="showBindQueueModal"
      :is-loading="isBindingQueue"
      :error="getErrorMessage(bindQueueMutation.error.value?.error)"
      exchange-type="direct"
      :exchange-name="exchangeName"
      :namespace="namespace"
      @confirm="confirmBindQueue"
      @cancel="showBindQueueModal = false"
    />

    <!-- Unbind Queue Modal -->
    <UnbindQueueModal
      :is-visible="showUnbindQueueModal"
      :is-loading="isUnbindingQueue"
      :error="getErrorMessage(unbindQueueMutation.error.value?.error)"
      :queue-name="selectedQueueForUnbind?.name || ''"
      :routing-key="selectedQueueForUnbind?.routingKey || ''"
      exchange-type="direct"
      @confirm="confirmUnbindQueue"
      @cancel="
        showUnbindQueueModal = false;
        selectedQueueForUnbind = null;
      "
    />
  </div>
</template>

<style scoped>
/* Wrapper: responsive padding and horizontal overflow guard */
.exchange-content {
  --content-padding: clamp(12px, 2.8vw, 24px);
  padding: var(--content-padding);
  padding-bottom: calc(var(--content-padding) + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  gap: clamp(12px, 2.2vw, 24px);
  overflow-x: hidden; /* avoid accidental horizontal scroll */
}

/* Ensure inner elements never bleed horizontally */
.exchange-content,
.exchange-content * {
  box-sizing: border-box;
  max-width: 100%;
}

/* Stats Overview */
.stats-overview {
  margin-bottom: clamp(16px, 2.5vw, 24px);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: clamp(12px, 2.2vw, 20px);
}

.stat-card {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: clamp(14px, 2.2vw, 24px);
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

.stat-icon.routing-keys {
  background: #fff3cd;
  color: #856404;
}

.stat-icon.queues {
  background: #d1ecf1;
  color: #0c5460;
}

.stat-content {
  flex: 1;
  min-width: 0; /* allow wrapping within */
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

/* Bindings Section */
.bindings-section {
  margin-top: clamp(12px, 2.5vw, 24px);
}

.section-title {
  font-size: clamp(1.25rem, 3.8vw, 1.5rem);
  font-weight: 600;
  color: #212529;
  margin: 0 0 clamp(12px, 2.2vw, 20px) 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  overflow-wrap: anywhere;
}

.bindings-list {
  display: flex;
  flex-direction: column;
  gap: clamp(12px, 2vw, 20px);
}

.binding-card {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.2s ease;
  min-width: 0;
}

.binding-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.binding-header {
  background: #f8f9fa;
  padding: clamp(12px, 2.2vw, 20px) clamp(14px, 2.2vw, 24px);
  border-bottom: 1px solid #e9ecef;
}

.routing-key-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: clamp(10px, 2vw, 16px);
  min-width: 0; /* enable child wrapping */
}

.routing-key-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #fff3cd;
  color: #856404;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.875rem;
  max-width: 100%;
}

.routing-key-text {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-weight: 600;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.queue-count {
  font-size: 0.875rem;
  color: #6c757d;
  font-weight: 500;
  white-space: nowrap;
}

.queues-list {
  padding: clamp(12px, 2.5vw, 24px);
  display: flex;
  flex-direction: column;
  gap: clamp(10px, 2vw, 16px);
}

.queue-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: clamp(10px, 2.2vw, 16px);
  background: #f8f9fa;
  border-radius: 8px;
  transition: background 0.2s ease;
  min-width: 0; /* allow children to shrink */
}

.queue-item:hover {
  background: #e9ecef;
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
  font-size: 1.125rem;
  flex-shrink: 0;
}

.queue-name {
  font-weight: 500;
  color: #212529;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
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

.no-queues {
  padding: clamp(16px, 2.5vw, 24px);
  text-align: center;
  color: #6c757d;
  font-style: italic;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.no-queues i {
  font-size: 1.25rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .routing-key-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .queue-item {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .queue-name {
    white-space: normal; /* allow wrapping on small screens */
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .btn-unbind {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 576px) {
  .routing-key-badge {
    width: 100%;
    justify-content: flex-start;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .stat-card,
  .btn-unbind,
  .queue-item {
    transition: none;
  }
  .stat-card:hover,
  .btn-unbind:hover,
  .queue-item:hover {
    transform: none;
  }
}
</style>

<!--
  - Copyright (c)
  - Weyoss <weyoss@protonmail.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { ref, computed, watchEffect, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQueryClient } from '@tanstack/vue-query';

// API hooks for direct exchange operations
import {
  useGetApiV1NamespacesNsExchangesDirectDirectRoutingKeys,
  useGetApiV1NamespacesNsExchangesDirectDirectQueues,
  usePutApiV1NamespacesNsExchangesDirectDirectQueuesQueue,
  useDeleteApiV1NamespacesNsExchangesDirectDirectQueuesQueue,
  useDeleteApiV1NamespacesNsExchangesDirectDirect,
  getGetApiV1NamespacesNsExchangesDirectDirectRoutingKeysQueryKey,
  getGetApiV1NamespacesNsExchangesDirectDirectQueuesQueryKey,
} from '@/api/generated/direct-exchange/direct-exchange';

import type { GetApiV1NamespacesNsExchangesDirectDirectQueuesParams } from '@/api/model/index.ts';

// Components and utilities
import { usePageContentStore, type PageAction } from '@/stores/pageContent';
import { getErrorMessage } from '@/lib/error';
import PageContent from '@/components/PageContent.vue';
import ConfirmationDialogModal from '@/components/modals/ConfirmationDialogModal.vue';
import BindQueueModal from '@/components/modals/BindQueueModal.vue';
import UnbindQueueModal from '@/components/modals/UnbindQueueModal.vue';

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

// Delete exchange mutation
const deleteExchangeMutation = useDeleteApiV1NamespacesNsExchangesDirectDirect({
  mutation: {
    onSuccess: () => {
      router.push('/exchanges');
    },
    onError: (error) => {
      console.error('Failed to delete exchange:', error);
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
const isDeletingExchange = computed(
  () => deleteExchangeMutation.isPending.value,
);

const bindError = computed(() =>
  getErrorMessage(bindQueueMutation.error.value?.error),
);
const unbindError = computed(() =>
  getErrorMessage(unbindQueueMutation.error.value?.error),
);
const deleteError = computed(() =>
  getErrorMessage(deleteExchangeMutation.error.value?.error),
);

// --- Event Handlers ---

const handleBindQueue = () => {
  showBindQueueModal.value = true;
};

const handleUnbindQueue = (queueName: string, routingKey: string) => {
  selectedQueueForUnbind.value = { name: queueName, routingKey };
  showUnbindQueueModal.value = true;
};

const handleDeleteExchange = () => {
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

const confirmDeleteExchange = async () => {
  await deleteExchangeMutation.mutateAsync({
    ns: namespace.value,
    direct: exchangeName.value,
  });
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
    disabled: isDeletingExchange.value,
    loading: isDeletingExchange.value,
    handler: handleDeleteExchange,
    tooltip: 'Delete this exchange and all its bindings',
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
  <div>
    <PageContent>
      <!-- Exchange Overview Stats -->
      <div
        v-if="!isLoading && !hasError && totalRoutingKeys > 0"
        class="stats-overview"
      >
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon routing-keys">
              <i class="bi bi-key" aria-hidden="true"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ totalRoutingKeys }}</div>
              <div class="stat-label">
                Routing {{ totalRoutingKeys === 1 ? 'Key' : 'Keys' }}
              </div>
            </div>
          </div>

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
        </div>
      </div>

      <!-- Queue Bindings List -->
      <div
        v-if="!isLoading && !hasError && queueBindings.length > 0"
        class="bindings-section"
      >
        <h2 class="section-title">
          <i class="bi bi-diagram-3" aria-hidden="true"></i>
          Queue Bindings
        </h2>

        <div class="bindings-list">
          <div
            v-for="binding in queueBindings"
            :key="binding.routingKey"
            class="binding-card"
          >
            <div class="binding-header">
              <div class="routing-key-info">
                <div class="routing-key-badge">
                  <i class="bi bi-key" aria-hidden="true"></i>
                  <span class="routing-key-text">{{ binding.routingKey }}</span>
                </div>
                <div class="queue-count">
                  {{ binding.totalQueues }}
                  {{ binding.totalQueues === 1 ? 'queue' : 'queues' }}
                </div>
              </div>
            </div>

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
          </div>
        </div>
      </div>
    </PageContent>

    <!-- Delete Exchange Confirmation Dialog -->
    <ConfirmationDialogModal
      :is-visible="showDeleteDialog"
      :is-loading="isDeletingExchange"
      :error="deleteError"
      title="Delete Direct Exchange"
      :message="`Are you sure you want to delete the direct exchange '${exchangeName}'? This will remove all queue bindings and cannot be undone.`"
      confirm-text="Delete Exchange"
      variant="danger"
      @confirm="confirmDeleteExchange"
      @close="showDeleteDialog = false"
    />

    <!-- Bind Queue Modal -->
    <BindQueueModal
      :is-visible="showBindQueueModal"
      :is-loading="isBindingQueue"
      :error="bindError"
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
      :error="unbindError"
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
/* Stats Overview */
.stats-overview {
  margin-bottom: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
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
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #212529;
  line-height: 1.2;
}

.stat-label {
  font-size: 0.875rem;
  color: #6c757d;
  font-weight: 500;
  margin-top: 0.25rem;
}

/* Bindings Section */
.bindings-section {
  margin-top: 2rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #212529;
  margin: 0 0 1.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.bindings-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.binding-card {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.binding-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.binding-header {
  background: #f8f9fa;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e9ecef;
}

.routing-key-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.routing-key-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #fff3cd;
  color: #856404;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.875rem;
}

.routing-key-text {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-weight: 600;
}

.queue-count {
  font-size: 0.875rem;
  color: #6c757d;
  font-weight: 500;
}

.queues-list {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.queue-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.queue-item:hover {
  background: #e9ecef;
}

.queue-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.queue-info i {
  color: #0c5460;
  font-size: 1.125rem;
}

.queue-name {
  font-weight: 500;
  color: #212529;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.btn-unbind {
  background: none;
  border: 1px solid #dc3545;
  color: #dc3545;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-unbind:hover:not(:disabled) {
  background-color: #dc3545;
  color: white;
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
  padding: 2rem 1.5rem;
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
    align-items: flex-start;
    gap: 1rem;
  }

  .btn-unbind {
    align-self: flex-end;
  }
}
</style>

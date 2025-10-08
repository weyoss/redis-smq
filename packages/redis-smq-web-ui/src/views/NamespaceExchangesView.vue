<!--
  - Copyright (c)
  - Weyoss <weyoss@protonmail.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQueryClient } from '@tanstack/vue-query';

// Main listing API
import {
  useGetApiV1NamespacesNsExchanges,
  getGetApiV1NamespacesNsExchangesQueryKey,
} from '@/api/generated/namespaces/namespaces.ts';

// Exchange deletion APIs
import { useDeleteApiV1NamespacesNsExchangesFanoutFanout } from '@/api/generated/fanout-exchange/fanout-exchange';
import { useDeleteApiV1NamespacesNsExchangesDirectDirect } from '@/api/generated/direct-exchange/direct-exchange';
import { useDeleteApiV1NamespacesNsExchangesTopicTopic } from '@/api/generated/topic-exchange/topic-exchange';

// Exchange creation APIs (via queue binding)
import { usePutApiV1NamespacesNsExchangesFanoutFanoutQueuesQueue } from '@/api/generated/fanout-exchange/fanout-exchange';
import { usePutApiV1NamespacesNsExchangesDirectDirectQueuesQueue } from '@/api/generated/direct-exchange/direct-exchange';
import { usePutApiV1NamespacesNsExchangesTopicTopicQueuesQueue } from '@/api/generated/topic-exchange/topic-exchange';

// Types and Components
import type { GetApiV1Exchanges200DataItem } from '@/api/model';
import { usePageContentStore, type PageAction } from '@/stores/pageContent';
import { getErrorMessage } from '@/lib/error';
import PageContent from '@/components/PageContent.vue';
import ConfirmationDialogModal from '@/components/modals/ConfirmationDialogModal.vue';
import CreateExchangeModal from '@/components/modals/CreateExchangeModal.vue';
import { EExchangeType } from '@/types/exchanges';
import ExchangeCard from '@/components/cards/ExchangeCard.vue';

// Composables
const route = useRoute();
const router = useRouter();
const pageContentStore = usePageContentStore();
const queryClient = useQueryClient();

// Extract namespace from route
const namespace = computed(() => String(route.params.ns));

// Validation
const isValidRoute = computed(() => !!namespace.value);

// Dialog State
const showDeleteDialog = ref(false);
const showCreateDialog = ref(false);
const exchangeToDelete = ref<GetApiV1Exchanges200DataItem | null>(null);

// API Data Fetching
const { data, isLoading, isError, error, refetch } =
  useGetApiV1NamespacesNsExchanges(namespace, {
    query: {
      enabled: isValidRoute,
    },
  });

// Deletion Mutations
const deleteFanoutExchange = useDeleteApiV1NamespacesNsExchangesFanoutFanout({
  mutation: {
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getGetApiV1NamespacesNsExchangesQueryKey(namespace),
      });
      showDeleteDialog.value = false;
      exchangeToDelete.value = null;
    },
    onError: (error) => {
      console.error('Failed to delete fanout exchange:', error);
    },
  },
});

const deleteDirectExchange = useDeleteApiV1NamespacesNsExchangesDirectDirect({
  mutation: {
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getGetApiV1NamespacesNsExchangesQueryKey(namespace),
      });
      showDeleteDialog.value = false;
      exchangeToDelete.value = null;
    },
    onError: (error) => {
      console.error('Failed to delete direct exchange:', error);
    },
  },
});

const deleteTopicExchange = useDeleteApiV1NamespacesNsExchangesTopicTopic({
  mutation: {
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getGetApiV1NamespacesNsExchangesQueryKey(namespace),
      });
      showDeleteDialog.value = false;
      exchangeToDelete.value = null;
    },
    onError: (error) => {
      console.error('Failed to delete topic exchange:', error);
    },
  },
});

// Creation Mutations (via queue binding)
const createFanoutExchange =
  usePutApiV1NamespacesNsExchangesFanoutFanoutQueuesQueue({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getGetApiV1NamespacesNsExchangesQueryKey(namespace),
        });
        showCreateDialog.value = false;
      },
      onError: (error) => {
        console.error('Failed to create fanout exchange:', error);
      },
    },
  });

const createDirectExchange =
  usePutApiV1NamespacesNsExchangesDirectDirectQueuesQueue({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getGetApiV1NamespacesNsExchangesQueryKey(namespace),
        });
        showCreateDialog.value = false;
      },
      onError: (error) => {
        console.error('Failed to create direct exchange:', error);
      },
    },
  });

const createTopicExchange =
  usePutApiV1NamespacesNsExchangesTopicTopicQueuesQueue({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getGetApiV1NamespacesNsExchangesQueryKey(namespace),
        });
        showCreateDialog.value = false;
      },
      onError: (error) => {
        console.error('Failed to create topic exchange:', error);
      },
    },
  });

// Combined loading/error state for deletion
const isDeleting = computed(
  () =>
    deleteFanoutExchange.isPending.value ||
    deleteDirectExchange.isPending.value ||
    deleteTopicExchange.isPending.value,
);

// Combined loading/error state for creation
const isCreating = computed(
  () =>
    createFanoutExchange.isPending.value ||
    createDirectExchange.isPending.value ||
    createTopicExchange.isPending.value,
);

const createError = computed(() =>
  getErrorMessage(
    createFanoutExchange.error.value?.error ||
      createDirectExchange.error.value?.error ||
      createTopicExchange.error.value?.error,
  ),
);

// Normalized Data - filtered by namespace
const allExchanges = computed<GetApiV1Exchanges200DataItem[]>(
  () => data.value?.data ?? [],
);

const exchanges = computed<GetApiV1Exchanges200DataItem[]>(() => {
  if (!namespace.value) return [];
  return allExchanges.value.filter(
    (exchange) => exchange.ns === namespace.value,
  );
});

const errorMessage = computed(() => getErrorMessage(error.value));

// Statistics
const exchangeStats = computed(() => {
  const stats = {
    total: exchanges.value.length,
    direct: 0,
    fanout: 0,
    topic: 0,
  };

  exchanges.value.forEach((exchange) => {
    switch (exchange.type) {
      case EExchangeType.DIRECT:
        stats.direct++;
        break;
      case EExchangeType.FANOUT:
        stats.fanout++;
        break;
      case EExchangeType.TOPIC:
        stats.topic++;
        break;
    }
  });

  return stats;
});

// Handlers
const handleDeleteExchange = (exchange: GetApiV1Exchanges200DataItem) => {
  exchangeToDelete.value = exchange;
  showDeleteDialog.value = true;
};

const handleCreateExchange = () => {
  showCreateDialog.value = true;
};

const handleBindQueue = (exchange: GetApiV1Exchanges200DataItem) => {
  console.log('Binding queue to:', exchange.name);
  // Logic to open a "Bind Queue" modal would go here
};

const handleUnbindQueue = (payload: {
  exchange: GetApiV1Exchanges200DataItem;
  queueName: string;
}) => {
  console.log(
    'Unbinding queue from:',
    payload.exchange.name,
    'queue:',
    payload.queueName,
  );
  // Logic to handle queue unbinding would go here
};

const handlePublishMessage = (exchange: GetApiV1Exchanges200DataItem) => {
  console.log('Publishing message to:', exchange.name);
  // Logic to open a "Publish Message" modal would go here
};

const confirmDeleteExchange = async () => {
  if (!exchangeToDelete.value) return;

  const { type, name, ns } = exchangeToDelete.value;

  try {
    switch (type) {
      case EExchangeType.FANOUT:
        await deleteFanoutExchange.mutateAsync({ ns, fanout: name });
        break;
      case EExchangeType.DIRECT:
        await deleteDirectExchange.mutateAsync({ ns, direct: name });
        break;
      case EExchangeType.TOPIC:
        await deleteTopicExchange.mutateAsync({ ns, topic: name });
        break;
      default:
        throw new Error(`Unsupported exchange type: ${type}`);
    }
  } catch (error) {
    console.error('Failed to delete exchange:', error);
  }
};

const confirmCreateExchange = async (payload: {
  name: string;
  type: EExchangeType;
  ns: string;
  queueName: string;
  routingKey?: string;
  bindingPattern?: string;
}) => {
  const { name, type, ns, queueName, routingKey, bindingPattern } = payload;

  try {
    switch (type) {
      case EExchangeType.FANOUT:
        await createFanoutExchange.mutateAsync({
          ns,
          fanout: name,
          queue: queueName,
        });
        break;
      case EExchangeType.DIRECT:
        await createDirectExchange.mutateAsync({
          ns,
          direct: name,
          queue: queueName,
          params: { routingKey: String(routingKey) },
        });
        break;
      case EExchangeType.TOPIC:
        await createTopicExchange.mutateAsync({
          ns,
          topic: name,
          queue: queueName,
          params: { bindingPattern: String(bindingPattern) },
        });
        break;
      default:
        throw new Error(`Unsupported exchange type: ${type}`);
    }
  } catch (error) {
    console.error('Failed to create exchange:', error);
  }
};

// Helper function to map exchange type integer to route path
const getExchangeTypeRoute = (
  ex: GetApiV1Exchanges200DataItem,
): { name: string; params: Record<string, any> } => {
  const params = { exchange: ex.name, ns: ex.ns };
  if (ex.type == EExchangeType.DIRECT) {
    return {
      name: 'Direct Exchange',
      params,
    };
  }
  if (ex.type == EExchangeType.TOPIC) {
    return {
      name: 'Topic Exchange',
      params,
    };
  }
  return {
    name: 'Fanout Exchange',
    params,
  };
};

// Navigation helpers
const navigateToExchange = (ex: GetApiV1Exchanges200DataItem) => {
  const routeParams = getExchangeTypeRoute(ex);
  router.push(routeParams);
};

// Page Content Setup
const pageActions = computed((): PageAction[] => [
  {
    id: 'create-exchange',
    label: 'Create Exchange',
    icon: 'bi bi-plus-lg',
    variant: 'primary',
    disabled: isCreating.value,
    loading: isCreating.value,
    handler: handleCreateExchange,
    tooltip: 'Create a new exchange by binding a queue to it',
  },
  {
    id: 'refresh-exchanges',
    label: 'Refresh',
    icon: 'bi bi-arrow-clockwise',
    variant: 'refresh',
    disabled: isLoading.value,
    loading: isLoading.value,
    handler: () => refetch(),
    tooltip: 'Refresh exchanges list',
  },
]);

// Page content management
watchEffect(() => {
  if (!isValidRoute.value) {
    pageContentStore.setPageHeader({
      title: 'Invalid Namespace',
      subtitle: 'Namespace parameter is required',
      icon: 'bi bi-exclamation-triangle',
    });
    pageContentStore.setPageActions([]);
    pageContentStore.setErrorState({ message: 'Invalid route parameters' });
    return;
  }

  pageContentStore.setPageHeader({
    title: `Exchanges in "${namespace.value}"`,
    subtitle: `View and manage exchanges in the ${namespace.value} namespace`,
    icon: 'bi bi-diagram-3',
  });

  pageContentStore.setPageActions(pageActions.value);
  pageContentStore.setLoadingState(isLoading.value);

  if (isError.value) {
    pageContentStore.setErrorState(errorMessage.value);
    pageContentStore.setEmptyState(false);
  } else if (!isLoading.value && exchanges.value.length === 0) {
    pageContentStore.setErrorState(null);
    pageContentStore.setEmptyState(true, {
      icon: 'bi bi-diagram-3',
      title: 'No Exchanges Found',
      message: `No exchanges are currently configured in the "${namespace.value}" namespace. Create your first exchange to start routing messages.`,
      actionLabel: 'Create Exchange',
      actionHandler: handleCreateExchange,
    });
  } else {
    pageContentStore.setErrorState(null);
    pageContentStore.setEmptyState(false);
  }
});
</script>

<template>
  <div>
    <PageContent>
      <!-- Namespace Stats Overview -->
      <div
        v-if="!isLoading && !isError && exchanges.length > 0"
        class="namespace-stats"
      >
        <div class="stats-grid">
          <div class="stat-card total">
            <div class="stat-icon">
              <i class="bi bi-diagram-3" aria-hidden="true"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ exchangeStats.total }}</div>
              <div class="stat-label">Total Exchanges</div>
            </div>
          </div>

          <div class="stat-card direct">
            <div class="stat-icon">
              <i class="bi bi-arrow-right" aria-hidden="true"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ exchangeStats.direct }}</div>
              <div class="stat-label">Direct</div>
            </div>
          </div>

          <div class="stat-card fanout">
            <div class="stat-icon">
              <i class="bi bi-arrows-angle-expand" aria-hidden="true"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ exchangeStats.fanout }}</div>
              <div class="stat-label">Fanout</div>
            </div>
          </div>

          <div class="stat-card topic">
            <div class="stat-icon">
              <i class="bi bi-hash" aria-hidden="true"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ exchangeStats.topic }}</div>
              <div class="stat-label">Topic</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Namespace Info -->
      <div
        v-if="!isLoading && !isError && exchanges.length > 0"
        class="namespace-info"
      >
        <div class="info-card">
          <div class="info-header">
            <i class="bi bi-folder-fill" aria-hidden="true"></i>
            <h3>Namespace: {{ namespace }}</h3>
          </div>
          <p class="info-description">
            This namespace contains {{ exchangeStats.total }} exchange{{
              exchangeStats.total === 1 ? '' : 's'
            }}. Exchanges in this namespace are isolated from other namespaces
            and can be managed independently.
          </p>
        </div>
      </div>

      <!-- Exchanges Grid -->
      <div v-if="exchanges.length > 0" class="grid grid-cols-2 gap-6">
        <ExchangeCard
          v-for="exchange in exchanges"
          :key="`${exchange.name}-${exchange.ns}`"
          :exchange="exchange"
          :is-deleting="
            isDeleting &&
            exchangeToDelete?.name === exchange.name &&
            exchangeToDelete?.ns === exchange.ns
          "
          @delete="handleDeleteExchange"
          @view-details="navigateToExchange"
          @bind-queue="handleBindQueue"
          @unbind-queue="handleUnbindQueue"
          @publish-message="handlePublishMessage"
        />
      </div>
    </PageContent>

    <!-- Delete Confirmation Dialog -->
    <ConfirmationDialogModal
      :is-visible="showDeleteDialog"
      :is-loading="isDeleting"
      title="Delete Exchange"
      :message="`Are you sure you want to delete the exchange '${exchangeToDelete?.name}'? This action cannot be undone.`"
      confirm-text="Delete Exchange"
      variant="danger"
      @confirm="confirmDeleteExchange"
      @close="
        showDeleteDialog = false;
        exchangeToDelete = null;
      "
    />

    <!-- Create Exchange Modal -->
    <CreateExchangeModal
      :is-visible="showCreateDialog"
      :is-loading="isCreating"
      :error="createError"
      @confirm="confirmCreateExchange"
      @cancel="showCreateDialog = false"
    />
  </div>
</template>

<style scoped>
/* Namespace Stats */
.namespace-stats {
  margin-bottom: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
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

.stat-card.total .stat-icon {
  background: #e7f3ff;
  color: #0d6efd;
}

.stat-card.direct .stat-icon {
  background: #cff4fc;
  color: #055160;
}

.stat-card.fanout .stat-icon {
  background: #d1e7dd;
  color: #0f5132;
}

.stat-card.topic .stat-icon {
  background: #e2d9f3;
  color: #5a2a94;
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

/* Namespace Info */
.namespace-info {
  margin-bottom: 2rem;
}

.info-card {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-left: 4px solid #0d6efd;
  border-radius: 8px;
  padding: 1.5rem;
}

.info-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.info-header i {
  color: #0d6efd;
  font-size: 1.25rem;
}

.info-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #212529;
}

.info-description {
  margin: 0;
  color: #495057;
  line-height: 1.5;
  font-size: 0.9rem;
}

/* Grid Layout */
.grid {
  display: grid;
}

.grid-cols-2 {
  grid-template-columns: repeat(2, 1fr);
}

.gap-6 {
  gap: 1.5rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .grid-cols-2 {
    grid-template-columns: 1fr;
  }

  .stat-card {
    padding: 1rem;
  }

  .stat-icon {
    width: 40px;
    height: 40px;
    font-size: 1.25rem;
  }

  .stat-value {
    font-size: 1.5rem;
  }

  .info-card {
    padding: 1rem;
  }

  .info-header h3 {
    font-size: 1rem;
  }
}

@media (max-width: 576px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .stat-card {
    padding: 1rem;
    gap: 0.75rem;
  }

  .stat-icon {
    width: 36px;
    height: 36px;
    font-size: 1.125rem;
  }

  .stat-value {
    font-size: 1.25rem;
  }

  .stat-label {
    font-size: 0.8rem;
  }
}

/* Focus management */
.stat-card:focus-within {
  outline: 2px solid #0d6efd;
  outline-offset: 2px;
}
</style>

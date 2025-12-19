<!--
  - Copyright (c)
  - Weyoss <weyoss@outlook.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue';
import { useRouter } from 'vue-router';
import { useQueryClient } from '@tanstack/vue-query';
import {
  useGetApiV1Exchanges,
  getGetApiV1ExchangesQueryKey,
} from '@/api/generated/exchanges/exchanges';
import { usePutApiV1NamespacesNsExchangesFanoutFanoutQueuesQueue } from '@/api/generated/fanout-exchange/fanout-exchange';
import { usePutApiV1NamespacesNsExchangesDirectDirectQueuesQueue } from '@/api/generated/direct-exchange/direct-exchange';
import { usePutApiV1NamespacesNsExchangesTopicTopicQueuesQueue } from '@/api/generated/topic-exchange/topic-exchange';
import type { GetApiV1Exchanges200DataItem } from '@/api/model';
import { usePageContentStore, type PageAction } from '@/stores/pageContent';
import { getErrorMessage } from '@/lib/error';
import PageContent from '@/components/PageContent.vue';
import CreateExchangeModal from '@/components/modals/CreateExchangeModal.vue';
import DeleteExchangeModal from '@/components/modals/DeleteExchangeModal.vue';
import {
  EExchangeType,
  type TExchangeDeleteEventPayload,
  type TExchangeDeleteEventPayloadTotals,
} from '@/types/exchanges';
import ExchangeCard from '@/components/cards/ExchangeCard.vue';

// Composables
const router = useRouter();
const pageContentStore = usePageContentStore();
const queryClient = useQueryClient();

// Dialog State
const showDeleteDialog = ref(false);
const showCreateDialog = ref(false);
const exchangeToDelete = ref<GetApiV1Exchanges200DataItem | null>(null);

const deleteTotals = ref<TExchangeDeleteEventPayloadTotals | null>(null);

// API Data Fetching
const { data, isLoading, isError, error, refetch } = useGetApiV1Exchanges();

// Creation Mutations (via queue binding)
const createFanoutExchange =
  usePutApiV1NamespacesNsExchangesFanoutFanoutQueuesQueue({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getGetApiV1ExchangesQueryKey(),
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
          queryKey: getGetApiV1ExchangesQueryKey(),
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
          queryKey: getGetApiV1ExchangesQueryKey(),
        });
        showCreateDialog.value = false;
      },
      onError: (error) => {
        console.error('Failed to create topic exchange:', error);
      },
    },
  });

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

// Normalized Data
const exchanges = computed<GetApiV1Exchanges200DataItem[]>(
  () => data.value?.data ?? [],
);

const errorMessage = computed(() => getErrorMessage(error.value));

// Handlers
const handleDeleteExchange = (payload: TExchangeDeleteEventPayload) => {
  // Find the full exchange item to retain shape used elsewhere
  const found =
    exchanges.value.find(
      (e) => e.name === payload.exchange.name && e.ns === payload.exchange.ns,
    ) || null;

  exchangeToDelete.value =
    found ??
    ({
      name: payload.exchange.name,
      ns: payload.exchange.ns,
      type: payload.exchange.type,
    } as GetApiV1Exchanges200DataItem);

  deleteTotals.value = payload.totals;
  showDeleteDialog.value = true;
};

const handleCreateExchange = () => {
  showCreateDialog.value = true;
};

// Placeholder handlers for new actions from ExchangeCard
const handleBindQueue = (exchange: GetApiV1Exchanges200DataItem) => {
  console.log('Binding queue to:', exchange.name);
  // Logic to open a "Bind Queue" modal would go here
};

// Creation confirm
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
  pageContentStore.setPageHeader({
    title: 'Exchanges',
    subtitle:
      'View and manage exchange queue bindings in your RedisSMQ instance',
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
      message:
        'No exchanges are currently configured in your RedisSMQ instance. Create your first exchange to start routing messages.',
      actionLabel: 'Create Exchange',
      actionHandler: handleCreateExchange,
    });
  } else {
    pageContentStore.setErrorState(null);
    pageContentStore.setEmptyState(false);
  }
});

/* =========================
   DeleteExchangeModal data
   ========================= */

// Selected exchange fields
const exchangeToDeleteNs = computed(() => exchangeToDelete.value?.ns ?? '');
const exchangeToDeleteName = computed(() => exchangeToDelete.value?.name ?? '');
const exchangeToDeleteType = computed(() => exchangeToDelete.value?.type ?? 0);

// Use totals supplied by ExchangeCard instead of refetching here
const totalQueuesForDelete = computed<number>(
  () => deleteTotals.value?.totalQueues ?? 0,
);
const totalRoutingKeysForDelete = computed<number | undefined>(
  () => deleteTotals.value?.totalRoutingKeys,
);
const totalBindingPatternsForDelete = computed<number | undefined>(
  () => deleteTotals.value?.totalBindingPatterns,
);

// Handle post-deletion refresh
const onExchangeDeleted = () => {
  queryClient.invalidateQueries({
    queryKey: getGetApiV1ExchangesQueryKey(),
  });
  showDeleteDialog.value = false;
  exchangeToDelete.value = null;
  deleteTotals.value = null;
};
</script>

<template>
  <div class="exchanges-view">
    <PageContent>
      <!-- Exchanges Grid -->
      <div v-if="exchanges.length > 0" class="grid grid-cols-2 gap-6">
        <ExchangeCard
          v-for="exchange in exchanges"
          :key="`${exchange.name}-${exchange.ns}`"
          :exchange="exchange"
          @delete="handleDeleteExchange"
          @view-details="navigateToExchange"
          @bind-queue="handleBindQueue"
        />
      </div>
    </PageContent>

    <!-- Delete Exchange Modal -->
    <DeleteExchangeModal
      :is-visible="showDeleteDialog"
      :exchange-type="exchangeToDeleteType"
      :exchange-name="exchangeToDeleteName"
      :namespace="exchangeToDeleteNs"
      :total-queues="totalQueuesForDelete"
      :total-routing-keys="totalRoutingKeysForDelete"
      :total-binding-patterns="totalBindingPatternsForDelete"
      @deleted="onExchangeDeleted"
      @close="
        showDeleteDialog = false;
        exchangeToDelete = null;
        deleteTotals = null;
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
/* Prevent accidental horizontal overflow on mobile */
.exchanges-view,
.exchanges-view * {
  box-sizing: border-box;
  max-width: 100%;
}

.exchanges-view {
  overflow-x: hidden;
}

/* Ensure smooth transitions and better focus states */
button:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Better responsive text sizing */
@media (max-width: 768px) {
  .text-xl {
    font-size: 1.125rem;
    line-height: 1.75rem;
  }

  /* On small screens, stack cards vertically */
  .grid-cols-2 {
    grid-template-columns: 1fr;
  }
}

/* Grid layout for exchanges */
.grid {
  display: grid;
  gap: 1.5rem;
}

.grid-cols-1 {
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

.grid-cols-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

/* Responsive grid - 2 columns on small screens and up */
@media (min-width: 768px) {
  .sm\:grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* On very small screens, ensure single column */
@media (max-width: 576px) {
  .grid-cols-2,
  .sm\:grid-cols-2 {
    grid-template-columns: 1fr;
  }
}

/* Ensure cards have consistent height in grid */
.exchange-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.exchange-card .card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.exchange-card .card-actions {
  margin-top: auto;
}

/* Grid gap and spacing */
.gap-6 {
  gap: 1.5rem;
}

/* Ensure minimum card height for better visual consistency */
.exchange-card {
  min-height: 200px;
}

/* Card hover effects */
.exchange-card:hover {
  transform: translateY(-2px);
  box-shadow:
    0 10px 25px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease-in-out;
}

/* Loading state for cards */
.exchange-card.loading {
  opacity: 0.7;
  pointer-events: none;
}

/* Focus states for accessibility */
.exchange-card:focus-within {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
  border-color: #3b82f6;
}

.exchange-card button:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
  border-radius: 0.375rem;
}

/* Card action buttons */
.exchange-card .btn-group {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.exchange-card .btn-group button {
  flex: 1;
  min-width: fit-content;
}

/* Status indicators */
.exchange-status {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.exchange-status.active {
  color: #059669;
}

.exchange-status.inactive {
  color: #dc2626;
}

/* Exchange type badges */
.exchange-type-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.exchange-type-badge.fanout {
  background-color: #dbeafe;
  color: #1e40af;
}

.exchange-type-badge.direct {
  background-color: #dcfce7;
  color: #166534;
}

.exchange-type-badge.topic {
  background-color: #fef3c7;
  color: #92400e;
}
</style>

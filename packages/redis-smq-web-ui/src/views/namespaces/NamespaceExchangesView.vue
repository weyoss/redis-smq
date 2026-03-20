<!--
  - Copyright (c)
  - Weyoss <weyoss@outlook.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

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
import { useRoute, useRouter } from 'vue-router';
import { useQueryClient } from '@tanstack/vue-query';
import {
  useGetApiNamespacesNsExchanges,
  getGetApiNamespacesNsExchangesQueryKey,
} from '@/api/generated/namespace-exchanges/namespace-exchanges';
import { useGetApiNamespaces } from '@/api/generated/namespaces/namespaces';
import { usePageContentStore, type PageAction } from '@/stores/pageContent.ts';
import { getErrorMessage } from '@/lib/error.ts';
import PageContent from '@/components/PageContent.vue';
import CreateExchangeModal from '@/components/modals/CreateExchangeModal.vue';
import { EExchangeType } from '@/types/exchanges.ts';
import ExchangeCard from '@/components/cards/ExchangeCard.vue';
import type { GetApiNamespacesNsExchanges200 } from '@/api/model';
import { useSelectedNamespaceStore } from '@/stores/selectedNamespace.ts';

// Composables
const route = useRoute();
const router = useRouter();
const pageContentStore = usePageContentStore();
const queryClient = useQueryClient();
const selectedNamespaceStore = useSelectedNamespaceStore();

// Extract namespace from route
const namespace = computed(() => String(route.params.ns));

// Validation
const isValidRoute = computed(() => !!namespace.value);

// Fetch all namespaces to check if current namespace exists
const {
  data: namespacesData,
  isLoading: isLoadingNamespaces,
  error: namespacesError,
} = useGetApiNamespaces();

const namespaces = computed(() => namespacesData.value?.data || []);

const namespaceExists = computed(() => {
  if (!namespace.value) return false;
  return namespaces.value.includes(namespace.value);
});

// Dialog State (only for create modal - delete is handled by card)
const showCreateDialog = ref(false);

// API Data Fetching - only enabled if namespace exists
const { data, isLoading, error } = useGetApiNamespacesNsExchanges(namespace, {
  query: {
    enabled: computed(() => !!namespace.value && namespaceExists.value),
  },
});

// Normalized Data
const exchanges = computed<GetApiNamespacesNsExchanges200['data']>(
  () => data.value?.data ?? [],
);

const errorMessage = computed(() =>
  getErrorMessage(error.value || namespacesError.value),
);

// Combined loading state
const isLoadingAny = computed(
  () => isLoadingNamespaces.value || isLoading.value,
);

// Combined error state
const hasError = computed(() => !!namespacesError.value || !!error.value);

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

// Navigation helpers
function goBackToNamespaces() {
  selectedNamespaceStore.clearSelectedNamespace();
  router.push({ name: 'Namespaces' });
}

const handleCreateExchange = () => {
  showCreateDialog.value = true;
};

// Handle data changed (after bind/unbind from card)
const onExchangeDataChanged = () => {
  console.log('Exchange data changed, refreshing...');
  // Invalidate the query to force a refetch
  queryClient.invalidateQueries({
    queryKey: getGetApiNamespacesNsExchangesQueryKey(namespace.value),
  });
};

// Post-creation refresh
const onExchangeCreated = () => {
  queryClient.invalidateQueries({
    queryKey: getGetApiNamespacesNsExchangesQueryKey(namespace.value),
  });
  showCreateDialog.value = false;
};

// Handlers
const onExchangeDeleted = () => {
  console.log('Exchange deleted');
  // Invalidate the query to force a refetch
  queryClient.invalidateQueries({
    queryKey: getGetApiNamespacesNsExchangesQueryKey(namespace.value),
  });
};

// Page Content Setup
const pageActions = computed((): PageAction[] => {
  // If namespace doesn't exist, no actions
  if (!namespaceExists.value) {
    return [];
  }

  return [
    {
      id: 'create-exchange',
      label: 'Create Exchange',
      icon: 'bi bi-plus-lg',
      variant: 'primary',
      handler: handleCreateExchange,
      tooltip: 'Create a new exchange by binding a queue to it',
      disabled: isLoadingAny.value,
    },
    {
      id: 'refresh-exchanges',
      label: 'Refresh',
      icon: 'bi bi-arrow-clockwise',
      variant: 'refresh',
      disabled: isLoadingAny.value,
      loading: isLoadingAny.value,
      handler: () => {
        queryClient.invalidateQueries({
          queryKey: getGetApiNamespacesNsExchangesQueryKey(namespace.value),
        });
      },
      tooltip: 'Refresh exchanges list',
    },
  ];
});

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
    pageContentStore.setEmptyState(false);
    pageContentStore.setLoadingState(false);
    return;
  }

  pageContentStore.setPageHeader({
    title: `Exchanges in "${namespace.value}"`,
    subtitle: `View and manage exchanges in the ${namespace.value} namespace`,
    icon: 'bi bi-diagram-3',
  });

  pageContentStore.setPageActions(pageActions.value);
  pageContentStore.setLoadingState(isLoadingAny.value);

  // Check if namespace exists first
  if (!isLoadingNamespaces.value && !namespaceExists.value) {
    pageContentStore.setEmptyState(true, {
      icon: 'bi bi-folder-x',
      title: 'Namespace Not Found',
      message: `The namespace "${namespace.value}" does not exist or has been deleted.`,
      actionLabel: 'Back to Namespaces',
      actionHandler: goBackToNamespaces,
    });
    pageContentStore.setErrorState(null);
    pageContentStore.setPageActions([]);
    return;
  }

  // Handle other states
  if (hasError.value) {
    pageContentStore.setErrorState(errorMessage.value);
    pageContentStore.setEmptyState(false);
  } else if (!isLoadingAny.value && exchanges.value.length === 0) {
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

// Sync selected namespace with store
watchEffect(() => {
  if (namespace.value) {
    selectedNamespaceStore.selectNamespace(namespace.value);
  }
});
</script>

<template>
  <div class="namespace-exchanges-view">
    <PageContent>
      <!-- Namespace Stats Overview - only show if namespace exists and has exchanges -->
      <div
        v-if="
          !isLoadingAny && !hasError && namespaceExists && exchanges.length > 0
        "
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

      <!-- Namespace Info - only show if namespace exists and has exchanges -->
      <div
        v-if="
          !isLoadingAny && !hasError && namespaceExists && exchanges.length > 0
        "
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

      <!-- Exchanges Grid - only show if namespace exists and has exchanges -->
      <div v-if="exchanges.length > 0" class="grid grid-cols-2 gap-6">
        <ExchangeCard
          v-for="exchange in exchanges"
          :key="`${exchange.ns}-${exchange.name}`"
          :exchange="exchange"
          @deleted="onExchangeDeleted"
          @data-changed="onExchangeDataChanged"
        />
      </div>
    </PageContent>

    <!-- Create Exchange Modal (only modal needed at this level) -->
    <CreateExchangeModal
      :is-visible="showCreateDialog"
      @success="onExchangeCreated"
      @cancel="showCreateDialog = false"
    />
  </div>
</template>

<style scoped>
/* Mobile-first safety and overflow guards */
.namespace-exchanges-view,
.namespace-exchanges-view * {
  box-sizing: border-box;
  max-width: 100%;
}

.namespace-exchanges-view {
  overflow-x: hidden; /* avoid horizontal bleed on small screens */
}

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

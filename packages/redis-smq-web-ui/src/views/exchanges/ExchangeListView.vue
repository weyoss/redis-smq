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
import { useQueryClient } from '@tanstack/vue-query';
import {
  useGetApiExchanges,
  getGetApiExchangesQueryKey,
} from '@/api/generated/exchanges/exchanges';
import type { IExchangeParsedParams } from '@/api/model';
import { usePageContentStore, type PageAction } from '@/stores/pageContent.ts';
import { getErrorMessage } from '@/lib/error.ts';
import PageContent from '@/components/PageContent.vue';
import CreateExchangeModal from '@/components/modals/CreateExchangeModal.vue';
import ExchangeCard from '@/components/cards/ExchangeCard.vue';

// Composables
const pageContentStore = usePageContentStore();
const queryClient = useQueryClient();

// Dialog State
const showCreateDialog = ref(false);

// API Data Fetching - Get all exchanges across all namespaces
const { data, isLoading, isError, error, refetch } = useGetApiExchanges();

// Normalized Data
const exchanges = computed<IExchangeParsedParams[]>(
  () => data.value?.data ?? [],
);

const errorMessage = computed(() => getErrorMessage(error.value));

const handleCreateExchange = () => {
  showCreateDialog.value = true;
};

// Handle data changed (after bind/unbind from card)
const onExchangeDataChanged = () => {
  // Refresh the exchanges list
  console.log('handleCreateExchange');
  queryClient.invalidateQueries({
    queryKey: getGetApiExchangesQueryKey(),
  });
};

const onExchangeDeleted = () => {
  console.log('handleExchangeDeleted');
  queryClient.invalidateQueries({
    queryKey: getGetApiExchangesQueryKey(),
  });
};

// Page Content Setup
const pageActions = computed((): PageAction[] => [
  {
    id: 'create-exchange',
    label: 'Create Exchange',
    icon: 'bi bi-plus-lg',
    variant: 'primary',
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

const onExchangeCreated = () => {
  queryClient.invalidateQueries({
    queryKey: getGetApiExchangesQueryKey(),
  });
  showCreateDialog.value = false;
};
</script>

<template>
  <div class="exchanges-view">
    <PageContent>
      <!-- Exchanges Grid -->
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

    <!-- Create Exchange Modal -->
    <CreateExchangeModal
      :is-visible="showCreateDialog"
      @success="onExchangeCreated"
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

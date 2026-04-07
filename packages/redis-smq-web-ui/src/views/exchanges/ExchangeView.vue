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
import { useRoute } from 'vue-router';
import {
  EExchangeType,
  type IExchangeParsedParams,
} from '@/types/exchanges.ts';
import {
  useGetApiNamespacesNsExchangesExchange,
  useGetApiNamespacesNsExchangesExchangeRoutingKeys,
  useGetApiNamespacesNsExchangesExchangeRoutingPatterns,
  useGetApiNamespacesNsExchangesExchangeBindings,
} from '@/api/generated/namespace-exchanges/namespace-exchanges';
import type {
  GetApiNamespacesNsExchangesExchangeBindingsParams,
  IQueueParams,
} from '@/api/model';
import { type PageAction, usePageContentStore } from '@/stores/pageContent.ts';
import { getErrorMessage } from '@/lib/error.ts';
import PageContent from '@/components/PageContent.vue';
import BindQueueModal from '@/components/modals/BindQueueModal.vue';
import UnbindQueueModal from '@/components/modals/UnbindQueueModal.vue';
import DeleteExchangeModal from '@/components/modals/DeleteExchangeModal.vue';
import { useExchangeModals } from '@/composables/useExchangeModals';
import { useTypedRouter } from '@/router/useTypeRouter.ts';

// Composables
const route = useRoute();
const router = useTypedRouter();
const pageContentStore = usePageContentStore();
const modals = useExchangeModals();

// Extract exchange details from route
const exchangeName = computed(() => String(route.params.exchange));
const namespace = computed(() => String(route.params.ns));

// Create exchange object for modal operations
const currentExchange = ref<IExchangeParsedParams | null>(null);

// State for exchange type from API
const exchangeType = ref<EExchangeType>(EExchangeType.DIRECT);
const isLoadingExchange = ref(true);
const exchangeError = ref<Error | null>(null);

// Validation
const isValidRoute = computed(() => !!(exchangeName.value && namespace.value));

// Selected items for operations
const selectedQueueForUnbind = ref<{
  name: string;
  bindingKey?: string;
} | null>(null);

// Filter state
const selectedFilterKey = ref<string>('');

// Fetch exchange details from API to get type
const {
  data: exchangeData,
  isLoading: isLoadingExchangeData,
  error: fetchExchangeError,
  refetch: refetchExchange,
} = useGetApiNamespacesNsExchangesExchange(namespace, exchangeName, {
  query: {
    enabled: isValidRoute,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  },
});

// Update exchange type when data loads
watchEffect(() => {
  if (exchangeData.value?.data) {
    currentExchange.value = exchangeData.value.data;
    exchangeType.value = exchangeData.value.data.type;
  }
  isLoadingExchange.value = isLoadingExchangeData.value;
  exchangeError.value = fetchExchangeError.value as Error | null;
});

// Exchange type specific configurations (now computed based on API data)
const exchangeConfig = computed(() => {
  switch (exchangeType.value) {
    case EExchangeType.DIRECT:
      return {
        icon: 'bi bi-arrow-right',
        title: 'Direct Exchange',
        subtitle: 'Routes messages based on exact routing key matches',
        bindingLabel: 'Routing Key',
        filterLabel: 'Routing Key',
        filterKey: 'routingKey',
        statsKey: 'routingKeys',
        useRoutingKeys: true,
        usePatterns: false,
        useFanout: false,
      };
    case EExchangeType.TOPIC:
      return {
        icon: 'bi bi-hash',
        title: 'Topic Exchange',
        subtitle: 'Routes messages based on routing key patterns',
        bindingLabel: 'Binding Pattern',
        filterLabel: 'Binding Pattern',
        filterKey: 'routingPattern',
        statsKey: 'bindingPatterns',
        useRoutingKeys: false,
        usePatterns: true,
        useFanout: false,
      };
    case EExchangeType.FANOUT:
      return {
        icon: 'bi bi-arrows-angle-expand',
        title: 'Fanout Exchange',
        subtitle: 'Broadcasts messages to all bound queues',
        bindingLabel: 'Queue',
        filterLabel: null,
        filterKey: null,
        statsKey: 'queues',
        useRoutingKeys: false,
        usePatterns: false,
        useFanout: true,
      };
    default:
      return {
        icon: 'bi bi-question',
        title: 'Exchange',
        subtitle: '',
        bindingLabel: '',
        filterLabel: null,
        filterKey: null,
        statsKey: '',
        useRoutingKeys: false,
        usePatterns: false,
        useFanout: false,
      };
  }
});

// --- API Data Fetching (conditional based on exchange type) ---

// Fetch routing keys (for direct exchanges)
const {
  data: routingKeysData,
  isLoading: isLoadingRoutingKeys,
  error: routingKeysError,
  refetch: refetchRoutingKeys,
} = useGetApiNamespacesNsExchangesExchangeRoutingKeys(namespace, exchangeName, {
  query: {
    enabled: computed(
      () =>
        isValidRoute.value &&
        exchangeConfig.value.useRoutingKeys &&
        !isLoadingExchange.value,
    ),
  },
});

// Fetch binding patterns (for topic exchanges)
const {
  data: bindingPatternsData,
  isLoading: isLoadingBindingPatterns,
  error: bindingPatternsError,
  refetch: refetchBindingPatterns,
} = useGetApiNamespacesNsExchangesExchangeRoutingPatterns(
  namespace,
  exchangeName,
  {
    query: {
      enabled: computed(
        () =>
          isValidRoute.value &&
          exchangeConfig.value.usePatterns &&
          !isLoadingExchange.value,
      ),
    },
  },
);

// Fetch all bindings
const {
  data: allBindingsData,
  isLoading: isLoadingAllBindings,
  error: allBindingsError,
  refetch: refetchAllBindings,
} = useGetApiNamespacesNsExchangesExchangeBindings(
  namespace,
  exchangeName,
  undefined,
  {
    query: {
      enabled: computed(() => isValidRoute.value && !isLoadingExchange.value),
    },
  },
);

// Process bindings based on exchange type
const bindingsMap = computed<Map<string, IQueueParams[]>>(() => {
  const map = new Map<string, IQueueParams[]>();
  const data = allBindingsData.value?.data;

  if (exchangeConfig.value.useFanout) {
    // For fanout, data is an array of queues
    if (Array.isArray(data)) {
      map.set('default', data);
    }
  } else if (data && typeof data === 'object' && !Array.isArray(data)) {
    // For direct/topic, data is an object mapping keys to queues
    Object.entries(data).forEach(([key, queues]) => {
      if (Array.isArray(queues)) {
        map.set(key, queues);
      }
    });
  }

  return map;
});

// Get all binding keys (routing keys or patterns)
const bindingKeys = computed<string[]>(() => {
  if (exchangeConfig.value.useRoutingKeys) {
    return routingKeysData.value?.data || [];
  }
  if (exchangeConfig.value.usePatterns) {
    return bindingPatternsData.value?.data || [];
  }
  return []; // For fanout
});

// Fetch filtered bindings
const {
  data: filteredBindingsData,
  isLoading: isLoadingFilteredBindings,
  refetch: refetchFilteredBindings,
} = useGetApiNamespacesNsExchangesExchangeBindings(
  namespace,
  exchangeName,
  computed(() => {
    const params: GetApiNamespacesNsExchangesExchangeBindingsParams = {};
    if (selectedFilterKey.value && exchangeConfig.value.filterKey) {
      if (exchangeConfig.value.filterKey === 'routingKey') {
        params.routingKey = selectedFilterKey.value;
      }
      if (exchangeConfig.value.filterKey === 'routingPattern') {
        params.routingPattern = selectedFilterKey.value;
      }
    }
    return params;
  }),
  {
    query: {
      enabled: computed(
        () =>
          isValidRoute.value &&
          !!selectedFilterKey.value &&
          !!exchangeConfig.value.filterKey &&
          !isLoadingExchange.value,
      ),
    },
  },
);

// Process filtered bindings
const filteredQueues = computed<IQueueParams[]>(() => {
  const data = filteredBindingsData.value?.data;
  if (Array.isArray(data)) {
    return data;
  }
  return [];
});

// --- Computed Properties for Display ---

// All binding keys with their queue counts
const bindingKeysWithCounts = computed(() => {
  if (exchangeConfig.value.useFanout) {
    // For fanout, we just have one group
    return [
      {
        key: 'default',
        queueCount: bindingsMap.value.get('default')?.length || 0,
      },
    ];
  }

  return bindingKeys.value.map((key) => ({
    key,
    queueCount: bindingsMap.value.get(key)?.length || 0,
  }));
});

// Total queues across all bindings
const totalQueues = computed(() => {
  let total = 0;
  bindingsMap.value.forEach((queues) => {
    total += queues.length;
  });
  return total;
});

// Total binding keys (routing keys or patterns)
const totalBindingKeys = computed(() => {
  if (exchangeConfig.value.useFanout) {
    return bindingsMap.value.has('default') ? 1 : 0;
  }
  return bindingKeys.value.length;
});

// Queue bindings for display
const queueBindings = computed(() => {
  const bindings: Array<{
    bindingKey: string;
    queues: IQueueParams[];
    totalQueues: number;
  }> = [];

  if (selectedFilterKey.value && exchangeConfig.value.filterKey) {
    // Show only selected binding
    const queues = filteredQueues.value;
    bindings.push({
      bindingKey: selectedFilterKey.value,
      queues,
      totalQueues: queues.length,
    });
  } else if (exchangeConfig.value.useFanout) {
    // Show all queues for fanout
    const queues = bindingsMap.value.get('default') || [];
    bindings.push({
      bindingKey: 'default',
      queues,
      totalQueues: queues.length,
    });
  } else {
    // Show all binding keys
    bindingsMap.value.forEach((queues, key) => {
      bindings.push({
        bindingKey: key,
        queues,
        totalQueues: queues.length,
      });
    });
  }

  return bindings;
});

// --- Computed Properties ---

const isLoading = computed(() => {
  return (
    isLoadingExchange.value ||
    (exchangeConfig.value.useRoutingKeys && isLoadingRoutingKeys.value) ||
    (exchangeConfig.value.usePatterns && isLoadingBindingPatterns.value) ||
    isLoadingAllBindings.value ||
    isLoadingFilteredBindings.value
  );
});

const hasError = computed(() => {
  return (
    !!exchangeError.value ||
    (exchangeConfig.value.useRoutingKeys && !!routingKeysError.value) ||
    (exchangeConfig.value.usePatterns && !!bindingPatternsError.value) ||
    !!allBindingsError.value
  );
});

const errorMessage = computed(() => {
  if (exchangeError.value) return getErrorMessage(exchangeError.value);
  if (exchangeConfig.value.useRoutingKeys && routingKeysError.value) {
    return getErrorMessage(routingKeysError.value);
  }
  if (exchangeConfig.value.usePatterns && bindingPatternsError.value) {
    return getErrorMessage(bindingPatternsError.value);
  }
  if (allBindingsError.value) return getErrorMessage(allBindingsError.value);
  return null;
});

// --- Event Handlers ---

const handleBindQueue = () => {
  if (currentExchange.value) {
    modals.openBindModal(currentExchange.value);
  }
};

const handleUnbindQueue = (queueName: string, bindingKey?: string) => {
  selectedQueueForUnbind.value = { name: queueName, bindingKey };
  if (currentExchange.value) {
    modals.openUnbindModal(currentExchange.value, queueName, bindingKey);
  }
};

const handleDeleteExchange = () => {
  if (currentExchange.value) {
    modals.openDeleteModal(currentExchange.value);
  }
};

const handleRefresh = () => {
  refetchExchange();
  if (exchangeConfig.value.useRoutingKeys) {
    refetchRoutingKeys();
  }
  if (exchangeConfig.value.usePatterns) {
    refetchBindingPatterns();
  }
  refetchAllBindings();
  if (selectedFilterKey.value) {
    refetchFilteredBindings();
  }
};

const clearFilter = () => {
  selectedFilterKey.value = '';
};

const handleBindSuccess = () => {
  modals.closeModals();
  // Refresh data after successful bind
  refetchExchange();
  if (exchangeConfig.value.useRoutingKeys) {
    refetchRoutingKeys();
  }
  if (exchangeConfig.value.usePatterns) {
    refetchBindingPatterns();
  }
  refetchAllBindings();
};

const handleUnbindSuccess = () => {
  modals.closeModals();
  // Refresh data after successful unbind
  refetchExchange();
  if (exchangeConfig.value.useRoutingKeys) {
    refetchRoutingKeys();
  }
  if (exchangeConfig.value.usePatterns) {
    refetchBindingPatterns();
  }
  refetchAllBindings();
  selectedQueueForUnbind.value = null;
};

// After successful deletion, navigate away
const onDeleted = () => {
  modals.closeModals();
  router.push('exchanges');
};

// --- Page Content Setup ---

const pageActions = computed((): PageAction[] => [
  {
    id: 'bind-queue',
    label: 'Bind Queue',
    icon: 'bi bi-link-45deg',
    variant: 'primary',
    disabled: isLoading.value,
    handler: handleBindQueue,
    tooltip: `Bind a queue to this ${exchangeConfig.value.title}`,
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
    disabled: modals.showDeleteModal.value || totalBindingKeys.value > 0,
    handler: handleDeleteExchange,
    tooltip:
      totalBindingKeys.value > 0
        ? 'Cannot delete exchange with bindings. Remove all bindings first.'
        : 'Delete this exchange',
  },
]);

// Pattern example generator for topic exchanges
const getPatternExample = (pattern: string): string => {
  if (exchangeConfig.value.usePatterns) {
    let example = pattern
      .replace(/\*/g, 'word')
      .replace(/#/g, 'any.nested.keys');
    if (!pattern.includes('*') && !pattern.includes('#')) {
      return pattern;
    }
    return example;
  }
  return '';
};

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

  if (!isLoadingExchange.value && currentExchange.value) {
    pageContentStore.setPageHeader({
      title: `${exchangeConfig.value.title}: ${exchangeName.value}`,
      subtitle: `Namespace: ${namespace.value} • ${exchangeConfig.value.subtitle}`,
      icon: exchangeConfig.value.icon,
    });
  }

  pageContentStore.setPageActions(pageActions.value);
  pageContentStore.setLoadingState(isLoading.value);

  if (hasError.value) {
    pageContentStore.setErrorState(errorMessage.value);
    pageContentStore.setEmptyState(false);
  } else if (
    !isLoading.value &&
    totalBindingKeys.value === 0 &&
    currentExchange.value
  ) {
    const emptyStateMessage = exchangeConfig.value.useFanout
      ? 'This fanout exchange has no queue bindings. Bind a queue to start broadcasting messages.'
      : `This ${exchangeConfig.value.title.toLowerCase()} has no ${exchangeConfig.value.statsKey}. Bind a queue with a ${exchangeConfig.value.bindingLabel.toLowerCase()} to start routing messages.`;

    pageContentStore.setErrorState(null);
    pageContentStore.setEmptyState(true, {
      icon: exchangeConfig.value.icon,
      title: `No ${exchangeConfig.value.statsKey}`,
      message: emptyStateMessage,
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
    router.push('exchanges');
  }
});

// Reset modal state when component unmounts
onMounted(() => {
  modals.closeModals();
});
</script>

<template>
  <div class="exchange-view">
    <PageContent>
      <!-- Loading State for Exchange Data -->
      <div v-if="isLoadingExchange" class="loading-state">
        <i class="bi bi-arrow-repeat spin" aria-hidden="true"></i>
        <span>Loading exchange data...</span>
      </div>

      <!-- Error State -->
      <div v-else-if="exchangeError" class="error-state">
        <i class="bi bi-exclamation-triangle-fill" aria-hidden="true"></i>
        <h3>Failed to Load Exchange</h3>
        <p>{{ getErrorMessage(exchangeError) }}</p>
        <button class="btn btn-primary" @click="() => refetchExchange">
          <i class="bi bi-arrow-clockwise me-2"></i>
          Try Again
        </button>
      </div>

      <!-- Exchange Content -->
      <template v-else-if="currentExchange">
        <!-- Exchange Overview Stats -->
        <div
          v-if="!isLoading && !hasError && totalBindingKeys > 0"
          class="stats-overview"
        >
          <div class="stats-grid">
            <!-- First stat card (keys/patterns/queues) -->
            <div class="stat-card">
              <div class="stat-icon" :class="exchangeConfig.statsKey">
                <i :class="exchangeConfig.icon" aria-hidden="true"></i>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ totalBindingKeys }}</div>
                <div class="stat-label">
                  {{
                    exchangeConfig.statsKey === 'routingKeys'
                      ? 'Routing Keys'
                      : exchangeConfig.statsKey === 'bindingPatterns'
                        ? 'Binding Patterns'
                        : 'Bound Queues'
                  }}
                </div>
              </div>
            </div>

            <!-- Second stat card (queues) -->
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

            <!-- Third stat card for fanout (message delivery) -->
            <div v-if="exchangeConfig.useFanout" class="stat-card">
              <div class="stat-icon broadcast">
                <i class="bi bi-broadcast" aria-hidden="true"></i>
              </div>
              <div class="stat-content">
                <div class="stat-value">100%</div>
                <div class="stat-label">Message Delivery</div>
              </div>
            </div>
          </div>

          <!-- Filter controls (for direct/topic exchanges) -->
          <div
            v-if="!exchangeConfig.useFanout && bindingKeysWithCounts.length > 0"
            class="filter-controls"
          >
            <label :for="`${exchangeConfig.filterKey}Filter`">
              View Bindings for:
            </label>
            <select
              :id="`${exchangeConfig.filterKey}Filter`"
              v-model="selectedFilterKey"
            >
              <option value="">
                All
                {{
                  exchangeConfig.statsKey === 'routingKeys'
                    ? 'Routing Keys'
                    : 'Binding Patterns'
                }}
              </option>
              <option
                v-for="item in bindingKeysWithCounts"
                :key="item.key"
                :value="item.key"
              >
                {{ item.key }} ({{ item.queueCount }}
                {{ item.queueCount === 1 ? 'queue' : 'queues' }})
              </option>
            </select>
            <button
              v-if="selectedFilterKey"
              type="button"
              class="btn-clear-filter"
              aria-label="Clear filter"
              @click="clearFilter"
            >
              <i class="bi bi-x-circle"></i>
            </button>
          </div>
        </div>

        <!-- Exchange Info (for fanout) -->
        <div
          v-if="
            exchangeConfig.useFanout &&
            !isLoading &&
            !hasError &&
            totalQueues > 0
          "
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

        <!-- Queue Bindings -->
        <div
          v-if="!isLoading && !hasError && queueBindings.length > 0"
          class="bindings-section"
        >
          <div class="section-header">
            <h2 class="section-title">
              <i class="bi bi-diagram-3" aria-hidden="true"></i>
              <span v-if="selectedFilterKey && !exchangeConfig.useFanout">
                Bindings for "{{ selectedFilterKey }}"
              </span>
              <span v-else-if="exchangeConfig.useFanout"> Bound Queues </span>
              <span v-else> All Queue Bindings </span>
            </h2>
            <button
              v-if="selectedFilterKey && !exchangeConfig.useFanout"
              type="button"
              class="btn-back"
              @click="clearFilter"
            >
              <i class="bi bi-arrow-left"></i>
              Back to All
              {{
                exchangeConfig.statsKey === 'routingKeys'
                  ? 'Routing Keys'
                  : 'Patterns'
              }}
            </button>
          </div>

          <div class="bindings-list">
            <div
              v-for="binding in queueBindings"
              :key="binding.bindingKey"
              class="binding-card"
            >
              <!-- Header (only for non-fanout or when not showing single binding) -->
              <div
                v-if="!exchangeConfig.useFanout || !selectedFilterKey"
                class="binding-header"
              >
                <div class="binding-key-info">
                  <div
                    class="binding-key-badge"
                    :title="exchangeConfig.bindingLabel"
                  >
                    <i :class="exchangeConfig.icon" aria-hidden="true"></i>
                    <span class="binding-key-text">{{
                      binding.bindingKey
                    }}</span>
                  </div>
                  <div class="queue-count">
                    {{ binding.totalQueues }}
                    {{ binding.totalQueues === 1 ? 'queue' : 'queues' }}
                  </div>
                </div>

                <!-- Pattern explanation for topic exchanges -->
                <div
                  v-if="
                    exchangeConfig.usePatterns &&
                    binding.bindingKey !== 'default'
                  "
                  class="pattern-explanation"
                >
                  <i class="bi bi-info-circle" aria-hidden="true"></i>
                  <span class="explanation-text">
                    Matches routing keys like:
                    {{ getPatternExample(binding.bindingKey) }}
                  </span>
                </div>
              </div>

              <!-- Queues list -->
              <div class="queues-list">
                <div
                  v-for="queue in binding.queues"
                  :key="`${binding.bindingKey}-${queue.name}`"
                  class="queue-item"
                >
                  <div class="queue-info">
                    <i class="bi bi-box" aria-hidden="true"></i>
                    <span class="queue-name">{{ queue.name }}</span>
                    <span class="queue-namespace">{{ queue.ns }}</span>
                  </div>
                  <button
                    type="button"
                    class="btn-unbind"
                    :disabled="modals.showUnbindModal.value"
                    :aria-label="`Unbind queue ${queue.name}${binding.bindingKey !== 'default' ? ` from ${exchangeConfig.bindingLabel.toLowerCase()} ${binding.bindingKey}` : ''}`"
                    @click="
                      handleUnbindQueue(
                        queue.name,
                        binding.bindingKey !== 'default'
                          ? binding.bindingKey
                          : undefined,
                      )
                    "
                  >
                    <i class="bi bi-x-circle" aria-hidden="true"></i>
                    <span>Unbind</span>
                  </button>
                </div>
              </div>

              <!-- No queues placeholder -->
              <div v-if="!binding.queues.length" class="no-queues">
                <i class="bi bi-inbox" aria-hidden="true"></i>
                <span
                  >No queues bound to this
                  {{ exchangeConfig.bindingLabel.toLowerCase() }}</span
                >
              </div>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="loading-state">
          <i class="bi bi-arrow-repeat spin" aria-hidden="true"></i>
          <span>Loading exchange data...</span>
        </div>
      </template>
    </PageContent>

    <!-- Delete Exchange Modal (using shared modal state) -->
    <DeleteExchangeModal
      :is-visible="modals.showDeleteModal.value"
      :exchange-type="exchangeType"
      :exchange-name="exchangeName"
      :namespace="namespace"
      :total-queues="totalQueues"
      :total-routing-keys="
        exchangeConfig.useRoutingKeys ? totalBindingKeys : undefined
      "
      :total-binding-patterns="
        exchangeConfig.usePatterns ? totalBindingKeys : undefined
      "
      @deleted="onDeleted"
      @close="modals.closeModals"
    />

    <!-- Bind Queue Modal (using shared modal state) -->
    <BindQueueModal
      :is-visible="modals.showBindModal.value"
      :exchange-type="
        exchangeConfig.useFanout
          ? 'fanout'
          : exchangeConfig.useRoutingKeys
            ? 'direct'
            : 'topic'
      "
      :exchange-name="exchangeName"
      :namespace="namespace"
      @close="modals.closeModals"
      @success="handleBindSuccess"
    />

    <!-- Unbind Queue Modal (using shared modal state) -->
    <UnbindQueueModal
      v-if="selectedQueueForUnbind"
      :is-visible="modals.showUnbindModal.value"
      :queue-name="selectedQueueForUnbind.name"
      :exchange-name="exchangeName"
      :namespace="namespace"
      :exchange-type="
        exchangeConfig.useFanout
          ? 'fanout'
          : exchangeConfig.useRoutingKeys
            ? 'direct'
            : 'topic'
      "
      :routing-key="
        exchangeConfig.useRoutingKeys
          ? selectedQueueForUnbind.bindingKey
          : undefined
      "
      :binding-pattern="
        exchangeConfig.usePatterns
          ? selectedQueueForUnbind.bindingKey
          : undefined
      "
      @close="modals.closeModals"
      @success="handleUnbindSuccess"
    />
  </div>
</template>

<style scoped>
/* Keep all existing styles */
.exchange-view,
.exchange-view * {
  box-sizing: border-box;
  max-width: 100%;
}

.exchange-view {
  --content-padding: clamp(12px, 2.8vw, 24px);
  padding: var(--content-padding);
  padding-bottom: calc(var(--content-padding) + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  gap: clamp(12px, 2.2vw, 24px);
  overflow-x: hidden;
}

/* Add error state styles */
.error-state {
  text-align: center;
  padding: 3rem;
  border-radius: 12px;
  border: 1px solid #f5c2c7;
  background-color: #f8d7da;
}

.error-state i {
  font-size: 3rem;
  color: #dc3545;
  margin-bottom: 1rem;
}

.error-state h3 {
  color: #721c24;
  margin-bottom: 0.5rem;
}

.error-state p {
  color: #721c24;
  margin-bottom: 1.5rem;
}

/* Keep all other existing styles from original */
.stats-overview {
  margin-bottom: clamp(16px, 2.5vw, 24px);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: clamp(12px, 2.2vw, 20px);
  margin-bottom: 1rem;
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
  transition: all 0.2s ease;
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

.stat-icon.routingKeys {
  background: #fff3cd;
  color: #856404;
}

.stat-icon.bindingPatterns {
  background: #e2d9f3;
  color: #5a2a94;
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
  min-width: 0;
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
}

.filter-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.filter-controls label {
  font-weight: 500;
  color: #495057;
}

.filter-controls select {
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  background: white;
  min-width: 250px;
  font-family: monospace;
}

.btn-clear-filter {
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  font-size: 1rem;
  transition: color 0.2s ease;
}

.btn-clear-filter:hover {
  color: #dc3545;
}

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
}

.info-header h3 {
  margin: 0;
  font-size: clamp(1rem, 2.8vw, 1.125rem);
  font-weight: 600;
  color: #212529;
}

.info-description {
  margin: 0;
  color: #495057;
  line-height: 1.5;
  font-size: 0.95rem;
  overflow-wrap: anywhere;
}

.bindings-section {
  margin-top: clamp(12px, 2.5vw, 24px);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: clamp(12px, 2.2vw, 20px);
  flex-wrap: wrap;
  gap: 1rem;
}

.section-title {
  font-size: clamp(1.25rem, 3.8vw, 1.5rem);
  font-weight: 600;
  color: #212529;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  overflow-wrap: anywhere;
}

.btn-back {
  background: none;
  border: 1px solid #6c757d;
  color: #6c757d;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
}

.btn-back:hover {
  background: #6c757d;
  color: white;
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
}

.binding-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.binding-header {
  background: #f8f9fa;
  padding: clamp(12px, 2.2vw, 20px) clamp(14px, 2.2vw, 24px);
  border-bottom: 1px solid #e9ecef;
}

.binding-key-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: clamp(10px, 2vw, 16px);
  min-width: 0;
}

.binding-key-badge {
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

.binding-key-badge:has(.bi-hash) {
  background: #e2d9f3;
  color: #5a2a94;
}

.binding-key-text {
  font-family: monospace;
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

.pattern-explanation {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6c757d;
  background: #e7f3ff;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  border-left: 3px solid #0d6efd;
  margin-top: 0.75rem;
  overflow-wrap: anywhere;
}

.explanation-text {
  font-family: monospace;
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
  min-width: 0;
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
  font-family: monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.queue-namespace {
  font-size: 0.75rem;
  color: #6c757d;
  background: #dee2e6;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.btn-unbind {
  background: none;
  border: 1px solid #dc3545;
  color: #dc3545;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.2s ease;
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

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem;
  color: #6c757d;
  font-size: 1.1rem;
}

.loading-state i {
  font-size: 1.5rem;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .filter-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-controls select {
    width: 100%;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .binding-key-info {
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
    white-space: normal;
  }

  .btn-unbind {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 576px) {
  .binding-key-badge {
    width: 100%;
    justify-content: flex-start;
  }

  .stat-icon {
    width: 40px;
    height: 40px;
    font-size: 1.25rem;
  }

  .stat-value {
    font-size: 1.25rem;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .stat-card,
  .btn-back,
  .btn-unbind,
  .queue-item,
  .spin {
    animation: none;
    transition: none;
  }

  .stat-card:hover,
  .btn-back:hover,
  .btn-unbind:hover,
  .queue-item:hover {
    transform: none;
  }
}
</style>

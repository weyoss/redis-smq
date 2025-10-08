<!--
  - Copyright (c)
  - Weyoss <weyoss@protonmail.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import { EExchangeType } from '@/types';

// API hooks for fetching routing keys and binding patterns
import { useGetApiV1NamespacesNsExchangesDirectDirectRoutingKeys } from '@/api/generated/direct-exchange/direct-exchange';
import { useGetApiV1NamespacesNsExchangesTopicTopicBindingPatterns } from '@/api/generated/topic-exchange/topic-exchange';

// API hooks for fetching queue data for different exchange types
import { useGetApiV1NamespacesNsExchangesDirectDirectQueues } from '@/api/generated/direct-exchange/direct-exchange';
import { useGetApiV1NamespacesNsExchangesFanoutFanoutQueues } from '@/api/generated/fanout-exchange/fanout-exchange';
import { useGetApiV1NamespacesNsExchangesTopicTopicQueues } from '@/api/generated/topic-exchange/topic-exchange';

import type {
  GetApiV1NamespacesNsExchangesDirectDirectQueuesParams,
  GetApiV1NamespacesNsExchangesTopicTopicQueuesParams,
} from '@/api/model';
import { getErrorMessage } from '@/lib/error';

// Define the shape of a single exchange object
interface Exchange {
  name: string;
  ns: string;
  type: EExchangeType;
}

interface QueueData {
  items: string[];
  total: number;
  routingKeys?: string[];
  bindingPatterns?: string[];
}

const props = defineProps<{
  exchange: Exchange;
  isDeleting?: boolean;
}>();

const emit = defineEmits<{
  (e: 'delete', payload: Exchange): void;
  (e: 'viewDetails', payload: Exchange): void;
  (e: 'bindQueue', payload: Exchange): void;
  (e: 'unbindQueue', payload: { exchange: Exchange; queueName: string }): void;
  (e: 'publishMessage', payload: Exchange): void;
}>();

// --- Step 1: Fetch Routing Keys and Binding Patterns ---

// Reactive parameters to control when queries should run
const shouldFetchRoutingKeys = computed(
  () => props.exchange.type === EExchangeType.DIRECT,
);
const shouldFetchBindingPatterns = computed(
  () => props.exchange.type === EExchangeType.TOPIC,
);
const shouldFetchFanoutQueues = computed(
  () => props.exchange.type === EExchangeType.FANOUT,
);

// Fetch routing keys for Direct exchanges
const {
  data: routingKeysData,
  isLoading: isLoadingRoutingKeys,
  error: routingKeysError,
  refetch: refetchRoutingKeys,
} = useGetApiV1NamespacesNsExchangesDirectDirectRoutingKeys(
  computed(() => props.exchange.ns),
  computed(() => props.exchange.name),
  {
    query: {
      enabled: shouldFetchRoutingKeys,
    },
  },
);

// Fetch binding patterns for Topic exchanges
const {
  data: bindingPatternsData,
  isLoading: isLoadingBindingPatterns,
  error: bindingPatternsError,
  refetch: refetchBindingPatterns,
} = useGetApiV1NamespacesNsExchangesTopicTopicBindingPatterns(
  computed(() => props.exchange.ns),
  computed(() => props.exchange.name),
  {
    query: {
      enabled: shouldFetchBindingPatterns,
    },
  },
);

// For Fanout exchanges: direct fetch (no parameters needed)
const {
  data: fanoutQueuesData,
  isLoading: isLoadingFanoutQueues,
  error: fanoutQueuesError,
  refetch: refetchFanoutQueues,
} = useGetApiV1NamespacesNsExchangesFanoutFanoutQueues(
  computed(() => props.exchange.ns),
  computed(() => props.exchange.name),
  {
    query: {
      enabled: shouldFetchFanoutQueues,
    },
  },
);

// Extract routing keys and binding patterns
const routingKeys = computed(() => {
  if (props.exchange.type !== EExchangeType.DIRECT) return [];
  return routingKeysData.value?.data || [];
});

const bindingPatterns = computed(() => {
  if (props.exchange.type !== EExchangeType.TOPIC) return [];
  return bindingPatternsData.value?.data || [];
});

// --- Step 2: Fetch Queues Using the Keys/Patterns ---

// Create individual query hooks for direct exchange queues
// We'll create a reasonable maximum number and enable/disable them as needed
const maxQueries = 10; // Reasonable limit for routing keys/binding patterns

const directQueueQueries = Array.from({ length: maxQueries }, (_, index) => {
  const routingKey = computed(() => routingKeys.value[index] || '');
  const shouldEnable = computed(
    () =>
      props.exchange.type === EExchangeType.DIRECT &&
      index < routingKeys.value.length &&
      !!routingKeys.value[index],
  );

  return useGetApiV1NamespacesNsExchangesDirectDirectQueues(
    computed(() => props.exchange.ns),
    computed(() => props.exchange.name),
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

const topicQueueQueries = Array.from({ length: maxQueries }, (_, index) => {
  const bindingPattern = computed(() => bindingPatterns.value[index] || '');
  const shouldEnable = computed(
    () =>
      props.exchange.type === EExchangeType.TOPIC &&
      index < bindingPatterns.value.length &&
      !!bindingPatterns.value[index],
  );

  return useGetApiV1NamespacesNsExchangesTopicTopicQueues(
    computed(() => props.exchange.ns),
    computed(() => props.exchange.name),
    computed(
      () =>
        ({
          bindingPattern: bindingPattern.value,
        }) as GetApiV1NamespacesNsExchangesTopicTopicQueuesParams,
    ),
    {
      query: {
        enabled: shouldEnable,
      },
    },
  );
});

// --- Unified Loading and Error States ---

const isLoadingData = computed(() => {
  switch (props.exchange.type) {
    case EExchangeType.DIRECT:
      return (
        isLoadingRoutingKeys.value ||
        directQueueQueries.some(
          (query, index) =>
            index < routingKeys.value.length && query.isLoading.value,
        )
      );
    case EExchangeType.FANOUT:
      return isLoadingFanoutQueues.value;
    case EExchangeType.TOPIC:
      return (
        isLoadingBindingPatterns.value ||
        topicQueueQueries.some(
          (query, index) =>
            index < bindingPatterns.value.length && query.isLoading.value,
        )
      );
    default:
      return false;
  }
});

const queuesError = computed(() => {
  switch (props.exchange.type) {
    case EExchangeType.DIRECT:
      return (
        routingKeysError.value ||
        directQueueQueries.find(
          (query, index) =>
            index < routingKeys.value.length && query.error.value,
        )?.error.value
      );
    case EExchangeType.FANOUT:
      return fanoutQueuesError.value;
    case EExchangeType.TOPIC:
      return (
        bindingPatternsError.value ||
        topicQueueQueries.find(
          (query, index) =>
            index < bindingPatterns.value.length && query.error.value,
        )?.error.value
      );
    default:
      return null;
  }
});

const hasError = computed(() => !!queuesError.value);
const errorMessage = computed(() => getErrorMessage(queuesError.value));

const handleRetryLoadQueues = () => {
  switch (props.exchange.type) {
    case EExchangeType.DIRECT:
      refetchRoutingKeys();
      directQueueQueries.forEach((query, index) => {
        if (index < routingKeys.value.length) {
          query.refetch();
        }
      });
      break;
    case EExchangeType.FANOUT:
      refetchFanoutQueues();
      break;
    case EExchangeType.TOPIC:
      refetchBindingPatterns();
      topicQueueQueries.forEach((query, index) => {
        if (index < bindingPatterns.value.length) {
          query.refetch();
        }
      });
      break;
  }
};

// --- Process Queue Data ---

const queues = computed<QueueData>(() => {
  let allQueues: string[] = [];
  let routingKeysUsed: string[] = [];
  let bindingPatternsUsed: string[] = [];
  const exchangeType = props.exchange.type;

  if (exchangeType === EExchangeType.DIRECT) {
    // Combine queues from all routing keys
    directQueueQueries.forEach((query, index) => {
      if (index >= routingKeys.value.length) return;

      const queueData = query.data?.value?.data;
      if (queueData && Array.isArray(queueData)) {
        const queuesForKey = queueData.map((q) => q.name).filter(Boolean);
        allQueues.push(...queuesForKey);
        if (queuesForKey.length > 0) {
          routingKeysUsed.push(routingKeys.value[index]);
        }
      }
    });
  } else if (exchangeType === EExchangeType.FANOUT) {
    const fanoutData = fanoutQueuesData.value?.data;
    if (fanoutData && Array.isArray(fanoutData)) {
      allQueues = fanoutData.map((q) => q.name).filter(Boolean);
    }
  } else {
    // Combine queues from all binding patterns
    topicQueueQueries.forEach((query, index) => {
      if (index >= bindingPatterns.value.length) return;

      const queueData = query.data?.value?.data;
      if (queueData && Array.isArray(queueData)) {
        const queuesForPattern = queueData.map((q) => q.name).filter(Boolean);
        allQueues.push(...queuesForPattern);
        if (queuesForPattern.length > 0) {
          bindingPatternsUsed.push(bindingPatterns.value[index]);
        }
      }
    });
  }

  // Remove duplicates
  const uniqueQueues = [...new Set(allQueues)];

  return {
    items: uniqueQueues,
    total: uniqueQueues.length,
    routingKeys: routingKeysUsed,
    bindingPatterns: bindingPatternsUsed,
  };
});

// --- UI State and Interaction Logic ---

// Dropdown menu state
const showDropdown = ref(false);
const dropdown = ref<HTMLElement | null>(null);

const handleClickOutside = (event: MouseEvent) => {
  if (dropdown.value && !dropdown.value.contains(event.target as Node)) {
    showDropdown.value = false;
  }
};

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && showDropdown.value) {
    showDropdown.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  document.addEventListener('keydown', handleKeyDown);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
  document.removeEventListener('keydown', handleKeyDown);
});

// Computed properties for dynamic styling and data
const exchangeTypeDetails = computed(() => {
  switch (props.exchange.type) {
    case EExchangeType.DIRECT:
      return {
        icon: 'bi-arrow-right',
        color: 'direct',
        name: 'Direct',
        description:
          'Routes messages to queues based on exact routing key matches',
      };
    case EExchangeType.FANOUT:
      return {
        icon: 'bi-arrows-angle-expand',
        color: 'fanout',
        name: 'Fanout',
        description: 'Broadcasts messages to all bound queues',
      };
    case EExchangeType.TOPIC:
      return {
        icon: 'bi-hash',
        color: 'topic',
        name: 'Topic',
        description: 'Routes messages based on routing key patterns',
      };
    default:
      return {
        icon: 'bi-question-circle',
        color: 'gray',
        name: 'Unknown',
        description: 'Unknown exchange type',
      };
  }
});

const sampleQueues = computed(() => queues.value.items.slice(0, 3));
const remainingQueuesCount = computed(() =>
  Math.max(0, queues.value.total - sampleQueues.value.length),
);

// Show metadata info for Direct and Topic exchanges
const metadataInfo = computed(() => {
  switch (props.exchange.type) {
    case EExchangeType.DIRECT:
      return queues.value.routingKeys?.length
        ? `${queues.value.routingKeys.length} routing key${queues.value.routingKeys.length > 1 ? 's' : ''}`
        : null;
    case EExchangeType.TOPIC:
      return queues.value.bindingPatterns?.length
        ? `${queues.value.bindingPatterns.length} binding pattern${queues.value.bindingPatterns.length > 1 ? 's' : ''}`
        : null;
    default:
      return null;
  }
});

// Event handlers
const handleDelete = () => {
  showDropdown.value = false;
  emit('delete', props.exchange);
};

const handleBindQueue = () => {
  showDropdown.value = false;
  emit('bindQueue', props.exchange);
};

const handleUnbindQueue = (queueName: string) => {
  showDropdown.value = false;
  emit('unbindQueue', { exchange: props.exchange, queueName });
};

const handlePublishMessage = () => {
  showDropdown.value = false;
  emit('publishMessage', props.exchange);
};

const handleViewDetails = () => {
  emit('viewDetails', props.exchange);
};

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value;
};
</script>

<template>
  <article
    class="exchange-card"
    :class="{ 'is-deleting': isDeleting }"
    role="article"
    :aria-label="`${exchangeTypeDetails.name} exchange ${exchange.name} in ${exchange.ns} namespace`"
  >
    <!-- Deleting Overlay -->
    <div
      v-if="isDeleting"
      class="loading-overlay"
      role="status"
      aria-live="polite"
    >
      <div
        class="spinner-border text-light"
        role="status"
        aria-hidden="true"
      ></div>
      <span class="loading-text">Deleting exchange...</span>
    </div>

    <!-- Card Header -->
    <header class="card-header">
      <div class="header-content">
        <div
          :class="['header-icon', exchangeTypeDetails.color]"
          :title="exchangeTypeDetails.description"
        >
          <i :class="['bi', exchangeTypeDetails.icon]" aria-hidden="true"></i>
        </div>
        <div class="header-text">
          <h3 class="card-title" :title="exchange.name">
            {{ exchange.name }}
          </h3>
          <span class="card-subtitle">
            {{ exchangeTypeDetails.name }} Exchange in '{{ exchange.ns }}'
          </span>
        </div>
      </div>

      <div ref="dropdown" class="actions-menu">
        <button
          type="button"
          class="btn-actions"
          :aria-label="`More options for ${exchange.name} exchange`"
          :aria-expanded="showDropdown"
          aria-haspopup="true"
          @click="toggleDropdown"
          @keydown.enter="toggleDropdown"
          @keydown.space.prevent="toggleDropdown"
        >
          <i class="bi bi-three-dots-vertical" aria-hidden="true"></i>
        </button>

        <transition name="dropdown">
          <div
            v-if="showDropdown"
            class="dropdown-menu"
            role="menu"
            aria-label="Exchange actions"
          >
            <button
              type="button"
              class="dropdown-item"
              role="menuitem"
              @click="handleBindQueue"
            >
              <i class="bi bi-link-45deg" aria-hidden="true"></i>
              <span>Bind Queue</span>
            </button>

            <button
              type="button"
              class="dropdown-item"
              role="menuitem"
              @click="handlePublishMessage"
            >
              <i class="bi bi-send" aria-hidden="true"></i>
              <span>Publish Message</span>
            </button>

            <div class="dropdown-divider" role="separator"></div>

            <button
              type="button"
              class="dropdown-item danger"
              role="menuitem"
              @click="handleDelete"
            >
              <i class="bi bi-trash" aria-hidden="true"></i>
              <span>Delete Exchange</span>
            </button>
          </div>
        </transition>
      </div>
    </header>

    <!-- Card Body -->
    <main class="card-body">
      <!-- Loading State -->
      <div
        v-if="isLoadingData"
        class="body-loading-overlay"
        role="status"
        aria-live="polite"
      >
        <div
          class="spinner-border text-primary"
          role="status"
          aria-hidden="true"
        ></div>
        <span>Loading queue data...</span>
      </div>

      <!-- Error State -->
      <div v-else-if="hasError" class="error-state" role="alert">
        <i class="bi bi-exclamation-triangle-fill" aria-hidden="true"></i>
        <p class="error-message">{{ errorMessage }}</p>
        <button type="button" class="btn-retry" @click="handleRetryLoadQueues">
          <i class="bi bi-arrow-clockwise" aria-hidden="true"></i>
          Retry
        </button>
      </div>

      <!-- Content -->
      <template v-else>
        <div class="stats-section">
          <div class="stat-item">
            <span
              class="stat-value"
              :aria-label="`${queues.total} queues bound`"
            >
              {{ queues.total }}
            </span>
            <span class="stat-label">
              {{ queues.total === 1 ? 'Queue' : 'Queues' }} Bound
            </span>
          </div>
        </div>

        <div class="queues-section">
          <h4 class="queues-title">
            <i class="bi bi-card-list me-2" aria-hidden="true"></i>
            {{ queues.total > 0 ? 'Sample Queues' : 'Bound Queues' }}
            <span v-if="metadataInfo" class="metadata-info">
              ({{ metadataInfo }})
            </span>
          </h4>

          <ul v-if="queues.total > 0" class="queues-list" role="list">
            <li
              v-for="queue in sampleQueues"
              :key="queue"
              class="queue-item"
              role="listitem"
            >
              <div class="queue-info">
                <i class="bi bi-box" aria-hidden="true"></i>
                <span class="queue-name">{{ queue }}</span>
              </div>
              <button
                type="button"
                class="btn-unbind-queue"
                :aria-label="`Unbind queue ${queue}`"
                @click="handleUnbindQueue(queue)"
              >
                <i class="bi bi-x-circle" aria-hidden="true"></i>
              </button>
            </li>
            <li
              v-if="remainingQueuesCount > 0"
              class="queue-item more"
              role="listitem"
            >
              <div class="queue-info">
                <i class="bi bi-three-dots" aria-hidden="true"></i>
                <span>+{{ remainingQueuesCount }} more</span>
              </div>
            </li>
          </ul>

          <div v-else class="no-queues-message">
            <i class="bi bi-inbox" aria-hidden="true"></i>
            <p>No queues are bound to this exchange.</p>
            <button type="button" class="btn-bind-now" @click="handleBindQueue">
              <i class="bi bi-link-45deg" aria-hidden="true"></i>
              Bind a queue
            </button>
          </div>
        </div>
      </template>
    </main>

    <!-- Card Footer -->
    <footer class="card-footer">
      <button
        type="button"
        class="btn-details"
        :aria-label="`View details for ${exchange.name} exchange`"
        @click="handleViewDetails"
      >
        <span>View Details</span>
        <i class="bi bi-arrow-right-circle" aria-hidden="true"></i>
      </button>
    </footer>
  </article>
</template>

<style scoped>
.exchange-card {
  position: relative;
  background-color: white;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  overflow: visible; /* For dropdown */
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    opacity 0.2s ease;
}

.exchange-card:hover:not(.is-deleting) {
  transform: translateY(-4px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.07);
}

.exchange-card.is-deleting {
  opacity: 0.7;
  pointer-events: none;
}

/* Loading Overlays */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 20;
  color: white;
  gap: 0.75rem;
  border-radius: 12px;
}

.loading-text {
  font-weight: 500;
  font-size: 0.9rem;
}

.body-loading-overlay {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  color: #0d6efd;
  padding: 2rem;
}

/* Error State */
.error-state {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem;
  text-align: center;
  color: #dc3545;
}

.error-message {
  margin: 0;
  font-size: 0.9rem;
}

.btn-retry {
  background: none;
  border: 1px solid #dc3545;
  color: #dc3545;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-retry:hover {
  background-color: #dc3545;
  color: white;
}

/* Header */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 0;
  flex: 1;
}

.header-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
  cursor: help;
}

.header-icon.direct {
  background: #cff4fc;
  color: #055160;
}

.header-icon.fanout {
  background: #d1e7dd;
  color: #0f5132;
}

.header-icon.topic {
  background: #e2d9f3;
  color: #5a2a94;
}

.header-icon.gray {
  background: #f8f9fa;
  color: #6c757d;
}

.header-text {
  min-width: 0;
  flex: 1;
}

.card-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #212529;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-subtitle {
  font-size: 0.8rem;
  color: #6c757d;
  display: block;
  margin-top: 0.25rem;
}

/* Actions Menu */
.actions-menu {
  position: relative;
}

.btn-actions {
  background: none;
  border: none;
  color: #6c757d;
  font-size: 1.25rem;
  padding: 0.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-actions:hover,
.btn-actions:focus {
  color: #212529;
  background-color: #f1f3f5;
  outline: none;
}

.btn-actions:focus-visible {
  outline: 2px solid #0d6efd;
  outline-offset: 2px;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
  padding: 0.5rem;
  width: 180px;
  overflow: hidden;
  display: block !important;
  z-index: 10;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.75rem;
  font-size: 0.9rem;
  color: #495057;
  background: none;
  border: none;
  width: 100%;
  text-align: left;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dropdown-item:hover,
.dropdown-item:focus {
  background-color: #f8f9fa;
  color: #212529;
  outline: none;
}

.dropdown-item.danger:hover,
.dropdown-item.danger:focus {
  background-color: #f8d7da;
  color: #842029;
}

.dropdown-divider {
  height: 1px;
  background-color: #e9ecef;
  margin: 0.5rem 0;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Body */
.card-body {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.stats-section {
  display: flex;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-grow: 1;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #0d6efd;
  line-height: 1.2;
}

.stat-label {
  font-size: 0.8rem;
  color: #6c757d;
  font-weight: 500;
  margin-top: 0.25rem;
}

.queues-section {
  flex-grow: 1;
}

.queues-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #495057;
  margin: 0 0 0.75rem 0;
  display: flex;
  align-items: center;
}

.metadata-info {
  font-size: 0.75rem;
  color: #6c757d;
  font-weight: 400;
  margin-left: 0.5rem;
}

.queues-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.queue-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  background-color: #f8f9fa;
  border-radius: 6px;
  font-size: 0.85rem;
  color: #495057;
}

.queue-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.queue-name {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-weight: 500;
}

.btn-unbind-queue {
  background: none;
  border: none;
  color: #dc3545;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  opacity: 0.7;
}

.btn-unbind-queue:hover {
  opacity: 1;
  background-color: #f8d7da;
  color: #842029;
}

.btn-unbind-queue:focus-visible {
  outline: 2px solid #dc3545;
  outline-offset: 2px;
}

.queue-item.more {
  font-style: italic;
  color: #6c757d;
  justify-content: center;
}

.no-queues-message {
  text-align: center;
  padding: 2rem 1rem;
  border: 2px dashed #e9ecef;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.no-queues-message i {
  font-size: 2rem;
  color: #6c757d;
}

.no-queues-message p {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.btn-bind-now {
  background: none;
  border: 1px solid #0d6efd;
  color: #0d6efd;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-bind-now:hover,
.btn-bind-now:focus {
  background-color: #0d6efd;
  color: white;
  outline: none;
}

.btn-bind-now:focus-visible {
  outline: 2px solid #0d6efd;
  outline-offset: 2px;
}

/* Footer */
.card-footer {
  margin-top: auto;
}

.btn-details {
  width: 100%;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  color: #495057;
  padding: 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
}

.btn-details:hover,
.btn-details:focus {
  background-color: #0d6efd;
  border-color: #0d6efd;
  color: white;
  outline: none;
}

.btn-details:focus-visible {
  outline: 2px solid #0d6efd;
  outline-offset: 2px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .exchange-card {
    padding: 1rem;
  }

  .card-header {
    margin-bottom: 1rem;
  }

  .header-content {
    gap: 0.75rem;
  }

  .header-icon {
    width: 40px;
    height: 40px;
    font-size: 1.25rem;
  }

  .card-title {
    font-size: 1.125rem;
  }

  .stat-value {
    font-size: 1.5rem;
  }

  .btn-unbind-queue {
    width: 20px;
    height: 20px;
    font-size: 0.875rem;
  }
}

/* High contrast mode support */
@media (prefers-contrast: more) {
  .exchange-card {
    border-width: 2px;
  }

  .dropdown-item:focus,
  .btn-actions:focus,
  .btn-details:focus,
  .btn-bind-now:focus,
  .btn-unbind-queue:focus {
    outline: 3px solid;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .exchange-card,
  .btn-actions,
  .dropdown-item,
  .btn-details,
  .btn-bind-now,
  .btn-unbind-queue,
  .dropdown-enter-active,
  .dropdown-leave-active {
    transition: none;
  }

  .exchange-card:hover {
    transform: none;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .exchange-card {
    background: #2d3748;
    border-color: #4a5568;
  }

  .dropdown-menu {
    background: #2d3748;
    border-color: #4a5568;
  }

  .dropdown-item {
    color: #e2e8f0;
  }

  .dropdown-item:hover {
    background: #4a5568;
  }

  .dropdown-item.danger:hover {
    background: #742a2a;
    color: #feb2b2;
  }

  .btn-unbind-queue:hover {
    background: #742a2a;
    color: #feb2b2;
  }

  .no-queues-message {
    border-color: #4a5568;
  }

  .btn-details {
    background: #4a5568;
    border-color: #4a5568;
    color: #e2e8f0;
  }

  .btn-details:hover {
    background: #0d6efd;
    border-color: #0d6efd;
  }
}
</style>

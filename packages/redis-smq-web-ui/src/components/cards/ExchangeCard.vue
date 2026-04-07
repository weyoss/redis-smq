<!--
  - Copyright (c)
  - Weyoss <weyoss@outlook.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import {
  EExchangeType,
  ExchangeTypeString,
  type IExchangeParsedParams,
} from '@/types';
import { useExchangeModals } from '@/composables/useExchangeModals';

// API hooks for fetching exchange data
import {
  useGetApiNamespacesNsExchangesExchangeRoutingKeys,
  useGetApiNamespacesNsExchangesExchangeRoutingPatterns,
  useGetApiNamespacesNsExchangesExchangeBindings,
} from '@/api/generated/namespace-exchanges/namespace-exchanges';

import type { IQueueParams } from '@/api/model';
import { getErrorMessage } from '@/lib/error';

// Import modals (they'll be rendered in this component)
import BindQueueModal from '@/components/modals/BindQueueModal.vue';
import UnbindQueueModal from '@/components/modals/UnbindQueueModal.vue';
import DeleteExchangeModal from '@/components/modals/DeleteExchangeModal.vue';
import { useTypedRouter } from '@/router/useTypeRouter.ts';

interface QueueData {
  items: string[];
  total: number;
  routingKeys?: string[];
  bindingPatterns?: string[];
}

const router = useTypedRouter();

const props = defineProps<{
  exchange: IExchangeParsedParams;
}>();

const emit = defineEmits<{
  (e: 'deleted'): void;
  (e: 'dataChanged'): void;
}>();

const modals = useExchangeModals();

// --- Step 1: Fetch Routing Keys and Binding Patterns ---

// Reactive parameters to control when queries should run
const shouldFetchRoutingKeys = computed(
  () => props.exchange.type === EExchangeType.DIRECT,
);
const shouldFetchBindingPatterns = computed(
  () => props.exchange.type === EExchangeType.TOPIC,
);

// Fetch routing keys for Direct exchanges
const {
  isLoading: isLoadingRoutingKeys,
  error: routingKeysError,
  refetch: refetchRoutingKeys,
} = useGetApiNamespacesNsExchangesExchangeRoutingKeys(
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
  isLoading: isLoadingBindingPatterns,
  error: bindingPatternsError,
  refetch: refetchBindingPatterns,
} = useGetApiNamespacesNsExchangesExchangeRoutingPatterns(
  computed(() => props.exchange.ns),
  computed(() => props.exchange.name),
  {
    query: {
      enabled: shouldFetchBindingPatterns,
    },
  },
);

// --- Step 2: Fetch All Bindings ---

// Fetch all bindings (returns object mapping keys/patterns to queues)
const {
  data: allBindingsData,
  isLoading: isLoadingAllBindings,
  error: allBindingsError,
  refetch: refetchAllBindings,
} = useGetApiNamespacesNsExchangesExchangeBindings(
  computed(() => props.exchange.ns),
  computed(() => props.exchange.name),
  undefined,
  {
    query: {
      enabled: computed(() => !!props.exchange.ns && !!props.exchange.name),
    },
  },
);

// Process bindings into a map
const bindingsMap = computed<Map<string, IQueueParams[]>>(() => {
  const map = new Map<string, IQueueParams[]>();
  const data = allBindingsData.value?.data;

  if (data && typeof data === 'object' && !Array.isArray(data)) {
    Object.entries(data).forEach(([key, queues]) => {
      if (Array.isArray(queues)) {
        map.set(key, queues);
      }
    });
  } else if (Array.isArray(data)) {
    map.set('_fanout', data);
  }

  return map;
});

// --- Unified Loading and Error States ---

const isLoadingData = computed(() => {
  if (props.exchange.type === EExchangeType.FANOUT) {
    return isLoadingAllBindings.value;
  }
  return (
    isLoadingRoutingKeys.value ||
    isLoadingBindingPatterns.value ||
    isLoadingAllBindings.value
  );
});

const queuesError = computed(() => {
  if (props.exchange.type === EExchangeType.FANOUT) {
    return allBindingsError.value;
  }
  return (
    routingKeysError.value ||
    bindingPatternsError.value ||
    allBindingsError.value
  );
});

const hasError = computed(() => !!queuesError.value);
const errorMessage = computed(() => getErrorMessage(queuesError.value));

const handleRetryLoadQueues = () => {
  if (props.exchange.type === EExchangeType.DIRECT) {
    refetchRoutingKeys();
  } else if (props.exchange.type === EExchangeType.TOPIC) {
    refetchBindingPatterns();
  }
  refetchAllBindings();
};

// --- Process Queue Data ---

const queues = computed<QueueData>(() => {
  let allQueues: string[] = [];
  const routingKeysUsed: string[] = [];
  const bindingPatternsUsed: string[] = [];

  if (props.exchange.type === EExchangeType.FANOUT) {
    const fanoutQueues = bindingsMap.value.get('_fanout') || [];
    allQueues = fanoutQueues.map((q) => q.name);
  } else {
    bindingsMap.value.forEach((queues, key) => {
      const queueNames = queues.map((q) => q.name);
      allQueues.push(...queueNames);

      if (queueNames.length > 0) {
        if (props.exchange.type === EExchangeType.DIRECT) {
          routingKeysUsed.push(key);
        } else if (props.exchange.type === EExchangeType.TOPIC) {
          bindingPatternsUsed.push(key);
        }
      }
    });
  }

  const uniqueQueues = [...new Set(allQueues)];

  return {
    items: uniqueQueues,
    total: uniqueQueues.length,
    routingKeys: routingKeysUsed,
    bindingPatterns: bindingPatternsUsed,
  };
});

// --- UI State ---

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

// Event handlers - use the modal composable
const handleDelete = () => {
  showDropdown.value = false;
  modals.openDeleteModal(props.exchange);
};

const handleBindQueue = () => {
  showDropdown.value = false;
  modals.openBindModal(props.exchange);
};

// Find the binding key for the queue
const handleUnbindQueue = (queueName: string) => {
  showDropdown.value = false;

  // Find which binding key this queue belongs to
  let bindingKey: string | undefined;

  if (props.exchange.type === EExchangeType.FANOUT) {
    // For fanout, no binding key needed
    bindingKey = undefined;
  } else {
    // Search through the bindings map to find the key for this queue
    for (const [key, queues] of bindingsMap.value.entries()) {
      if (queues.some((q) => q.name === queueName)) {
        bindingKey = key;
        break;
      }
    }
  }

  modals.openUnbindModal(props.exchange, queueName, bindingKey);
};

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value;
};

// Modal success handlers
const handleBindSuccess = () => {
  modals.closeModals();
  // Refresh data
  if (props.exchange.type === EExchangeType.DIRECT) {
    refetchRoutingKeys();
  } else if (props.exchange.type === EExchangeType.TOPIC) {
    refetchBindingPatterns();
  }
  refetchAllBindings();
  emit('dataChanged');
};

const handleUnbindSuccess = () => {
  modals.closeModals();
  // Refresh data
  if (props.exchange.type === EExchangeType.DIRECT) {
    refetchRoutingKeys();
  } else if (props.exchange.type === EExchangeType.TOPIC) {
    refetchBindingPatterns();
  }
  refetchAllBindings();
  emit('dataChanged');
};

const handleDeleted = () => {
  modals.closeModals();
  emit('deleted');
};

const goToExchangePage = (ex: IExchangeParsedParams) => {
  router.push('exchangeDetails', {
    params: {
      exchange: ex.name,
      ns: ex.ns,
    },
  });
};
</script>

<template>
  <article
    class="exchange-card"
    role="article"
    :aria-label="`${exchangeTypeDetails.name} exchange ${exchange.name} in ${exchange.ns} namespace`"
  >
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
        @click="() => goToExchangePage(exchange)"
      >
        <span>View Details</span>
        <i class="bi bi-arrow-right-circle" aria-hidden="true"></i>
      </button>
    </footer>

    <!-- Modals - using the composable state -->
    <BindQueueModal
      :is-visible="
        modals.showBindModal.value &&
        modals.selectedExchange?.value?.name === exchange.name
      "
      :exchange-type="ExchangeTypeString[exchange.type]"
      :exchange-name="exchange.name"
      :namespace="exchange.ns"
      @close="modals.closeModals"
      @success="handleBindSuccess"
    />

    <UnbindQueueModal
      v-if="modals.selectedQueue.value && modals.selectedExchange?.value"
      :is-visible="
        modals.showUnbindModal.value &&
        modals.selectedExchange?.value?.name === exchange.name
      "
      :queue-name="modals.selectedQueue.value"
      :exchange-name="exchange.name"
      :namespace="exchange.ns"
      :exchange-type="ExchangeTypeString[exchange.type]"
      :routing-key="
        props.exchange.type === EExchangeType.DIRECT
          ? (modals.selectedBindingKey.value ?? undefined)
          : undefined
      "
      :binding-pattern="
        props.exchange.type === EExchangeType.TOPIC
          ? (modals.selectedBindingKey.value ?? undefined)
          : undefined
      "
      @close="modals.closeModals"
      @success="handleUnbindSuccess"
    />

    <DeleteExchangeModal
      :is-visible="
        modals.showDeleteModal.value &&
        modals.selectedExchange?.value?.name === exchange.name
      "
      :exchange-type="exchange.type"
      :exchange-name="exchange.name"
      :namespace="exchange.ns"
      :total-queues="queues.total"
      @deleted="handleDeleted"
      @close="modals.closeModals"
    />
  </article>
</template>

<style scoped>
/* Mobile-first: sizing and overflow guards */
.exchange-card,
.exchange-card * {
  box-sizing: border-box;
}

.exchange-card img,
.exchange-card svg,
.exchange-card video {
  max-width: 100%;
  height: auto;
}

/* Card container with responsive paddings */
.exchange-card {
  /* shared padding variable used by button positioning too */
  --card-pad: clamp(12px, 3.2vw, 24px);
  position: relative; /* needed for absolutely positioned actions menu */
  background-color: white;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: var(--card-pad);
  display: flex;
  flex-direction: column;
  overflow: visible; /* keep dropdown visible */
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
  inset: 0;
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
  padding: clamp(16px, 3.2vw, 32px);
  text-align: center;
}

/* Error State */
.error-state {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: clamp(16px, 3.2vw, 32px);
  text-align: center;
  color: #dc3545;
}

.error-message {
  margin: 0;
  font-size: 0.9rem;
  overflow-wrap: anywhere;
  word-break: break-word;
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
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-retry:hover {
  background-color: #dc3545;
  color: white;
}

/* Bind Now Button */
.btn-bind-now {
  background: #0d6efd;
  color: white;
  border: 1px solid #0d6efd;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-bind-now:hover {
  background: #0b5ed7;
  border-color: #0a58ca;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(13, 110, 253, 0.2);
}

.btn-bind-now:focus-visible {
  outline: 2px solid #0d6efd;
  outline-offset: 2px;
}

.btn-bind-now:active {
  transform: translateY(0);
}

/* Header */
.card-header {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: clamp(8px, 2.4vw, 16px);
  margin-bottom: clamp(12px, 2.4vw, 24px);
  flex-wrap: wrap;
  /* Reserve space so text doesn't run under the floating actions button */
  padding-inline-end: calc(clamp(48px, 8vw, 64px) + env(safe-area-inset-right));
}

/* Ensure header content can shrink and wrap without overflow */
.header-content {
  display: flex;
  align-items: center;
  gap: clamp(8px, 2.4vw, 16px);
  min-width: 0;
  flex: 1 1 auto;
  max-width: 100%;
}

.header-icon {
  width: clamp(40px, 6.5vw, 48px);
  height: clamp(40px, 6.5vw, 48px);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(1.1rem, 3.2vw, 1.5rem);
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
  flex: 1 1 auto;
}

/* Title/subtitle overflow safety */
.card-title {
  margin: 0;
  font-size: clamp(1.05rem, 2.8vw, 1.25rem);
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
  overflow-wrap: anywhere;
  word-break: break-word;
}

/* Actions Menu - anchor to header top-right with logical properties */
.actions-menu {
  position: absolute;
  inset-block-start: 0; /* top: 0 */
  inset-inline-end: 0; /* right: 0 */
  z-index: 5;
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;
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

/* Dropdown sizing: avoid horizontal scrollbars and keep within viewport */
.dropdown-menu {
  position: absolute;
  inset-block-start: calc(100% + 6px);
  inset-inline-end: 0;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
  padding: 0.5rem;

  /* Updated sizing: fit content, but keep within sensible/viewport bounds */
  width: max-content; /* grow to fit items */
  min-width: 240px; /* at least this wide */
  max-width: min(92vw, 360px); /* but not wider than viewport/sane max */

  max-block-size: min(70vh, 400px);
  overflow-y: auto;
  overflow-x: hidden; /* avoid horizontal scrollbars */
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  display: block !important;
  z-index: 10;
  box-sizing: border-box; /* include padding/border in width */
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

/* Ensure text can wrap instead of being clipped */
.dropdown-item span {
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
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
  gap: clamp(12px, 2.8vw, 24px);
  margin-bottom: clamp(12px, 2.4vw, 24px);
}

.stats-section {
  display: flex;
  padding: clamp(10px, 2.6vw, 16px);
  background-color: #f8f9fa;
  border-radius: 8px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-grow: 1;
  min-width: 0;
}

.stat-value {
  font-size: clamp(1.25rem, 4.8vw, 1.75rem);
  font-weight: 700;
  color: #0d6efd;
  line-height: 1.2;
}

.stat-label {
  font-size: 0.8rem;
  color: #6c757d;
  font-weight: 500;
  margin-top: 0.25rem;
  overflow-wrap: anywhere;
}

.queues-section {
  flex-grow: 1;
}

.queues-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #495057;
  margin: 0 0 0.75rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  overflow-wrap: anywhere;
}

.metadata-info {
  font-size: 0.75rem;
  color: #6c757d;
  font-weight: 400;
}

.queues-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: clamp(6px, 1.8vw, 8px);
}

.queue-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: clamp(8px, 2.2vw, 12px) clamp(10px, 2.5vw, 12px);
  background-color: #f8f9fa;
  border-radius: 8px;
  font-size: 0.85rem;
  color: #495057;
  min-width: 0; /* prevent children from overflowing */
  gap: 0.75rem;
}

.queue-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1 1 auto;
  min-width: 0; /* allow ellipsis */
}

.queue-name {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn-unbind-queue {
  position: relative;
  background: none;
  border: none;
  color: #dc3545;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  opacity: 0.8;
  -webkit-tap-highlight-color: transparent;
  flex-shrink: 0;
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
  padding: clamp(16px, 3.2vw, 32px);
  border: 2px dashed #e9ecef;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.no-queues-message i {
  font-size: 2.5rem;
  color: #6c757d;
  margin-bottom: 0.5rem;
}

.no-queues-message p {
  margin: 0;
  color: #6c757d;
  font-size: 0.95rem;
  overflow-wrap: anywhere;
  max-width: 80%;
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
  padding: clamp(10px, 2.6vw, 12px);
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

/* Body lists and items: respect width constraints */
.queues-title,
.stat-label,
.error-message {
  overflow-wrap: anywhere;
  word-break: break-word;
}

/* Responsive Design */
@media (max-width: 768px) {
  .card-title {
    /* Keep title readable with ellipsis; switch to wrap on very narrow screens */
    white-space: nowrap;
  }

  .btn-unbind-queue {
    width: 36px;
    height: 36px;
    font-size: 1.1rem;
  }
}

@media (max-width: 576px) {
  .header-content {
    align-items: flex-start;
    padding-inline-end: calc(
      clamp(56px, 12vw, 72px) + env(safe-area-inset-right)
    );
  }

  .card-header {
    align-items: flex-start;
    /* Tighten or loosen reserved space for the floating button on very small screens */
    padding-right: clamp(56px, 12vw, 72px);
  }

  .card-title {
    white-space: normal;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .queue-item {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }

  .queue-name {
    white-space: normal;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .btn-unbind-queue {
    align-self: flex-end;
  }

  .no-queues-message p {
    max-width: 100%;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .exchange-card {
    background: #2d3748;
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

  .no-queues-message p {
    color: #a0aec0;
  }

  .no-queues-message i {
    color: #718096;
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

  .btn-bind-now {
    background: #0d6efd;
    color: white;
  }

  .btn-bind-now:hover {
    background: #0b5ed7;
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
</style>

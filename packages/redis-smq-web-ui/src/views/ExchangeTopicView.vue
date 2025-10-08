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

// API hooks for topic exchange operations
import {
  useGetApiV1NamespacesNsExchangesTopicTopicBindingPatterns,
  useGetApiV1NamespacesNsExchangesTopicTopicQueues,
  usePutApiV1NamespacesNsExchangesTopicTopicQueuesQueue,
  useDeleteApiV1NamespacesNsExchangesTopicTopicQueuesQueue,
  useDeleteApiV1NamespacesNsExchangesTopicTopic,
  getGetApiV1NamespacesNsExchangesTopicTopicBindingPatternsQueryKey,
  getGetApiV1NamespacesNsExchangesTopicTopicQueuesQueryKey,
} from '@/api/generated/topic-exchange/topic-exchange';

import type { GetApiV1NamespacesNsExchangesTopicTopicQueuesParams } from '@/api/model';

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
const isValidRoute = computed(() => !!(exchangeName.value && namespace.value));

// Modal states
const showDeleteDialog = ref(false);
const showBindQueueModal = ref(false);
const showUnbindQueueModal = ref(false);

// Selected items for operations
const selectedQueueForUnbind = ref<{
  name: string;
  bindingPattern: string;
} | null>(null);

const getPatternExample = (pattern: string): string => {
  // Replace wildcards with example values
  let example = pattern.replace(/\*/g, 'word').replace(/#/g, 'any.nested.keys');

  // If no wildcards, show the pattern as-is
  if (!pattern.includes('*') && !pattern.includes('#')) {
    return pattern;
  }

  return example;
};

// --- API Data Fetching ---

// Fetch binding patterns
const {
  data: bindingPatternsData,
  isLoading: isLoadingBindingPatterns,
  error: bindingPatternsError,
  refetch: refetchBindingPatterns,
} = useGetApiV1NamespacesNsExchangesTopicTopicBindingPatterns(
  namespace,
  exchangeName,
  {
    query: {
      enabled: isValidRoute,
    },
  },
);

const bindingPatterns = computed(() => bindingPatternsData.value?.data || []);

// Fetch queues for each binding pattern
const maxBindingPatterns = 20; // Reasonable limit
const queueQueries = Array.from({ length: maxBindingPatterns }, (_, index) => {
  const bindingPattern = computed(() => bindingPatterns.value[index] || '');
  const shouldEnable = computed(
    () =>
      isValidRoute.value &&
      index < bindingPatterns.value.length &&
      !!bindingPatterns.value[index],
  );

  return useGetApiV1NamespacesNsExchangesTopicTopicQueues(
    namespace,
    exchangeName,
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

// --- API Mutations ---

// Bind queue mutation
const bindQueueMutation = usePutApiV1NamespacesNsExchangesTopicTopicQueuesQueue(
  {
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey:
            getGetApiV1NamespacesNsExchangesTopicTopicBindingPatternsQueryKey(
              namespace.value,
              exchangeName.value,
            ),
        });
        // Invalidate all queue queries
        bindingPatterns.value.forEach((bindingPattern) => {
          queryClient.invalidateQueries({
            queryKey: getGetApiV1NamespacesNsExchangesTopicTopicQueuesQueryKey(
              namespace.value,
              exchangeName.value,
              { bindingPattern },
            ),
          });
        });
        showBindQueueModal.value = false;
      },
      onError: (error) => {
        console.error('Failed to bind queue:', error);
      },
    },
  },
);

// Unbind queue mutation
const unbindQueueMutation =
  useDeleteApiV1NamespacesNsExchangesTopicTopicQueuesQueue({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey:
            getGetApiV1NamespacesNsExchangesTopicTopicBindingPatternsQueryKey(
              namespace.value,
              exchangeName.value,
            ),
        });
        // Invalidate all queue queries
        bindingPatterns.value.forEach((bindingPattern) => {
          queryClient.invalidateQueries({
            queryKey: getGetApiV1NamespacesNsExchangesTopicTopicQueuesQueryKey(
              namespace.value,
              exchangeName.value,
              { bindingPattern },
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
const deleteExchangeMutation = useDeleteApiV1NamespacesNsExchangesTopicTopic({
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
    isLoadingBindingPatterns.value ||
    queueQueries.some(
      (query, index) =>
        index < bindingPatterns.value.length && query.isLoading.value,
    )
  );
});

const hasError = computed(() => {
  return (
    !!bindingPatternsError.value ||
    queueQueries.some(
      (query, index) =>
        index < bindingPatterns.value.length && !!query.error.value,
    )
  );
});

const errorMessage = computed(() => {
  if (bindingPatternsError.value)
    return getErrorMessage(bindingPatternsError.value);

  const queryError = queueQueries.find(
    (query, index) => index < bindingPatterns.value.length && query.error.value,
  )?.error.value;

  return queryError ? getErrorMessage(queryError) : null;
});

// Process queue bindings data
const queueBindings = computed(() => {
  const bindings: Array<{
    bindingPattern: string;
    queues: Array<{ name: string }>;
    totalQueues: number;
  }> = [];

  bindingPatterns.value.forEach((bindingPattern, index) => {
    if (index >= queueQueries.length) return;

    const query = queueQueries[index];
    const queueData = query.data?.value?.data || [];

    bindings.push({
      bindingPattern,
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

const totalBindingPatterns = computed(() => bindingPatterns.value.length);

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

const handleUnbindQueue = (queueName: string, bindingPattern: string) => {
  selectedQueueForUnbind.value = { name: queueName, bindingPattern };
  showUnbindQueueModal.value = true;
};

const handleDeleteExchange = () => {
  showDeleteDialog.value = true;
};

const handleRefresh = () => {
  refetchBindingPatterns();
  queueQueries.forEach((query, index) => {
    if (index < bindingPatterns.value.length) {
      query.refetch();
    }
  });
};

// Confirm actions
const confirmBindQueue = async (payload: {
  queueName: string;
  bindingPattern?: string;
}) => {
  await bindQueueMutation.mutateAsync({
    ns: namespace.value,
    topic: exchangeName.value,
    queue: payload.queueName,
    params: { bindingPattern: String(payload.bindingPattern) },
  });
};

const confirmUnbindQueue = async () => {
  if (!selectedQueueForUnbind.value) return;

  await unbindQueueMutation.mutateAsync({
    ns: namespace.value,
    topic: exchangeName.value,
    queue: selectedQueueForUnbind.value.name,
    params: { bindingPattern: selectedQueueForUnbind.value.bindingPattern },
  });
};

const confirmDeleteExchange = async () => {
  await deleteExchangeMutation.mutateAsync({
    ns: namespace.value,
    topic: exchangeName.value,
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
    tooltip: 'Bind a queue to this exchange with a binding pattern',
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
    title: `Topic Exchange: ${exchangeName.value}`,
    subtitle: `Namespace: ${namespace.value} • Routes messages based on routing key patterns`,
    icon: 'bi bi-hash',
  });

  pageContentStore.setPageActions(pageActions.value);
  pageContentStore.setLoadingState(isLoading.value);

  if (hasError.value) {
    pageContentStore.setErrorState(errorMessage.value);
    pageContentStore.setEmptyState(false);
  } else if (!isLoading.value && totalBindingPatterns.value === 0) {
    pageContentStore.setErrorState(null);
    pageContentStore.setEmptyState(true, {
      icon: 'bi bi-hash',
      title: 'No Queue Bindings',
      message:
        'This topic exchange has no queue bindings. Bind a queue with a binding pattern to start routing messages.',
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
        v-if="!isLoading && !hasError && totalBindingPatterns > 0"
        class="stats-overview"
      >
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon binding-patterns">
              <i class="bi bi-hash" aria-hidden="true"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ totalBindingPatterns }}</div>
              <div class="stat-label">
                Binding
                {{ totalBindingPatterns === 1 ? 'Pattern' : 'Patterns' }}
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
            :key="binding.bindingPattern"
            class="binding-card"
          >
            <div class="binding-header">
              <div class="binding-pattern-info">
                <div class="binding-pattern-badge">
                  <i class="bi bi-hash" aria-hidden="true"></i>
                  <span class="binding-pattern-text">{{
                    binding.bindingPattern
                  }}</span>
                </div>
                <div class="queue-count">
                  {{ binding.totalQueues }}
                  {{ binding.totalQueues === 1 ? 'queue' : 'queues' }}
                </div>
              </div>
              <div class="pattern-explanation">
                <i class="bi bi-info-circle" aria-hidden="true"></i>
                <span class="explanation-text">
                  Matches routing keys like:
                  {{ getPatternExample(binding.bindingPattern) }}
                </span>
              </div>
            </div>

            <div v-if="binding.queues.length > 0" class="queues-list">
              <div
                v-for="queue in binding.queues"
                :key="`${binding.bindingPattern}-${queue.name}`"
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
                  :aria-label="`Unbind queue ${queue.name} from binding pattern ${binding.bindingPattern}`"
                  @click="handleUnbindQueue(queue.name, binding.bindingPattern)"
                >
                  <i class="bi bi-x-circle" aria-hidden="true"></i>
                  <span>Unbind</span>
                </button>
              </div>
            </div>

            <div v-else class="no-queues">
              <i class="bi bi-inbox" aria-hidden="true"></i>
              <span>No queues bound to this pattern</span>
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
      title="Delete Topic Exchange"
      :message="`Are you sure you want to delete the topic exchange '${exchangeName}'? This will remove all queue bindings and cannot be undone.`"
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
      exchange-type="topic"
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
      :binding-pattern="selectedQueueForUnbind?.bindingPattern || ''"
      exchange-type="topic"
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

.stat-icon.binding-patterns {
  background: #e2d9f3;
  color: #5a2a94;
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

.binding-pattern-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.binding-pattern-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #e2d9f3;
  color: #5a2a94;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.875rem;
}

.binding-pattern-text {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-weight: 600;
}

.queue-count {
  font-size: 0.875rem;
  color: #6c757d;
  font-weight: 500;
}

.pattern-explanation {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: #6c757d;
  background: #e7f3ff;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  border-left: 3px solid #0d6efd;
}

.explanation-text {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
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

  .binding-pattern-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .pattern-explanation {
    font-size: 0.75rem;
    padding: 0.4rem 0.6rem;
  }

  .queue-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .btn-unbind {
    align-self: flex-end;
  }

  .binding-header {
    padding: 1rem;
  }

  .queues-list {
    padding: 1rem;
  }
}

@media (max-width: 576px) {
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

  .binding-pattern-badge {
    padding: 0.4rem 0.6rem;
    font-size: 0.8rem;
  }

  .binding-pattern-text {
    font-size: 0.8rem;
  }

  .queue-item {
    padding: 0.75rem;
  }

  .btn-unbind {
    padding: 0.4rem 0.6rem;
    font-size: 0.8rem;
  }
}

/* Focus management */
.binding-card:focus-within {
  outline: 2px solid #0d6efd;
  outline-offset: 2px;
}
</style>

<!--
  - Copyright (c)
  - Weyoss <weyoss@outlook.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { computed } from 'vue';
import { useGetApiNamespacesNsQueues } from '@/api/generated/namespace-queues/namespace-queues';
import { useGetApiNamespacesNsExchanges } from '@/api/generated/namespace-exchanges/namespace-exchanges';
import type { IQueueParams } from '@/types';
import { useTypedRouter } from '@/router/useTypeRouter.ts';

const router = useTypedRouter();

const props = defineProps<{
  namespace: string;
  isDeleting?: boolean;
}>();

const emit = defineEmits<{
  (e: 'delete', ns: string): void;
}>();

// Fetch queues
const {
  data: queuesData,
  isLoading: isLoadingQueues,
  error: queuesError,
  refetch: refetchQueues,
} = useGetApiNamespacesNsQueues(props.namespace, {
  query: {
    enabled: true,
    staleTime: 1000 * 30,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  },
});

// Fetch exchanges
const {
  data: exchangesData,
  isLoading: isLoadingExchanges,
  error: exchangesError,
  refetch: refetchExchanges,
} = useGetApiNamespacesNsExchanges(props.namespace, {
  query: {
    enabled: true,
    staleTime: 1000 * 30,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  },
});

const queues = computed(() => queuesData.value?.data || []);
const queueCount = computed(() => queues.value.length);
const recentQueues = computed(() => queues.value.slice(0, 3));

const exchanges = computed(() => exchangesData.value?.data || []);
const exchangeCount = computed(() => exchanges.value.length);

const isLoading = computed(
  () => isLoadingQueues.value || isLoadingExchanges.value,
);
const error = computed(() => queuesError.value || exchangesError.value);

function handleRetry() {
  refetchQueues();
  refetchExchanges();
}

function navigateToQueuePage(queue: IQueueParams) {
  router.push('queue', {
    params: {
      ns: queue.ns,
      queue: queue.name,
    },
  });
}

function navigateToNamespaceExchanges(ns: string) {
  router.push('namespaceExchanges', {
    params: {
      ns,
    },
  });
}

function navigateToNamespaceQueues(ns: string) {
  router.push('namespaceQueues', {
    params: {
      ns,
    },
  });
}
</script>

<template>
  <div
    class="namespace-card"
    :class="{ 'is-deleting': isDeleting, 'is-loading': isLoading }"
  >
    <!-- Header -->
    <div class="card-header">
      <div class="namespace-icon">
        <i class="bi bi-folder"></i>
      </div>
      <div class="namespace-info">
        <h3 class="namespace-name">{{ namespace }}</h3>
        <div class="namespace-stats">
          <span class="stat">
            <i class="bi bi-list-ul"></i>
            <span v-if="isLoadingQueues">...</span>
            <span v-else-if="queuesError">?</span>
            <span v-else>{{ queueCount }}</span>
          </span>
          <span class="stat">
            <i class="bi bi-diagram-3"></i>
            <span v-if="isLoadingExchanges">...</span>
            <span v-else-if="exchangesError">?</span>
            <span v-else>{{ exchangeCount }}</span>
          </span>
        </div>
      </div>
      <button
        class="btn-delete"
        :disabled="isDeleting"
        aria-label="Delete namespace"
        @click.stop="emit('delete', namespace)"
      >
        <i class="bi bi-trash"></i>
      </button>
    </div>

    <!-- Loading / Error / Content -->
    <div v-if="isLoading" class="card-body loading">
      <div class="spinner-border spinner-border-sm text-primary"></div>
      <span>Loading...</span>
    </div>

    <div v-else-if="error" class="card-body error">
      <i class="bi bi-exclamation-triangle-fill"></i>
      <span>{{ error || 'Failed to load' }}</span>
      <button class="btn-retry" @click.stop="handleRetry">
        <i class="bi bi-arrow-clockwise"></i>
      </button>
    </div>

    <div v-else class="card-body">
      <!-- Quick actions -->
      <div class="quick-actions">
        <button
          class="action-btn"
          @click.stop="navigateToNamespaceQueues(namespace)"
        >
          <i class="bi bi-list-ul"></i>
          <span>{{ queueCount }} queues</span>
        </button>
        <button
          class="action-btn"
          @click.stop="navigateToNamespaceExchanges(namespace)"
        >
          <i class="bi bi-diagram-3"></i>
          <span>{{ exchangeCount }} exchanges</span>
        </button>
      </div>

      <!-- Recent queues -->
      <div v-if="recentQueues.length > 0" class="recent-queues">
        <div class="recent-title">Recent queues</div>
        <div class="queue-list">
          <button
            v-for="queue in recentQueues"
            :key="queue.name"
            class="queue-item"
            @click.stop="navigateToQueuePage(queue)"
          >
            <i class="bi bi-box"></i>
            <span class="queue-name">{{ queue.name }}</span>
          </button>
        </div>
      </div>

      <div v-else class="empty-queues">
        <i class="bi bi-inbox"></i>
        <span>No queues</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.namespace-card {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.namespace-card:hover {
  border-color: #0d6efd;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.namespace-card.is-deleting {
  opacity: 0.5;
  pointer-events: none;
}

/* Header */
.card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.namespace-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #0d6efd, #0b5ed7);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.25rem;
}

.namespace-info {
  flex: 1;
  min-width: 0;
}

.namespace-name {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #212529;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.namespace-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
  color: #6c757d;
}

.stat {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.stat i {
  font-size: 0.9rem;
}

.btn-delete {
  background: none;
  border: none;
  color: #dc3545;
  padding: 0.25rem;
  cursor: pointer;
  border-radius: 4px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-delete:hover:not(:disabled) {
  background: #fee2e2;
}

.btn-delete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Card Body */
.card-body {
  min-height: 120px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.card-body.loading,
.card-body.error {
  align-items: center;
  justify-content: center;
  color: #6c757d;
}

.card-body.error {
  color: #dc3545;
}

/* Quick actions */
.quick-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.action-btn {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.85rem;
  color: #495057;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: #e9ecef;
  border-color: #0d6efd;
}

.action-btn i {
  font-size: 1rem;
}

/* Recent queues */
.recent-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: #6c757d;
  margin-bottom: 0.5rem;
}

.queue-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.queue-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.5rem;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  width: 100%;
  text-align: left;
  color: #212529;
}

.queue-item:hover {
  background: #e9ecef;
  border-color: #0d6efd;
}

.queue-item i {
  color: #0c5460;
  font-size: 0.9rem;
}

.queue-name {
  font-family: monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Empty state */
.empty-queues {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  color: #6c757d;
  border: 1px dashed #dee2e6;
  border-radius: 8px;
}

.empty-queues i {
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
}

.empty-queues span {
  font-size: 0.85rem;
}

/* Retry button */
.btn-retry {
  background: none;
  border: 1px solid #dc3545;
  color: #dc3545;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  margin-left: 0.5rem;
}

.btn-retry:hover {
  background: #dc3545;
  color: white;
}
</style>

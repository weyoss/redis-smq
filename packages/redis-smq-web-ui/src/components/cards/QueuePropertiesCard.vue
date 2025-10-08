<!--
  - Copyright (c)
  - Weyoss <weyoss@protonmail.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { useSelectedQueuePropertiesStore } from '@/stores/selectedQueueProperties.ts';
import { EQueueDeliveryModel, EQueueType } from '@/types';
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useSelectedQueueStore } from '@/stores/selectedQueue.ts';

const selectedQueueStore = useSelectedQueueStore();
const queuesPropertiesStore = useSelectedQueuePropertiesStore();
const router = useRouter();

const queue = computed(() => {
  return selectedQueueStore.selectedQueue;
});

const queueProperties = computed(() => {
  return queuesPropertiesStore.queueProperties?.data;
});

const isLoading = computed(() => {
  return queuesPropertiesStore.isLoadingQueueProperties;
});

const error = computed(() => {
  const error = queuesPropertiesStore.queuePropertiesError?.error;
  if (error) {
    return `Failed to load queue information: ${error.message}`;
  }
  return null;
});

const messageStats = computed(() => {
  if (!queueProperties.value) return [];
  return [
    {
      label: 'Pending',
      value: queueProperties.value.pendingMessagesCount,
      icon: 'bi-clock-history',
      iconClass: 'pending-icon',
      routeName: 'Pending Messages',
    },
    {
      label: 'Dead-lettered',
      value: queueProperties.value.deadLetteredMessagesCount,
      icon: 'bi-x-octagon-fill',
      iconClass: 'dead-lettered-icon',
      routeName: 'Dead-Lettered Messages',
    },
    {
      label: 'Processing',
      value: queueProperties.value.processingMessagesCount,
      icon: 'bi-hourglass-split',
      iconClass: 'processing-icon',
      routeName: null,
    },
    {
      label: 'Acknowledged',
      value: queueProperties.value.acknowledgedMessagesCount,
      icon: 'bi-check-circle-fill',
      iconClass: 'acknowledged-icon',
      routeName: 'Acknowledged Messages',
    },
    {
      label: 'Scheduled',
      value: queueProperties.value.scheduledMessagesCount,
      icon: 'bi-calendar-plus-fill',
      iconClass: 'scheduled-icon',
      routeName: 'Scheduled Messages',
    },
    {
      label: 'Requeued',
      value: queueProperties.value.requeuedMessagesCount,
      icon: 'bi-arrow-repeat',
      iconClass: 'requeued-icon',
      routeName: null,
    },
    {
      label: 'Delayed',
      value: queueProperties.value.delayedMessagesCount,
      icon: 'bi-stopwatch-fill',
      iconClass: 'delayed-icon',
      routeName: null,
    },
    {
      label: 'Total Messages',
      value: queueProperties.value.messagesCount,
      icon: 'bi-collection-fill',
      iconClass: 'total-icon',
      routeName: 'Messages',
    },
  ];
});

// Navigation
function navigateToMessages(routeName: string | null) {
  if (!routeName || !queue.value) return;
  router.push({
    name: routeName,
    params: {
      ns: queue.value.ns,
      queue: queue.value.name,
    },
  });
}

// Refresh queue information
function refreshQueueInfo() {
  queuesPropertiesStore.refreshQueueProperties();
}

/**
 * Format a number with commas.
 */
function formatNumber(value: number | null | undefined): string {
  if (value === null || typeof value === 'undefined') {
    return '0';
  }
  return value.toLocaleString();
}

/**
 * Format queue type for display
 */
function formatQueueType(type: number): string {
  switch (type) {
    case EQueueType.FIFO_QUEUE:
      return 'FIFO';
    case EQueueType.LIFO_QUEUE:
      return 'LIFO';
    case EQueueType.PRIORITY_QUEUE:
      return 'Priority';
    default:
      return 'Unknown';
  }
}

/**
 * Get queue type CSS class
 */
function getQueueTypeClass(type: number): string {
  switch (type) {
    case EQueueType.FIFO_QUEUE:
      return 'queue-type-fifo';
    case EQueueType.LIFO_QUEUE:
      return 'queue-type-lifo';
    case EQueueType.PRIORITY_QUEUE:
      return 'queue-type-priority';
    default:
      return 'queue-type-unknown';
  }
}

/**
 * Get queue type description
 */
function getQueueTypeDescription(type: number): string {
  switch (type) {
    case EQueueType.FIFO_QUEUE:
      return 'First In, First Out - Messages processed in order';
    case EQueueType.LIFO_QUEUE:
      return 'Last In, First Out - Most recent messages processed first';
    case EQueueType.PRIORITY_QUEUE:
      return 'Priority-based - Higher priority messages processed first';
    default:
      return 'Unknown queue processing order';
  }
}

/**
 * Format delivery model for display
 */
function formatDeliveryModel(model: number): string {
  switch (model) {
    case EQueueDeliveryModel.POINT_TO_POINT:
      return 'Point-to-Point';
    case EQueueDeliveryModel.PUB_SUB:
      return 'Pub/Sub';
    default:
      return 'Unknown';
  }
}

/**
 * Get delivery model CSS class
 */
function getDeliveryModelClass(model: number): string {
  switch (model) {
    case EQueueDeliveryModel.POINT_TO_POINT:
      return 'delivery-model-p2p';
    case EQueueDeliveryModel.PUB_SUB:
      return 'delivery-model-pubsub';
    default:
      return 'delivery-model-unknown';
  }
}

/**
 * Get delivery model description
 */
function getDeliveryModelDescription(model: number): string {
  switch (model) {
    case EQueueDeliveryModel.POINT_TO_POINT:
      return 'One-to-one message delivery between producer and consumer';
    case EQueueDeliveryModel.PUB_SUB:
      return 'One-to-many message delivery to multiple subscribers';
    default:
      return 'Unknown message delivery pattern';
  }
}

/**
 * Format rate limit for display
 */
function formatRateLimit(
  rateLimit: { limit: number; interval: number } | null,
): string {
  if (!rateLimit || !rateLimit.limit || !rateLimit.interval) {
    return 'None';
  }
  const intervalInSeconds = rateLimit.interval / 1000;
  return `${rateLimit.limit} msg / ${intervalInSeconds}s`;
}
</script>

<template>
  <div class="queue-info-card">
    <!-- Header -->
    <header class="card-header">
      <div class="header-content">
        <h3 class="card-title">
          <i class="bi bi-info-circle-fill title-icon"></i>
          Queue Details
        </h3>
        <p class="card-subtitle">
          Configuration and real-time statistics for the selected queue
        </p>
      </div>
      <div class="header-actions">
        <button
          class="btn btn-refresh"
          :disabled="isLoading"
          title="Refresh queue information"
          @click="refreshQueueInfo"
        >
          <i class="bi bi-arrow-clockwise" :class="{ spinning: isLoading }"></i>
        </button>
      </div>
    </header>

    <!-- Content -->
    <main class="card-content">
      <!-- Loading State -->
      <div v-if="isLoading" class="content-state loading-state">
        <div class="state-content">
          <div class="spinner-border text-primary mb-2"></div>
          <h5 class="state-title">Loading...</h5>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="content-state error-state">
        <div class="error-content">
          <i class="bi bi-exclamation-triangle-fill text-danger me-2"></i>
          <span>{{ error }}</span>
        </div>
        <button class="btn btn-sm btn-primary mt-2" @click="refreshQueueInfo">
          <i class="bi bi-arrow-clockwise me-1"></i>
          Retry
        </button>
      </div>

      <!-- Queue Details Wrapper -->
      <div v-else-if="queue && queueProperties" class="queue-details-wrapper">
        <!-- Configuration Section -->
        <section class="info-section">
          <h4 class="section-title">
            <i class="bi bi-gear-fill"></i> Configuration
          </h4>
          <div class="info-grid">
            <!-- Queue Name -->
            <div class="info-item">
              <div class="info-content">
                <div class="info-icon queue-name-icon">
                  <i class="bi bi-tag-fill"></i>
                </div>
                <div class="info-details">
                  <div class="info-label">Queue Name</div>
                  <div class="info-value">
                    <span class="queue-name">{{ queue.name }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Namespace -->
            <div class="info-item">
              <div class="info-content">
                <div class="info-icon namespace-icon">
                  <i class="bi bi-folder-fill"></i>
                </div>
                <div class="info-details">
                  <div class="info-label">Namespace</div>
                  <div class="info-value">
                    <span class="namespace">{{ queue.ns }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Queue Type -->
            <div class="info-item">
              <div class="info-content">
                <div class="info-icon queue-type-icon">
                  <i class="bi bi-list-ol"></i>
                </div>
                <div class="info-details">
                  <div class="info-label">Queue Type</div>
                  <div class="info-value">
                    <span
                      class="queue-type-badge"
                      :class="getQueueTypeClass(queueProperties.queueType)"
                      :title="
                        getQueueTypeDescription(queueProperties.queueType)
                      "
                    >
                      {{ formatQueueType(queueProperties.queueType) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Delivery Model -->
            <div class="info-item">
              <div class="info-content">
                <div class="info-icon delivery-model-icon">
                  <i class="bi bi-arrow-left-right"></i>
                </div>
                <div class="info-details">
                  <div class="info-label">Delivery Model</div>
                  <div class="info-value">
                    <span
                      class="delivery-model-badge"
                      :class="
                        getDeliveryModelClass(queueProperties.deliveryModel)
                      "
                      :title="
                        getDeliveryModelDescription(
                          queueProperties.deliveryModel,
                        )
                      "
                    >
                      {{ formatDeliveryModel(queueProperties.deliveryModel) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Rate Limit Section -->
        <section class="info-section">
          <h4 class="section-title">
            <i class="bi bi-speedometer2"></i> Rate Limit
          </h4>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-content">
                <div class="info-icon rate-limit-icon">
                  <i class="bi bi-speedometer2"></i>
                </div>
                <div class="info-details">
                  <div class="info-label">Current Limit</div>
                  <div class="info-value">
                    <span class="rate-limit">{{
                      formatRateLimit(queueProperties.rateLimit)
                    }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Statistics Section -->
        <section class="info-section">
          <h4 class="section-title">
            <i class="bi bi-bar-chart-line-fill"></i> Message Statistics
          </h4>
          <div class="info-grid stats-grid">
            <div
              v-for="stat in messageStats"
              :key="stat.label"
              class="info-item stat-item"
              :class="{ clickable: !!stat.routeName }"
              :role="stat.routeName ? 'link' : 'listitem'"
              @click="navigateToMessages(stat.routeName)"
            >
              <div class="info-content">
                <div class="info-icon" :class="stat.iconClass">
                  <i :class="stat.icon"></i>
                </div>
                <div class="info-details">
                  <div class="info-label">{{ stat.label }}</div>
                  <div class="info-value stat-value">
                    {{ formatNumber(stat.value) }}
                  </div>
                </div>
                <div v-if="stat.routeName" class="info-arrow">
                  <i class="bi bi-chevron-right"></i>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- No Queue Selected -->
      <div v-else class="content-state empty-state">
        <div class="state-content">
          <div class="empty-icon">📋</div>
          <h4 class="state-title">No Queue Selected</h4>
          <p class="state-subtitle">Select a queue to view its properties</p>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* Card Container */
.queue-info-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #e9ecef;
  overflow: hidden;
  transition: box-shadow 0.2s ease;
}

.queue-info-card:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

/* Header */
.card-header {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content {
  flex: 1;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #212529;
  margin: 0 0 0.25rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.title-icon {
  color: #17a2b8;
  font-size: 1.1rem;
}

.card-subtitle {
  color: #6c757d;
  font-size: 0.875rem;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-refresh {
  background: white;
  border: 1px solid #ced4da;
  border-radius: 8px;
  padding: 0.5rem;
  color: #6c757d;
  transition: all 0.2s ease;
  cursor: pointer;
}

.btn-refresh:hover:not(:disabled) {
  background: #17a2b8;
  border-color: #17a2b8;
  color: white;
}

.spinning {
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

/* Content */
.card-content {
  padding: 2rem;
}

.queue-details-wrapper {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.info-section {
  background: #ffffff;
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid #e9ecef;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #495057;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Content States */
.content-state {
  text-align: center;
  padding: 1rem;
}

.state-content {
  max-width: 300px;
  margin: 0 auto;
}

.state-title {
  color: #495057;
  margin-bottom: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
}

.state-subtitle {
  color: #6c757d;
  margin: 0;
  font-size: 0.875rem;
}

/* Error State */
.error-content {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #dc3545;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

/* Empty State */
.empty-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  display: block;
}

/* Info Grids */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.stats-grid {
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.info-item {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.2s ease;
  border: 1px solid #e9ecef;
  border-left: 4px solid transparent;
}

.info-item.clickable {
  cursor: pointer;
  border-left: 4px solid #0d6efd;
}

.info-item.clickable:hover {
  background: #e9ecef;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.info-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.info-arrow {
  margin-left: auto;
  color: #adb5bd;
  transition: all 0.2s ease;
}

.info-item.clickable:hover .info-arrow {
  color: #0d6efd;
  transform: translateX(3px);
}

.info-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
}

.info-details {
  flex: 1;
  min-width: 0;
}

.info-label {
  font-weight: 500;
  color: #6c757d;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.25rem;
}

.info-value {
  line-height: 1.2;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #212529;
}

/* Configuration Item Styles */
.queue-name,
.namespace,
.rate-limit,
.fanout-exchange {
  font-size: 1rem;
  font-weight: 600;
  font-family: 'Courier New', monospace;
}

.queue-name {
  color: #0d6efd;
}
.namespace {
  color: #198754;
}
.rate-limit {
  color: #0c5460;
}
.fanout-exchange {
  color: #49258a;
}

.queue-type-badge,
.delivery-model-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.queue-type-badge.queue-type-fifo {
  background: #e7f3ff;
  color: #0d6efd;
}
.queue-type-badge.queue-type-lifo {
  background: #fff3cd;
  color: #856404;
}
.queue-type-badge.queue-type-priority {
  background: #f8d7da;
  color: #721c24;
}
.delivery-model-badge.delivery-model-p2p {
  background: #e8f5e8;
  color: #0f5132;
}
.delivery-model-badge.delivery-model-pubsub {
  background: #f3e8ff;
  color: #6f42c1;
}

/* Icon Colors */
.queue-name-icon {
  background: #e7f3ff;
  color: #0d6efd;
}
.namespace-icon {
  background: #e8f5e8;
  color: #198754;
}
.queue-type-icon {
  background: #fff3cd;
  color: #fd7e14;
}
.delivery-model-icon {
  background: #f3e8ff;
  color: #6f42c1;
}
.rate-limit-icon {
  background: #d1ecf1;
  color: #0c5460;
}
.fanout-exchange-icon {
  background: #e2d9f3;
  color: #49258a;
}
.total-icon {
  background: #e2e3e5;
  color: #495057;
}
.pending-icon {
  background: #fff3cd;
  color: #856404;
}
.processing-icon {
  background: #d1ecf1;
  color: #0c5460;
}
.acknowledged-icon {
  background: #d4edda;
  color: #155724;
}
.dead-lettered-icon {
  background: #f8d7da;
  color: #721c24;
}
.scheduled-icon {
  background: #d6d8db;
  color: #383d41;
}
.delayed-icon {
  background: #fde2e4;
  color: #721c24;
}
.requeued-icon {
  background: #d1e7dd;
  color: #0f5132;
}

/* Responsive Design */
@media (max-width: 768px) {
  .card-header {
    padding: 1rem 1.5rem;
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  .card-content {
    padding: 1.5rem;
  }
  .info-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  .info-item {
    padding: 0.75rem;
  }
  .info-content {
    gap: 0.5rem;
  }
  .info-icon {
    width: 28px;
    height: 28px;
    font-size: 0.875rem;
  }
  .content-state {
    padding: 0.75rem;
  }
}

@media (max-width: 480px) {
  .card-header,
  .card-content {
    padding: 1rem;
  }
  .info-item {
    padding: 0.75rem;
  }
  .empty-icon {
    font-size: 2rem;
  }
}

/* Focus states for accessibility */
.btn-refresh:focus {
  outline: 2px solid #17a2b8;
  outline-offset: 2px;
}
</style>

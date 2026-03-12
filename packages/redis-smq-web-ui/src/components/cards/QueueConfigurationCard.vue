<!--
  - Copyright (c)
  - Weyoss <weyoss@outlook.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { useSelectedQueuePropertiesStore } from '@/stores/selectedQueueProperties.ts';
import { EQueueDeliveryModel, EQueueType } from '@/types';
import { computed } from 'vue';
import { useSelectedQueueStore } from '@/stores/selectedQueue.ts';

const selectedQueueStore = useSelectedQueueStore();
const queuesPropertiesStore = useSelectedQueuePropertiesStore();

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
    return `Failed to load queue configuration: ${error.message}`;
  }
  return null;
});

// Refresh queue information
function refreshQueueInfo() {
  queuesPropertiesStore.refreshQueueProperties();
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
  <div class="config-card">
    <!-- Header -->
    <header class="card-header">
      <div class="header-content">
        <h3 class="card-title">
          <i class="bi bi-gear-fill title-icon"></i>
          Queue Configuration
        </h3>
        <p class="card-subtitle">
          Queue settings and rate limiting configuration
        </p>
      </div>
      <div class="header-actions">
        <button
          class="btn btn-refresh"
          :disabled="isLoading"
          aria-label="Refresh queue configuration"
          title="Refresh queue configuration"
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
          <div
            class="spinner-border text-primary mb-2"
            role="status"
            aria-live="polite"
            aria-label="Loading queue configuration"
          ></div>
          <h5 class="state-title">Loading configuration...</h5>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="content-state error-state" role="alert">
        <div class="error-content">
          <i
            class="bi bi-exclamation-triangle-fill text-danger me-2"
            aria-hidden="true"
          ></i>
          <span>{{ error }}</span>
        </div>
        <button class="btn btn-sm btn-primary mt-2" @click="refreshQueueInfo">
          <i class="bi bi-arrow-clockwise me-1" aria-hidden="true"></i>
          Retry
        </button>
      </div>

      <!-- Configuration Details -->
      <div v-else-if="queue && queueProperties" class="config-details-wrapper">
        <!-- Basic Configuration Section -->
        <section class="info-section">
          <h4 class="section-title">
            <i class="bi bi-info-circle-fill" aria-hidden="true"></i>
            Basic Information
          </h4>
          <div class="info-grid">
            <!-- Queue Name -->
            <div class="info-item">
              <div class="info-content">
                <div class="info-icon queue-name-icon">
                  <i class="bi bi-tag-fill" aria-hidden="true"></i>
                </div>
                <div class="info-details">
                  <div class="info-label">Queue Name</div>
                  <div class="info-value">
                    <span class="queue-name" :title="queue.name">{{
                      queue.name
                    }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Namespace -->
            <div class="info-item">
              <div class="info-content">
                <div class="info-icon namespace-icon">
                  <i class="bi bi-folder-fill" aria-hidden="true"></i>
                </div>
                <div class="info-details">
                  <div class="info-label">Namespace</div>
                  <div class="info-value">
                    <span class="namespace" :title="queue.ns">{{
                      queue.ns
                    }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Queue Type -->
            <div class="info-item">
              <div class="info-content">
                <div class="info-icon queue-type-icon">
                  <i class="bi bi-list-ol" aria-hidden="true"></i>
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
                  <i class="bi bi-arrow-left-right" aria-hidden="true"></i>
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
            <i class="bi bi-speedometer2" aria-hidden="true"></i>
            Rate Limiting
          </h4>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-content">
                <div class="info-icon rate-limit-icon">
                  <i class="bi bi-speedometer2" aria-hidden="true"></i>
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
      </div>

      <!-- No Queue Selected -->
      <div v-else class="content-state empty-state">
        <div class="state-content">
          <div class="empty-icon" aria-hidden="true">⚙️</div>
          <h4 class="state-title">No Queue Selected</h4>
          <p class="state-subtitle">Select a queue to view its configuration</p>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* Mobile-first safety: sizing and overflow guards */
.config-card,
.config-card * {
  box-sizing: border-box;
}

.config-card img,
.config-card svg,
.config-card video {
  max-width: 100%;
  height: auto;
}

/* Card Container */
.config-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #e9ecef;
  overflow: hidden;
  transition: box-shadow 0.2s ease;
  height: fit-content;
}

.config-card:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

/* Header */
.card-header {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: clamp(12px, 3.2vw, 24px) clamp(16px, 4vw, 32px);
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: clamp(8px, 2.5vw, 16px);
  flex-wrap: wrap;
}

.header-content {
  flex: 1 1 auto;
  min-width: 0;
}

.card-title {
  font-size: clamp(1.05rem, 2.8vw, 1.25rem);
  font-weight: 700;
  color: #212529;
  margin: 0 0 0.25rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.title-icon {
  color: #fd7e14;
  font-size: clamp(1rem, 2.6vw, 1.1rem);
  flex-shrink: 0;
}

.card-subtitle {
  color: #6c757d;
  font-size: clamp(0.85rem, 2.6vw, 0.95rem);
  margin: 0;
  overflow-wrap: anywhere;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
  flex: 0 0 auto;
}

.btn-refresh {
  background: white;
  border: 1px solid #ced4da;
  border-radius: 10px;
  color: #6c757d;
  transition: all 0.2s ease;
  cursor: pointer;
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;
}

.btn-refresh:hover:not(:disabled) {
  background: #fd7e14;
  border-color: #fd7e14;
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
  padding: clamp(16px, 4vw, 32px);
}

.config-details-wrapper {
  display: flex;
  flex-direction: column;
  gap: clamp(16px, 3vw, 24px);
}

.info-section {
  background: #ffffff;
  border-radius: 12px;
  padding: clamp(12px, 3vw, 20px);
  border: 1px solid #e9ecef;
}

.section-title {
  font-size: clamp(1rem, 3vw, 1.1rem);
  font-weight: 600;
  color: #495057;
  margin: 0 0 clamp(10px, 2.2vw, 16px) 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Content States */
.content-state {
  text-align: center;
  padding: clamp(12px, 3vw, 20px);
}

.state-content {
  max-width: 360px;
  margin: 0 auto;
}

.state-title {
  color: #495057;
  margin-bottom: 0.5rem;
  font-weight: 600;
  font-size: clamp(0.95rem, 2.8vw, 1rem);
}

.state-subtitle {
  color: #6c757d;
  margin: 0;
  font-size: clamp(0.8rem, 2.5vw, 0.9rem);
  line-height: 1.4;
  overflow-wrap: anywhere;
}

/* Error State */
.error-content {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #dc3545;
  font-size: clamp(0.8rem, 2.5vw, 0.9rem);
  margin-bottom: 0.5rem;
  gap: 0.5rem;
}

/* Empty State */
.empty-icon {
  font-size: clamp(2rem, 7vw, 2.5rem);
  margin-bottom: 1rem;
  display: block;
}

/* Info Grids */
.info-grid {
  display: grid;
  grid-template-columns: repeat(
    auto-fit,
    minmax(clamp(200px, 40vw, 280px), 1fr)
  );
  gap: clamp(10px, 2.5vw, 16px);
}

.properties-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: clamp(10px, 2vw, 16px);
}

.property-item {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 0.75rem;
  border: 1px solid #e9ecef;
}

.property-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.25rem;
}

.property-value {
  font-size: 0.95rem;
  color: #212529;
  font-weight: 500;
  word-break: break-word;
}

.info-item {
  background: #f8f9fa;
  border-radius: 10px;
  padding: clamp(10px, 2.5vw, 16px);
  transition: all 0.2s ease;
  border: 1px solid #e9ecef;
  border-left: 4px solid transparent;
  min-width: 0;
}

.info-item:hover {
  background: #e9ecef;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.info-content {
  display: flex;
  align-items: center;
  gap: clamp(8px, 2.2vw, 12px);
  min-width: 0;
}

.info-icon {
  width: clamp(28px, 6vw, 32px);
  height: clamp(28px, 6vw, 32px);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(0.9rem, 3vw, 1rem);
  flex-shrink: 0;
}

.info-details {
  flex: 1 1 auto;
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
  line-height: 1.3;
  min-width: 0;
  overflow-wrap: anywhere;
  word-break: break-word;
}

/* Value Styles */
.queue-name,
.namespace,
.rate-limit {
  font-size: clamp(0.95rem, 3vw, 1rem);
  font-weight: 600;
  font-family: 'Courier New', monospace;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.queue-name {
  color: #0d6efd;
}
.namespace {
  color: #198754;
}
.rate-limit {
  color: #fd7e14;
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
  white-space: nowrap;
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
  background: #fff3cd;
  color: #fd7e14;
}

/* Responsive Design */
@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }
  .card-content {
    padding: clamp(12px, 3.5vw, 20px);
  }
  .content-state {
    padding: clamp(10px, 3vw, 16px);
  }
}

@media (max-width: 576px) {
  .card-header {
    padding: clamp(10px, 3.5vw, 14px) clamp(12px, 4vw, 16px);
  }
  .card-content {
    padding: clamp(12px, 4vw, 16px);
  }
  .empty-icon {
    font-size: clamp(1.8rem, 8vw, 2rem);
  }
  .properties-grid {
    grid-template-columns: 1fr;
  }
}

/* Focus states for accessibility */
.btn-refresh:focus-visible {
  outline: 2px solid #fd7e14;
  outline-offset: 2px;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .config-card,
  .btn-refresh,
  .info-item {
    transition: none;
  }
  .info-item:hover {
    transform: none;
  }
}
</style>

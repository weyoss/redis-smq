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
import { computed } from 'vue';
import { useSelectedQueueStore } from '@/stores/selectedQueue.ts';
import { useTypedRouter } from '@/router/useTypeRouter.ts';
import type { RouteName } from '@/router/types.ts';

const selectedQueueStore = useSelectedQueueStore();
const queuesPropertiesStore = useSelectedQueuePropertiesStore();
const router = useTypedRouter();

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
    return `Failed to load message statistics: ${error.message}`;
  }
  return null;
});

const messageStats = computed<
  {
    label: string;
    value: number;
    icon: string;
    iconClass: string;
    routeName: RouteName | null;
    description: string;
  }[]
>(() => {
  if (!queueProperties.value) return [];
  return [
    {
      label: 'Total Messages',
      value: queueProperties.value.messagesCount,
      icon: 'bi-collection-fill',
      iconClass: 'total-icon',
      routeName: 'messages',
      description: 'All messages in the queue',
    },
    {
      label: 'Pending',
      value: queueProperties.value.pendingMessagesCount,
      icon: 'bi-clock-history',
      iconClass: 'pending-icon',
      routeName: 'pendingMessages',
      description: 'Messages waiting to be processed',
    },
    {
      label: 'Processing',
      value: queueProperties.value.processingMessagesCount,
      icon: 'bi-hourglass-split',
      iconClass: 'processing-icon',
      routeName: null,
      description: 'Messages currently being processed',
    },
    {
      label: 'Acknowledged',
      value: queueProperties.value.acknowledgedMessagesCount,
      icon: 'bi-check-circle-fill',
      iconClass: 'acknowledged-icon',
      routeName: 'acknowledgedMessages',
      description: 'Successfully processed messages',
    },
    {
      label: 'Dead-lettered',
      value: queueProperties.value.deadLetteredMessagesCount,
      icon: 'bi-x-octagon-fill',
      iconClass: 'dead-lettered-icon',
      routeName: 'deadLetteredMessages',
      description: 'Messages that failed processing',
    },
    {
      label: 'Scheduled',
      value: queueProperties.value.scheduledMessagesCount,
      icon: 'bi-calendar-plus-fill',
      iconClass: 'scheduled-icon',
      routeName: 'scheduledMessages',
      description: 'Messages scheduled for future delivery',
    },
    {
      label: 'Delayed',
      value: queueProperties.value.delayedMessagesCount,
      icon: 'bi-stopwatch-fill',
      iconClass: 'delayed-icon',
      routeName: null,
      description: 'Messages with delayed delivery',
    },
    {
      label: 'Requeued',
      value: queueProperties.value.requeuedMessagesCount,
      icon: 'bi-arrow-repeat',
      iconClass: 'requeued-icon',
      routeName: null,
      description: 'Messages returned to queue for reprocessing',
    },
  ];
});

// Navigation
function navigateToMessages(routeName: RouteName | null) {
  if (!routeName || !queue.value) return;
  router.push(routeName, {
    params: {
      ns: queue.value.ns,
      queue: queue.value.name,
    },
  });
}

// Refresh statistics
function refreshStats() {
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

// Calculate percentages for visual indicators
function getPercentage(value: number | null | undefined): number {
  if (!value || !queueProperties.value?.messagesCount) return 0;
  return Math.round((value / queueProperties.value.messagesCount) * 100);
}
</script>

<template>
  <div class="stats-card">
    <!-- Header -->
    <header class="card-header">
      <div class="header-content">
        <h3 class="card-title">
          <i class="bi bi-bar-chart-line-fill title-icon"></i>
          Message Statistics
        </h3>
        <p class="card-subtitle">Real-time message counts and distribution</p>
      </div>
      <div class="header-actions">
        <button
          class="btn btn-refresh"
          :disabled="isLoading"
          aria-label="Refresh message statistics"
          title="Refresh statistics"
          @click="refreshStats"
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
            aria-label="Loading statistics"
          ></div>
          <h5 class="state-title">Loading statistics...</h5>
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
        <button class="btn btn-sm btn-primary mt-2" @click="refreshStats">
          <i class="bi bi-arrow-clockwise me-1" aria-hidden="true"></i>
          Retry
        </button>
      </div>

      <!-- Statistics -->
      <div v-else-if="queue && queueProperties" class="stats-wrapper">
        <!-- Total Messages -->
        <div
          class="total-messages-card clickable"
          role="link"
          tabindex="0"
          :title="'View all messages in this queue'"
          @click="navigateToMessages('messages')"
          @keydown.enter="navigateToMessages('messages')"
        >
          <div class="total-content">
            <div class="total-icon-wrapper">
              <i class="bi bi-envelope-paper-fill"></i>
            </div>
            <div class="total-details">
              <div class="total-label">Total Messages</div>
              <div class="total-value">
                {{ formatNumber(queueProperties.messagesCount) }}
              </div>
            </div>
            <div class="total-arrow" aria-hidden="true">
              <i class="bi bi-chevron-right"></i>
            </div>
          </div>
          <div class="total-hint">
            <i class="bi bi-eye me-1"></i>
            Click to view all messages
          </div>
        </div>

        <!-- Statistics Grid -->
        <div class="stats-grid">
          <div
            v-for="stat in messageStats.filter(
              (s) => s.label !== 'Total Messages',
            )"
            :key="stat.label"
            class="stat-item"
            :class="{ clickable: !!stat.routeName }"
            :role="stat.routeName ? 'link' : 'listitem'"
            :tabindex="stat.routeName ? 0 : -1"
            :title="stat.description"
            @click="navigateToMessages(stat.routeName)"
            @keydown.enter="navigateToMessages(stat.routeName)"
          >
            <div class="stat-content">
              <div class="stat-header">
                <div class="stat-icon" :class="stat.iconClass">
                  <i :class="stat.icon" aria-hidden="true"></i>
                </div>
                <div class="stat-label">{{ stat.label }}</div>
                <div
                  v-if="stat.routeName"
                  class="stat-arrow"
                  aria-hidden="true"
                >
                  <i class="bi bi-chevron-right"></i>
                </div>
              </div>
              <div class="stat-value-group">
                <span class="stat-value">{{ formatNumber(stat.value) }}</span>
                <span class="stat-percentage"
                  >{{ getPercentage(stat.value) }}%</span
                >
              </div>
              <!-- Progress bar -->
              <div class="progress-bar-container">
                <div
                  class="progress-bar"
                  :class="stat.iconClass"
                  :style="{ width: `${getPercentage(stat.value)}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Summary Footer -->
        <div class="stats-footer">
          <div class="footer-item">
            <i class="bi bi-clock-history me-1"></i>
            <span>Last updated: {{ new Date().toLocaleTimeString() }}</span>
          </div>
          <div class="footer-item">
            <i class="bi bi-info-circle me-1"></i>
            <span>Click on any stat to view messages</span>
          </div>
        </div>
      </div>

      <!-- No Queue Selected -->
      <div v-else class="content-state empty-state">
        <div class="state-content">
          <div class="empty-icon" aria-hidden="true">📊</div>
          <h4 class="state-title">No Queue Selected</h4>
          <p class="state-subtitle">
            Select a queue to view its message statistics
          </p>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* Mobile-first safety: sizing and overflow guards */
.stats-card,
.stats-card * {
  box-sizing: border-box;
}

.stats-card img,
.stats-card svg,
.stats-card video {
  max-width: 100%;
  height: auto;
}

/* Card Container */
.stats-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #e9ecef;
  overflow: hidden;
  transition: box-shadow 0.2s ease;
  height: fit-content;
}

.stats-card:hover {
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
  color: #0d6efd;
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
  background: #0d6efd;
  border-color: #0d6efd;
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

.stats-wrapper {
  display: flex;
  flex-direction: column;
  gap: clamp(16px, 3vw, 24px);
}

/* Total Messages Card */
.total-messages-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 1.25rem;
  color: white;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  border: 2px solid transparent;
}

.total-messages-card.clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
  border-color: rgba(255, 255, 255, 0.3);
}

.total-messages-card.clickable:focus {
  outline: 2px solid white;
  outline-offset: 2px;
}

.total-messages-card.clickable:active {
  transform: translateY(0);
}

.total-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  position: relative;
}

.total-icon-wrapper {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  transition: transform 0.2s ease;
}

.total-messages-card:hover .total-icon-wrapper {
  transform: scale(1.05);
}

.total-details {
  flex: 1;
}

.total-label {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.9;
  margin-bottom: 0.25rem;
}

.total-value {
  font-size: 1.8rem;
  font-weight: 700;
  line-height: 1.2;
}

.total-arrow {
  opacity: 0;
  transform: translateX(-10px);
  transition: all 0.2s ease;
  font-size: 1.2rem;
}

.total-messages-card:hover .total-arrow {
  opacity: 1;
  transform: translateX(0);
}

.total-hint {
  font-size: 0.8rem;
  opacity: 0.8;
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  transition: opacity 0.2s ease;
}

.total-messages-card:hover .total-hint {
  opacity: 1;
}

/* Statistics Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: clamp(12px, 2.5vw, 16px);
}

.stat-item {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1rem;
  transition: all 0.2s ease;
  border: 1px solid #e9ecef;
  cursor: default;
}

.stat-item.clickable {
  cursor: pointer;
  border-left: 4px solid #0d6efd;
}

.stat-item.clickable:hover {
  background: #e9ecef;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-item.clickable:focus {
  outline: 2px solid #0d6efd;
  outline-offset: 2px;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stat-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
}

.stat-label {
  font-weight: 600;
  color: #495057;
  font-size: 0.9rem;
  flex: 1;
}

.stat-arrow {
  color: #adb5bd;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.stat-item.clickable:hover .stat-arrow {
  color: #0d6efd;
  transform: translateX(3px);
}

.stat-value-group {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #212529;
}

.stat-percentage {
  font-size: 0.85rem;
  color: #6c757d;
  font-weight: 500;
}

/* Progress Bar */
.progress-bar-container {
  height: 4px;
  background: #e9ecef;
  border-radius: 2px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  transition: width 0.3s ease;
}

/* Icon Colors */
.total-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
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
  background: #e2e3e5;
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

/* Progress bar colors */
.progress-bar.pending-icon {
  background: #ffc107;
}
.progress-bar.processing-icon {
  background: #17a2b8;
}
.progress-bar.acknowledged-icon {
  background: #28a745;
}
.progress-bar.dead-lettered-icon {
  background: #dc3545;
}
.progress-bar.scheduled-icon {
  background: #6c757d;
}
.progress-bar.delayed-icon {
  background: #dc3545;
}
.progress-bar.requeued-icon {
  background: #20c997;
}

/* Stats Footer */
.stats-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid #e9ecef;
  font-size: 0.8rem;
  color: #6c757d;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.footer-item {
  display: flex;
  align-items: center;
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
  .stats-footer {
    flex-direction: column;
    align-items: flex-start;
  }

  .total-content {
    flex-wrap: wrap;
  }

  .total-arrow {
    opacity: 1;
    transform: translateX(0);
  }

  .total-hint {
    justify-content: flex-start;
  }
}

@media (max-width: 576px) {
  .card-header {
    padding: clamp(10px, 3.5vw, 14px) clamp(12px, 4vw, 16px);
  }
  .card-content {
    padding: clamp(12px, 4vw, 16px);
  }
  .total-value {
    font-size: 1.5rem;
  }
  .stats-grid {
    grid-template-columns: 1fr;
  }
  .empty-icon {
    font-size: clamp(1.8rem, 8vw, 2rem);
  }
}

/* Focus states for accessibility */
.btn-refresh:focus-visible {
  outline: 2px solid #0d6efd;
  outline-offset: 2px;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .stats-card,
  .btn-refresh,
  .total-messages-card,
  .stat-item,
  .progress-bar,
  .total-icon-wrapper,
  .total-arrow {
    animation: none;
    transition: none;
  }

  .total-messages-card.clickable:hover,
  .stat-item.clickable:hover {
    transform: none;
  }

  .total-messages-card:hover .total-icon-wrapper {
    transform: none;
  }
}
</style>

<!--
  - Copyright (c)
  - Weyoss <weyoss@protonmail.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { formatNumber } from '@/lib/format.ts';
import { useQueueStats } from '@/composables/useQueueStats.ts';
import { computed } from 'vue';
import { getErrorMessage } from '@/lib/error.ts';
import { useSelectedQueueStore } from '@/stores/selectedQueue.ts';

const selectedQueueStore = useSelectedQueueStore();
const selectedQueue = computed(() => selectedQueueStore.selectedQueue);

// Use the queue statistics composable
const {
  stats,
  totalMessages,
  isLoading,
  error,
  hasValidQueue,
  getPercentage,
  refetchAll,
} = useQueueStats();

// Handle refresh with loading state
function handleRefresh(): void {
  if (!hasValidQueue.value || isLoading.value) {
    return;
  }
  refetchAll();
}
</script>

<template>
  <div class="queue-stats-card">
    <!-- Header -->
    <header class="card-header">
      <div class="header-content">
        <h3 class="card-title">
          <i class="bi bi-bar-chart-fill title-icon"></i>
          Queue Statistics
        </h3>
        <p class="card-subtitle">Real-time message metrics and analytics</p>
      </div>
      <div class="header-actions">
        <button
          class="btn btn-refresh"
          :disabled="!hasValidQueue || isLoading"
          title="Refresh statistics"
          @click="handleRefresh"
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
          <h5 class="state-title">Loading statistics...</h5>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="content-state error-state">
        <div class="error-content">
          <i class="bi bi-exclamation-triangle-fill text-danger me-2"></i>
          <span>{{ getErrorMessage(error) }}</span>
        </div>
        <button class="btn btn-sm btn-primary mt-2" @click="handleRefresh">
          <i class="bi bi-arrow-clockwise me-1"></i>
          Retry
        </button>
      </div>

      <!-- Statistics Content -->
      <div v-else-if="selectedQueue" class="stats-info">
        <!-- Total Messages Overview -->
        <div class="total-overview">
          <div class="total-item">
            <div class="total-content">
              <div class="total-icon">
                <i class="bi bi-envelope-fill"></i>
              </div>
              <div class="total-details">
                <div class="total-label">Total Messages</div>
                <div class="total-value">
                  {{ formatNumber(totalMessages) }}
                </div>
                <div class="total-subtitle">All messages in queue</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Statistics Grid -->
        <div class="stats-grid">
          <!-- Pending Messages -->
          <router-link
            :to="{
              name: 'Pending Messages',
              params: {
                ns: selectedQueue.ns,
                queue: selectedQueue.name,
              },
            }"
            class="stat-item stat-clickable"
          >
            <div class="stat-content">
              <div class="stat-icon pending-icon">
                <i class="bi bi-clock-fill"></i>
              </div>
              <div class="stat-details">
                <div class="stat-label">Pending</div>
                <div class="stat-value">
                  {{ formatNumber(stats.pending) }}
                </div>
                <div class="stat-description">Waiting to be processed</div>
                <div class="stat-progress">
                  <div
                    class="progress-bar pending-progress"
                    :style="{ width: `${getPercentage(stats.pending)}%` }"
                  ></div>
                </div>
              </div>
              <div class="stat-arrow">
                <i class="bi bi-arrow-right"></i>
              </div>
            </div>
          </router-link>

          <!-- Acknowledged Messages -->
          <router-link
            :to="{
              name: 'Acknowledged Messages',
              params: {
                ns: selectedQueue.ns,
                queue: selectedQueue.name,
              },
            }"
            class="stat-item stat-clickable"
          >
            <div class="stat-content">
              <div class="stat-icon acknowledged-icon">
                <i class="bi bi-check-circle-fill"></i>
              </div>
              <div class="stat-details">
                <div class="stat-label">Acknowledged</div>
                <div class="stat-value">
                  {{ formatNumber(stats.acknowledged) }}
                </div>
                <div class="stat-description">Successfully processed</div>
                <div class="stat-progress">
                  <div
                    class="progress-bar acknowledged-progress"
                    :style="{ width: `${getPercentage(stats.acknowledged)}%` }"
                  ></div>
                </div>
              </div>
              <div class="stat-arrow">
                <i class="bi bi-arrow-right"></i>
              </div>
            </div>
          </router-link>

          <!-- Dead-lettered Messages-->
          <router-link
            :to="{
              name: 'Dead-Lettered Messages',
              params: {
                ns: selectedQueue.ns,
                queue: selectedQueue.name,
              },
            }"
            class="stat-item stat-clickable"
          >
            <div class="stat-content">
              <div class="stat-icon dead-letter-icon">
                <i class="bi bi-x-circle-fill"></i>
              </div>
              <div class="stat-details">
                <div class="stat-label">Dead Letter</div>
                <div class="stat-value">
                  {{ formatNumber(stats.deadLettered) }}
                </div>
                <div class="stat-description">Failed processing</div>
                <div class="stat-progress">
                  <div
                    class="progress-bar dead-letter-progress"
                    :style="{ width: `${getPercentage(stats.deadLettered)}%` }"
                  ></div>
                </div>
              </div>
              <div class="stat-arrow">
                <i class="bi bi-arrow-right"></i>
              </div>
            </div>
          </router-link>

          <!-- Scheduled Messages -->
          <router-link
            :to="{
              name: 'Scheduled Messages',
              params: {
                ns: selectedQueue.ns,
                queue: selectedQueue.name,
              },
            }"
            class="stat-item stat-clickable"
          >
            <div class="stat-content">
              <div class="stat-icon scheduled-icon">
                <i class="bi bi-calendar-event-fill"></i>
              </div>
              <div class="stat-details">
                <div class="stat-label">Scheduled</div>
                <div class="stat-value">
                  {{ formatNumber(stats.scheduled) }}
                </div>
                <div class="stat-description">Scheduled for later</div>
                <div class="stat-progress">
                  <div
                    class="progress-bar scheduled-progress"
                    :style="{ width: `${getPercentage(stats.scheduled)}%` }"
                  ></div>
                </div>
              </div>
              <div class="stat-arrow">
                <i class="bi bi-arrow-right"></i>
              </div>
            </div>
          </router-link>
        </div>
      </div>

      <!-- No Queue Selected -->
      <div v-else class="content-state empty-state">
        <div class="state-content">
          <div class="empty-icon">📊</div>
          <h4 class="state-title">No Queue Selected</h4>
          <p class="state-subtitle">
            Select a queue to view detailed statistics and metrics
          </p>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* Card Container */
.queue-stats-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #e9ecef;
  overflow: hidden;
  transition: box-shadow 0.2s ease;
}

.queue-stats-card:hover {
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

.btn-refresh:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.btn-refresh:focus {
  outline: 2px solid #17a2b8;
  outline-offset: 2px;
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

/* Total Overview */
.total-overview {
  margin-bottom: 2rem;
}

.total-item {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1.5rem;
  border: 1px solid #e9ecef;
  transition: all 0.2s ease;
}

.total-item:hover {
  background: #f1f3f4;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.total-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.total-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
  background: #e7f3ff;
  color: #0d6efd;
}

.total-details {
  flex: 1;
  min-width: 0;
}

.total-label {
  font-weight: 500;
  color: #6c757d;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.25rem;
}

.total-value {
  font-size: 2rem;
  font-weight: 700;
  color: #212529;
  margin-bottom: 0.25rem;
  line-height: 1.2;
}

.total-subtitle {
  color: #6c757d;
  font-size: 0.875rem;
  margin: 0;
}

/* Statistics Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

/* Stat Items */
.stat-item {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1.5rem;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s ease;
  display: block;
}

.stat-item:hover {
  text-decoration: none;
  color: inherit;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #ced4da;
}

.stat-clickable:hover {
  cursor: pointer;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.stat-details {
  flex: 1;
  min-width: 0;
}

.stat-label {
  font-weight: 600;
  color: #495057;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #212529;
  margin-bottom: 0.25rem;
  line-height: 1.2;
}

.stat-description {
  color: #6c757d;
  font-size: 0.75rem;
  margin-bottom: 0.5rem;
}

.stat-progress {
  height: 4px;
  background: #e9ecef;
  border-radius: 2px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.stat-arrow {
  color: #6c757d;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.stat-item:hover .stat-arrow {
  color: #495057;
  transform: translateX(2px);
}

/* Icon Variants */
.pending-icon {
  background: #fff3cd;
  color: #856404;
}

.pending-progress {
  background: #ffc107;
}

.acknowledged-icon {
  background: #d1e7dd;
  color: #0f5132;
}

.acknowledged-progress {
  background: #198754;
}

.dead-letter-icon {
  background: #f8d7da;
  color: #721c24;
}

.dead-letter-progress {
  background: #dc3545;
}

.scheduled-icon {
  background: #cff4fc;
  color: #055160;
}

.scheduled-progress {
  background: #0dcaf0;
}

/* Responsive Design */
@media (max-width: 768px) {
  .card-header {
    padding: 1rem 1.5rem;
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .card-content {
    padding: 1.5rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .stat-item {
    padding: 1rem;
  }

  .stat-content {
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

  .total-item {
    padding: 1rem;
  }

  .total-content {
    gap: 0.75rem;
  }

  .total-icon {
    width: 40px;
    height: 40px;
    font-size: 1.25rem;
  }

  .total-value {
    font-size: 1.5rem;
  }
}

@media (max-width: 576px) {
  .card-header {
    padding: 1rem;
  }

  .card-content {
    padding: 1rem;
  }

  .card-title {
    font-size: 1.125rem;
  }

  .total-overview {
    margin-bottom: 1.5rem;
  }

  .stat-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .stat-arrow {
    align-self: flex-end;
  }
}
</style>

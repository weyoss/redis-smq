<!--
  - Copyright (c)
  - Weyoss <weyoss@outlook.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { formatDate, formatDateSince } from '@/lib/format.ts';
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useQueueConsumers } from '@/composables/useQueueConsumers.ts';
import type { Consumer } from '@/composables/useQueueConsumers.ts';
import { useSelectedQueueStore } from '@/stores/selectedQueue.ts';
import { getErrorMessage } from '@/lib/error.ts';

const selectedQueueStore = useSelectedQueueStore();
const queueConsumers = useQueueConsumers();

// Local state
const isRealTimeEnabled = ref(true);
const selectedHostname = ref<string>('');
const searchQuery = ref('');

// Computed properties from consumers store
const consumers = computed(() => queueConsumers.consumersArray.value);
const isLoadingConsumers = computed(
  () => queueConsumers.isLoadingConsumers.value,
);
const isRefetchingConsumers = computed(
  () => queueConsumers.isRefetchingConsumers.value,
);
const consumersError = computed(() => queueConsumers.consumersError.value);
const hasConsumers = computed(() => queueConsumers.hasConsumers.value);
const consumerStats = computed(() => queueConsumers.consumerStats.value);
const uniqueHostnames = computed(() => queueConsumers.uniqueHostnames.value);

// Filtered consumers based on search and hostname filter
const filteredConsumers = computed(() => {
  let result = consumers.value;

  // Filter by hostname if selected
  if (selectedHostname.value) {
    result = result.filter(
      (consumer) => consumer.hostname === selectedHostname.value,
    );
  }

  // Filter by search query
  if (searchQuery.value.trim()) {
    result = queueConsumers.searchConsumers(searchQuery.value);
  }

  return result;
});

// Actions
function refreshConsumers() {
  queueConsumers.refreshConsumers();
}

function toggleRealTime() {
  isRealTimeEnabled.value = !isRealTimeEnabled.value;
  if (isRealTimeEnabled.value) {
    queueConsumers.enableRealTimeUpdates();
  } else {
    queueConsumers.disableRealTimeUpdates();
  }
}

function clearFilters() {
  selectedHostname.value = '';
  searchQuery.value = '';
}

function getConsumerStatusClass(consumer: Consumer): string {
  const uptime = queueConsumers.getConsumerUptime(consumer);
  const minutes = uptime / (1000 * 60);

  if (minutes < 1) return 'status-new';
  if (minutes < 60) return 'status-active';
  return 'status-stable';
}

function getConsumerStatusText(consumer: Consumer): string {
  const uptime = queueConsumers.getConsumerUptime(consumer);
  const minutes = uptime / (1000 * 60);

  if (minutes < 1) return 'New';
  if (minutes < 60) return 'Active';
  return 'Stable';
}

// Lifecycle
onMounted(() => {
  if (isRealTimeEnabled.value) {
    queueConsumers.enableRealTimeUpdates();
  }
});

onUnmounted(() => {
  queueConsumers.disableRealTimeUpdates();
});
</script>

<template>
  <div v-if="selectedQueueStore.selectedQueue" class="queue-consumers-card">
    <!-- Header -->
    <header class="card-header">
      <div class="header-content">
        <h3 class="card-title">
          <i class="bi bi-people-fill title-icon"></i>
          Queue Consumers
        </h3>
        <p class="card-subtitle">
          Active consumers processing messages from this queue
        </p>
      </div>
      <div class="header-actions">
        <button
          class="btn btn-toggle"
          :class="{ active: isRealTimeEnabled }"
          :title="
            isRealTimeEnabled
              ? 'Disable real-time updates'
              : 'Enable real-time updates'
          "
          @click="toggleRealTime"
        >
          <i
            class="bi"
            :class="isRealTimeEnabled ? 'bi-pause-fill' : 'bi-play-fill'"
          ></i>
        </button>
        <button
          class="btn btn-refresh"
          :disabled="isLoadingConsumers"
          title="Refresh consumers"
          @click="refreshConsumers"
        >
          <i
            class="bi bi-arrow-clockwise"
            :class="{ spinning: isRefetchingConsumers }"
          ></i>
        </button>
      </div>
    </header>

    <!-- Content -->
    <main class="card-content">
      <!-- Loading State -->
      <div v-if="isLoadingConsumers" class="content-state loading-state">
        <div class="state-content">
          <div
            class="spinner-border text-primary mb-3"
            role="status"
            aria-live="polite"
            aria-label="Loading consumers"
          ></div>
          <h5 class="state-title">Loading consumers...</h5>
          <p class="state-subtitle">
            Please wait while we fetch the active consumers
          </p>
        </div>
      </div>

      <!-- Error State -->
      <div
        v-else-if="consumersError"
        class="content-state error-state"
        role="alert"
      >
        <div class="error-content">
          <div class="error-icon">
            <i
              class="bi bi-exclamation-triangle-fill text-danger"
              aria-hidden="true"
            ></i>
          </div>
          <div class="error-text">
            <h5 class="error-title">Failed to load consumers</h5>
            <p class="error-message">
              {{ getErrorMessage(consumersError)?.message }}
            </p>
          </div>
        </div>
        <div class="error-actions">
          <button class="btn btn-primary" @click="refreshConsumers">
            <i class="bi bi-arrow-clockwise me-2"></i>
            Try Again
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="!hasConsumers" class="content-state empty-state">
        <div class="state-content">
          <div class="empty-icon" aria-hidden="true">👥</div>
          <h4 class="state-title">No Active Consumers</h4>
          <p class="state-subtitle">
            No consumers are currently connected to this queue. Start a consumer
            application to begin processing messages.
          </p>
          <div class="empty-info">
            <div class="info-item">
              <i class="bi bi-info-circle me-2" aria-hidden="true"></i>
              <span
                >Consumers will appear here when they connect to the queue</span
              >
            </div>
            <div class="info-item">
              <i class="bi bi-info-circle me-2" aria-hidden="true"></i>
              <span
                >Real-time updates are
                {{ isRealTimeEnabled ? 'enabled' : 'disabled' }}</span
              >
            </div>
          </div>
        </div>
      </div>

      <!-- Consumers Content -->
      <div v-else class="consumers-content">
        <!-- Statistics -->
        <div
          class="consumers-stats"
          role="group"
          aria-label="Consumers statistics"
        >
          <div class="stat-item">
            <div class="stat-icon total-icon" aria-hidden="true">
              <i class="bi bi-people-fill"></i>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ consumerStats.total }}</div>
              <div class="stat-label">Total Consumers</div>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon hostnames-icon" aria-hidden="true">
              <i class="bi bi-hdd-network-fill"></i>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ consumerStats.uniqueHostnames }}</div>
              <div class="stat-label">Unique Hosts</div>
            </div>
          </div>
          <div v-if="consumerStats.newestConsumer" class="stat-item">
            <div class="stat-icon newest-icon" aria-hidden="true">
              <i class="bi bi-clock-fill"></i>
            </div>
            <div class="stat-content">
              <div class="stat-number">
                {{ formatDateSince(consumerStats.newestConsumer?.createdAt) }}
              </div>
              <div class="stat-label">Newest Consumer</div>
            </div>
          </div>
        </div>

        <!-- Filters -->
        <div class="consumers-filters">
          <div class="filter-group">
            <label class="filter-label" for="consumers-search">Search:</label>
            <input
              id="consumers-search"
              v-model="searchQuery"
              type="text"
              class="form-control filter-input"
              placeholder="Search by ID, hostname, PID, or IP..."
            />
          </div>
          <div class="filter-group">
            <label class="filter-label" for="hostname-select">Hostname:</label>
            <select
              id="hostname-select"
              v-model="selectedHostname"
              class="form-select filter-select"
            >
              <option value="">All Hostnames</option>
              <option
                v-for="hostname in uniqueHostnames"
                :key="hostname"
                :value="hostname"
              >
                {{ hostname }}
              </option>
            </select>
          </div>
          <button
            v-if="selectedHostname || searchQuery"
            class="btn btn-outline-secondary btn-clear-filters"
            @click="clearFilters"
          >
            <i class="bi bi-x-circle me-1" aria-hidden="true"></i>
            Clear
          </button>
        </div>

        <!-- Consumers Header -->
        <div class="consumers-header">
          <h5 class="consumers-count">
            {{ filteredConsumers.length }} Consumer{{
              filteredConsumers.length !== 1 ? 's' : ''
            }}
            <span
              v-if="filteredConsumers.length !== consumers.length"
              class="filtered-count"
            >
              (filtered from {{ consumers.length }})
            </span>
          </h5>
          <div
            class="real-time-indicator"
            :class="{ active: isRealTimeEnabled }"
            role="status"
            aria-live="polite"
          >
            <i class="bi bi-circle-fill indicator-dot" aria-hidden="true"></i>
            <span class="indicator-text">
              {{ isRealTimeEnabled ? 'Live' : 'Paused' }}
            </span>
          </div>
        </div>

        <!-- Consumers List -->
        <div class="consumers-list">
          <div
            v-for="consumer in filteredConsumers"
            :key="consumer.id"
            class="consumer-item"
          >
            <div class="consumer-header">
              <div class="consumer-id">
                <i
                  class="bi bi-person-fill consumer-icon"
                  aria-hidden="true"
                ></i>
                <span class="id-text" :title="consumer.id">{{
                  consumer.id
                }}</span>
              </div>
              <div class="consumer-status">
                <span
                  class="status-badge"
                  :class="getConsumerStatusClass(consumer)"
                  :title="`Consumer status: ${getConsumerStatusText(consumer)}`"
                >
                  {{ getConsumerStatusText(consumer) }}
                </span>
              </div>
            </div>

            <div class="consumer-details">
              <div class="detail-row">
                <div class="detail-item">
                  <i
                    class="bi bi-hdd-network detail-icon"
                    aria-hidden="true"
                  ></i>
                  <span class="detail-label">Hostname:</span>
                  <span
                    class="detail-value hostname"
                    :title="consumer.hostname"
                    >{{ consumer.hostname }}</span
                  >
                </div>
                <div class="detail-item">
                  <i class="bi bi-gear detail-icon" aria-hidden="true"></i>
                  <span class="detail-label">PID:</span>
                  <span
                    class="detail-value pid"
                    :title="String(consumer.pid)"
                    >{{ consumer.pid }}</span
                  >
                </div>
              </div>

              <div class="detail-row">
                <div class="detail-item">
                  <i class="bi bi-clock detail-icon" aria-hidden="true"></i>
                  <span class="detail-label">Uptime:</span>
                  <span class="detail-value uptime">{{
                    formatDateSince(consumer.createdAt)
                  }}</span>
                </div>
                <div class="detail-item">
                  <i class="bi bi-calendar detail-icon" aria-hidden="true"></i>
                  <span class="detail-label">Started:</span>
                  <span class="detail-value created-at">{{
                    formatDate(consumer.createdAt)
                  }}</span>
                </div>
              </div>

              <div class="detail-row">
                <div class="detail-item ip-addresses">
                  <i class="bi bi-router detail-icon" aria-hidden="true"></i>
                  <span class="detail-label">IP Addresses:</span>
                  <div class="ip-list">
                    <span
                      v-for="ip in consumer.ipAddress"
                      :key="ip"
                      class="ip-badge"
                    >
                      {{ ip }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* Mobile-first safety: sizing and overflow guards */
.queue-consumers-card,
.queue-consumers-card * {
  box-sizing: border-box;
  max-width: 100%;
}

.queue-consumers-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #e9ecef;
  overflow: hidden; /* contain inner visuals */
  transition: box-shadow 0.2s ease;
}

.queue-consumers-card:hover {
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
  gap: clamp(10px, 3vw, 16px);
  flex-wrap: wrap; /* allow actions to wrap under title on small screens */
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
  font-size: 1.1rem;
}

.card-subtitle {
  color: #6c757d;
  font-size: 0.875rem;
  margin: 0;
  overflow-wrap: anywhere;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-toggle,
.btn-refresh {
  background: white;
  border: 1px solid #ced4da;
  border-radius: 10px;
  color: #6c757d;
  transition: all 0.2s ease;
  cursor: pointer;
  width: 44px; /* comfortable tap target */
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;
}

.btn-toggle.active {
  background: #198754;
  border-color: #198754;
  color: white;
}

.btn-toggle:hover:not(:disabled),
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

/* Content States */
.content-state {
  text-align: center;
  padding: clamp(16px, 4vw, 28px);
}

.state-content {
  max-width: 560px;
  margin: 0 auto;
  padding: 0 clamp(8px, 2vw, 12px);
}

.state-title {
  color: #495057;
  margin-bottom: 0.5rem;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.state-subtitle {
  color: #6c757d;
  margin: 0;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

/* Error State */
.error-state {
  padding: clamp(16px, 4vw, 28px);
}

.error-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(10px, 2.5vw, 16px);
  margin-bottom: clamp(16px, 3vw, 24px);
  padding: 0 clamp(8px, 2vw, 12px);
}

.error-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.error-text {
  text-align: center;
  min-width: 0;
}

.error-title {
  color: #495057;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.error-message {
  color: #6c757d;
  margin: 0;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

/* Empty State */
.empty-state {
  background: #f8f9fa;
  border-radius: 12px;
  padding: clamp(16px, 4vw, 28px);
}

.empty-icon {
  font-size: clamp(2.5rem, 8vw, 4rem);
  margin-bottom: clamp(12px, 3vw, 24px);
  display: block;
}

.empty-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  text-align: left;
  max-width: 480px;
  margin: 0 auto;
}

.info-item {
  display: flex;
  align-items: center;
  color: #495057;
  font-size: 0.9rem;
}

/* Consumers Content */
.consumers-content {
  padding: 0;
}

/* Statistics */
.consumers-stats {
  display: flex;
  gap: clamp(12px, 3vw, 24px);
  margin-bottom: clamp(16px, 4vw, 32px);
  padding: clamp(12px, 3vw, 24px);
  background: #f8f9fa;
  border-radius: 12px;
  flex-wrap: wrap; /* avoid overflow on smaller widths */
}

.stat-item {
  display: flex;
  align-items: center;
  gap: clamp(10px, 2.5vw, 16px);
  flex: 1 1 220px;
  min-width: 0;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.total-icon {
  background: linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%);
}
.hostnames-icon {
  background: linear-gradient(135deg, #198754 0%, #157347 100%);
}
.newest-icon {
  background: linear-gradient(135deg, #fd7e14 0%, #e55a00 100%);
}

.stat-content {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.stat-number {
  font-size: clamp(1.25rem, 4.2vw, 1.5rem);
  font-weight: 700;
  color: #212529;
  margin-bottom: 0.125rem;
}

.stat-label {
  font-size: 0.85rem;
  color: #6c757d;
  font-weight: 500;
  overflow-wrap: anywhere;
}

/* Filters */
.consumers-filters {
  display: flex;
  align-items: end;
  gap: clamp(10px, 3vw, 16px);
  margin-bottom: clamp(12px, 3vw, 24px);
  padding: clamp(10px, 3vw, 16px);
  background: #f8f9fa;
  border-radius: 8px;
  flex-wrap: wrap; /* prevent overflow on smaller screens */
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1 1 240px;
  min-width: 0;
}

.filter-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #495057;
  margin: 0;
}

.filter-input,
.filter-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 0.875rem;
  min-height: 40px;
}

.btn-clear-filters {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  white-space: nowrap;
}

/* Consumers Header */
.consumers-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: clamp(10px, 2.5vw, 16px);
  margin-bottom: clamp(12px, 3vw, 24px);
  padding-bottom: clamp(10px, 2.5vw, 16px);
  border-bottom: 1px solid #e9ecef;
  flex-wrap: wrap; /* allow Live badge to move below if needed */
}

.consumers-count {
  margin: 0;
  color: #495057;
  font-weight: 600;
  font-size: 1rem;
}

.filtered-count {
  color: #6c757d;
  font-weight: 400;
  font-size: 0.875rem;
}

.real-time-indicator {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  flex-shrink: 0;
}

.real-time-indicator.active {
  background: #d1e7dd;
  border-color: #badbcc;
}

.indicator-dot {
  font-size: 0.5rem;
  color: #6c757d;
}

.real-time-indicator.active .indicator-dot {
  color: #198754;
}

.indicator-text {
  font-size: 0.75rem;
  font-weight: 500;
  color: #6c757d;
}

.real-time-indicator.active .indicator-text {
  color: #198754;
}

/* Consumers List */
.consumers-list {
  display: flex;
  flex-direction: column;
  gap: clamp(10px, 2.5vw, 16px);
}

.consumer-item {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: clamp(12px, 3vw, 20px);
  transition: all 0.2s ease;
  min-width: 0;
}

.consumer-item:hover {
  background: #f1f3f4;
  border-color: #0d6efd;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(13, 110, 253, 0.15);
}

.consumer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: clamp(8px, 2.5vw, 16px);
  margin-bottom: clamp(8px, 2.5vw, 12px);
  flex-wrap: wrap;
}

.consumer-id {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  flex: 1 1 auto;
}

.consumer-icon {
  color: #0d6efd;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.id-text {
  font-size: 1rem;
  font-weight: 600;
  color: #212529;
  font-family: 'Courier New', monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.consumer-status {
  flex-shrink: 0;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-new {
  background: #fff3cd;
  color: #856404;
}
.status-active {
  background: #d1e7dd;
  color: #0f5132;
}
.status-stable {
  background: #cff4fc;
  color: #055160;
}

/* Consumer Details */
.consumer-details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.detail-row {
  display: flex;
  gap: clamp(12px, 3vw, 24px);
  flex-wrap: wrap; /* avoid overflow on small widths */
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1 1 260px;
  min-width: 0;
}

.detail-item.ip-addresses {
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
}

.detail-icon {
  color: #6c757d;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.detail-label {
  font-size: 0.875rem;
  color: #6c757d;
  font-weight: 500;
  flex-shrink: 0;
}

.detail-value {
  font-size: 0.875rem;
  color: #212529;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-value.hostname,
.detail-value.pid {
  font-family: 'Courier New', monospace;
}

.ip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.ip-badge {
  padding: 0.125rem 0.5rem;
  background: #e9ecef;
  border-radius: 4px;
  font-size: 0.75rem;
  font-family: 'Courier New', monospace;
  color: #495057;
}

/* Responsive Design */
@media (max-width: 768px) {
  .card-header {
    padding: clamp(12px, 3.2vw, 20px) clamp(12px, 3.2vw, 20px);
    flex-direction: column;
    align-items: stretch;
  }

  .card-content {
    padding: clamp(12px, 4vw, 20px);
  }

  .consumers-stats {
    flex-direction: column;
    gap: 0.875rem;
  }

  .consumers-filters {
    flex-direction: column;
    align-items: stretch;
  }

  .btn-clear-filters {
    width: 100%;
    justify-content: center;
  }

  .consumers-header {
    flex-direction: column;
    align-items: stretch;
  }

  .consumer-header {
    flex-direction: column;
    align-items: stretch;
  }

  .id-text {
    white-space: normal;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .detail-row {
    flex-direction: column;
    gap: 0.75rem;
  }

  .detail-item {
    justify-content: space-between;
    gap: 0.5rem;
  }

  .detail-value {
    white-space: normal;
    text-align: right;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .detail-item.ip-addresses {
    align-items: stretch;
  }

  .ip-list {
    justify-content: flex-end;
  }

  .content-state {
    padding: clamp(12px, 3.5vw, 16px);
  }
}

@media (max-width: 576px) {
  .consumer-item {
    padding: clamp(10px, 3.5vw, 14px);
  }

  .consumers-stats {
    padding: clamp(10px, 3.2vw, 14px);
  }

  .consumers-filters {
    padding: clamp(10px, 3.2vw, 14px);
  }

  .content-state {
    padding: clamp(10px, 3.2vw, 14px);
  }

  .empty-icon {
    font-size: 3rem;
  }
}

/* Focus states for accessibility */
.btn-toggle:focus,
.btn-refresh:focus,
.btn-clear-filters:focus,
.filter-input:focus,
.filter-select:focus {
  outline: 2px solid #0d6efd;
  outline-offset: 2px;
}
</style>

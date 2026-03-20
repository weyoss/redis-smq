<!--
  - Copyright (c)
  - Weyoss <weyoss@outlook.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useGetApiNamespacesNsQueuesNameStateHistory } from '@/api/generated/queue-operational-state/queue-operational-state.ts';
import { getErrorMessage } from '@/lib/error.ts';
import { useSelectedQueueStore } from '@/stores/selectedQueue.ts';
import { EQueueOperationalState } from '@/types';
import { formatDate, formatDateSince } from '@/lib/format.ts';

const selectedQueueStore = useSelectedQueueStore();

const selectedQueue = computed(() => {
  return selectedQueueStore.selectedQueue;
});

// State for pagination/loading more
const showAll = ref(false);
const limit = ref(3);

// Fetch operational state history
const {
  data: historyData,
  isLoading,
  error,
  refetch,
} = useGetApiNamespacesNsQueuesNameStateHistory(
  computed(() => String(selectedQueue.value?.ns)),
  computed(() => String(selectedQueue.value?.name)),
  {
    query: {
      enabled: () => !!selectedQueue.value,
      refetchOnWindowFocus: false,
      refetchInterval: 30000, // Refresh every 30 seconds
    },
  },
);

// Get the history items
const historyItems = computed(() => historyData.value?.data || []);

// Filter/limit history items based on showAll state
const displayedItems = computed(() => {
  if (showAll.value || !limit.value) {
    return historyItems.value;
  }
  return historyItems.value.slice(0, limit.value);
});

// Check if there are more items to show
const hasMoreItems = computed(
  () => limit.value && historyItems.value.length > limit.value,
);

// Get readable state name from numeric value
const getStateName = (state: number | null | undefined): string => {
  if (state == null) return 'N/A';
  return EQueueOperationalState[state];
};

// Get CSS class for state
const getStateClass = (state: number | null | undefined): string => {
  if (state == null) return '';

  switch (state) {
    case EQueueOperationalState.ACTIVE:
      return 'state-active';
    case EQueueOperationalState.PAUSED:
      return 'state-paused';
    case EQueueOperationalState.STOPPED:
      return 'state-stopped';
    case EQueueOperationalState.LOCKED:
      return 'state-locked';
    default:
      return '';
  }
};

// Get readable reason text
const getReasonText = (reason: string): string => {
  return reason
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
};

// Toggle show all
const toggleShowAll = () => {
  showAll.value = !showAll.value;
};

// Refresh history
const refreshHistory = () => {
  refetch();
};

// Get icon for state transition
const getTransitionIcon = (
  from: number | null | undefined,
  to: number | null | undefined,
): string => {
  if (from == null) return 'bi bi-plus-circle';
  if (to == null) return 'bi bi-dash-circle';

  if (from === to) return 'bi bi-arrow-repeat';

  // Different transitions
  if (
    from === EQueueOperationalState.ACTIVE &&
    to === EQueueOperationalState.PAUSED
  )
    return 'bi bi-pause-circle';
  if (
    from === EQueueOperationalState.ACTIVE &&
    to === EQueueOperationalState.STOPPED
  )
    return 'bi bi-stop-circle';
  if (
    from === EQueueOperationalState.ACTIVE &&
    to === EQueueOperationalState.LOCKED
  )
    return 'bi bi-lock';

  if (
    from === EQueueOperationalState.PAUSED &&
    to === EQueueOperationalState.ACTIVE
  )
    return 'bi bi-play-circle';
  if (
    from === EQueueOperationalState.STOPPED &&
    to === EQueueOperationalState.ACTIVE
  )
    return 'bi bi-play-circle';
  if (
    from === EQueueOperationalState.LOCKED &&
    to === EQueueOperationalState.ACTIVE
  )
    return 'bi bi-unlock';

  return 'bi bi-arrow-left-right';
};
</script>

<template>
  <div class="history-card">
    <!-- Header -->
    <header class="card-header">
      <div class="header-content">
        <h3 class="card-title">
          <i class="bi bi-clock-history title-icon"></i>
          Operational State History
        </h3>
        <p class="card-subtitle">
          Track changes to queue operational state over time
        </p>
      </div>
      <div class="header-actions">
        <button
          class="btn btn-refresh"
          :disabled="isLoading"
          aria-label="Refresh history"
          title="Refresh history"
          @click="refreshHistory"
        >
          <i class="bi bi-arrow-clockwise" :class="{ spinning: isLoading }"></i>
        </button>
      </div>
    </header>

    <!-- Content -->
    <main class="card-content">
      <!-- Loading State -->
      <div
        v-if="isLoading && !historyItems.length"
        class="content-state loading-state"
      >
        <div class="state-content">
          <div
            class="spinner-border text-primary mb-2"
            role="status"
            aria-live="polite"
            aria-label="Loading history"
          ></div>
          <h5 class="state-title">Loading history...</h5>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="content-state error-state" role="alert">
        <div class="error-content">
          <i
            class="bi bi-exclamation-triangle-fill text-danger me-2"
            aria-hidden="true"
          ></i>
          <span>{{
            getErrorMessage(error)?.message || 'Failed to load history'
          }}</span>
        </div>
        <button class="btn btn-sm btn-primary mt-2" @click="refreshHistory">
          <i class="bi bi-arrow-clockwise me-1" aria-hidden="true"></i>
          Retry
        </button>
      </div>

      <!-- Empty State -->
      <div v-else-if="!historyItems.length" class="content-state empty-state">
        <div class="state-content">
          <div class="empty-icon" aria-hidden="true">📋</div>
          <h4 class="state-title">No History Available</h4>
          <p class="state-subtitle">
            No operational state changes have been recorded for this queue
          </p>
        </div>
      </div>

      <!-- History Timeline -->
      <div v-else class="timeline">
        <div
          v-for="(item, index) in displayedItems"
          :key="item.timestamp + index"
          class="timeline-item"
          :class="{ 'first-item': index === 0 }"
        >
          <!-- Timeline connector -->
          <div
            v-if="index < displayedItems.length - 1"
            class="timeline-connector"
          ></div>

          <!-- Timeline node -->
          <div class="timeline-node" :class="getStateClass(item.to)">
            <i :class="getTransitionIcon(item.from, item.to)"></i>
          </div>

          <!-- Timeline content -->
          <div class="timeline-content">
            <div class="content-header">
              <div class="state-change">
                <span class="from-state" :class="getStateClass(item.from)">
                  {{ getStateName(item.from) }}
                </span>
                <i class="bi bi-arrow-right arrow-icon"></i>
                <span class="to-state" :class="getStateClass(item.to)">
                  {{ getStateName(item.to) }}
                </span>
              </div>
              <div class="timestamp" :title="formatDate(item.timestamp)">
                <i class="bi bi-clock me-1"></i>
                {{ formatDateSince(item.timestamp) }} ago
              </div>
            </div>

            <div class="content-details">
              <!-- Reason -->
              <div class="detail-row">
                <span class="detail-label">Reason:</span>
                <span class="detail-value reason-badge">
                  {{ getReasonText(item.reason) }}
                </span>
              </div>

              <!-- Description (if available) -->
              <div v-if="item.description" class="detail-row">
                <span class="detail-label">Description:</span>
                <span class="detail-value description">{{
                  item.description
                }}</span>
              </div>

              <!-- Lock information (if available) -->
              <div v-if="item.lockId" class="detail-row lock-details">
                <span class="detail-label">Lock ID:</span>
                <span class="detail-value lock-id">{{ item.lockId }}</span>
              </div>

              <div v-if="item.lockOwner !== undefined" class="detail-row">
                <span class="detail-label">Lock Owner:</span>
                <span class="detail-value">{{ item.lockOwner }}</span>
              </div>

              <!-- Metadata (if available) -->
              <div
                v-if="item.metadata && Object.keys(item.metadata).length > 0"
                class="metadata-row"
              >
                <details class="metadata-details">
                  <summary class="metadata-summary">
                    <i class="bi bi-info-circle me-1"></i>
                    Metadata
                  </summary>
                  <div class="metadata-content">
                    <div
                      v-for="(value, key) in item.metadata"
                      :key="key"
                      class="metadata-item"
                    >
                      <span class="metadata-key">{{ key }}:</span>
                      <span class="metadata-value">{{
                        JSON.stringify(value)
                      }}</span>
                    </div>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>

        <!-- Show more/less button -->
        <div v-if="hasMoreItems" class="show-more-container">
          <button class="show-more-btn" @click="toggleShowAll">
            <i
              class="bi"
              :class="showAll ? 'bi-chevron-up' : 'bi-chevron-down'"
            ></i>
            {{
              showAll
                ? 'Show Less'
                : `Show ${historyItems.length - (limit || 0)} More`
            }}
          </button>
        </div>
      </div>

      <!-- Last updated info -->
      <div v-if="historyItems.length > 0" class="last-updated">
        <i class="bi bi-check-circle-fill text-success me-1"></i>
        <span>Last updated: {{ new Date().toLocaleTimeString() }}</span>
      </div>
    </main>
  </div>
</template>

<style scoped>
.history-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #e9ecef;
  overflow: hidden;
  transition: box-shadow 0.2s ease;
  height: fit-content;
}

.history-card:hover {
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
  color: #6f42c1;
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
  background: #6f42c1;
  border-color: #6f42c1;
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
  padding: clamp(24px, 5vw, 48px) clamp(12px, 3vw, 24px);
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

.empty-icon {
  font-size: clamp(2rem, 7vw, 2.5rem);
  margin-bottom: 1rem;
  display: block;
}

.error-content {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #dc3545;
  font-size: clamp(0.8rem, 2.5vw, 0.9rem);
  margin-bottom: 0.5rem;
  gap: 0.5rem;
}

/* Timeline */
.timeline {
  position: relative;
  margin: 0;
  padding: 0;
}

.timeline-item {
  position: relative;
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-left: 1rem;
}

.timeline-item.first-item {
  margin-top: 0;
}

.timeline-item:last-child {
  margin-bottom: 0;
}

.timeline-connector {
  position: absolute;
  left: 2rem;
  top: 2.5rem;
  bottom: -1.5rem;
  width: 2px;
  background: #e5e7eb;
  content: '';
}

.timeline-node {
  position: relative;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  color: white;
  flex-shrink: 0;
  z-index: 1;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.timeline-node.state-active {
  background: #28a745;
}
.timeline-node.state-paused {
  background: #ffc107;
}
.timeline-node.state-stopped {
  background: #dc3545;
}
.timeline-node.state-locked {
  background: #6f42c1;
}

.timeline-content {
  flex: 1;
  background: #f8f9fa;
  border-radius: 10px;
  padding: 1rem;
  border: 1px solid #e9ecef;
  transition: all 0.2s ease;
}

.timeline-content:hover {
  background: #e9ecef;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.state-change {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 0.95rem;
}

.from-state,
.to-state {
  padding: 0.25rem 0.75rem;
  border-radius: 16px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.from-state.state-active,
.to-state.state-active {
  background: #d4edda;
  color: #155724;
}
.from-state.state-paused,
.to-state.state-paused {
  background: #fff3cd;
  color: #856404;
}
.from-state.state-stopped,
.to-state.state-stopped {
  background: #f8d7da;
  color: #721c24;
}
.from-state.state-locked,
.to-state.state-locked {
  background: #e2d9f3;
  color: #6f42c1;
}

.arrow-icon {
  color: #6c757d;
  font-size: 0.8rem;
}

.timestamp {
  font-size: 0.8rem;
  color: #6c757d;
  white-space: nowrap;
  display: flex;
  align-items: center;
}

.content-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-row {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.detail-label {
  font-weight: 600;
  color: #6b7280;
  min-width: 80px;
  flex-shrink: 0;
}

.detail-value {
  color: #1f2937;
  word-break: break-word;
  flex: 1;
}

.reason-badge {
  background: #f3f4f6;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  display: inline-block;
}

.description {
  font-style: italic;
  background: #f9fafb;
  padding: 0.5rem;
  border-radius: 6px;
  border-left: 3px solid #6c757d;
}

.lock-details {
  background: #fef2e0;
  padding: 0.5rem;
  border-radius: 6px;
}

.lock-id {
  font-family: monospace;
  background: #f3f4f6;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
}

/* Metadata section */
.metadata-row {
  margin-top: 0.5rem;
}

.metadata-details {
  background: #f3f4f6;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.metadata-summary {
  padding: 0.5rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #4b5563;
  cursor: pointer;
  list-style: none;
  display: flex;
  align-items: center;
}

.metadata-summary::-webkit-details-marker {
  display: none;
}

.metadata-summary:hover {
  background: #e5e7eb;
}

.metadata-content {
  padding: 0.5rem;
  border-top: 1px solid #e5e7eb;
  background: white;
}

.metadata-item {
  display: flex;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.85rem;
  border-bottom: 1px solid #e5e7eb;
}

.metadata-item:last-child {
  border-bottom: none;
}

.metadata-key {
  font-weight: 600;
  color: #4b5563;
  min-width: 100px;
}

.metadata-value {
  color: #6b7280;
  word-break: break-word;
  flex: 1;
}

/* Show more button */
.show-more-container {
  display: flex;
  justify-content: center;
  margin-top: 1.5rem;
}

.show-more-btn {
  background: none;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  padding: 0.5rem 1.25rem;
  font-size: 0.9rem;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
}

.show-more-btn:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
  color: #374151;
}

/* Last updated */
.last-updated {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
  font-size: 0.8rem;
  color: #6c757d;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

/* Responsive */
@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .content-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .timestamp {
    white-space: normal;
  }

  .detail-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }

  .detail-label {
    min-width: auto;
  }
}

@media (max-width: 576px) {
  .timeline-item {
    flex-direction: column;
    padding-left: 0;
  }

  .timeline-connector {
    display: none;
  }

  .timeline-node {
    margin-left: 0;
  }

  .content-details {
    gap: 0.75rem;
  }

  .metadata-item {
    flex-direction: column;
    gap: 0.25rem;
  }

  .metadata-key {
    min-width: auto;
  }
}

/* Focus states */
.btn-refresh:focus-visible,
.show-more-btn:focus-visible {
  outline: 2px solid #6f42c1;
  outline-offset: 2px;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .history-card,
  .btn-refresh,
  .timeline-content,
  .show-more-btn,
  .spinning {
    animation: none;
    transition: none;
  }

  .timeline-content:hover {
    transform: none;
  }
}
</style>

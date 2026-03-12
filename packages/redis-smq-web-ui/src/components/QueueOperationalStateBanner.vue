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
import { EQueueOperationalState } from '@/types';
import type { GetApiV1NamespacesNsQueuesNameOperationalState200Data } from '@/api/model';

const props = defineProps<{
  queue: {
    ns: string;
    name: string;
  };
  status?: EQueueOperationalState;
  operationalState?: GetApiV1NamespacesNsQueuesNameOperationalState200Data;
  isLoading?: boolean;
  error: string | null;
}>();

defineEmits<{
  (e: 'onResume'): void;
  (e: 'onRefresh'): void;
}>();

// Format timestamp to readable date
const formattedTimestamp = computed(() => {
  if (!props.operationalState?.timestamp) return 'N/A';
  return new Date(props.operationalState.timestamp).toLocaleString();
});

// Get readable state name from numeric value
const getStateName = (
  state: EQueueOperationalState | null | undefined,
): string => {
  if (state == null) return 'N/A';

  switch (state) {
    case EQueueOperationalState.ACTIVE:
      return 'ACTIVE';
    case EQueueOperationalState.PAUSED:
      return 'PAUSED';
    case EQueueOperationalState.STOPPED:
      return 'STOPPED';
    case EQueueOperationalState.LOCKED:
      return 'LOCKED';
    default:
      return `UNKNOWN (${state})`;
  }
};

// Get readable reason text
const getReasonText = (reason: string): string => {
  return reason
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
};

// Banner configuration based on status
const bannerConfig = computed(() => {
  switch (props.status) {
    case EQueueOperationalState.PAUSED:
      return {
        icon: 'bi bi-pause-circle-fill',
        title: 'Queue is Paused',
        description:
          'This queue is currently paused. Messages are being queued but not delivered to consumers.',
        actionLabel: 'Resume Queue',
        actionIcon: 'bi bi-play-fill',
        variant: 'warning',
        showResumeButton: true,
      };

    case EQueueOperationalState.STOPPED:
      return {
        icon: 'bi bi-stop-circle-fill',
        title: 'Queue is Stopped',
        description:
          'This queue is completely stopped. No messages can be produced or consumed.',
        actionLabel: 'Resume Queue',
        actionIcon: 'bi bi-play-fill',
        variant: 'danger',
        showResumeButton: true,
      };

    case EQueueOperationalState.LOCKED:
      return {
        icon: 'bi bi-lock-fill',
        title: 'Queue is Locked',
        description:
          'This queue is currently locked. Operations are temporarily restricted.',
        actionLabel: 'Resume Queue',
        actionIcon: 'bi bi-play-fill',
        variant: 'secondary',
        showResumeButton: false, // Locked queues might need special handling
      };

    default:
      return {
        icon: 'bi bi-question-circle-fill',
        title: 'Unknown Queue State',
        description: 'This queue is in an unknown state.',
        actionLabel: 'Resume Queue',
        actionIcon: 'bi bi-play-fill',
        variant: 'secondary',
        showResumeButton: true,
      };
  }
});

// Check if we should show the resume button
const showResumeButton = computed(() => bannerConfig.value.showResumeButton);

// Additional information for locked state
const lockInfo = computed(() => {
  if (props.status !== EQueueOperationalState.LOCKED) return null;

  return {
    lockId: props.operationalState?.lockId,
    lockOwner: props.operationalState?.lockOwner,
    description:
      'The queue is locked and cannot be modified until the lock is released.',
  };
});
</script>

<template>
  <div
    class="state-banner"
    :class="`state-banner-${bannerConfig.variant}`"
    role="alert"
  >
    <div class="banner-content">
      <!-- Header with Icon and Title -->
      <div class="banner-header">
        <div class="banner-icon" :class="`banner-icon-${bannerConfig.variant}`">
          <i :class="bannerConfig.icon"></i>
        </div>
        <div class="banner-title-section">
          <h3 class="banner-title">{{ bannerConfig.title }}</h3>
          <p class="banner-description">{{ bannerConfig.description }}</p>

          <!-- Lock-specific warning for LOCKED state -->
          <div
            v-if="status === EQueueOperationalState.LOCKED"
            class="lock-warning"
          >
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            <span>{{ lockInfo?.description }}</span>
          </div>
        </div>
        <div class="banner-actions">
          <button
            class="action-button action-button-secondary"
            :disabled="isLoading"
            @click="$emit('onRefresh')"
          >
            <i class="bi bi-arrow-repeat" :class="{ spinning: isLoading }"></i>
            &nbsp; Refresh
          </button>
          <button
            v-if="showResumeButton"
            class="action-button action-button-secondary"
            @click="$emit('onResume')"
          >
            <i :class="bannerConfig.actionIcon" class="me-2"></i>
            {{ bannerConfig.actionLabel }}
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">
        <div class="spinner-border spinner-border-sm me-2" role="status"></div>
        <span>Loading operational state details...</span>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        <span>Failed to load operational state details: {{ error }}</span>
      </div>

      <!-- Operational State Details -->
      <div v-else-if="operationalState" class="details-section">
        <h4 class="details-title">Operational State Change Details</h4>

        <div class="details-grid">
          <div class="detail-item">
            <span class="detail-label">From State:</span>
            <span class="detail-value">{{
              getStateName(operationalState.from)
            }}</span>
          </div>

          <div class="detail-item">
            <span class="detail-label">To State:</span>
            <span
              class="detail-value"
              :class="{
                'text-warning':
                  operationalState.to === EQueueOperationalState.PAUSED,
                'text-danger':
                  operationalState.to === EQueueOperationalState.STOPPED,
                'text-secondary':
                  operationalState.to === EQueueOperationalState.LOCKED,
              }"
            >
              {{ getStateName(operationalState.to) }}
            </span>
          </div>

          <div class="detail-item">
            <span class="detail-label">Reason:</span>
            <span class="detail-value">{{
              getReasonText(operationalState.reason)
            }}</span>
          </div>

          <div class="detail-item">
            <span class="detail-label">Timestamp:</span>
            <span class="detail-value">{{ formattedTimestamp }}</span>
          </div>

          <div
            v-if="operationalState.description"
            class="detail-item full-width"
          >
            <span class="detail-label">Description:</span>
            <span class="detail-value">{{ operationalState.description }}</span>
          </div>

          <!-- Lock-specific information -->
          <div v-if="operationalState.lockId" class="detail-item">
            <span class="detail-label">Lock ID:</span>
            <span class="detail-value lock-id">{{
              operationalState.lockId
            }}</span>
          </div>

          <div v-if="operationalState.lockOwner" class="detail-item">
            <span class="detail-label">Lock Owner:</span>
            <span class="detail-value">{{ operationalState.lockOwner }}</span>
          </div>

          <!-- Lock duration if available -->
          <div
            v-if="operationalState.lockId && operationalState.timestamp"
            class="detail-item"
          >
            <span class="detail-label">Lock Duration:</span>
            <span class="detail-value">
              {{ Math.round((Date.now() - operationalState.timestamp) / 1000) }}
              seconds
            </span>
          </div>
        </div>

        <!-- Metadata Section -->
        <div
          v-if="
            operationalState.metadata &&
            Object.keys(operationalState.metadata).length > 0
          "
          class="metadata-section"
        >
          <h5 class="metadata-title">Metadata</h5>
          <div class="metadata-grid">
            <div
              v-for="(value, key) in operationalState.metadata"
              :key="key"
              class="metadata-item"
            >
              <span class="metadata-key">{{ key }}:</span>
              <span class="metadata-value">{{ JSON.stringify(value) }}</span>
            </div>
          </div>
        </div>

        <!-- Lock-specific actions -->
        <div
          v-if="status === EQueueOperationalState.LOCKED"
          class="lock-actions"
        >
          <p class="lock-help-text">
            <i class="bi bi-info-circle-fill me-2"></i>
            If the lock persists, you may need to:
          </p>
          <ul class="lock-help-list">
            <li>Wait for the lock to expire automatically</li>
            <li>Contact the lock owner to release it</li>
            <li>Check for stuck operations or system issues</li>
            <li>Use the force unlock operation (if available)</li>
          </ul>
        </div>
      </div>

      <!-- No Data State -->
      <div v-else class="no-data-state">
        <i class="bi bi-info-circle-fill me-2"></i>
        <span>No operational state details available</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.state-banner {
  margin-bottom: 1.5rem;
  border-radius: 12px;
  overflow: hidden;
  animation: slideDown 0.3s ease;
}

.state-banner-warning {
  background: #fffbeb;
  border: 1px solid #fde68a;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.1);
}

.state-banner-danger {
  background: #fef2f2;
  border: 1px solid #fecaca;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.1);
}

.state-banner-secondary {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.banner-content {
  padding: 1.5rem;
}

/* Header Section */
.banner-header {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.banner-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.banner-icon-warning {
  background: #fef3c7;
  color: #d97706;
}

.banner-icon-danger {
  background: #fee2e2;
  color: #dc2626;
}

.banner-icon-secondary {
  background: #f3f4f6;
  color: #6b7280;
}

.banner-title-section {
  flex: 1;
  min-width: 200px;
}

.banner-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 0.25rem 0;
  color: #1f2937;
}

.banner-description {
  font-size: 0.95rem;
  color: #4b5563;
  margin: 0;
  line-height: 1.5;
}

/* Lock warning */
.lock-warning {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: #f3f4f6;
  border-radius: 6px;
  font-size: 0.9rem;
  color: #6b7280;
  display: flex;
  align-items: center;
}

.lock-warning i {
  color: #6b7280;
}

/* Banner Actions */
.banner-actions {
  display: flex;
  gap: 0.75rem;
  flex-shrink: 0;
}

.action-button {
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  transition: all 0.2s ease;
}

.action-button-warning {
  background: #d97706;
  color: white;
}

.action-button-warning:hover:not(:disabled) {
  background: #b45309;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(217, 119, 6, 0.2);
}

.action-button-danger {
  background: #dc2626;
  color: white;
}

.action-button-danger:hover:not(:disabled) {
  background: #b91c1c;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(220, 38, 38, 0.2);
}

.action-button-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #e5e7eb;
}

.action-button-secondary:hover:not(:disabled) {
  background: #e5e7eb;
  transform: translateY(-1px);
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-button:active {
  transform: translateY(0);
}

/* Loading State */
.loading-state,
.error-state,
.no-data-state {
  display: flex;
  align-items: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  color: #6b7280;
}

.error-state {
  color: #dc2626;
  background: #fee2e2;
}

/* Details Section */
.details-section {
  background: rgba(255, 255, 255, 0.7);
  border-radius: 10px;
  padding: 1.25rem;
}

.details-title {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 1rem 0;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-item.full-width {
  grid-column: 1 / -1;
}

.detail-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.detail-value {
  font-size: 0.95rem;
  color: #1f2937;
  word-break: break-word;
}

.text-warning {
  color: #d97706;
  font-weight: 600;
}

.text-danger {
  color: #dc2626;
  font-weight: 600;
}

.text-secondary {
  color: #6b7280;
  font-weight: 600;
}

.lock-id {
  font-family: monospace;
  background: #f3f4f6;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
}

/* Metadata Section */
.metadata-section {
  margin-top: 1.25rem;
  padding-top: 1.25rem;
  border-top: 1px solid #e5e7eb;
}

.metadata-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.75rem 0;
}

.metadata-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 0.75rem;
}

.metadata-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.5rem;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.metadata-key {
  font-weight: 600;
  color: #4b5563;
  font-size: 0.85rem;
}

.metadata-value {
  color: #6b7280;
  font-size: 0.85rem;
  word-break: break-word;
  flex: 1;
}

/* Lock actions */
.lock-actions {
  margin-top: 1.25rem;
  padding: 1rem;
  background: #f3f4f6;
  border-radius: 8px;
}

.lock-help-text {
  font-size: 0.9rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
}

.lock-help-list {
  margin: 0;
  padding-left: 1.5rem;
  color: #6b7280;
  font-size: 0.85rem;
  line-height: 1.6;
}

.lock-help-list li {
  margin-bottom: 0.25rem;
}

/* Spinning animation for refresh icon */
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

/* Main animation */
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .banner-header {
    flex-direction: column;
  }

  .banner-actions {
    width: 100%;
    flex-direction: column;
  }

  .action-button {
    width: 100%;
    justify-content: center;
  }

  .details-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 576px) {
  .banner-content {
    padding: 1rem;
  }

  .banner-title {
    font-size: 1.1rem;
  }

  .lock-actions {
    padding: 0.75rem;
  }

  .lock-help-list {
    padding-left: 1.25rem;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .state-banner,
  .action-button,
  .spinning {
    animation: none;
    transition: none;
  }

  .action-button:hover {
    transform: none;
  }
}
</style>

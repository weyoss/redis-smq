<!--
  - Copyright (c)
  - Weyoss <weyoss@outlook.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { useQueueConsumerGroups } from '@/composables/useQueueConsumerGroups.ts';
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useSelectedQueueStore } from '@/stores/selectedQueue.ts';

interface Props {
  showSectionHeader?: boolean;
}

withDefaults(defineProps<Props>(), {
  showSectionHeader: true,
});

const selectedQueueStore = useSelectedQueueStore();
const queueConsumerGroups = useQueueConsumerGroups();
const router = useRouter();

// Computed properties
const selectedQueue = computed(() => selectedQueueStore.selectedQueue);
const consumerGroups = computed(
  () => queueConsumerGroups.sortedConsumerGroups.value,
);
const hasConsumerGroups = computed(
  () => queueConsumerGroups.hasConsumerGroups.value,
);
const isLoading = computed(() => queueConsumerGroups.isLoading.value);

const groupCountText = computed(() => {
  const count = consumerGroups.value.length;
  return `${count} group${count !== 1 ? 's' : ''} found`;
});

const queueDisplayName = computed(() => {
  if (!selectedQueue.value) return '';
  return `${selectedQueue.value.ns}/${selectedQueue.value.name}`;
});

// Event handlers
function handleConsumerGroupSelect(consumerGroupId: string) {
  if (!selectedQueue.value) return;

  router.push({
    name: 'Pending Messages',
    params: {
      ns: selectedQueue.value.ns,
      queue: selectedQueue.value.name,
    },
    query: { consumerGroupId },
  });
}

function handleRefresh() {
  if (selectedQueue.value) {
    queueConsumerGroups.consumerGroupsQuery.refetch();
  }
}
</script>

<template>
  <div class="consumer-group-selector">
    <!-- Section Header -->
    <header v-if="showSectionHeader" class="section-header">
      <h2 class="section-title">Consumer Groups</h2>
      <div v-if="hasConsumerGroups && !isLoading" class="section-meta">
        {{ groupCountText }}
      </div>
    </header>

    <!-- Loading State -->
    <div v-if="isLoading" class="state-container loading-state">
      <div class="state-content">
        <div class="loading-spinner">
          <i class="bi bi-arrow-clockwise"></i>
        </div>
        <p class="state-text">Loading consumer groups...</p>
      </div>
    </div>

    <!-- Consumer Groups Grid -->
    <div v-else-if="hasConsumerGroups" class="consumer-groups-grid">
      <article
        v-for="consumerGroup in consumerGroups"
        :key="consumerGroup"
        class="consumer-group-card"
        role="button"
        tabindex="0"
        :aria-label="`View pending messages for consumer group ${consumerGroup}`"
        @click="handleConsumerGroupSelect(consumerGroup)"
        @keydown.enter="handleConsumerGroupSelect(consumerGroup)"
        @keydown.space.prevent="handleConsumerGroupSelect(consumerGroup)"
      >
        <div class="card-header">
          <div class="group-icon">
            <i class="bi bi-people-fill"></i>
          </div>
          <div class="group-info">
            <h3 class="group-name">{{ consumerGroup }}</h3>
            <span class="group-type">Consumer Group</span>
          </div>
        </div>

        <div class="card-footer">
          <span class="action-hint">
            <i class="bi bi-eye"></i>
            View pending messages
          </span>
          <i class="bi bi-arrow-right action-arrow"></i>
        </div>
      </article>
    </div>

    <!-- Empty State -->
    <div v-else class="state-container empty-state">
      <div class="state-content">
        <div class="state-icon">
          <i class="bi bi-people"></i>
        </div>
        <h3 class="state-title">No Consumer Groups Found</h3>
        <p class="state-description">
          <template v-if="selectedQueue">
            The queue <strong>{{ queueDisplayName }}</strong> doesn't have any
            consumer groups yet. Consumer groups are created automatically when
            consumers start subscribing to this pub/sub queue.
          </template>
          <template v-else>
            Select a pub/sub queue to view its consumer groups.
          </template>
        </p>

        <div v-if="selectedQueue" class="state-actions">
          <button
            type="button"
            class="btn btn-secondary"
            @click="handleRefresh"
          >
            <i class="bi bi-arrow-clockwise"></i>
            Refresh
          </button>
        </div>

        <details class="help-section">
          <summary class="help-summary">
            <i class="bi bi-question-circle"></i>
            What are consumer groups?
          </summary>
          <div class="help-content">
            <p>
              Consumer groups allow multiple consumers to work together to
              process messages from a pub/sub queue. Each message is delivered
              to only one consumer within the group, enabling load balancing and
              parallel processing.
            </p>
            <ul>
              <li>
                Consumer groups are created automatically when consumers connect
              </li>
              <li>
                Each group maintains its own message offset and processing state
              </li>
              <li>Groups enable horizontal scaling of message processing</li>
            </ul>
          </div>
        </details>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Base Layout */
.consumer-group-selector {
  container-type: inline-size;
}

/* Section Header */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.section-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a1a1a;
}

.section-meta {
  color: #6c757d;
  font-size: 0.875rem;
  font-weight: 500;
}

/* State Containers (Loading & Empty) */
.state-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.state-content {
  max-width: 600px;
}

.state-icon,
.loading-spinner {
  width: 80px;
  height: 80px;
  background: #f8f9fa;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: #6c757d;
  margin: 0 auto 2rem;
}

.loading-spinner {
  color: #0d6efd;
}

.loading-spinner i {
  animation: spin 1s linear infinite;
}

.state-title {
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a1a1a;
}

.state-text,
.state-description {
  margin: 0 0 2rem 0;
  color: #6c757d;
  font-size: 1rem;
  line-height: 1.6;
}

.state-actions {
  margin-bottom: 2rem;
}

/* Consumer Groups Grid */
.consumer-groups-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.consumer-group-card {
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
}

.consumer-group-card:hover,
.consumer-group-card:focus-visible {
  border-color: #0d6efd;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(13, 110, 253, 0.15);
}

.consumer-group-card:focus-visible {
  outline: 2px solid #0d6efd;
  outline-offset: 2px;
}

.card-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.group-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #0d6efd 0%, #6610f2 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: white;
  flex-shrink: 0;
}

.group-info {
  flex: 1;
  min-width: 0;
}

.group-name {
  margin: 0 0 0.5rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1a1a1a;
  word-break: break-word;
  line-height: 1.3;
}

.group-type {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: #e7f3ff;
  color: #0d6efd;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid #f1f3f4;
}

.action-hint {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6c757d;
  font-weight: 500;
  opacity: 0;
  transform: translateX(-8px);
  transition: all 0.2s ease;
}

.action-arrow {
  color: #6c757d;
  opacity: 0;
  transform: translateX(-8px);
  transition: all 0.2s ease;
}

.consumer-group-card:hover .action-hint,
.consumer-group-card:focus-visible .action-hint,
.consumer-group-card:hover .action-arrow,
.consumer-group-card:focus-visible .action-arrow {
  opacity: 1;
  transform: translateX(0);
}

/* Button Styles */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  background: white;
  color: #495057;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn:hover {
  background: #f8f9fa;
  border-color: #adb5bd;
}

.btn:focus-visible {
  outline: 2px solid #0d6efd;
  outline-offset: 2px;
}

/* Help Section */
.help-section {
  width: 100%;
  max-width: 500px;
  margin-top: 1rem;
  text-align: left;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  overflow: hidden;
}

.help-summary {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #f8f9fa;
  color: #495057;
  font-weight: 500;
  cursor: pointer;
  list-style: none;
  transition: background-color 0.2s ease;
}

.help-summary:hover {
  background: #e9ecef;
}

.help-summary::-webkit-details-marker {
  display: none;
}

.help-content {
  padding: 1rem;
  background: white;
}

.help-content p {
  margin: 0 0 1rem 0;
  color: #6c757d;
  line-height: 1.6;
}

.help-content ul {
  margin: 0;
  padding-left: 1.5rem;
  color: #6c757d;
}

.help-content li {
  margin-bottom: 0.5rem;
  line-height: 1.5;
}

/* Animations */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Responsive Design */
@container (max-width: 1200px) {
  .consumer-groups-grid {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  }
}

@container (max-width: 768px) {
  .consumer-groups-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .consumer-group-card {
    padding: 1.25rem;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .state-container {
    padding: 3rem 1rem;
  }

  .state-icon,
  .loading-spinner {
    width: 64px;
    height: 64px;
    font-size: 1.5rem;
  }
}

@container (max-width: 480px) {
  .card-header {
    gap: 0.75rem;
  }

  .group-icon {
    width: 40px;
    height: 40px;
    font-size: 1rem;
  }

  .group-name {
    font-size: 1rem;
  }
}

/* Accessibility & Preferences */
@media (prefers-reduced-motion: reduce) {
  .consumer-group-card:hover,
  .consumer-group-card:focus-visible {
    transform: none;
  }

  .action-hint,
  .action-arrow {
    transition: none;
  }

  .loading-spinner i {
    animation: none;
  }
}
</style>
